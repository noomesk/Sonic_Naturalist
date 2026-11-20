// Visor del espectrograma: imagen Mel del backend + canvas encima para
// detecciones, cursor (tiempo y frecuencia) y cabezal de reproducción.

const MAX_FREQ = 8000; // fmax con el que el backend calcula el Mel
const N_MELS = 128;

export function fmtTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function fmtHz(hz) {
  if (!Number.isFinite(hz)) return "— Hz";
  return hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${Math.round(hz)} Hz`;
}

export class SpectrogramView {
  constructor({ container, img, canvas, onSeek, onCursor }) {
    this.container = container;
    this.img = img;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onSeek = onSeek;
    this.onCursor = onCursor;

    this.duration = 0;
    this.freqs = null;      // frecuencia (Hz) de cada banda Mel, de graves a agudos
    this.detections = [];
    this.playhead = 0;
    this.hover = null;      // posición del cursor en fracciones 0..1

    new ResizeObserver(() => this.draw()).observe(container);

    container.addEventListener("click", (e) => {
      const p = this._point(e);
      if (p && this.duration) this.onSeek(p.x * this.duration);
    });
    container.addEventListener("mousemove", (e) => {
      const p = this._point(e);
      this.hover = p;
      if (p && this.duration) {
        const t = p.x * this.duration;
        this.onCursor(`${t.toFixed(2)} s · ${fmtHz(this.freqAt(p.y))}`);
      }
      this.draw();
    });
    container.addEventListener("mouseleave", () => {
      this.hover = null;
      this.onCursor(null);
      this.draw();
    });
  }

  setData({ image, duration, hover_y }) {
    this.img.src = `data:image/png;base64,${image}`;
    this.img.hidden = false;
    this.duration = duration;
    this.freqs = hover_y;
    this._renderTicks();
    this.draw();
  }

  // Marcas de frecuencia en su posición real: la banda Mel i está en y = 1 - i/(N_MELS-1)
  _renderTicks() {
    this.container.querySelectorAll(".tick").forEach((el) => el.remove());
    if (!this.freqs) return;
    for (const hz of [1000, 2000, 4000, 6000, 8000]) {
      let best = 0;
      for (let i = 1; i < this.freqs.length; i++) {
        if (Math.abs(this.freqs[i] - hz) < Math.abs(this.freqs[best] - hz)) best = i;
      }
      const tick = document.createElement("div");
      tick.className = "tick";
      tick.style.top = `${(1 - best / (N_MELS - 1)) * 100}%`;
      tick.innerHTML = `<span>${hz / 1000} kHz</span>`;
      this.container.appendChild(tick);
    }
  }

  setDetections(detections) {
    this.detections = detections;
    this.draw();
  }

  setPlayhead(seconds) {
    this.playhead = seconds;
    this.draw();
  }

  // y en fracción (0 = arriba = agudos). La imagen se generó con las bandas Mel
  // invertidas, así que la fila r corresponde a la banda N_MELS-1-r.
  freqAt(y) {
    if (!this.freqs) return NaN;
    const row = Math.min(N_MELS - 1, Math.max(0, Math.floor(y * N_MELS)));
    return this.freqs[N_MELS - 1 - row];
  }

  _point(e) {
    const r = this.container.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }

  draw() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!this.duration) return;

    // Cajas de detección: ancho = duración del evento, alto = ±200 Hz alrededor del pico
    const boxH = (400 / MAX_FREQ) * h;
    ctx.font = "600 11px 'Space Grotesk', system-ui, sans-serif";
    for (const d of this.detections) {
      const x0 = (d.startTime / this.duration) * w;
      const x1 = (d.endTime / this.duration) * w;
      const yc = (1 - d.peak_freq / MAX_FREQ) * h;
      const top = yc - boxH / 2;
      const width = Math.max(x1 - x0, 4);

      const confirmed = d.review === "confirmed";
      const rejected = d.review === "rejected";
      ctx.fillStyle = rejected ? "rgba(186, 26, 26, 0.15)" : "rgba(0, 250, 154, 0.16)";
      ctx.strokeStyle = rejected ? "rgba(255, 120, 120, 0.8)" : confirmed ? "#00fa9a" : "rgba(0, 250, 154, 0.7)";
      ctx.lineWidth = confirmed ? 2.5 : 1.5;
      ctx.fillRect(x0, top, width, boxH);
      ctx.strokeRect(x0, top, width, boxH);

      if (!rejected) {
        ctx.fillStyle = confirmed ? "#00fa9a" : "rgba(232, 239, 233, 0.9)";
        ctx.fillText(fmtHz(d.peak_freq), x0 + 3, Math.max(12, top - 4));
      }
    }

    // Cursor del mouse (líneas punteadas)
    if (this.hover) {
      const hx = this.hover.x * w;
      const hy = this.hover.y * h;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, 0); ctx.lineTo(hx, h);
      ctx.moveTo(0, hy); ctx.lineTo(w, hy);
      ctx.stroke();
      ctx.restore();
    }

    // Cabezal de reproducción
    const px = (this.playhead / this.duration) * w;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, h);
    ctx.stroke();
  }
}
