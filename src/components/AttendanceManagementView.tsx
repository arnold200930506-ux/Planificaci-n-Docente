import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  FileText, 
  UserCheck, 
  Plus, 
  ShieldAlert, 
  Send, 
  HeartHandshake,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Upload,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  Phone,
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle2,
  FileUp,
  FileCheck2,
  HelpCircle,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  Student, 
  StudentAttendanceRecord, 
  StudentAttendanceStatus, 
  DailyAttendance,
  DailyGradeAttendanceSummary, 
  PsychologyCaseReport,
  PsychologyPriority,
  SchoolShift,
  SchoolConfig,
  Orientator,
  EducationalLevel
} from '../types/minerd';
import { storageService } from '../services/storageService';
import { openWhatsAppChat, formatDominicanPhoneNumber } from '../utils/whatsapp';
import { 
  parseStudentsFromExcel, 
  parseStudentsFromPdf, 
  parseStudentsFromText, 
  downloadExcelTemplate,
  ParsedStudentCandidate 
} from '../utils/studentImportParser';

interface AttendanceManagementViewProps {
  schoolConfig: SchoolConfig;
  orientators: Orientator[];
  onDispatchPsychologyReport?: (report: PsychologyCaseReport) => void;
  onNavigateToPsychology?: () => void;
}

