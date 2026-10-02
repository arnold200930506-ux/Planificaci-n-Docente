import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Search, 
  Filter, 
  MessageSquare, 
  Eye, 
  Calendar, 
  BookOpen, 
  UserCheck, 
  AlertCircle, 
  Check, 
  X, 
  ChevronRight, 
  Printer,
  Users, 
  GraduationCap, 
  Send,
  Building2,
  Phone,
  Layers,
  Sparkles,
  ExternalLink,
  Paperclip,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { 
  DailyPlan, 
  WeeklyPlan, 
  LearningUnit, 
  SchoolConfig, 
  Teacher, 
  ReviewStatus 
} from '../types/minerd';
import { authService } from '../services/authService';
import { GradeAttendanceConsultation } from './GradeAttendanceConsultation';
import { 
  generateWhatsAppMessage, 
  openWhatsAppChat,
  formatDominicanPhoneNumber 
} from '../utils/whatsapp';

interface ManagementDashboardProps {
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  learningUnits: LearningUnit[];
  teachers: Teacher[];
  schoolConfig: SchoolConfig;
  onUpdateDailyReview: (planId: string, status: ReviewStatus, feedback?: string) => void;
  onUpdateWeeklyReview: (planId: string, status: ReviewStatus, feedback?: string) => void;
  onUpdateUnitReview: (planId: string, status: ReviewStatus, feedback?: string) => void;
  onViewPlanToPrint: (type: 'daily' | 'weekly' | 'unit', id: string) => void;
}

