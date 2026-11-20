// Cliente de la API de Sonic Naturalist.
//
// Dos modos:
//  - local: hay backend FastAPI en el mismo origen. Funciona todo, incluida la subida.
//  - demo (sitio estático, p. ej. Vercel): no hay backend. Las grabaciones "demo-*"
//    se leen de archivos precalculados en demo/<id>/ (ver backend/scripts/build_demo.py).
const BASE = "/api/v1/audio";
const DEMO_BASE = "demo";

export const mode = { live: false };

export async function detectMode() {
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    mode.live = res.ok;
  } catch (_) {
    mode.live = false;
  }
  return mode.live;
}

const isDemo = (id) => id.startsWith("demo-");

async function getJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", body });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.detail) message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } catch (_) { /* respuesta sin JSON */ }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  // Lista demo + (en modo local) las grabaciones subidas
  async list() {
    const demo = await getJson(`${DEMO_BASE}/index.json`)
      .then((items) => items.map((i) => ({ ...i, audioId: i.id, demo: true })))
      .catch(() => []);
    if (!mode.live) return demo;
    const local = await getJson(`${BASE}/list`).catch(() => []);
    return [...demo, ...local.map((i) => ({ ...i, demo: false }))];
  },

  upload(formData) {
    if (!mode.live) throw new Error("La subida solo funciona en la versión local");
    return postJson(`${BASE}/upload`, formData);
  },

  spectrogram: (id) => (isDemo(id)
    ? getJson(`${DEMO_BASE}/${id}/spectrogram.json`)
    : getJson(`${BASE}/${id}/spectrogram`)),

  detect: (id) => (isDemo(id)
    ? getJson(`${DEMO_BASE}/${id}/detect.json`)
    : getJson(`${BASE}/${id}/detect`)),

  interpret: (id) => (isDemo(id)
    ? getJson(`${DEMO_BASE}/${id}/interpret.json`)
    : getJson(`${BASE}/${id}/interpret`)),

  streamUrl: (id) => (isDemo(id) ? `${DEMO_BASE}/${id}/audio.mp3` : `${BASE}/${id}/stream`),
};