const GRADES = [
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

const SHIFTS: SchoolShift[] = [
  'Tanda Matutina (8:00 AM - 12:00 PM)',
  'Tanda Vespertina (1:00 PM - 4:45 PM)',
  'Ambas Tandas (Doble Tanda)'
];

export const AttendanceManagementView: React.FC<AttendanceManagementViewProps> = ({
  schoolConfig,
  orientators,
  onDispatchPsychologyReport,
  onNavigateToPsychology
}) => {
  // Navigation tabs inside Attendance
  const [activeTab, setActiveTab] = useState<'daily_roll' | 'roster' | 'absenteeism_report'>('daily_roll');

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>('4to Grado');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedShift, setSelectedShift] = useState<SchoolShift>('Tanda Matutina (8:00 AM - 12:00 PM)');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local data states
  const [allStudents, setAllStudents] = useState<Student[]>(() => storageService.getStudents());
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState<Record<string, StudentAttendanceStatus>>({});
  const [studentNotesMap, setStudentNotesMap] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Bulk Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'excel' | 'pdf' | 'text'>('excel');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [parsedCandidates, setParsedCandidates] = useState<ParsedStudentCandidate[]>([]);
  const [importTargetGrade, setImportTargetGrade] = useState<string>('4to Grado');
  const [importTargetSection, setImportTargetSection] = useState<string>('A');
  const [importTargetShift, setImportTargetShift] = useState<SchoolShift>('Tanda Matutina (8:00 AM - 12:00 PM)');
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single Student Create/Edit Modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormNumber, setStudentFormNumber] = useState<number>(1);
  const [studentFormName, setStudentFormName] = useState('');
  const [studentFormGender, setStudentFormGender] = useState<'M' | 'F'>('M');
  const [studentFormRne, setStudentFormRne] = useState('');
  const [studentFormGrade, setStudentFormGrade] = useState('4to Grado');
  const [studentFormSection, setStudentFormSection] = useState('A');
  const [studentFormShift, setStudentFormShift] = useState<SchoolShift>('Tanda Matutina (8:00 AM - 12:00 PM)');
  const [studentFormParent, setStudentFormParent] = useState('');
  const [studentFormPhone, setStudentFormPhone] = useState('');
  const [studentFormNotes, setStudentFormNotes] = useState('');

  // Referral to Psychology Modal
  const [referralModalStudent, setReferralModalStudent] = useState<Student | null>(null);
  const [selectedOrientatorId, setSelectedOrientatorId] = useState<string>('');
  const [referralPriority, setReferralPriority] = useState<PsychologyPriority>('Media');
  const [referralCaseType, setReferralCaseType] = useState<string>('Asistencia / Ausentismo Frecuente');
  const [referralObservations, setReferralObservations] = useState('');
  const [referralTeacherPhone, setReferralTeacherPhone] = useState(schoolConfig.teacherPhone || '');
  const [referralSuccessModal, setReferralSuccessModal] = useState<{
    caseCode: string;
    studentName: string;
    orientatorName: string;
    orientatorPhone?: string;
  } | null>(null);
  const [referralSuccessMsg, setReferralSuccessMsg] = useState<string | null>(null);

  // WhatsApp Alert Modal for Parent
  const [waModalStudent, setWaModalStudent] = useState<Student | null>(null);
  const [waModalType, setWaModalType] = useState<'absent' | 'late' | 'citation'>('absent');
  const [waCustomMessage, setWaCustomMessage] = useState('');

  // Sync students from storage
  const reloadStudents = () => {
    const list = storageService.getStudents();
    setAllStudents(list);
  };

  // Filtered students for current grade & section
  const currentClassStudents = useMemo(() => {
    return allStudents.filter(s => {
      const matchGrade = s.grade === selectedGrade;
      const matchSection = s.section.toUpperCase() === selectedSection.toUpperCase();
      return matchGrade && matchSection;
    }).sort((a, b) => (a.number || 999) - (b.number || 999));
  }, [allStudents, selectedGrade, selectedSection]);

  // Initialize attendance for class
  useEffect(() => {
    const initialMap: Record<string, StudentAttendanceStatus> = {};
    currentClassStudents.forEach(s => {
      if (!dailyAttendanceMap[s.id]) {
        initialMap[s.id] = 'present';
      }
    });
    setDailyAttendanceMap(prev => ({ ...initialMap, ...prev }));
  }, [currentClassStudents]);

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    const map: Record<string, StudentAttendanceStatus> = {};
    currentClassStudents.forEach(s => {
      map[s.id] = 'present';
    });
    setDailyAttendanceMap(prev => ({ ...prev, ...map }));
  };

  // KPI Calculations
  const totalInClass = currentClassStudents.length;
  const presentCount = currentClassStudents.filter(s => dailyAttendanceMap[s.id] === 'present').length;
  const absentCount = currentClassStudents.filter(s => dailyAttendanceMap[s.id] === 'absent').length;
  const lateCount = currentClassStudents.filter(s => dailyAttendanceMap[s.id] === 'late').length;
  const excusedCount = currentClassStudents.filter(s => dailyAttendanceMap[s.id] === 'excused').length;
  const attendanceRate = totalInClass > 0 ? Math.round((presentCount / totalInClass) * 100) : 100;

  // Save current attendance roll to plan or history
  const handleSaveAttendanceRoll = () => {
    const records: StudentAttendanceRecord[] = currentClassStudents.map(s => ({
      studentId: s.id,
      studentName: s.name,
      studentRne: s.rne,
      status: dailyAttendanceMap[s.id] || 'present',
      notes: studentNotesMap[s.id] || ''
    }));

    const dailyAttendanceObj: DailyAttendance = {
      totalEnrolled: totalInClass,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
      records
    };

    // Calculate gender breakdown
    const presentMales = currentClassStudents.filter(s => (dailyAttendanceMap[s.id] || 'present') === 'present' && s.gender === 'M').length;
    const presentFemales = currentClassStudents.filter(s => (dailyAttendanceMap[s.id] || 'present') === 'present' && s.gender === 'F').length;
    const absentMales = currentClassStudents.filter(s => (dailyAttendanceMap[s.id] || 'present') === 'absent' && s.gender === 'M').length;
    const absentFemales = currentClassStudents.filter(s => (dailyAttendanceMap[s.id] || 'present') === 'absent' && s.gender === 'F').length;

    // Automatically synchronize with Central Grade Attendance Summary for Registro & Dirección
    const gradeSummaryId = `${selectedDate}_${selectedGrade.replace(/\s+/g, '_')}_${selectedSection}_${selectedShift.includes('Vespertina') ? 'vesp' : 'mat'}`;
    const gradeSummaryRecord: DailyGradeAttendanceSummary = {
      id: gradeSummaryId,
      date: selectedDate,
      grade: selectedGrade,
      section: selectedSection,
      shift: selectedShift,
      totalEnrolled: totalInClass,
      presentCount,
      presentMales,
      presentFemales,
      absentCount,
      absentMales,
      absentFemales,
      lateCount,
      excusedCount,
      attendanceRate,
      records,
      submittedAt: new Date().toISOString(),
      submittedBy: 'Docente de Grado'
    };
    storageService.saveGradeAttendanceRecord(gradeSummaryRecord);

    setSaveSuccessMsg(`¡Registro de asistencia guardado y sincronizado con Registro & Dirección para ${selectedGrade} "${selectedSection}" (${selectedDate})!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Open Edit or New Student Modal
  const handleOpenStudentModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setStudentFormNumber(student.number || 1);
      setStudentFormName(student.name);
      setStudentFormGender(student.gender === 'F' ? 'F' : 'M');
      setStudentFormRne(student.rne || '');
      setStudentFormGrade(student.grade);
      setStudentFormSection(student.section);
      setStudentFormShift(student.shift);
      setStudentFormParent(student.parentName || '');
      setStudentFormPhone(student.parentPhone || '');
      setStudentFormNotes(student.notes || '');
    } else {
      setEditingStudent(null);
      setStudentFormNumber(currentClassStudents.length + 1);
      setStudentFormName('');
      setStudentFormGender('M');
      setStudentFormRne(`RNE-${Math.floor(100000 + Math.random() * 900000)}`);
      setStudentFormGrade(selectedGrade);
      setStudentFormSection(selectedSection);
      setStudentFormShift(selectedShift);
      setStudentFormParent('');
      setStudentFormPhone('');
      setStudentFormNotes('');
    }
    setIsStudentModalOpen(true);
  };

  // Save Student (Single)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormName.trim()) return;

    const studentToSave: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      number: studentFormNumber || 1,
      name: studentFormName.trim(),
      gender: studentFormGender,
      rne: studentFormRne.trim() || `RNE-${Math.floor(100000 + Math.random() * 900000)}`,
      grade: studentFormGrade,
      section: studentFormSection,
      shift: studentFormShift,
      parentName: studentFormParent.trim() || undefined,
      parentPhone: studentFormPhone.trim() || undefined,
      notes: studentFormNotes.trim() || undefined
    };

    storageService.saveStudent(studentToSave);
    reloadStudents();
    setIsStudentModalOpen(false);
  };

  // Delete Student
  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar al estudiante "${name}" de la matrícula?`)) {
      storageService.deleteStudent(id);
      reloadStudents();
    }
  };

  // Handle File Input for Bulk Upload (Excel / PDF)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const buffer = await file.arrayBuffer();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const parsed = parseStudentsFromExcel(buffer, importTargetGrade, importTargetSection, importTargetShift);
        setParsedCandidates(parsed);
      } else if (fileName.endsWith('.pdf')) {
        const parsed = await parseStudentsFromPdf(buffer, importTargetGrade, importTargetSection, importTargetShift);
        setParsedCandidates(parsed);
      } else {
        alert('Formato de archivo no soportado. Por favor use Excel (.xlsx, .xls), CSV (.csv) o PDF (.pdf).');
      }
    } catch (error) {
      console.error('Error al procesar archivo de estudiantes', error);
      alert('Ocurrió un error al leer el archivo. Verifique el formato e intente nuevamente.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle Text Parse
  const handleParseText = () => {
    if (!pasteText.trim()) return;
    const parsed = parseStudentsFromText(pasteText, importTargetGrade, importTargetSection, importTargetShift);
    setParsedCandidates(parsed);
  };

  // Confirm Bulk Import
  const handleConfirmImport = () => {
    if (parsedCandidates.length === 0) return;

    const studentsToImport: Student[] = parsedCandidates.map((c, idx) => ({
      id: `std-imp-${Date.now()}-${idx}`,
      number: c.number || idx + 1,
      name: c.name,
      gender: c.gender || 'M',
      rne: c.rne || `RNE-${Math.floor(100000 + Math.random() * 900000)}`,
      grade: importTargetGrade,
      section: importTargetSection,
      shift: importTargetShift,
      parentName: c.parentName || undefined,
      parentPhone: c.parentPhone || undefined
    }));

    const result = storageService.importStudentsInBulk(studentsToImport);
    reloadStudents();
    setSelectedGrade(importTargetGrade);
    setSelectedSection(importTargetSection);
    setSelectedShift(importTargetShift);

    alert(`¡Éxito! Se importaron ${result.added} nuevos estudiantes (${result.updated} actualizados) para ${importTargetGrade} "${importTargetSection}".`);
    setIsUploadModalOpen(false);
    setParsedCandidates([]);
    setPasteText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open Psychology Referral Modal
  const handleOpenReferralModal = (student: Student) => {
    setReferralModalStudent(student);
    
    // Auto-select matching orientator if possible
    if (orientators.length > 0) {
      const match = orientators.find(o => 
        o.assignedGrades?.some(g => g.toLowerCase().includes(student.grade.toLowerCase())) ||
        o.shift === student.shift
      );
      setSelectedOrientatorId(match ? match.id : orientators[0].id);
    } else {
      setSelectedOrientatorId('');
    }

    setReferralCaseType('Asistencia / Ausentismo Frecuente');
    setReferralPriority('Media');
    setReferralObservations(`El estudiante acumula inasistencias no justificadas en el curso ${student.grade} "${student.section}" (${student.shift}). Se requiere seguimiento por parte de la Unidad de Orientación y citación formal a los padres.`);
  };

  // Confirm Psychology Referral
  const handleConfirmPsychologyReferral = () => {
    if (!referralModalStudent) return;

    const chosenOrientator = orientators.find(o => o.id === selectedOrientatorId);
    const orientatorName = chosenOrientator ? chosenOrientator.name : (schoolConfig.orientatorName || 'Unidad de Orientación y Psicología');

    const report: PsychologyCaseReport = {
      id: `psy-${Date.now()}`,
      caseCode: `OP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      studentName: referralModalStudent.name,
      studentRne: referralModalStudent.rne || 'RNE-GEN',
      grade: referralModalStudent.grade,
      section: referralModalStudent.section,
      shift: referralModalStudent.shift,
      referringTeacher: schoolConfig.teacherName || 'Docente de Grado',
      referringTeacherPhone: referralTeacherPhone.trim() || schoolConfig.teacherPhone || '',
      caseType: referralCaseType as any,
      priority: referralPriority,
      incidentDescription: `Remisión realizada desde el Módulo de Control de Asistencia. Observaciones del docente: ${referralObservations}`,
      interventionPlan: '1. Contacto inmediato con la familia.\n2. Convocatoria a entrevista de orientación.\n3. Registro de acuerdos de asistencia escolar.',
      parentName: referralModalStudent.parentName || 'Padre / Tutor Legal',
      parentPhone: referralModalStudent.parentPhone || '809-555-0100',
      orientatorId: chosenOrientator?.id,
      orientatorName: orientatorName,
      status: 'Abierto',
      acknowledgmentDate: new Date().toISOString(),
      observations: `Asignado a: ${orientatorName} (${chosenOrientator?.roleTitle || 'Orientación Escolar'}). Remitido por: ${schoolConfig.teacherName || 'Docente'}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storageService.savePsychologyReport(report);
    if (onDispatchPsychologyReport) {
      onDispatchPsychologyReport(report);
    }

    setReferralSuccessModal({
      caseCode: report.caseCode,
      studentName: report.studentName,
      orientatorName: orientatorName,
      orientatorPhone: chosenOrientator?.phone
    });
    setReferralModalStudent(null);
  };

  // Open WhatsApp alert modal
  const handleOpenWaModal = (student: Student, type: 'absent' | 'late') => {
    setWaModalStudent(student);
    setWaModalType(type);
    const dateFormatted = new Date(selectedDate).toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });
    
    if (type === 'absent') {
      setWaCustomMessage(
        `Estimado/a ${student.parentName || 'Padre/Tutor'}, le saludamos de la ${schoolConfig.schoolName}. Le informamos que su hijo/a *${student.name}* no ha asistido a clases hoy ${dateFormatted} en el grado ${student.grade} "${student.section}". Por favor comunicarse con el centro o justificar su inasistencia.`
      );
    } else {
      setWaCustomMessage(
        `Estimado/a ${student.parentName || 'Padre/Tutor'}, le saludamos de la ${schoolConfig.schoolName}. Le notificamos que su hijo/a *${student.name}* ha llegado con tardanza a la jornada escolar de hoy ${dateFormatted}. Agradecemos su apoyo con la puntualidad.`
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-100 shadow-xs">
            <UserCheck className="w-4 h-4 text-emerald-300" />
            Registro de Asistencia y Matrícula MINERD
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Control Diario de Asistencia & Carga Masiva de Estudiantes
          </h1>
          <p className="text-emerald-100/85 text-sm leading-relaxed">
            Pase de lista interactivo de la <strong>{schoolConfig.schoolName}</strong>. Importe listados completos desde <strong>Excel (.xlsx, .xls)</strong> o <strong>PDF</strong>, y remita alertas con asignación directa a los orientadores escolares.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setImportTargetGrade(selectedGrade);
              setImportTargetSection(selectedSection);
              setImportTargetShift(selectedShift);
              setParsedCandidates([]);
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl font-extrabold text-xs transition-all shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Subir Excel / PDF en Masa
          </button>

          <button
            type="button"
            onClick={() => handleOpenStudentModal()}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-300" />
            + Estudiante
          </button>
        </div>
      </div>

      {/* Main Subtabs & Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        
        {/* Subtabs selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('daily_roll')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'daily_roll'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pase de Lista ({currentClassStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Matrícula y Alumnos ({allStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('absenteeism_report')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'absenteeism_report'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Alertas de Inasistencia</span>
          </button>
        </div>

        {/* Global Template Download */}
        <button
          type="button"
          onClick={downloadExcelTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Descargar Plantilla Excel</span>
        </button>

      </div>

      {/* Grade, Section, Shift & Date Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Grado Escolar:</label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            {GRADES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sección:</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            {SECTIONS.map(s => (
              <option key={s} value={s}>Sección "{s}"</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanda Escolar:</label>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value as SchoolShift)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            {SHIFTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fecha del Pase de Lista:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          />
        </div>

      </div>

      {/* VIEW 1: DAILY ROLL CALL */}
      {activeTab === 'daily_roll' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Matriculados</span>
              <span className="text-2xl font-black text-slate-900">{totalInClass}</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Presentes (P)</span>
              <span className="text-2xl font-black text-emerald-700">{presentCount}</span>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-xs">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Ausentes (A)</span>
              <span className="text-2xl font-black text-rose-700">{absentCount}</span>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Tardanzas (T)</span>
              <span className="text-2xl font-black text-amber-700">{lateCount}</span>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">Excusas (E)</span>
              <span className="text-2xl font-black text-blue-700">{excusedCount}</span>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 shadow-xs">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">% Asistencia</span>
              <span className="text-2xl font-black text-purple-700">{attendanceRate}%</span>
            </div>
          </div>

          {/* Action Bar for Daily Attendance */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Marcar Todos Presentes
              </button>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccessMsg && (
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in">
                  {saveSuccessMsg}
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveAttendanceRoll}
                className="px-5 py-2 bg-slate-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                Guardar Registro de Asistencia
              </button>
            </div>
          </div>

          {/* Students Table for Roll Call */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {currentClassStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">No hay estudiantes registrados para {selectedGrade} "{selectedSection}"</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Cargue la nómina en segundos usando el botón "Subir Excel / PDF en Masa" o agregue alumnos individualmente.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setImportTargetGrade(selectedGrade);
                    setImportTargetSection(selectedSection);
                    setImportTargetShift(selectedShift);
                    setIsUploadModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Nómina para este Grado</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No.</th>
                      <th className="py-3 px-4">Estudiante</th>
                      <th className="py-3 px-4 w-28 text-center">RNE</th>
                      <th className="py-3 px-4 w-64 text-center">Estado de Asistencia</th>
                      <th className="py-3 px-4">Observación del Día</th>
                      <th className="py-3 px-4 w-48 text-right">Alertas y Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentClassStudents.map((std, idx) => {
                      const currentStatus = dailyAttendanceMap[std.id] || 'present';
                      const isAbsent = currentStatus === 'absent';
                      const isLate = currentStatus === 'late';

                      return (
                        <tr 
                          key={std.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isAbsent ? 'bg-rose-50/30' : isLate ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-500 text-center">
                            {std.number || idx + 1}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                              <span>{std.name}</span>
                              {std.gender && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  std.gender === 'F' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {std.gender}
                                </span>
                              )}
                            </div>
                            {std.parentName && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Tutor: {std.parentName} {std.parentPhone ? `(${std.parentPhone})` : ''}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-500 text-center text-[11px]">
                            {std.rne || '—'}
                          </td>

                          {/* Attendance Status Buttons */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present */}
                              <button
                                type="button"
                                onClick={() => setDailyAttendanceMap(prev => ({ ...prev, [std.id]: 'present' }))}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                                }`}
                                title="Presente"
                              >
                                P
                              </button>

                              {/* Absent */}
                              <button
                                type="button"
                                onClick={() => setDailyAttendanceMap(prev => ({ ...prev, [std.id]: 'absent' }))}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs scale-105'
                                    : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                                }`}
                                title="Ausente"
                              >
                                A
                              </button>

                              {/* Late */}
                              <button
                                type="button"
                                onClick={() => setDailyAttendanceMap(prev => ({ ...prev, [std.id]: 'late' }))}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-xs scale-105'
                                    : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                                }`}
                                title="Tardanza"
                              >
                                T
                              </button>

                              {/* Excused */}
                              <button
                                type="button"
                                onClick={() => setDailyAttendanceMap(prev => ({ ...prev, [std.id]: 'excused' }))}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                  currentStatus === 'excused'
                                    ? 'bg-blue-600 text-white shadow-xs scale-105'
                                    : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800'
                                }`}
                                title="Excusa médica / justificada"
                              >
                                E
                              </button>
                            </div>
                          </td>

                          {/* Observation field */}
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={studentNotesMap[std.id] || ''}
                              onChange={(e) => setStudentNotesMap(prev => ({ ...prev, [std.id]: e.target.value }))}
                              placeholder="Ej. Cita médica, fiebre..."
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50/50 focus:bg-white"
                            />
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* WhatsApp Button if absent or late */}
                              {(isAbsent || isLate) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenWaModal(std, isAbsent ? 'absent' : 'late')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Enviar aviso por WhatsApp al tutor"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                                  <span>WhatsApp</span>
                                </button>
                              )}

                              {/* Refer to Psychology */}
                              <button
                                type="button"
                                onClick={() => handleOpenReferralModal(std)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Remitir a la Unidad de Orientación y Psicología"
                              >
                                <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                                <span>Remitir</span>
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

        </div>
      )}

      {/* VIEW 2: ROSTER & STUDENTS DIRECTORY */}
      {activeTab === 'roster' && (
        <div className="space-y-5 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, RNE, tutor..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenStudentModal()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Estudiante</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No.</th>
                    <th className="py-3 px-4">Estudiante</th>
                    <th className="py-3 px-4">RNE</th>
                    <th className="py-3 px-4">Grado & Sección</th>
                    <th className="py-3 px-4">Tanda</th>
                    <th className="py-3 px-4">Tutor Legal & Contacto</th>
                    <th className="py-3 px-4 w-28 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allStudents
                    .filter(s => {
                      if (!searchQuery) return s.grade === selectedGrade && s.section.toUpperCase() === selectedSection.toUpperCase();
                      const q = searchQuery.toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.rne?.toLowerCase().includes(q) ||
                        s.parentName?.toLowerCase().includes(q) ||
                        s.grade.toLowerCase().includes(q)
                      );
                    })
                    .map((std, idx) => (
                      <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500 text-center">
                          {std.number || idx + 1}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          {std.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {std.rne || '—'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {std.grade} "{std.section}"
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {std.shift}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <p className="font-bold text-slate-800">{std.parentName || 'No registrado'}</p>
                          <p className="text-[11px] font-mono text-slate-500">{std.parentPhone || 'Sin teléfono'}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenStudentModal(std)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                              title="Editar estudiante"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(std.id, std.name)}
                              className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                              title="Eliminar de la matrícula"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: ABSENTEEISM & RISK REPORT */}
      {activeTab === 'absenteeism_report' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 rounded-3xl border border-amber-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Detección de Alertas Tempranas de Ausentismo & Deserción Escolar</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              La normativa del MINERD establece que los estudiantes con 3 o más ausencias injustificadas deben ser remitidos de inmediato a la <strong>Unidad de Orientación y Psicología</strong> para evitar el rezago académico y garantizar el derecho a la educación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentClassStudents.map(std => {
              const report = storageService.getStudentAbsenteeismReport(std.rne || std.name);
              const hasAlert = report.totalAbsences >= 2 || report.isHighRisk;

              return (
                <div 
                  key={std.id}
                  className={`p-5 rounded-3xl border bg-white shadow-xs space-y-3 ${
                    hasAlert ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{std.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{std.rne} · {std.grade} "{std.section}"</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      hasAlert ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {report.totalAbsences} Ausencias
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">Injustificadas</span>
                      <span className="font-extrabold text-slate-800">{report.totalUnexcused}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">Tardanzas</span>
                      <span className="font-extrabold text-slate-800">{report.totalLates}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">Sesiones</span>
                      <span className="font-extrabold text-slate-800">{report.totalSessions || 1}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenWaModal(std, 'absent')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-800 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Contactar Tutor
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReferralModal(std)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      Remitir a Psicología
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: BULK UPLOAD STUDENTS (EXCEL / PDF / TEXT) */}
      {/* ========================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-800">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Carga Masiva de Estudiantes (Matrícula)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Importe nóminas completas desde archivos de Excel, PDF o texto copiado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Destination Configuration */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Grado Destino *</label>
                <select
                  value={importTargetGrade}
                  onChange={(e) => setImportTargetGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Sección Destino *</label>
                <select
                  value={importTargetSection}
                  onChange={(e) => setImportTargetSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {SECTIONS.map(s => (
                    <option key={s} value={s}>Sección "{s}"</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Tanda Escolar *</label>
                <select
                  value={importTargetShift}
                  onChange={(e) => setImportTargetShift(e.target.value as SchoolShift)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {SHIFTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Source Tab Selector */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setUploadMode('excel')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadMode === 'excel' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Archivo Excel (.xlsx, .csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('pdf')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadMode === 'pdf' ? 'bg-white text-rose-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Documento PDF (.pdf)</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  uploadMode === 'text' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Pegar Lista de Texto</span>
              </button>
            </div>

            {/* Tab: EXCEL / CSV */}
            {uploadMode === 'excel' && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-3xl text-center cursor-pointer transition-all space-y-3"
                >
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      Haga clic para seleccionar su archivo de Excel (.xlsx, .xls) o CSV
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      El sistema detectará automáticamente las columnas de Nombres, RNE, Cédula, Género y Teléfono del tutor.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>¿No tiene el formato exacto?</span>
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar Plantilla Oficial Excel
                  </button>
                </div>
              </div>
            )}

            {/* Tab: PDF */}
            {uploadMode === 'pdf' && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/40 hover:bg-rose-50/70 rounded-3xl text-center cursor-pointer transition-all space-y-3"
                >
                  <FileText className="w-10 h-10 text-rose-600 mx-auto" />
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      Haga clic para seleccionar su archivo PDF con la lista de estudiantes
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Soporta nóminas del SIGERD y listados escolares impresos en formato PDF.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Tab: TEXT */}
            {uploadMode === 'text' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Pegue los nombres de los estudiantes (un estudiante por línea):
                </label>
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="1. Juan Carlos Pérez&#10;2. María Elena Santos&#10;3. Pedro Alejandro Marte&#10;4. Ana Sofía Rodríguez"
                  className="w-full p-4 border border-slate-300 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseText}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Procesar Lista de Texto
                  </button>
                </div>
              </div>
            )}

            {isProcessingFile && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-pulse">
                Procesando y extrayendo estudiantes del documento...
              </div>
            )}

            {/* PREVIEW OF PARSED CANDIDATES */}
            {parsedCandidates.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    Estudiantes Detectados para Importar ({parsedCandidates.length}):
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Destino: {importTargetGrade} "{importTargetSection}"
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
                  {parsedCandidates.map((c, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center">
                          {c.number || i + 1}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{c.rne} {c.parentName ? `· Tutor: ${c.parentName}` : ''}</p>
                        </div>
                      </div>
                      {c.gender && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {c.gender}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setParsedCandidates([])}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar {parsedCandidates.length} Estudiantes en la Matrícula</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SINGLE STUDENT FORM (CREATE / EDIT) */}
      {/* ========================================================= */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingStudent ? 'Editar Ficha del Estudiante' : 'Registrar Nuevo Estudiante'}
                  </h3>
                  <p className="text-xs text-slate-500">{schoolConfig.schoolName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-slate-700">No. Lista</label>
                  <input
                    type="number"
                    min={1}
                    value={studentFormNumber}
                    onChange={(e) => setStudentFormNumber(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Sexo / Género</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentFormGender('M')}
                      className={`py-2 rounded-xl font-bold text-xs cursor-pointer ${
                        studentFormGender === 'M' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Masculino (M)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentFormGender('F')}
                      className={`py-2 rounded-xl font-bold text-xs cursor-pointer ${
                        studentFormGender === 'F' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Femenino (F)
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="font-bold text-slate-700">Nombre Completo del Estudiante *</label>
                  <input
                    type="text"
                    required
                    value={studentFormName}
                    onChange={(e) => setStudentFormName(e.target.value)}
                    placeholder="Ej. Castillo Peña, Ángel David"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="font-bold text-slate-700">RNE / Matrícula Oficial</label>
                  <input
                    type="text"
                    value={studentFormRne}
                    onChange={(e) => setStudentFormRne(e.target.value)}
                    placeholder="RNE-2025-001"
                    className="w-full px-3.5 py-2 font-mono border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Grado</label>
                  <select
                    value={studentFormGrade}
                    onChange={(e) => setStudentFormGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold cursor-pointer"
                  >
                    {GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-slate-700">Sección</label>
                  <select
                    value={studentFormSection}
                    onChange={(e) => setStudentFormSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold cursor-pointer"
                  >
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>Sección "{s}"</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="font-bold text-slate-700">Tanda Escolar</label>
                  <select
                    value={studentFormShift}
                    onChange={(e) => setStudentFormShift(e.target.value as SchoolShift)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold cursor-pointer"
                  >
                    {SHIFTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Nombre del Tutor / Padre / Madre</label>
                  <input
                    type="text"
                    value={studentFormParent}
                    onChange={(e) => setStudentFormParent(e.target.value)}
                    placeholder="Rosa Peña (Madre)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="font-bold text-slate-700">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    value={studentFormPhone}
                    onChange={(e) => setStudentFormPhone(e.target.value)}
                    placeholder="809-555-0100"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  {editingStudent ? 'Actualizar Ficha' : 'Registrar Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REFERRAL TO PSYCHOLOGY / GUIDANCE WITH ORIENTATOR SELECTOR */}
      {/* ========================================================= */}
      {referralModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Remitir Caso a la Unidad de Orientación y Psicología
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acompañamiento Psicosocial & Seguimiento Escolar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReferralModalStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Student info card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{referralModalStudent.name}</h4>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                    {referralModalStudent.rne || 'RNE-S/N'} · {referralModalStudent.grade} "{referralModalStudent.section}" ({referralModalStudent.shift})
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg">
                  Remisión Docente
                </span>
              </div>

              {/* CRITICAL: ORIENTATOR SELECTOR */}
              <div className="space-y-1.5 p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                <label className="font-bold text-purple-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span>Seleccionar Orientador(a) / Psicólogo(a) Asignado(a) *</span>
                </label>
                <select
                  value={selectedOrientatorId}
                  onChange={(e) => setSelectedOrientatorId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                  {orientators.length === 0 ? (
                    <option value="">Equipo General de Orientación y Psicología (Por defecto)</option>
                  ) : (
                    orientators.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.roleTitle} ({o.shift})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-purple-800 leading-relaxed mt-1">
                  El caso se asignará directamente a la bandeja del profesional seleccionado para su intervención y citación familiar.
                </p>
              </div>

              {/* Motive & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tipo de Caso / Motivo</label>
                  <select
                    value={referralCaseType}
                    onChange={(e) => setReferralCaseType(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium bg-white cursor-pointer"
                  >
                    <option value="Asistencia / Ausentismo Frecuente">Asistencia / Ausentismo Frecuente</option>
                    <option value="Conductual / Comportamiento">Conductual / Comportamiento</option>
                    <option value="Emocional / Psicológico">Emocional / Psicológico</option>
                    <option value="Rendimiento Académico / Aprendizaje">Rendimiento Académico / Aprendizaje</option>
                    <option value="Situación Familiar / Vulnerabilidad">Situación Familiar / Vulnerabilidad</option>
                    <option value="Necesidades Específicas de Apoyo Educativo (NEAE)">NEAE (Educación Especial / Inclusión)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nivel de Prioridad</label>
                  <div className="grid grid-cols-4 gap-1 pt-0.5">
                    {(['Normal', 'Media', 'Alta', 'Urgente'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setReferralPriority(p)}
                        className={`py-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                          referralPriority === p ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Observaciones y Hallazgos del Docente</label>
                <textarea
                  rows={3}
                  value={referralObservations}
                  onChange={(e) => setReferralObservations(e.target.value)}
                  placeholder="Describa la situación observada en el aula o el motivo puntual del referimiento..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">WhatsApp del Maestro/a para recibir notificación del informe final</label>
                <input
                  type="tel"
                  value={referralTeacherPhone}
                  onChange={(e) => setReferralTeacherPhone(e.target.value)}
                  placeholder="Ej: 809-555-0199"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none bg-slate-50 font-medium"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Cuando la Unidad de Orientación y Psicología concluya la intervención, recibirá un reporte con las pautas pedagógicas directamente a este número.
                </p>
              </div>

              {referralSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-center">
                  {referralSuccessMsg}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReferralModalStudent(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPsychologyReferral}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Despachar Expediente a Orientación</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: WHATSAPP ALERT TO PARENT */}
      {/* ========================================================= */}
      {waModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Aviso de Asistencia por WhatsApp
                  </h4>
                  <p className="text-xs text-slate-500">
                    {waModalStudent.name} (Tutor: {waModalStudent.parentName || 'Familia'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaModalStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between font-mono">
                <span className="text-slate-500">Destinatario:</span>
                <span className="font-bold text-slate-800">{waModalStudent.parentPhone || '809-555-0100'}</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mensaje a enviar:</label>
                <textarea
                  rows={5}
                  value={waCustomMessage}
                  onChange={(e) => setWaCustomMessage(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-green-500 outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWaModalStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppChat(waModalStudent.parentPhone || '809-555-0100', waCustomMessage);
                  setWaModalStudent(null);
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Abrir WhatsApp y Enviar</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
