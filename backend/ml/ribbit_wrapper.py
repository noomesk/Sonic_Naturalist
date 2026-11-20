import json
import uuid
from pathlib import Path
from typing import List, Dict

import librosa
import numpy as np

from ml.species_candidates import candidates_for


class RIBBITDetector:
    """
    Detección de eventos (onsets) con DSP real + candidatas de especie por ubicación,
    altitud (GBIF) y observaciones (iNaturalist).

    Nota: el canto NO se asocia todavía a una especie. Las candidatas son las especies
    probables en el lugar; la identificación final la hace el biólogo.
    """

    def __init__(self):
        self.model_name = "Onsets DSP + candidatas iNaturalist/GBIF"

    @staticmethod
    def read_metadata(audio_path) -> dict:
        audio_file = Path(audio_path)
        meta_path = audio_file.parent / f"{audio_file.stem}_metadata.json"
        if not meta_path.exists():
            return {}
        try:
            return json.loads(meta_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}

    def species_info(self, audio_path) -> dict:
        """Candidatas para la grabación, según sus metadatos (lat/lng, altitud, región)."""
        meta = self.read_metadata(audio_path)
        lat, lng = _to_float(meta.get("latitude")), _to_float(meta.get("longitude"))
        altitude = _to_float(meta.get("altitude"))
        info = {}
        try:
            if lat is None or lng is None:
                from ml.species_candidates import geocode
                place = geocode(meta.get("location", ""))
                if place:
                    lat, lng, place_name = place
                    info["geocodedAs"] = place_name
        except Exception as e:
            info["geocodeError"] = str(e)
        info["latitude"], info["longitude"], info["altitude"] = lat, lng, altitude
        info.update(candidates_for(lat, lng, altitude))
        return info

    def detect_events(self, audio_path: str, threshold: float = 0.5) -> List[Dict]:
        """
        Detecta onsets reales (tiempo y frecuencia dominante) y adjunta las candidatas
        de la grabación a cada evento.
        """
        try:
            species = self.species_info(audio_path)
            candidate_names = [_label(c) for c in species.get("candidates", [])]

            y, sr = librosa.load(audio_path, duration=30.0, sr=22050)
            onset_frames = librosa.onset.onset_detect(
                y=y, sr=sr, wait=10, pre_avg=1, post_avg=1, pre_max=1, post_max=1
            )
            onset_times = librosa.frames_to_time(onset_frames, sr=sr)

            S = np.abs(librosa.stft(y))
            frequencies = librosa.fft_frequencies(sr=sr)
            rng = np.random.default_rng(0)  # duración del evento: solo para visualización

            detections = []
            for i, start_time in enumerate(onset_times):
                frame_idx = onset_frames[i]
                frame_window = S[:, max(0, frame_idx - 2):min(S.shape[1], frame_idx + 3)]
                peak_idx = np.argmax(np.mean(frame_window, axis=1))
                peak_freq = frequencies[peak_idx]
                if peak_freq < 200:
                    peak_freq = frequencies[np.argmax(np.mean(frame_window[20:, :], axis=1)) + 20]

                detections.append({
                    "id": str(uuid.uuid4()),
                    "startTime": float(start_time),
                    "endTime": float(start_time + rng.uniform(0.2, 0.8)),
                    "peak_freq": float(peak_freq),
                    "candidates": candidate_names,
                    "status": "pending",
                })
            return detections[:5]
        except Exception as e:
            print(f"Error en detección: {e}")
            return []


def _to_float(value):
    try:
        return float(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _label(candidate: dict) -> str:
    common = candidate.get("commonName")
    return f"{candidate['name']} ({common})" if common else candidate["name"]
