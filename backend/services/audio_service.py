import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile

from core.config import settings

async def save_upload_file(upload_file: UploadFile) -> str:
    """Guarda el archivo de audio subido de forma asíncrona y retorna su ID."""
    audio_id = str(uuid.uuid4())
    extension = Path(upload_file.filename).suffix
    file_path = settings.STORAGE_DIR / f"{audio_id}{extension}"
    
    # Guardado asíncrono por chunks (ideal para archivos pesados de 500MB)
    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await upload_file.read(1024 * 1024):  # Chunks de 1MB
            await out_file.write(content)
            
    return audio_id

async def queue_spectrogram_processing(audio_id: str):
    """
    Simula el encolamiento de una tarea. 
    En 2026, esto iría a Celery, ARQ o un broker de Redis.
    """
    # TODO: Integrar librosa y plotly backend export aquí
    print(f"Iniciando procesamiento en background para el audio: {audio_id}")
    return str(uuid.uuid4())