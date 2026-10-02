import React from 'react';
import { 
  ShieldCheck,
  Award,
  HeartHandshake,
  FileSpreadsheet,
  LayoutDashboard, 
  CalendarDays, 
  CalendarRange, 
  BookOpen, 
  Library, 
  Printer, 
  Settings, 
  Plus, 
  Lock, 
  Unlock, 
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types/minerd';
import { authService, AuthRole, DIRECTOR_NAME } from '../services/authService';

export type ActiveTab = 
  | 'management' 
  | 'coordinators'
  | 'psychology'
  | 'teachers' 
  | 'dashboard' 
  | 'attendance'
  | 'daily' 
  | 'weekly' 
  | 'units' 
  | 'curriculum' 
  | 'print';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onNewDailyPlan: () => void;
  schoolName: string;
  pendingReviewCount?: number;
  activeRole?: UserRole;
  isUnlocked: boolean;
  onRequestUnlock: (targetTab?: ActiveTab, defaultRole?: 'director' | 'coordinator' | 'orientator') => void;
  onLockSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onNewDailyPlan,
  schoolName,
  pendingReviewCount = 0,
  activeRole = 'coordinator',
  isUnlocked,
  onRequestUnlock,
  onLockSession
}) => {
  const currentSession = authService.getSession();

  const handleTabClick = (tab: ActiveTab) => {
    if (authService.isRestrictedTab(tab)) {
      if (!authService.canAccessTab(tab)) {
        const defaultRole = 
          tab === 'psychology' ? 'orientator' :
          tab === 'coordinators' || tab === 'management' ? 'coordinator' : 'director';
        onRequestUnlock(tab, defaultRole);
        return;
      }
    }
    setActiveTab(tab);
  };

  const handleSettingsClick = () => {
    if (!isUnlocked || currentSession.role !== 'director') {
      onRequestUnlock(undefined, 'director');
    } else {
      onOpenSettings();
    }
  };

  const getRoleBadge = () => {
    if (!isUnlocked) {
      return null;
    }
    if (currentSession.role === 'director') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-blue-600 text-white shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">{DIRECTOR_NAME}</span>
          <span className="sm:hidden">Director</span>
        </span>
      );
    }
    if (currentSession.role === 'coordinator') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs">
          <Award className="w-3.5 h-3.5 text-amber-300" />
          <span>Coordinación</span>
        </span>
      );
    }
    if (currentSession.role === 'orientator') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-rose-600 text-white shadow-xs">
          <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
          <span>Orientación & Psicología</span>
        </span>
      );
    }
    return null;
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          
          {/* Brand & School Details */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400 shadow-sm border border-slate-800">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.13-2.67 7.97-6 9.04-3.33-1.07-6-4.91-6-9.04V6.43l6-2.25zM11 7v4h2V7h-2zm0 6v2h2v-2h-2z"/>
              </svg>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight line-clamp-1">
                  {schoolName || 'Escuela Dr. José Francisco Peña Gómez'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  MINERD RD
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden md:block">
                Sistema de Planificación Docente y Gestión Curricular
              </p>
            </div>
          </div>

          {/* Quick Actions & Auth Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Status Session Pill */}
            {isUnlocked ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs">
                {getRoleBadge()}
                <button
                  type="button"
                  onClick={onLockSession}
                  className="text-[11px] font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  Bloquear
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onRequestUnlock()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
                title="Acceso para Dirección, Coordinación y Psicología"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Acceso Institucional</span>
                <span className="sm:hidden">Acceso</span>
              </button>
            )}

            {/* Quick New Daily Plan */}
            <button
              type="button"
              onClick={onNewDailyPlan}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-indigo-950 rounded-xl transition-all shadow-xs hover:scale-[1.01] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />
              <span className="hidden sm:inline">Nuevo Plan</span>
              <span className="sm:hidden">+ Plan</span>
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={handleSettingsClick}
              title={isUnlocked && currentSession.role === 'director' ? 'Ajustes del Centro y WhatsApp' : 'Ajustes (Requiere Clave de Dirección)'}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200/80"
            >
              <Settings className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-50/70 border-t border-slate-200/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          
          <nav className="flex items-center gap-1 py-0.5 text-xs font-semibold">
            
            {/* Free Teacher Tabs */}
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resumen</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('attendance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-950 font-bold border border-emerald-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700" />
              <span>Control de Asistencia & Matrícula</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Plan Diario</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 text-indigo-600" />
              <span>Plan Semanal</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('units')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'units'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Unidades</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('curriculum')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'curriculum'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Library className="w-3.5 h-3.5 text-amber-600" />
              <span>Currículo MINERD</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('print')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'print'
                  ? 'bg-white text-slate-900 shadow-xs font-bold ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-rose-600" />
              <span>Imprimir / Exportar</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-slate-300 mx-1.5" />

            {/* Protected Institutional Tabs */}
            <button
              type="button"
              onClick={() => handleTabClick('management')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'management'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-blue-900 hover:bg-blue-100/70 hover:text-blue-950'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Supervisión Directiva</span>
              {(!isUnlocked || !['director', 'coordinator'].includes(currentSession.role)) && (
                <Lock className="w-3 h-3 text-amber-500 ml-0.5" />
              )}
              {pendingReviewCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black bg-rose-500 text-white rounded-full">
                  {pendingReviewCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('coordinators')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'coordinators'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-indigo-900 hover:bg-indigo-100/70 hover:text-indigo-950'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Coordinadores</span>
              {(!isUnlocked || !['director', 'coordinator'].includes(currentSession.role)) && (
                <Lock className="w-3 h-3 text-amber-500 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('psychology')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'psychology'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-rose-900 hover:bg-rose-100/70 hover:text-rose-950'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Unidad de Orientación y Psicología</span>
              {(!isUnlocked || !['director', 'orientator', 'coordinator'].includes(currentSession.role)) && (
                <Lock className="w-3 h-3 text-amber-500 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('teachers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'teachers'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-emerald-900 hover:bg-emerald-100/70 hover:text-emerald-950'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Docentes</span>
              {(!isUnlocked || !['director', 'coordinator'].includes(currentSession.role)) && (
                <Lock className="w-3 h-3 text-amber-500 ml-0.5" />
              )}
            </button>

          </nav>

        </div>
      </div>

    </header>
  );
};
