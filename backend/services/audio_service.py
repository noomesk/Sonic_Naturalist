import uuid
import aiofiles
import json
from pathlib import Path
from fastapi import UploadFile
import librosa
import numpy as np

from core.config import settings

async def save_upload_file(upload_file: UploadFile, metadata: dict = None) -> str:
    """Guarda el archivo de audio y sus metadatos de forma asíncrona."""
    audio_id = str(uuid.uuid4())
    extension = Path(upload_file.filename).suffix
    file_path = settings.STORAGE_DIR / f"{audio_id}{extension}"
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await upload_file.read(1024 * 1024):
            await out_file.write(content)
            
    if metadata:
        meta_path = settings.STORAGE_DIR / f"{audio_id}_metadata.json"
        async with aiofiles.open(meta_path, 'w', encoding='utf-8') as meta_file:
            await meta_file.write(json.dumps(metadata, ensure_ascii=False))
            
    return audio_id

async def generate_spectrogram_data(audio_id: str):
    """
    Busca el archivo de audio, calcula su Espectrograma Mel y devuelve 
    los datos optimizados para Plotly.js
    """
    files = list(settings.STORAGE_DIR.glob(f"{audio_id}.*"))
    if not files:
        raise FileNotFoundError("Audio document not found in storage")
        
    audio_path = files[0]
    
    # 1. Cargar audio y validar corrupción/silencio
    try:
        # Procesamos la duración completa para HD Base64
        y, sr = librosa.load(audio_path, duration=None, sr=22050)
        if np.all(y == 0):
            raise ValueError("Audio contains only silence")
    except Exception as e:
        print(f"Error procesando el audio {audio_id}: {e}")
        raise ValueError(f"El audio está corrupto o contiene solo silencio: {e}")
    
    # 2. Computar Espectrograma Mel
    # fmax=8000 es ideal para ranas, concentra el análisis visual donde cantan
    melspec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, hop_length=512, fmax=8000)
    melspec_db = librosa.power_to_db(melspec, ref=np.max)
    
    # 3. Generar Ejes X (Tiempo) e Y (Frecuencia en Hz)
    times = librosa.times_like(melspec_db, sr=sr, hop_length=512)
    freqs = librosa.mel_frequencies(n_mels=128, fmin=0.0, fmax=8000)
    
    # 4. Downsampling (Para no congelar el navegador)
    max_frames = 2500  # 2500 píxeles de ancho garantizan buena resolución de 4 minutos en PNG
    if melspec_db.shape[1] > max_frames:
        indices = np.linspace(0, melspec_db.shape[1] - 1, max_frames).astype(int)
        melspec_db = melspec_db[:, indices]
        
    # 5. Rasterización Lado-Servidor a PNG transparente (Base64)
    # 5.1 Normalizar dB a rango [0, 1]
    min_db = np.min(melspec_db)
    max_db = np.max(melspec_db)
    if max_db > min_db:
        norm_spec = (melspec_db - min_db) / (max_db - min_db)
    else:
        norm_spec = np.zeros_like(melspec_db)

    # 5.2 Estilizar como Jet Colormap y empaquetar en PIL
    rgb_img = np.zeros((norm_spec.shape[0], norm_spec.shape[1], 3), dtype=np.uint8)
    rgb_img[..., 0] = np.clip(1.5 - np.abs(4.0 * norm_spec - 3.0), 0, 1) * 255
    rgb_img[..., 1] = np.clip(1.5 - np.abs(4.0 * norm_spec - 2.0), 0, 1) * 255
    rgb_img[..., 2] = np.clip(1.5 - np.abs(4.0 * norm_spec - 1.0), 0, 1) * 255
    
    # Invertir verticalmente para coordinar con espectroscopía estándar (origen abajo)
    rgb_img = rgb_img[::-1, :, :]

    from PIL import Image
    import io
    import base64

    img = Image.fromarray(rgb_img, 'RGB')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

    duration = librosa.get_duration(y=y, sr=sr)
        
    # 6. Datos súper ligeros para Tooltip (Hover) Invisible
    hover_frames = min(melspec_db.shape[1], 1000)
    hover_indices = np.linspace(0, melspec_db.shape[1] - 1, hover_frames).astype(int)
    hover_z = melspec_db[:, hover_indices].tolist()
    hover_x = times[hover_indices].tolist()
    hover_y = freqs.tolist()

    return {
        "image": img_b64,
        "duration": duration,
        "hover_x": hover_x,
        "hover_y": hover_y,
        "hover_z": hover_z
    }

