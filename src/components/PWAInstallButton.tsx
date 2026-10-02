import React, { useState } from 'react';
import { 
  Download, 
  Monitor, 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Sparkles,
  Laptop,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'banner' | 'modal' | 'header';
  onDismiss?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'sidebar',
  onDismiss
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success'>('idle');

  // If already running in standalone mode (desktop or mobile app installed)
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-[11px] font-bold text-emerald-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Aplicación Instalada en el Dispositivo</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstallStatus('installing');
      const success = await install();
      if (success) {
        setInstallStatus('success');
      } else {
        setInstallStatus('idle');
      }
    } else {
      // Show manual install guide for desktop or mobile
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Sidebar Variant */}
      {variant === 'sidebar' && (
        <div className="p-3.5 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-blue-950/90 rounded-2xl border border-indigo-500/30 text-white space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center shadow-xs">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">Instalar Programa</p>
                <p className="text-[10px] text-indigo-300">Windows, Mac & Móvil</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-400 text-slate-950">
              PWA
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-tight">
            Instala la plataforma como una aplicación de escritorio o app móvil para acceso rápido sin navegador.
          </p>

          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstallable ? 'Instalar en este Dispositivo' : 'Cómo Instalar Programa'}</span>
          </button>
        </div>
      )}

      {/* Guide Modal for Desktop & iOS / Android */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-amber-300 flex items-center justify-center shadow-md">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Instalar Sistema de Planificación MINERD
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instalable en Computadoras (Windows / Mac) y Teléfonos (Android / iPhone)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Tabs / Steps */}
            <div className="space-y-4 text-xs">
              
              {/* Option A: Windows / Mac / Chrome / Edge */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs">
                  <Monitor className="w-4 h-4" />
                  <span>En Computadora (Google Chrome, Microsoft Edge, Brave):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                  <li>
                    Busca el ícono de <strong>Instalar Aplicación</strong> (icono de monitor o flecha <Download className="inline w-3 h-3 text-amber-300" />) en la parte derecha de la barra de direcciones de tu navegador.
                  </li>
                  <li>
                    Haz clic en <strong>"Instalar Sistema de Planificación Docente"</strong>.
                  </li>
                  <li>
                    ¡Listo! Se creará un acceso directo en tu <strong>Escritorio y Menú de Inicio</strong> para abrirla en su propia ventana sin barra de direcciones.
                  </li>
                </ol>
              </div>

              {/* Option B: Android */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>En Teléfonos Android:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Presiona el menú de 3 puntos <strong>(⋮)</strong> de Chrome y pulsa <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                </p>
              </div>

              {/* Option C: iPhone / iPad (Safari) */}
              {isIOS && (
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs">
                    <Share className="w-4 h-4" />
                    <span>En iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                    <li>Toca el botón <strong>Compartir</strong> <Share className="inline w-3 h-3 text-blue-400" /> en la barra inferior de Safari.</li>
                    <li>Desliza hacia abajo y selecciona <strong>"Agregar a la pantalla de inicio"</strong>.</li>
                    <li>Pulsa <strong>"Agregar"</strong> en la esquina superior derecha.</li>
                  </ol>
                </div>
              )}

              <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded-xl text-blue-200 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>La aplicación guardará datos en tu dispositivo y sincronizará con la nube automáticamente.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Ahora</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
