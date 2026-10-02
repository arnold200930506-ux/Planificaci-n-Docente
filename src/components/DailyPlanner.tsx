import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Printer, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  ArrowLeft, 
  Clock, 
  BookOpen,
  CheckCircle2,
  Users,
  AlertCircle,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { 
  DailyPlan, 
  EducationalLevel, 
  SubjectArea, 
  FundamentalCompetencyKey, 
  EvaluationType, 
  EvaluationAgent, 
  EvaluationInstrument, 
  StudentGrouping,
  SchoolConfig,
  Teacher,
  DailyAttendance,
  PsychologyCaseReport
} from '../types/minerd';
import { 
  FUNDAMENTAL_COMPETENCIES, 
  TRANSVERSAL_AXES, 
  METACOGNITION_QUESTIONS, 
  CURRICULAR_DATABASE 
} from '../data/minerdCurriculum';
import { FileAttachmentManager } from './FileAttachmentManager';
import { Paperclip } from 'lucide-react';

interface DailyPlannerProps {
  initialPlan?: DailyPlan | null;
  schoolConfig: SchoolConfig;
  teachers?: Teacher[];
  onSave: (plan: DailyPlan) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  onPrint: (planId: string) => void;
  onDispatchPsychologyReport?: (report: PsychologyCaseReport) => void;
}

