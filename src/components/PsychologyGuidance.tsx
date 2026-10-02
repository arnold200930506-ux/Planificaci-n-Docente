import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  MessageSquare, 
  Printer, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  FileText, 
  Filter, 
  X, 
  Send,
  Building2,
  Users,
  Eye,
  Sparkles,
  Phone,
  Bookmark
} from 'lucide-react';
import { 
  PsychologyCaseReport, 
  PsychologyCaseType, 
  PsychologyPriority, 
  PsychologyCaseStatus, 
  SchoolShift, 
  SchoolConfig,
  Teacher,
  Orientator
} from '../types/minerd';
import { openWhatsAppChat, formatDominicanPhoneNumber } from '../utils/whatsapp';
import { OrientatorsManagement } from './OrientatorsManagement';

interface PsychologyGuidanceProps {
  reports: PsychologyCaseReport[];
  schoolConfig: SchoolConfig;
  teachers: Teacher[];
  orientators?: Orientator[];
  onSaveReport: (report: PsychologyCaseReport) => void;
  onDeleteReport: (id: string) => void;
  onSaveOrientator?: (orientator: Orientator) => void;
  onDeleteOrientator?: (id: string) => void;
}

const CASE_TYPES: PsychologyCaseType[] = [
  'Conductual / Comportamiento',
  'Emocional / Psicológico',
  'Rendimiento Académico / Aprendizaje',
  'Convivencia Escolar / Disciplina',
  'Situación Familiar / Vulnerabilidad',
  'Asistencia / Ausentismo Frecuente',
  'Necesidades Específicas de Apoyo Educativo (NEAE)'
];

const PRIORITIES: PsychologyPriority[] = ['Normal', 'Media', 'Alta', 'Urgente'];

const CASE_STATUSES: PsychologyCaseStatus[] = [
  'Abierto',
  'En Acompañamiento',
  'Citación a Padres Realizada',
  'Resuelto / Cerrado',
  'Derivado a CAD / MINERD / CONANI'
];

const SHIFTS: SchoolShift[] = [
  'Tanda Matutina (8:00 AM - 12:00 PM)',
  'Tanda Vespertina (1:00 PM - 4:45 PM)',
  'Ambas Tandas (Doble Tanda)'
];

