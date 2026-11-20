# Sonic Naturalist 🐸🎧

**Demo en vivo:** https://sonicnaturalist-frontend.vercel.app/

Plataforma de análisis bioacústico para visualizar y acompañar la interpretación de cantos de anuros en grabaciones de campo. Muestra el espectrograma Mel, detecta eventos acústicos y propone especies candidatas cruzando ubicación, altitud y observaciones públicas.

> La demo pública usa grabaciones precalculadas. La subida de tus propios audios funciona en la versión local (ver *Ejecutar localmente*).

---

## Qué hace

- **Espectrograma interactivo:** escala Mel de 0 a 8 kHz, cursor con tiempo y frecuencia, y cabezal de reproducción sincronizado con el audio.
- **Detección de eventos:** onsets y frecuencia dominante calculados con DSP (librosa).
- **Candidatas de especie:** cruza las observaciones de anuros en iNaturalist (radio de 10 km, grado de investigación) con los registros de GBIF dentro de la banda de altitud de la grabación. Muestra hasta 5 candidatas con foto y el biólogo elige el ID.
- **Intérprete:** narra qué se ve en el espectrograma y avanza con el audio. Puede usar Gemini si se configura una clave.
- **Biblioteca:** cuatro grabaciones de demo y, en la versión local, tus propias subidas.

**Limitación honesta:** las candidatas salen de la ubicación y la altitud, no del canto. Asociar el canto a una especie requiere una biblioteca de cantos de referencia validados, que está en construcción.

---

## Stack

- **Frontend:** HTML, CSS y JavaScript vanilla (módulos ES, sin build ni frameworks). Visualización con canvas.
- **Backend:** FastAPI (Python), librosa y numpy para el procesamiento de audio, Pillow para el espectrograma.
- **Datos externos:** iNaturalist API y GBIF API.
- **Despliegue:** frontend en Vercel con la demo precalculada (`frontend/demo/`).

### Estructura

```
backend/            API FastAPI, procesamiento de audio y candidatas de especie
  ml/               detección de eventos y consulta de candidatas (iNaturalist + GBIF)
  scripts/          build_demo.py: precalcula las grabaciones de demo
frontend/           sitio estático (HTML, CSS, JS) y demo/
deploy/space/       Dockerfile y README para Hugging Face Spaces (opcional)
scripts/            prepare_space.py: arma la carpeta de despliegue
```

---

## Ejecutar localmente

Requisitos: Python 3.12.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # en Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Abre http://localhost:8000. Con el backend activo puedes subir grabaciones, indicando lugar, altitud y, si quieres, latitud y longitud.

Para la clave de Gemini (opcional), crea `backend/.env` con `GEMINI_API_KEY=...`. Ese archivo está en `.gitignore`.

### Regenerar la demo

```bash
cd backend
python scripts/build_demo.py <carpeta_con_mp3>
```

---

## Roadmap

- Biblioteca de cantos de referencia por especie, para asociar el canto a la candidata.
- Guardar las validaciones de eventos y del ID elegido.
- Selector de punto de coordenadas en mapa (ya disponible en la versión local).
- Exportar a formatos de análisis (por ejemplo, Raven Pro).

---

*Proyecto de portafolio que combina procesamiento de señales, datos de biodiversidad y desarrollo web.*
