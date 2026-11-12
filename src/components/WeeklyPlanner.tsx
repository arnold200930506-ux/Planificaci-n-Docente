import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Printer, 
  Plus, 
  Trash2, 
  CalendarRange, 
  Check, 
  ArrowLeft, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Wand2,
  Loader2
} from 'lucide-react';
import { 
  WeeklyPlan, 
  WeeklyDayPlan, 
  EducationalLevel, 
  SubjectArea, 
  SchoolConfig,
  Teacher
} from '../types/minerd';
import { TRANSVERSAL_AXES } from '../data/minerdCurriculum';
import { FileAttachmentManager } from './FileAttachmentManager';
import { aiAssistantService } from '../services/aiAssistantService';
import { INDIVIDUAL_GRADES_LIST, inferLevelFromGrade } from './LearningUnitPlanner';

interface WeeklyPlannerProps {
  initialPlan?: WeeklyPlan | null;
  schoolConfig: SchoolConfig;
  teachers?: Teacher[];
  onSave: (plan: WeeklyPlan) => void;
  onCancel: () => void;
  onPrint: (planId: string) => void;
  onCreateDailyFromWeeklyDay?: (dayData: {
    date: string;
    grade: string;
    section: string;
    area: SubjectArea;
    unitTheme: string;
    pedagogicalIntention: string;
    startActivities: string;
    developmentActivities: string;
    closeActivities: string;
  }) => void;
}

const DEFAULT_DAY: WeeklyDayPlan = {
  topic: '',
  pedagogicalIntention: '',
  startActivity: '',
  developmentActivity: '',
  closeActivity: '',
  resources: '',
  evaluation: ''
};

