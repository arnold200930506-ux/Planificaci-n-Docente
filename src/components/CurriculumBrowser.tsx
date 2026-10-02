import React, { useState } from 'react';
import { 
  Library, 
  Search, 
  BookOpen, 
  Sparkles, 
  CheckSquare, 
  Plus, 
  ArrowRight,
  GraduationCap,
  Layers,
  Award,
  Filter,
  CheckCircle2,
  Calendar,
  Lightbulb,
  FileText,
  Compass
} from 'lucide-react';
import { SubjectArea, CurricularTopicSuggestion } from '../types/minerd';
import { 
  CURRICULAR_DATABASE, 
  BLOOM_MINERD_VERBS, 
  METACOGNITION_QUESTIONS, 
  FUNDAMENTAL_COMPETENCIES,
  TRANSVERSAL_AXES 
} from '../data/minerdCurriculum';
import { 
  ADECUACION_CURRICULAR_DATA, 
  GRADES_LIST, 
  PERIODS_LIST,
  AdecuacionCurricularItem 
} from '../data/adecuacionCurricularData';

interface CurriculumBrowserProps {
  onSelectTopicForNewPlan: (area: SubjectArea, topic: CurricularTopicSuggestion) => void;
}

export const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({
  onSelectTopicForNewPlan
}) => {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'malla_adecuacion' | 'bank_topics' | 'verbs' | 'metacognition' | 'transversal'>('malla_adecuacion');

  // Filters for Adecuación Curricular by Grade
  const [selectedGrade, setSelectedGrade] = useState<string>('4to Grado');
  const [selectedArea, setSelectedArea] = useState<SubjectArea | 'Todas'>('Lengua Española');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Todos los Períodos');
  const [gradeSearchQuery, setGradeSearchQuery] = useState('');

  // Bank of topics filter
  const [bankArea, setBankArea] = useState<SubjectArea>('Lengua Española');
  const [bankSearchQuery, setBankSearchQuery] = useState('');

  // Selected item modal or detailed drawer
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Filtered items from the official Adecuación Curricular
  const filteredAdecuacionItems = ADECUACION_CURRICULAR_DATA.filter(item => {
    const matchGrade = selectedGrade === 'Todos' || item.grade === selectedGrade;
    const matchArea = selectedArea === 'Todas' || item.area === selectedArea;
    const matchPeriod = selectedPeriod === 'Todos los Períodos' || item.period === selectedPeriod;
    const matchSearch = !gradeSearchQuery.trim() || 
      item.unitTheme.toLowerCase().includes(gradeSearchQuery.toLowerCase()) ||
      item.pedagogicalIntention.toLowerCase().includes(gradeSearchQuery.toLowerCase()) ||
      item.conceptualContents.some(c => c.toLowerCase().includes(gradeSearchQuery.toLowerCase())) ||
      item.achievementIndicators.some(i => i.toLowerCase().includes(gradeSearchQuery.toLowerCase()));

    return matchGrade && matchArea && matchPeriod && matchSearch;
  });

  // Filtered topics from legacy topic bank
  const topicsForBankArea = CURRICULAR_DATABASE[bankArea] || [];
  const filteredBankTopics = topicsForBankArea.filter(t => 
    t.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    t.suggestedIntention.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    t.conceptual.some(c => c.toLowerCase().includes(bankSearchQuery.toLowerCase()))
  );

  // Convert an AdecuacionCurricularItem to CurricularTopicSuggestion so teachers can create a plan directly
  const handleCreatePlanFromAdecuacion = (item: AdecuacionCurricularItem) => {
    const topicSuggestion: CurricularTopicSuggestion = {
      name: item.unitTheme,
      grade: item.grade,
      suggestedIntention: item.pedagogicalIntention,
      specificCompetencies: item.specificCompetencies.map(c => `${c.title}: ${c.description}`),
      conceptual: item.conceptualContents,
      procedural: item.proceduralContents,
      attitudinal: item.attitudinalContents,
      indicators: item.achievementIndicators,
      startSuggestions: item.startSuggestions,
      devSuggestions: item.devSuggestions,
      closeSuggestions: item.closeSuggestions,
      resourceSuggestions: ['Pizarra interactiva', 'Fascículo de Adecuación Curricular MINERD', 'Cuaderno del Estudiante', 'Recursos didácticos del aula']
    };

    onSelectTopicForNewPlan(item.area, topicSuggestion);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      
      {/* Header Institucional de la Adecuación Curricular */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg shadow-xs">
                Adecuación Curricular Oficial
              </span>
              <span className="text-[10px] font-semibold text-slate-300">
                Resolución 09-2023 · Ordenanza 04-2023
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Diseño y Malla Curricular por Grado
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Consulte la malla curricular oficial ajustada para su grado: competencias específicas, contenidos priorizados (conceptos, procedimientos y actitudes) e indicadores de logro evaluables.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/10 border border-white/15 rounded-2xl text-xs font-bold overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('malla_adecuacion')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'malla_adecuacion' ? 'bg-amber-400 text-slate-950 shadow-sm font-black' : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Malla por Grado
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('bank_topics')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'bank_topics' ? 'bg-white text-slate-950 shadow-sm font-black' : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Banco de Temas
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('verbs')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'verbs' ? 'bg-white text-slate-950 shadow-sm font-black' : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Verbos Taxonómicos
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('metacognition')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'metacognition' ? 'bg-white text-slate-950 shadow-sm font-black' : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Metacognición
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: MALLA DE LA ADECUACIÓN CURRICULAR POR GRADO (LO PRINCIPAL) */}
      {/* ========================================================================= */}
      {activeSubTab === 'malla_adecuacion' && (
        <div className="space-y-5">
          
          {/* Panel de Filtros por Grado, Área y Período */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Seleccione los Criterios de su Grado
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredAdecuacionItems.length} unidad(es) curricular(es) encontrada(s)
              </span>
            </div>

            {/* 1. Selector de Grado (Pills con botones grandes y claros) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Grado Escolar:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {['Todos', ...GRADES_LIST].map(grade => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedGrade === grade
                        ? 'bg-indigo-600 text-white shadow-sm font-black ring-2 ring-indigo-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Selector de Área Curricular */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Área Curricular:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  'Todas',
                  'Lengua Española',
                  'Matemática',
                  'Ciencias de la Naturaleza',
                  'Ciencias Sociales',
                  'Educación Artística',
                  'Educación Física',
                  'Formación Integral Humana y Religiosa'
                ].map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedArea(area as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedArea === area
                        ? 'bg-slate-900 text-amber-300 shadow-xs font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Buscador en vivo de contenidos e indicadores */}
            <div className="pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={gradeSearchQuery}
                  onChange={(e) => setGradeSearchQuery(e.target.value)}
                  placeholder={`Buscar tema, indicador de logro o contenido en la malla de ${selectedGrade}...`}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Listado de Unidades de la Malla Oficial de la Adecuación */}
          <div className="space-y-4">
            {filteredAdecuacionItems.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No se encontraron mallas con los filtros seleccionados</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Pruebe seleccionando "Todos" los grados o limpie el término de búsqueda.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGrade('Todos');
                    setSelectedArea('Todas' as any);
                    setGradeSearchQuery('');
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              filteredAdecuacionItems.map((item) => {
                const isExpanded = expandedItemId === item.id;

                return (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                  >
                    {/* Tarjeta Resumen / Encabezado de la Unidad */}
                    <div className="p-5 sm:p-6 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                              {item.grade} · {item.cycle}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {item.area}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                              {item.period}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug pt-0.5">
                            {item.unitTheme}
                          </h3>
                        </div>

                        {/* Botón de Acción Directa: Planificar con esta Malla */}
                        <button
                          type="button"
                          onClick={() => handleCreatePlanFromAdecuacion(item)}
                          className="px-3.5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 hover:scale-[1.01]"
                          title="Cargar esta malla automáticamente en una nueva planificación diaria"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Planificar con este Tema</span>
                        </button>
                      </div>

                      {/* Intención Pedagógica Oficial */}
                      <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
                        <p className="font-extrabold text-slate-800 mb-0.5">🎯 Intención Pedagógica del MINERD:</p>
                        <p className="text-slate-600 leading-relaxed font-medium">
                          {item.pedagogicalIntention}
                        </p>
                      </div>

                      {/* Resumen de Malla: 3 Columnas de Contenidos (Vista Previa Rápida) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/80">
                          <span className="text-[10px] font-black uppercase text-blue-800 block mb-1">
                            📖 Conceptos Clave
                          </span>
                          <p className="text-slate-700 line-clamp-2 text-[11px] leading-snug">
                            {item.conceptualContents.join(' · ')}
                          </p>
                        </div>

                        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/80">
                          <span className="text-[10px] font-black uppercase text-emerald-800 block mb-1">
                            ⚙️ Procedimientos
                          </span>
                          <p className="text-slate-700 line-clamp-2 text-[11px] leading-snug">
                            {item.proceduralContents.join(' · ')}
                          </p>
                        </div>

                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/80">
                          <span className="text-[10px] font-black uppercase text-amber-800 block mb-1">
                            🏆 Indicadores de Logro
                          </span>
                          <p className="text-slate-700 line-clamp-2 text-[11px] leading-snug">
                            {item.achievementIndicators.join(' · ')}
                          </p>
                        </div>
                      </div>

                      {/* Botón para expandir todos los detalles curriculares */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Ocultar detalles curriculares' : 'Ver malla curricular completa (Competencias, Actitudes y Momentos sugeridos)'}</span>
                          <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        <span className="text-[10px] text-slate-400 font-medium">
                          Adecuación Curricular 2023-2024
                        </span>
                      </div>
                    </div>

                    {/* Detalle Desplegable Completo de la Adecuación */}
                    {isExpanded && (
                      <div className="bg-slate-50 p-5 sm:p-6 border-t border-slate-200/80 space-y-5 text-xs">
                        
                        {/* 1. Competencias Específicas del Grado */}
                        <div className="space-y-2">
                          <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-indigo-600" />
                            <span>Competencias Específicas de la Adecuación</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {item.specificCompetencies.map((comp, cIdx) => (
                              <div key={cIdx} className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs space-y-1">
                                <p className="font-extrabold text-indigo-900">{comp.title}</p>
                                <p className="text-slate-600 leading-relaxed text-[11px]">{comp.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Contenidos Detallados */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              Conceptos
                            </span>
                            <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                              {item.conceptualContents.map((c, idx) => (
                                <li key={idx} className="leading-snug">{c}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Procedimientos
                            </span>
                            <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                              {item.proceduralContents.map((p, idx) => (
                                <li key={idx} className="leading-snug">{p}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              Actitudes y Valores
                            </span>
                            <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                              {item.attitudinalContents.map((a, idx) => (
                                <li key={idx} className="leading-snug">{a}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 3. Indicadores de Logro de Evaluación */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Indicadores de Logro Oficiales
                          </span>
                          <div className="space-y-1.5">
                            {item.achievementIndicators.map((ind, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-slate-700 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{ind}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. Sugerencias de los 3 Momentos de Clase (Inicio, Desarrollo y Cierre) */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            Sugerencias de Actividades para los 3 Momentos
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                            <div className="space-y-1">
                              <p className="font-bold text-amber-800">1. Momento de Inicio:</p>
                              <p className="text-slate-600 leading-snug">{item.startSuggestions.join(' ')}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-indigo-800">2. Momento de Desarrollo:</p>
                              <p className="text-slate-600 leading-snug">{item.devSuggestions.join(' ')}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-emerald-800">3. Momento de Cierre:</p>
                              <p className="text-slate-600 leading-snug">{item.closeSuggestions.join(' ')}</p>
                            </div>
                          </div>
                        </div>

                        {/* Botón inferior para crear plan */}
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => handleCreatePlanFromAdecuacion(item)}
                            className="px-4 py-2.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>Crear Plan Diario con esta Malla Oficial</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: BANCO GENERAL DE TEMAS SUGERIDOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'bank_topics' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                'Lengua Española',
                'Matemática',
                'Ciencias Sociales',
                'Ciencias de la Naturaleza',
                'Educación Artística',
                'Educación Física',
                'Formación Integral Humana y Religiosa',
                'Lenguas Extranjeras (Inglés)'
              ].map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setBankArea(area as SubjectArea)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    bankArea === area
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            <div className="relative pt-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bankSearchQuery}
                onChange={(e) => setBankSearchQuery(e.target.value)}
                placeholder={`Buscar en banco de temas de ${bankArea}...`}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBankTopics.map((topic, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5 hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{topic.name}</h3>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md shrink-0">
                      {bankArea}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">Intención Sugerida:</strong> {topic.suggestedIntention}
                  </p>
                  <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                    <p><strong className="text-slate-700">Conceptos:</strong> {topic.conceptual.slice(0, 2).join(', ')}</p>
                    <p><strong className="text-slate-700">Procedimientos:</strong> {topic.procedural.slice(0, 2).join(', ')}</p>
                    <p><strong className="text-slate-700">Indicadores:</strong> {topic.indicators.slice(0, 1).join(', ')}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectTopicForNewPlan(bankArea, topic)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Crear Plan con este Tema</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: VERBOS TAXONÓMICOS DE BLOOM / MINERD */}
      {/* ========================================================================= */}
      {activeSubTab === 'verbs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BLOOM_MINERD_VERBS.map((group, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{group.level}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {group.verbs.map(v => (
                  <span key={v} className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: BANCO DE PREGUNTAS METACOGNITIVAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'metacognition' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Banco de Preguntas Metacognitivas Oficiales
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Preguntas reflexivas recomendadas por la Adecuación Curricular para el momento de cierre de la clase.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {METACOGNITION_QUESTIONS.map((q, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-800 flex items-start gap-2.5">
                <span className="text-indigo-600 font-bold font-mono">•</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
