import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Handle dynamic import / chunk load errors globally
const handleChunkError = (message: string) => {
  if (message && (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('chunk')
  )) {
    const lastReload = localStorage.getItem('last_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      localStorage.setItem('last_chunk_reload', now.toString());
      window.location.reload();
    }
  }
};

window.addEventListener('error', (e) => {
  handleChunkError(e.message);
}, true);

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  if (reason) {
    handleChunkError(reason.message || String(reason));
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
