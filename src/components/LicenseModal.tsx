import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  Copyright, 
  CheckCircle2, 
  X, 
  UserCheck, 
  Building2, 
  FileText, 
  ExternalLink,
  Sparkles,
  Lock
} from 'lucide-react';
import { DIRECTOR_NAME } from '../services/authService';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolCode: string;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  schoolCode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Gradient */}
        <div className="h-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header with Custom Author Emblem */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 border-2 border-amber-400 p-2 shadow-lg flex items-center justify-center shrink-0">
              <img 
                src="/icon.svg" 
                alt="Emblema Institucional" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Certificado Oficial de Autoría y Licencia de Software
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Sistema de Planificación Docente MINERD
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Edición Oficial Registrada • Versión 2.5.0 Pro
              </p>
            </div>
          </div>

          {/* Author & Creator Information Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  AJS
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-wider uppercase text-blue-700">Autor y Desarrollador Titular</p>
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">{DIRECTOR_NAME}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-black bg-blue-600 text-white rounded-lg uppercase tracking-wider shadow-xs">
                Propiedad Intelectual
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white/90 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-600" />
                  Centro Educativo Asignado
                </span>
                <p className="font-bold text-slate-800 truncate">{schoolName}</p>
                <p className="text-[11px] text-slate-500 font-mono">Código SIGERD: {schoolCode}</p>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Estado de la Licencia
                </span>
                <p className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Licencia Activa y Verificada
                </p>
                <p className="text-[11px] text-slate-500">Uso Institucional Dominicano</p>
              </div>
            </div>
          </div>

          {/* Legal Terms & Intellectual Property Clauses */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Copyright className="w-3.5 h-3.5 text-slate-500" />
              Términos de Derechos de Autor y Protección Legal
            </h3>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2.5 leading-relaxed font-sans">
              <p>
                <strong>1. Titularidad Exclusiva:</strong> Este software, su arquitectura técnica, diseño de interfaz, lógica pedagógica curricular y componentes de supervisión directiva son propiedad intelectual exclusiva de <strong>{DIRECTOR_NAME}</strong>.
              </p>
              <p>
                <strong>2. Licencia de Uso Autorizada:</strong> Se concede licencia de uso pedagógico y administrativo para los docentes, coordinadores y directivos vinculados a la <strong>{schoolName}</strong> (Código {schoolCode}) y a los centros educativos autorizados por el titular.
              </p>
              <p>
                <strong>3. Protección de Derechos de Autor:</strong> Queda terminantemente prohibida la redistribución no autorizada, venta, modificación de la autoría o descompilación total o parcial del código sin el consentimiento expreso y por escrito de su autor.
              </p>
              <p>
                <strong>4. Normativa y Marco Legal:</strong> Desarrollado conforme al currículo por competencias del Ministerio de Educación de la República Dominicana (MINERD) y amparado por las leyes dominicanas e internacionales de Derecho de Autor y Propiedad Intelectual.
              </p>
            </div>
          </div>

          {/* Footer with Monogram & Close button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>© {new Date().getFullYear()} {DIRECTOR_NAME}. Todos los derechos reservados.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Entendido y Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
