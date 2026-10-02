import React, { useState } from 'react';
import { 
  Printer, 
  Copy, 
  Check, 
  Download, 
  CalendarDays, 
  CalendarRange, 
  BookOpen,
  ArrowLeft,
  School,
  FileCheck
} from 'lucide-react';
import { 
  DailyPlan, 
  WeeklyPlan, 
  LearningUnit, 
  SchoolConfig,
  FundamentalCompetencyKey 
} from '../types/minerd';
import { FUNDAMENTAL_COMPETENCIES } from '../data/minerdCurriculum';

interface PrintableExporterProps {
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  learningUnits: LearningUnit[];
  schoolConfig: SchoolConfig;
  selectedType: 'daily' | 'weekly' | 'unit';
  selectedId: string;
  onSelectPlan: (type: 'daily' | 'weekly' | 'unit', id: string) => void;
  onBack: () => void;
}

export const PrintableExporter: React.FC<PrintableExporterProps> = ({
  dailyPlans,
  weeklyPlans,
  learningUnits,
  schoolConfig,
  selectedType,
  selectedId,
  onSelectPlan,
  onBack
}) => {
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const currentDaily = dailyPlans.find(p => p.id === selectedId) || dailyPlans[0];
  const currentWeekly = weeklyPlans.find(p => p.id === selectedId) || weeklyPlans[0];
  const currentUnit = learningUnits.find(u => u.id === selectedId) || learningUnits[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyRichText = () => {
    const printElement = document.getElementById('official-minerd-print-sheet');
    if (printElement) {
      const htmlContent = printElement.innerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([printElement.innerText], { type: 'text/plain' });
      
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob
          })
        ]).then(() => {
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2500);
        }).catch(err => {
          console.error('Error copying to clipboard', err);
          fallbackCopyText(printElement.innerText);
        });
      } else {
        fallbackCopyText(printElement.innerText);
      }
    }
  };

  const fallbackCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  const getCompetencyName = (key: FundamentalCompetencyKey) => {
    return FUNDAMENTAL_COMPETENCIES.find(c => c.key === key)?.name || key;
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto animate-fade-in">
      
      {/* Control Bar (Hidden on Print) */}
      <div className="no-print bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky top-28 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              Exportador Imprimible Oficial MINERD
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Formato institucional con encabezado MINERD y firmas de Dirección y Coordinación
            </p>
          </div>
        </div>

        {/* Format & Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => onSelectPlan('daily', dailyPlans[0]?.id || '')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'daily' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Diario</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectPlan('weekly', weeklyPlans[0]?.id || '')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'weekly' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 text-indigo-600" />
              <span>Semanal</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectPlan('unit', learningUnits[0]?.id || '')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedType === 'unit' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Unidad</span>
            </button>
          </div>

          {/* Select Specific Plan */}
          <select
            value={selectedId}
            onChange={(e) => onSelectPlan(selectedType, e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl max-w-[200px] truncate font-bold text-slate-800 cursor-pointer"
          >
            {selectedType === 'daily' && dailyPlans.map(p => (
              <option key={p.id} value={p.id}>{p.date} - {p.unitTheme}</option>
            ))}
            {selectedType === 'weekly' && weeklyPlans.map(p => (
              <option key={p.id} value={p.id}>Semana {p.weekNumber} - {p.unitTitle}</option>
            ))}
            {selectedType === 'unit' && learningUnits.map(u => (
              <option key={u.id} value={u.id}>{u.title}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCopyRichText}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copiar para pegar con formato en Word"
          >
            {copiedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copiedSuccess ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-indigo-950 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL MINERD PRINTABLE SHEET (STRICT COMPLIANCE TO DOMINICAN FORMAT) */}
      {/* ========================================================================= */}
      <div 
        id="official-minerd-print-sheet" 
        className="bg-white p-8 sm:p-12 rounded-xl border border-slate-300 shadow-md max-w-4xl mx-auto text-slate-900 font-sans print:border-none print:shadow-none print:p-0"
      >
        
        {/* Institutional Header with Coat of Arms Styling */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
          <div className="flex items-center justify-center gap-4 mb-2">
            
            {/* Left Heraldic Emblems */}
            <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center p-1 overflow-hidden shrink-0">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-slate-800" aria-hidden="true">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.13-2.67 7.97-6 9.04-3.33-1.07-6-4.91-6-9.04V6.43l6-2.25zM11 7v4h2V7h-2zm0 6v2h2v-2h-2z"/>
              </svg>
            </div>

            <div>
              <h2 className="text-xs font-bold tracking-widest text-slate-800 uppercase">
                REPÚBLICA DOMINICANA
              </h2>
              <h1 className="text-sm font-extrabold tracking-wider text-slate-950 uppercase">
                MINISTERIO DE EDUCACIÓN (MINERD)
              </h1>
              <p className="text-[11px] font-semibold text-slate-700">
                {schoolConfig.regional} · {schoolConfig.district}
              </p>
              <p className="text-sm font-bold text-blue-950 uppercase tracking-tight mt-0.5">
                {schoolConfig.schoolName}
              </p>
            </div>

            {/* Right School Custom Logo or MINERD Default Icon */}
            <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center p-1 overflow-hidden shrink-0 bg-white">
              {schoolConfig.logoUrl ? (
                <img 
                  src={schoolConfig.logoUrl} 
                  alt="Escudo Escuela" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <School className="w-7 h-7 text-slate-800" />
              )}
            </div>

          </div>

          <div className="inline-block bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1 rounded tracking-wider">
            {selectedType === 'daily' && 'ESQUEMA OFICIAL DE PLANIFICACIÓN DOCENTE DIARIA'}
            {selectedType === 'weekly' && 'MATRIZ OFICIAL DE PLANIFICACIÓN SEMANAL'}
            {selectedType === 'unit' && 'DISEÑO DE UNIDAD DE APRENDIZAJE'}
          </div>
        </div>

        {/* ======================================= */}
        {/* DOCUMENT TYPE 1: DAILY PLAN */}
        {/* ======================================= */}
        {selectedType === 'daily' && currentDaily && (
          <div className="space-y-4 text-xs">
            
            {/* General Info Grid Table */}
            <table className="w-full border-collapse border border-slate-900 text-left">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold w-1/4 border-r border-slate-900">Docente:</td>
                  <td className="p-2 border-r border-slate-900 font-bold text-slate-950">{currentDaily.teacherName || schoolConfig.teacherName}</td>
                  <td className="p-2 bg-slate-100 font-bold w-1/6 border-r border-slate-900">Fecha:</td>
                  <td className="p-2 font-mono font-bold">{currentDaily.date}</td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Grado y Sección:</td>
                  <td className="p-2 border-r border-slate-900">{currentDaily.grade} "{currentDaily.section}"</td>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Tanda:</td>
                  <td className="p-2">{schoolConfig.tanda}</td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Área Curricular:</td>
                  <td className="p-2 border-r border-slate-900 font-semibold">{currentDaily.area}</td>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Duración:</td>
                  <td className="p-2 font-mono font-bold">
                    {currentDaily.startDuration + currentDaily.developmentDuration + currentDaily.closeDuration} min
                  </td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Tema del Día:</td>
                  <td colSpan={3} className="p-2 font-bold text-slate-950">
                    {currentDaily.unitTheme}
                  </td>
                </tr>
                {currentDaily.attendance && (
                  <tr className="border-t border-slate-900 bg-slate-50">
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Asistencia del Día:</td>
                    <td colSpan={3} className="p-2 text-[11px] leading-tight font-medium">
                      <strong>Matrícula:</strong> {currentDaily.attendance.totalEnrolled} estudiantes · 
                      <strong className="ml-1.5 text-emerald-900">Presentes:</strong> {currentDaily.attendance.presentCount} ({currentDaily.attendance.attendanceRate}%) · 
                      <strong className="ml-1.5 text-rose-900">Ausentes:</strong> {currentDaily.attendance.absentCount} · 
                      <strong className="ml-1.5 text-amber-900">Tardanzas:</strong> {currentDaily.attendance.lateCount} · 
                      <strong className="ml-1.5 text-indigo-900">Excusas:</strong> {currentDaily.attendance.excusedCount}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pedagogical Intention Table */}
            <div className="border border-slate-900 rounded-xs overflow-hidden">
              <div className="bg-slate-100 p-2 font-bold uppercase border-b border-slate-900 text-[11px] text-slate-900">
                Intención Pedagógica del Día
              </div>
              <div className="p-3 text-xs leading-relaxed italic bg-white">
                {currentDaily.pedagogicalIntention}
              </div>
            </div>

            {/* Curricular Alignment: Competencies & Contents */}
            <table className="w-full border-collapse border border-slate-900 text-left">
              <tbody>
                <tr className="border-b border-slate-900 bg-slate-100">
                  <th className="p-2 font-bold text-[11px] border-r border-slate-900 w-1/2">
                    Competencias Fundamentales
                  </th>
                  <th className="p-2 font-bold text-[11px]">
                    Competencias Específicas
                  </th>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-2.5 border-r border-slate-900 align-top">
                    <ul className="list-disc list-inside space-y-1">
                      {currentDaily.fundamentalCompetencies?.map(k => (
                        <li key={k} className="font-medium text-slate-800">{getCompetencyName(k)}</li>
                      ))}
                    </ul>
                    {currentDaily.transversalAxis && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <span className="font-bold text-[10px] text-slate-700 uppercase">Eje Transversal:</span>
                        <p className="text-[11px] italic">{currentDaily.transversalAxis}</p>
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 align-top">
                    <ul className="list-disc list-inside space-y-1">
                      {currentDaily.specificCompetencies?.map((sc, i) => (
                        <li key={i} className="text-slate-800">{sc}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Contents & Indicators */}
            <table className="w-full border-collapse border border-slate-900 text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-[11px]">
                  <th className="p-2 border-r border-slate-900 w-1/3">Contenidos Conceptuales</th>
                  <th className="p-2 border-r border-slate-900 w-1/3">Contenidos Procedimentales</th>
                  <th className="p-2 w-1/3">Indicadores de Logro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="p-2 border-r border-slate-900 align-top">
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      {currentDaily.conceptualContents?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </td>
                  <td className="p-2 border-r border-slate-900 align-top">
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      {currentDaily.proceduralContents?.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </td>
                  <td className="p-2 align-top">
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      {currentDaily.achievementIndicators?.map((ind, i) => <li key={i}>{ind}</li>)}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* MOMENTOS DE LA CLASE (THE CORE OF MINERD PLANNING) */}
            <div className="border-2 border-slate-900 rounded-xs overflow-hidden">
              <div className="bg-slate-900 text-white p-2 font-bold uppercase text-center text-xs tracking-wider">
                Momentos de la Clase y Secuencia Didáctica
              </div>

              {/* INICIO */}
              <div className="border-b border-slate-900 p-3 bg-slate-50/50">
                <div className="flex items-center justify-between font-bold text-xs border-b border-slate-200 pb-1 mb-2">
                  <span className="text-slate-900 uppercase">1. Momento de Inicio (Exploración y Motivación)</span>
                  <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-[11px]">{currentDaily.startDuration} min</span>
                </div>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {currentDaily.startActivities || 'No especificado'}
                </p>
              </div>

              {/* DESARROLLO */}
              <div className="border-b border-slate-900 p-3 bg-white">
                <div className="flex items-center justify-between font-bold text-xs border-b border-slate-200 pb-1 mb-2">
                  <span className="text-slate-900 uppercase">2. Momento de Desarrollo (Construcción del Conocimiento)</span>
                  <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {currentDaily.developmentDuration} min · {currentDaily.studentGrouping}
                  </span>
                </div>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-800">
                  {currentDaily.developmentActivities || 'No especificado'}
                </p>
              </div>

              {/* CIERRE */}
              <div className="p-3 bg-slate-50/50">
                <div className="flex items-center justify-between font-bold text-xs border-b border-slate-200 pb-1 mb-2">
                  <span className="text-slate-900 uppercase">3. Momento de Cierre & Metacognición</span>
                  <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-[11px]">{currentDaily.closeDuration} min</span>
                </div>
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-800 mb-2">
                  {currentDaily.closeActivities || 'No especificado'}
                </p>
                {currentDaily.metacognitionQuestions && (
                  <div className="p-2 bg-white border border-slate-200 rounded text-[11px] italic">
                    <span className="font-bold not-italic">Preguntas de Metacognición:</span>
                    <p className="whitespace-pre-line">{currentDaily.metacognitionQuestions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Supplementary Information Grid */}
            <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold w-1/4 border-r border-slate-900">Recursos Didácticos:</td>
                  <td colSpan={3} className="p-2">{currentDaily.didacticResources?.join(', ') || 'Pizarra, Cuaderno del estudiante, Fascículo MINERD'}</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Evaluación:</td>
                  <td className="p-2 border-r border-slate-900">
                    Tipo: {currentDaily.evaluationTypes?.join(', ')} · Agente: {currentDaily.evaluationAgents?.join(', ')}
                  </td>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900 w-1/5">Instrumentos:</td>
                  <td className="p-2">{currentDaily.evaluationInstruments?.join(', ')}</td>
                </tr>
              </tbody>
            </table>

            {/* Attendance Record Section if available */}
            {currentDaily.attendance && (
              <div className="border border-slate-900 rounded-xs overflow-hidden mt-2">
                <div className="bg-slate-100 p-2 font-bold text-[11px] uppercase border-b border-slate-900 flex justify-between items-center">
                  <span>Control de Asistencia del Día (Registro MINERD)</span>
                  <span className="font-normal font-mono text-[10px]">
                    Total: {currentDaily.attendance.totalEnrolled} | Presentes: {currentDaily.attendance.presentCount} ({currentDaily.attendance.attendanceRate}%) | Ausentes: {currentDaily.attendance.absentCount}
                  </span>
                </div>
                <div className="p-2 text-[11px] grid grid-cols-4 gap-2 text-center bg-white border-b border-slate-200">
                  <div className="p-1 bg-emerald-50 border border-emerald-200 rounded">
                    <span className="text-[10px] text-emerald-700 block font-bold">Presentes</span>
                    <strong className="text-emerald-900 text-xs">{currentDaily.attendance.presentCount}</strong>
                  </div>
                  <div className="p-1 bg-rose-50 border border-rose-200 rounded">
                    <span className="text-[10px] text-rose-700 block font-bold">Ausentes</span>
                    <strong className="text-rose-900 text-xs">{currentDaily.attendance.absentCount}</strong>
                  </div>
                  <div className="p-1 bg-amber-50 border border-amber-200 rounded">
                    <span className="text-[10px] text-amber-700 block font-bold">Tardanzas</span>
                    <strong className="text-amber-900 text-xs">{currentDaily.attendance.lateCount}</strong>
                  </div>
                  <div className="p-1 bg-blue-50 border border-blue-200 rounded">
                    <span className="text-[10px] text-blue-700 block font-bold">Excusas</span>
                    <strong className="text-blue-900 text-xs">{currentDaily.attendance.excusedCount}</strong>
                  </div>
                </div>
                {currentDaily.attendance.records.some(r => r.status === 'absent') && (
                  <div className="p-2 bg-slate-50 text-[10px]">
                    <span className="font-bold text-slate-800">Estudiantes Ausentes: </span>
                    <span className="text-slate-600">
                      {currentDaily.attendance.records
                        .filter(r => r.status === 'absent')
                        .map(r => `${r.studentName}${r.notes ? ` (${r.notes})` : ''}`)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Attachments Section in Print View */}
            {currentDaily.attachments && currentDaily.attachments.length > 0 && (
              <div className="border border-slate-900 rounded-xs overflow-hidden mt-2">
                <div className="bg-slate-100 p-2 font-bold text-[11px] uppercase border-b border-slate-900 flex justify-between items-center">
                  <span>Recursos y Archivos Digitales Adjuntos ({currentDaily.attachments.length})</span>
                </div>
                <div className="p-2 bg-white text-[11px] space-y-1">
                  {currentDaily.attachments.map((att, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0">
                      <span className="font-semibold text-slate-800">📎 {att.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {att.url ? `Enlace: ${att.url}` : att.category || 'Archivo Adjunto'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================= */}
        {/* DOCUMENT TYPE 2: WEEKLY PLAN MATRIX */}
        {/* ======================================= */}
        {selectedType === 'weekly' && currentWeekly && (
          <div className="space-y-4 text-xs">
            
            <table className="w-full border-collapse border border-slate-900 text-left mb-3">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold w-1/4 border-r border-slate-900">Docente:</td>
                  <td className="p-2 border-r border-slate-900 font-bold text-slate-950">{currentWeekly.teacherName || schoolConfig.teacherName}</td>
                  <td className="p-2 bg-slate-100 font-bold w-1/6 border-r border-slate-900">Semana Nº:</td>
                  <td className="p-2 font-mono font-bold">{currentWeekly.weekNumber} ({currentWeekly.startDate} al {currentWeekly.endDate})</td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Grado y Sección:</td>
                  <td className="p-2 border-r border-slate-900">{currentWeekly.grade} "{currentWeekly.section}"</td>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Área Curricular:</td>
                  <td className="p-2 font-semibold">{currentWeekly.area}</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Unidad de Aprendizaje:</td>
                  <td colSpan={3} className="p-2 font-bold text-slate-950">{currentWeekly.unitTitle}</td>
                </tr>
              </tbody>
            </table>

            {/* Weekly Matrix Table */}
            <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <th className="p-2 border border-slate-900 w-24">Día</th>
                  <th className="p-2 border border-slate-900 w-40">Tema e Intención</th>
                  <th className="p-2 border border-slate-900">Inicio</th>
                  <th className="p-2 border border-slate-900">Desarrollo</th>
                  <th className="p-2 border border-slate-900">Cierre</th>
                  <th className="p-2 border border-slate-900 w-32">Recursos / Eval.</th>
                </tr>
              </thead>
              <tbody>
                {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const).map(day => {
                  const d = currentWeekly.days[day];
                  const dayNames: Record<string, string> = {
                    lunes: 'Lunes',
                    martes: 'Martes',
                    miercoles: 'Miércoles',
                    jueves: 'Jueves',
                    viernes: 'Viernes'
                  };
                  return (
                    <tr key={day} className="border-b border-slate-900">
                      <td className="p-2 font-bold bg-slate-100 border-r border-slate-900 align-top">
                        {dayNames[day]}
                      </td>
                      <td className="p-2 border-r border-slate-900 align-top space-y-1">
                        <p className="font-bold text-slate-900">{d.topic || '-'}</p>
                        <p className="italic text-[10px] text-slate-700">{d.pedagogicalIntention || '-'}</p>
                      </td>
                      <td className="p-2 border-r border-slate-900 align-top">{d.startActivity || '-'}</td>
                      <td className="p-2 border-r border-slate-900 align-top">{d.developmentActivity || '-'}</td>
                      <td className="p-2 border-r border-slate-900 align-top">{d.closeActivity || '-'}</td>
                      <td className="p-2 align-top text-[10px] space-y-1">
                        <p><span className="font-semibold">Rec:</span> {d.resources || '-'}</p>
                        <p><span className="font-semibold">Eval:</span> {d.evaluation || '-'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
        )}

        {/* ======================================= */}
        {/* DOCUMENT TYPE 3: LEARNING UNIT */}
        {/* ======================================= */}
        {selectedType === 'unit' && currentUnit && (
          <div className="space-y-4 text-xs">
            <table className="w-full border-collapse border border-slate-900 text-left">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold w-1/4 border-r border-slate-900">Título de la Unidad:</td>
                  <td className="p-2 font-bold border-r border-slate-900" colSpan={3}>{currentUnit.title}</td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Área y Grado:</td>
                  <td className="p-2 border-r border-slate-900">{currentUnit.area} · {currentUnit.grade}</td>
                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Duración:</td>
                  <td className="p-2 font-mono">{currentUnit.durationWeeks} semanas</td>
                </tr>
              </tbody>
            </table>

            {/* Situación de Aprendizaje */}
            <div className="border border-slate-900 rounded-xs p-3 space-y-2">
              <h3 className="font-bold text-xs uppercase border-b border-slate-900 pb-1">
                Situación de Aprendizaje (MINERD)
              </h3>
              <p><span className="font-bold">Punto de partida:</span> {currentUnit.learningSituation.startingPoint}</p>
              <p><span className="font-bold">Rol de los estudiantes:</span> {currentUnit.learningSituation.studentRole}</p>
              <p><span className="font-bold">Pregunta detonante / Reto:</span> {currentUnit.learningSituation.challengeQuestion}</p>
              <p><span className="font-bold">Producto final:</span> {currentUnit.learningSituation.finalProduct}</p>
            </div>
          </div>
        )}

        {/* OFFICIAL SIGNATURE BLOCK (MANDATORY MINERD REQUIREMENT) */}
        <div className="mt-12 pt-6 border-t-2 border-slate-900 avoid-break">
          <div className="grid grid-cols-3 gap-6 text-center text-[11px]">
            
            {/* Docente Titular */}
            <div className="space-y-1">
              <div className="h-16 border-b border-slate-900 flex items-end justify-center pb-1">
                <span className="font-mono text-[10px] text-slate-400">________________________</span>
              </div>
              <p className="font-bold text-slate-950 mt-1">{schoolConfig.teacherName}</p>
              <p className="text-[10px] text-slate-600 uppercase">Docente Titular</p>
            </div>

            {/* Coordinador Pedagógico */}
            <div className="space-y-1">
              <div className="h-16 border-b border-slate-900 flex items-end justify-center pb-1">
                <span className="font-mono text-[10px] text-slate-400">________________________</span>
              </div>
              <p className="font-bold text-slate-950 mt-1">{schoolConfig.coordinatorName}</p>
              <p className="text-[10px] text-slate-600 uppercase">Coordinación Pedagógica</p>
            </div>

            {/* Dirección del Centro y Sello */}
            <div className="space-y-1">
              <div className="h-16 border-b border-slate-900 flex items-end justify-center pb-1">
                <span className="font-mono text-[10px] text-slate-400">________________________</span>
              </div>
              <p className="font-bold text-slate-950 mt-1">{schoolConfig.principalName}</p>
              <p className="text-[10px] text-slate-600 uppercase">Dirección / Sello del Centro</p>
            </div>

          </div>

          <div className="text-center text-[9px] text-slate-500 mt-6 pt-2 border-t border-slate-200">
            Documento generado a través del Sistema de Planificación Curricular Institucional · Escuela Dr. José Francisco Peña Gómez · República Dominicana
          </div>
        </div>

      </div>

    </div>
  );
};
