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
  UserCheck,
  Award,
  BookmarkCheck
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

  // Filter records specifically for the chosen date
  const recordsForDate = useMemo(() => {
    return gradeAttendanceList.filter(rec => rec.date === selectedDate);
  }, [gradeAttendanceList, selectedDate]);

  // Build a consolidated matrix of all grades & sections (either from loaded students or presets)
  const classBreakdown = useMemo(() => {
    const classMap = new Map<string, {
      grade: string;
      section: string;
      shift: string;
      enrolledTotal: number;
      enrolledMales: number;
      enrolledFemales: number;
      record?: DailyGradeAttendanceSummary;
    }>();

    // 1. First populate based on students registered in the system
    allStudents.forEach(st => {
      const key = `${st.grade}__${st.section}__${st.shift || 'Matutina'}`;
      if (!classMap.has(key)) {
        classMap.set(key, {
          grade: st.grade,
          section: st.section,
          shift: st.shift || 'Matutina',
          enrolledTotal: 0,
          enrolledMales: 0,
          enrolledFemales: 0
        });
      }
      const item = classMap.get(key)!;
      item.enrolledTotal += 1;
      if (st.gender === 'M') item.enrolledMales += 1;
      else if (st.gender === 'F') item.enrolledFemales += 1;
    });

    // 2. Fallback: if no students registered yet in system, build default standard primary classrooms
    if (classMap.size === 0) {
      PRESET_GRADES.slice(1, 7).forEach(g => {
        ['A', 'B'].forEach(sec => {
          const key = `${g}__${sec}__Matutina`;
          classMap.set(key, {
            grade: g,
            section: sec,
            shift: 'Matutina',
            enrolledTotal: 25,
            enrolledMales: 13,
            enrolledFemales: 12
          });
        });
      });
    }

    // 3. Attach recorded attendance data for the day if it exists
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

  const totalPresentMales = useMemo(() => {
    return classBreakdown.reduce((acc, curr) => acc + (curr.record ? (curr.record.presentMales || 0) : 0), 0);
  }, [classBreakdown]);

  const totalPresentFemales = useMemo(() => {
    return classBreakdown.reduce((acc, curr) => acc + (curr.record ? (curr.record.presentFemales || 0) : 0), 0);
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
    const text = `🏛️ *REPORTE DIARIO DE ASISTENCIA - MINERD*
🏫 *Centro Educativo:* ${schoolConfig.schoolName}
📍 *Código SIGERD / Distrito:* ${schoolConfig.schoolCode || 'Centro Escolar'} • Dist. ${schoolConfig.district}
📅 *Fecha:* ${formattedDate}

📊 *RESUMEN INSTITUCIONAL:*
• Matrícula Total Registrada: *${totalEnrolled}*
• Total Estudiantes Presentes: *${totalPresent}* (${overallRate}%)
  ↳ Varones: ${totalPresentMales} | Hembras: ${totalPresentFemales}
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
}).join("\n")}

✍️ *Remitido por:* Coordinación de Registro & Dirección Escolar`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentSession = authService.getSession();

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. VISTA DE PANTALLA (INTERACTIVA - OCULTA AL IMPRIMIR CON no-print)     */}
      {/* ========================================================================= */}
      <div className="no-print space-y-6">
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
                onClick={handlePrint}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                title="Generar e imprimir Ficha Oficial MINERD"
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
                Padrón cruzado con los partes de asistencia remitidos por los docentes a través de la aplicación
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Reporte</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-4">Grado y Sección</th>
                  <th className="py-3 px-3">Tanda</th>
                  <th className="py-3 px-3 text-center">Matrícula</th>
                  <th className="py-3 px-3 text-center">Presentes (♂ / ♀)</th>
                  <th className="py-3 px-3 text-center">Ausentes</th>
                  <th className="py-3 px-3 text-center">Tardanzas</th>
                  <th className="py-3 px-3 text-center">Excusas</th>
                  <th className="py-3 px-3 text-center">% Asistencia</th>
                  <th className="py-3 px-4 text-center">Estado Reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No se encontraron grados ni secciones configuradas bajo los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  classBreakdown.map((item, idx) => {
                    const hasRecord = !!item.record;
                    const enrolled = hasRecord ? item.record!.totalEnrolled : item.enrolledTotal;
                    const rate = hasRecord ? item.record!.attendanceRate : 0;
                    
                    let rateBadgeClass = 'bg-slate-100 text-slate-500 font-medium';
                    if (hasRecord) {
                      if (rate >= 85) rateBadgeClass = 'bg-emerald-100 text-emerald-800 font-bold';
                      else if (rate >= 75) rateBadgeClass = 'bg-amber-100 text-amber-800 font-bold';
                      else rateBadgeClass = 'bg-rose-100 text-rose-800 font-bold';
                    }

                    return (
                      <tr 
                        key={`${item.grade}_${item.section}_${item.shift}_${idx}`}
                        className={`hover:bg-blue-50/40 transition-colors ${!hasRecord ? 'bg-amber-50/20' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-800">
                            {item.grade} <span className="text-blue-600 font-black">"{item.section}"</span>
                          </div>
                          {hasRecord && item.record!.teacherName && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              Docente: {item.record!.teacherName}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {item.shift}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                          {enrolled}
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
                    <td className="py-3.5 px-3 text-center text-sm text-emerald-700">
                      {totalPresent}
                      <span className="block text-[10px] text-emerald-600 font-bold">
                        (♂ {totalPresentMales} / ♀ {totalPresentFemales})
                      </span>
                    </td>
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

      {/* ========================================================================= */}
      {/* 2. FICHA OFICIAL PARA IMPRESIÓN (SÓLO VISIBLE EN PRINT - print-only)       */}
      {/* ========================================================================= */}
      <div className="print-only text-slate-900 bg-white font-sans p-2">
        {/* Encabezado Oficial MINERD */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
          <p className="text-xs font-bold tracking-widest text-slate-700 uppercase">República Dominicana</p>
          <h1 className="text-lg font-black tracking-tight uppercase text-slate-900 mt-0.5">
            Ministerio de Educación (MINERD)
          </h1>
          <p className="text-xs font-bold text-slate-800">
            Dirección General de Educación Primaria / Secundaria • Sistema SIGERD
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

        {/* Título del Instrumento */}
        <div className="bg-slate-100 border border-slate-900 py-2 px-3 text-center rounded-none mb-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
            PARTE DIARIO Y CONSOLIDADO OFICIAL DE ASISTENCIA ESCOLAR POR GRADO
          </h2>
          <p className="text-[11px] font-semibold text-slate-700 mt-0.5 capitalize">
            Fecha Oficial: <strong>{formattedDate}</strong> {selectedShiftFilter !== 'all' ? `• Tanda ${selectedShiftFilter}` : ''}
          </p>
        </div>

        {/* Resumen Estadístico Institucional */}
        <div className="grid grid-cols-5 border border-slate-900 divide-x divide-slate-900 text-center mb-4 text-xs">
          <div className="p-2">
            <span className="block text-[10px] font-bold uppercase text-slate-600">Matrícula General</span>
            <span className="text-base font-black text-slate-900">{totalEnrolled}</span>
            <span className="block text-[9px] text-slate-500">Estudiantes</span>
          </div>
          <div className="p-2">
            <span className="block text-[10px] font-bold uppercase text-slate-600">Total Presentes</span>
            <span className="text-base font-black text-slate-900">{totalPresent}</span>
            <span className="block text-[9px] text-slate-600 font-bold">♂ {totalPresentMales} | ♀ {totalPresentFemales}</span>
          </div>
          <div className="p-2">
            <span className="block text-[10px] font-bold uppercase text-slate-600">Total Ausentes</span>
            <span className="text-base font-black text-slate-900">{totalAbsent}</span>
            <span className="block text-[9px] text-slate-500">Inasistencias</span>
          </div>
          <div className="p-2">
            <span className="block text-[10px] font-bold uppercase text-slate-600">Tardanzas / Excusas</span>
            <span className="text-base font-black text-slate-900">{totalLate} / {totalExcused}</span>
            <span className="block text-[9px] text-slate-500">Justificadas</span>
          </div>
          <div className="p-2 bg-slate-50">
            <span className="block text-[10px] font-bold uppercase text-slate-600">% Global Asistencia</span>
            <span className="text-base font-black text-slate-900">{overallRate}%</span>
            <span className="block text-[9px] text-slate-700 font-bold">
              {classesSubmittedCount}/{classBreakdown.length} Secciones
            </span>
          </div>
        </div>

        {/* Sábana de Asistencia Oficial por Grado */}
        <table className="w-full text-left text-[11px] border-collapse border border-slate-900 mb-6">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-black uppercase text-[10px] border-b border-slate-900">
              <th className="py-2 px-2 border-r border-slate-900 text-center w-8">No.</th>
              <th className="py-2 px-2 border-r border-slate-900">Grado y Sección</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">Tanda</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">Docente a Cargo</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">Matrícula</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">Presentes (M/F)</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">Ausentes</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">Tard.</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">Exc.</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center">% Asist.</th>
              <th className="py-2 px-2 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-400">
            {classBreakdown.map((item, idx) => {
              const hasRecord = !!item.record;
              const enrolled = hasRecord ? item.record!.totalEnrolled : item.enrolledTotal;
              const rate = hasRecord ? item.record!.attendanceRate : 0;

              return (
                <tr key={`print_${item.grade}_${item.section}_${idx}`} className="avoid-break">
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold">{idx + 1}</td>
                  <td className="py-1.5 px-2 border-r border-slate-400 font-bold">
                    {item.grade} <span className="font-black">"{item.section}"</span>
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center text-[10px]">
                    {item.shift.includes('Vespertina') ? 'Vesp.' : 'Mat.'}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-[10px]">
                    {hasRecord && item.record!.teacherName ? item.record!.teacherName : '—'}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold">
                    {enrolled}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold">
                    {hasRecord ? `${item.record!.presentCount} (${item.record!.presentMales || 0}/${item.record!.presentFemales || 0})` : '—'}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold">
                    {hasRecord ? item.record!.absentCount : '—'}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center">
                    {hasRecord ? item.record!.lateCount : '—'}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center">
                    {hasRecord ? item.record!.excusedCount : '—'}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-400 text-center font-bold">
                    {hasRecord ? `${rate}%` : '0%'}
                  </td>
                  <td className="py-1.5 px-2 text-center text-[10px] font-semibold">
                    {hasRecord ? 'Entregado' : 'Pendiente'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-900 text-[11px]">
              <td className="py-2 px-2 border-r border-slate-900 text-center" colSpan={4}>
                TOTAL CONSOLIDADO DEL CENTRO EDUCATIVO
              </td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-black">{totalEnrolled}</td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-black">
                {totalPresent} ({totalPresentMales}/{totalPresentFemales})
              </td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-black">{totalAbsent}</td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-black">{totalLate}</td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-black">{totalExcused}</td>
              <td className="py-2 px-2 border-r border-slate-900 text-center font-black">{overallRate}%</td>
              <td className="py-2 px-2 text-center text-[10px] font-bold">
                {classesSubmittedCount}/{classBreakdown.length}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Firmas de Certificación Oficial */}
        <div className="avoid-break pt-8 mt-6 border-t border-slate-400">
          <div className="grid grid-cols-3 gap-6 text-center">
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
              <p className="text-[11px] font-black uppercase text-slate-900">Encargado/a de Registro & SIGERD</p>
              <p className="text-[10px] text-slate-600 font-medium">Control Escolar y Asistencia</p>
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
            Documento Oficial generado automáticamente por el Sistema de Planificación Curricular y Gestión Escolar MINERD • Escuela Dr. José Francisco Peña Gómez (Distrito 12-01)
          </div>
        </div>
      </div>
    </div>
  );
};
