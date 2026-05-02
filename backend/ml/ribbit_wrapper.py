import librosa
import numpy as np
import uuid
import json
from pathlib import Path
from typing import List, Dict

class RIBBITDetector:
    def __init__(self, model_path: str = None):
        self.model_name = "RIBBIT v2.1 (Heuristic Engine)"
        self.default_classes = ["Lithobates catesbeianus", "Hyla cinerea", "Pseudacris crucifer"]
        
        # Base de datos simulada para familias según hábitat
        self.families = {
            "high_altitude": ["Centrolenidae (Ranas de cristal)", "Strabomantidae", "Aromobatidae"],
            "lowland_wet": ["Dendrobatidae (Ranas venenosas)", "Hylidae (Ranas arborícolas)", "Leptodactylidae"],
            "generic": ["Anura (Rana sp.)", "Bufonidae (Sapo común)"]
        }

    def detect_events(self, audio_path: str, threshold: float = 0.5) -> List[Dict]:
        """
        Analiza el audio y detecta eventos bioacústicos. 
        Lee metadatos para mejorar la predicción simulada.
        """
        try:
            # 1. Intentar leer metadatos
            audio_file = Path(audio_path)
            meta_path = audio_file.parent / f"{audio_file.stem.split('.')[0]}_metadata.json"
            
            classes_to_use = self.default_classes
            
            if meta_path.exists():
                with open(meta_path, 'r', encoding='utf-8') as f:
                    meta = json.load(f)
                    
                alt_str = meta.get("altitude", "0")
                try:
                    alt = int(alt_str) if alt_str else 0
                except ValueError:
                    alt = 0
                    
                if alt > 1500:
                    classes_to_use = self.families["high_altitude"]
                elif "selva" in meta.get("habitat", "").lower() or "humedal" in meta.get("habitat", "").lower():
                    classes_to_use = self.families["lowland_wet"]
                else:
                    classes_to_use = self.families["generic"]

            # Cargar un segmento del audio
            y, sr = librosa.load(audio_path, duration=30.0, sr=22050)
            
            # Detectar "onsets"
            onset_frames = librosa.onset.onset_detect(y=y, sr=sr, wait=10, pre_avg=1, post_avg=1, pre_max=1, post_max=1)
            onset_times = librosa.frames_to_time(onset_frames, sr=sr)
            
            detections = []
            for i, start_time in enumerate(onset_times):
                confidence = float(np.random.uniform(0.75, 0.98))
                if confidence < threshold:
                    continue
                    
                species = np.random.choice(classes_to_use)
                
                detections.append({
                    "id": str(uuid.uuid4()),
                    "startTime": float(start_time),
                    "endTime": float(start_time + np.random.uniform(0.2, 0.8)), 
                    "label": species,
                    "confidence": round(confidence, 2),
                    "status": "pending"
                })
                
            return detections[:5]
            
        except Exception as e:
            print(f"Error en detección: {e}")
            return []
