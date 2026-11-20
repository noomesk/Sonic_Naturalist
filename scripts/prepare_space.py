"""
Prepara la carpeta de despliegue para Hugging Face Spaces (Docker).

Copia solo lo necesario: backend, frontend, Dockerfile y README del Space.
Excluye el entorno virtual, las subidas locales y los .env (con secretos).

Uso:
    python scripts/prepare_space.py [carpeta_destino]
Por defecto crea C:/Users/PC/sonic_space (fuera del repo, para no versionarla dos veces).
"""
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DEFAULT_TARGET = Path("C:/Users/PC/sonic_space")

IGNORE = shutil.ignore_patterns(
    ".venv", "__pycache__", "*.pyc", ".env", "audio", "*_metadata.json", ".git"
)


def main(target: Path):
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)

    shutil.copy(REPO / "deploy" / "space" / "Dockerfile", target / "Dockerfile")
    shutil.copy(REPO / "deploy" / "space" / "README.md", target / "README.md")
    shutil.copytree(REPO / "backend", target / "backend", ignore=IGNORE)
    shutil.copytree(REPO / "frontend", target / "frontend", ignore=IGNORE)

    # El backend crea data/audio al arrancar; dejamos la carpeta vacía para las subidas
    (target / "backend" / "data" / "audio").mkdir(parents=True, exist_ok=True)

    # Hugging Face rechaza archivos grandes sin Git LFS
    too_big = [p for p in target.rglob("*") if p.is_file() and p.stat().st_size > 10 * 1024 * 1024]
    if too_big:
        sys.exit(f"Archivos mayores de 10 MB (no se pueden subir sin LFS): {too_big}")

    total = sum(p.stat().st_size for p in target.rglob("*") if p.is_file())
    print(f"Listo en {target} ({total / 1024 / 1024:.1f} MB, {sum(1 for p in target.rglob('*') if p.is_file())} archivos)")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_TARGET)
