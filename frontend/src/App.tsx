import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { SpectrogramViewer } from './components/SpectrogramViewer';
import { InsightsGrid } from './components/InsightsGrid';
import { UploadModal } from './components/UploadModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FieldJournal } from './components/FieldJournal'; // <-- NUEVO
import { Recordings } from './components/Recordings';     // <-- NUEVO
function App() {
  const [activeSection, setActiveSection] = useState('spectrogram');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null); // <--- NUEVO

  // Mock data para renderizar el UI inicialmente
  const mockDetections = [
    { id: '1', startTime: 2.14, endTime: 3.5, frequency: [1500, 3000] as [number, number], label: 'L. catesbeianus', confidence: 0.94 },
    { id: '2', startTime: 4.1, endTime: 5.2, frequency: [4000, 6000] as [number, number], label: 'H. cinerea', confidence: 0.88 }
  ];

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await fetch('http://localhost:8000/api/v1/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentAudioId(data.audioId); // <--- Guardamos el ID aquí
        setIsUploadModalOpen(false);
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };
  // Función para renderizar el contenido central basado en el menú
  const renderMainContent = () => {
    switch (activeSection) {
      case 'field-journal':
        return <FieldJournal />;
      case 'recordings':
        return <Recordings />;
      case 'spectrogram':
      case 'ai-detection': // Para MVP, si clickean AI detection, mostramos el espectro porque la IA está en la barra lateral
      default:
        return (
          <>
            <SpectrogramViewer currentAudioId={currentAudioId} />
            <InsightsGrid />
          </>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex bg-surface min-h-screen font-body text-on-surface">
        <div className="grain-overlay"></div>

        {/* 1. Columna Izquierda: Sidebar */}
        <Sidebar
          activeSection={activeSection as any}
          onSectionChange={setActiveSection}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />

        {/* 2. Main Canvas (Centro) */}
        <main className="ml-[280px] mr-[320px] pt-8 pb-12 px-8 min-h-screen w-full relative z-10">
          {/* Top Action Bar */}
          <header className="flex justify-between items-end mb-8">
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-secondary mb-1">Session ID: #29402-B</p>
              <h2 className="font-headline text-3xl font-extrabold text-primary tracking-tight">
                {activeSection === 'field-journal' ? 'Field Journal' : 
                 activeSection === 'recordings' ? 'Audio Library' : 
                 'Spectrogram Analysis'}
              </h2>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-surface-container-high text-primary font-headline font-bold text-sm rounded-full flex items-center gap-2 hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined text-lg">file_download</span>
                Export Data
              </button>
            </div>
          </header>

          {/* Contenido Dinámico */}
          {renderMainContent()}

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
                <h4 className="font-headline text-lg font-extrabold italic text-primary leading-tight mt-1">Dendrobates truncatus</h4>
                <p className="text-xs text-on-surface-variant font-bold mt-1">Yellow-striped poison frog</p>
                <p className="text-[10px] text-on-surface-variant/80 mt-2 leading-snug">The yellow-striped poison frog (Dendrobates truncatus) is classified as Critically Endangered (CR) at the national level in Colombia, according to Resolution 1912 of 2017 and the Red Book of Amphibians.</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-label font-bold text-sm shrink-0">
                94%
              </div>
            </div>
            <img alt="Dendrobates truncatus in natural habitat" className="w-full h-auto max-h-48 object-contain rounded-lg mb-4" src="/rana.PNG" />
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-variant rounded-full">
                <div className="h-full bg-primary w-[94%] rounded-full"></div>
              </div>
              <span className="text-[10px] font-label font-bold text-primary">CONFIDENCE</span>
            </div>
          </div>

          {/* Detected Events List with Human Validation */}
          <h5 className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Detection Validation</h5>
          <div className="space-y-3">
            {[
              { id: 1, time: '00:02:14', desc: 'L. catesbeianus (94%)', status: 'pending' },
              { id: 2, time: '00:02:45', desc: 'H. cinerea (88%)', status: 'verified' },
              { id: 3, time: '00:03:12', desc: 'Unknown Pulse', status: 'rejected' }
            ].map((event) => (
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
                    <p className="text-sm font-label font-bold text-primary">{event.time}</p>
                    <p className="text-[10px] text-on-surface-variant">{event.desc}</p>
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
            ))}
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
    </ErrorBoundary>
  );
}

export default App;