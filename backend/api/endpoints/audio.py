from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from services import audio_service

router = APIRouter()

@router.post("/upload", status_code=201)
async def upload_audio(file: UploadFile = File(...)):
    """Sube un archivo de audio (.wav, .mp3, .flac) al servidor."""
    
    # Validación estricta de extensiones
    allowed_extensions = ('.wav', '.mp3', '.flac')
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file format. Allowed formats are: {allowed_extensions}"
        )
    
    try:
        audio_id = await audio_service.save_upload_file(file)
        return {
            "audioId": audio_id,
            "filename": file.filename,
            "status": "uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

@router.post("/{audio_id}/process")
async def process_audio(audio_id: str, background_tasks: BackgroundTasks):
    """Inicia el análisis bioacústico en segundo plano."""
    
    # Delegamos la tarea pesada al background para devolver respuesta inmediata al frontend
    background_tasks.add_task(audio_service.queue_spectrogram_processing, audio_id)
    
    return {
        "taskId": "mock-task-id-1234",
        "status": "queued",
        "message": "Audio processing started in background"
    }