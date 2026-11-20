import { api } from "./api.js";
import { SpectrogramView, fmtTime, fmtHz } from "./spectro.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const VIEW_TITLES = {
  espectro: ["Sesión activa", "Análisis de espectrograma"],
  biblioteca: ["Biblioteca", "Grabaciones"],
  diario: ["Cuaderno", "Diario de campo"],
};

const state = {
  audioId: null,
  filename: "",
  duration: 0,
  detections: [],   // cada una lleva review: "pending" | "confirmed" | "rejected"
  transcript: [],
  loadToken: 0,     // evita que una carga vieja pise a una nueva
};

let libraryItems = [];
let pendingFile = null;

const audio = $("#audio");

const view = new SpectrogramView({
  container: $("#spec"),
  img: $("#specImg"),
  canvas: $("#specCanvas"),
  onSeek: (t) => { audio.currentTime = t; },
  onCursor: (txt) => { $("#cursorReadout").textContent = txt ?? "— s · — Hz"; },
});

// ---------- Utilidades ----------

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function setStatus(text, kind = "") {
  const chip = $("#statusChip");
  chip.textContent = text;
  chip.className = `chip ${kind}`.trim();
}

let toastTimer;
function toast(message, isError = false) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.toggle("is-error", isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3800);
}

// ---------- Navegación ----------

