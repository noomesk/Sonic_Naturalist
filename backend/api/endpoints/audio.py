import json

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from services import audio_service
from ml.ribbit_wrapper import RIBBITDetector
from core.config import settings

# Instanciamos el detector en memoria (Singleton para no recargarlo en cada petición)
detector = RIBBITDetector()

router = APIRouter()

AUDIO_EXTENSIONS = ('.wav', '.mp3', '.flac')


@router.get("/list")
async def list_audio():
    """Lista las grabaciones guardadas con sus metadatos (para la biblioteca)."""
    items = []
    for path in sorted(settings.STORAGE_DIR.iterdir()):
        if path.suffix.lower() not in AUDIO_EXTENSIONS:
            continue
        meta = {}
        meta_path = settings.STORAGE_DIR / f"{path.stem}_metadata.json"
        if meta_path.exists():
            try:
                meta = json.loads(meta_path.read_text(encoding='utf-8'))
            except (OSError, json.JSONDecodeError):
                meta = {}
        items.append({
            "audioId": path.stem,
            "filename": path.name,
            "size": path.stat().st_size,
            "location": meta.get("location", ""),
            "altitude": meta.get("altitude", ""),
            "habitat": meta.get("habitat", ""),
        })
    return items

@router.post("/upload", status_code=201)
async def upload_audio(
    file: UploadFile = File(...),
    location: str = Form(""),
    altitude: str = Form(""),
    habitat: str = Form(""),
    latitude: str = Form(""),
    longitude: str = Form(""),
):
    """Sube un archivo de audio (.wav, .mp3, .flac) al servidor."""
    
    # Validación estricta de extensiones
    allowed_extensions = ('.wav', '.mp3', '.flac')
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file format. Allowed formats are: {allowed_extensions}"
        )
    
    try:
        metadata = {
            "location": location, "altitude": altitude, "habitat": habitat,
            "latitude": latitude, "longitude": longitude,
        }
        audio_id = await audio_service.save_upload_file(file, metadata)
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

@router.get("/{audio_id}/spectrogram")
async def get_spectrogram(audio_id: str):
    """Devuelve la matriz 2D del espectrograma para ser renderizada en el frontend."""
    try:
        # Nota: En un entorno de alto tráfico, esto no se debe esperar de forma síncrona.
        # Para el MVP, lo esperamos (await) para verlo funcionar de inmediato.
        data = await audio_service.generate_spectrogram_data(audio_id)
        return data
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing spectrogram: {str(e)}")

@router.get("/{audio_id}/detect")
async def run_ai_detection(audio_id: str):
    """Ejecuta el modelo RIBBIT sobre el audio y devuelve los eventos acústicos."""
    files = list(settings.STORAGE_DIR.glob(f"{audio_id}.*"))
    if not files:
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    audio_path = files[0]
    
    # En producción esto sería una tarea asíncrona (BackgroundTasks o Celery),
    # pero para el MVP lo esperamos para ver el resultado inmediatamente.
    detections = detector.detect_events(str(audio_path), threshold=0.80)
    species = detector.species_info(str(audio_path))

    return {
        "audio_id": audio_id,
        "model": detector.model_name,
        "species": species,      # candidatas con foto, fuentes y estado del filtro de altitud
        "detections": detections
    }

@router.get("/{audio_id}/stream")
async def stream_audio(audio_id: str):
    """Devuelve el archivo de audio subido para su reproducción en el navegador."""
    files = list(settings.STORAGE_DIR.glob(f"{audio_id}.*"))
    if not files:
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    audio_path = files[0]
    return FileResponse(audio_path)

@router.get("/{audio_id}/interpret")
async def get_interpretation(audio_id: str):
    """Genera dinámica y algorítmicamente la interpretación en forma de libreto científico."""
    files = list(settings.STORAGE_DIR.glob(f"{audio_id}.*"))
    if not files:
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    audio_path = files[0]
    # Extraemos detecciones usando el RIBBIT en memoria
    detections = detector.detect_events(str(audio_path), threshold=0.80)
    
    # Pasamos las detecciones al generador de transcripciones
    transcript = await audio_service.generate_ai_interpretation(audio_id, detections)
    return {"transcript": transcript}