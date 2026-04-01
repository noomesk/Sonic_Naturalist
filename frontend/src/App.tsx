import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { SpectrogramViewer } from './components/SpectrogramViewer';
import { UploadModal } from './components/UploadModal';

function App() {
  const [activeSection, setActiveSection] = useState('spectrogram');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Mock data para renderizar el UI inicialmente
  const mockDetections = [
    { id: '1', startTime: 2.14, endTime: 3.5, frequency: [1500, 3000] as [number, number], label: 'L. catesbeianus', confidence: 0.94 },
    { id: '2', startTime: 4.1, endTime: 5.2, frequency: [4000, 6000] as [number, number], label: 'H. cinerea', confidence: 0.88 }
  ];

  // ¡Esta es la función que querías agregar, ahora correctamente dentro del componente!
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // Seleccionamos el primer archivo (para esta prueba)
    const fileToUpload = files[0];
    console.log(`Subiendo: ${fileToUpload.name}...`);

    // Preparamos el FormData (FastAPI espera que el campo se llame exactamente 'file')
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      // Hacemos la petición a la ruta que creamos en FastAPI
      const response = await fetch('http://localhost:8000/api/v1/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ ¡Éxito del Backend!', data);
        alert(`¡Archivo subido! El servidor le asignó el ID:\n${data.audioId}`);
        setIsUploadModalOpen(false);
      } else {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        alert(`Error: ${errorData.detail || 'No se pudo subir el archivo'}`);
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      alert('Error de conexión. ¿Está el backend encendido?');
    }
  };

  return (
    <div className="flex bg-surface min-h-screen font-body text-on-surface">
      <div className="grain-overlay"></div>

      {/* 1. Columna Izquierda: Sidebar */}
      <Sidebar
        activeSection={activeSection as any}
        onSectionChange={setActiveSection}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      {/* 2. Columna Central: Main Canvas */}
      <main className="ml-72 mr-80 pt-8 pb-12 px-8 min-h-screen w-full relative z-10">
        <header className="flex justify-between items-end mb-8">
          <div>
            <p className="font-label text-xs uppercase tracking-widest text-secondary mb-1">Session ID: #29402-B</p>
            <h2 className="font-headline text-3xl font-extrabold text-primary tracking-tight">Spectrogram Analysis</h2>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-2 bg-surface-container-high text-primary font-headline font-bold text-sm rounded-full flex items-center gap-2 hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-lg">file_download</span>
              Export Data
            </button>
            <button className="px-8 py-2 bg-primary-container text-on-primary-container font-headline font-bold text-sm rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-lg">play_circle</span>
              Process Stream
            </button>
          </div>
        </header>

        {activeSection === 'spectrogram' && (
          <>
            <SpectrogramViewer
              audioFile={null}
              spectrogramData={null}
              frequencyRange={[20, 22000]}
              timeRange={[0, 10]}
              gain={4.2}
              onRegionSelect={(region) => console.log('Selected:', region)}
              detections={mockDetections}
            />

            {/* Insights Grid */}
            <div className="grid grid-cols-2 gap-6">
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
          </>
        )}
      </main>

      {/* 3. Columna Derecha: AI Sidebar */}
      <aside className="fixed right-0 top-0 bottom-0 w-80 bg-surface-container-low border-l border-outline-variant/10 p-6 z-40 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-headline font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">auto_awesome</span>
            AI Detections
          </h3>
          <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-label font-bold rounded">RIBBIT v2.1</span>
        </div>

        {/* Top Result Card */}
        <div className="bg-surface-container-lowest rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-label text-on-surface-variant font-bold uppercase tracking-wider">Most Probable</span>
              <h4 className="font-headline text-lg font-extrabold italic text-primary">Lithobates catesbeianus</h4>
              <p className="text-xs text-on-surface-variant">American Bullfrog</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-label font-bold text-sm">
              94%
            </div>
          </div>
          <img alt="Bullfrog in natural habitat" className="w-full h-32 object-cover rounded-lg mb-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0WGTC9zT0fluMkYczp442usN1W8PCpdNhHks_8gwYRWEl_osaMpPnieEkzAQMSArM04ciXOs8-3JERp3qnGWvDq_jRwNCVzmv9nxIaqFepB3ZtVjWVzw9gppYS9EFZw-2UuAxsS9MT2UyBJxZ8jP2ZAawpfirNWQVtbTZwUfnAPONz1Nyt04uRR0P4zjCrGAZwfXTgieMES8FMCcPBasK-2y6xBPDjWy6T6Mdn0adrEAfspJagWWIpUlqCL-sSNUvObN7k7gXCoi_" />
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-variant rounded-full">
              <div className="h-full bg-primary w-[94%] rounded-full"></div>
            </div>
            <span className="text-[10px] font-label font-bold text-primary">CONFIDENCE</span>
          </div>
        </div>

        {/* Detected Events List */}
        <h5 className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Detected Events</h5>
        <div className="space-y-3">
          <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between group hover:bg-surface-container-high cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-sm">schedule</span>
              <div>
                <p className="text-sm font-label font-bold text-primary">00:02:14</p>
                <p className="text-[10px] text-on-surface-variant">Vocalization Pattern A</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">play_circle</span>
          </div>
          <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between group hover:bg-surface-container-high cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-sm">schedule</span>
              <div>
                <p className="text-sm font-label font-bold text-primary">00:02:45</p>
                <p className="text-[10px] text-on-surface-variant">Multiple Overlap</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">play_circle</span>
          </div>
          <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between group hover:bg-surface-container-high cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-sm">schedule</span>
              <div>
                <p className="text-sm font-label font-bold text-primary">00:03:12</p>
                <p className="text-[10px] text-on-surface-variant">High Frequency Pulse</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">play_circle</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant/10">
          <button className="w-full py-3 rounded-xl border border-primary/20 text-primary font-headline font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined text-lg">search_check</span>
            Verify Detections
          </button>
        </div>
      </aside>

      {/* Modales */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

export default App;