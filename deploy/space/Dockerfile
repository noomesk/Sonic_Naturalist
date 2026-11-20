FROM python:3.12-slim

# libsndfile: lectura de WAV/MP3/FLAC para librosa
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face ejecuta los contenedores como usuario no root (uid 1000)
RUN useradd -m -u 1000 user
WORKDIR /app

COPY --chown=user backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY --chown=user backend ./backend
COPY --chown=user frontend ./frontend

USER user
ENV PYTHONUNBUFFERED=1 \
    MAX_UPLOAD_MB=10
WORKDIR /app/backend

# Hugging Face espera la app en el puerto 7860
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
