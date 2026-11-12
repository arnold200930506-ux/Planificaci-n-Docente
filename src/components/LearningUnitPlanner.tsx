import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Save, 
  Trash2, 
  Sparkles, 
  Calendar, 
  ArrowLeft, 
  Printer, 
  Check,
  Wand2,
  Loader2,
  UserCheck
} from 'lucide-react';
import { 
  LearningUnit, 
  EducationalLevel, 
  SubjectArea, 
  FundamentalCompetencyKey, 
  SchoolConfig,
  InicialDomain,
  InicialUnitData,
  Teacher
} from '../types/minerd';
import { 
  FUNDAMENTAL_COMPETENCIES, 
  TRANSVERSAL_AXES 
} from '../data/minerdCurriculum';
import { FileAttachmentManager } from './FileAttachmentManager';
import { aiAssistantService } from '../services/aiAssistantService';

const TEACHING_STRATEGIES = [
  'Aprendizaje Basado en Proyectos (ABP)',
  'Indagación Dialógica y Cuestionamiento',
  'Aprendizaje Basado en Problemas',
  'El Juego-Trabajo y Centros de Interés (Nivel Inicial)',
  'Inserción de Maestros y Estudiantes en el Entorno',
  'Socialización Centrada en Actividades Grupales',
  'Estudio de Casos y Debate Dirigido'
];

interface LearningUnitPlannerProps {
  units: LearningUnit[];
  schoolConfig: SchoolConfig;
  teachers?: Teacher[];
  initialDraftUnit?: Partial<LearningUnit> | null;
  onClearDraftUnit?: () => void;
  onSave?: (unit: LearningUnit) => void;
  onSaveUnit?: (unit: LearningUnit) => void;
  onDelete?: (id: string) => void;
  onDeleteUnit?: (id: string) => void;
  onPrint?: (unitId: string) => void;
  onPrintUnit?: (unitId: string) => void;
}

export const INDIVIDUAL_GRADES_LIST = [
  { value: 'Párvulo (Nivel Inicial)', label: 'Párvulo (Nivel Inicial - 1 a 2 años)', level: 'inicial' as EducationalLevel },
  { value: 'Pre-Kínder (Nivel Inicial)', label: 'Pre-Kínder (Nivel Inicial - 3 años)', level: 'inicial' as EducationalLevel },
  { value: 'Kínder (Nivel Inicial)', label: 'Kínder (Nivel Inicial - 4 años)', level: 'inicial' as EducationalLevel },
  { value: 'Pre-Primario (Nivel Inicial)', label: 'Pre-Primario (Nivel Inicial - 5 años)', level: 'inicial' as EducationalLevel },
  { value: '1er Grado', label: '1er Grado de Primaria', level: 'primario_primer_ciclo' as EducationalLevel },
  { value: '2do Grado', label: '2do Grado de Primaria', level: 'primario_primer_ciclo' as EducationalLevel },
  { value: '3er Grado', label: '3er Grado de Primaria', level: 'primario_primer_ciclo' as EducationalLevel },
  { value: '4to Grado', label: '4to Grado de Primaria', level: 'primario_segundo_ciclo' as EducationalLevel },
  { value: '5to Grado', label: '5to Grado de Primaria', level: 'primario_segundo_ciclo' as EducationalLevel },
  { value: '6to Grado', label: '6to Grado de Primaria', level: 'primario_segundo_ciclo' as EducationalLevel },
  { value: '1ro de Secundaria', label: '1ro de Secundaria', level: 'secundario_primer_ciclo' as EducationalLevel }
];

const INICIAL_DOMAINS_LIST: { id: InicialDomain; icon: string; desc: string }[] = [
  { id: 'Dominio Socioemocional', icon: '❤️', desc: 'Identidad, autonomía, convivencia y expresión de sentimientos.' },
  { id: 'Dominio Artístico y Creativo', icon: '🎨', desc: 'Expresión plástica, corporal, musical y apreciación estética.' },
  { id: 'Dominio Psicomotor y de Salud', icon: '🏃', desc: 'Esquema corporal, motricidad gruesa/fina y hábitos de autocuidado.' },
  { id: 'Dominio de Descubrimiento del Mundo', icon: '🌱', desc: 'Indagación del entorno natural, social y pensamiento lógico.' },
  { id: 'Dominio Cognitivo', icon: '🧩', desc: 'Relaciones lógico-matemáticas, resolución de problemas y juego.' },
  { id: 'Dominio Comunicativo', icon: '💬', desc: 'Comprensión y expresión oral, iniciación a la lectura y escritura.' }
];

const DEFAULT_INICIAL_UNIT_DATA: InicialUnitData = {
  experienceType: 'Unidad de Aprendizaje',
  centerOfInterest: '',
  selectedDomains: ['Dominio Socioemocional', 'Dominio Comunicativo', 'Dominio Cognitivo'],
  themeSelection: '',
  whatTheyKnow: ['Identifican elementos básicos de su entorno cercano y familiar.'],
  whatTheyWantToKnow: ['¿Cómo funciona y cómo podemos cuidarlo entre todos?'],
  howTheyWillLearn: ['Explorando en el patio, observando láminas, cantando canciones y creando un mural grupal.'],
  learningZonesResources: [
    'Zona de Dramatización: disfraces, títeres y utensilios del hogar.',
    'Zona de Construcción: bloques de madera, cajas y figuras geométricas.',
    'Zona de Arte: témperas, pinceles, masilla y papel crepé.'
  ]
};