export const ManagementDashboard: React.FC<ManagementDashboardProps> = ({
  dailyPlans,
  weeklyPlans,
  learningUnits,
  teachers,
  schoolConfig,
  onUpdateDailyReview,
  onUpdateWeeklyReview,
  onUpdateUnitReview,
  onViewPlanToPrint
}) => {
  const isRegCoordinator = authService.isRegistrationCoordinator();
  const [activeSupervisionTab, setActiveSupervisionTab] = useState<'plans' | 'attendance'>(() => {
    // If coordinator of registro logs in, default directly to attendance tab
    const s = authService.getSession();
    if (s.role === 'coordinator' && isRegCoordinator) return 'attendance';
    return 'plans';
  });
  const [selectedPlanType, setSelectedPlanType] = useState<'daily' | 'weekly' | 'unit'>('daily');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');

  // Inspection / Feedback Modal state
  const [inspectingPlan, setInspectingPlan] = useState<{
    type: 'daily' | 'weekly' | 'unit';
    plan: DailyPlan | WeeklyPlan | LearningUnit;
  } | null>(null);

  // Return with feedback modal
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'daily' | 'weekly' | 'unit';
    planId: string;
    planTitle: string;
    teacherName: string;
    teacherPhone?: string;
    feedbackText: string;
    targetStatus: ReviewStatus;
  } | null>(null);

  // Quick WhatsApp Preview Modal
  const [whatsappPreview, setWhatsappPreview] = useState<{
    isOpen: boolean;
    phone: string;
    message: string;
    teacherName: string;
  } | null>(null);

  // Stats calculation
  const totalDaily = dailyPlans.length;
  const pendingDaily = dailyPlans.filter(p => p.reviewStatus === 'pending' || (!p.reviewStatus && p.status === 'completed')).length;
  const approvedDaily = dailyPlans.filter(p => p.reviewStatus === 'approved').length;
  const returnedDaily = dailyPlans.filter(p => p.reviewStatus === 'returned').length;

  const totalWeekly = weeklyPlans.length;
  const pendingWeekly = weeklyPlans.filter(p => p.reviewStatus === 'pending' || (!p.reviewStatus && p.status === 'completed')).length;
  const approvedWeekly = weeklyPlans.filter(p => p.reviewStatus === 'approved').length;
  const returnedWeekly = weeklyPlans.filter(p => p.reviewStatus === 'returned').length;

  // Filter plans based on selection
  const getFilteredPlans = () => {
    let list: Array<{ type: 'daily' | 'weekly' | 'unit'; data: any }> = [];

    if (selectedPlanType === 'daily') {
      list = dailyPlans.map(p => ({ type: 'daily', data: p }));
    } else if (selectedPlanType === 'weekly') {
      list = weeklyPlans.map(p => ({ type: 'weekly', data: p }));
    } else {
      list = learningUnits.map(p => ({ type: 'unit', data: p }));
    }

    return list.filter(item => {
      const p = item.data;
      const status = p.reviewStatus || 'pending';

      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesTeacher = selectedTeacherFilter === 'all' || p.teacherName === selectedTeacherFilter || p.teacherId === selectedTeacherFilter;
      
      const search = searchQuery.toLowerCase();
      const matchesSearch = 
        (p.title || '').toLowerCase().includes(search) ||
        (p.area || '').toLowerCase().includes(search) ||
        (p.grade || '').toLowerCase().includes(search) ||
        (p.teacherName || '').toLowerCase().includes(search);

      return matchesStatus && matchesTeacher && matchesSearch;
    });
  };

  const filteredItems = getFilteredPlans();

  // Handle Quick Status Change
  const handleQuickStatusChange = (
    type: 'daily' | 'weekly' | 'unit', 
    plan: any, 
    newStatus: ReviewStatus
  ) => {
    if (newStatus === 'returned') {
      // Open feedback modal for return
      setFeedbackModal({
        isOpen: true,
        type,
        planId: plan.id,
        planTitle: plan.title,
        teacherName: plan.teacherName || schoolConfig.teacherName,
        teacherPhone: plan.teacherPhone || schoolConfig.teacherPhone,
        feedbackText: plan.reviewFeedback || '',
        targetStatus: 'returned'
      });
      return;
    }

    // Direct approve or set pending
    if (type === 'daily') {
      onUpdateDailyReview(plan.id, newStatus);
    } else if (type === 'weekly') {
      onUpdateWeeklyReview(plan.id, newStatus);
    } else {
      onUpdateUnitReview(plan.id, newStatus);
    }

    // Auto trigger WhatsApp preview if approved
    if (newStatus === 'approved') {
      const planTypeName = type === 'daily' ? 'Planificación Diaria' : (type === 'weekly' ? 'Planificación Semanal' : 'Unidad de Aprendizaje');
      const teacherPhone = plan.teacherPhone || teachers.find(t => t.name === plan.teacherName)?.phone || schoolConfig.teacherPhone;
      
      const msg = generateWhatsAppMessage({
        teacherName: plan.teacherName || schoolConfig.teacherName,
        teacherPhone,
        reviewerName: schoolConfig.coordinatorName || schoolConfig.principalName,
        reviewerRole: 'Coordinador/a Pedagógico/a',
        schoolName: schoolConfig.schoolName,
        planTitle: plan.title,
        planType: planTypeName,
        grade: plan.grade || '',
        section: plan.section || 'A',
        area: plan.area || '',
        dateOrWeek: plan.date || `Semana ${plan.weekNumber || ''}`,
        status: 'approved',
        feedback: plan.reviewFeedback
      });

      setWhatsappPreview({
        isOpen: true,
        phone: teacherPhone || '',
        message: msg,
        teacherName: plan.teacherName || schoolConfig.teacherName
      });
    }
  };

  const handleConfirmReturnWithFeedback = () => {
    if (!feedbackModal) return;
    const { type, planId, feedbackText, targetStatus, teacherName, teacherPhone, planTitle } = feedbackModal;

    if (type === 'daily') {
      onUpdateDailyReview(planId, targetStatus, feedbackText);
    } else if (type === 'weekly') {
      onUpdateWeeklyReview(planId, targetStatus, feedbackText);
    } else {
      onUpdateUnitReview(planId, targetStatus, feedbackText);
    }

    // Prepare WhatsApp Message for Return
    const planTypeName = type === 'daily' ? 'Planificación Diaria' : (type === 'weekly' ? 'Planificación Semanal' : 'Unidad de Aprendizaje');
    const msg = generateWhatsAppMessage({
      teacherName,
      teacherPhone,
      reviewerName: schoolConfig.coordinatorName || schoolConfig.principalName,
      reviewerRole: 'Coordinador/a Pedagógico/a',
      schoolName: schoolConfig.schoolName,
      planTitle,
      planType: planTypeName,
      grade: '',
      section: '',
      area: '',
      dateOrWeek: new Date().toLocaleDateString('es-DO'),
      status: 'returned',
      feedback: feedbackText
    });

    setFeedbackModal(null);

    setWhatsappPreview({
      isOpen: true,
      phone: teacherPhone || '',
      message: msg,
      teacherName
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Navigation Sub-Tabs: Validación Curricular vs Consulta de Asistencia por Grado */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSupervisionTab('plans')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeSupervisionTab === 'plans'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-700 hover:text-blue-900 hover:bg-slate-300/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Revisión de Planificaciones Docentes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSupervisionTab('attendance')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeSupervisionTab === 'attendance'
              ? 'bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md border border-blue-400/40'
              : 'text-slate-700 hover:text-indigo-900 hover:bg-slate-300/60'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Asistencia por Grado (Registro & Dirección)</span>
          <span className="text-[10px] font-bold bg-amber-400/20 text-amber-700 px-2 py-0.5 rounded-full border border-amber-400/30">
            Exclusivo
          </span>
        </button>
      </div>

      {activeSupervisionTab === 'attendance' ? (
        <GradeAttendanceConsultation schoolConfig={schoolConfig} />
      ) : (
        <>
      {/* Institutional Hero for Management */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-700/60 border border-blue-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-blue-100 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            Módulo Directivo & Acompañamiento Pedagógico
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Panel de Supervisión y Validación Curricular
          </h1>
          <p className="text-blue-100/85 text-sm sm:text-base leading-relaxed">
            Plataforma para el Director/a y los Coordinadores Pedagógicos de la <strong>{schoolConfig.schoolName}</strong>. 
            Revise los momentos de la clase, apruebe o devuelva planificaciones con observaciones y envíe avisos instantáneos vía WhatsApp.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200">
            <span className="flex items-center gap-1.5 bg-blue-950/70 px-3 py-1.5 rounded-lg border border-blue-800/60">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Coordinador: <strong>{schoolConfig.coordinatorName}</strong>
            </span>
            <span className="flex items-center gap-1.5 bg-blue-950/70 px-3 py-1.5 rounded-lg border border-blue-800/60">
              <Building2 className="w-4 h-4 text-blue-400" />
              Director/a: <strong>{schoolConfig.principalName}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Planes Diarios</p>
            <h3 className="text-3xl font-extrabold text-slate-900">{totalDaily}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Registrados en el sistema</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-amber-50/50">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pendientes de Revisión</p>
            <h3 className="text-3xl font-extrabold text-amber-600">{pendingDaily + pendingWeekly}</h3>
            <p className="text-[11px] text-amber-600 font-medium">Requieren acompañamiento</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/50">
          <div className="space-y-1">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Aprobadas</p>
            <h3 className="text-3xl font-extrabold text-emerald-600">{approvedDaily + approvedWeekly}</h3>
            <p className="text-[11px] text-emerald-600 font-medium">Listas para impartir</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-rose-50/50">
          <div className="space-y-1">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Devueltas / Ajustes</p>
            <h3 className="text-3xl font-extrabold text-rose-600">{returnedDaily + returnedWeekly}</h3>
            <p className="text-[11px] text-rose-600 font-medium">Con observaciones</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Supervision Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-6 p-6">
        
        {/* Navigation Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          
          {/* Plan Type Selector */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedPlanType('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedPlanType === 'daily'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Planes Diarios ({dailyPlans.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlanType('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedPlanType === 'weekly'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              Planes Semanales ({weeklyPlans.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlanType('unit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedPlanType === 'unit'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Unidades ({learningUnits.length})
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aprobadas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('returned')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'returned'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Devueltas
            </button>
          </div>

        </div>

        {/* Secondary Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tema, docente, grado o área curricular..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Todos los Docentes</option>
              {teachers.map(t => (
                <option key={t.id} value={t.name}>{t.name} ({t.areas?.join(', ')})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Plans List Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5">Docente / Grado</th>
                  <th className="px-4 py-3.5">Título / Tema Pedagógico</th>
                  <th className="px-4 py-3.5">Área Curricular</th>
                  <th className="px-4 py-3.5">Fecha / Semana</th>
                  <th className="px-4 py-3.5 text-center">Acciones de Supervisión</th>
                  <th className="px-4 py-3.5 text-right">Aviso WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">No se encontraron planificaciones con este criterio</p>
                      <p className="text-xs text-slate-400 mt-0.5">Ajuste los filtros de búsqueda o seleccione otro estado.</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(({ type, data }) => {
                    const status: ReviewStatus = data.reviewStatus || 'pending';
                    const teacherName = data.teacherName || schoolConfig.teacherName;
                    const teacherPhone = data.teacherPhone || teachers.find(t => t.name === teacherName)?.phone || schoolConfig.teacherPhone;

                    return (
                      <tr key={data.id} className="hover:bg-slate-50 transition-colors">
                        
                        {/* Status Badge */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aprobada
                            </span>
                          )}
                          {status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendiente
                            </span>
                          )}
                          {status === 'returned' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Con Ajustes
                            </span>
                          )}
                          {status === 'draft' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              Borrador
                            </span>
                          )}
                        </td>

                        {/* Teacher & Grade */}
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{teacherName}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {data.grade} "{data.section || 'A'}"
                          </p>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-4 max-w-xs">
                          <p className="font-bold text-slate-900 truncate" title={data.title}>
                            {data.title}
                          </p>
                          {data.reviewFeedback && (
                            <p className="text-[11px] text-rose-700 italic truncate mt-0.5" title={data.reviewFeedback}>
                              Obs: {data.reviewFeedback}
                            </p>
                          )}
                        </td>

                        {/* Area */}
                        <td className="px-4 py-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                            {data.area}
                          </span>
                        </td>

                        {/* Date / Week */}
                        <td className="px-4 py-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {data.date ? data.date : `Semana ${data.weekNumber || ''}`}
                        </td>

                        {/* Supervisor Actions (Approve, Return, Pending, View) */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Inspect Button */}
                            <button
                              type="button"
                              onClick={() => setInspectingPlan({ type, plan: data })}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Ver detalles completos del plan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Print/Export Button */}
                            <button
                              type="button"
                              onClick={() => onViewPlanToPrint(type, data.id)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Ver vista formal de impresión"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <div className="w-px h-5 bg-slate-200 mx-1" />

                            {/* Button: APROBAR */}
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(type, data, 'approved')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                status === 'approved'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300'
                              }`}
                              title="Aprobar planificación"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Aprobar
                            </button>

                            {/* Button: DEVOLVER */}
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(type, data, 'returned')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                                status === 'returned'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300'
                              }`}
                              title="Devolver con observaciones pedagógicas"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Devolver
                            </button>

                            {/* Button: PENDIENTE */}
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(type, data, 'pending')}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                status === 'pending'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                              }`}
                              title="Marcar como pendiente"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                        {/* WhatsApp Button */}
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const planTypeName = type === 'daily' ? 'Planificación Diaria' : (type === 'weekly' ? 'Planificación Semanal' : 'Unidad de Aprendizaje');
                              const msg = generateWhatsAppMessage({
                                teacherName,
                                teacherPhone,
                                reviewerName: schoolConfig.coordinatorName || schoolConfig.principalName,
                                reviewerRole: 'Coordinador/a Pedagógico/a',
                                schoolName: schoolConfig.schoolName,
                                planTitle: data.title,
                                planType: planTypeName,
                                grade: data.grade || '',
                                section: data.section || 'A',
                                area: data.area || '',
                                dateOrWeek: data.date || `Semana ${data.weekNumber || ''}`,
                                status: status === 'approved' ? 'approved' : (status === 'returned' ? 'returned' : 'pending'),
                                feedback: data.reviewFeedback
                              });

                              setWhatsappPreview({
                                isOpen: true,
                                phone: teacherPhone || '',
                                message: msg,
                                teacherName
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Avisar WhatsApp
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      </>
      )}

      {/* MODAL: RETURN WITH FEEDBACK */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Devolver Planificación para Ajustes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Docente:</strong> {feedbackModal.teacherName} · <strong>Plan:</strong> {feedbackModal.planTitle}
              </p>
              <p className="text-slate-500">
                Ingrese las observaciones curriculares puntuales que el docente debe ajustar (ejemplo: momentos de la clase, instrumentos de evaluación, recursos):
              </p>
            </div>

            <textarea
              rows={4}
              value={feedbackModal.feedbackText}
              onChange={(e) => setFeedbackModal({ ...feedbackModal, feedbackText: e.target.value })}
              placeholder="Ej. Estimado docente: Favor extender las actividades del momento de desarrollo y especificar el tipo de lista de cotejo a utilizar."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFeedbackModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnWithFeedback}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Registrar Devolución y Enviar Aviso
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP MESSAGE PREVIEW & SEND */}
      {whatsappPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-green-700">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Notificación Formal por WhatsApp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappPreview(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Destinatario: <strong>{whatsappPreview.teacherName}</strong></span>
                <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {whatsappPreview.phone || 'Sin número registrado'}
                </span>
              </div>

              <label className="block text-xs font-bold text-slate-700">Mensaje generado:</label>
              <textarea
                rows={10}
                value={whatsappPreview.message}
                onChange={(e) => setWhatsappPreview({ ...whatsappPreview, message: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-xl font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-green-500 outline-none bg-green-50/20 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWhatsappPreview(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppChat(whatsappPreview.phone, whatsappPreview.message);
                  setWhatsappPreview(null);
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg hover:shadow-green-500/25 flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir WhatsApp Web / Móvil
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: INSPECT PLAN DETAILS */}
      {inspectingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {inspectingPlan.type === 'daily' ? 'Plan Diario MINERD' : (inspectingPlan.type === 'weekly' ? 'Plan Semanal' : 'Unidad de Aprendizaje')}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {inspectingPlan.plan.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPlan(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plan Content Viewer */}
            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Docente:</span>
                  <span className="font-bold text-slate-900">{inspectingPlan.plan.teacherName || schoolConfig.teacherName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Área:</span>
                  <span className="font-bold text-slate-900">{inspectingPlan.plan.area}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Grado:</span>
                  <span className="font-bold text-slate-900">{inspectingPlan.plan.grade} "{(inspectingPlan.plan as any).section || 'A'}"</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Estado:</span>
                  <span className="font-bold text-blue-800 uppercase">{inspectingPlan.plan.reviewStatus || 'Pendiente'}</span>
                </div>
              </div>

              {/* Specific for Daily Plan */}
              {inspectingPlan.type === 'daily' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-1">🎯 Intención Pedagógica del Día:</span>
                    <p className="text-slate-800 leading-relaxed">{(inspectingPlan.plan as DailyPlan).pedagogicalIntention}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">1. Inicio ({(inspectingPlan.plan as DailyPlan).startDuration} min)</span>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{(inspectingPlan.plan as DailyPlan).startActivities}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">2. Desarrollo ({(inspectingPlan.plan as DailyPlan).developmentDuration} min)</span>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{(inspectingPlan.plan as DailyPlan).developmentActivities}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">3. Cierre ({(inspectingPlan.plan as DailyPlan).closeDuration} min)</span>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{(inspectingPlan.plan as DailyPlan).closeActivities}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Recursos Didácticos:</span>
                    <p className="text-slate-700">{(inspectingPlan.plan as DailyPlan).didacticResources?.join(', ') || 'Pizarra, Marcadores'}</p>
                  </div>
                </div>
              )}

              {/* Attachments Section in Inspection Modal */}
              {inspectingPlan.plan.attachments && inspectingPlan.plan.attachments.length > 0 && (
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      Archivos y Planificaciones Previas Adjuntas ({inspectingPlan.plan.attachments.length}):
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                      Sujeto a Evaluación
                    </span>
                  </div>
                  <div className="space-y-2">
                    {inspectingPlan.plan.attachments.map((att, i) => {
                      const isUrl = Boolean(att.url);
                      const lowerName = (att.name || '').toLowerCase();
                      let badge = 'DOC';
                      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (isUrl) {
                        badge = 'LINK';
                        badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                      } else if (lowerName.endsWith('.pdf')) {
                        badge = 'PDF';
                        badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                      } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
                        badge = 'WORD';
                        badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
                        badge = 'EXCEL';
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
                        badge = 'IMG';
                        badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                      }

                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-indigo-100 text-xs shadow-2xs gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border ${badgeColor} shrink-0`}>
                              {badge}
                            </span>
                            <span className="font-bold text-slate-900 truncate max-w-sm">{att.name}</span>
                            {att.category === 'external_plan' && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 shrink-0">
                                Plan Previo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {att.url ? (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold text-[11px] px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Abrir Enlace
                              </a>
                            ) : att.dataUrl ? (
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                className="inline-flex items-center gap-1 text-slate-800 hover:text-white font-bold text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-900 rounded-lg transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                Descargar Archivo
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onViewPlanToPrint(inspectingPlan.type, inspectingPlan.plan.id);
                  setInspectingPlan(null);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <Printer className="w-4 h-4" />
                Abrir en formato imprimible PDF
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickStatusChange(inspectingPlan.type, inspectingPlan.plan, 'returned');
                    setInspectingPlan(null);
                  }}
                  className="bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Devolver con Notas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickStatusChange(inspectingPlan.type, inspectingPlan.plan, 'approved');
                    setInspectingPlan(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Aprobar Plan
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
