from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sonic Naturalist API"
    API_V1_STR: str = "/api/v1"
    
    # Rutas de almacenamiento
    STORAGE_DIR: Path = Path("data/audio")
    
    # Configuración de Pydantic para leer archivo .env si existe
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

# Crear directorio de almacenamiento si no existe
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)