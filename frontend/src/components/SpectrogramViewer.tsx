import React, { useEffect, useState } from 'react';
import ReactPlotly from 'react-plotly.js';

// Resolve Vite's default export object wrapping for Plotly
const Plot = (ReactPlotly as any).default || ReactPlotly;

interface SpectrogramViewerProps {
    currentAudioId: string | null;
    detections?: any[];
}

export const SpectrogramViewer: React.FC<SpectrogramViewerProps> = ({ currentAudioId, detections = [] }) => {
    const [spectrogramData, setSpectrogramData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

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
    }, [currentAudioId]);

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
                                colorscale: 'Inferno', // Colormap científico clásico
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

            {/* Audio Player Controls Estático (Por ahora) */}
            <div className="p-8 bg-surface-container-low border-t border-outline-variant/10">
                <p className="text-xs text-on-surface-variant text-center">Audio Player Controls (Pending integration with wavesurfer.js)</p>
            </div>
        </section>
    );
};