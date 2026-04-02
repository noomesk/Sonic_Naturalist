import React from 'react';

export const InsightsGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-6 mt-8">
      <div className="bg-surface-container-high rounded-xl p-6">
        <h4 className="font-headline font-bold text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">analytics</span>
          Model Statistics
        </h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-label text-on-surface-variant font-medium">ANALYSIS PROGRESS</span>
              <span className="text-xs font-label text-primary font-bold">84%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[84%]"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-label text-on-surface-variant font-medium">SNR RATIO</span>
              <span className="text-xs font-label text-primary font-bold">12.4 dB</span>
            </div>
            <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-[65%]"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-primary text-white rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="font-headline font-bold mb-1 opacity-80">Research Note</h4>
          <p className="text-sm font-body leading-relaxed mb-4">High frequency components detected between 2s and 4s suggest multiple individuals calling in sequence.</p>
          <button className="text-xs font-label font-bold py-2 px-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors">ADD ANNOTATION</button>
        </div>
        <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-9xl opacity-5">sticky_note_2</span>
      </div>
    </div>
  );
};
