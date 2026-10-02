import React, { useState } from 'react';
import { 
  Copyright,

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
  ChevronRight,
  UserCheck,
  Menu,
  X,
  School,
  Sparkles,
  Layers,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sliders
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

interface SidebarNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onNewDailyPlan?: () => void;
  schoolName: string;
  schoolCode?: string;
  logoUrl?: string;
  district?: string;
  pendingReviewCount?: number;
  activeRole?: UserRole;
  isUnlocked: boolean;
  onRequestUnlock: (targetTab?: ActiveTab, defaultRole?: 'director' | 'coordinator' | 'orientator') => void;
  onLockSession: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onNewDailyPlan,
  schoolName,
  schoolCode = '14668',
  logoUrl,
  district = 'Distrito 12-01 (Higüey)',
  pendingReviewCount = 0,
  activeRole = 'coordinator',
  isUnlocked,
  onRequestUnlock,
  onLockSession
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isConfigMenuOpen, setIsConfigMenuOpen] = useState(false);
  const currentSession = authService.getSession();

  const handleTabClick = (tab: ActiveTab) => {
    setIsMobileOpen(false);
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
    setIsMobileOpen(false);
    if (!isUnlocked || currentSession.role !== 'director') {
      onRequestUnlock(undefined, 'director');
    } else {
      onOpenSettings();
    }
  };

  const getRoleBadge = () => {
    if (!isUnlocked) {
      return (
        <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-2xl border border-slate-700/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-200">Modo Docente</p>
              <p className="text-[10px] text-slate-400">Acceso libre de aula</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRequestUnlock()}
            className="text-[10px] font-extrabold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Acceder
          </button>
        </div>
      );
    }
    if (currentSession.role === 'director') {
      return (
        <div className="p-3 bg-blue-950/80 rounded-2xl border border-blue-600/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-black text-white">{DIRECTOR_NAME}</p>
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Director del Centro</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLockSession}
              className="text-[10px] font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              Bloquear
            </button>
          </div>
        </div>
      );
    }
    if (currentSession.role === 'coordinator') {
      return (
        <div className="p-3 bg-indigo-950/80 rounded-2xl border border-indigo-600/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Award className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-black text-white">{currentSession.userName || 'Coordinación'}</p>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Coordinador Pedagógico</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLockSession}
              className="text-[10px] font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              Bloquear
            </button>
          </div>
        </div>
      );
    }
    if (currentSession.role === 'orientator') {
      return (
        <div className="p-3 bg-rose-950/80 rounded-2xl border border-rose-600/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <HeartHandshake className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-black text-white">{currentSession.userName || 'Orientación'}</p>
                <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Orientación & Psicología</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLockSession}
              className="text-[10px] font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              Bloquear
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 border-r border-slate-800/80 w-72 sm:w-80 select-none">
      
      {/* 1. Header / School Logo */}
      <div className="p-5 pt-[max(1.25rem,env(safe-area-inset-top))] border-b border-slate-800/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo Institucional" 
              className="w-10 h-10 rounded-2xl object-cover shadow-md border border-indigo-500/30 shrink-0 bg-white" 
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-amber-300 shadow-md border border-indigo-500/30 shrink-0">
              <School className="w-5 h-5 text-amber-300" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-tight leading-tight line-clamp-1">
              {schoolName || 'Escuela Dr. José Francisco Peña Gómez'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1 rounded-sm tracking-wider font-mono">
                {schoolCode}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-medium text-slate-400 truncate max-w-[140px]">{district}</span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>



      {/* 3. Scrollable Vertical Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
        
        {/* GROUP 1: GESTIÓN DE AULA Y DOCENTE (100% LIBRE PARA DOCENTES) */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-extrabold tracking-wider uppercase text-slate-500 block mb-1">
            Gestión de Aula & Planificación
          </span>

          {/* 1. Plan Diario de Clases */}
          <button
            type="button"
            onClick={() => handleTabClick('daily')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarDays className={`w-4 h-4 ${activeTab === 'daily' ? 'text-amber-300' : 'text-emerald-400'}`} />
              <span>Plan Diario de Clases</span>
            </div>
            {activeTab === 'daily' && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </button>

          {/* 2. Plan Semanal */}
          <button
            type="button"
            onClick={() => handleTabClick('weekly')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarRange className={`w-4 h-4 ${activeTab === 'weekly' ? 'text-amber-300' : 'text-indigo-400'}`} />
              <span>Plan Semanal</span>
            </div>
            {activeTab === 'weekly' && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </button>

          {/* 3. Unidades de Aprendizaje */}
          <button
            type="button"
            onClick={() => handleTabClick('units')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'units'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className={`w-4 h-4 ${activeTab === 'units' ? 'text-amber-300' : 'text-purple-400'}`} />
              <span>Unidades de Aprendizaje</span>
            </div>
            {activeTab === 'units' && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </button>

          {/* 4. Diseño Curricular (sin la palabra MINERD) */}
          <button
            type="button"
            onClick={() => handleTabClick('curriculum')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'curriculum'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Library className={`w-4 h-4 ${activeTab === 'curriculum' ? 'text-amber-300' : 'text-teal-400'}`} />
              <span>Diseño Curricular</span>
            </div>
            {activeTab === 'curriculum' && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </button>

          {/* 5. Control de Asistencia & Matrícula (debajo de Diseño Curricular y sin la palabra Nuevo) */}
          <button
            type="button"
            onClick={() => handleTabClick('attendance')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                : 'text-emerald-300 bg-emerald-950/20 hover:bg-emerald-900/40 hover:text-emerald-100 border border-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserCheck className={`w-4 h-4 ${activeTab === 'attendance' ? 'text-amber-300' : 'text-emerald-400'}`} />
              <span>Control de Asistencia & Matrícula</span>
            </div>
            {activeTab === 'attendance' && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </button>

          {/* 6. Imprimir / Exportar */}
          <button
            type="button"
            onClick={() => handleTabClick('print')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'print'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Printer className={`w-4 h-4 ${activeTab === 'print' ? 'text-amber-300' : 'text-rose-400'}`} />
              <span>Imprimir / Exportar</span>
            </div>
            {activeTab === 'print' && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
          </button>
        </div>

        {/* GROUP 2: GOBERNANZA & DIRECCIÓN INSTITUCIONAL (PROTEGIDO) */}
        <div className="space-y-1 pt-2 border-t border-slate-800/80">
          <div className="px-3 flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500">
              Gobernanza Institucional
            </span>
            <Lock className="w-3 h-3 text-amber-500" />
          </div>

          {/* Resumen General (Dashboard) - Ubicado ARRIBA de Supervisión Directiva */}
          <button
            type="button"
            onClick={() => handleTabClick('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-indigo-300 hover:bg-indigo-950/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-amber-300' : 'text-indigo-400'}`} />
              <span>Resumen General</span>
            </div>
            {(!isUnlocked || !['director', 'coordinator', 'orientator'].includes(currentSession.role)) ? (
              <Lock className="w-3 h-3 text-amber-500/70" />
            ) : activeTab === 'dashboard' ? (
              <ChevronRight className="w-3.5 h-3.5 text-white/70" />
            ) : null}
          </button>

          {/* Supervisión Directiva */}
          <button
            type="button"
            onClick={() => handleTabClick('management')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'management'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'text-blue-300 hover:bg-blue-950/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'management' ? 'text-amber-300' : 'text-blue-400'}`} />
              <span>Supervisión Directiva</span>
            </div>
            {pendingReviewCount > 0 ? (
              <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                {pendingReviewCount}
              </span>
            ) : (!isUnlocked || !['director', 'coordinator', 'orientator'].includes(currentSession.role)) ? (
              <Lock className="w-3 h-3 text-amber-500/70" />
            ) : null}
          </button>
          {/* Coordinadores Pedagógicos */}
          <button
            type="button"
            onClick={() => handleTabClick('coordinators')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'coordinators'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-indigo-300 hover:bg-indigo-950/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Award className={`w-4 h-4 ${activeTab === 'coordinators' ? 'text-amber-300' : 'text-indigo-400'}`} />
              <span>Coordinadores</span>
            </div>
            {(!isUnlocked || !['director', 'coordinator'].includes(currentSession.role)) && (
              <Lock className="w-3 h-3 text-amber-500/70" />
            )}
          </button>

          {/* Unidad de Orientación y Psicología */}
          <button
            type="button"
            onClick={() => handleTabClick('psychology')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'psychology'
                ? 'bg-rose-600 text-white shadow-md font-black'
                : 'text-rose-300 hover:bg-rose-950/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <HeartHandshake className={`w-4 h-4 ${activeTab === 'psychology' ? 'text-amber-300' : 'text-rose-400'}`} />
              <span className="truncate">Unidad de Orientación & Psicología</span>
            </div>
            {(!isUnlocked || !['director', 'orientator'].includes(currentSession.role)) && (
              <Lock className="w-3 h-3 text-amber-500/70" />
            )}
          </button>

          {/* Padrón de Docentes */}
          <button
            type="button"
            onClick={() => handleTabClick('teachers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-emerald-300 hover:bg-emerald-950/50 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'teachers' ? 'text-amber-300' : 'text-emerald-400'}`} />
              <span>Padrón de Docentes</span>
            </div>
            {(!isUnlocked || !['director', 'coordinator'].includes(currentSession.role)) && (
              <Lock className="w-3 h-3 text-amber-500/70" />
            )}
          </button>
        </div>

      </div>

      {/* 4. Footer & Profile Status (Desplegable para eliminar ruido visual) */}
      <div className="p-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-slate-800/90 bg-slate-900/80">
        
        {/* Botón selector del Desplegable */}
        <button
          type="button"
          onClick={() => setIsConfigMenuOpen(!isConfigMenuOpen)}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            isConfigMenuOpen 
              ? 'bg-slate-800 text-white border-slate-600 shadow-inner' 
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
          }`}
          title="Configuración, Modo de Acceso y Gestión de Centros"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-slate-700 text-amber-400 flex items-center justify-center text-xs">
              {isUnlocked ? (
                currentSession.role === 'director' ? <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> :
                currentSession.role === 'coordinator' ? <Award className="w-3.5 h-3.5 text-indigo-300" /> :
                <HeartHandshake className="w-3.5 h-3.5 text-rose-300" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-white leading-tight">
                {isUnlocked ? (currentSession.role === 'director' ? 'Dirección' : currentSession.role === 'coordinator' ? 'Coordinación' : 'Orientación') : 'Modo Docente'}
              </p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5">Ajustes & Centros</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/50">
              {isConfigMenuOpen ? 'Cerrar' : 'Abrir'}
            </span>
            {isConfigMenuOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* Contenido Desplegable: Modo Docente, Ajustes Institucionales y Administración Multi-Centros */}
        {isConfigMenuOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-200">
            {/* 1. Modo Docente / Estado de Sesión */}
            {getRoleBadge()}

            {/* 2. Ajustes Institucionales */}
            <button
              type="button"
              onClick={handleSettingsClick}
              className="w-full flex items-center justify-between p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-700/70"
              title={isUnlocked && currentSession.role === 'director' ? 'Ajustes del Centro y WhatsApp' : 'Ajustes (Requiere Clave de Dirección)'}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Ajustes Institucionales</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>






          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="no-print hidden lg:flex fixed inset-y-0 left-0 z-40">
        {navContent}
      </aside>

      {/* Mobile Top Header Bar with Hamburger Menu & Safe Area */}
      <header className="no-print lg:hidden sticky top-0 z-40 bg-slate-950 text-white px-4 pt-safe flex flex-col justify-center border-b border-slate-800 shadow-md">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2 bg-slate-900 text-slate-200 hover:text-white rounded-xl border border-slate-800 cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-8 h-8 rounded-xl object-cover bg-white shrink-0 border border-slate-700" 
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  <School className="w-4 h-4 text-amber-300" />
                </div>
              )}
              <span className="font-extrabold text-sm text-white line-clamp-1">
                {schoolName || 'MINERD Planificación'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2 py-1 rounded-lg">
              MINERD
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Drawer */}
      {isMobileOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 animate-slide-in h-full">
            {navContent}
          </div>
        </div>
      )}

      
      
    </>
  );
};