async def generate_ai_interpretation(audio_id: str, detections: list):
    """
    Analista Biométrica Virtual: Mapea eventos a una línea de tiempo narrada usando Gemini.
    """
    from google import genai
    files = list(settings.STORAGE_DIR.glob(f"{audio_id}.*"))
    if not files:
        raise FileNotFoundError("Audio document not found in storage")
        
    audio_path = files[0]
    
    # Leer metadatos si existen
    meta_path = audio_path.parent / f"{audio_id}_metadata.json"
    metadata_text = ""
    if meta_path.exists():
        try:
            import json
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
            metadata_text = f"Contexto de la grabación: Región '{meta.get('location', 'Desconocida')}', Altitud {meta.get('altitude', 'N/A')} msnm, Hábitat '{meta.get('habitat', 'Desconocido')}'. "
        except:
            pass

    # Obtener duración aproximada
    try:
        y, sr = librosa.load(audio_path, sr=22050)
        duration = librosa.get_duration(y=y, sr=sr)
    except Exception as e:
        duration = 60 # defaults
        
    transcript = []
    
    # Intentamos instanciar el cliente de Gemini
    client = None
    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            print(f"Error inicializando Gemini: {e}")
            
    async def get_gemini_narrative(prompt: str, fallback_text: str) -> str:
        if not client:
            return fallback_text
        try:
            # Usar API asíncrona para no bloquear el backend
            sys_prompt = f"Eres un biólogo experto y profesor enseñando a interpretar espectrogramas bioacústicos. REGLA OBLIGATORIA: Tu respuesta SIEMPRE debe constar de dos partes (máximo 3 oraciones en total): PRIMERO explica qué formas/colores visuales se ven en la gráfica (ej. 'Observamos densas estrías verticales rojas, lo cual indica alta intensidad de energía rápida...'), y SEGUNDO da la interpretación taxonómica/ecológica. {metadata_text}"
            response = await client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"{sys_prompt}\n\nInstrucción actual: {prompt}"
            )
            return response.text.replace('\n', ' ').strip()
        except Exception as e:
            print(f"Error con Gemini: {e}")
            return fallback_text
    
    # Algoritmo de "Experto Virtual"
    if not detections:
        text = await get_gemini_narrative(
            "El espectrograma no muestra cantos de animales. Solo hay ruido basal o estridulación en bajas frecuencias. Explica esto visualmente (colores amarillos/verdes bajos) y biológicamente.",
            "Visualmente, el espectrograma carece de firmas rojas de alta intensidad, mostrando únicamente franjas amarillas y verdes en las frecuencias bajas. Esto indica un ecosistema dominado por ruido basal o estridulación constante, sin cantos focales presentes."
        )
        transcript.append({
            "start": 0, 
            "end": duration, 
            "text": text
        })
    else:
        # Ordenamos las detecciones cronológicamente
        sorted_dets = sorted(detections, key=lambda x: x["startTime"])
        
        last_end = 0
        for i, det in enumerate(sorted_dets):
            start = det["startTime"]
            end = det["endTime"]
            
            if start - last_end > 1.5:
                text = await get_gemini_narrative(
                    "El espectrograma denota un periodo de latencia. Las altas intensidades desaparecen. Explica visualmente qué significa que no haya colores rojos.",
                    "El gráfico muestra una atenuación de los colores cálidos, dejando un fondo azul oscuro o verde tenue. Esto se traduce biológicamente en un silencio focal donde el ruido ambiental envuelve a la matriz."
                )
                transcript.append({
                    "start": last_end,
                    "end": start,
                    "text": text
                })
            
            # Nota científica basada en la detección
            confidence = det.get("confidence", 0.95)
            candidates = det.get("candidates", ["Especie desconocida"])
            peak_freq = det.get("peak_freq", 0)
            
            cands_str = ", ".join(candidates)
            
            prompt = f"El sistema detectó un pulso. La frecuencia dominante (fundamental) del audio fue medida exactamente en {peak_freq:.0f} Hz. Al cruzar esta frecuencia y los datos de iNaturalist para la región ingresada, los 3 candidatos más probables son: {cands_str} (Confianza: {confidence*100:.1f}%). Explica qué se ve en la gráfica en la banda de los {peak_freq:.0f} Hz (colores/estrías) y menciona que estas 3 especies son las sospechosas principales."
            fallback = f"En la visualización se aprecian intensos pulsos de energía vertical centrados alrededor de los {peak_freq:.0f} Hz, marcados en colores cálidos. Cruzando esta medición acústica con la biometría regional de iNaturalist, las candidatas más probables (Confianza {confidence*100:.1f}%) son: {cands_str}."
            
            text = await get_gemini_narrative(prompt, fallback)
            
            transcript.append({
                "start": start,
                "end": end + 1.0,  # Margen
                "text": text
            })
            
            last_end = end + 1.0
            
        if duration - last_end > 1.5:
            text = await get_gemini_narrative(
                "La actividad acústica decae y el ecosistema retorna hacia la latencia basal suave. Describe la atenuación de los pulsos en el gráfico.",
                "En el visualizador, las marcadas barras de energía se desvanecen gradualmente hacia tonos azulados de baja intensidad. La actividad acústica focal decae y el ecosistema retorna hacia la latencia basal."
            )
            transcript.append({
                "start": last_end,
                "end": duration,
                "text": text
            })
            
    return transcript