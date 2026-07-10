import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Bir hata oluştu</h1>
          <p className="max-w-md text-sm text-slate-600">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
          >
            Oturumu temizle ve yeniden dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
