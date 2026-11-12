import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  Search,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  School,
  Send,
  Award,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
  Check,
  Phone,
  FileSpreadsheet,
  Info,
  HelpCircle,
  FileText,
  PrinterCheck,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import {
  Student,
  SubjectArea,
  GradingPeriod,
  StudentSubjectGrade,
  SchoolConfig,
  Teacher
} from '../types/minerd';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

interface GradingManagementViewProps {
  schoolConfig: SchoolConfig;
  teachers?: Teacher[];
}

const PRESET_GRADES = [
  'Nivel Inicial (Pre-Kínder / Kínder / Pre-Primario)',
  '1er Grado',
  '2do Grado',
  '3er Grado',
  '4to Grado',
  '5to Grado',
  '6to Grado',
  '1er Grado Secundaria (7mo)',
  '2do Grado Secundaria (8vo)',
  '3er Grado Secundaria (9no)'
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const SUBJECT_AREAS: SubjectArea[] = [
  'Lengua Española',
  'Matemática',
  'Ciencias Sociales',
  'Ciencias de la Naturaleza',
  'Educación Artística',
  'Educación Física',
  'Formación Integral Humana y Religiosa',
  'Lenguas Extranjeras (Inglés)',
  'Lenguas Extranjeras (Francés)'
];

const PERIODS: { key: GradingPeriod; name: string; weight: string }[] = [
  { key: 'P1', name: 'Primer Período (P1)', weight: 'Septiembre - Octubre' },
  { key: 'P2', name: 'Segundo Período (P2)', weight: 'Noviembre - Enero' },
  { key: 'P3', name: 'Tercer Período (P3)', weight: 'Febrero - Marzo' },
  { key: 'P4', name: 'Cuarto Período (P4)', weight: 'Abril - Junio' },
  { key: 'Recuperación', name: 'Período Pedagógico de Recuperación', weight: 'Reforzamiento' }
];

export const GradingManagementView: React.FC<GradingManagementViewProps> = ({
  schoolConfig,
  teachers = []
}) => {
  const currentSession = authService.getSession();
  const isTeacher = currentSession.role === 'teacher';

  // Filters and Context
  const [selectedGrade, setSelectedGrade] = useState<string>(PRESET_GRADES[4]); // 4to Grado default
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedSubject, setSelectedSubject] = useState<SubjectArea>('Lengua Española');
  const [selectedPeriod, setSelectedPeriod] = useState<GradingPeriod>('P1');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (isTeacher && currentSession.teacherId) return currentSession.teacherId;
    return '';
  });

  // Print mode: 'single' (asignatura actual) | 'all_subjects' (sábana general con todas las asignaturas)
  const [printMode, setPrintMode] = useState<'single' | 'all_subjects'>('single');

  // Modal / notification states
  const [scoresDraft, setScoresDraft] = useState<Record<string, number>>({});
  const [observationsDraft, setObservationsDraft] = useState<Record<string, string>>({});
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [whatsappSentStudentId, setWhatsappSentStudentId] = useState<string | null>(null);

  // Load students for this classroom
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);
  const [allGrades, setAllGrades] = useState<StudentSubjectGrade[]>(() => storageService.getStudentGrades());

  useEffect(() => {
    const list = storageService.getStudentsByGradeAndSection(selectedGrade, selectedSection);
    // Solo utilizar la lista de estudiantes registrados en el padrón de la escuela
    setClassroomStudents(list);
  }, [selectedGrade, selectedSection]);

  // Sync draft inputs when grade/section/subject/period changes
  useEffect(() => {
    const currentGrades = storageService.getStudentGrades();
    setAllGrades(currentGrades);

    const scores: Record<string, number> = {};
    const obs: Record<string, string> = {};

    classroomStudents.forEach(st => {
      const existing = currentGrades.find(
        g => g.studentId === st.id && g.grade === selectedGrade && g.section === selectedSection && g.subject === selectedSubject && g.period === selectedPeriod
      );
      if (existing) {
        scores[st.id] = existing.score;
        obs[st.id] = existing.observations || '';
      } else {
        // Sin notas de ejemplo por defecto (iniciar en blanco para que el maestro digite)
        scores[st.id] = 0;
        obs[st.id] = '';
      }
    });

    setScoresDraft(scores);
    setObservationsDraft(obs);
  }, [classroomStudents, selectedGrade, selectedSection, selectedSubject, selectedPeriod]);

  // Compute status and literal according to MINERD grading scale
  const getGradeMeta = (score: number) => {
    if (score === 0 || !score) {
      return { literal: '—' as const, status: 'Pendiente' as const, badge: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
    if (score >= 90) return { literal: 'A' as const, status: 'Aprobado' as const, badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (score >= 80) return { literal: 'B' as const, status: 'Aprobado' as const, badge: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (score >= 65) return { literal: 'C' as const, status: 'Aprobado' as const, badge: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { literal: 'D' as const, status: 'En Recuperación' as const, badge: 'bg-rose-100 text-rose-800 border-rose-300' };
  };

  // Stats calculation
  const stats = useMemo(() => {
    const scores = Object.values(scoresDraft);
    if (scores.length === 0) return { avg: 0, approved: 0, recovery: 0, publishedCount: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / scores.length);
    const approved = scores.filter(s => s >= 65).length;
    const recovery = scores.filter(s => s < 65).length;

    const publishedCount = classroomStudents.filter(st => {
      const g = allGrades.find(x => x.studentId === st.id && x.period === selectedPeriod && x.subject === selectedSubject && x.published);
      return !!g;
    }).length;

    return { avg, approved, recovery, publishedCount };
  }, [scoresDraft, classroomStudents, allGrades, selectedPeriod, selectedSubject]);

  // Save changes locally and in Firestore
  const handleSaveGrades = (publishImmediately = false) => {
    const teacherName = teachers.find(t => t.id === selectedTeacherId)?.name || currentSession.userName || 'Docente Titular';
    const now = new Date().toISOString();

    const newGradesList = [...allGrades];

    classroomStudents.forEach(st => {
      const score = Number(scoresDraft[st.id]) || 0;
      const meta = getGradeMeta(score);
      const observations = observationsDraft[st.id] || '';

      const existingIndex = newGradesList.findIndex(
        g => g.studentId === st.id && g.grade === selectedGrade && g.section === selectedSection && g.subject === selectedSubject && g.period === selectedPeriod
      );

      const record: StudentSubjectGrade = {
        studentId: st.id,
        studentName: st.name,
        studentRne: st.rne,
        grade: selectedGrade,
        section: selectedSection,
        subject: selectedSubject,
        period: selectedPeriod,
        teacherId: selectedTeacherId || undefined,
        teacherName,
        score,
        literal: meta.literal,
        status: meta.status,
        observations,
        published: publishImmediately ? true : (existingIndex >= 0 ? newGradesList[existingIndex].published : false),
        publishedAt: publishImmediately ? now : (existingIndex >= 0 ? newGradesList[existingIndex].publishedAt : undefined),
        parentName: st.parentName,
        parentPhone: st.parentPhone,
        updatedAt: now
      };

      if (existingIndex >= 0) {
        newGradesList[existingIndex] = record;
      } else {
        newGradesList.push(record);
      }
    });

    storageService.saveStudentGrades(newGradesList);
    setAllGrades(newGradesList);

    setSaveSuccessNotice(
      publishImmediately
        ? `¡Calificaciones publicadas oficialmente para ${classroomStudents.length} estudiantes en el período ${selectedPeriod}!`
        : `¡Borrador guardado exitosamente!`
    );
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  // Open publication confirmation modal
  const handleOpenPublishModal = () => {
    setIsPublishModalOpen(true);
  };

  const handleConfirmPublish = () => {
    handleSaveGrades(true);
    setIsPublishModalOpen(false);
  };

  // Trigger print with mode
  const handlePrint = (mode: 'single' | 'all_subjects') => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Send WhatsApp to Parent
  const handleSendWhatsAppToParent = (student: Student) => {
    const score = Number(scoresDraft[student.id]) || 0;
    const meta = getGradeMeta(score);
    const obs = observationsDraft[student.id] || 'Participación continua y esfuerzo destacado en clase.';
    const teacherName = teachers.find(t => t.id === selectedTeacherId)?.name || currentSession.userName || 'Docente Titular';

    const parentNameStr = student.parentName ? `Sr./Sra. *${student.parentName}*` : 'Estimado/a Padre/Madre/Tutor';
    const phone = (student.parentPhone || '').replace(/[^0-9]/g, '');

    const message = `🏛️ *MINISTERIO DE EDUCACIÓN (MINERD)*
🏫 *${schoolConfig.schoolName}*
📍 Distrito Educativo ${schoolConfig.district} • Código SIGERD: ${schoolConfig.schoolCode || '14668'}

Estimado/a ${parentNameStr}:

Le compartimos el *Informe Oficial de Calificación del Estudiante*:
👤 *Estudiante:* ${student.name}
🔖 *RNE:* ${student.rne || 'Pendiente SIGERD'}
📚 *Grado y Sección:* ${student.grade} "${student.section}"
📘 *Asignatura:* ${selectedSubject}
📅 *Período Escolar:* ${selectedPeriod} (${PERIODS.find(p => p.key === selectedPeriod)?.name})

📊 *RESULTADO PEDAGÓGICO:*
• *Calificación Obtenida:* *${score} / 100*
• *Literal de Rendimiento:* *${meta.literal}* (${meta.status})
• *Observación Docente:* "${obs}"

✍️ *Docente a Cargo:* ${teacherName}
🏫 *Dirección Escolar:* ${schoolConfig.principalName}

_Le motivamos a seguir apoyando a su hijo/a en su desarrollo y aprendizaje integral._`;

    const cleanPhone = phone.startsWith('1') ? phone : (phone.length === 10 ? `1${phone}` : phone);
    const whatsappUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    setWhatsappSentStudentId(student.id);
    setTimeout(() => setWhatsappSentStudentId(null), 4000);
  };

  // Build matrix of all subjects for all_subjects print view
  const allSubjectsMatrix = useMemo(() => {
    return classroomStudents.map((st, idx) => {
      const subjectScores: Record<string, number> = {};
      let total = 0;
      let count = 0;

      SUBJECT_AREAS.forEach(area => {
        const found = allGrades.find(
          g => g.studentId === st.id && g.grade === selectedGrade && g.section === selectedSection && g.subject === area && g.period === selectedPeriod
        );
        const score = found ? found.score : (scoresDraft[st.id] !== undefined && area === selectedSubject ? scoresDraft[st.id] : 0);
        subjectScores[area] = score;
        total += score;
        count++;
      });

      const studentAvg = count > 0 ? Math.round(total / count) : 0;
      const meta = getGradeMeta(studentAvg);

      // Verificación estricta MINERD: si tiene alguna asignatura menor a 65 o el promedio es menor a 65,
      // el estudiante NO está promovido, su condición es 'En Recuperación' o 'Reprobado'.
      const failedSubjectsCount = Object.values(subjectScores).filter(val => val < 65).length;
      const isReallyPromoted = studentAvg >= 65 && failedSubjectsCount === 0;
      const conditionText = isReallyPromoted 
        ? 'Promovido' 
        : (studentAvg < 60 ? 'Reprobado / En Recuperación' : 'En Recuperación');

      return {
        number: st.number || idx + 1,
        student: st,
        scores: subjectScores,
        average: studentAvg,
        literal: meta.literal,
        status: isReallyPromoted ? 'Aprobado' : 'En Recuperación',
        conditionText,
        failedSubjectsCount
      };
    });
  }, [classroomStudents, allGrades, selectedGrade, selectedSection, selectedPeriod, selectedSubject, scoresDraft]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. VISTA DE PANTALLA (OCULTA EN IMPRESIÓN CON .no-print)                  */}
      {/* ========================================================================= */}
      <div className="no-print space-y-6">
        {/* Institutional Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                Registro y Calificaciones Oficiales MINERD
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Publicación de Calificaciones y Boletas por Período
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Asiente las valoraciones de los períodos (P1, P2, P3, P4 y Recuperación) por área curricular, publique las calificaciones al sistema oficial, imprima sábanas completas de todas las asignaturas y remita el boletín individual al WhatsApp de los padres.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveGrades(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Guardar Borrador</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        {saveSuccessNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center gap-3 animate-fade-in text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        {/* Filters and Class Selector Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* Grade */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                Grado Escolar:
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {PRESET_GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Sección:
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {SECTIONS.map(s => (
                  <option key={s} value={s}>Sección "{s}"</option>
                ))}
              </select>
            </div>

            {/* Area Curricular */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Asignatura / Área:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectArea)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {SUBJECT_AREAS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Período */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Período de Calificación:
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as GradingPeriod)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {PERIODS.map(p => (
                  <option key={p.key} value={p.key}>{p.name} ({p.weight})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Docente a Cargo Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span className="font-bold">Docente Responsable:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="">{currentSession.userName || 'Docente de Aula'}</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.areas?.join(', ') || 'Docente'})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">

              <span className="text-slate-500 text-[11px] font-semibold">
                Total Estudiantes: <strong>{classroomStudents.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Statistical KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Promedio de Clase</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.avg} <span className="text-sm font-semibold text-slate-400">/ 100</span></p>
            <span className="text-[10px] text-slate-400 block font-medium">Escala vigesimal MINERD</span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">Aprobados (&gt;= 65)</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.approved}</p>
            <span className="text-[10px] text-emerald-600 block font-bold">
              {classroomStudents.length > 0 ? Math.round((stats.approved / classroomStudents.length) * 100) : 0}% de la sección
            </span>
          </div>

          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1">
            <span className="text-[11px] font-black text-rose-800 uppercase tracking-wider block">En Recuperación (&lt; 65)</span>
            <p className="text-2xl sm:text-3xl font-black text-rose-700">{stats.recovery}</p>
            <span className="text-[10px] text-rose-600 block font-medium">Requieren refuerzo pedagógico</span>
          </div>

          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-1">
            <span className="text-[11px] font-black text-indigo-800 uppercase tracking-wider block">Estado de Publicación</span>
            <p className="text-2xl sm:text-3xl font-black text-indigo-800">
              {stats.publishedCount} <span className="text-sm font-semibold text-indigo-600">/ {classroomStudents.length}</span>
            </p>
            <span className="text-[10px] text-indigo-600 block font-medium">Boletas publicadas en el sistema</span>
          </div>
        </div>

        {/* Main Interactive Matrix Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Matriz de Calificaciones • {selectedGrade} "{selectedSection}" • {selectedSubject}
              </h2>
              <p className="text-xs text-slate-500">
                Ingrese las calificaciones numéricas (0-100). El sistema calcula el literal y permite enviar el reporte por WhatsApp a los padres.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Período Seleccionado: {selectedPeriod}
              </span>

            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-3 text-center w-12">No.</th>
                  <th className="py-3 px-4">Estudiante & RNE</th>
                  <th className="py-3 px-3 text-center w-32">Calificación (0-100)</th>
                  <th className="py-3 px-3 text-center w-24">Literal</th>
                  <th className="py-3 px-3 text-center w-28">Estado</th>
                  <th className="py-3 px-4">Observación Cualitativa Docente</th>
                  <th className="py-3 px-4 text-center w-48">Aviso al Padre (WhatsApp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classroomStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-700 text-xs">
                          No hay estudiantes matriculados en {selectedGrade} "{selectedSection}".
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Puede importar los estudiantes desde Excel en la pestaña <strong>Padrón de Docentes & Estudiantes</strong> o agregarlos en <strong>Control de Asistencia & Matrícula</strong>.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : classroomStudents.map((st, index) => {
                  const score = scoresDraft[st.id] !== undefined ? scoresDraft[st.id] : 0;
                  const meta = getGradeMeta(score);
                  const obs = observationsDraft[st.id] || '';
                  const hasParentPhone = !!st.parentPhone;
                  const isSentRecently = whatsappSentStudentId === st.id;

                  const isPublished = allGrades.some(
                    g => g.studentId === st.id && g.grade === selectedGrade && g.section === selectedSection && g.subject === selectedSubject && g.period === selectedPeriod && g.published
                  );

                  return (
                    <tr key={st.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        {st.number || index + 1}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{st.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>RNE: {st.rne || 'Pendiente'}</span>
                          {st.parentName && <span>• Tutor: {st.parentName}</span>}
                          {isPublished && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">
                              Publicado
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={scoresDraft[st.id] !== undefined && scoresDraft[st.id] !== 0 ? scoresDraft[st.id] : (scoresDraft[st.id] === 0 ? '' : '')}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === '' ? 0 : Math.min(100, Math.max(0, Number(raw) || 0));
                            setScoresDraft(prev => ({ ...prev, [st.id]: val }));
                          }}
                          className="w-20 px-2 py-1.5 text-center font-black text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-black border ${meta.badge}`}>
                          {meta.literal}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`text-[11px] font-bold ${score >= 65 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {meta.status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={obs}
                          placeholder="Comentario sobre el desempeño..."
                          onChange={(e) => {
                            const val = e.target.value;
                            setObservationsDraft(prev => ({ ...prev, [st.id]: val }));
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppToParent(st)}
                          className={`w-full px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            isSentRecently
                              ? 'bg-emerald-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                          title={`Enviar reporte a ${st.parentName || 'el tutor'} (${st.parentPhone || 'WhatsApp'})`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSentRecently ? '¡Enviado!' : 'Enviar Nota por WhatsApp'}</span>
                        </button>
                        {st.parentPhone && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Tel: {st.parentPhone}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer of Matrix */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>
                Escala oficial MINERD: <strong>A (90-100)</strong>, <strong>B (80-89)</strong>, <strong>C (65-79 Aprobado)</strong>, <strong>D (Menor a 65 Recuperación)</strong>.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrint('single')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title="Imprimir solo la asignatura actual"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Imprimir Asignatura</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrint('all_subjects')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all"
                title="Imprimir sábana con todas las materias oficiales"
              >
                <PrinterCheck className="w-4 h-4 text-amber-300" />
                <span>Imprimir Sábana (Todas las Asignaturas)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPublishModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg transition-all"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Publicar Calificaciones</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODAL DE PUBLICACIÓN OFICIAL DE CALIFICACIONES                         */}
      {/* ========================================================================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <Award className="w-6 h-6 text-amber-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Publicar Calificaciones Oficiales
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedGrade} "{selectedSection}" • {selectedSubject}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
              <div className="flex justify-between font-bold">
                <span>Período Escolar:</span>
                <span className="text-indigo-900 font-black">{selectedPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span>Estudiantes a certificar:</span>
                <span className="font-bold">{classroomStudents.length} estudiantes</span>
              </div>
              <div className="flex justify-between">
                <span>Promedio de la Sección:</span>
                <span className="font-black text-slate-900">{stats.avg} / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Aprobados / En Recuperación:</span>
                <span>
                  <strong className="text-emerald-700">{stats.approved}</strong> aprobados • <strong className="text-rose-700">{stats.recovery}</strong> en recuperación
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Al publicar, las notas quedan asentadas formalmente en el sistema institucional, sincronizadas en la nube de Firebase y disponibles de inmediato para las actas oficiales de fin de período y entrega de boletas a los padres.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Publicar al Sistema</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISTA DE IMPRESIÓN (A): SÁBANA INDIVIDUAL DE LA ASIGNATURA SELECCIONADA */}
      {/* ========================================================================= */}
      {printMode === 'single' && (
        <div className="print-only text-slate-900 bg-white font-sans p-2">
          {/* Encabezado Oficial Institucional MINERD */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <p className="text-xs font-bold tracking-widest text-slate-700 uppercase">República Dominicana</p>
            <h1 className="text-lg font-black tracking-tight uppercase text-slate-900 mt-0.5">
              Ministerio de Educación (MINERD)
            </h1>
            <p className="text-xs font-bold text-slate-800">
              Registro Oficial de Evaluación de los Aprendizajes por Competencias • Sistema SIGERD
            </p>
            <div className="mt-2 text-sm font-extrabold text-slate-900">
              {schoolConfig.schoolName}
            </div>
            <div className="text-[11px] text-slate-700 font-medium flex items-center justify-center gap-3 mt-0.5">
              <span><strong>Código SIGERD:</strong> {schoolConfig.schoolCode || '14668'}</span>
              <span>•</span>
              <span><strong>Distrito Educativo:</strong> {schoolConfig.district}</span>
              <span>•</span>
              <span><strong>Regional:</strong> {schoolConfig.regional}</span>
            </div>
          </div>

          {/* Título de la Ficha */}
          <div className="bg-slate-100 border border-slate-900 py-2 px-3 text-center rounded-none mb-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
              SÁBANA OFICIAL DE CALIFICACIONES DE EVALUACIÓN CONTINUA
            </h2>
            <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-800 mt-1">
              <span><strong>Grado:</strong> {selectedGrade} "{selectedSection}"</span>
              <span>•</span>
              <span><strong>Asignatura:</strong> {selectedSubject}</span>
              <span>•</span>
              <span><strong>Período:</strong> {selectedPeriod} ({PERIODS.find(p => p.key === selectedPeriod)?.name})</span>
              <span>•</span>
              <span><strong>Año Escolar:</strong> {schoolConfig.schoolYear || '2025-2026'}</span>
            </div>
          </div>

          {/* Tabla Oficial */}
          <table className="w-full text-left text-[11px] border-collapse border border-slate-900 mb-6">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-black uppercase text-[10px] border-b border-slate-900">
                <th className="py-2 px-2 border-r border-slate-900 text-center w-8">No.</th>
                <th className="py-2 px-2 border-r border-slate-900">Nombres y Apellidos del Estudiante</th>
                <th className="py-2 px-2 border-r border-slate-900 text-center">RNE</th>
                <th className="py-2 px-2 border-r border-slate-900 text-center">Calif. (0-100)</th>
                <th className="py-2 px-2 border-r border-slate-900 text-center">Literal</th>
                <th className="py-2 px-2 border-r border-slate-900 text-center">Condición</th>
                <th className="py-2 px-2 border-r border-slate-900">Observaciones del Docente</th>
                <th className="py-2 px-2 text-center">Firma de Enterado Padre/Tutor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400">
              {classroomStudents.map((st, idx) => {
                const score = scoresDraft[st.id] !== undefined ? scoresDraft[st.id] : 0;
                const meta = getGradeMeta(score);
                const obs = observationsDraft[st.id] || '';

                return (
                  <tr key={`print_${st.id}`} className="avoid-break">
                    <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold">{st.number || idx + 1}</td>
                    <td className="py-1.5 px-2 border-r border-slate-400 font-extrabold text-slate-900">
                      {st.name}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-center text-[10px] font-mono">
                      {st.rne || '—'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-center font-black text-sm">
                      {score}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold">
                      {meta.literal}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold text-[10px]">
                      {meta.status}
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-400 text-[10px]">
                      {obs || 'Progreso satisfactorio.'}
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-300 italic text-[10px]">
                      ____________________
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-900 text-[11px]">
                <td className="py-2 px-2 border-r border-slate-900 text-center" colSpan={3}>
                  RESUMEN DE SECCIÓN ({classroomStudents.length} Estudiantes)
                </td>
                <td className="py-2 px-2 border-r border-slate-900 text-center font-black">
                  Prom: {stats.avg}
                </td>
                <td className="py-2 px-2 border-r border-slate-900 text-center" colSpan={2}>
                  Aprobados: {stats.approved} | En Recup: {stats.recovery}
                </td>
                <td className="py-2 px-2 text-center font-semibold text-[10px]" colSpan={2}>
                  Certificado conforme al Diseño Curricular MINERD
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Firmas de Autoridades */}
          <div className="avoid-break pt-8 mt-6 border-t border-slate-400">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="border-b border-slate-800 pb-1 mb-1 h-12 flex items-end justify-center font-serif italic text-xs text-slate-400">
                  Firma y Sello
                </div>
                <p className="text-[11px] font-black uppercase text-slate-900">
                  {teachers.find(t => t.id === selectedTeacherId)?.name || currentSession.userName || 'Docente Responsable'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium">Docente Titular de la Asignatura</p>
              </div>

              <div>
                <div className="border-b border-slate-800 pb-1 mb-1 h-12 flex items-end justify-center font-serif italic text-xs text-slate-400">
                  Firma y Sello
                </div>
                <p className="text-[11px] font-black uppercase text-slate-900">{schoolConfig.coordinatorName || 'Coordinación Pedagógica'}</p>
                <p className="text-[10px] text-slate-600 font-medium">Coordinador/a Pedagógico/a</p>
              </div>

              <div>
                <div className="border-b border-slate-800 pb-1 mb-1 h-12 flex items-end justify-center font-serif italic text-xs text-slate-400">
                  Firma y Sello
                </div>
                <p className="text-[11px] font-black uppercase text-slate-900">{schoolConfig.principalName || 'Dirección del Centro'}</p>
                <p className="text-[10px] text-slate-600 font-medium">Director/a del Centro Educativo</p>
              </div>
            </div>

            <div className="mt-8 text-center text-[9px] text-slate-500 font-mono">
              Documento Oficial generado por el Sistema de Planificación Curricular y Registro de Calificaciones MINERD • Escuela Dr. José Francisco Peña Gómez
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VISTA DE IMPRESIÓN (B): SÁBANA GENERAL CON TODAS LAS ASIGNATURAS       */}
      {/* ========================================================================= */}
      {printMode === 'all_subjects' && (
        <div className="print-only text-slate-900 bg-white font-sans p-2">
          {/* Encabezado Oficial Institucional MINERD */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
            <p className="text-xs font-bold tracking-widest text-slate-700 uppercase">República Dominicana</p>
            <h1 className="text-lg font-black tracking-tight uppercase text-slate-900 mt-0.5">
              Ministerio de Educación (MINERD)
            </h1>
            <p className="text-xs font-bold text-slate-800">
              Sábana Consolidada de Rendimiento Académico Integral por Secciones • Sistema SIGERD
            </p>
            <div className="mt-1 text-sm font-extrabold text-slate-900">
              {schoolConfig.schoolName}
            </div>
            <div className="text-[11px] text-slate-700 font-medium flex items-center justify-center gap-3 mt-0.5">
              <span><strong>Código SIGERD:</strong> {schoolConfig.schoolCode || '14668'}</span>
              <span>•</span>
              <span><strong>Distrito:</strong> {schoolConfig.district}</span>
              <span>•</span>
              <span><strong>Regional:</strong> {schoolConfig.regional}</span>
            </div>
          </div>

          {/* Título de la Ficha Integral */}
          <div className="bg-slate-100 border border-slate-900 py-2 px-3 text-center rounded-none mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900">
              CONSOLIDADO GENERAL DE TODAS LAS ASIGNATURAS • {selectedGrade} "{selectedSection}"
            </h2>
            <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-800 mt-1">
              <span><strong>Período Escolar:</strong> {selectedPeriod} ({PERIODS.find(p => p.key === selectedPeriod)?.name})</span>
              <span>•</span>
              <span><strong>Año Lectivo:</strong> {schoolConfig.schoolYear || '2025-2026'}</span>
              <span>•</span>
              <span><strong>Matrícula Evaluada:</strong> {classroomStudents.length} Estudiantes</span>
            </div>
          </div>

          {/* Tabla Multi-Asignatura con Todas las Materias del MINERD */}
          <table className="w-full text-left text-[10px] border-collapse border border-slate-900 mb-6">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-black uppercase text-[9px] border-b border-slate-900">
                <th className="py-2 px-1 border-r border-slate-900 text-center w-7">No.</th>
                <th className="py-2 px-2 border-r border-slate-900 min-w-[140px]">Nombres del Estudiante</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center">RNE</th>
                {/* Columnas para cada Asignatura Oficial */}
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Lengua Española">L. Esp.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Matemática">Mat.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Ciencias Sociales">Soc.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Ciencias de la Naturaleza">Nat.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Educación Artística">Art.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Educación Física">E. Fís.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Formación Integral Humana y Religiosa">F.I.H.R.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Inglés">Ing.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center" title="Francés">Fran.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center font-black bg-slate-300">Prom.</th>
                <th className="py-2 px-1 border-r border-slate-900 text-center font-black">Lit.</th>
                <th className="py-2 px-1 text-center font-black">Condición</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400">
              {allSubjectsMatrix.map((item, idx) => (
                <tr key={`print_matrix_${item.student.id}`} className="avoid-break">
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-bold">{item.number}</td>
                  <td className="py-1 px-2 border-r border-slate-400 font-extrabold text-slate-900 truncate">
                    {item.student.name}
                  </td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center text-[9px] font-mono">
                    {item.student.rne || '—'}
                  </td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Lengua Española'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Matemática'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Ciencias Sociales'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Ciencias de la Naturaleza'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Educación Artística'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Educación Física'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Formación Integral Humana y Religiosa'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Lenguas Extranjeras (Inglés)'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-semibold">{item.scores['Lenguas Extranjeras (Francés)'] || '—'}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-black bg-slate-100">{item.average}</td>
                  <td className="py-1 px-1 border-r border-slate-400 text-center font-black">{item.literal}</td>
                  <td className="py-1 px-1 text-center font-bold text-[9px]">
                    {item.average >= 65 && item.failedSubjectsCount === 0 ? (
                      <span className="text-emerald-950 font-black">
                        Promovido
                      </span>
                    ) : (
                      <span className="text-rose-900 font-black bg-rose-50 px-1 py-0.5 rounded border border-rose-300">
                        {item.conditionText}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-900 text-[10px]">
                <td className="py-2 px-2 border-r border-slate-900 text-center" colSpan={3}>
                  PROMEDIOS GLOBALES DE LA SECCIÓN
                </td>
                <td className="py-2 px-1 border-r border-slate-900 text-center" colSpan={9}>
                  Evaluación Consolidada Integral del Período {selectedPeriod}
                </td>
                <td className="py-2 px-1 border-r border-slate-900 text-center font-black bg-slate-300">
                  {allSubjectsMatrix.length > 0 ? Math.round(allSubjectsMatrix.reduce((a, b) => a + b.average, 0) / allSubjectsMatrix.length) : 0}
                </td>
                <td className="py-2 px-1 text-center font-black" colSpan={2}>
                  MINERD SIGERD
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Firmas Institucionales */}
          <div className="avoid-break pt-8 mt-6 border-t border-slate-400">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="border-b border-slate-800 pb-1 mb-1 h-12 flex items-end justify-center font-serif italic text-xs text-slate-400">
                  Firma y Sello
                </div>
                <p className="text-[11px] font-black uppercase text-slate-900">Equipo Docente del Grado</p>
                <p className="text-[10px] text-slate-600 font-medium">Cuerpo Docente</p>
              </div>

              <div>
                <div className="border-b border-slate-800 pb-1 mb-1 h-12 flex items-end justify-center font-serif italic text-xs text-slate-400">
                  Firma y Sello
                </div>
                <p className="text-[11px] font-black uppercase text-slate-900">{schoolConfig.coordinatorName || 'Coordinación Pedagógica'}</p>
                <p className="text-[10px] text-slate-600 font-medium">Coordinador/a Pedagógico/a</p>
              </div>

              <div>
                <div className="border-b border-slate-800 pb-1 mb-1 h-12 flex items-end justify-center font-serif italic text-xs text-slate-400">
                  Firma y Sello
                </div>
                <p className="text-[11px] font-black uppercase text-slate-900">{schoolConfig.principalName || 'Dirección del Centro'}</p>
                <p className="text-[10px] text-slate-600 font-medium">Director/a del Centro Educativo</p>
              </div>
            </div>

            <div className="mt-8 text-center text-[9px] text-slate-500 font-mono">
              Sábana General de Rendimiento Estudiantil • Ministerio de Educación de la República Dominicana (MINERD) • Escuela Dr. José Francisco Peña Gómez
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