export const PsychologyGuidance: React.FC<PsychologyGuidanceProps> = ({
  reports,
  schoolConfig,
  teachers,
  orientators = [],
  onSaveReport,
  onDeleteReport,
  onSaveOrientator,
  onDeleteOrientator
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cases' | 'orientators'>('cases');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');

  // Case Modal (Create/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<PsychologyCaseReport | null>(null);

  // Print Referral Sheet Modal
  const [printingReport, setPrintingReport] = useState<PsychologyCaseReport | null>(null);

  // WhatsApp Citation Modal
  const [whatsappCitationModal, setWhatsappCitationModal] = useState<{
    isOpen: boolean;
    report: PsychologyCaseReport;
    message: string;
  } | null>(null);

  // Form states
  const [formStudentName, setFormStudentName] = useState('');
  const [formStudentRne, setFormStudentRne] = useState('');
  const [formAge, setFormAge] = useState<number>(9);
  const [formGrade, setFormGrade] = useState('4to Grado');
  const [formSection, setFormSection] = useState('A');
  const [formShift, setFormShift] = useState<SchoolShift>('Tanda Matutina (8:00 AM - 12:00 PM)');
  const [formReferringTeacher, setFormReferringTeacher] = useState(teachers[0]?.name || schoolConfig.teacherName);
  const [formCaseType, setFormCaseType] = useState<PsychologyCaseType>('Conductual / Comportamiento');
  const [formPriority, setFormPriority] = useState<PsychologyPriority>('Media');
  const [formIncidentDescription, setFormIncidentDescription] = useState('');
  const [formInterventionPlan, setFormInterventionPlan] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formCitationDate, setFormCitationDate] = useState('');
  const [formCitationTime, setFormCitationTime] = useState('09:00 AM');
  const [formCitationNotes, setFormCitationNotes] = useState('');
  const [formStatus, setFormStatus] = useState<PsychologyCaseStatus>('Abierto');
  const [formObservations, setFormObservations] = useState('');
  const [formReferringTeacherPhone, setFormReferringTeacherPhone] = useState('');
  const [formResolutionNotes, setFormResolutionNotes] = useState('');
  const [formTeacherRecommendations, setFormTeacherRecommendations] = useState('');
  
  // WhatsApp Resolution Alert Modal to Teacher
  const [whatsappResolutionModal, setWhatsappResolutionModal] = useState<{
    isOpen: boolean;
    report: PsychologyCaseReport;
    message: string;
    teacherPhone: string;
    teacherName: string;
  } | null>(null);

  const handleOpenNew = () => {
    setEditingReport(null);
    setFormStudentName('');
    setFormStudentRne(`EST-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormAge(10);
    setFormGrade('4to Grado');
    setFormSection('A');
    setFormShift('Tanda Matutina (8:00 AM - 12:00 PM)');
    setFormReferringTeacher(teachers[0]?.name || schoolConfig.teacherName);
    setFormCaseType('Conductual / Comportamiento');
    setFormPriority('Media');
    setFormIncidentDescription('');
    setFormInterventionPlan('');
    setFormParentName('');
    setFormParentPhone('809-555-0200');
    setFormCitationDate('');
    setFormCitationTime('09:00 AM');
    setFormCitationNotes('');
    setFormStatus('Abierto');
    setFormObservations('');
    setFormReferringTeacherPhone(teachers[0]?.phone || schoolConfig.teacherPhone || '');
    setFormResolutionNotes('');
    setFormTeacherRecommendations('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: PsychologyCaseReport) => {
    setEditingReport(r);
    setFormStudentName(r.studentName);
    setFormStudentRne(r.studentRne || '');
    setFormAge(r.age || 10);
    setFormGrade(r.grade);
    setFormSection(r.section);
    setFormShift(r.shift);
    setFormReferringTeacher(r.referringTeacher);
    setFormCaseType(r.caseType);
    setFormPriority(r.priority);
    setFormIncidentDescription(r.incidentDescription);
    setFormInterventionPlan(r.interventionPlan);
    setFormParentName(r.parentName);
    setFormParentPhone(r.parentPhone || '');
    setFormCitationDate(r.citationDate || '');
    setFormCitationTime(r.citationTime || '09:00 AM');
    setFormCitationNotes(r.citationNotes || '');
    setFormStatus(r.status);
    setFormObservations(r.observations || '');
    // Try to find teacher phone if not in report
    const matchedTeacher = teachers.find(t => t.name.toLowerCase() === (r.referringTeacher || '').toLowerCase());
    setFormReferringTeacherPhone(r.referringTeacherPhone || matchedTeacher?.phone || schoolConfig.teacherPhone || '');
    setFormResolutionNotes(r.resolutionNotes || '');
    setFormTeacherRecommendations(r.teacherRecommendations || '');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName.trim() || !formIncidentDescription.trim()) return;

    const reportToSave: PsychologyCaseReport = {
      id: editingReport ? editingReport.id : `psy-${Date.now()}`,
      caseCode: editingReport ? editingReport.caseCode : `OP-2025-${Math.floor(100 + Math.random() * 900)}`,
      date: editingReport ? editingReport.date : new Date().toISOString().split('T')[0],
      studentName: formStudentName.trim(),
      studentRne: formStudentRne.trim(),
      age: Number(formAge) || 10,
      grade: formGrade,
      section: formSection,
      shift: formShift,
      referringTeacher: formReferringTeacher,
      caseType: formCaseType,
      priority: formPriority,
      incidentDescription: formIncidentDescription.trim(),
      interventionPlan: formInterventionPlan.trim(),
      parentName: formParentName.trim() || 'Padre / Tutor Responsable',
      parentPhone: formParentPhone.trim(),
      citationDate: formCitationDate,
      citationTime: formCitationTime,
      citationNotes: formCitationNotes.trim(),
      orientatorName: schoolConfig.orientatorName || (orientators && orientators.length > 0 ? orientators[0].name : 'Departamento de Orientación y Psicología'),
      status: formStatus,
      observations: formObservations.trim(),
      referringTeacherPhone: formReferringTeacherPhone.trim(),
      resolutionNotes: formResolutionNotes.trim(),
      teacherRecommendations: formTeacherRecommendations.trim(),
      resolutionDate: (formStatus === 'Resuelto / Cerrado' || formResolutionNotes.trim()) ? (editingReport?.resolutionDate || new Date().toISOString().split('T')[0]) : undefined,
      resolutionSentToTeacher: editingReport?.resolutionSentToTeacher,
      createdAt: editingReport ? editingReport.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveReport(reportToSave);
    setIsModalOpen(false);

    // If case has resolution or recommendations, prompt orientator to send WhatsApp directly to teacher
    if (formStatus === 'Resuelto / Cerrado' || formTeacherRecommendations.trim() || formResolutionNotes.trim()) {
      handleOpenWhatsAppResolution(reportToSave);
    }
  };

  // WhatsApp Alert: Send Case Resolution & Pedagogical Guidelines to Referring Teacher
  const handleOpenWhatsAppResolution = (r: PsychologyCaseReport) => {
    const matchedTeacher = teachers.find(t => t.name.toLowerCase() === (r.referringTeacher || '').toLowerCase());
    const phoneToUse = r.referringTeacherPhone || matchedTeacher?.phone || schoolConfig.teacherPhone || '';
    const orientatorName = r.orientatorName || schoolConfig.orientatorName || 'Orientación y Psicología';

    const message = 
`🏛️ *${(schoolConfig.schoolName || 'CENTRO EDUCATIVO').toUpperCase()}*
📋 *INFORME DE RESOLUCIÓN - UNIDAD DE ORIENTACIÓN & PSICOLOGÍA*

Estimado/a docente *${r.referringTeacher || 'Maestro/a'}*:

Le notificamos que el caso remitido para el estudiante *${r.studentName}* (${r.grade} "${r.section}") con código *${r.caseCode}* ha sido concluido por este departamento.

📌 *Estado Final:* ${r.status}
🔍 *Síntesis de Intervención:* ${r.resolutionNotes || r.incidentDescription || 'Acompañamiento psicopedagógico completado.'}

🎯 *PAUTAS Y RECOMENDACIONES PARA EL AULA:*
${r.teacherRecommendations || r.interventionPlan || '1. Monitoreo cercano de participación en clase.\n2. Refuerzo afectivo y retroalimentación positiva.\n3. Reportar cualquier novedad al departamento.'}

✍️ *Atendido por:* ${orientatorName}
📅 *Fecha de Conclusión:* ${r.resolutionDate || new Date().toISOString().split('T')[0]}

_Agradecemos su compromiso pedagógico y labor docente._`;

    setWhatsappResolutionModal({
      isOpen: true,
      report: r,
      message,
      teacherPhone: phoneToUse,
      teacherName: r.referringTeacher || 'Docente de Grado'
    });
  };

  const handleOpenWhatsAppCitation = (r: PsychologyCaseReport) => {
    const rawTemplate = schoolConfig.whatsAppConfig?.psychologyCitationTemplate || 
      `🏛️ *${(schoolConfig.schoolName || 'CENTRO EDUCATIVO').toUpperCase()}*\n📋 *DEPARTAMENTO DE ORIENTACIÓN Y PSICOLOGÍA*\n\nEstimado/a padre/madre/tutor de *{{studentName}}*:\n\nLe invitamos cordialmente a un encuentro de acompañamiento escolar para tratar asuntos relacionados con el progreso y bienestar de su hijo/a (Curso: {{grade}} "{{section}}" - {{shift}}).\n\n📅 *Fecha de Cita:* {{citationDate}}\n⏰ *Hora:* {{citationTime}}\n📍 *Lugar:* Depto. de Orientación y Psicología\n✍️ *Atendido por:* {{orientatorName}}\n\nEsperamos contar con su puntual asistencia.`;

    const message = rawTemplate
      .replace(/{{studentName}}/g, r.studentName)
      .replace(/{{grade}}/g, r.grade)
      .replace(/{{section}}/g, r.section)
      .replace(/{{shift}}/g, r.shift)
      .replace(/{{citationDate}}/g, r.citationDate || 'A coordinar')
      .replace(/{{citationTime}}/g, r.citationTime || '09:00 AM')
      .replace(/{{orientatorName}}/g, r.orientatorName)
      .replace(/{{schoolName}}/g, schoolConfig.schoolName);

    setWhatsappCitationModal({
      isOpen: true,
      report: r,
      message
    });
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.caseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referringTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.incidentDescription.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedTypeFilter === 'all' || r.caseType === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === 'all' || r.status === selectedStatusFilter;
    const matchesShift = selectedShiftFilter === 'all' || r.shift === selectedShiftFilter;

    return matchesSearch && matchesType && matchesStatus && matchesShift;
  });

  // Count stats
  const totalCases = reports.length;
  const openCases = reports.filter(r => r.status === 'Abierto' || r.status === 'En Acompañamiento').length;
  const citationCases = reports.filter(r => r.status === 'Citación a Padres Realizada').length;
  const resolvedCases = reports.filter(r => r.status === 'Resuelto / Cerrado').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Subtab navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('cases')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'cases'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-purple-600" />
          <span>Casos y Expedientes Estudiantiles ({reports.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('orientators')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'orientators'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-rose-600" />
          <span>Equipo de Orientadores y Psicólogos ({orientators.length})</span>
        </button>
      </div>

      {activeSubTab === 'orientators' ? (
        <OrientatorsManagement
          orientators={orientators}
          schoolConfig={schoolConfig}
          onSaveOrientator={onSaveOrientator || (() => {})}
          onDeleteOrientator={onDeleteOrientator || (() => {})}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-purple-700/60 border border-purple-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-purple-100 shadow-xs">
                <HeartHandshake className="w-4 h-4 text-purple-300" />
                Unidad de Orientación y Psicología Escolar
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Acompañamiento Psicosocial & Seguimiento a Estudiantes
              </h1>
              <p className="text-purple-100/85 text-sm leading-relaxed">
                Gestión de casos conductuales, emocionales, académicos y familiares de la <strong>{schoolConfig.schoolName}</strong> (Doble Tanda: Matutina 8am-12pm y Vespertina 1pm-4:45pm). 
                Emita citaciones automáticas por WhatsApp a los padres y genere fichas de remisión oficiales del MINERD.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNew}
              className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-slate-950 px-6 py-3 rounded-xl font-extrabold text-sm transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nuevo Caso de Orientación
            </button>
          </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Casos</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{totalCases}</h3>
            <p className="text-[11px] text-slate-500">Expedientes registrados</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-amber-50/40">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">En Acompañamiento</p>
            <h3 className="text-3xl font-extrabold text-amber-600">{openCases}</h3>
            <p className="text-[11px] text-amber-600">Intervención activa</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-blue-50/40">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Citaciones a Padres</p>
            <h3 className="text-3xl font-extrabold text-blue-600">{citationCases}</h3>
            <p className="text-[11px] text-blue-600">Encuentros agendados</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Casos Resueltos</p>
            <h3 className="text-3xl font-extrabold text-emerald-600">{resolvedCases}</h3>
            <p className="text-[11px] text-emerald-600">Con metas cumplidas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por estudiante, RNE o código..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Todos los Tipos de Caso</option>
              {CASE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Todos los Estados</option>
              {CASE_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Todas las Tandas</option>
              {SHIFTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Código / Fecha</th>
                <th className="px-4 py-3.5">Estudiante (RNE)</th>
                <th className="px-4 py-3.5">Grado / Tanda</th>
                <th className="px-4 py-3.5">Tipo de Caso & Prioridad</th>
                <th className="px-4 py-3.5">Docente Referente</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No se encontraron casos con los filtros aplicados</p>
                    <p className="text-xs text-slate-400 mt-0.5">Registre una nueva ficha de orientación o limpie los filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {report.caseCode}
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{report.date}</p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900 text-sm">{report.studentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        RNE: {report.studentRne || 'N/D'} · {report.age ? `${report.age} años` : ''}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800">{report.grade} "{report.section}"</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate max-w-[160px]" title={report.shift}>
                        {report.shift.includes('Matutina') ? 'Tanda Matutina (8-12)' : (report.shift.includes('Vespertina') ? 'Tanda Vespertina (1-4:45)' : 'Doble Tanda')}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-block font-semibold text-slate-800 mb-1">
                        {report.caseType}
                      </span>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          report.priority === 'Urgente' || report.priority === 'Alta'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          Prioridad {report.priority}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-700 font-medium">
                      {report.referringTeacher}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        report.status === 'Resuelto / Cerrado'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : (report.status === 'Citación a Padres Realizada'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300')
                      }`}>
                        {report.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* WhatsApp Parent Citation Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppCitation(report)}
                          className="p-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded-lg transition-colors cursor-pointer"
                          title="Citar o Notificar a los Padres por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Referral Form Button */}
                        <button
                          type="button"
                          onClick={() => setPrintingReport(report)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Imprimir Ficha de Remisión MINERD"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(report)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar caso"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Está seguro de eliminar el expediente de ${report.studentName}?`)) {
                              onDeleteReport(report.id);
                            }
                          }}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar caso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT PSYCHOLOGY CASE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editingReport ? `Editar Expediente ${editingReport.caseCode}` : 'Nueva Ficha de Orientación y Psicología'}
                  </h3>
                  <p className="text-xs text-slate-500">Escuela Dr. José Francisco Peña Gómez (Doble Tanda)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-2">1. Datos Generales del Estudiante</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Estudiante *</label>
                    <input
                      type="text"
                      required
                      value={formStudentName}
                      onChange={(e) => setFormStudentName(e.target.value)}
                      placeholder="Ej. Justin Emmanuel Peralta Gómez"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">RNE (Registro Estudiantil)</label>
                    <input
                      type="text"
                      value={formStudentRne}
                      onChange={(e) => setFormStudentRne(e.target.value)}
                      placeholder="PGJE-140510-001"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Grado</label>
                    <select
                      value={formGrade}
                      onChange={(e) => setFormGrade(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Pre-Primario">Pre-Primario</option>
                      <option value="1ro Grado">1ro Grado</option>
                      <option value="2do Grado">2do Grado</option>
                      <option value="3ro Grado">3ro Grado</option>
                      <option value="4to Grado">4to Grado</option>
                      <option value="5to Grado">5to Grado</option>
                      <option value="6to Grado">6to Grado</option>
                      <option value="1er Año Secundaria">1er Año Secundaria</option>
                      <option value="2do Año Secundaria">2do Año Secundaria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sección</label>
                    <input
                      type="text"
                      value={formSection}
                      onChange={(e) => setFormSection(e.target.value)}
                      placeholder="A, B"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanda Institucional</label>
                    <select
                      value={formShift}
                      onChange={(e) => setFormShift(e.target.value as SchoolShift)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      {SHIFTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-2">2. Clasificación de la Remisión</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Docente que Refiere</label>
                    <select
                      value={formReferringTeacher}
                      onChange={(e) => setFormReferringTeacher(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.grades?.join(', ')})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Situación</label>
                    <select
                      value={formCaseType}
                      onChange={(e) => setFormCaseType(e.target.value as PsychologyCaseType)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      {CASE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nivel de Prioridad</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as PsychologyPriority)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Descripción del Motivo de Referencia / Conducta Observada *</label>
                <textarea
                  rows={3}
                  required
                  value={formIncidentDescription}
                  onChange={(e) => setFormIncidentDescription(e.target.value)}
                  placeholder="Detalle los hechos observados, frecuencia, impacto en el aula y contexto escolar..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl leading-relaxed outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Plan de Intervención / Acuerdos de Acompañamiento</label>
                <textarea
                  rows={3}
                  value={formInterventionPlan}
                  onChange={(e) => setFormInterventionPlan(e.target.value)}
                  placeholder="Acciones psicopedagógicas, tutorías de refuerzo, seguimiento en aula, adaptaciones..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl leading-relaxed outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-950 mb-2">3. Citación a Padres / Tutores</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre del Padre/Tutor</label>
                    <input
                      type="text"
                      value={formParentName}
                      onChange={(e) => setFormParentName(e.target.value)}
                      placeholder="Sra. Maritza Gómez"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp del Padre</label>
                    <input
                      type="text"
                      value={formParentPhone}
                      onChange={(e) => setFormParentPhone(e.target.value)}
                      placeholder="809-555-0233"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Citación</label>
                    <input
                      type="date"
                      value={formCitationDate}
                      onChange={(e) => setFormCitationDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hora de Cita</label>
                    <input
                      type="text"
                      value={formCitationTime}
                      onChange={(e) => setFormCitationTime(e.target.value)}
                      placeholder="09:30 AM"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado del Expediente</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PsychologyCaseStatus)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {CASE_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Observaciones / Seguimiento</label>
                  <input
                    type="text"
                    value={formObservations}
                    onChange={(e) => setFormObservations(e.target.value)}
                    placeholder="Acuerdos logrados o derivación externa..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* SECCIÓN ESPECIAL: RESOLUCIÓN Y ALERTA POR WHATSAPP AL DOCENTE */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-extrabold text-sm">Resolución y Pautas Pedagógicas para el Maestro/a</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Notificación por WhatsApp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">
                      WhatsApp del Maestro ({formReferringTeacher || 'Docente'})
                    </label>
                    <input
                      type="tel"
                      value={formReferringTeacherPhone}
                      onChange={(e) => setFormReferringTeacherPhone(e.target.value)}
                      placeholder="Ej: 809-555-0199"
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1">
                      Síntesis de Resolución del Caso
                    </label>
                    <input
                      type="text"
                      value={formResolutionNotes}
                      onChange={(e) => setFormResolutionNotes(e.target.value)}
                      placeholder="Ej: Caso resuelto satisfactoriamente con la madre y el estudiante..."
                      className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1">
                    🎯 Pautas y Recomendaciones Pedagógicas para Aplicar en el Aula
                  </label>
                  <textarea
                    rows={2}
                    value={formTeacherRecommendations}
                    onChange={(e) => setFormTeacherRecommendations(e.target.value)}
                    placeholder="Instrucciones concretas para el docente: ej. Ubicar en primera fila, reforzar estímulos positivos, pausas activas..."
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-[10px] text-emerald-800 mt-1">
                    💡 Al guardar con estado &quot;Resuelto / Cerrado&quot; o al completar este informe, se abrirá la vista para enviar el mensaje oficial de conclusión directamente al WhatsApp del maestro.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {editingReport ? 'Guardar Cambios' : 'Registrar Caso'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP RESOLUTION ALERT TO TEACHER */}
      {whatsappResolutionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-700">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    Enviar Informe Final al Maestro/a
                  </h4>
                  <p className="text-[11px] text-slate-500">Notificación directa por WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappResolutionModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">Docente Destinatario:</span>
                  <strong className="text-slate-800">{whatsappResolutionModal.teacherName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Estudiante:</span>
                  <strong className="text-slate-800">{whatsappResolutionModal.report.studentName}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de WhatsApp del Maestro/a
                </label>
                <input
                  type="tel"
                  value={whatsappResolutionModal.teacherPhone}
                  onChange={(e) => setWhatsappResolutionModal({ ...whatsappResolutionModal, teacherPhone: e.target.value })}
                  placeholder="809-555-0199"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensaje Oficial a Enviar (Editable)
                </label>
                <textarea
                  rows={9}
                  value={whatsappResolutionModal.message}
                  onChange={(e) => setWhatsappResolutionModal({ ...whatsappResolutionModal, message: e.target.value })}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWhatsappResolutionModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleaned = formatDominicanPhoneNumber(whatsappResolutionModal.teacherPhone);
                  if (!cleaned) {
                    alert('Por favor ingrese un número de teléfono válido para el maestro (ej: 809-555-0100).');
                    return;
                  }
                  // Mark as sent
                  const updatedReport: PsychologyCaseReport = {
                    ...whatsappResolutionModal.report,
                    referringTeacherPhone: whatsappResolutionModal.teacherPhone,
                    resolutionSentToTeacher: true,
                    updatedAt: new Date().toISOString()
                  };
                  onSaveReport(updatedReport);
                  openWhatsAppChat(cleaned, whatsappResolutionModal.message);
                  setWhatsappResolutionModal(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Abrir WhatsApp y Enviar al Maestro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP CITATION PREVIEW & SEND */}
      {whatsappCitationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-green-700">
                <MessageSquare className="w-5 h-5" />
                <h4 className="font-extrabold text-base text-slate-900">
                  Citación a Padres por WhatsApp
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappCitationModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <strong>Estudiante:</strong> {whatsappCitationModal.report.studentName} · <strong>Tutor:</strong> {whatsappCitationModal.report.parentName}
              </p>
              <div className="flex items-center gap-1.5 font-mono text-slate-600">
                <Phone className="w-3.5 h-3.5 text-green-600" />
                Número: <strong>{whatsappCitationModal.report.parentPhone || 'Sin número'}</strong>
              </div>

              <textarea
                rows={9}
                value={whatsappCitationModal.message}
                onChange={(e) => setWhatsappCitationModal({ ...whatsappCitationModal, message: e.target.value })}
                className="w-full p-3 font-mono text-[11px] leading-relaxed border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-green-50/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhatsappCitationModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppChat(whatsappCitationModal.report.parentPhone, whatsappCitationModal.message);
                  setWhatsappCitationModal(null);
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Abrir WhatsApp Web / App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT OFFICIAL REFERRAL SHEET (FICHA MINERD) */}
      {printingReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[95vh] overflow-y-auto">
            
            <div className="flex items-center justify-between no-print border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  Ficha Oficial de Remisión y Seguimiento Psicológico
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ficha
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingReport(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="border border-slate-900 p-8 space-y-6 text-xs text-slate-900 bg-white font-sans">
              
              {/* Header */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <p className="font-bold text-xs uppercase tracking-wider">República Dominicana</p>
                <p className="font-extrabold text-sm uppercase">Ministerio de Educación (MINERD)</p>
                <p className="font-semibold text-xs">{schoolConfig.regional} · {schoolConfig.district}</p>
                <h2 className="font-extrabold text-base text-slate-950 pt-1">{schoolConfig.schoolName.toUpperCase()}</h2>
                <p className="font-bold text-purple-900 text-xs tracking-wide">
                  DEPARTAMENTO DE ORIENTACIÓN Y PSICOLOGÍA ESCOLAR · FICHA DE SEGUIMIENTO
                </p>
              </div>

              {/* General Grid */}
              <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="p-2 bg-slate-100 font-bold w-1/4 border-r border-slate-900">Código de Caso:</td>
                    <td className="p-2 font-mono font-bold border-r border-slate-900">{printingReport.caseCode}</td>
                    <td className="p-2 bg-slate-100 font-bold w-1/6 border-r border-slate-900">Fecha de Apertura:</td>
                    <td className="p-2 font-mono">{printingReport.date}</td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Estudiante:</td>
                    <td className="p-2 font-bold text-slate-950 border-r border-slate-900">{printingReport.studentName}</td>
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">RNE / Edad:</td>
                    <td className="p-2 font-mono">{printingReport.studentRne || 'N/D'} ({printingReport.age} años)</td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Grado y Sección:</td>
                    <td className="p-2 border-r border-slate-900 font-semibold">{printingReport.grade} "{printingReport.section}"</td>
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Tanda Escolar:</td>
                    <td className="p-2">{printingReport.shift}</td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Docente Referente:</td>
                    <td className="p-2 border-r border-slate-900">{printingReport.referringTeacher}</td>
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Prioridad:</td>
                    <td className="p-2 font-bold">{printingReport.priority}</td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-900">Tipo de Caso:</td>
                    <td colSpan={3} className="p-2 font-bold">{printingReport.caseType}</td>
                  </tr>
                </tbody>
              </table>

              {/* Case Details */}
              <div className="space-y-3">
                <div className="border border-slate-900 p-3 rounded-xs space-y-1">
                  <h4 className="font-bold uppercase text-[11px] bg-slate-100 p-1.5 border-b border-slate-900 -m-3 mb-2">
                    1. Motivo de Referencia y Descripción de los Hechos
                  </h4>
                  <p className="whitespace-pre-line leading-relaxed text-[11px] pt-1">{printingReport.incidentDescription}</p>
                </div>

                <div className="border border-slate-900 p-3 rounded-xs space-y-1">
                  <h4 className="font-bold uppercase text-[11px] bg-slate-100 p-1.5 border-b border-slate-900 -m-3 mb-2">
                    2. Plan de Intervención Psicosocial y Acuerdos
                  </h4>
                  <p className="whitespace-pre-line leading-relaxed text-[11px] pt-1">{printingReport.interventionPlan || 'En proceso de estructuración.'}</p>
                </div>

                <div className="border border-slate-900 p-3 rounded-xs space-y-1">
                  <h4 className="font-bold uppercase text-[11px] bg-slate-100 p-1.5 border-b border-slate-900 -m-3 mb-2">
                    3. Seguimiento a Familiares / Citación
                  </h4>
                  <p className="text-[11px]"><span className="font-bold">Padre / Madre / Tutor:</span> {printingReport.parentName} ({printingReport.parentPhone || 'Sin teléfono'})</p>
                  <p className="text-[11px]"><span className="font-bold">Fecha y Hora de Citación:</span> {printingReport.citationDate || 'No requerida'} · {printingReport.citationTime}</p>
                  {printingReport.citationNotes && <p className="text-[11px] italic">Notas: {printingReport.citationNotes}</p>}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-10 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-[10px]">
                <div>
                  <div className="h-12 border-b border-slate-900 flex items-end justify-center pb-1">
                    <span className="font-mono text-slate-400">____________________</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{printingReport.orientatorName}</p>
                  <p className="text-slate-500 uppercase">Orientador(a) / Psicólogo(a)</p>
                </div>

                <div>
                  <div className="h-12 border-b border-slate-900 flex items-end justify-center pb-1">
                    <span className="font-mono text-slate-400">____________________</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{printingReport.referringTeacher}</p>
                  <p className="text-slate-500 uppercase">Docente Titular</p>
                </div>

                <div>
                  <div className="h-12 border-b border-slate-900 flex items-end justify-center pb-1">
                    <span className="font-mono text-slate-400">____________________</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{schoolConfig.principalName}</p>
                  <p className="text-slate-500 uppercase">Dirección del Centro</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      </>
      )}

    </div>
  );
};
