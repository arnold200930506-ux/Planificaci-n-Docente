import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Limpieza de cualquier Service Worker antiguo y registro no bloqueante
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Desregistrar caches viejos que pudieran haber quedado registrados en Safari/Chrome
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.update();
      }
    }).catch(() => {});

    // Registro seguro
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker activo y verificado:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker omitido:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
