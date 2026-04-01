import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onUpload(acceptedFiles);
    }, [onUpload]);

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
            <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="font-headline text-2xl font-bold text-primary mb-2">Upload Audio</h2>
                <p className="font-body text-sm text-on-surface-variant mb-6">
                    Select or drag and drop your field recordings (.wav, .mp3, .flac up to 500MB).
                </p>

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary-fixed/20' : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                        }`}
                >
                    <input {...getInputProps()} />
                    <span className="material-symbols-outlined text-4xl text-primary mb-3">cloud_upload</span>
                    {isDragActive ? (
                        <p className="font-headline font-bold text-primary">Drop the files here ...</p>
                    ) : (
                        <div className="text-center">
                            <p className="font-headline font-bold text-primary">Drag & drop files here</p>
                            <p className="font-body text-xs text-on-surface-variant mt-1">or click to browse</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};