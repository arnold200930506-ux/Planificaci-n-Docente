import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  ShieldCheck, 
  School, 
  Layers,
  Sparkles,
  RefreshCw,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { 
  DailyGradeAttendanceSummary, 
  SchoolConfig, 
  SchoolShift,
  Student
} from '../types/minerd';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

interface GradeAttendanceConsultationProps {
  schoolConfig: SchoolConfig;
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

export const GradeAttendanceConsultation: React.FC<GradeAttendanceConsultationProps> = ({
  schoolConfig
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [searchGrade, setSearchGrade] = useState<string>('all');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Load registered students and grade attendance records
  const allStudents = useMemo(() => storageService.getStudents(), []);
  const gradeAttendanceList = useMemo(() => storageService.getGradeAttendances(), [selectedDate]);

  // Filter attendance for the chosen date
  const recordsForDate = useMemo(() => {
    return gradeAttendanceList.filter(rec => rec.date === selectedDate);
  }, [gradeAttendanceList, selectedDate]);

  // Map students by grade and section to identify total enrollment even if attendance hasn't been submitted yet
  const classBreakdown = useMemo(() => {
    // Generate matrix of active classes based on all enrolled students + submitted records
    const classMap = new Map<string, {
      grade: string;
      section: string;
      shift: SchoolShift;
      enrolledTotal: number;
      enrolledMales: number;
      enrolledFemales: number;
      record?: DailyGradeAttendanceSummary;
    }>();

    // 1. Group students from roster
    allStudents.forEach(std => {
      const shiftVal = std.shift || 'Tanda Matutina (8:00 AM - 12:00 PM)';
      const key = `${std.grade}__${std.section}__${shiftVal}`;
      if (!classMap.has(key)) {
        classMap.set(key, {
          grade: std.grade,
          section: std.section,
          shift: shiftVal,
          enrolledTotal: 0,
          enrolledMales: 0,
          enrolledFemales: 0
        });
      }
      const item = classMap.get(key)!;
      item.enrolledTotal++;
      if (std.gender === 'F') item.enrolledFemales++;
      else item.enrolledMales++;
    });

    // 2. Attach submitted daily grade attendance records
    recordsForDate.forEach(rec => {
      const key = `${rec.grade}__${rec.section}__${rec.shift}`;
      if (!classMap.has(key)) {
        classMap.set(key, {
          grade: rec.grade,
          section: rec.section,
          shift: rec.shift,
          enrolledTotal: rec.totalEnrolled,
          enrolledMales: (rec.presentMales || 0) + (rec.absentMales || 0),
          enrolledFemales: (rec.presentFemales || 0) + (rec.absentFemales || 0),
          record: rec
        });
      } else {
        const item = classMap.get(key)!;
        item.record = rec;
      }
    });

    // Convert map to array and apply filters
    let list = Array.from(classMap.values());

    if (selectedShiftFilter !== 'all') {
      list = list.filter(c => c.shift.includes(selectedShiftFilter));
    }

    if (searchGrade !== 'all') {
      list = list.filter(c => c.grade === searchGrade);
    }

    // Sort alphabetically by grade and section
    return list.sort((a, b) => {
      const cmp = a.grade.localeCompare(b.grade);
      if (cmp !== 0) return cmp;
      return a.section.localeCompare(b.section);
    });
  }, [allStudents, recordsForDate, selectedShiftFilter, searchGrade]);

  // Overall KPIs for the selected date
  const totalEnrolled = useMemo(() => {
    return classBreakdown.reduce((acc, curr) => acc + (curr.record ? curr.record.totalEnrolled : curr.enrolledTotal), 0);
  }, [classBreakdown]);

  const totalPresent = useMemo(() => {
    return classBreakdown.reduce((acc, curr) => acc + (curr.record ? curr.record.presentCount : 0), 0);
  }, [classBreakdown]);

  const totalAbsent = useMemo(() => {
    return classBreakdown.reduce((acc, curr) => acc + (curr.record ? curr.record.absentCount : 0), 0);
  }, [classBreakdown]);

  const totalLate = useMemo(() => {
    return classBreakdown.reduce((acc, curr) => acc + (curr.record ? curr.record.lateCount : 0), 0);
  }, [classBreakdown]);

  const totalExcused = useMemo(() => {
    return classBreakdown.reduce((acc, curr) => acc + (curr.record ? curr.record.excusedCount : 0), 0);
  }, [classBreakdown]);

  const classesSubmittedCount = useMemo(() => {
    return classBreakdown.filter(c => !!c.record).length;
  }, [classBreakdown]);

  const overallRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  // Format Dominican date
  const formattedDate = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return d.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Generate WhatsApp summary text for Distrital report
  const generateWhatsAppDistritalReport = () => {
    const text = 
`🏛️ *REPORTE DIARIO DE ASISTENCIA - MINERD*
🏫 *Centro Educativo:* ${schoolConfig.schoolName}
📍 *Código / Distrito:* ${schoolConfig.schoolCode || 'Centro Escolar'}
📅 *Fecha:* ${formattedDate}

📊 *RESUMEN INSTITUCIONAL:*
• Matrícula Total Registrada: *${totalEnrolled}*
• Total Estudiantes Presentes: *${totalPresent}* (${overallRate}%)
• Total Inasistencias (Ausentes): *${totalAbsent}*
• Excusas Médicas / Permisos: *${totalExcused}*
• Tardanzas: *${totalLate}*
• Secciones Reportadas: *${classesSubmittedCount} / ${classBreakdown.length}*

📋 *DESGLOSE POR GRADOS:*
${classBreakdown.map(c => {
  if (c.record) {
    return `• ${c.grade} "${c.section}" (${c.shift.includes('Vespertina') ? 'Vesp' : 'Mat'}): ${c.record.presentCount}/${c.record.totalEnrolled} presentes (${c.record.attendanceRate}%)`;
  }
  return `• ${c.grade} "${c.section}": _Pendiente de pase de lista_`;
}).join('\n')}

✍️ *Remitido por:* Coordinación de Registro & Dirección Escolar`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const currentSession = authService.getSession();

  return (
    <div className="space-y-6">
      {/* Top Banner specific for Registro & Dirección */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Acceso Exclusivo: Dirección Escolar & Coordinación de Registro
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Consulta y Consolidado de Asistencia Diaria por Grado
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Supervisión de asistencia en tiempo real por cada grado y sección para la elaboración del reporte diario oficial distrital y el Sistema de Información para la Gestión Escolar de la República Dominicana (SIGERD).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={generateWhatsAppDistritalReport}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
              title="Copiar formato de texto estructurado para WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>{copySuccess ? '¡Copiado al Portapapeles!' : 'Copiar Reporte Distrital'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ficha Oficial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control & Date Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">Fecha de Consulta:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-blue-900 outline-none cursor-pointer"
            />
          </div>

          {/* Shift filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700">Tanda:</span>
            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Todas las Tandas</option>
              <option value="Matutina">Tanda Matutina</option>
              <option value="Vespertina">Tanda Vespertina</option>
            </select>
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs">
            <School className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700">Filtrar Grado:</span>
            <select
              value={searchGrade}
              onChange={(e) => setSearchGrade(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">Todos los Grados</option>
              {PRESET_GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-500 block">Reporte para el día:</span>
          <span className="text-xs font-black text-slate-800 capitalize">{formattedDate}</span>
        </div>
      </div>

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Matrícula General</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalEnrolled}</p>
          <p className="text-[10px] text-slate-400 font-medium">Estudiantes en el padrón</p>
        </div>

        <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-black uppercase tracking-wider">Presentes Hoy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">{totalPresent}</p>
          <p className="text-[10px] text-emerald-600 font-bold">
            Tasa Global: {overallRate}%
          </p>
        </div>

        <div className="bg-rose-50/70 p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-black uppercase tracking-wider">Ausencias</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700">{totalAbsent}</p>
          <p className="text-[10px] text-rose-600 font-medium">Inasistencias registradas</p>
        </div>

        <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-black uppercase tracking-wider">Tardanzas & Excusas</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-700">{totalLate + totalExcused}</p>
          <p className="text-[10px] text-amber-600 font-medium">{totalLate} tardanzas / {totalExcused} excusas</p>
        </div>

        <div className="bg-indigo-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[11px] font-black uppercase tracking-wider">Secciones Reportadas</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-800">
            {classesSubmittedCount} <span className="text-sm font-semibold text-indigo-600">/ {classBreakdown.length}</span>
          </p>
          <p className="text-[10px] text-indigo-600 font-medium">Pase de lista sincronizado</p>
        </div>
      </div>

      {/* Main Table: Consolidated Attendance Breakdown by Grade & Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Sábana Consolidada de Asistencia por Grado y Sección
            </h3>
            <p className="text-xs text-slate-500">
              Datos para el registro pedagógico de fin de mes y reportes al Distrito Educativo.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            {classBreakdown.length} cursos supervisados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Grado y Sección</th>
                <th className="py-3 px-4">Tanda Escolar</th>
                <th className="py-3 px-3 text-center">Matrícula</th>
                <th className="py-3 px-3 text-center text-emerald-800">Presentes (M / F)</th>
                <th className="py-3 px-3 text-center text-rose-800">Ausentes</th>
                <th className="py-3 px-3 text-center text-amber-800">Tardanzas</th>
                <th className="py-3 px-3 text-center text-blue-800">Excusas</th>
                <th className="py-3 px-3 text-center">% Asistencia</th>
                <th className="py-3 px-4 text-center">Estado del Reporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No hay cursos matriculados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                classBreakdown.map((item, idx) => {
                  const hasRecord = !!item.record;
                  const rate = hasRecord ? item.record!.attendanceRate : 0;
                  
                  // Color badge for rate
                  let rateBadgeClass = 'bg-slate-100 text-slate-600';
                  if (hasRecord) {
                    if (rate >= 90) rateBadgeClass = 'bg-emerald-100 text-emerald-800 font-black';
                    else if (rate >= 80) rateBadgeClass = 'bg-amber-100 text-amber-800 font-black';
                    else rateBadgeClass = 'bg-rose-100 text-rose-800 font-black';
                  }

                  return (
                    <tr key={`${item.grade}_${item.section}_${item.shift}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-200">
                            {item.section}
                          </span>
                          <div>
                            <p className="font-extrabold text-slate-900">{item.grade}</p>
                            <p className="text-[10px] text-slate-400">Sección &quot;{item.section}&quot;</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.shift.includes('Vespertina') ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {item.shift.includes('Vespertina') ? 'Vespertina' : 'Matutina'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                        {hasRecord ? item.record!.totalEnrolled : item.enrolledTotal}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {hasRecord ? (
                          <div className="font-bold text-emerald-700">
                            <span className="text-sm font-black">{item.record!.presentCount}</span>
                            <span className="text-[10px] text-emerald-600 block">
                              (♂ {item.record!.presentMales || 0} / ♀ {item.record!.presentFemales || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">--</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {hasRecord ? (
                          <span className={`font-bold ${item.record!.absentCount > 0 ? 'text-rose-600 font-black text-sm' : 'text-slate-400'}`}>
                            {item.record!.absentCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">--</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-medium text-amber-700">
                        {hasRecord ? item.record!.lateCount : '--'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-medium text-blue-700">
                        {hasRecord ? item.record!.excusedCount : '--'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {hasRecord ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs inline-block ${rateBadgeClass}`}>
                            {rate}%
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin registrar</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {hasRecord ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Recibido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {classBreakdown.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3.5 px-4" colSpan={2}>
                    TOTAL INSTITUCIONAL DEL DÍA
                  </td>
                  <td className="py-3.5 px-3 text-center text-sm">{totalEnrolled}</td>
                  <td className="py-3.5 px-3 text-center text-sm text-emerald-700">{totalPresent}</td>
                  <td className="py-3.5 px-3 text-center text-sm text-rose-700">{totalAbsent}</td>
                  <td className="py-3.5 px-3 text-center text-sm text-amber-700">{totalLate}</td>
                  <td className="py-3.5 px-3 text-center text-sm text-blue-700">{totalExcused}</td>
                  <td className="py-3.5 px-3 text-center text-sm">
                    <span className="px-2.5 py-1 bg-blue-900 text-white rounded-md text-xs">
                      {overallRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-[11px] text-slate-500">
                    {classesSubmittedCount} de {classBreakdown.length} recibidas
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>
              Certificación institucional para: <strong>{currentSession.userName || 'Dirección / Registro'}</strong>
            </span>
          </div>
          <span>República Dominicana · Ministerio de Educación (MINERD)</span>
        </div>
      </div>
    </div>
  );
};
