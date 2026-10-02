import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-fade-in border border-emerald-400/30">
        <Wifi className="w-4 h-4 text-emerald-200" />
        <span>Conexión restablecida. Sincronizando con la nube...</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-amber-300 shadow-2xl border border-amber-500/40 animate-pulse">
      <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
      <span>Modo sin conexión activo — Los datos se guardan en el dispositivo.</span>
    </div>
  );
};
