// Cliente de la API de Sonic Naturalist. Mismo origen, así que las rutas son relativas.
const BASE = "/api/v1/audio";

async function request(path, options) {
  const res = await fetch(BASE + path, options);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch (_) { /* respuesta sin JSON */ }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  list: () => request("/list"),
  upload: (formData) => request("/upload", { method: "POST", body: formData }),
  spectrogram: (id) => request(`/${id}/spectrogram`),
  detect: (id) => request(`/${id}/detect`),
  interpret: (id) => request(`/${id}/interpret`),
  streamUrl: (id) => `${BASE}/${id}/stream`,
};
