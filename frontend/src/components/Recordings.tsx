import React from 'react';

export const Recordings: React.FC = () => {
  const mockFiles = [
    { id: '1', name: 'FIELD_RECORDING_004.wav', date: '2026-04-01', size: '24 MB', species: 3 },
    { id: '2', name: 'NIGHT_MONITOR_A_01.wav', date: '2026-04-01', size: '112 MB', species: 8 },
    { id: '3', name: 'POND_SOUTH_002.wav', date: '2026-03-28', size: '45 MB', species: 1 },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline text-2xl font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">library_music</span>
          Audio Library
        </h2>
        {/* El Botón Sagrado de Exportación a Raven */}
        <button className="px-6 py-2 bg-secondary text-white rounded-full font-headline font-bold text-sm flex items-center gap-2 hover:bg-secondary/90 transition-colors shadow-sm">
          <span className="material-symbols-outlined text-lg">ios_share</span>
          Export to Raven (.txt)
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low font-label text-xs text-on-surface-variant uppercase tracking-wider">
              <th className="p-4 font-bold">Filename</th>
              <th className="p-4 font-bold">Upload Date</th>
              <th className="p-4 font-bold">Size</th>
              <th className="p-4 font-bold">Species Found</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm">
            {mockFiles.map((file) => (
              <tr key={file.id} className="border-t border-outline-variant/10 hover:bg-surface-container-lowest transition-colors">
                <td className="p-4 font-medium text-primary">{file.name}</td>
                <td className="p-4 text-on-surface-variant">{file.date}</td>
                <td className="p-4 text-on-surface-variant">{file.size}</td>
                <td className="p-4">
                  <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-xs font-bold">{file.species} detected</span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-secondary hover:text-primary transition-colors p-2">
                    <span className="material-symbols-outlined">play_arrow</span>
                  </button>
                  <button className="text-secondary hover:text-primary transition-colors p-2">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
