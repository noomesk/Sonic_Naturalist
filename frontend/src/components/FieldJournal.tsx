import React, { useState } from 'react';

export const FieldJournal: React.FC = () => {
  const [notes, setNotes] = useState('');

  return (
    <div className="max-w-4xl mx-auto bg-surface-container-lowest rounded-xl shadow-sm p-8">
      <h2 className="font-headline text-2xl font-bold text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined">menu_book</span>
        Field Journal & Metadata
      </h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Environmental Data */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
            <label className="font-label text-xs font-bold text-on-surface-variant uppercase">Temperature (°C)</label>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-secondary">device_thermostat</span>
              <input type="number" defaultValue={24.5} className="bg-transparent text-xl font-headline font-bold text-primary w-full focus:outline-none" />
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
            <label className="font-label text-xs font-bold text-on-surface-variant uppercase">Humidity (%)</label>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-secondary">humidity_percentage</span>
              <input type="number" defaultValue={82} className="bg-transparent text-xl font-headline font-bold text-primary w-full focus:outline-none" />
            </div>
          </div>
          <div className="col-span-2 bg-surface-container-low p-4 rounded-lg border border-outline-variant/20">
            <label className="font-label text-xs font-bold text-on-surface-variant uppercase">GPS Coordinates</label>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-secondary">location_on</span>
              <input type="text" defaultValue="4.6097° N, 74.0817° W" className="bg-transparent text-lg font-body text-primary w-full focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Acoustic Indices (Auto-calculated) */}
        <div className="bg-primary-container text-on-primary-container p-6 rounded-xl flex flex-col justify-center items-center text-center">
          <span className="material-symbols-outlined text-4xl mb-2 opacity-80">forest</span>
          <h3 className="font-label text-xs font-bold uppercase tracking-widest opacity-80">Acoustic Complexity (ACI)</h3>
          <p className="font-headline text-4xl font-extrabold mt-2">0.78</p>
          <p className="text-xs mt-2 opacity-70">High biological activity detected</p>
        </div>
      </div>

      {/* Rich Text Notes */}
      <div>
        <label className="font-label text-xs font-bold text-on-surface-variant uppercase mb-2 block">Observation Notes</label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Lluvia moderada durante los primeros 5 minutos. Alta actividad de H. cinerea..."
          className="w-full h-40 bg-surface-container-low border border-outline-variant/20 rounded-lg p-4 font-body text-sm focus:outline-none focus:border-primary resize-none"
        ></textarea>
        <div className="flex justify-end mt-4">
          <button className="px-6 py-2 bg-primary text-white rounded-full font-headline font-bold text-sm hover:opacity-90 transition-opacity">
            Save Metadata
          </button>
        </div>
      </div>
    </div>
  );
};
