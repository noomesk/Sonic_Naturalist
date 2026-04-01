from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from core.config import settings
from api.endpoints import audio

# Sistema moderno de manejo de ciclo de vida (startup/shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Levantando Sonic Naturalist API...")
    # Aquí inicializaremos la BD (PostgreSQL) y cargaremos los modelos de IA a memoria RAM en el futuro
    yield
    print("🛑 Apagando servicios, liberando memoria RAM de modelos...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Plataforma de análisis bioacústico de anurofauna",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración CORS estricta (Esencial para conectar React con FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar los endpoints
app.include_router(audio.router, prefix=f"{settings.API_V1_STR}/audio", tags=["Audio"])

@app.get("/")
def health_check():
    return {"status": "online", "service": settings.PROJECT_NAME}