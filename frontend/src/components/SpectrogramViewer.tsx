import React from 'react';

interface TimeRegion {
    start: number;
    end: number;
}

interface Detection {
    id: string;
    startTime: number;
    endTime: number;
    frequency: [number, number];
    label: string;
    confidence: number;
}

interface SpectrogramViewerProps {
    audioFile: File | null;
    spectrogramData: Float32Array[] | null;
    frequencyRange: [number, number];
    timeRange: [number, number];
    gain: number;
    onRegionSelect: (region: TimeRegion) => void;
    detections: Detection[];
}

export const SpectrogramViewer: React.FC<SpectrogramViewerProps> = ({
    frequencyRange,
    gain,
    detections
}) => {
    return (
        <section className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(22,52,40,0.08)] overflow-hidden mb-8">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-lg">
                        <span className="font-label text-[10px] text-on-surface-variant font-bold">RANGE</span>
                        <span className="font-label text-xs text-primary font-bold">{frequencyRange[0]}Hz - {frequencyRange[1] / 1000}kHz</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-lg">
                        <span className="font-label text-[10px] text-on-surface-variant font-bold">GAIN</span>
                        <span className="font-label text-xs text-primary font-bold">{gain > 0 ? `+${gain}` : gain}dB</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">zoom_in</span></button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">zoom_out</span></button>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">settings_input_component</span></button>
                </div>
            </div>

            {/* Spectrogram Visualization Area */}
            <div className="relative h-[480px] bg-neutral-900 group">
                <img alt="Spectrogram frequency visualization" className="w-full h-full object-cover opacity-60 mix-blend-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdnkl-mpqdFCBmMYnsyZl8S27dZvNLptWf6H7WIxxv4lYp_hcvgR6A2KELfW3eTj2quQl3_PFFKk-TkjSDSaapU1rFBOiXsL0XJ8VWN8fi70jsWjxeN2gDvfu1Q3vhgUTlJqLml-xkwwrtZmdsKat8qFLf5IAbIaNCymT0tUrQv0B95eg9X8cCI_DbdVYpirRYP7YUNk_vF0kTzEtqwNAtTDiRLabD6VoY7GSCrj3DjFaK_H1zeOb_SwvivvT1cy-6ASxZPpvNDGrC" />
                
                {/* Overlay Grids & Markers */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                    <div className="flex justify-between w-full font-label text-[10px] text-primary-fixed-dim/50">
                        <span>20kHz</span>
                        <span>15kHz</span>
                        <span>10kHz</span>
                        <span>5kHz</span>
                        <span>0Hz</span>
                    </div>
                </div>
                
                {/* Cajas de Detección Dinámicas */}
                {detections.map((det, idx) => (
                    <div
                        key={det.id}
                        className={`absolute border-2 rounded-lg flex flex-col justify-start p-2 ${
                            idx % 2 === 0 
                                ? 'border-primary-fixed-dim/40 bg-primary-fixed-dim/10' 
                                : 'border-secondary-fixed-dim/40 bg-secondary-fixed-dim/10'
                        }`}
                        style={{
                            left: idx === 0 ? '33%' : '66%', 
                            top: idx === 0 ? '25%' : '50%', 
                            width: idx === 0 ? '96px' : '64px', 
                            height: idx === 0 ? '160px' : '96px'
                        }}
                    >
                        <span className={`text-[8px] font-label font-bold text-white px-1 rounded w-max ${
                            idx % 2 === 0 ? 'bg-primary' : 'bg-secondary'
                        }`}>
                            {det.label}
                        </span>
                    </div>
                ))}
                
                {/* Scrub Bar */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10"></div>
            </div>

            {/* Modern Audio Player Controls */}
            <div className="p-8 bg-surface-container-low">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4">
                        <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </button>
                        <div className="flex flex-col">
                            <span className="font-headline font-bold text-primary truncate w-40">FIELD_RECORDING_004.wav</span>
                            <span className="font-label text-xs text-on-surface-variant uppercase tracking-wide">04:12 / 12:45</span>
                        </div>
                    </div>
                    {/* Waveform Visualization */}
                    <div className="flex-1 flex items-center gap-[2px] h-12 px-4">
                        <div className="waveform-bar w-1 bg-primary/20 h-4 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-6 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-3 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary h-8 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary h-10 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary h-12 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary h-6 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary h-8 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary h-4 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-5 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-3 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-7 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-9 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-4 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-6 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-3 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-8 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-10 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-12 rounded-full"></div>
                        <div className="waveform-bar w-1 bg-primary/20 h-6 rounded-full"></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">volume_up</span>
                        <div className="w-24 h-1 bg-outline-variant rounded-full relative">
                            <div className="absolute inset-0 w-3/4 bg-primary rounded-full"></div>
                            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};