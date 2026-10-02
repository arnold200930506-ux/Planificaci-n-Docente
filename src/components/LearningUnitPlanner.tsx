import React, { useState } from 'react';
import { 
  Save, 
  Printer, 
  Plus, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  Check, 
  ArrowLeft,
  Calendar,
  Layers,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { 
  LearningUnit, 
  SubjectArea, 
  EducationalLevel, 
  SchoolConfig,
  FundamentalCompetencyKey 
} from '../types/minerd';
import { FUNDAMENTAL_COMPETENCIES, TRANSVERSAL_AXES } from '../data/minerdCurriculum';
import { FileAttachmentManager } from './FileAttachmentManager';

interface LearningUnitPlannerProps {
  units: LearningUnit[];
  schoolConfig: SchoolConfig;
  onSaveUnit: (unit: LearningUnit) => void;
  onDeleteUnit: (id: string) => void;
  onPrintUnit: (unitId: string) => void;
}

const DEFAULT_NEW_UNIT: LearningUnit = {
  id: '',
  title: '',
  level: 'primario_segundo_ciclo',
  grade: '4to Grado',
  area: 'Lengua Española',
  durationWeeks: 4,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  transversalAxis: TRANSVERSAL_AXES[0],
  learningSituation: {
    startingPoint: '',
    studentRole: '',
    challengeQuestion: '',
    finalProduct: ''
  },
  fundamentalCompetencies: ['comunicativa', 'pensamiento_logico', 'resolucion_problemas'],
  specificCompetencies: [],
  conceptualContents: [],
  proceduralContents: [],
  attitudinalContents: [],
  achievementIndicators: [],
  didacticalSequenceSummary: '',
  status: 'draft',
  reviewStatus: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const LearningUnitPlanner: React.FC<LearningUnitPlannerProps> = ({
  units,
  schoolConfig,
  onSaveUnit,
  onDeleteUnit,
  onPrintUnit
}) => {
  const [selectedUnit, setSelectedUnit] = useState<LearningUnit | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [currentUnit, setCurrentUnit] = useState<LearningUnit>(DEFAULT_NEW_UNIT);

  const startNewUnit = () => {
    setCurrentUnit({
      ...DEFAULT_NEW_UNIT,
      id: `lu-${Date.now()}`
    });
    setSelectedUnit(null);
    setIsCreating(true);
  };

  const handleEditUnit = (unit: LearningUnit) => {
    setCurrentUnit({ ...unit });
    setSelectedUnit(unit);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!currentUnit.title.trim()) {
      alert('Por favor ingrese el Título de la Unidad de Aprendizaje.');
      return;
    }
    onSaveUnit(currentUnit);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsCreating(false);
    }, 1500);
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
                  <Layers className="w-5 h-5 text-amber-300" />
                  <span className="text-[8px] font-extrabold text-slate-300 uppercase tracking-tighter mt-0.5">Logo</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-lg">
                  Unidades de Aprendizaje & Situaciones
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
                Diseño curricular por secuencias didácticas con situaciones de aprendizaje, ejes transversales y productos finales.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-5 shrink-0 gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Unidades Registradas</span>
            <span className="text-sm font-black text-amber-300 font-mono">{units.length} Unidades</span>
            <span className="text-[10px] text-slate-400 font-medium">Ciclo Activo</span>
          </div>
        </div>
      </div>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Unidades de Aprendizaje</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Estrategia de Planificación por Competencias (MINERD · Nivel Primario y Secundario)
          </p>
        </div>

        {!isCreating && (
          <button
            type="button"
            onClick={startNewUnit}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Nueva Unidad de Aprendizaje</span>
          </button>
        )}
      </div>

      {/* Mode List or Editor */}
      {!isCreating ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.length === 0 ? (
            <div className="col-span-2 bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No hay unidades de aprendizaje registradas</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Diseñe una unidad pedagógica con situación de aprendizaje, producto final y secuencia didáctica.
              </p>
              <button
                type="button"
                onClick={startNewUnit}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-950 cursor-pointer"
              >
                + Crear Primera Unidad
              </button>
            </div>
          ) : (
            units.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {u.area} · {u.grade}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-tight">{u.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                    {u.durationWeeks} Semanas
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-700">Situación de Aprendizaje:</p>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">
                    {u.learningSituation?.startingPoint || 'No especificada'}
                  </p>
                  {u.learningSituation?.finalProduct && (
                    <p className="text-emerald-700 font-medium text-[11px] pt-1">
                      <strong>Producto Final:</strong> {u.learningSituation.finalProduct}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditUnit(u)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintUnit(u.id)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la unidad "${u.title}"?`)) {
                        onDeleteUnit(u.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Unit Form Editor */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Unidades</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-black text-white bg-slate-900 hover:bg-indigo-950 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4 text-amber-300" />}
              <span>Guardar Unidad</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Título de la Unidad</label>
              <input
                type="text"
                value={currentUnit.title}
                onChange={(e) => setCurrentUnit(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej. Los Textos Funcionales en Nuestra Comunidad"
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Área Curricular</label>
              <select
                value={currentUnit.area}
                onChange={(e) => setCurrentUnit(prev => ({ ...prev, area: e.target.value as SubjectArea }))}
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
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Duración (Semanas)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={currentUnit.durationWeeks}
                onChange={(e) => setCurrentUnit(prev => ({ ...prev, durationWeeks: Number(e.target.value) || 4 }))}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          {/* Situación de Aprendizaje (5 elementos MINERD) */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Componentes de la Situación de Aprendizaje
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Punto de Partida / Contexto Real
                </label>
                <textarea
                  rows={2}
                  value={currentUnit.learningSituation?.startingPoint || ''}
                  onChange={(e) => setCurrentUnit(prev => ({
                    ...prev,
                    learningSituation: { ...prev.learningSituation, startingPoint: e.target.value }
                  }))}
                  placeholder="Los estudiantes de 4to grado observan la falta de información sobre..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    2. Rol del Estudiante
                  </label>
                  <input
                    type="text"
                    value={currentUnit.learningSituation?.studentRole || ''}
                    onChange={(e) => setCurrentUnit(prev => ({
                      ...prev,
                      learningSituation: { ...prev.learningSituation, studentRole: e.target.value }
                    }))}
                    placeholder="Reporteros escolares / Investigadores juveniles"
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Pregunta Retadora / Desafío
                  </label>
                  <input
                    type="text"
                    value={currentUnit.learningSituation?.challengeQuestion || ''}
                    onChange={(e) => setCurrentUnit(prev => ({
                      ...prev,
                      learningSituation: { ...prev.learningSituation, challengeQuestion: e.target.value }
                    }))}
                    placeholder="¿Cómo podemos informar a la comunidad sobre...?"
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. Producto Final / Evidencia Tangible
                </label>
                <input
                  type="text"
                  value={currentUnit.learningSituation?.finalProduct || ''}
                  onChange={(e) => setCurrentUnit(prev => ({
                    ...prev,
                    learningSituation: { ...prev.learningSituation, finalProduct: e.target.value }
                  }))}
                  placeholder="Periódico mural escolar / Noticiario grabado en video"
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN DE ARCHIVOS ADJUNTOS / RECURSOS DIGITALES DE LA UNIDAD */}
          <FileAttachmentManager
            attachments={currentUnit.attachments || []}
            onChange={(att) => setCurrentUnit(prev => ({ ...prev, attachments: att }))}
            title="Archivos Adjuntos a la Unidad de Aprendizaje"
            subtitle="Adjunte guías didácticas, secuencias de actividades, matrices de evaluación o enlaces de carpetas de recursos en Google Drive."
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Guardar Unidad de Aprendizaje</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
