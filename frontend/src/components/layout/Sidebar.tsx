import React from 'react';

interface SidebarProps {
    activeSection: 'field-journal' | 'spectrogram' | 'ai-detection' | 'recordings' | 'settings';
    onSectionChange: (section: string) => void;
    onUploadClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeSection,
    onSectionChange,
    onUploadClick
}) => {
    const navItems = [
        { id: 'field-journal', icon: 'menu_book', label: 'Field Journal' },
        { id: 'spectrogram', icon: 'graphic_eq', label: 'Spectrogram' },
        { id: 'ai-detection', icon: 'biotech', label: 'AI Detection' },
        { id: 'recordings', icon: 'mic', label: 'Recordings' },
        { id: 'settings', icon: 'settings', label: 'Settings' },
    ];

    return (
        <nav className="fixed left-0 top-0 w-64 flex flex-col z-40 bg-[#f5f3ee]/80 dark:bg-[#1b1c19]/80 backdrop-blur-xl rounded-r-2xl h-[calc(100vh-2rem)] my-4 ml-4 shadow-[0_12px_32px_-4px_rgba(22,52,40,0.08)]">
            <div className="p-6">
                {/* Logo y Título */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">biotech</span>
                    </div>
                    <div>
                        <h1 className="font-headline font-bold text-primary leading-none text-lg">Sonic Naturalist</h1>
                        <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mt-1">Frog Call Analysis</p>
                    </div>
                </div>

                {/* Navegación */}
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onSectionChange(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-full transition-all duration-300 ease-in-out ${isActive
                                        ? 'bg-[#2D4B3E] text-white'
                                        : 'text-stone-600 dark:text-stone-400 hover:bg-[#eae8e3] dark:hover:bg-stone-800 hover:translate-x-1'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-body text-sm font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Botón Upload Sticky */}
            <div className="mt-auto p-6">
                <button
                    onClick={onUploadClick}
                    className="w-full py-4 bg-primary text-white rounded-full font-headline font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                >
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    Upload Audio
                </button>
            </div>
        </nav>
    );
};