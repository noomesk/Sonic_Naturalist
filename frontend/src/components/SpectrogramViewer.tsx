import React, { useEffect, useState, useRef } from 'react';
import ReactPlotly from 'react-plotly.js';
import WaveSurfer from 'wavesurfer.js';

// Resolve Vite's default export object wrapping for Plotly
const Plot = (ReactPlotly as any).default || ReactPlotly;

interface SpectrogramViewerProps {
    currentAudioId: string | null;
    detections?: any[];
}

export const SpectrogramViewer: React.FC<SpectrogramViewerProps> = ({ currentAudioId, detections = [] }) => {
    const [spectrogramData, setSpectrogramData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Configuración interactiva de Wavesurfer
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);

    useEffect(() => {
        if (!currentAudioId) return;

        const fetchSpectrogram = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/api/v1/audio/${currentAudioId}/spectrogram`);
                if (response.ok) {
                    const data = await response.json();
                    setSpectrogramData(data);
                }
            } catch (error) {
                console.error("Error fetching spectrogram", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpectrogram();

        // 2. Instanciar Wavesurfer cuando tengamos el ID del audio
        if (waveformRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: 'rgba(235, 245, 240, 0.4)', // Colors that match the Tailwind scheme
                progressColor: '#0F8B5A', // Darker green tone for the reproduced audio
                cursorColor: '#00FA9A', // highlight 
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
                height: 60,
                normalize: true,
            });

            // Enlazamos al nuevo backend stream que acabamos de crear
            wavesurferRef.current.load(`http://localhost:8000/api/v1/audio/${currentAudioId}/stream`);

            wavesurferRef.current.on('play', () => setIsPlaying(true));
            wavesurferRef.current.on('pause', () => setIsPlaying(false));
        }

        // Cleanup the instance on unmount or when ID changes
        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };
    }, [currentAudioId]);

    useEffect(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(volume);
        }
    }, [volume]);

    const togglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    return (
        <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(22,52,40,0.08)] overflow-hidden mb-8">
            {/* Controles Top */}
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-lg">
                        <span className="font-label text-[10px] text-on-surface-variant font-bold">STATUS</span>
                        <span className="font-label text-xs text-primary font-bold">
                            {isLoading ? 'PROCESSING...' : (spectrogramData ? 'LOADED' : 'WAITING FOR AUDIO')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Spectrogram Canvas con Plotly */}
            <div className="relative h-[480px] bg-[#0d1117] group flex items-center justify-center">
                {!currentAudioId && !isLoading && (
                    <p className="text-white/50 font-label tracking-widest text-sm z-10">UPLOAD AUDIO TO START ANALYSIS</p>
                )}

                {isLoading && (
                    <div className="z-10 flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                        <p className="text-primary font-label tracking-widest text-sm">COMPUTING FFT...</p>
                    </div>
                )}

                {spectrogramData && !isLoading && (
                    <Plot
                        data={[
                            {
                                x: spectrogramData.x,
                                y: spectrogramData.y,
                                z: spectrogramData.z,
                                type: 'heatmap',
                                colorscale: 'Jet', // Cambiado a Jet para mostrar azules (bajo), verdes, naranjas y rojos (alto)
                                zmin: -80, // Límite inferior estándar en dBFS para spectrogramas
                                zmax: 0,   // Límite superior estándar
                                colorbar: {
                                    title: { text: "dB", font: { color: "#ffffff", family: "Inter" } },
                                    tickfont: { color: "#ffffff", family: "Inter" }
                                },
                                hovertemplate: 'Tiempo: %{x:.2f} s<br>Frecuencia: %{y:.0f} Hz<br>Amplitud: %{z:.1f} dB<extra></extra>',
                            }
                        ]}
                        layout={{
                            autosize: true,
                            margin: { t: 20, l: 60, r: 10, b: 50 },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            font: { color: '#ffffff', family: "Inter" },
                            xaxis: { 
                                title: { text: "Tiempo (Segundos)", font: { size: 12, color: "#a0a0a0" } },
                                tickfont: { color: "#a0a0a0" },
                                gridcolor: 'rgba(255,255,255,0.05)',
                                zeroline: false
                            },
                            yaxis: { 
                                title: { text: "Frecuencia (Hz)", font: { size: 12, color: "#a0a0a0" } },
                                tickfont: { color: "#a0a0a0" },
                                gridcolor: 'rgba(255,255,255,0.05)',
                                zeroline: false
                            },
                            shapes: detections.map((det) => ({
                                type: 'rect',
                                xref: 'x',
                                yref: 'paper',
                                x0: det.startTime,
                                y0: 0,
                                x1: det.endTime,
                                y1: 1,
                                fillcolor: 'rgba(0, 255, 128, 0.2)',
                                line: { color: 'rgba(0, 255, 128, 0.8)', width: 2 }
                            }))
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                        config={{ displayModeBar: true, scrollZoom: true, responsive: true }}
                    />
                )}
            </div>

            {/* Audio Player Controls Interactive con Wavesurfer */}
            <div className="p-6 bg-surface-container-high border-t border-outline-variant/10">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={togglePlay}
                        disabled={!currentAudioId}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            currentAudioId ? 'bg-primary text-on-primary hover:scale-105 shadow-md shadow-primary/20' : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
                        }`}
                    >
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                    </button>
                    
                    {/* The WaveSurfer DOM Container */}
                    <div className="flex-1 w-full" ref={waveformRef}></div>
                    
                    {/* Controles de Volumen */}
                    <div className="flex items-center gap-3 text-on-surface-variant opacity-80 pl-4 border-l border-outline-variant/10">
                        <span className="material-symbols-outlined text-xl">
                            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                        </span>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-24 h-1.5 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary"
                            style={{ WebkitAppearance: 'slider-horizontal' }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};