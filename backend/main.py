from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from core.config import settings
from api.endpoints import audio

# El frontend vanilla vive en ../frontend y lo sirve este mismo servidor
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Levantando Sonic Naturalist...")
    yield
    print("Apagando Sonic Naturalist...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Plataforma de análisis bioacústico de anurofauna",
    version="2.0.0",
    lifespan=lifespan,
)

app.include_router(audio.router, prefix=f"{settings.API_V1_STR}/audio", tags=["Audio"])


@app.get("/api/health")
def health_check():
    return {"status": "online", "service": settings.PROJECT_NAME}


@app.get("/api/dev/stamp")
def dev_stamp():
    """Marca de tiempo del frontend. El navegador la consulta y recarga al detectar cambios."""
    files = [p for p in FRONTEND_DIR.rglob("*") if p.is_file()]
    return {"stamp": max((p.stat().st_mtime for p in files), default=0)}


# Debe ir al final: todo lo que no sea /api cae en los archivos del frontend
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
