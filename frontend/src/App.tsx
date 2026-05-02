import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { AIDetectionPanel } from './components/layout/AIDetectionPanel';
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
  
  // NUEVO: Estado para guardar lo que diga la IA
  const [detections, setDetections] = useState<any[]>([]); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpload = async (files: File[], metadata: any) => {
    if (files.length === 0) return;
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('location', metadata.location || '');
    formData.append('altitude', metadata.altitude || '');
    formData.append('habitat', metadata.habitat || '');

    try {
      setIsUploadModalOpen(false);
      
      // 1. Subir Archivo
      const uploadRes = await fetch('http://localhost:8000/api/v1/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        setCurrentAudioId(data.audioId);
        
        // 2. Correr Detección de IA automáticamente
        setIsAnalyzing(true);
        const detectRes = await fetch(`http://localhost:8000/api/v1/audio/${data.audioId}/detect`);
        if (detectRes.ok) {
          const aiData = await detectRes.json();
          setDetections(aiData.detections);
        }
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsAnalyzing(false);
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
            {/* Pasamos las detecciones al espectrograma para dibujar las cajas */}
            <SpectrogramViewer 
              currentAudioId={currentAudioId} 
              detections={detections} // <-- NUEVO
            />
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
        <AIDetectionPanel 
          detections={detections} // <-- NUEVO
          isAnalyzing={isAnalyzing} // <-- NUEVO
        />

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