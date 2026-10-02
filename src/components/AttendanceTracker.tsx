import React, { useState, useEffect, useMemo } from 'react';
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
  Info
} from 'lucide-react';
import { 
  Student, 
  StudentAttendanceRecord, 
  StudentAttendanceStatus, 
  DailyAttendance, 
  PsychologyCaseReport,
  SubjectArea,
  SchoolConfig
} from '../types/minerd';
import { storageService } from '../services/storageService';
import { openWhatsAppChat } from '../utils/whatsapp';

interface AttendanceTrackerProps {
  grade: string;
  section: string;
  date: string;
  area: SubjectArea;
  teacherName: string;
  currentAttendance?: DailyAttendance;
  onChangeAttendance: (attendance: DailyAttendance) => void;
  onDispatchPsychologyReport?: (report: PsychologyCaseReport) => void;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  grade,
  section,
  date,
  area,
  teacherName,
  currentAttendance,
  onChangeAttendance,
  onDispatchPsychologyReport
}) => {
  const [students, setStudents] = useState<Student[]>(() => {
    return storageService.getStudentsByGradeAndSection(grade, section);
  });

  // Modal for dispatching psychology report
  const [alertModalStudent, setAlertModalStudent] = useState<{
    student: Student;
    absentCount: number;
  } | null>(null);

  const [referralNotes, setReferralNotes] = useState('');
  const [referralPriority, setReferralPriority] = useState<'Normal' | 'Media' | 'Alta' | 'Urgente'>('Media');
  const [referralOrientatorId, setReferralOrientatorId] = useState('');
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);

  const orientatorsList = useMemo(() => storageService.getOrientators(), [alertModalStudent]);

  // Sync roster when grade/section changes
  useEffect(() => {
    const list = storageService.getStudentsByGradeAndSection(grade, section);
    setStudents(list);
  }, [grade, section]);

  // Initialize or reconcile attendance records
  useEffect(() => {
    if (!currentAttendance || !currentAttendance.records || currentAttendance.records.length === 0) {
      const initialRecords: StudentAttendanceRecord[] = students.map(s => ({
        studentId: s.id,
        studentName: s.name,
        studentRne: s.rne,
        status: 'present'
      }));

      const total = initialRecords.length;
      const present = total;
      const attendance: DailyAttendance = {
        totalEnrolled: total,
        presentCount: present,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: total > 0 ? 100 : 0,
        records: initialRecords
      };
      onChangeAttendance(attendance);
    }
  }, [students]);

  const records: StudentAttendanceRecord[] = currentAttendance?.records || [];

  // Update a student status
  const handleSetStatus = (studentId: string, status: StudentAttendanceStatus) => {
    const updated = records.map(r => {
      if (r.studentId === studentId) {
        return { ...r, status };
      }
      return r;
    });

    recalculateAndNotify(updated);
  };

  // Update notes for a student
  const handleSetNotes = (studentId: string, notes: string) => {
    const updated = records.map(r => {
      if (r.studentId === studentId) {
        return { ...r, notes };
      }
      return r;
    });
    recalculateAndNotify(updated);
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const updated = records.map(r => ({
      ...r,
      status: 'present' as StudentAttendanceStatus
    }));
    recalculateAndNotify(updated);
  };

  const recalculateAndNotify = (newRecords: StudentAttendanceRecord[]) => {
    const total = newRecords.length;
    const present = newRecords.filter(r => r.status === 'present').length;
    const absent = newRecords.filter(r => r.status === 'absent').length;
    const late = newRecords.filter(r => r.status === 'late').length;
    const excused = newRecords.filter(r => r.status === 'excused').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    const updatedAttendance: DailyAttendance = {
      totalEnrolled: total,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      excusedCount: excused,
      attendanceRate: rate,
      records: newRecords
    };

    onChangeAttendance(updatedAttendance);
  };

  // Quick add student to this grade/section
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStd: Student = {
      id: `std-${Date.now()}`,
      name: newStudentName.trim(),
      rne: `RNE-${Date.now().toString().slice(-6)}`,
      grade,
      section,
      shift: 'Tanda Matutina (8:00 AM - 12:00 PM)'
    };

    storageService.saveStudent(newStd);
    const updatedStudents = [...students, newStd];
    setStudents(updatedStudents);

    const newRec: StudentAttendanceRecord = {
      studentId: newStd.id,
      studentName: newStd.name,
      studentRne: newStd.rne,
      status: 'present'
    };
    recalculateAndNotify([...records, newRec]);

    setNewStudentName('');
    setShowAddStudent(false);
  };

  // Historical absenteeism evaluation per student
  const studentAbsenceMap = useMemo(() => {
    const map: Record<string, { totalAbsences: number; totalUnexcused: number; isHighRisk: boolean }> = {};
    students.forEach(s => {
      const stats = storageService.getStudentAbsenteeismReport(s.rne || s.name);
      map[s.id] = {
        totalAbsences: stats.totalAbsences,
        totalUnexcused: stats.totalUnexcused,
        isHighRisk: stats.isHighRisk
      };
    });
    return map;
  }, [students, records]);

  // Handle open psychology referral modal
  const handleOpenReferralModal = (student: Student) => {
    const stats = studentAbsenceMap[student.id] || { totalAbsences: 0, totalUnexcused: 0 };
    setAlertModalStudent({
      student,
      absentCount: stats.totalAbsences + (records.find(r => r.studentId === student.id)?.status === 'absent' ? 1 : 0)
    });
    
    // Auto-select orientator
    if (orientatorsList.length > 0) {
      const match = orientatorsList.find(o => 
        o.assignedGrades?.some(g => g.toLowerCase().includes(student.grade.toLowerCase())) ||
        o.shift === student.shift
      );
      setReferralOrientatorId(match ? match.id : orientatorsList[0].id);
    } else {
      setReferralOrientatorId('');
    }

    setReferralNotes(`El estudiante presenta ausencias consecutivas e injustificadas en la clase de ${area} (${grade} "${section}"). Se solicita intervención y citación a la familia.`);
    setReferralPriority('Media');
  };

  // Confirm dispatch to Psychology Department
  const handleConfirmReferral = () => {
    if (!alertModalStudent) return;
    const { student, absentCount } = alertModalStudent;

    const config = storageService.getConfig();
    const chosenOrientator = orientatorsList.find(o => o.id === referralOrientatorId);
    const finalOrientatorName = chosenOrientator ? chosenOrientator.name : (config.orientatorName || 'Unidad de Orientación y Psicología');

    const caseReport: PsychologyCaseReport = {
      id: `psy-${Date.now()}`,
      caseCode: `OP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      studentName: student.name,
      studentRne: student.rne || 'RNE-GEN',
      grade: student.grade || grade,
      section: student.section || section,
      shift: student.shift || 'Tanda Matutina (8:00 AM - 12:00 PM)',
      referringTeacher: teacherName || config.teacherName,
      caseType: 'Asistencia / Ausentismo Frecuente',
      priority: referralPriority,
      incidentDescription: `Alerta automática generada desde el Control de Asistencia del Plan Diario (${area}). El estudiante acumula ${absentCount} inasistencias registradas. Observaciones del docente: ${referralNotes}`,
      interventionPlan: '1. Contactar a los tutores legales vía WhatsApp y llamada institucional.\n2. Coordinar entrevista presencial de acompañamiento.\n3. Establecer acuerdo de seguimiento diario de asistencia escolar.',
      parentName: student.parentName || 'Padre / Madre / Tutor Legal',
      parentPhone: student.parentPhone || '809-555-0100',
      orientatorId: chosenOrientator?.id,
      orientatorName: finalOrientatorName,
      status: 'Abierto',
      observations: `Remitido por ${teacherName || config.teacherName} a ${finalOrientatorName} el ${new Date().toLocaleDateString('es-DO')}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to psychology reports
    storageService.savePsychologyReport(caseReport);
    if (onDispatchPsychologyReport) {
      onDispatchPsychologyReport(caseReport);
    }

    setReferralSuccess(`¡Caso ${caseReport.caseCode} remitido exitosamente a ${finalOrientatorName}!`);
    setTimeout(() => {
      setReferralSuccess(null);
      setAlertModalStudent(null);
    }, 1800);
  };

  const currentTotal = currentAttendance?.totalEnrolled || students.length;
  const currentPresent = currentAttendance?.presentCount || 0;
  const currentAbsent = currentAttendance?.absentCount || 0;
  const currentLate = currentAttendance?.lateCount || 0;
  const currentExcused = currentAttendance?.excusedCount || 0;
  const currentRate = currentAttendance?.attendanceRate ?? 0;

  return (
    <div className="space-y-6">
      
      {/* Header Metric Cards */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              Módulo de Asistencia Diaria
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight mt-1.5">
              Control de Asistencia del Día · {grade} "{section}"
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Registre la asistencia de la sesión ({date}). El sistema detecta automáticamente patrones de inasistencia reiterada para remitir a Psicología.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Todos Presentes</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddStudent(!showAddStudent)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Añadir Alumno</span>
            </button>
          </div>
        </div>

        {/* Quick Add Student Inline Form */}
        {showAddStudent && (
          <form onSubmit={handleAddStudent} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-2.5 animate-fade-in">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Nombre y Apellidos del Estudiante..."
              className="flex-1 min-w-[220px] text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-950 rounded-xl cursor-pointer"
            >
              Guardar en Padrón
            </button>
            <button
              type="button"
              onClick={() => setShowAddStudent(false)}
              className="px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* Real-Time KPI Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Matrícula</p>
            <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{currentTotal}</p>
            <p className="text-[11px] text-slate-400 font-medium">Inscritos</p>
          </div>

          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">Presentes</p>
            <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">{currentPresent}</p>
            <p className="text-[11px] text-emerald-600 font-bold">{currentRate}%</p>
          </div>

          <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">Ausentes</p>
            <p className="text-xl font-black text-rose-700 font-mono mt-0.5">{currentAbsent}</p>
            <p className="text-[11px] text-rose-600 font-medium">Inasistencias</p>
          </div>

          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Tardanzas</p>
            <p className="text-xl font-black text-amber-700 font-mono mt-0.5">{currentLate}</p>
            <p className="text-[11px] text-amber-600 font-medium">Retrasos</p>
          </div>

          <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-center col-span-2 sm:col-span-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">Excusas</p>
            <p className="text-xl font-black text-indigo-700 font-mono mt-0.5">{currentExcused}</p>
            <p className="text-[11px] text-indigo-600 font-medium">Justificadas</p>
          </div>

        </div>

        {/* Progress Bar of Attendance Rate */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-700">Porcentaje Global de Asistencia a la Clase</span>
            <span className={`font-mono ${currentRate >= 80 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {currentRate}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                currentRate >= 85 ? 'bg-emerald-500' : (currentRate >= 70 ? 'bg-amber-500' : 'bg-rose-500')
              }`}
              style={{ width: `${Math.max(currentRate, 2)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Listado de Estudiantes del Curso</h3>
            <p className="text-xs text-slate-500 font-medium">Seleccione el estado de presencia para cada alumno</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Presente (P)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Ausente (A)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tardanza (T)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Excusa (E)</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {students.map((student, idx) => {
            const record = records.find(r => r.studentId === student.id) || {
              studentId: student.id,
              studentName: student.name,
              studentRne: student.rne,
              status: 'present' as StudentAttendanceStatus
            };

            const historicalStats = studentAbsenceMap[student.id] || { totalAbsences: 0, isHighRisk: false };
            const isHighAbsenteeism = historicalStats.isHighRisk || historicalStats.totalAbsences >= 3;

            return (
              <div 
                key={student.id} 
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  record.status === 'absent' 
                    ? 'bg-rose-50/40' 
                    : (record.status === 'late' ? 'bg-amber-50/30' : (record.status === 'excused' ? 'bg-indigo-50/30' : 'hover:bg-slate-50/60'))
                }`}
              >
                {/* Student Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{student.name}</span>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {student.rne || 'RNE-S/N'}
                      </span>
                      {isHighAbsenteeism && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {historicalStats.totalAbsences} ausencias acumuladas
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      {student.parentName && <span>Tutor: {student.parentName}</span>}
                      {student.parentPhone && <span>Tel: {student.parentPhone}</span>}
                    </div>
                  </div>
                </div>

                {/* Status Selector & Psychology Alert Action */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  
                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                    
                    {/* Present */}
                    <button
                      type="button"
                      onClick={() => handleSetStatus(student.id, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        record.status === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      P
                    </button>

                    {/* Absent */}
                    <button
                      type="button"
                      onClick={() => handleSetStatus(student.id, 'absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        record.status === 'absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      A
                    </button>

                    {/* Late */}
                    <button
                      type="button"
                      onClick={() => handleSetStatus(student.id, 'late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        record.status === 'late'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      T
                    </button>

                    {/* Excused */}
                    <button
                      type="button"
                      onClick={() => handleSetStatus(student.id, 'excused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        record.status === 'excused'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      E
                    </button>

                  </div>

                  {/* Notes / Reason field */}
                  <input
                    type="text"
                    value={record.notes || ''}
                    onChange={(e) => handleSetNotes(student.id, e.target.value)}
                    placeholder="Nota o excusa..."
                    className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl max-w-[150px] font-medium"
                  />

                  {/* Dispatch to Psychology Button (Highlighted if high absenteeism or absent) */}
                  <button
                    type="button"
                    onClick={() => handleOpenReferralModal(student)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      isHighAbsenteeism || record.status === 'absent'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs'
                        : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-900 border border-transparent'
                    }`}
                    title="Remitir caso de ausentismo al Departamento de Orientación y Psicología"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                    <span>Remitir a Psicología</span>
                  </button>

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* MODAL: REMISIÓN A ORIENTACIÓN Y PSICOLOGÍA */}
      {alertModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-fade-in my-6">
            
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
                      Departamento de Orientación & Psicología
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      Remisión por Ausentismo Frecuente
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertModalStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Student Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    {alertModalStudent.student.name}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {alertModalStudent.student.rne || 'RNE-S/N'}
                  </span>
                </div>
                <p className="text-slate-600">
                  <strong>Curso:</strong> {grade} "{section}" · <strong>Área:</strong> {area}
                </p>
                <p className="text-rose-700 font-bold flex items-center gap-1 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Inasistencias registradas acumuladas: {alertModalStudent.absentCount} días
                </p>
              </div>

              {/* Orientator Selector */}
              <div className="space-y-1.5 p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                <label className="font-bold text-purple-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span>Seleccionar Orientador(a) / Psicólogo(a) Asignado(a) *</span>
                </label>
                <select
                  value={referralOrientatorId}
                  onChange={(e) => setReferralOrientatorId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                  {orientatorsList.length === 0 ? (
                    <option value="">Equipo de Orientación y Psicología (General)</option>
                  ) : (
                    orientatorsList.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.roleTitle} ({o.shift})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prioridad del Caso
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Normal', 'Media', 'Alta', 'Urgente'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setReferralPriority(p)}
                      className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        referralPriority === p
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Referral Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción del Motivo y Observaciones del Docente
                </label>
                <textarea
                  rows={4}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="Detalle los días ausente, si se ha intentado comunicar con la familia, etc."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white leading-relaxed"
                />
              </div>

              {/* Parent Details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase">Tutor Legal</span>
                  <p className="font-bold text-slate-800 text-xs">
                    {alertModalStudent.student.parentName || 'No registrado'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase">Teléfono WhatsApp</span>
                  <p className="font-mono font-bold text-slate-800 text-xs">
                    {alertModalStudent.student.parentPhone || 'No registrado'}
                  </p>
                </div>
              </div>

              {referralSuccess && (
                <p className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-center">
                  {referralSuccess}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAlertModalStudent(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReferral}
                  className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Crear Expediente en Psicología</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
