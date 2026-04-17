import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile
import librosa
import numpy as np

from core.config import settings

async def save_upload_file(upload_file: UploadFile) -> str:
    """Guarda el archivo de audio de forma asíncrona."""
    audio_id = str(uuid.uuid4())
    extension = Path(upload_file.filename).suffix
    file_path = settings.STORAGE_DIR / f"{audio_id}{extension}"
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await upload_file.read(1024 * 1024):
            await out_file.write(content)
            
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
        
    return {
        "image": img_b64,
        "duration": duration
    }