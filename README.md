# Sonic Naturalist 🐸🎧

**Sonic Naturalist** is an advanced, AI-powered bioacoustic analysis platform designed to help biologists, ecologists, and citizen scientists visualize, analyze, and interpret amphibian vocalizations in field recordings.

This project was built as a full-stack application demonstrating the integration of traditional digital signal processing (DSP) with modern generative AI and external scientific databases.

---

## 🎯 The Problem

Analyzing hours of field audio recordings to identify specific animal calls (like frogs or birds) is incredibly time-consuming. Traditional bioacoustic software can be intimidating, highly technical, and lacks automated, pedagogical interpretations. 

Furthermore, while AI models can detect *that* an animal made a sound, they often lack the ecological context (e.g., "What species are actually present in this specific region?").

## 💡 The Solution

Sonic Naturalist bridges the gap between raw audio data and actionable scientific insight by providing:
1.  **Fast, Server-Side Spectrograms:** Uses `librosa` to compute Mel Spectrograms and rasterizes them into optimized PNGs on the backend, preventing the browser from freezing when handling large audio files (up to 4 minutes).
2.  **Context-Aware AI Detections (RIBBIT v3.0):** An audio analysis pipeline that detects acoustic events, measures their peak frequencies, and cross-references them in real-time with the **iNaturalist API** based on the recording's location to suggest the most biologically probable species candidates.
3.  **Virtual Biometric Analyst (Powered by Gemini):** Integrates Google's Gemini LLM to act as an expert tutor. It reads the frequency data and metadata to generate pedagogical, natural-language narratives explaining *how* to read the visual patterns in the spectrogram and *what* they mean ecologically.

---

## 🛠️ Tech Stack & Architecture

This platform is built with a modern decoupled architecture:

### Frontend
*   **React + Vite:** For a blazing-fast, component-based user interface.
*   **TypeScript:** Ensuring type safety and maintainable code.
*   **Tailwind CSS:** For a highly customized, responsive, and modern "scientific" UI aesthetic (Glassmorphism, dark modes, precise typography).
*   **Design System:** Custom CSS tokens tailored for a premium data-visualization experience.

### Backend
*   **FastAPI (Python):** High-performance backend to handle asynchronous audio processing and API routing.
*   **Librosa & NumPy:** For heavy digital signal processing, onset detection, and Fast Fourier Transforms (FFT).
*   **Google GenAI SDK (Gemini 2.5 Flash):** For the generation of dynamic educational narratives based on audio data.
*   **iNaturalist API:** To fetch regional biodiversity data and perform acoustic-to-taxonomic matching.

---

## ⚙️ Development Workflow & Engineering Highlights

As a Full-Stack Developer with a focus on AI and Science integrations, the development of this platform followed a rigorous engineering workflow:

1.  **Audio Processing Optimization:** Initially, rendering large arrays of spectrogram data on the client-side caused massive performance bottlenecks. The solution was to move the heavy lifting (FFT computation) to the FastAPI backend, normalize the data, apply a custom colormap, and send a lightweight Base64 PNG to the frontend, accompanied by downsampled metadata for interactive hover tooltips.
2.  **Algorithmic Cross-Referencing:** Instead of relying solely on a black-box audio classification model, the app uses deterministic DSP (onset detection and dominant frequency extraction) and intersects that physical data with live biological data (iNaturalist regional species occurrences).
3.  **Prompt Engineering for Pedagogical AI:** The Gemini integration was carefully tuned with system prompts to ensure the LLM strictly correlates visual cues in the UI (e.g., "red vertical striations") with their biological meaning (e.g., "high-energy mating pulses"), serving an educational purpose rather than just acting as a generic chatbot.

---

## 🚀 Future Roadmap

*   **OpenAcoustics API Integration:** Replacing mock frequency ranges with a crowdsourced database of measured animal vocal ranges.
*   **Database Persistence:** Integrating PostgreSQL (Supabase) to store user sessions, upload history, and human-verified AI detections for future model fine-tuning.
*   **Export for Raven Pro:** Enabling researchers to export verified detection bounding boxes in formats compatible with Cornell's Raven Pro software.

---

*Designed and developed as a demonstration of Full-Stack Engineering, AI Integration, and Bioacoustic Science.*
