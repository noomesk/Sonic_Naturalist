import React from 'react';

interface AIDetectionPanelProps {
  detections: any[];
  isAnalyzing: boolean;
}

export const AIDetectionPanel: React.FC<AIDetectionPanelProps> = ({ detections, isAnalyzing }) => {
  return (
    <aside className="fixed right-0 top-0 bottom-0 w-80 bg-surface-container-low border-l border-outline-variant/10 p-6 z-40 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-headline font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">auto_awesome</span>
          AI Detections
        </h3>
        <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-label font-bold rounded">RIBBIT v2.1</span>
      </div>

      {/* Top Result Card */}
      {detections && detections.length > 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-label text-on-surface-variant font-bold uppercase tracking-wider">Most Probable</span>
              <h4 className="font-headline text-lg font-extrabold italic text-primary leading-tight mt-1">{detections[0].label}</h4>
              <p className="text-[10px] text-on-surface-variant/80 mt-2 leading-snug">AI detection confidence is high for this species pattern.</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-label font-bold text-sm shrink-0">
              {Math.round(detections[0].confidence * 100)}%
            </div>
          </div>
          <img alt="Detected amphibian" className="w-full h-auto max-h-48 object-contain rounded-lg mb-4" src="/rana.PNG" />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-variant rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: `${detections[0].confidence * 100}%` }}></div>
            </div>
            <span className="text-[10px] font-label font-bold text-primary">CONFIDENCE</span>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-5 mb-6 shadow-sm flex flex-col items-center justify-center min-h-[160px]">
            {isAnalyzing ? (
               <div className="text-center flex flex-col items-center">
                 <span className="material-symbols-outlined text-primary text-4xl animate-spin mb-4" style={{ animationDuration: '2s' }}>sync</span>
                 <p className="text-primary font-label font-bold text-sm uppercase tracking-wider">Analyzing Audio...</p>
               </div>
            ) : (
               <p className="text-on-surface-variant text-sm font-label text-center">No audio uploaded or no events detected by RIBBIT.</p>
            )}
        </div>
      )}

      {/* Detected Events List with Human Validation */}
      <h5 className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Detection Validation</h5>
      <div className="space-y-3">
        {detections && detections.length > 0 ? detections.map((event) => (
          <div key={event.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
            event.status === 'verified' ? 'bg-[#c8ead8]/30 border-[#c8ead8]' : 
            event.status === 'rejected' ? 'bg-[#ffdad6]/30 border-[#ffdad6]' : 
            'bg-surface-container border-transparent hover:bg-surface-container-high'
          }`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-sm">
                {event.status === 'verified' ? 'check_circle' : event.status === 'rejected' ? 'cancel' : 'schedule'}
              </span>
              <div>
                <p className="text-sm font-label font-bold text-primary">{event.startTime.toFixed(2)}s - {event.endTime.toFixed(2)}s</p>
                <p className="text-[10px] text-on-surface-variant">{event.label} ({Math.round(event.confidence * 100)}%)</p>
              </div>
            </div>
            
            {/* Validation Actions */}
            {event.status === 'pending' && (
              <div className="flex gap-1">
                <button title="Verify" className="w-8 h-8 flex items-center justify-center rounded-full text-[#163428] hover:bg-[#c8ead8] transition-colors">
                  <span className="material-symbols-outlined text-sm">check</span>
                </button>
                <button title="Reject" className="w-8 h-8 flex items-center justify-center rounded-full text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
        )) : null}
      </div>

      <div className="mt-8 pt-6 border-t border-outline-variant/10">
        <button className="w-full py-3 rounded-xl border border-primary/20 text-primary font-headline font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
          <span className="material-symbols-outlined text-lg">search_check</span>
          Verify Detections
        </button>
      </div>
    </aside>
  );
};
