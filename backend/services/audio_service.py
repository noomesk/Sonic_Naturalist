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
        # Limitamos a 60 segundos (1 minuto) para el prototipo Beta
        y, sr = librosa.load(audio_path, duration=60.0, sr=22050)
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
    # Aumentamos los píxeles a 2500 para permitir alta resolución en audios de 4+ mins sin ahogar a Plotly
    max_frames = 2500
    if melspec_db.shape[1] > max_frames:
        indices = np.linspace(0, melspec_db.shape[1] - 1, max_frames).astype(int)
        melspec_db = melspec_db[:, indices]
        times = times[indices] # Mapear los tiempos reducidos
        
    return {
        "x": times.tolist(),
        "y": freqs.tolist(),
        "z": melspec_db.tolist(),
        "sr": sr,
        "duration": librosa.get_duration(y=y, sr=sr)
    }