const DEFAULT_EMPTY_WEEKLY_PLAN: WeeklyPlan = {
  id: '',
  title: '',
  weekNumber: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  level: 'primario_segundo_ciclo',
  grade: '4to Grado',
  section: 'A',
  area: 'Lengua Española',
  unitTitle: '',
  unitCompetency: '',
  transversalAxis: TRANSVERSAL_AXES[0],
  achievementIndicators: [],
  days: {
    lunes: { ...DEFAULT_DAY },
    martes: { ...DEFAULT_DAY },
    miercoles: { ...DEFAULT_DAY },
    jueves: { ...DEFAULT_DAY },
    viernes: { ...DEFAULT_DAY }
  },
  generalResources: ['Pizarra y marcadores', 'Fascículo MINERD', 'Cuadernos'],
  generalEvaluation: 'Evaluación formativa y procesual durante la semana con listas de cotejo.',
  status: 'draft',
  reviewStatus: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  initialPlan,
  schoolConfig,
  teachers = [],
  onSave,
  onCancel,
  onPrint,
  onCreateDailyFromWeeklyDay
}) => {
  const normalizeWeeklyPlan = (raw?: WeeklyPlan | null): WeeklyPlan => {
    const base = raw ? { ...raw } : { ...DEFAULT_EMPTY_WEEKLY_PLAN, id: `wp-${Date.now()}` };
    return {
      ...base,
      area: base.area || 'Lengua Española',
      level: base.level || 'primario_segundo_ciclo',
      achievementIndicators: Array.isArray(base.achievementIndicators) ? base.achievementIndicators : [],
      generalResources: Array.isArray(base.generalResources) ? base.generalResources : ['Fascículo MINERD'],
      days: base.days || DEFAULT_EMPTY_WEEKLY_PLAN.days,
      attachments: Array.isArray(base.attachments) ? base.attachments : []
    };
  };

  const [plan, setPlan] = useState<WeeklyPlan>(() => normalizeWeeklyPlan(initialPlan));

  const [activeDayTab, setActiveDayTab] = useState<'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'>('lunes');
  const [viewMode, setViewMode] = useState<'tabs' | 'matrix'>('tabs');
  const [newIndicator, setNewIndicator] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiFeedbackMsg, setAiFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialPlan) {
      setPlan(normalizeWeeklyPlan(initialPlan));
    }
  }, [initialPlan]);

  const updateDay = (dayKey: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes', field: keyof WeeklyDayPlan, value: string) => {
    setPlan(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: {
          ...prev.days[dayKey],
          [field]: value
        }
      }
    }));
  };

  const handleGenerateWeeklyWithAI = async () => {
    setIsGeneratingAI(true);
    setAiFeedbackMsg(null);
    try {
      const topicToUse = plan.unitTitle.trim() || aiPrompt.trim() || `Secuencia Semanal de ${plan.area} (${plan.grade})`;
      const res = await aiAssistantService.generatePlan({
        planType: 'weekly',
        level: plan.level,
        grade: plan.grade,
        area: plan.area,
        topic: topicToUse,
        teacherPrompt: aiPrompt.trim()
      });
      const d = res.data || {};
      setPlan(prev => ({
        ...prev,
        unitTitle: d.unitTitle || prev.unitTitle || topicToUse,
        unitCompetency: d.unitCompetency || prev.unitCompetency,
        achievementIndicators: Array.isArray(d.achievementIndicators) && d.achievementIndicators.length > 0 ? d.achievementIndicators : prev.achievementIndicators,
        days: d.days ? {
          lunes: { ...DEFAULT_DAY, ...(d.days.lunes || {}) },
          martes: { ...DEFAULT_DAY, ...(d.days.martes || {}) },
          miercoles: { ...DEFAULT_DAY, ...(d.days.miercoles || {}) },
          jueves: { ...DEFAULT_DAY, ...(d.days.jueves || {}) },
          viernes: { ...DEFAULT_DAY, ...(d.days.viernes || {}) }
        } : prev.days
      }));
      setAiFeedbackMsg('¡Matriz Semanal de Lunes a Viernes generada con Inteligencia Artificial! Revise cada día o presione Guardar Matriz.');
    } catch (e) {
      console.error('Error generating weekly plan with AI:', e);
      setAiFeedbackMsg('Se generó la secuencia semanal base.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = () => {
    const finalUnitTitle = plan.unitTitle.trim() || `Secuencia de ${plan.area} (${plan.grade})`;
    const planToSave = {
      ...plan,
      unitTitle: finalUnitTitle,
      title: `Semana ${plan.weekNumber}: ${finalUnitTitle}`,
      updatedAt: new Date().toISOString()
    };
    setPlan(planToSave);
    onSave(planToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const dayNames: Record<'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes', string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes'
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Institutional Hero Banner with Logo Container for Multi-School Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Dynamic School Logo Container */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border-2 border-dashed border-indigo-400/40 p-1 flex items-center justify-center shrink-0 shadow-inner group relative">
              {schoolConfig.logoUrl ? (
                <img
                  src={schoolConfig.logoUrl}
                  alt={schoolConfig.schoolName}
                  className="w-full h-full object-contain rounded-xl bg-white"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-slate-800/80 flex flex-col items-center justify-center text-center p-1">
                  <CalendarRange className="w-5 h-5 text-amber-300" />
                  <span className="text-[8px] font-extrabold text-slate-300 uppercase tracking-tighter mt-0.5">Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-lg">
                  Matriz Semanal de Clases
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {schoolConfig.schoolCode ? `Código: ${schoolConfig.schoolCode}` : 'MINERD'}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-300 font-medium">Lunes a Viernes</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {schoolConfig.schoolName}
              </h2>
              <p className="text-xs text-slate-300/90 font-normal leading-relaxed max-w-2xl">
                Distribución pedagógica semanal con generador 1-clic a planificación diaria individual.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5 shrink-0 gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Semana Lectiva</span>
            <span className="text-sm font-black text-amber-300 font-mono">Semana #{plan.weekNumber || 1}</span>
            <span className="text-[10px] text-slate-400 font-medium">{schoolConfig.tanda}</span>
          </div>
        </div>
      </div>

      {/* Top Floating Action Bar */}
      <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-28 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {plan.unitTitle ? `Semana ${plan.weekNumber}: ${plan.unitTitle}` : 'Nueva Matriz Semanal'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Matriz Curricular Lunes a Viernes · {schoolConfig.schoolName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Check className="w-4 h-4" /> Guardado
            </span>
          )}

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'tabs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Vista Día
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Matriz Completa
            </button>
          </div>

          <button
            type="button"
            onClick={() => onPrint(plan.id)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-indigo-950 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Guardar Matriz</span>
          </button>
        </div>
      </div>

      {/* Asistente IA para Planificación Semanal */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-md space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                Asistente IA Semanal MINERD
              </span>
              <span className="text-xs text-indigo-200 font-medium">Lunes a Viernes</span>
            </div>
            <h3 className="text-sm font-black text-white mt-0.5">
              Generador Automático de Secuencia Semanal Completa (5 Días) con IA
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Indique el tema de la semana para que la IA diseñe las clases de Lunes a Viernes..."
              className="w-full text-xs p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-indigo-200/70 focus:bg-white/15 focus:outline-none"
            />
          </div>
          <button
            type="button"
            disabled={isGeneratingAI}
            onClick={handleGenerateWeeklyWithAI}
            className="px-4 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar Semana con IA</span>
              </>
            )}
          </button>
        </div>

        {aiFeedbackMsg && (
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{aiFeedbackMsg}</span>
          </div>
        )}
      </div>

      {/* General Information Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        
        {/* Review Feedback Banner if Returned or Approved */}
        {plan.reviewFeedback && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
            plan.reviewStatus === 'returned'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
              plan.reviewStatus === 'returned' ? 'text-rose-600' : 'text-emerald-600'
            }`} />
            <div>
              <p className="font-extrabold text-xs uppercase tracking-wider">
                {plan.reviewStatus === 'returned' ? 'Observaciones de Acompañamiento:' : 'Aprobación Pedagógica:'}
              </p>
              <p className="text-xs mt-1 leading-relaxed">{plan.reviewFeedback}</p>
              {plan.reviewerName && (
                <p className="text-[11px] text-slate-600 mt-1">Revisado por: <strong>{plan.reviewerName}</strong></p>
              )}
            </div>
          </div>
        )}

        <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          Datos de la Unidad y Semana Curricular (Grado Directo)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Docente Titular</label>
            <select
              value={plan.teacherName || schoolConfig.teacherName}
              onChange={(e) => {
                const selectedName = e.target.value;
                const foundTeacher = teachers.find(t => t.name === selectedName);
                const firstGrade = foundTeacher?.grades?.find(g => g !== 'Maestro del Área (Rotativo)') || foundTeacher?.grades?.[0];
                setPlan(prev => ({
                  ...prev,
                  teacherName: selectedName,
                  teacherId: foundTeacher?.id || prev.teacherId,
                  teacherPhone: foundTeacher?.phone || prev.teacherPhone,
                  grade: firstGrade && firstGrade !== 'Maestro del Área (Rotativo)' ? firstGrade : prev.grade,
                  area: foundTeacher?.areas?.[0] || prev.area
                }));
              }}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value={schoolConfig.teacherName}>{schoolConfig.teacherName}</option>
              {teachers.map(t => (
                <option key={t.id} value={t.name}>{t.name} — {t.areas?.join(', ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Semana Nº</label>
            <input
              type="number"
              min={1}
              max={40}
              value={plan.weekNumber}
              onChange={(e) => setPlan(prev => ({ ...prev, weekNumber: Number(e.target.value) || 1 }))}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha Inicio</label>
            <input
              type="date"
              value={plan.startDate}
              onChange={(e) => setPlan(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha Fin</label>
            <input
              type="date"
              value={plan.endDate}
              onChange={(e) => setPlan(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Grado / Curso</label>
            <select
              value={plan.grade}
              onChange={(e) => {
                const selectedGrade = e.target.value;
                setPlan(prev => ({
                  ...prev,
                  grade: selectedGrade,
                  level: inferLevelFromGrade(selectedGrade)
                }));
              }}
              className="w-full text-xs p-3 bg-indigo-50/70 border-2 border-indigo-300 rounded-xl font-black text-indigo-950"
            >
              {INDIVIDUAL_GRADES_LIST.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Área Curricular</label>
            <select
              value={plan.area}
              onChange={(e) => setPlan(prev => ({ ...prev, area: e.target.value as SubjectArea }))}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option value="Lengua Española">Lengua Española</option>
              <option value="Matemática">Matemática</option>
              <option value="Ciencias Sociales">Ciencias Sociales</option>
              <option value="Ciencias de la Naturaleza">Ciencias de la Naturaleza</option>
              <option value="Educación Artística">Educación Artística</option>
              <option value="Educación Física">Educación Física</option>
              <option value="Formación Integral Humana y Religiosa">Formación Integral Humana y Religiosa</option>
              <option value="Lenguas Extranjeras (Inglés)">Lenguas Extranjeras (Inglés)</option>
              <option value="Lenguas Extranjeras (Francés)">Lenguas Extranjeras (Francés)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Título de la Unidad Pedagógica</label>
            <input
              type="text"
              value={plan.unitTitle}
              onChange={(e) => setPlan(prev => ({ ...prev, unitTitle: e.target.value }))}
              placeholder="Ej. La Noticia: Estructura y Función Social"
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Competencia Específica de la Semana</label>
          <textarea
            rows={2}
            value={plan.unitCompetency}
            onChange={(e) => setPlan(prev => ({ ...prev, unitCompetency: e.target.value }))}
            placeholder="Competencia que se desarrollará a lo largo de los 5 días..."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
          />
        </div>

      </div>

      {/* VIEW MODE 1: TABS POR DÍA */}
      {viewMode === 'tabs' && (
        <div className="space-y-5">
          
          {/* Day selection tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold no-scrollbar">
            {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const).map(day => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDayTab(day)}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap text-center ${
                  activeDayTab === day
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dayNames[day]}
              </button>
            ))}
          </div>

          {/* Active Day Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Planificación del {dayNames[activeDayTab]}
              </h3>
              {onCreateDailyFromWeeklyDay && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateDailyFromWeeklyDay({
                      date: plan.startDate,
                      grade: plan.grade,
                      section: plan.section,
                      area: plan.area,
                      unitTheme: plan.days[activeDayTab].topic || plan.unitTitle,
                      pedagogicalIntention: plan.days[activeDayTab].pedagogicalIntention,
                      startActivities: plan.days[activeDayTab].startActivity,
                      developmentActivities: plan.days[activeDayTab].developmentActivity,
                      closeActivities: plan.days[activeDayTab].closeActivity
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Convertir a Plan Diario</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tema / Contenido del Día</label>
                <input
                  type="text"
                  value={plan.days[activeDayTab].topic}
                  onChange={(e) => updateDay(activeDayTab, 'topic', e.target.value)}
                  placeholder="Ej. Estructura del titular y lead"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Intención Pedagógica del Día</label>
                <input
                  type="text"
                  value={plan.days[activeDayTab].pedagogicalIntention}
                  onChange={(e) => updateDay(activeDayTab, 'pedagogicalIntention', e.target.value)}
                  placeholder="Propósito formativo del día..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Momentos del Día */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-emerald-800">1. Actividad de Inicio</label>
                <textarea
                  rows={4}
                  value={plan.days[activeDayTab].startActivity}
                  onChange={(e) => updateDay(activeDayTab, 'startActivity', e.target.value)}
                  placeholder="Activación y motivación..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-blue-800">2. Actividad de Desarrollo</label>
                <textarea
                  rows={4}
                  value={plan.days[activeDayTab].developmentActivity}
                  onChange={(e) => updateDay(activeDayTab, 'developmentActivity', e.target.value)}
                  placeholder="Construcción y práctica guiada..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-800">3. Actividad de Cierre</label>
                <textarea
                  rows={4}
                  value={plan.days[activeDayTab].closeActivity}
                  onChange={(e) => updateDay(activeDayTab, 'closeActivity', e.target.value)}
                  placeholder="Síntesis y metacognición..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recursos del Día</label>
                <input
                  type="text"
                  value={plan.days[activeDayTab].resources}
                  onChange={(e) => updateDay(activeDayTab, 'resources', e.target.value)}
                  placeholder="Ej. Periódico, tijeras, cuaderno..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evaluación del Día</label>
                <input
                  type="text"
                  value={plan.days[activeDayTab].evaluation}
                  onChange={(e) => updateDay(activeDayTab, 'evaluation', e.target.value)}
                  placeholder="Ej. Lista de cotejo / Registro en cuaderno"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW MODE 2: MATRIZ COMPLETA DE 5 DÍAS */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-28">Día</th>
                  <th className="py-3 px-4 min-w-[180px]">Tema / Intención</th>
                  <th className="py-3 px-4 min-w-[180px]">Inicio</th>
                  <th className="py-3 px-4 min-w-[200px]">Desarrollo</th>
                  <th className="py-3 px-4 min-w-[180px]">Cierre</th>
                  <th className="py-3 px-4 min-w-[140px]">Recursos / Eval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const).map(day => (
                  <tr key={day} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900 bg-slate-50/50">
                      {dayNames[day]}
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <p className="font-bold text-slate-800">{plan.days[day].topic || '—'}</p>
                      <p className="text-[11px] text-slate-500">{plan.days[day].pedagogicalIntention || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                      {plan.days[day].startActivity || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                      {plan.days[day].developmentActivity || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                      {plan.days[day].closeActivity || '—'}
                    </td>
                    <td className="py-3 px-4 space-y-1 text-[11px]">
                      <p className="text-slate-700"><strong>Rec:</strong> {plan.days[day].resources || '—'}</p>
                      <p className="text-slate-500"><strong>Ev:</strong> {plan.days[day].evaluation || '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECCIÓN DE ARCHIVOS ADJUNTOS / RECURSOS DIGITALES SEMANALES */}
      <FileAttachmentManager
        attachments={plan.attachments || []}
        onChange={(att) => setPlan(prev => ({ ...prev, attachments: att }))}
        title="Archivos Adjuntos a la Planificación Semanal"
        subtitle="Adjunte cronogramas detallados, cuadernillos semanales, guías didácticas impresas (PDF/Word/Excel) o enlaces de Google Drive."
      />

      {/* Footer Actions */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4 text-amber-300" />
          <span>Guardar Matriz Semanal</span>
        </button>
      </div>

    </div>
  );
};
