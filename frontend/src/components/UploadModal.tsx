import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export interface AudioMetadata {
    location: string;
    altitude: string;
    habitat: string;
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[], metadata: AudioMetadata) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [metadata, setMetadata] = useState<AudioMetadata>({ location: '', altitude: '', habitat: '' });
    
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onUpload(acceptedFiles, metadata);
    }, [onUpload, metadata]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'audio/wav': ['.wav'],
            'audio/mpeg': ['.mp3'],
            'audio/flac': ['.flac']
        },
        maxSize: 524288000 // 500MB
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="font-headline text-2xl font-bold text-primary mb-2">Subir Audio y Metadatos</h2>
                <p className="font-body text-sm text-on-surface-variant mb-6">
                    Ingresa el contexto ecológico para mejorar la predicción de la IA y luego selecciona el archivo.
                </p>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-label text-on-surface-variant mb-1">País / Región</label>
                        <input 
                            type="text" 
                            placeholder="Ej. Chocó, Colombia"
                            value={metadata.location}
                            onChange={(e) => setMetadata({...metadata, location: e.target.value})}
                            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-label text-on-surface-variant mb-1">Altitud (m.s.n.m)</label>
                            <input 
                                type="number" 
                                placeholder="Ej. 1200"
                                value={metadata.altitude}
                                onChange={(e) => setMetadata({...metadata, altitude: e.target.value})}
                                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-label text-on-surface-variant mb-1">Tipo de Hábitat</label>
                            <input 
                                type="text" 
                                placeholder="Ej. Bosque de Niebla"
                                value={metadata.habitat}
                                onChange={(e) => setMetadata({...metadata, habitat: e.target.value})}
                                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2 text-on-surface focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary-fixed/20' : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                        }`}
                >
                    <input {...getInputProps()} />
                    <span className="material-symbols-outlined text-4xl text-primary mb-3">cloud_upload</span>
                    {isDragActive ? (
                        <p className="font-headline font-bold text-primary">Suelta los archivos aquí...</p>
                    ) : (
                        <div className="text-center">
                            <p className="font-headline font-bold text-primary">Arrastra & suelta el audio aquí</p>
                            <p className="font-body text-xs text-on-surface-variant mt-1">o haz clic para explorar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};