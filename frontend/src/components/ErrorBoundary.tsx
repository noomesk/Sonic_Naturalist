import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 p-8">
          <div className="max-w-4xl w-full bg-red-950 border-2 border-red-500 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-red-400 text-3xl font-bold mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl">warning</span>
              UI Crash Detected
            </h2>
            <div className="bg-black rounded-lg p-6 overflow-x-auto max-h-[60vh] overflow-y-auto">
              <code className="text-green-400 whitespace-pre-wrap font-mono text-sm">
                <strong className="text-red-300 text-lg block mb-4">{this.state.error?.toString()}</strong>
                {this.state.error?.stack}
              </code>
            </div>
            <p className="text-red-200 mt-6 font-bold text-center text-lg animate-pulse">
              [ ⚠️ COPIA EL TEXTO EN VERDE/ROJO Y PÉGALO EN EL CHAT ⚠️ ]
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
