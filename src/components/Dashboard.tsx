import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  CalendarRange, 
  BookOpen, 
  Plus, 
  Search, 
  Printer, 
  Edit3, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  School,
  FileCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Upload,
  Paperclip,
  RotateCcw,
  ShieldCheck,
  FileText,
  UserCheck
} from 'lucide-react';
import { 
  DailyPlan, 
  WeeklyPlan, 
  LearningUnit, 
  SchoolConfig,
  Teacher,
  FundamentalCompetencyKey 
} from '../types/minerd';
import { FUNDAMENTAL_COMPETENCIES } from '../data/minerdCurriculum';
import { UploadPreMadePlanModal } from './UploadPreMadePlanModal';
import { storageService } from '../services/storageService';

interface DashboardProps {
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  learningUnits: LearningUnit[];
  schoolConfig: SchoolConfig;
  teachers?: Teacher[];
  onEditDailyPlan: (plan: DailyPlan) => void;
  onEditWeeklyPlan: (plan: WeeklyPlan) => void;
  onDuplicateDailyPlan: (plan: DailyPlan) => void;
  onDeleteDailyPlan: (id: string) => void;
  onNewDailyPlan: () => void;
  onNewWeeklyPlan: () => void;
  onSaveDailyPlan: (plan: DailyPlan) => void;
  onSaveWeeklyPlan: (plan: WeeklyPlan) => void;
  onSaveUnitPlan: (unit: LearningUnit) => void;
  onPrintPlan: (type: 'daily' | 'weekly' | 'unit', id: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  dailyPlans,
  weeklyPlans,
  learningUnits,
  schoolConfig,
  teachers = [],
  onEditDailyPlan,
  onEditWeeklyPlan,
  onDuplicateDailyPlan,
  onDeleteDailyPlan,
  onNewDailyPlan,
  onNewWeeklyPlan,
  onSaveDailyPlan,
  onSaveWeeklyPlan,
  onSaveUnitPlan,
  onPrintPlan,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Coverage of fundamental competencies
  const competencyCoverage = useMemo(() => {
    const counts: Record<FundamentalCompetencyKey, number> = {
      etica_ciudadana: 0,
      comunicativa: 0,
      pensamiento_logico: 0,
      resolucion_problemas: 0,
      cientifica_tecnologica: 0,
      ambiental_salud: 0,
      desarrollo_personal: 0
    };

    dailyPlans.forEach(plan => {
      plan.fundamentalCompetencies?.forEach(comp => {
        if (counts[comp] !== undefined) {
          counts[comp]++;
        }
      });
    });

    return counts;
  }, [dailyPlans]);

  // Filtered daily plans
  const filteredDailyPlans = useMemo(() => {
    return dailyPlans.filter(plan => {
      const matchQuery = 
        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.unitTheme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.teacherName && plan.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchArea = filterArea === 'all' || plan.area === filterArea;
      const matchStatus = filterStatus === 'all' || plan.status === filterStatus || plan.reviewStatus === filterStatus;

      return matchQuery && matchArea && matchStatus;
    });
  }, [dailyPlans, searchTerm, filterArea, filterStatus]);

  // Unique areas in current plans
  const availableAreas = useMemo(() => {
    const areas = new Set<string>();
    dailyPlans.forEach(p => areas.add(p.area));
    return Array.from(areas);
  }, [dailyPlans]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      
      {/* Modern Minimalist Hero Banner with Quick Actions */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="bg-slate-800/80 text-amber-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {schoolConfig.tanda}
            </span>
            <span>·</span>
            <span>{schoolConfig.district}</span>
            <span>·</span>
            <span>{schoolConfig.regional}</span>
            <span>·</span>
            <span>Año {schoolConfig.schoolYear}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {schoolConfig.schoolName}
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-medium">
            Plataforma docente oficial MINERD. Diseñe planificaciones interactivas o suba sus planificaciones previas (PDF, Word, Excel) para revisión y aprobación por la Dirección o Coordinación.
          </p>

          <p className="text-xs text-indigo-200/90 font-medium pt-1">
            Tablero de supervisión institucional y monitoreo de avances pedagógicos por área y nivel.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Daily Plans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Planes Diarios</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
              {dailyPlans.length}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {dailyPlans.filter(p => p.reviewStatus === 'approved').length} aprobados · {dailyPlans.filter(p => p.reviewStatus === 'pending').length} pendientes
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Weekly Plans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Planes Semanales</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
              {weeklyPlans.length}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {weeklyPlans.reduce((acc, curr) => acc + (curr.weekNumber ? 1 : 0), 0)} matrices activas
            </p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <CalendarRange className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Learning Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unidades Didácticas</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-0.5">
              {learningUnits.length}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Con situaciones de aprendizaje
            </p>
          </div>
          <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Curricular State */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Currículo MINERD</p>
            <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-[150px] mt-0.5">
              {schoolConfig.schoolCode || 'Código Oficial'}
            </h3>
            <p className="text-xs text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Adecuación Curricular
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

      </div>

      {/* Competencies Progress Bar */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Cobertura de Competencias Fundamentales MINERD
            </h2>
            <p className="text-xs text-slate-500 font-medium">Distribución de competencias en las planificaciones registradas</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('curriculum')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Malla Curricular</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {FUNDAMENTAL_COMPETENCIES.map((comp) => {
            const count = competencyCoverage[comp.key] || 0;
            const maxPossible = Math.max(dailyPlans.length, 1);
            const percentage = Math.min(Math.round((count / maxPossible) * 100), 100);

            return (
              <div key={comp.key} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 leading-tight">{comp.name}</span>
                  <span className="font-mono text-slate-500 font-bold tabular-nums text-[11px]">
                    {count} {count === 1 ? 'plan' : 'planes'} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Plans Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Section Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Registro de Planificaciones Diarias</h2>
            <p className="text-xs text-slate-500">Planes diseñados o cargados con archivos adjuntos para supervisión</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar tema, docente o grado..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 focus:bg-white transition-all font-medium"
              />
            </div>

            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">Todas las Áreas</option>
              {availableAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">Pendientes de Aprobación</option>
              <option value="approved">Aprobados por Dirección</option>
              <option value="returned">Con Observaciones</option>
              <option value="draft">Borrador</option>
            </select>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Archivo</span>
            </button>

            {dailyPlans.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (true) {
                    storageService.clearAllDailyPlans();
                  }
                }}
                className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Vaciar todas las planificaciones diarias"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Vaciar Planes</span>
              </button>
            )}
          </div>
        </div>

        {/* Table / List */}
        {filteredDailyPlans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <CalendarDays className="w-7 h-7 stroke-[2]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No se encontraron planificaciones diarias</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Comience creando una nueva planificación alineada al MINERD o suba sus planificaciones previas en formato PDF/Word.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onNewDailyPlan}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Plan Diario</span>
              </button>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Subir Plan Previo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-5">Fecha</th>
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-4">Grado / Sección</th>
                  <th className="py-3 px-4">Área Curricular</th>
                  <th className="py-3 px-4">Tema / Intención Pedagógica</th>
                  <th className="py-3 px-4">Estado Aprobación</th>
                  <th className="py-3 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDailyPlans.map((plan) => {
                  const hasAttachments = plan.attachments && plan.attachments.length > 0;
                  const isPending = plan.reviewStatus === 'pending' || (!plan.reviewStatus && plan.status === 'completed');
                  const isApproved = plan.reviewStatus === 'approved';
                  const isReturned = plan.reviewStatus === 'returned';

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-5 font-mono text-slate-600 whitespace-nowrap">
                        {plan.date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {plan.teacherName || schoolConfig.teacherName || 'Docente'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{plan.grade}</span>
                        <span className="text-slate-500 ml-1">"{plan.section}"</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        {plan.area}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 truncate">{plan.unitTheme || plan.title}</p>
                          {hasAttachments && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md border border-indigo-200">
                              <Paperclip className="w-2.5 h-2.5" />
                              {plan.attachments!.length}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{plan.pedagogicalIntention}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Aprobado
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                        {isReturned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <RotateCcw className="w-3 h-3" /> Observado
                          </span>
                        )}
                        {!isApproved && !isPending && !isReturned && plan.status === 'draft' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            Borrador
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintPlan('daily', plan.id)}
                            title="Imprimir formato oficial MINERD"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateDailyPlan(plan)}
                            title="Duplicar plan"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditDailyPlan(plan)}
                            title="Editar planificación"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Está seguro de eliminar la planificación "${plan.unitTheme}"?`)) {
                                onDeleteDailyPlan(plan.id);
                              }
                            }}
                            title="Eliminar"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Weekly Plans Matrix Quick Access Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-white">Planificación Semanal y Unidades Curriculares</h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl font-medium leading-relaxed">
            Organice los 5 días lectivos articulados con la unidad pedagógica en una sola matriz interactiva o adjunte los cronogramas realizados.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('weekly')}
            className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Abrir Matriz Semanal →
          </button>
        </div>
      </div>

      {/* Upload Pre-made Plan Modal */}
      <UploadPreMadePlanModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        schoolConfig={schoolConfig}
        teachers={teachers}
        onSaveDailyPlan={onSaveDailyPlan}
        onSaveWeeklyPlan={onSaveWeeklyPlan}
        onSaveUnitPlan={onSaveUnitPlan}
      />

    </div>
  );
};