const DEFAULT_EMPTY_PLAN: DailyPlan = {
  id: '',
  title: '',
  date: new Date().toISOString().split('T')[0],
  level: 'primario_segundo_ciclo',
  grade: '4to Grado',
  section: 'A',
  area: 'Lengua Española',
  unitTheme: '',
  pedagogicalIntention: '',
  fundamentalCompetencies: ['comunicativa', 'pensamiento_logico'],
  specificCompetencies: [],
  transversalAxis: TRANSVERSAL_AXES[0],
  conceptualContents: [],
  proceduralContents: [],
  attitudinalContents: [],
  achievementIndicators: [],
  startDuration: 15,
  startActivities: '',
  developmentDuration: 60,
  developmentActivities: '',
  studentGrouping: 'Equipos pequeños (3-4)',
  closeDuration: 15,
  closeActivities: '',
  metacognitionQuestions: '',
  didacticResources: ['Pizarra y marcadores', 'Fascículo MINERD', 'Cuaderno del estudiante'],
  evaluationTypes: ['Formativa'],
  evaluationAgents: ['Heteroevaluación'],
  evaluationInstruments: ['Lista de Cotejo'],
  evaluationCriteria: '',
  status: 'draft',
  reviewStatus: 'pending',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DailyPlanner: React.FC<DailyPlannerProps> = ({
  initialPlan,
  schoolConfig,
  teachers = [],
  onSave,
  onDelete,
  onCancel,
  onPrint,
  onDispatchPsychologyReport
}) => {
  const normalizePlan = (rawPlan?: DailyPlan | null): DailyPlan => {
    const base = rawPlan ? { ...rawPlan } : { ...DEFAULT_EMPTY_PLAN, id: `dp-${Date.now()}` };
    return {
      ...base,
      area: base.area || 'Lengua Española',
      grade: base.grade || '4to Grado',
      section: base.section || 'A',
      level: base.level || 'primario_segundo_ciclo',
      fundamentalCompetencies: Array.isArray(base.fundamentalCompetencies) ? base.fundamentalCompetencies : ['comunicativa', 'pensamiento_logico'],
      specificCompetencies: Array.isArray(base.specificCompetencies) ? base.specificCompetencies : [],
      conceptualContents: Array.isArray(base.conceptualContents) ? base.conceptualContents : [],
      proceduralContents: Array.isArray(base.proceduralContents) ? base.proceduralContents : [],
      attitudinalContents: Array.isArray(base.attitudinalContents) ? base.attitudinalContents : [],
      achievementIndicators: Array.isArray(base.achievementIndicators) ? base.achievementIndicators : [],
      didacticResources: Array.isArray(base.didacticResources) ? base.didacticResources : ['Pizarra y marcadores'],
      evaluationTypes: Array.isArray(base.evaluationTypes) ? base.evaluationTypes : ['Formativa'],
      evaluationAgents: Array.isArray(base.evaluationAgents) ? base.evaluationAgents : ['Heteroevaluación'],
      evaluationInstruments: Array.isArray(base.evaluationInstruments) ? base.evaluationInstruments : ['Lista de Cotejo'],
      attachments: Array.isArray(base.attachments) ? base.attachments : []
    };
  };

  const [plan, setPlan] = useState<DailyPlan>(() => normalizePlan(initialPlan));

  const [activeStep, setActiveStep] = useState<number>(1);
  const [newResource, setNewResource] = useState('');
  const [newSpecificComp, setNewSpecificComp] = useState('');
  const [newConceptual, setNewConceptual] = useState('');
  const [newProcedural, setNewProcedural] = useState('');
  const [newAttitudinal, setNewAttitudinal] = useState('');
  const [newIndicator, setNewIndicator] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setPlan(normalizePlan(initialPlan));
    }
  }, [initialPlan]);

  const currentAreaTopics = CURRICULAR_DATABASE[plan.area] || [];

  const handleApplyTopicSuggestion = (topicName: string) => {
    const topic = currentAreaTopics.find(t => t.name === topicName);
    if (!topic) return;

    setPlan(prev => ({
      ...prev,
      unitTheme: topic.name,
      pedagogicalIntention: topic.suggestedIntention,
      specificCompetencies: [...topic.specificCompetencies],
      conceptualContents: [...topic.conceptual],
      proceduralContents: [...topic.procedural],
      attitudinalContents: [...topic.attitudinal],
      achievementIndicators: [...topic.indicators],
      didacticResources: [...topic.resourceSuggestions],
      startActivities: topic.startSuggestions.join('\n'),
      developmentActivities: topic.devSuggestions.join('\n'),
      closeActivities: topic.closeSuggestions.join('\n'),
      metacognitionQuestions: METACOGNITION_QUESTIONS.slice(0, 3).join('\n')
    }));
  };

  const handleSave = () => {
    if (!plan.unitTheme.trim()) {
      alert('Por favor ingrese el Tema del Día / Unidad de Aprendizaje.');
      return;
    }
    const planToSave = {
      ...plan,
      title: plan.unitTheme,
      updatedAt: new Date().toISOString()
    };
    onSave(planToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const toggleCompetency = (key: FundamentalCompetencyKey) => {
    setPlan(prev => {
      const exists = prev.fundamentalCompetencies.includes(key);
      const updated = exists 
        ? prev.fundamentalCompetencies.filter(k => k !== key)
        : [...prev.fundamentalCompetencies, key];
      return { ...prev, fundamentalCompetencies: updated };
    });
  };

  const handleAddResource = () => {
    if (newResource.trim()) {
      setPlan(prev => ({ ...prev, didacticResources: [...prev.didacticResources, newResource.trim()] }));
      setNewResource('');
    }
  };

  const handleRemoveResource = (index: number) => {
    setPlan(prev => ({ ...prev, didacticResources: prev.didacticResources.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Institutional Hero Banner with Logo Container for Multi-School Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Dynamic School Logo Container - Reads schoolConfig.logoUrl or shows institutional fallback */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border-2 border-dashed border-indigo-400/40 p-1 flex items-center justify-center shrink-0 shadow-inner group relative">
              {schoolConfig.logoUrl ? (
                <img
                  src={schoolConfig.logoUrl}
                  alt={schoolConfig.schoolName}
                  className="w-full h-full object-contain rounded-xl bg-white"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-slate-800/80 flex flex-col items-center justify-center text-center p-1">
                  <BookOpen className="w-5 h-5 text-amber-300" />
                  <span className="text-[8px] font-extrabold text-slate-300 uppercase tracking-tighter mt-0.5">Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-lg">
                  Planificación Diaria de Clases
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {schoolConfig.schoolCode ? `Código: ${schoolConfig.schoolCode}` : 'MINERD'}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-300 font-medium">{schoolConfig.tanda}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {schoolConfig.schoolName}
              </h2>
              <p className="text-xs text-slate-300/90 font-normal leading-relaxed max-w-2xl">
                Estructura de 3 momentos pedagógicos (Inicio, Desarrollo y Cierre) alineada al Diseño Curricular por competencias.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5 shrink-0 gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Año Escolar</span>
            <span className="text-sm font-black text-amber-300 font-mono">{schoolConfig.schoolYear}</span>
            <span className="text-[10px] text-slate-400 font-medium">{schoolConfig.district}</span>
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
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              {plan.unitTheme || 'Nueva Planificación Diaria'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Diseño Curricular MINERD · Escuela Dr. José Francisco Peña Gómez
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Check className="w-4 h-4" /> Guardado
            </span>
          )}

          {initialPlan && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Está seguro de eliminar permanentemente la planificación "${plan.unitTheme || plan.title}"?`)) {
                  onDelete(plan.id);
                  onCancel();
                }
              }}
              className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Eliminar esta planificación diaria"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Eliminar Plan</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onPrint(plan.id)}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
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
            <span>Guardar Plan</span>
          </button>
        </div>
      </div>

      {/* Step Navigation Tabs (4 pasos enfocados en el plan pedagógico) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all whitespace-nowrap text-center cursor-pointer ${
            activeStep === 1 
              ? 'bg-white text-slate-900 shadow-xs font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Datos & Competencias
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all whitespace-nowrap text-center cursor-pointer ${
            activeStep === 2 
              ? 'bg-white text-slate-900 shadow-xs font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Intención Pedagógica
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all whitespace-nowrap text-center cursor-pointer ${
            activeStep === 3 
              ? 'bg-white text-slate-900 shadow-xs font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Momentos de Clase
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(4)}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all whitespace-nowrap text-center cursor-pointer ${
            activeStep === 4 
              ? 'bg-white text-slate-900 shadow-xs font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Recursos & Evaluación
          {plan.attachments && plan.attachments.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-indigo-600 text-white rounded-full font-bold">
              {plan.attachments.length}
            </span>
          )}
        </button>
      </div>

      {/* STEP 1: DATOS GENERALES Y CONFIGURACIÓN CURRICULAR */}
      {activeStep === 1 && (
        <div className="space-y-6">
          
          {/* Review Feedback Banner */}
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

          {/* Institutional Header Data */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              1. Datos Institucionales y Asignatura
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Teacher Selector */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Docente Titular</label>
                <select
                  value={plan.teacherName || schoolConfig.teacherName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const foundTeacher = teachers.find(t => t.name === selectedName);
                    setPlan(prev => ({
                      ...prev,
                      teacherName: selectedName,
                      teacherId: foundTeacher?.id || prev.teacherId,
                      teacherPhone: foundTeacher?.phone || prev.teacherPhone
                    }));
                  }}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold text-slate-800"
                >
                  <option value={schoolConfig.teacherName}>{schoolConfig.teacherName} (Predeterminado)</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} — {t.areas?.join(', ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha de la Clase</label>
                <input
                  type="date"
                  value={plan.date}
                  onChange={(e) => setPlan(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nivel Educativo</label>
                <select
                  value={plan.level}
                  onChange={(e) => setPlan(prev => ({ ...prev, level: e.target.value as EducationalLevel }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                >
                  <option value="inicial">Nivel Inicial</option>
                  <option value="primario_primer_ciclo">Primario (1er Ciclo: 1ro - 3ro)</option>
                  <option value="primario_segundo_ciclo">Primario (2do Ciclo: 4to - 6to)</option>
                  <option value="secundario_primer_ciclo">Secundario (1er Ciclo: 1ro - 3ro)</option>
                  <option value="secundario_segundo_ciclo">Secundario (2do Ciclo: 4to - 6to)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Grado</label>
                <select
                  value={plan.grade}
                  onChange={(e) => setPlan(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                >
                  <option value="Kínder / Pre-Primario">Kínder / Pre-Primario</option>
                  <option value="1ro Grado">1ro Grado</option>
                  <option value="2do Grado">2do Grado</option>
                  <option value="3ro Grado">3ro Grado</option>
                  <option value="4to Grado">4to Grado</option>
                  <option value="5to Grado">5to Grado</option>
                  <option value="6to Grado">6to Grado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Sección</label>
                <input
                  type="text"
                  value={plan.section}
                  onChange={(e) => setPlan(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="A, B, C"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Área Curricular</label>
                <select
                  value={plan.area}
                  onChange={(e) => setPlan(prev => ({ ...prev, area: e.target.value as SubjectArea }))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold text-slate-800"
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

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tema del Día / Unidad</label>
                <input
                  type="text"
                  value={plan.unitTheme}
                  onChange={(e) => setPlan(prev => ({ ...prev, unitTheme: e.target.value }))}
                  placeholder="Ej. La Noticia: Estructura y Función Social"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                />
              </div>
            </div>

            {/* Quick suggestions */}
            {currentAreaTopics.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-500 mb-2">
                  Sugerencias curriculares de {plan.area}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentAreaTopics.map(topic => (
                    <button
                      key={topic.name}
                      type="button"
                      onClick={() => handleApplyTopicSuggestion(topic.name)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 border border-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      + {topic.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fundamental Competencies of MINERD */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Competencias Fundamentales MINERD
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Seleccione las competencias que tributan a la sesión de hoy</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {plan.fundamentalCompetencies.length} seleccionadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {FUNDAMENTAL_COMPETENCIES.map(comp => {
                const isChecked = plan.fundamentalCompetencies.includes(comp.key);
                return (
                  <button
                    key={comp.key}
                    type="button"
                    onClick={() => toggleCompetency(comp.key)}
                    className={`p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center ${
                      isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{comp.name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{comp.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Eje Transversal & Specific Competencies */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Eje Transversal
              </label>
              <select
                value={plan.transversalAxis}
                onChange={(e) => setPlan(prev => ({ ...prev, transversalAxis: e.target.value }))}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
              >
                {TRANSVERSAL_AXES.map(axis => (
                  <option key={axis} value={axis}>{axis}</option>
                ))}
              </select>
            </div>

            {/* Specific Competencies */}
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Competencias Específicas del Grado
              </label>

              <div className="space-y-2">
                {plan.specificCompetencies.map((comp, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                    <span className="font-bold text-indigo-600 font-mono mt-0.5">{idx + 1}.</span>
                    <span className="flex-1 text-slate-800 font-medium leading-relaxed">{comp}</span>
                    <button
                      type="button"
                      onClick={() => setPlan(prev => ({
                        ...prev,
                        specificCompetencies: prev.specificCompetencies.filter((_, i) => i !== idx)
                      }))}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSpecificComp}
                    onChange={(e) => setNewSpecificComp(e.target.value)}
                    placeholder="Agregar competencia específica..."
                    className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSpecificComp.trim()) {
                        e.preventDefault();
                        setPlan(prev => ({ ...prev, specificCompetencies: [...prev.specificCompetencies, newSpecificComp.trim()] }));
                        setNewSpecificComp('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSpecificComp.trim()) {
                        setPlan(prev => ({ ...prev, specificCompetencies: [...prev.specificCompetencies, newSpecificComp.trim()] }));
                        setNewSpecificComp('');
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Contenidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">Conceptos</label>
                <div className="space-y-1.5 min-h-[100px] bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {plan.conceptualContents.map((c, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200/60">
                      <span>• {c}</span>
                      <button
                        type="button"
                        onClick={() => setPlan(prev => ({
                          ...prev,
                          conceptualContents: prev.conceptualContents.filter((_, i) => i !== idx)
                        }))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={newConceptual}
                    onChange={(e) => setNewConceptual(e.target.value)}
                    placeholder="+ Concepto..."
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newConceptual.trim()) {
                        e.preventDefault();
                        setPlan(prev => ({ ...prev, conceptualContents: [...prev.conceptualContents, newConceptual.trim()] }));
                        setNewConceptual('');
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">Procedimientos</label>
                <div className="space-y-1.5 min-h-[100px] bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {plan.proceduralContents.map((p, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200/60">
                      <span>• {p}</span>
                      <button
                        type="button"
                        onClick={() => setPlan(prev => ({
                          ...prev,
                          proceduralContents: prev.proceduralContents.filter((_, i) => i !== idx)
                        }))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={newProcedural}
                    onChange={(e) => setNewProcedural(e.target.value)}
                    placeholder="+ Procedimiento..."
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newProcedural.trim()) {
                        e.preventDefault();
                        setPlan(prev => ({ ...prev, proceduralContents: [...prev.proceduralContents, newProcedural.trim()] }));
                        setNewProcedural('');
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">Actitudes y Valores</label>
                <div className="space-y-1.5 min-h-[100px] bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {plan.attitudinalContents.map((a, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200/60">
                      <span>• {a}</span>
                      <button
                        type="button"
                        onClick={() => setPlan(prev => ({
                          ...prev,
                          attitudinalContents: prev.attitudinalContents.filter((_, i) => i !== idx)
                        }))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={newAttitudinal}
                    onChange={(e) => setNewAttitudinal(e.target.value)}
                    placeholder="+ Actitud..."
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl mt-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newAttitudinal.trim()) {
                        e.preventDefault();
                        setPlan(prev => ({ ...prev, attitudinalContents: [...prev.attitudinalContents, newAttitudinal.trim()] }));
                        setNewAttitudinal('');
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Indicadores de Logro */}
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Indicadores de Logro
              </label>
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                {plan.achievementIndicators.map((ind, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="leading-relaxed"><span className="font-bold text-emerald-600">✓</span> {ind}</span>
                    <button
                      type="button"
                      onClick={() => setPlan(prev => ({
                        ...prev,
                        achievementIndicators: prev.achievementIndicators.filter((_, i) => i !== idx)
                      }))}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newIndicator}
                    onChange={(e) => setNewIndicator(e.target.value)}
                    placeholder="+ Agregar indicador de logro..."
                    className="flex-1 text-xs p-3 bg-white border border-slate-200 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newIndicator.trim()) {
                        e.preventDefault();
                        setPlan(prev => ({ ...prev, achievementIndicators: [...prev.achievementIndicators, newIndicator.trim()] }));
                        setNewIndicator('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newIndicator.trim()) {
                        setPlan(prev => ({ ...prev, achievementIndicators: [...prev.achievementIndicators, newIndicator.trim()] }));
                        setNewIndicator('');
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-6 py-3 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Continuar a Intención Pedagógica →
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: INTENCIÓN PEDAGÓGICA */}
      {activeStep === 2 && (
        <div className="space-y-6">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                2. Intención Pedagógica de la Sesión
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Escriba de forma clara y directa el propósito formativo que los estudiantes alcanzarán en esta clase.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Redacción de la Intención Pedagógica
              </label>
              <textarea
                rows={6}
                value={plan.pedagogicalIntention}
                onChange={(e) => setPlan(prev => ({ ...prev, pedagogicalIntention: e.target.value }))}
                placeholder="Ejemplo: Analizar la estructura de una noticia periodística (titular, lead, cuerpo) para redactar el borrador de un artículo sobre el cuidado del agua en la comunidad escolar."
                className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 font-medium leading-relaxed transition-all"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-6 py-3 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Continuar a Momentos de la Clase →
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: MOMENTOS DE LA CLASE (INICIO, DESARROLLO, CIERRE) */}
      {activeStep === 3 && (
        <div className="space-y-6">
          
          {/* Time presets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Tiempo Total:</span>
              <span className="font-mono text-indigo-700 text-sm font-black">
                {plan.startDuration + plan.developmentDuration + plan.closeDuration} min
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Bloques:</span>
              <button
                type="button"
                onClick={() => setPlan(prev => ({ ...prev, startDuration: 10, developmentDuration: 25, closeDuration: 10 }))}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
              >
                45 min (10-25-10)
              </button>
              <button
                type="button"
                onClick={() => setPlan(prev => ({ ...prev, startDuration: 15, developmentDuration: 60, closeDuration: 15 }))}
                className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl font-bold border border-indigo-200 transition-colors cursor-pointer"
              >
                90 min (15-60-15)
              </button>
            </div>
          </div>

          {/* MOMENTO 1: INICIO */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-mono font-bold">1</span>
                  Momento de Inicio
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Activación de saberes previos, retroalimentación y presentación de la intención pedagógica.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <label className="text-slate-600 font-bold">Duración:</label>
                <input
                  type="number"
                  min={5}
                  max={45}
                  value={plan.startDuration}
                  onChange={(e) => setPlan(prev => ({ ...prev, startDuration: Number(e.target.value) || 15 }))}
                  className="w-16 p-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-center"
                />
                <span className="text-slate-500 font-mono">min</span>
              </div>
            </div>

            <textarea
              rows={4}
              value={plan.startActivities}
              onChange={(e) => setPlan(prev => ({ ...prev, startActivities: e.target.value }))}
              placeholder="Describa las actividades iniciales..."
              className="w-full text-xs p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white leading-relaxed"
            />
          </div>

          {/* MOMENTO 2: DESARROLLO */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-mono font-bold">2</span>
                  Momento de Desarrollo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Construcción de aprendizajes, indagación, trabajo colaborativo y práctica guiada.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <label className="text-slate-600 font-bold">Duración:</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={plan.developmentDuration}
                  onChange={(e) => setPlan(prev => ({ ...prev, developmentDuration: Number(e.target.value) || 60 }))}
                  className="w-16 p-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-center"
                />
                <span className="text-slate-500 font-mono">min</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Agrupamiento:</label>
              <select
                value={plan.studentGrouping}
                onChange={(e) => setPlan(prev => ({ ...prev, studentGrouping: e.target.value as StudentGrouping }))}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="Equipos pequeños (3-4)">Equipos pequeños (3-4)</option>
                <option value="En parejas">En parejas</option>
                <option value="Individual">Individual</option>
                <option value="Grupo grande / Plenaria">Grupo grande / Plenaria</option>
              </select>
            </div>

            <textarea
              rows={6}
              value={plan.developmentActivities}
              onChange={(e) => setPlan(prev => ({ ...prev, developmentActivities: e.target.value }))}
              placeholder="Describa la secuencia de actividades del desarrollo..."
              className="w-full text-xs p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white leading-relaxed"
            />
          </div>

          {/* MOMENTO 3: CIERRE */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs flex items-center justify-center font-mono font-bold">3</span>
                  Momento de Cierre & Metacognición
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Síntesis de lo aprendido, preguntas metacognitivas y evaluación de la sesión.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <label className="text-slate-600 font-bold">Duración:</label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={plan.closeDuration}
                  onChange={(e) => setPlan(prev => ({ ...prev, closeDuration: Number(e.target.value) || 15 }))}
                  className="w-16 p-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-center"
                />
                <span className="text-slate-500 font-mono">min</span>
              </div>
            </div>

            <textarea
              rows={4}
              value={plan.closeActivities}
              onChange={(e) => setPlan(prev => ({ ...prev, closeActivities: e.target.value }))}
              placeholder="Describa la actividad de cierre..."
              className="w-full text-xs p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white leading-relaxed"
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preguntas de Metacognición (MINERD)
              </label>
              <textarea
                rows={3}
                value={plan.metacognitionQuestions}
                onChange={(e) => setPlan(prev => ({ ...prev, metacognitionQuestions: e.target.value }))}
                placeholder="• ¿Qué aprendimos hoy?&#10;• ¿Cómo podemos aplicar esto en nuestra vida?"
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="px-6 py-3 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Continuar a Recursos & Evaluación →
            </button>
          </div>

        </div>
      )}

      {/* STEP 4: RECURSOS Y EVALUACIÓN */}
      {activeStep === 4 && (
        <div className="space-y-6">
          
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              4. Recursos Didácticos y Evaluación
            </h2>

            {/* Resources */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Recursos Didácticos Utilizados</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {plan.didacticResources.map((res, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs rounded-xl font-medium">
                    {res}
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(idx)}
                      className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                  placeholder="+ Añadir recurso didáctico..."
                  className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddResource();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Añadir
                </button>
              </div>
            </div>

            {/* Evaluation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tipo de Evaluación</label>
                <div className="flex flex-wrap gap-2">
                  {(['Diagnóstica', 'Formativa', 'Sumativa'] as EvaluationType[]).map(t => {
                    const sel = plan.evaluationTypes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setPlan(prev => ({
                            ...prev,
                            evaluationTypes: sel ? prev.evaluationTypes.filter(x => x !== t) : [...prev.evaluationTypes, t]
                          }));
                        }}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                          sel ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Agentes de Evaluación</label>
                <div className="flex flex-wrap gap-2">
                  {(['Heteroevaluación', 'Autoevaluación', 'Coevaluación'] as EvaluationAgent[]).map(a => {
                    const sel = plan.evaluationAgents.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setPlan(prev => ({
                            ...prev,
                            evaluationAgents: sel ? prev.evaluationAgents.filter(x => x !== a) : [...prev.evaluationAgents, a]
                          }));
                        }}
                        className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                          sel ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Instrumentos de Evaluación</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Lista de Cotejo',
                  'Rúbrica Analítica',
                  'Escala Estimativa',
                  'Guía de Observación',
                  'Registro Anecdótico',
                  'Cuaderno del Estudiante',
                  'Prueba Escrita / Oral',
                  'Portafolio de Evidencias'
                ].map((inst) => {
                  const sel = plan.evaluationInstruments.includes(inst as EvaluationInstrument);
                  return (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => {
                        setPlan(prev => ({
                          ...prev,
                          evaluationInstruments: sel 
                            ? prev.evaluationInstruments.filter(x => x !== inst) 
                            : [...prev.evaluationInstruments, inst as EvaluationInstrument]
                        }));
                      }}
                      className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                        sel ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {inst}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Criterios de Evaluación y Evidencias</label>
              <textarea
                rows={3}
                value={plan.evaluationCriteria}
                onChange={(e) => setPlan(prev => ({ ...prev, evaluationCriteria: e.target.value }))}
                placeholder="Criterios para valorar los aprendizajes esperados..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
              />
            </div>

            {/* SECCIÓN DE ARCHIVOS ADJUNTOS / RECURSOS DIGITALES */}
            <div className="pt-2">
              <FileAttachmentManager
                attachments={plan.attachments || []}
                onChange={(att) => setPlan(prev => ({ ...prev, attachments: att }))}
                title="Archivos Adjuntos a la Planificación Diaria"
                subtitle="Adjunte fichas de trabajo de la clase, rúbricas de evaluación, guías didácticas impresas (PDF/Word) o enlaces de Google Drive."
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              ← Anterior (Momentos de Clase)
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Guardar Planificación Diaria</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