const EMPTY_UNIT: LearningUnit = {
  id: '',
  title: '',
  level: 'primario_primer_ciclo',
  grade: '1er Grado',
  area: 'Lengua Española',
  durationWeeks: 4,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  learningSituation: '',
  fundamentalCompetencies: ['comunicativa', 'pensamiento_logico', 'etica_ciudadana'],
  transversalAxis: TRANSVERSAL_AXES[0],
  specificCompetencies: [],
  conceptualContents: [],
  proceduralContents: [],
  attitudinalContents: [],
  contents: {
    conceptual: [],
    procedural: [],
    attitudinal: []
  },
  teachingStrategy: TEACHING_STRATEGIES[0],
  achievementIndicators: [],
  evaluationInstruments: ['Rúbrica analítica', 'Lista de cotejo', 'Portafolio de evidencias'],
  resources: ['Fascículos MINERD', 'Pizarra y marcadores', 'Libros de texto y láminas'],
  didacticalSequenceSummary: '',
  status: 'completed',
  reviewStatus: 'pending',
  inicialData: { ...DEFAULT_INICIAL_UNIT_DATA },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function formatLearningSituationText(ls: LearningUnit['learningSituation']): string {
  if (!ls) return '';
  if (typeof ls === 'string') return ls;
  return [ls.startingPoint, ls.studentRole, ls.challengeQuestion, ls.finalProduct].filter(Boolean).join(' ');
}

export function inferLevelFromGrade(grade: string): EducationalLevel {
  const g = (grade || '').toLowerCase();
  if (g.includes('inicial') || g.includes('párvulo') || g.includes('parvulo') || g.includes('kínder') || g.includes('kinder') || g.includes('pre-primario')) {
    return 'inicial';
  }
  if (g.includes('1er') || g.includes('1ro ') || g.includes('2do') || g.includes('3er') || g.includes('3ro')) {
    if (g.includes('secundaria')) return 'secundario_primer_ciclo';
    return 'primario_primer_ciclo';
  }
  if (g.includes('4to') || g.includes('5to') || g.includes('6to')) {
    return 'primario_segundo_ciclo';
  }
  if (g.includes('secundaria')) {
    return 'secundario_primer_ciclo';
  }
  return 'primario_primer_ciclo';
}

export const LearningUnitPlanner: React.FC<LearningUnitPlannerProps> = ({
  units,
  schoolConfig,
  teachers = [],
  initialDraftUnit,
  onClearDraftUnit,
  onSave,
  onSaveUnit,
  onDelete,
  onDeleteUnit,
  onPrint,
  onPrintUnit
}) => {
  const triggerSave = (u: LearningUnit) => {
    if (onSave) onSave(u);
    else if (onSaveUnit) onSaveUnit(u);
  };
  const triggerDelete = (id: string) => {
    if (onDelete) onDelete(id);
    else if (onDeleteUnit) onDeleteUnit(id);
  };
  const triggerPrint = (id: string) => {
    if (onPrint) onPrint(id);
    else if (onPrintUnit) onPrintUnit(id);
  };
  const [editingUnit, setEditingUnit] = useState<LearningUnit | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<LearningUnit | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generator state for Situación de Aprendizaje
  const [genContext, setGenContext] = useState('');
  const [genProblem, setGenProblem] = useState('');
  const [genProduct, setGenProduct] = useState('');

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiFeedbackMsg, setAiFeedbackMsg] = useState<string | null>(null);

  // Local inputs for adding items to lists
  const [newCompInput, setNewCompInput] = useState('');
  const [newConceptualInput, setNewConceptualInput] = useState('');
  const [newProceduralInput, setNewProceduralInput] = useState('');
  const [newAttitudinalInput, setNewAttitudinalInput] = useState('');
  const [newIndicatorInput, setNewIndicatorInput] = useState('');

  useEffect(() => {
    if (initialDraftUnit) {
      const gradeVal = initialDraftUnit.grade || '1er Grado';
      const inferredLevel = initialDraftUnit.level || inferLevelFromGrade(gradeVal);
      const draft: LearningUnit = {
        ...EMPTY_UNIT,
        ...initialDraftUnit,
        id: initialDraftUnit.id || `lu-${Date.now()}`,
        grade: gradeVal,
        level: inferredLevel,
        teacherName: initialDraftUnit.teacherName || schoolConfig.teacherName,
        inicialData: initialDraftUnit.inicialData || { ...DEFAULT_INICIAL_UNIT_DATA }
      };
      setCurrentUnit(draft);
      setIsCreating(true);
      if (onClearDraftUnit) onClearDraftUnit();
    }
  }, [initialDraftUnit]);

  const startNewUnit = () => {
    const newU: LearningUnit = {
      ...EMPTY_UNIT,
      id: `lu-${Date.now()}`,
      teacherName: schoolConfig.teacherName,
      inicialData: { ...DEFAULT_INICIAL_UNIT_DATA }
    };
    setCurrentUnit(newU);
    setEditingUnit(null);
    setIsCreating(true);
  };

  const startEditUnit = (u: LearningUnit) => {
    const conc = Array.isArray(u.contents?.conceptual) ? u.contents!.conceptual : (Array.isArray(u.conceptualContents) ? u.conceptualContents : []);
    const proc = Array.isArray(u.contents?.procedural) ? u.contents!.procedural : (Array.isArray(u.proceduralContents) ? u.proceduralContents : []);
    const att = Array.isArray(u.contents?.attitudinal) ? u.contents!.attitudinal : (Array.isArray(u.attitudinalContents) ? u.attitudinalContents : []);
    setCurrentUnit({
      ...u,
      level: u.level || inferLevelFromGrade(u.grade),
      learningSituation: formatLearningSituationText(u.learningSituation),
      specificCompetencies: Array.isArray(u.specificCompetencies) ? u.specificCompetencies : [],
      conceptualContents: conc,
      proceduralContents: proc,
      attitudinalContents: att,
      contents: {
        conceptual: conc,
        procedural: proc,
        attitudinal: att
      },
      achievementIndicators: Array.isArray(u.achievementIndicators) ? u.achievementIndicators : [],
      inicialData: u.inicialData || { ...DEFAULT_INICIAL_UNIT_DATA }
    });
    setEditingUnit(u);
    setIsCreating(true);
  };

  const handleGenerateSituation = () => {
    if (!currentUnit) return;
    const context = genContext.trim() || `En el centro educativo ${schoolConfig.schoolName}, los estudiantes de ${currentUnit.grade}`;
    const problem = genProblem.trim() || `muestran curiosidad e interés por profundizar en los conocimientos prácticos de ${currentUnit.level === 'inicial' ? 'su entorno cercano' : currentUnit.area}`;
    const product = genProduct.trim() || 'una exposición interactiva y portafolio de producciones grupales';
    const strategy = (currentUnit.teachingStrategy || TEACHING_STRATEGIES[0]).toLowerCase();

    const situationText = `${context} ${problem}. Ante esta situación pedagógica, mediante la estrategia de ${strategy}, los estudiantes investigarán, analizarán fuentes diversas y desarrollarán talleres colaborativos para elaborar como producto final ${product}, socializando sus hallazgos y aprendizajes con toda la comunidad educativa.`;

    setCurrentUnit(prev => prev ? { ...prev, learningSituation: situationText } : null);
  };

  const handleGenerateUnitWithAI = async () => {
    if (!currentUnit) return;
    setIsGeneratingAI(true);
    setAiFeedbackMsg(null);
    try {
      const topicToUse =
        currentUnit.title.trim() ||
        currentUnit.inicialData?.themeSelection?.trim() ||
        aiPrompt.trim() ||
        (currentUnit.level === 'inicial' ? 'Mi escuela, mi familia y mi comunidad' : `Proyecto práctico de ${currentUnit.area} en ${currentUnit.grade}`);

      const result = await aiAssistantService.generatePlan({
        planType: 'unit',
        level: currentUnit.level,
        grade: currentUnit.grade,
        area: currentUnit.level === 'inicial' ? 'Nivel Inicial (Por Dominios)' : currentUnit.area,
        topic: topicToUse,
        teacherPrompt: aiPrompt.trim()
      });

      const d = result.data || {};
      setCurrentUnit(prev => {
        if (!prev) return null;
        const nextConc = Array.isArray(d.contents?.conceptual) && d.contents.conceptual.length > 0 ? d.contents.conceptual : (prev.contents?.conceptual || prev.conceptualContents || []);
        const nextProc = Array.isArray(d.contents?.procedural) && d.contents.procedural.length > 0 ? d.contents.procedural : (prev.contents?.procedural || prev.proceduralContents || []);
        const nextAtt = Array.isArray(d.contents?.attitudinal) && d.contents.attitudinal.length > 0 ? d.contents.attitudinal : (prev.contents?.attitudinal || prev.attitudinalContents || []);
        return {
          ...prev,
          title: d.title || prev.title || topicToUse,
          learningSituation: d.learningSituation || prev.learningSituation,
          teachingStrategy: d.teachingStrategy || prev.teachingStrategy,
          transversalAxis: d.transversalAxis || prev.transversalAxis,
          specificCompetencies: Array.isArray(d.specificCompetencies) && d.specificCompetencies.length > 0 ? d.specificCompetencies : prev.specificCompetencies,
          conceptualContents: nextConc,
          proceduralContents: nextProc,
          attitudinalContents: nextAtt,
          contents: {
            conceptual: nextConc,
            procedural: nextProc,
            attitudinal: nextAtt
          },
          achievementIndicators: Array.isArray(d.achievementIndicators) && d.achievementIndicators.length > 0 ? d.achievementIndicators : prev.achievementIndicators,
          didacticalSequenceSummary: d.didacticalSequenceSummary || prev.didacticalSequenceSummary,
          evaluationInstruments: Array.isArray(d.evaluationInstruments) && d.evaluationInstruments.length > 0 ? d.evaluationInstruments : prev.evaluationInstruments,
          resources: Array.isArray(d.resources) && d.resources.length > 0 ? d.resources : prev.resources,
          inicialData: prev.level === 'inicial' && d.inicialData ? {
            ...(prev.inicialData || DEFAULT_INICIAL_UNIT_DATA),
            themeSelection: d.inicialData.themeSelection || d.title || topicToUse,
            whatTheyKnow: Array.isArray(d.inicialData.whatTheyKnow) ? d.inicialData.whatTheyKnow : (prev.inicialData?.whatTheyKnow || []),
            whatTheyWantToKnow: Array.isArray(d.inicialData.whatTheyWantToKnow) ? d.inicialData.whatTheyWantToKnow : (prev.inicialData?.whatTheyWantToKnow || []),
            howTheyWillLearn: Array.isArray(d.inicialData.howTheyWillLearn) ? d.inicialData.howTheyWillLearn : (prev.inicialData?.howTheyWillLearn || []),
            learningZonesResources: Array.isArray(d.inicialData.learningZonesResources) ? d.inicialData.learningZonesResources : (prev.inicialData?.learningZonesResources || [])
          } : prev.inicialData
        };
      });
      setAiFeedbackMsg('¡Unidad completada con Inteligencia Artificial según la Adecuación Curricular! Revise los campos y presione "Guardar Unidad".');
    } catch (error) {
      console.error('Error generating unit with AI:', error);
      setAiFeedbackMsg('Se generó una estructura base curricular. Puede editar cualquier apartado libremente.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSave = () => {
    if (!currentUnit) return;

    const fallbackTitle =
      currentUnit.title.trim() ||
      currentUnit.inicialData?.themeSelection?.trim() ||
      currentUnit.inicialData?.centerOfInterest?.trim() ||
      `Unidad de ${currentUnit.level === 'inicial' ? 'Nivel Inicial' : currentUnit.area} (${currentUnit.grade})`;

    const conc = currentUnit.contents?.conceptual || currentUnit.conceptualContents || [];
    const proc = currentUnit.contents?.procedural || currentUnit.proceduralContents || [];
    const att = currentUnit.contents?.attitudinal || currentUnit.attitudinalContents || [];

    const unitToSave: LearningUnit = {
      ...currentUnit,
      id: currentUnit.id || `lu-${Date.now()}`,
      title: fallbackTitle,
      conceptualContents: conc,
      proceduralContents: proc,
      attitudinalContents: att,
      contents: {
        conceptual: conc,
        procedural: proc,
        attitudinal: att
      },
      status: currentUnit.status || 'completed',
      reviewStatus: currentUnit.reviewStatus || 'pending',
      updatedAt: new Date().toISOString()
    };

    triggerSave(unitToSave);
    setCurrentUnit(unitToSave);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsCreating(false);
    }, 900);
  };

  const toggleFundamental = (key: FundamentalCompetencyKey) => {
    if (!currentUnit) return;
    setCurrentUnit(prev => {
      if (!prev) return null;
      const exists = prev.fundamentalCompetencies.includes(key);
      if (exists && prev.fundamentalCompetencies.length === 1) return prev;
      return {
        ...prev,
        fundamentalCompetencies: exists
          ? prev.fundamentalCompetencies.filter(k => k !== key)
          : [...prev.fundamentalCompetencies, key]
      };
    });
  };

  const toggleInicialDomain = (domain: InicialDomain) => {
    if (!currentUnit) return;
    setCurrentUnit(prev => {
      if (!prev) return null;
      const currentDomains = prev.inicialData?.selectedDomains || [];
      const exists = currentDomains.includes(domain);
      const nextDomains = exists
        ? currentDomains.filter(d => d !== domain)
        : [...currentDomains, domain];
      return {
        ...prev,
        inicialData: {
          ...(prev.inicialData || DEFAULT_INICIAL_UNIT_DATA),
          selectedDomains: nextDomains
        }
      };
    });
  };

  const updateInicialField = <K extends keyof InicialUnitData>(field: K, value: InicialUnitData[K]) => {
    setCurrentUnit(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inicialData: {
          ...(prev.inicialData || DEFAULT_INICIAL_UNIT_DATA),
          [field]: value
        }
      };
    });
  };

  if (isCreating && currentUnit) {
    return (
      <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
        
        {/* Top Action Bar */}
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-20 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                {editingUnit ? 'Editar Unidad de Aprendizaje' : 'Nueva Unidad de Aprendizaje'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {currentUnit.grade} · {currentUnit.level === 'inicial' ? 'Nivel Inicial (Por Dominios)' : currentUnit.area}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <Check className="w-4 h-4" /> ¡Unidad Guardada!
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Guardar Unidad</span>
            </button>
          </div>
        </div>

        {/* AI Assistant Hero Generator Card */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                    Inteligencia Artificial MINERD
                  </span>
                  <span className="text-xs text-indigo-200 font-semibold">Adecuación Curricular</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                  Diseñador Automático de Unidad de Aprendizaje con IA
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Escriba el tema, problema del aula o idea para que la IA redacte toda la unidad (Ej. El cuidado del agua en nuestra comunidad, Los animales de la granja, Fracciones en el colmado...)"
                className="w-full text-xs p-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-indigo-200/70 focus:bg-white/15 focus:outline-none font-medium"
              />
            </div>
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={handleGenerateUnitWithAI}
              className="px-4 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando Unidad...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Autocompletar con IA</span>
                </>
              )}
            </button>
          </div>

          {aiFeedbackMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{aiFeedbackMsg}</span>
            </div>
          )}
        </div>

        {/* 1. Identificación General de la Unidad (Curso directo sin agrupar por ciclo) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              1. Selección de Docente, Grado Directo y Datos de la Unidad
            </h2>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Grados individuales desde Nivel Inicial hasta 1ro de Secundaria
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selector de Docente */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Docente Responsable</span>
              </label>
              <select
                value={currentUnit.teacherName || schoolConfig.teacherName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const found = teachers.find(t => t.name === selectedName);
                  setCurrentUnit(prev => {
                    if (!prev) return null;
                    const firstGrade = found?.grades?.find(g => g !== 'Maestro del Área (Rotativo)') || found?.grades?.[0];
                    const nextGrade = firstGrade && firstGrade !== 'Maestro del Área (Rotativo)' ? firstGrade : prev.grade;
                    const nextLevel = inferLevelFromGrade(nextGrade);
                    const nextArea = found?.areas?.[0] || prev.area;
                    return {
                      ...prev,
                      teacherName: selectedName,
                      teacherId: found?.id || prev.teacherId,
                      grade: nextGrade,
                      level: nextLevel,
                      area: nextArea
                    };
                  });
                }}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value={schoolConfig.teacherName}>{schoolConfig.teacherName} (Docente Activo)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name} — {t.grades?.join(', ')} {t.areas?.length ? `(${t.areas.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Curso / Grado Directo (Sin agrupar por ciclos) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Curso / Grado en que Trabaja *
              </label>
              <select
                value={currentUnit.grade}
                onChange={(e) => {
                  const selectedGrade = e.target.value;
                  const detectedLevel = inferLevelFromGrade(selectedGrade);
                  setCurrentUnit(prev => prev ? {
                    ...prev,
                    grade: selectedGrade,
                    level: detectedLevel
                  } : null);
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

            {/* Asignatura o Enfoque Integrado */}
            {currentUnit.level === 'inicial' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Modalidad Curricular</label>
                <div className="w-full text-xs p-3 bg-amber-50 border border-amber-300 rounded-xl font-black text-amber-950 flex items-center gap-2">
                  <span>🧒</span>
                  <span>Por Dominios (Nivel Inicial)</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Área Curricular / Asignatura</label>
                <select
                  value={currentUnit.area}
                  onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, area: e.target.value as SubjectArea } : null)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
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
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Título de la Unidad de Aprendizaje *
              </label>
              <input
                type="text"
                value={currentUnit.title}
                onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Ej. Cuidemos los Recursos Naturales de Nuestra Comunidad"
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Duración (Semanas)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={currentUnit.durationWeeks}
                onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, durationWeeks: Number(e.target.value) || 4 } : null)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Estrategia Articuladora</label>
              <select
                value={currentUnit.teachingStrategy}
                onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, teachingStrategy: e.target.value } : null)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {TEACHING_STRATEGIES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Eje Transversal</label>
              <select
                value={currentUnit.transversalAxis}
                onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, transversalAxis: e.target.value } : null)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {TRANSVERSAL_AXES.map(ax => (
                  <option key={ax} value={ax}>{ax}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha Inicio</label>
              <input
                type="date"
                value={currentUnit.startDate}
                onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Fecha Cierre</label>
              <input
                type="date"
                value={currentUnit.endDate}
                onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* APARTADO EXCLUSIVO PARA NIVEL INICIAL: DOMINIOS Y CUADRO DE ANTICIPACIÓN */}
        {currentUnit.level === 'inicial' && (
          <div className="bg-amber-50/70 p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-xs space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2.5 bg-amber-400 rounded-2xl shadow-xs">🧒</span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-amber-500 text-slate-950 rounded-full">
                    Diseño Curricular Nivel Inicial MINERD
                  </span>
                  <h2 className="text-base font-black text-amber-950 mt-0.5">
                    Dominios de Desarrollo y Cuadro de Anticipación
                  </h2>
                </div>
              </div>
            </div>

            {/* 1. Tipo de Planificación y Centro de Interés */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1.5">
                  Tipo de Planificación en Nivel Inicial
                </label>
                <select
                  value={currentUnit.inicialData?.experienceType || 'Unidad de Aprendizaje'}
                  onChange={(e) => updateInicialField('experienceType', e.target.value as any)}
                  className="w-full text-xs p-3 bg-white border border-amber-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="Centro de Interés">Centro de Interés</option>
                  <option value="Proyecto de Aula">Proyecto de Aula</option>
                  <option value="Unidad de Aprendizaje">Unidad de Aprendizaje</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-amber-950 mb-1.5">
                  Tema / Centro de Interés o Situación Detonadora
                </label>
                <input
                  type="text"
                  value={currentUnit.inicialData?.themeSelection || ''}
                  onChange={(e) => updateInicialField('themeSelection', e.target.value)}
                  placeholder="Ej. Los insectos que visitan el jardín de nuestro preescolar / Mi familia y mi hogar"
                  className="w-full text-xs p-3 bg-white border border-amber-300 rounded-xl font-bold text-slate-800"
                />
              </div>
            </div>

            {/* 2. Dominios de Desarrollo */}
            <div>
              <label className="block text-xs font-black text-amber-950 uppercase tracking-wider mb-2.5">
                Dominios de Desarrollo que se Integran en esta Planificación
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {INICIAL_DOMAINS_LIST.map((dom) => {
                  const selected = (currentUnit.inicialData?.selectedDomains || []).includes(dom.id);
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => toggleInicialDomain(dom.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        selected
                          ? 'bg-amber-400/30 border-amber-500 text-amber-950 font-black shadow-2xs'
                          : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <span className="text-lg shrink-0">{dom.icon}</span>
                      <div>
                        <p className="text-xs font-black leading-tight">{dom.id}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{dom.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Cuadro de Anticipación */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                Cuadro de Anticipación Pedagógica (Con los Niños y Niñas)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-amber-300 space-y-2">
                  <label className="block text-xs font-black text-emerald-900">
                    1. ¿Qué sabemos sobre el tema?
                  </label>
                  <textarea
                    rows={4}
                    value={(currentUnit.inicialData?.whatTheyKnow || []).join('\n')}
                    onChange={(e) => updateInicialField('whatTheyKnow', e.target.value.split('\n'))}
                    placeholder="Escriba las respuestas y saberes previos expresados por los niños (una por línea)..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                  />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-300 space-y-2">
                  <label className="block text-xs font-black text-blue-900">
                    2. ¿Qué queremos saber / aprender?
                  </label>
                  <textarea
                    rows={4}
                    value={(currentUnit.inicialData?.whatTheyWantToKnow || []).join('\n')}
                    onChange={(e) => updateInicialField('whatTheyWantToKnow', e.target.value.split('\n'))}
                    placeholder="Preguntas e inquietudes de los niños (una por línea)..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                  />
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-300 space-y-2">
                  <label className="block text-xs font-black text-purple-900">
                    3. ¿Cómo lo vamos a saber / hacer?
                  </label>
                  <textarea
                    rows={4}
                    value={(currentUnit.inicialData?.howTheyWillLearn || []).join('\n')}
                    onChange={(e) => updateInicialField('howTheyWillLearn', e.target.value.split('\n'))}
                    placeholder="Actividades lúdicas, paseos, experimentos, cuentos (una por línea)..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 4. Recursos para los Rincones / Zonas de Juego-Trabajo */}
            <div className="bg-white p-4 rounded-2xl border border-amber-300 space-y-2">
              <label className="block text-xs font-black text-amber-950">
                Ambientación de las Zonas / Rincones de Juego-Trabajo (Arte, Construcción, Dramatización, Biblioteca, Ciencias)
              </label>
              <textarea
                rows={3}
                value={(currentUnit.inicialData?.learningZonesResources || []).join('\n')}
                onChange={(e) => updateInicialField('learningZonesResources', e.target.value.split('\n'))}
                placeholder="Materiales y recursos que se integrarán en las zonas de juego durante esta unidad..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* 2. Generador de Situación de Aprendizaje */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                2. Situación de Aprendizaje Contextualizada
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Redacte la situación directamente o use el asistente rápido de 3 pasos
              </p>
            </div>
          </div>

          <div className="bg-indigo-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Asistente de Redacción de Situación de Aprendizaje
              </span>
              <button
                type="button"
                onClick={handleGenerateSituation}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Redactar Situación Automáticamente
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">A. Contexto / Punto de Partida</label>
                <input
                  type="text"
                  value={genContext}
                  onChange={(e) => setGenContext(e.target.value)}
                  placeholder="Ej. En la Escuela Peña Gómez tras las lluvias..."
                  className="w-full text-xs p-2.5 bg-white border border-indigo-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">B. Problema o Interés</label>
                <input
                  type="text"
                  value={genProblem}
                  onChange={(e) => setGenProblem(e.target.value)}
                  placeholder="Ej. desconocen cómo prevenir el dengue..."
                  className="w-full text-xs p-2.5 bg-white border border-indigo-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">C. Producto Final Esperado</label>
                <input
                  type="text"
                  value={genProduct}
                  onChange={(e) => setGenProduct(e.target.value)}
                  placeholder="Ej. una campaña escolar y mural informativo..."
                  className="w-full text-xs p-2.5 bg-white border border-indigo-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Texto de la Situación de Aprendizaje
            </label>
            <textarea
              rows={4}
              value={formatLearningSituationText(currentUnit.learningSituation)}
              onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, learningSituation: e.target.value } : null)}
              placeholder="Describa el contexto, la necesidad o problema, la estrategia metodológica y el producto final..."
              className="w-full text-xs p-4 bg-slate-50 border border-slate-200 rounded-2xl leading-relaxed"
            />
          </div>
        </div>

        {/* 3. Competencias Fundamentales y Específicas */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            3. Competencias Fundamentales y Específicas (Adecuación Curricular)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {FUNDAMENTAL_COMPETENCIES.map(comp => {
              const checked = currentUnit.fundamentalCompetencies.includes(comp.key);
              return (
                <button
                  key={comp.key}
                  type="button"
                  onClick={() => toggleFundamental(comp.key)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    checked
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                    checked ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                  }`}>
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs leading-tight">{comp.name}</span>
                </button>
              );
            })}
          </div>

          {/* Competencias Específicas */}
          <div className="pt-2 space-y-2.5">
            <label className="block text-xs font-bold text-slate-700">
              Competencias Específicas del Grado / Dominio
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCompInput}
                onChange={(e) => setNewCompInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCompInput.trim()) {
                    e.preventDefault();
                    setCurrentUnit(prev => prev ? { ...prev, specificCompetencies: [...prev.specificCompetencies, newCompInput.trim()] } : null);
                    setNewCompInput('');
                  }
                }}
                placeholder="Escriba una competencia específica y presione Agregar..."
                className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newCompInput.trim()) return;
                  setCurrentUnit(prev => prev ? { ...prev, specificCompetencies: [...prev.specificCompetencies, newCompInput.trim()] } : null);
                  setNewCompInput('');
                }}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0"
              >
                + Agregar
              </button>
            </div>
            {currentUnit.specificCompetencies.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {currentUnit.specificCompetencies.map((comp, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-800 font-medium">{idx + 1}. {comp}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentUnit(prev => prev ? { ...prev, specificCompetencies: prev.specificCompetencies.filter((_, i) => i !== idx) } : null)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Contenidos Mediadores e Indicadores de Logro */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            4. Contenidos Mediadores, Indicadores de Logro y Secuencia Didáctica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conceptuales */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <label className="block text-xs font-black text-indigo-950">Contenidos Conceptuales</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newConceptualInput}
                  onChange={(e) => setNewConceptualInput(e.target.value)}
                  placeholder="Agregar concepto..."
                  className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newConceptualInput.trim()) return;
                    setCurrentUnit(prev => {
                      if (!prev) return null;
                      const list = [...(prev.contents?.conceptual || prev.conceptualContents || []), newConceptualInput.trim()];
                      return {
                        ...prev,
                        conceptualContents: list,
                        contents: { ...(prev.contents || { conceptual: [], procedural: [], attitudinal: [] }), conceptual: list }
                      };
                    });
                    setNewConceptualInput('');
                  }}
                  className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>
              <ul className="space-y-1 text-xs">
                {(currentUnit.contents?.conceptual || currentUnit.conceptualContents || []).map((c: string, idx: number) => (
                  <li key={idx} className="flex items-start justify-between gap-1.5 bg-white p-2 rounded-lg border border-slate-200/70">
                    <span>• {c}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentUnit(prev => {
                        if (!prev) return null;
                        const list = (prev.contents?.conceptual || prev.conceptualContents || []).filter((_: string, i: number) => i !== idx);
                        return {
                          ...prev,
                          conceptualContents: list,
                          contents: { ...(prev.contents || { conceptual: [], procedural: [], attitudinal: [] }), conceptual: list }
                        };
                      })}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Procedimentales */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <label className="block text-xs font-black text-emerald-950">Contenidos Procedimentales</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newProceduralInput}
                  onChange={(e) => setNewProceduralInput(e.target.value)}
                  placeholder="Agregar procedimiento..."
                  className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newProceduralInput.trim()) return;
                    setCurrentUnit(prev => {
                      if (!prev) return null;
                      const list = [...(prev.contents?.procedural || prev.proceduralContents || []), newProceduralInput.trim()];
                      return {
                        ...prev,
                        proceduralContents: list,
                        contents: { ...(prev.contents || { conceptual: [], procedural: [], attitudinal: [] }), procedural: list }
                      };
                    });
                    setNewProceduralInput('');
                  }}
                  className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>
              <ul className="space-y-1 text-xs">
                {(currentUnit.contents?.procedural || currentUnit.proceduralContents || []).map((c: string, idx: number) => (
                  <li key={idx} className="flex items-start justify-between gap-1.5 bg-white p-2 rounded-lg border border-slate-200/70">
                    <span>• {c}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentUnit(prev => {
                        if (!prev) return null;
                        const list = (prev.contents?.procedural || prev.proceduralContents || []).filter((_: string, i: number) => i !== idx);
                        return {
                          ...prev,
                          proceduralContents: list,
                          contents: { ...(prev.contents || { conceptual: [], procedural: [], attitudinal: [] }), procedural: list }
                        };
                      })}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actitudinales */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
              <label className="block text-xs font-black text-purple-950">Valores y Actitudes</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newAttitudinalInput}
                  onChange={(e) => setNewAttitudinalInput(e.target.value)}
                  placeholder="Agregar actitud/valor..."
                  className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newAttitudinalInput.trim()) return;
                    setCurrentUnit(prev => {
                      if (!prev) return null;
                      const list = [...(prev.contents?.attitudinal || prev.attitudinalContents || []), newAttitudinalInput.trim()];
                      return {
                        ...prev,
                        attitudinalContents: list,
                        contents: { ...(prev.contents || { conceptual: [], procedural: [], attitudinal: [] }), attitudinal: list }
                      };
                    });
                    setNewAttitudinalInput('');
                  }}
                  className="px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  +
                </button>
              </div>
              <ul className="space-y-1 text-xs">
                {(currentUnit.contents?.attitudinal || currentUnit.attitudinalContents || []).map((c: string, idx: number) => (
                  <li key={idx} className="flex items-start justify-between gap-1.5 bg-white p-2 rounded-lg border border-slate-200/70">
                    <span>• {c}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentUnit(prev => {
                        if (!prev) return null;
                        const list = (prev.contents?.attitudinal || prev.attitudinalContents || []).filter((_: string, i: number) => i !== idx);
                        return {
                          ...prev,
                          attitudinalContents: list,
                          contents: { ...(prev.contents || { conceptual: [], procedural: [], attitudinal: [] }), attitudinal: list }
                        };
                      })}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Indicadores de Logro */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Indicadores de Logro de la Unidad</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIndicatorInput}
                onChange={(e) => setNewIndicatorInput(e.target.value)}
                placeholder="Escriba un indicador de logro y presione Agregar..."
                className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newIndicatorInput.trim()) return;
                  setCurrentUnit(prev => prev ? { ...prev, achievementIndicators: [...prev.achievementIndicators, newIndicatorInput.trim()] } : null);
                  setNewIndicatorInput('');
                }}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                + Indicador
              </button>
            </div>
            {currentUnit.achievementIndicators.length > 0 && (
              <div className="space-y-1.5">
                {currentUnit.achievementIndicators.map((ind, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs">
                    <span className="text-emerald-950 font-medium">✓ {ind}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentUnit(prev => prev ? { ...prev, achievementIndicators: prev.achievementIndicators.filter((_, i) => i !== idx) } : null)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen de Secuencia Didáctica */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Resumen de la Secuencia Didáctica / Actividades por Semanas
            </label>
            <textarea
              rows={4}
              value={currentUnit.didacticalSequenceSummary}
              onChange={(e) => setCurrentUnit(prev => prev ? { ...prev, didacticalSequenceSummary: e.target.value } : null)}
              placeholder="Describa la progresión de las actividades durante las semanas de la unidad..."
              className="w-full text-xs p-4 bg-slate-50 border border-slate-200 rounded-2xl leading-relaxed"
            />
          </div>
        </div>

        {/* ARCHIVOS ADJUNTOS DE LA UNIDAD DE APRENDIZAJE */}
        <FileAttachmentManager
          attachments={currentUnit.attachments || []}
          onChange={(att) => setCurrentUnit(prev => prev ? { ...prev, attachments: att } : null)}
          title="Archivos Adjuntos a la Unidad de Aprendizaje"
          subtitle="Suba matrices de unidad en Word/PDF, instrumentos de evaluación (rúbricas), proyectos integradores o enlaces externos."
        />

        {/* Bottom Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Guardar Unidad de Aprendizaje</span>
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Institutional Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border-2 border-dashed border-indigo-400/40 p-1 flex items-center justify-center shrink-0 shadow-inner">
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
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-lg">
                  Proyectos & Unidades con IA
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  {schoolConfig.schoolCode ? `Código: ${schoolConfig.schoolCode}` : 'MINERD'}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-300 font-medium">Nivel Inicial a 1ro de Secundaria</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {schoolConfig.schoolName}
              </h2>
              <p className="text-xs text-slate-300/90 font-normal leading-relaxed max-w-2xl">
                Unidades de Aprendizaje con selección directa del grado del docente y asistente de Inteligencia Artificial alineado a la Adecuación Curricular.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5 shrink-0 gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Unidades Registradas</span>
            <span className="text-base font-black text-amber-300 font-mono">{units.length} Unidades</span>
            <span className="text-[10px] text-slate-400 font-medium">{schoolConfig.schoolYear}</span>
          </div>
        </div>
      </div>

      {/* Header Action */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Planificación Macro y Meso Curricular
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Unidades de Aprendizaje</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Elija su grado directamente (sin agrupar por ciclos) y diseñe su unidad con apoyo de Inteligencia Artificial.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewUnit}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Nueva Unidad de Aprendizaje</span>
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {units.map(u => (
          <div key={u.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:border-indigo-200 transition-all">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg ${
                    u.level === 'inicial' ? 'bg-amber-100 text-amber-950' : 'bg-indigo-50 text-indigo-800'
                  }`}>
                    {u.level === 'inicial' ? '🧒 Nivel Inicial (Por Dominios)' : u.area}
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg">
                    {u.grade} · {u.durationWeeks} semanas
                  </span>
                  {u.teacherName && (
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 rounded-lg">
                      Prof. {u.teacherName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => triggerPrint(u.id)}
                    className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                    title="Imprimir Unidad"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDelete(u.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar Unidad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug">{u.title}</h3>

              {formatLearningSituationText(u.learningSituation) && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Situación de Aprendizaje
                  </p>
                  <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                    {formatLearningSituationText(u.learningSituation)}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {u.fundamentalCompetencies.map(fc => {
                  const found = FUNDAMENTAL_COMPETENCIES.find(c => c.key === fc);
                  return found ? (
                    <span key={fc} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {found.shortName}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                {u.startDate} → {u.endDate}
              </span>
              <button
                type="button"
                onClick={() => startEditUnit(u)}
                className="font-extrabold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Abrir / Editar Unidad →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
