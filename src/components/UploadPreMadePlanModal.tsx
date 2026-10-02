import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  BookOpen, 
  Layers, 
  UserCheck,
  Send,
  AlertCircle,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { 
  EducationalLevel, 
  SubjectArea, 
  SchoolConfig, 
  Teacher, 
  PlanAttachment, 
  DailyPlan, 
  WeeklyPlan, 
  LearningUnit,
  ReviewStatus
} from '../types/minerd';
import { TRANSVERSAL_AXES } from '../data/minerdCurriculum';
import { FileAttachmentManager } from './FileAttachmentManager';

interface UploadPreMadePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolConfig: SchoolConfig;
  teachers: Teacher[];
  onSaveDailyPlan: (plan: DailyPlan) => void;
  onSaveWeeklyPlan: (plan: WeeklyPlan) => void;
  onSaveUnitPlan: (unit: LearningUnit) => void;
}

export const UploadPreMadePlanModal: React.FC<UploadPreMadePlanModalProps> = ({
  isOpen,
  onClose,
  schoolConfig,
  teachers = [],
  onSaveDailyPlan,
  onSaveWeeklyPlan,
  onSaveUnitPlan
}) => {
  const [planType, setPlanType] = useState<'daily' | 'weekly' | 'unit'>('daily');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>(schoolConfig.teacherName || '');
  const [teacherPhone, setTeacherPhone] = useState<string>(schoolConfig.teacherPhone || '');
  
  const [level, setLevel] = useState<EducationalLevel>('primario_segundo_ciclo');
  const [grade, setGrade] = useState<string>('4to Grado');
  const [section, setSection] = useState<string>('A');
  const [area, setArea] = useState<SubjectArea>('Lengua Española');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  
  const [attachments, setAttachments] = useState<PlanAttachment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTeacherChange = (id: string) => {
    setSelectedTeacherId(id);
    if (id === '') {
      setTeacherName(schoolConfig.teacherName || '');
      setTeacherPhone(schoolConfig.teacherPhone || '');
      return;
    }
    const t = teachers.find(teacher => teacher.id === id);
    if (t) {
      setTeacherName(t.name);
      setTeacherPhone(t.phone);
      if (t.grades && t.grades.length > 0) setGrade(t.grades[0]);
      if (t.sections && t.sections.length > 0) setSection(t.sections[0]);
      if (t.areas && t.areas.length > 0) setArea(t.areas[0]);
      if (t.level) {
        const lvlStr = String(t.level).toLowerCase();
        if (lvlStr.includes('inicial')) setLevel('inicial');
        else if (lvlStr.includes('primer ciclo')) setLevel('primario_primer_ciclo');
        else if (lvlStr.includes('segundo ciclo')) setLevel('primario_segundo_ciclo');
        else if (lvlStr.includes('secundar')) setLevel('secundario_primer_ciclo');
        else setLevel('primario_segundo_ciclo');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Por favor ingrese el tema o título de la planificación.');
      return;
    }

    if (attachments.length === 0) {
      setErrorMsg('Debe adjuntar al menos un archivo (PDF, Word, Excel) o enlace de Google Drive con la planificación previa.');
      return;
    }

    const assignedTeacherName = teacherName.trim() || schoolConfig.teacherName || 'Docente Titular';
    const nowIso = new Date().toISOString();

    if (planType === 'daily') {
      const newDailyPlan: DailyPlan = {
        id: `dp-ext-${Date.now()}`,
        title: title.trim(),
        date: date,
        level,
        grade,
        section,
        area,
        unitTheme: title.trim(),
        pedagogicalIntention: `Planificación previa cargada para aprobación institucional (${title.trim()})`,
        teacherId: selectedTeacherId || undefined,
        teacherName: assignedTeacherName,
        teacherPhone: teacherPhone || undefined,
        attachments: attachments.map(a => ({ ...a, category: a.category || 'external_plan' })),
        fundamentalCompetencies: ['comunicativa', 'pensamiento_logico'],
        specificCompetencies: ['Competencias especificadas en el archivo adjunto.'],
        transversalAxis: TRANSVERSAL_AXES[0],
        conceptualContents: ['Contenidos conceptuales detallados en la planificación adjunta.'],
        proceduralContents: ['Procedimientos y actividades detallados en el documento adjunto.'],
        attitudinalContents: ['Valores y actitudes consignados en el documento.'],
        achievementIndicators: ['Indicadores de logro definidos en el archivo adjunto.'],
        startDuration: 15,
        startActivities: 'Ver documento de planificación previa adjunto en Recursos/Archivos.',
        developmentDuration: 60,
        developmentActivities: 'Ver documento de planificación previa adjunto en Recursos/Archivos.',
        studentGrouping: 'Equipos pequeños (3-4)',
        closeDuration: 15,
        closeActivities: 'Ver documento de planificación previa adjunto en Recursos/Archivos.',
        metacognitionQuestions: '• ¿Qué aprendimos en la sesión?\n• ¿Cómo podemos aplicarlo?',
        didacticResources: ['Documento adjunto en plataforma', 'Recursos del aula'],
        evaluationTypes: ['Formativa'],
        evaluationAgents: ['Heteroevaluación'],
        evaluationInstruments: ['Lista de Cotejo'],
        evaluationCriteria: 'Criterios detallados en el documento adjunto.',
        status: 'completed',
        reviewStatus: 'pending',
        notes: notes.trim(),
        createdAt: nowIso,
        updatedAt: nowIso
      };

      onSaveDailyPlan(newDailyPlan);
    } else if (planType === 'weekly') {
      const newWeeklyPlan: WeeklyPlan = {
        id: `wp-ext-${Date.now()}`,
        title: title.trim(),
        weekNumber: 1,
        startDate: date,
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        level,
        grade,
        section,
        area,
        unitTitle: title.trim(),
        unitCompetency: 'Competencias consignadas en la planificación semanal adjunta.',
        transversalAxis: TRANSVERSAL_AXES[0],
        achievementIndicators: ['Indicadores detallados en el documento adjunto.'],
        days: {
          lunes: {
            topic: title.trim(),
            pedagogicalIntention: 'Ver planificación adjunta.',
            startActivity: 'Ver documento adjunto.',
            developmentActivity: 'Ver documento adjunto.',
            closeActivity: 'Ver documento adjunto.',
            resources: 'Recursos adjuntos.',
            evaluation: 'Evaluación formativa.'
          },
          martes: {
            topic: title.trim(),
            pedagogicalIntention: 'Ver planificación adjunta.',
            startActivity: 'Ver documento adjunto.',
            developmentActivity: 'Ver documento adjunto.',
            closeActivity: 'Ver documento adjunto.',
            resources: 'Recursos adjuntos.',
            evaluation: 'Evaluación formativa.'
          },
          miercoles: {
            topic: title.trim(),
            pedagogicalIntention: 'Ver planificación adjunta.',
            startActivity: 'Ver documento adjunto.',
            developmentActivity: 'Ver documento adjunto.',
            closeActivity: 'Ver documento adjunto.',
            resources: 'Recursos adjuntos.',
            evaluation: 'Evaluación formativa.'
          },
          jueves: {
            topic: title.trim(),
            pedagogicalIntention: 'Ver planificación adjunta.',
            startActivity: 'Ver documento adjunto.',
            developmentActivity: 'Ver documento adjunto.',
            closeActivity: 'Ver documento adjunto.',
            resources: 'Recursos adjuntos.',
            evaluation: 'Evaluación formativa.'
          },
          viernes: {
            topic: title.trim(),
            pedagogicalIntention: 'Ver planificación adjunta.',
            startActivity: 'Ver documento adjunto.',
            developmentActivity: 'Ver documento adjunto.',
            closeActivity: 'Ver documento adjunto.',
            resources: 'Recursos adjuntos.',
            evaluation: 'Evaluación formativa.'
          }
        },
        generalResources: ['Documento adjunto en plataforma'],
        generalEvaluation: 'Evaluación procesual continua.',
        attachments: attachments.map(a => ({ ...a, category: a.category || 'external_plan' })),
        teacherId: selectedTeacherId || undefined,
        teacherName: assignedTeacherName,
        teacherPhone: teacherPhone || undefined,
        status: 'completed',
        reviewStatus: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      onSaveWeeklyPlan(newWeeklyPlan);
    } else {
      const newUnit: LearningUnit = {
        id: `lu-ext-${Date.now()}`,
        title: title.trim(),
        level,
        grade,
        area,
        durationWeeks: 4,
        startDate: date,
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        transversalAxis: TRANSVERSAL_AXES[0],
        learningSituation: {
          startingPoint: 'Situación planteada en la unidad didáctica adjunta.',
          studentRole: 'Estudiantes investigadores y constructores del aprendizaje.',
          challengeQuestion: '¿Cómo podemos aplicar estos conocimientos en nuestro entorno?',
          finalProduct: 'Producto final indicado en la planificación previa adjunta.'
        },
        fundamentalCompetencies: ['comunicativa', 'pensamiento_logico', 'resolucion_problemas'],
        specificCompetencies: ['Competencias específicas detalladas en el documento adjunto.'],
        conceptualContents: ['Contenidos conceptuales en archivo adjunto.'],
        proceduralContents: ['Procedimientos en archivo adjunto.'],
        attitudinalContents: ['Valores y actitudes en archivo adjunto.'],
        achievementIndicators: ['Indicadores de logro en archivo adjunto.'],
        didacticalSequenceSummary: 'Ver secuencia didáctica completa en el documento adjunto.',
        attachments: attachments.map(a => ({ ...a, category: a.category || 'external_plan' })),
        teacherId: selectedTeacherId || undefined,
        teacherName: assignedTeacherName,
        teacherPhone: teacherPhone || undefined,
        status: 'completed',
        reviewStatus: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      onSaveUnitPlan(newUnit);
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto max-h-[92vh] overflow-y-auto space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Carga de Planificación Previa (Para Aprobación)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Suba sus planificaciones realizadas en formato PDF, Word, Excel o Google Drive para ser evaluadas por Dirección o Coordinación.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Notification */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3 bg-emerald-50 border border-emerald-200 rounded-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-emerald-950">
              ¡Planificación Enviada con Éxito!
            </h3>
            <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
              La planificación y sus archivos adjuntos fueron enviados a la bandeja de <strong>Supervisión Pedagógica</strong> para revisión y aprobación por el <strong>Licdo. Arnold Javier Sanchez</strong> o el equipo de <strong>Coordinación Pedagógica</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Plan Type Selector */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                1. Tipo de Planificación a Subir *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlanType('daily')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    planType === 'daily'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${planType === 'daily' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Plan Diario</p>
                    <p className="text-[10px] text-slate-500">Clase del día</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('weekly')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    planType === 'weekly'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${planType === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Plan Semanal</p>
                    <p className="text-[10px] text-slate-500">Matriz Lun-Vie</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('unit')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    planType === 'unit'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${planType === 'unit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Unidad de Aprendizaje</p>
                    <p className="text-[10px] text-slate-500">3-4 Semanas</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Docente y Datos Curriculares */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              
              {/* Docente */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Docente Responsable *
                </label>
                {teachers.length > 0 ? (
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => handleTeacherChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    <option value="">-- Ingresar o Seleccionar Docente --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.grades.join(', ')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Nombre del Docente"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                  />
                )}
              </div>

              {/* Área Curricular */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Área Curricular *
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as SubjectArea)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
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

              {/* Grado */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Grado *
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                >
                  <option value="Pre-Kínder">Pre-Kínder</option>
                  <option value="Kínder">Kínder</option>
                  <option value="Pre-Primario">Pre-Primario</option>
                  <option value="1er Grado">1er Grado</option>
                  <option value="2do Grado">2do Grado</option>
                  <option value="3er Grado">3er Grado</option>
                  <option value="4to Grado">4to Grado</option>
                  <option value="5to Grado">5to Grado</option>
                  <option value="6to Grado">6to Grado</option>
                  <option value="1ro Secundaria">1ro Secundaria</option>
                  <option value="2do Secundaria">2do Secundaria</option>
                  <option value="3ro Secundaria">3ro Secundaria</option>
                  <option value="4to Secundaria">4to Secundaria</option>
                  <option value="5to Secundaria">5to Secundaria</option>
                  <option value="6to Secundaria">6to Secundaria</option>
                </select>
              </div>

              {/* Sección */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Sección *
                </label>
                <input
                  type="text"
                  required
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="A, B, C..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-center font-bold"
                />
              </div>

              {/* Fecha */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Aplicación / Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

            </div>

            {/* Tema / Título */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                2. Tema o Título de la Planificación *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: La Noticia y sus partes / Los Números Fraccionarios / Unidad 3 El Sistema Solar"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
              />
            </div>

            {/* Dropzone Component for File Attachments */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                3. Subir Archivo(s) o Enlace de la Planificación (Dropzone) *
              </label>
              <FileAttachmentManager
                attachments={attachments}
                onChange={setAttachments}
                title="Archivos de la Planificación Previa"
                subtitle="Arrastre el archivo realizado (PDF, Word .docx, Excel .xlsx) o pegue un enlace de Google Drive."
                showApprovalNotice={true}
              />
            </div>

            {/* Observaciones pedagógicas para Dirección */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Observaciones o Mensaje para Dirección / Coordinación (Opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indique cualquier observación sobre esta planificación, adaptaciones curriculares o recursos requeridos..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-medium"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Quedará en estado <strong>Pendiente de Aprobación</strong></span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar para Aprobación</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