function showView(name) {
  $$(".nav-item").forEach((b) => b.classList.toggle("is-active", b.dataset.view === name));
  $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${name}`));
  const [eyebrow, title] = VIEW_TITLES[name];
  $("#eyebrow").textContent = eyebrow;
  $("#viewTitle").textContent = title;
  sessionStorage.setItem("view", name);
  if (name === "biblioteca") loadLibrary();
}

$$(".nav-item").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));

// ---------- Carga de un audio ----------

async function loadAudio(audioId, filename) {
  const token = ++state.loadToken;
  Object.assign(state, { audioId, filename, duration: 0, detections: [], transcript: [] });
  sessionStorage.setItem("audioId", audioId);
  sessionStorage.setItem("filename", filename);

  $("#fileName").textContent = filename;
  audio.src = api.streamUrl(audioId);
  audio.load();
  $("#specEmpty").hidden = true;
  $("#specLoading").hidden = false;
  $("#specImg").hidden = true;
  $("#exportBtn").disabled = true;
  $("#transcript").innerHTML = '<p class="muted">Generando interpretación…</p>';
  setStatus("Analizando", "is-busy");
  renderDetections();

  const [spec, det, interp] = await Promise.allSettled([
    api.spectrogram(audioId),
    api.detect(audioId),
    api.interpret(audioId),
  ]);
  if (token !== state.loadToken) return; // llegó otra carga mientras tanto

  $("#specLoading").hidden = true;
  if (spec.status === "fulfilled") {
    state.duration = spec.value.duration;
    view.setData(spec.value);
    view.setPlayhead(0);
  } else {
    $("#specEmpty").hidden = false;
    toast(`Espectrograma: ${spec.reason.message}`, true);
  }

  if (det.status === "fulfilled") {
    state.detections = det.value.detections.map((d) => ({ ...d, review: "pending" }));
  } else {
    toast(`Detección: ${det.reason.message}`, true);
  }

  state.transcript = interp.status === "fulfilled" ? interp.value.transcript : [];
  if (interp.status === "rejected") toast(`Intérprete: ${interp.reason.message}`, true);

  renderDetections();
  renderTranscript();
  setStatus(spec.status === "fulfilled" ? "Listo" : "Error", spec.status === "fulfilled" ? "is-ok" : "is-err");
  $("#exportBtn").disabled = false;
}

// ---------- Detecciones ----------

function renderDetections() {
  view.setDetections(state.detections);

  const card = $("#topCard");
  const top = state.detections.reduce((best, d) => (!best || d.confidence > best.confidence ? d : best), null);
  if (!top) {
    card.innerHTML = `<p class="muted center">${state.audioId ? "Sin eventos detectados" : "Sin detecciones todavía"}</p>`;
  } else {
    const pct = Math.round(top.confidence * 100);
    const others = top.candidates.slice(1);
    card.innerHTML = `
      <span class="top-tag">Más probable</span>
      <h4 class="top-species">${esc(top.candidates[0] ?? "Especie desconocida")}</h4>
      <img class="top-img" src="img/rana.jpg" alt="Rana" />
      <div class="conf-row">
        <div class="bar"><span style="width:${pct}%"></span></div>
        <span class="conf-val">${pct}%</span>
      </div>
      ${others.length ? `<div class="others">Otras posibilidades:<ul>${others.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>` : ""}
    `;
  }

  const list = $("#detList");
  list.innerHTML = state.detections.length
    ? state.detections.map((d, i) => `
        <div class="det ${d.review === "confirmed" ? "is-confirmed" : d.review === "rejected" ? "is-rejected" : ""}" data-i="${i}">
          <div class="det-top">
            <span class="det-time">${d.startTime.toFixed(2)} – ${d.endTime.toFixed(2)} s</span>
            <span class="det-freq">${fmtHz(d.peak_freq)}</span>
          </div>
          <div class="det-cands">${esc(d.candidates.join(" · "))}</div>
          <div class="det-actions">
            <button class="${d.review === "confirmed" ? "on" : ""}" data-act="confirmed">✓ Confirmar</button>
            <button class="no ${d.review === "rejected" ? "on" : ""}" data-act="rejected">✕ Descartar</button>
          </div>
        </div>`).join("")
    : `<p class="muted">${state.audioId ? "Sin eventos para validar." : "Aparecerán aquí al analizar una grabación."}</p>`;
}

$("#detList").addEventListener("click", (e) => {
  const card = e.target.closest(".det");
  if (!card) return;
  const det = state.detections[Number(card.dataset.i)];
  const act = e.target.closest("button")?.dataset.act;
  if (act) {
    // Pulsar el mismo estado de nuevo lo deshace
    det.review = det.review === act ? "pending" : act;
    renderDetections();
  } else {
    audio.currentTime = det.startTime; // clic en la tarjeta: saltar al evento
  }
});

// ---------- Intérprete ----------

function renderTranscript() {
  const box = $("#transcript");
  if (!state.transcript.length) {
    box.innerHTML = '<p class="muted">Sin interpretación disponible.</p>';
    return;
  }
  box.innerHTML = state.transcript.map((it, i) => `
    <div class="tr-item" data-i="${i}" data-start="${it.start}">
      <span class="tr-time">${fmtTime(it.start)} – ${fmtTime(it.end)}</span>${esc(it.text)}
    </div>`).join("");
}

$("#transcript").addEventListener("click", (e) => {
  const item = e.target.closest(".tr-item");
  if (item) audio.currentTime = Number(item.dataset.start);
});

function updateTranscript(t) {
  const items = $$("#transcript .tr-item");
  let activeEl = null;
  items.forEach((el, i) => {
    const it = state.transcript[i];
    const active = t >= it.start && t < it.end;
    el.classList.toggle("is-active", active);
    el.classList.toggle("is-past", t >= it.end);
    if (active) activeEl = el;
  });
  if (activeEl) activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// ---------- Reproductor ----------

function onTime() {
  const t = audio.currentTime;
  const dur = state.duration || audio.duration || 0;
  view.setPlayhead(t);
  updateTranscript(t);
  $("#seek").value = dur ? Math.round((t / dur) * 1000) : 0;
  $("#timeLabel").textContent = `${fmtTime(t)} / ${fmtTime(dur)}`;
}

audio.addEventListener("timeupdate", onTime);
audio.addEventListener("loadedmetadata", onTime);
audio.addEventListener("play", () => { $("#playBtn").firstElementChild.textContent = "pause"; });
audio.addEventListener("pause", () => { $("#playBtn").firstElementChild.textContent = "play_arrow"; });
audio.addEventListener("ended", () => { $("#playBtn").firstElementChild.textContent = "play_arrow"; });

$("#playBtn").addEventListener("click", () => {
  if (!audio.src) return;
  if (audio.paused) audio.play(); else audio.pause();
});

$("#seek").addEventListener("input", (e) => {
  const dur = state.duration || audio.duration || 0;
  audio.currentTime = (Number(e.target.value) / 1000) * dur;
});

// ---------- Subida ----------

const dialog = $("#uploadDlg");
const dropzone = $("#dropzone");
const fileInput = $("#fileInput");
const submitBtn = $("#submitUpload");

$("#openUpload").addEventListener("click", () => dialog.showModal());
$("#cancelUpload").addEventListener("click", () => dialog.close());

function setPendingFile(file) {
  if (!file) return;
  if (!/\.(wav|mp3|flac)$/i.test(file.name)) {
    toast("Formato no válido. Usa .wav, .mp3 o .flac", true);
    return;
  }
  pendingFile = file;
  dropzone.classList.add("has-file");
  $("#dropText").textContent = `${file.name} (${(file.size / 1048576).toFixed(1)} MB)`;
  submitBtn.disabled = false;
}

fileInput.addEventListener("change", () => setPendingFile(fileInput.files[0]));
["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("is-over"); }));
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("is-over"); }));
dropzone.addEventListener("drop", (e) => setPendingFile(e.dataTransfer.files[0]));

$("#uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!pendingFile) return;

  const fd = new FormData(e.target); // location, altitude, habitat
  fd.append("file", pendingFile);
  submitBtn.disabled = true;
  submitBtn.textContent = "Subiendo…";
  try {
    const res = await api.upload(fd);
    dialog.close();
    showView("espectro");
    await loadAudio(res.audioId, pendingFile.name);
    e.target.reset();
    pendingFile = null;
    dropzone.classList.remove("has-file");
    $("#dropText").textContent = "Arrastra un .wav, .mp3 o .flac aquí, o haz clic";
  } catch (err) {
    toast(`No se pudo subir: ${err.message}`, true);
    setStatus("Error", "is-err");
  } finally {
    submitBtn.textContent = "Subir y analizar";
    submitBtn.disabled = !pendingFile;
  }
});

// ---------- Biblioteca ----------

async function loadLibrary() {
  const box = $("#library");
  box.innerHTML = '<p class="muted">Cargando grabaciones…</p>';
  try {
    libraryItems = await api.list();
  } catch (err) {
    box.innerHTML = `<p class="muted">No se pudo cargar la biblioteca: ${esc(err.message)}</p>`;
    return;
  }
  if (!libraryItems.length) {
    box.innerHTML = `<div class="card empty-block"><span class="icon big">mic</span><p>No hay grabaciones todavía.</p></div>`;
    return;
  }
  box.innerHTML = libraryItems.map((it, i) => `
    <button class="lib-card" data-i="${i}">
      <span class="icon">graphic_eq</span>
      <h4>${esc(it.filename)}</h4>
      <p>${esc(it.location || "Sin región")} · ${esc(it.habitat || "Sin hábitat")}</p>
      <p>${it.altitude ? esc(it.altitude) + " m s.n.m. · " : ""}${(it.size / 1048576).toFixed(1)} MB</p>
    </button>`).join("");
}

$("#library").addEventListener("click", (e) => {
  const card = e.target.closest(".lib-card");
  if (!card) return;
  const it = libraryItems[Number(card.dataset.i)];
  showView("espectro");
  loadAudio(it.audioId, it.filename);
});

// ---------- Exportar ----------

$("#exportBtn").addEventListener("click", () => {
  const payload = {
    audioId: state.audioId,
    filename: state.filename,
    duration: state.duration,
    detections: state.detections,
    transcript: state.transcript,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.filename || "analisis"}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ---------- Recarga en vivo (desarrollo) ----------
// Consulta /api/dev/stamp cada 800 ms; si cambió algún archivo de frontend, recarga la página.
// Se conserva la vista activa; el audio se vuelve a elegir desde la biblioteca.

let lastStamp = null;
async function watchFrontend() {
  try {
    const res = await fetch("/api/dev/stamp", { cache: "no-store" });
    const { stamp } = await res.json();
    if (lastStamp !== null && stamp !== lastStamp) {
      location.reload();
      return;
    }
    lastStamp = stamp;
  } catch (_) { /* servidor reiniciándose: reintentamos */ }
  setTimeout(watchFrontend, 800);
}

// ---------- Arranque ----------

showView(sessionStorage.getItem("view") || "espectro");
watchFrontend();

// Enlace directo: /?audio=<id> abre esa grabación al cargar
const deepLinkId = new URLSearchParams(location.search).get("audio");
if (deepLinkId) {
  showView("espectro");
  loadAudio(deepLinkId, deepLinkId);
}
