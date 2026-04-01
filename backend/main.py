from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import uuid
import time

app = FastAPI(
    title="Sonic Naturalist API",
    description="Bioacoustic Analysis Platform for Amphibian Research",
    version="1.0.0"
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "service": "Sonic Naturalist API"}

@app.post("/v1/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    if not file.filename.endswith(('.wav', '.mp3', '.flac')):
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    # Aquí iría la lógica de guardado en S3 o Local Storage
    audio_id = str(uuid.uuid4())
    
    return {
        "audioId": audio_id,
        "filename": file.filename,
        "status": "uploaded successfully"
    }

@app.post("/v1/audio/{audio_id}/process")
async def process_audio(audio_id: str, background_tasks: BackgroundTasks):
    # Simulación de encolado de tarea para procesamiento de espectrograma
    task_id = str(uuid.uuid4())
    
    # background_tasks.add_task(compute_spectrogram, audio_id)
    
    return {
        "taskId": task_id,
        "status": "queued",
        "message": "Audio processing started in background"
    }

@app.get("/v1/tasks/{task_id}/status")
def get_task_status(task_id: str):
    # Endpoint para que el frontend haga polling del progreso
    return {
        "taskId": task_id,
        "status": "processing",
        "progress": 84
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)