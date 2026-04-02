import React, { useEffect, useState } from 'react';
import ReactPlotly from 'react-plotly.js';

// Resolve Vite's default export object wrapping for Plotly
const Plot = (ReactPlotly as any).default || ReactPlotly;

interface SpectrogramViewerProps {
    currentAudioId: string | null;
}

export const SpectrogramViewer: React.FC<SpectrogramViewerProps> = ({ currentAudioId }) => {
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
                                z: spectrogramData.z,
                                type: 'heatmap',
                                colorscale: 'Inferno', // Colormap científico clásico
                                showscale: false, // Ocultamos la barra lateral de color para mantener diseño limpio
                                hoverinfo: 'none'
                            }
                        ]}
                        layout={{
                            autosize: true,
                            margin: { t: 0, l: 0, r: 0, b: 0 },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            xaxis: { visible: false, fixedrange: false },
                            yaxis: { visible: false, fixedrange: false },
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, opacity: 0.85, mixBlendMode: 'screen' }}
                        config={{ displayModeBar: false, scrollZoom: true }}
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