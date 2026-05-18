import React, { useEffect, useState, useRef } from 'react';

interface TranscriptItem {
    start: number;
    end: number;
    text: string;
}

interface AITranscriptProps {
    audioId: string | null;
    playbackTime: number;
}

export const AITranscript: React.FC<AITranscriptProps> = ({ audioId, playbackTime }) => {
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!audioId) return;

        const fetchInterpretation = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/api/v1/audio/${audioId}/interpret`);
                if (response.ok) {
                    const data = await response.json();
                    setTranscript(data.transcript || []);
                }
            } catch (error) {
                console.error("Error fetching interpretation:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInterpretation();
    }, [audioId]);

    useEffect(() => {
        // Auto-scroll logic: find active item and scroll to it
        const activeIndex = transcript.findIndex(item => playbackTime >= item.start && playbackTime < item.end);
        if (activeIndex !== -1 && itemRefs.current[activeIndex] && containerRef.current) {
            const activeEl = itemRefs.current[activeIndex]!;
            const containerEl = containerRef.current;
            
            // Center the active element in the scroll container
            const topPos = activeEl.offsetTop - (containerEl.offsetHeight / 2) + (activeEl.offsetHeight / 2);
            containerEl.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
        }
    }, [playbackTime, transcript]);

    if (!audioId) return null;

    return (
        <div className="bg-[#080d12] border-t border-outline-variant/10 p-8 flex flex-col gap-4 max-h-[280px] overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-[#00FA9A] text-2xl animate-pulse">precision_manufacturing</span>
                <span className="font-headline font-bold text-sm text-[#00FA9A] uppercase tracking-widest">Intérprete Analista (IA) en Vivo</span>
            </div>
            
            {isLoading ? (
                <div className="text-on-surface-variant font-body text-sm animate-pulse flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                    Escaneando matriz de frecuencias y eventos acústicos...
                </div>
            ) : (
                <div 
                    ref={containerRef}
                    className="flex flex-col gap-4 overflow-y-auto pr-4"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {transcript.length === 0 && (
                        <p className="text-on-surface-variant/50 italic text-sm">Esperando datos acústicos para interpretación...</p>
                    )}
                    {transcript.map((item, idx) => {
                        const isActive = playbackTime >= item.start && playbackTime < item.end;
                        const isPast = playbackTime >= item.end;
                        return (
                            <div 
                                key={idx}
                                ref={el => itemRefs.current[idx] = el}
                                className={`transition-all duration-500 border-l-4 pl-5 py-2 flex flex-col gap-1 ${
                                    isActive 
                                        ? 'border-[#00FA9A] bg-[#00FA9A]/5 text-on-surface font-medium transform scale-[1.01]' 
                                        : isPast
                                            ? 'border-surface-variant/30 text-on-surface-variant/40'
                                            : 'border-transparent text-on-surface-variant/20'
                                }`}
                            >
                                <span className={`font-label text-[11px] tracking-widest ${isActive ? 'opacity-80 text-[#00FA9A]' : 'opacity-40'}`}>
                                    [{item.start.toFixed(1)}s - {item.end.toFixed(1)}s]
                                </span>
                                <p className={`font-body text-base leading-relaxed ${isActive ? 'text-white' : ''}`}>
                                    {item.text}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
