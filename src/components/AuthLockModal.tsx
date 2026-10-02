import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  X, 
  Eye, 
  EyeOff, 
  Award, 
  HeartHandshake, 
  ShieldCheck, 
  BookOpen
} from 'lucide-react';
import { 
  authService, 
  DIRECTOR_NAME, 
  AuthRole 
} from '../services/authService';

interface AuthLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetFeatureName?: string;
  defaultRole?: 'director' | 'coordinator' | 'orientator';
}

export const AuthLockModal: React.FC<AuthLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetFeatureName = 'este apartado directivo',
  defaultRole
}) => {
  const [selectedRole, setSelectedRole] = useState<'director' | 'coordinator' | 'orientator'>('director');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    } else if (targetFeatureName.toLowerCase().includes('psicolog') || targetFeatureName.toLowerCase().includes('orientac')) {
      setSelectedRole('orientator');
    } else if (targetFeatureName.toLowerCase().includes('coordinad') || targetFeatureName.toLowerCase().includes('supervis')) {
      setSelectedRole('coordinator');
    } else {
      setSelectedRole('director');
    }
    setPassword('');
    setError(false);
    setErrorMessage('');
  }, [isOpen, defaultRole, targetFeatureName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(true);
      setErrorMessage('Por favor ingrese la contraseña de acceso.');
      return;
    }

    const result = authService.unlockWithRole(selectedRole, password);
    if (result.success) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
      setErrorMessage(result.message || 'Contraseña incorrecta para el rol seleccionado.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Modern Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Seguridad Institucional MINERD
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                Control de Acceso por Roles
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2">
            Seleccione su perfil institucional para acceder a <strong className="text-white font-semibold">{targetFeatureName}</strong>.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Seleccione su Rol de Acceso
            </label>
            <div className="grid grid-cols-3 gap-2">
              
              {/* Director Role Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('director');
                  setError(false);
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedRole === 'director'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600/30 font-black'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-600 font-semibold'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${selectedRole === 'director' ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="text-xs leading-tight">Dirección</span>
              </button>

              {/* Coordinator Role Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('coordinator');
                  setError(false);
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedRole === 'coordinator'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-600/30 font-black'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-600 font-semibold'
                }`}
              >
                <Award className={`w-5 h-5 ${selectedRole === 'coordinator' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-xs leading-tight">Coordinación</span>
              </button>

              {/* Orientator Role Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('orientator');
                  setError(false);
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedRole === 'orientator'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 ring-2 ring-rose-600/30 font-black'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-600 font-semibold'
                }`}
              >
                <HeartHandshake className={`w-5 h-5 ${selectedRole === 'orientator' ? 'text-rose-600' : 'text-slate-500'}`} />
                <span className="text-xs leading-tight">Orientación</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Active Selected Role Profile Preview */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/70 rounded-2xl">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm text-white shadow-xs ${
                selectedRole === 'director' ? 'bg-blue-600' :
                selectedRole === 'coordinator' ? 'bg-indigo-600' : 'bg-rose-600'
              }`}>
                {selectedRole === 'director' ? 'DIR' : selectedRole === 'coordinator' ? 'CP' : 'OP'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {selectedRole === 'director' ? 'Dirección del Centro' :
                   selectedRole === 'coordinator' ? 'Coordinación Pedagógica' : 'Orientación y Psicología'}
                </p>
                <p className="text-xs font-extrabold text-slate-800 truncate">
                  {selectedRole === 'director' ? DIRECTOR_NAME :
                   selectedRole === 'coordinator' ? 'Coordinador/a Pedagógico/a' : 'Orientador/a o Psicólogo/a'}
                </p>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña de {selectedRole === 'director' ? 'Dirección' : selectedRole === 'coordinator' ? 'Coordinación' : 'Orientación'}
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  autoFocus
                  placeholder={
                    selectedRole === 'director' ? 'Ingrese contraseña de Dirección' :
                    selectedRole === 'coordinator' ? 'Ingrese su contraseña de Coordinación' :
                    'Ingrese su contraseña de Orientación'
                  }
                  className={`w-full px-4 py-3 text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none transition-all pr-11 ${
                    error 
                      ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30' 
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </p>
              )}
            </div>

            {/* Teacher Free Access Notice */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Acceso Libre a Docentes</span>
                <p className="text-emerald-700 text-[11px] leading-relaxed mt-0.5">
                  Las funciones docentes (Plan Diario, Plan Semanal, Unidades y Currículo MINERD) no requieren contraseña.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-indigo-950 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-amber-300" />
                <span>Iniciar Acceso</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
