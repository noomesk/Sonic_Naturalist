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
    # Buscar el archivo físico (sin importar si es wav, mp3 o flac)
    files = list(settings.STORAGE_DIR.glob(f"{audio_id}.*"))
    if not files:
        raise FileNotFoundError("Audio document not found in storage")
        
    audio_path = files[0]
    
    # 1. Cargar audio (Para MVP, limitamos a los primeros 30 segundos para no saturar la RAM)
    # En producción 2026, esto se haría con streaming o dask
    y, sr = librosa.load(audio_path, duration=30.0, sr=22050)
    
    # 2. Computar Espectrograma Mel (Frecuencias escala logarítmica)
    n_mels = 128
    melspec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, hop_length=512)
    melspec_db = librosa.power_to_db(melspec, ref=np.max)
    
    # Extraer las frecuencias reales en Hz para el eje Y
    freqs = librosa.mel_frequencies(n_mels=n_mels, fmin=0.0, fmax=sr/2.0)
    
    # 3. Downsampling (Reducir resolución horizontal para que el navegador no se congele)
    max_frames = 800
    if melspec_db.shape[1] > max_frames:
        indices = np.linspace(0, melspec_db.shape[1] - 1, max_frames).astype(int)
        melspec_db = melspec_db[:, indices]
        
    duration = librosa.get_duration(y=y, sr=sr)
    # Crear eje de tiempo real para el eje X
    times = np.linspace(0, duration, melspec_db.shape[1])
        
    return {
        "x": times.tolist(),
        "y": freqs.tolist(),
        "z": melspec_db.tolist(), # Matriz de amplitudes (decibelios)
        "sr": sr,
        "duration": duration
    }