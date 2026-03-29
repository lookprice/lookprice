import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  lang?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { lang = 'tr' } = this.props;
    const isTr = lang === 'tr';

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-2xl border border-red-100 shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {isTr ? 'Bir şeyler ters gitti' : 'Something went wrong'}
          </h2>
          <p className="text-slate-500 text-center max-w-md mb-8">
            {isTr 
              ? 'Üzgünüz, bu bölüm yüklenirken bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.' 
              : 'Sorry, an error occurred while loading this section. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <RefreshCw className="w-4 h-4" />
            {isTr ? 'Sayfayı Yenile' : 'Refresh Page'}
          </button>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-slate-50 rounded-lg w-full overflow-auto max-h-40 border border-slate-200">
              <p className="text-xs font-mono text-red-600 whitespace-pre-wrap">
                {this.state.error?.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
