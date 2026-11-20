"""
Precalcula las grabaciones de demo para el sitio estático (Vercel).

Para cada grabación genera en frontend/demo/<id>/:
  audio.mp3        -> la grabación
  spectrogram.json -> imagen Mel + frecuencias (sin la malla de hover, que no usa el frontend)
  detect.json      -> eventos + candidatas de especie (iNaturalist/GBIF)
  interpret.json   -> narración del intérprete
y el índice frontend/demo/index.json.

Uso (desde backend/, con el venv activo):
    python scripts/build_demo.py <carpeta_con_mp3>
"""
import asyncio
import json
import shutil
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DEMO = BACKEND_DIR.parent / "frontend" / "demo"
sys.path.insert(0, str(BACKEND_DIR))

from core.config import settings  # noqa: E402
from services import audio_service  # noqa: E402
from ml.ribbit_wrapper import RIBBITDetector  # noqa: E402

# Nombre del archivo de origen -> datos de la demo.
# Todas salieron de la misma salida de campo: ubicación y altitud compartidas.
MANIFEST = [
    {
        "id": "demo-pristimantis",
        "file": "A Pristimantis editado.mp3",
        "title": "Pristimantis",
        "label": "Pristimantis sp. (ID morfológico)",
    },
    {
        "id": "demo-padreluna",
        "file": "D. padreluna editado.mp3",
        "title": "Dendropsophus padreluna",
        "label": "Dendropsophus padreluna (ID morfológico)",
    },
    {
        "id": "demo-dendrobatido",
        "file": "Dendrobátido  editado.mp3",
        "title": "Dendrobátido",
        "label": "Dendrobatidae sp. (ID morfológico)",
    },
    {
        "id": "demo-rheobates",
        "file": "Rheobates editado.mp3",
        "title": "Rheobates",
        "label": "Rheobates sp. (ID morfológico)",
    },
]
SHARED_METADATA = {
    "location": "Chicaque, Colombia",
    "altitude": "2600",
    "habitat": "Bosque de niebla",
    "latitude": "4.6166",
    "longitude": "-74.3079",
}


def write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


async def build_one(entry: dict, source_dir: Path, storage: Path, detector: RIBBITDetector):
    audio_id = entry["id"]
    src = source_dir / entry["file"]
    if not src.exists():
        raise FileNotFoundError(src)

    # Copiamos a la carpeta temporal que usan los servicios
    shutil.copy(src, storage / f"{audio_id}.mp3")
    (storage / f"{audio_id}_metadata.json").write_text(
        json.dumps(SHARED_METADATA, ensure_ascii=False), encoding="utf-8")

    out = FRONTEND_DEMO / audio_id
    out.mkdir(parents=True, exist_ok=True)
    shutil.copy(src, out / "audio.mp3")

    print(f"  espectrograma...")
    spec = await audio_service.generate_spectrogram_data(audio_id)
    write_json(out / "spectrogram.json", {
        "image": spec["image"], "duration": spec["duration"], "hover_y": spec["hover_y"],
    })

    print(f"  detección + candidatas...")
    audio_path = str(storage / f"{audio_id}.mp3")
    detections = detector.detect_events(audio_path, threshold=0.80)
    species = detector.species_info(audio_path)
    write_json(out / "detect.json", {
        "audio_id": audio_id, "model": detector.model_name,
        "species": species, "detections": detections,
    })

    print(f"  intérprete...")
    transcript = await audio_service.generate_ai_interpretation(audio_id, detections)
    write_json(out / "interpret.json", {"transcript": transcript})

    return {
        "id": audio_id,
        "title": entry["title"],
        "label": entry["label"],
        "filename": entry["file"].replace("  ", " "),
        "location": SHARED_METADATA["location"],
        "altitude": SHARED_METADATA["altitude"],
        "habitat": SHARED_METADATA["habitat"],
        "duration": spec["duration"],
    }


async def main(source_dir: Path):
    storage = Path(tempfile.mkdtemp(prefix="sonic_demo_"))
    settings.STORAGE_DIR = storage  # los servicios leen la carpeta desde settings
    detector = RIBBITDetector()
    index = []
    try:
        for entry in MANIFEST:
            print(f"[{entry['id']}] {entry['file']}")
            index.append(await build_one(entry, source_dir, storage, detector))
    finally:
        shutil.rmtree(storage, ignore_errors=True)
    write_json(FRONTEND_DEMO / "index.json", index)
    print(f"Listo: {len(index)} grabaciones en {FRONTEND_DEMO}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Uso: python scripts/build_demo.py <carpeta_con_mp3>")
    asyncio.run(main(Path(sys.argv[1])))
