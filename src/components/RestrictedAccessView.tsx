import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Award,
  HeartHandshake, 
  BookOpen, 
  ArrowRight,
  Eye, 
  EyeOff 
} from 'lucide-react';
import { authService, DIRECTOR_NAME } from '../services/authService';

interface RestrictedAccessViewProps {
  title: string;
  description: string;
  onUnlocked: () => void;
  onNavigateToTeacherMode: () => void;
  defaultRole?: 'director' | 'coordinator' | 'orientator';
}

export const RestrictedAccessView: React.FC<RestrictedAccessViewProps> = ({
  title,
  description,
  onUnlocked,
  onNavigateToTeacherMode,
  defaultRole
}) => {
  const [selectedRole, setSelectedRole] = useState<'director' | 'coordinator' | 'orientator'>(() => {
    if (defaultRole) return defaultRole;
    if (title.toLowerCase().includes('psicolog') || title.toLowerCase().includes('orientac')) return 'orientator';
    if (title.toLowerCase().includes('coordinad') || title.toLowerCase().includes('supervis')) return 'coordinator';
    return 'director';
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(true);
      setErrorMessage('Por favor ingrese la contraseña correspondiente.');
      return;
    }
    const result = authService.unlockWithRole(selectedRole, password);
    if (result.success) {
      setError(false);
      setPassword('');
      onUnlocked();
    } else {
      setError(true);
      setErrorMessage(result.message || 'Contraseña incorrecta.');
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 animate-fade-in px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden text-center">
        
        {/* Top Gradient */}
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500" />

        <div className="p-8 sm:p-10 space-y-6">
          
          {/* Lock Emblem */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Lock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 uppercase tracking-wider">
              Área Restringida
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          </div>

          {/* Role Picker for Quick Unlock */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Seleccione el Perfil Autorizado
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('director');
                  setError(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedRole === 'director'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Dirección</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('coordinator');
                  setError(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedRole === 'coordinator'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-600'
                }`}
              >
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-xs">Coordinación</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('orientator');
                  setError(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedRole === 'orientator'
                    ? 'border-rose-600 bg-rose-50/80 text-rose-950 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-600'
                }`}
              >
                <HeartHandshake className="w-4 h-4 text-rose-600" />
                <span className="text-xs">Orientación</span>
              </button>
            </div>
          </div>

          {/* Quick Unlock Form */}
          <form onSubmit={handleUnlock} className="space-y-3.5 text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Contraseña de {selectedRole === 'director' ? 'Dirección' : selectedRole === 'coordinator' ? 'Coordinación' : 'Orientación'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder={
                  selectedRole === 'director' ? 'Ingrese contraseña de Dirección' :
                  selectedRole === 'coordinator' ? 'Ingrese su contraseña de Coordinación' :
                  'Ingrese su contraseña de Orientación'
                }
                className={`w-full px-4 py-3 text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none transition-all pr-11 ${
                  error
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/40'
                    : 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-semibold">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-slate-900 hover:bg-indigo-950 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-amber-300" />
              <span>Acceder al Módulo</span>
            </button>
          </form>

          {/* Teacher Free Access Option */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold">O Continuar como Docente</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onNavigateToTeacherMode}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Ir al Modo Docente (Sin Contraseña)</span>
              <ArrowRight className="w-4 h-4 text-slate-400 ml-1" />
            </button>
            <p className="text-xs text-slate-400">
              Los docentes tienen acceso irrestricto a Plan Diario, Semanal, Unidades y Currículo MINERD.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
