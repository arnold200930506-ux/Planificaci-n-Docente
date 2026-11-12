import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Search,
  Edit3,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  ClipboardCheck,
  Calendar,
  BookOpen,
  FileCheck,
  AlertCircle,
  Send
} from 'lucide-react';
import {
  Coordinator,
  CoordinatorCycle,
  SchoolConfig,
  SchoolShift,
  Teacher,
  DailyPlan,
  WeeklyPlan,
  LearningUnit
} from '../types/minerd';
import { openWhatsAppChat } from '../utils/whatsapp';

interface CoordinatorsManagementProps {
  coordinators: Coordinator[];
  schoolConfig: SchoolConfig;
  teachers?: Teacher[];
  dailyPlans?: DailyPlan[];
  weeklyPlans?: WeeklyPlan[];
  learningUnits?: LearningUnit[];
  onSaveCoordinator: (coordinator: Coordinator) => void;
  onDeleteCoordinator: (id: string) => void;
}

export interface ClassroomObservationVisit {
  id: string;
  date: string;
  teacherName: string;
  teacherPhone?: string;
  coordinatorName: string;
  grade: string;
  area: string;
  topicObserved: string;
  rubricScore: 'Destacado (90-100)' | 'Logrado (80-89)' | 'En Proceso (70-79)' | 'Requiere Apoyo';
  strengths: string;
  improvementAgreements: string;
  followUpDate: string;
}

export interface PedagogicalMeeting {
  id: string;
  title: string;
  type: 'Grupo Pedagógico / Micro-centro' | 'Reunión de Ciclo' | 'Taller de Adecuación Curricular' | 'Circular / Aviso';
  date: string;
  time: string;
  targetCycle: string;
  coordinatorName: string;
  agreements: string;
}

const AVAILABLE_CYCLES: CoordinatorCycle[] = [
  'Primer Ciclo (1ro a 3ro)',
  'Segundo Ciclo (4to a 6to)',
  'Nivel Inicial',
  'Secundaria',
  'Coordinación General / Pedagógica'
];

export const CoordinatorsManagement: React.FC<CoordinatorsManagementProps> = ({
  coordinators,
  schoolConfig,
  teachers = [],
  dailyPlans = [],
  weeklyPlans = [],
  learningUnits = [],
  onSaveCoordinator,
  onDeleteCoordinator
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'equipo' | 'acompanamiento' | 'cumplimiento' | 'cronograma'>('acompanamiento');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);

  // Coordinator Form states
  const [formName, setFormName] = useState('');
  const [formIdCard, setFormIdCard] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAccessPin, setFormAccessPin] = useState('2025');
  const [formCycle, setFormCycle] = useState<CoordinatorCycle>('Primer Ciclo (1ro a 3ro)');
  const [formShift, setFormShift] = useState<SchoolShift>('Ambas Tandas (Doble Tanda)');
  const [formNotes, setFormNotes] = useState('');

  // WhatsApp quick message modal
  const [whatsappTarget, setWhatsappTarget] = useState<{ name: string; phone: string } | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  // --- Sub-tab 2: Classroom Observation Visits (Acompañamiento Áulico) ---
  const visitsKey = `minerd_coord_visits_${schoolConfig.schoolCode || '14668'}`;
  const [visits, setVisits] = useState<ClassroomObservationVisit[]>(() => {
    try {
      const raw = localStorage.getItem(visitsKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitTeacherName, setVisitTeacherName] = useState('');
  const [visitCoordinatorName, setVisitCoordinatorName] = useState(coordinators[0]?.name || schoolConfig.coordinatorName || 'Coordinación Pedagógica');
  const [visitGrade, setVisitGrade] = useState('1er Grado');
  const [visitArea, setVisitArea] = useState('Lengua Española');
  const [visitTopic, setVisitTopic] = useState('');
  const [visitScore, setVisitScore] = useState<ClassroomObservationVisit['rubricScore']>('Logrado (80-89)');
  const [visitStrengths, setVisitStrengths] = useState('');
  const [visitAgreements, setVisitAgreements] = useState('');
  const [visitFollowUp, setVisitFollowUp] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  useEffect(() => {
    try {
      localStorage.setItem(visitsKey, JSON.stringify(visits));
    } catch {}
  }, [visits, visitsKey]);

  // --- Sub-tab 4: Cronograma y Grupos Pedagógicos ---
  const meetingsKey = `minerd_coord_meetings_${schoolConfig.schoolCode || '14668'}`;
  const [meetings, setMeetings] = useState<PedagogicalMeeting[]>(() => {
    try {
      const raw = localStorage.getItem(meetingsKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] = useState<PedagogicalMeeting['type']>('Grupo Pedagógico / Micro-centro');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('02:00 PM');
  const [meetingCycle, setMeetingCycle] = useState('Todos los Ciclos');
  const [meetingAgreements, setMeetingAgreements] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(meetingsKey, JSON.stringify(meetings));
    } catch {}
  }, [meetings, meetingsKey]);

  const handleOpenNew = () => {
    setEditingCoordinator(null);
    setFormName('');
    setFormIdCard('');
    setFormPhone('');
    setFormEmail('');
    setFormAccessPin('2025');
    setFormCycle('Primer Ciclo (1ro a 3ro)');
    setFormShift('Ambas Tandas (Doble Tanda)');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coordinator) => {
    setEditingCoordinator(c);
    setFormName(c.name);
    setFormIdCard(c.idCard);
    setFormPhone(c.phone);
    setFormEmail(c.email || '');
    setFormAccessPin(c.accessPin || '2025');
    setFormCycle(c.cycle);
    setFormShift(c.shift);
    setFormNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const coordToSave: Coordinator = {
      id: editingCoordinator ? editingCoordinator.id : `coord-${Date.now()}`,
      name: formName.trim(),
      idCard: formIdCard.trim() || '000-0000000-0',
      phone: formPhone.trim() || '809-000-0000',
      email: formEmail.trim() || `${formName.toLowerCase().replace(/[^a-z]/g, '')}@minerd.edu.do`,
      accessPin: formAccessPin.trim() || '2025',
      cycle: formCycle,
      shift: formShift,
      status: 'active',
      notes: formNotes.trim()
    };

    onSaveCoordinator(coordToSave);
    setIsModalOpen(false);
  };

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedTeacher = teachers.find(t => t.name === visitTeacherName);
    const newVisit: ClassroomObservationVisit = {
      id: `vis-${Date.now()}`,
      date: visitDate,
      teacherName: visitTeacherName || teachers[0]?.name || 'Docente de Aula',
      teacherPhone: matchedTeacher?.phone || '',
      coordinatorName: visitCoordinatorName || 'Coordinación Pedagógica',
      grade: visitGrade,
      area: visitArea,
      topicObserved: visitTopic || 'Secuencia didáctica del día',
      rubricScore: visitScore,
      strengths: visitStrengths || 'Buen manejo de grupo, activación de saberes previos y uso de recursos.',
      improvementAgreements: visitAgreements || 'Fortalecer las preguntas de metacognición en el cierre pedagógico.',
      followUpDate: visitFollowUp
    };
    setVisits(prev => [newVisit, ...prev]);
    setIsVisitModalOpen(false);
    setVisitTopic('');
    setVisitStrengths('');
    setVisitAgreements('');
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;
    const newMeeting: PedagogicalMeeting = {
      id: `mtg-${Date.now()}`,
      title: meetingTitle.trim(),
      type: meetingType,
      date: meetingDate,
      time: meetingTime,
      targetCycle: meetingCycle,
      coordinatorName: coordinators[0]?.name || schoolConfig.coordinatorName || 'Coordinación Pedagógica',
      agreements: meetingAgreements.trim() || 'Socialización de estrategias de la Adecuación Curricular y revisión de unidades.'
    };
    setMeetings(prev => [newMeeting, ...prev]);
    setIsMeetingModalOpen(false);
    setMeetingTitle('');
    setMeetingAgreements('');
  };

  const filteredCoordinators = coordinators.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idCard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cycle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCycle = selectedCycleFilter === 'all' || c.cycle === selectedCycleFilter;
    return matchesSearch && matchesCycle;
  });

  const getCycleBadgeColor = (cycle: CoordinatorCycle) => {
    switch (cycle) {
      case 'Primer Ciclo (1ro a 3ro)':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Segundo Ciclo (4to a 6to)':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Nivel Inicial':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Secundaria':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-indigo-800/60 border border-indigo-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200 shadow-xs">
            <Award className="w-4 h-4 text-amber-400" />
            Unidad de Coordinación Pedagógica MINERD
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestión de Coordinación, Acompañamiento y Seguimiento Docente
          </h1>
          <p className="text-indigo-200/90 text-sm leading-relaxed">
            Espacio integral de los Coordinadores Pedagógicos de la <strong>{schoolConfig.schoolName}</strong>: registre acompañamientos áulicos, supervise entregas de planificaciones diarias/semanales/unidades, agende grupos pedagógicos y gestione el equipo coordinador.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('acompanamiento');
              setIsVisitModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            Nueva Visita Áulica
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Coordinador
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit border border-slate-300">
        <button
          type="button"
          onClick={() => setActiveSubTab('acompanamiento')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'acompanamiento'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-indigo-600" />
          <span>1. Acompañamiento y Visitas Áulicas ({visits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cumplimiento')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'cumplimiento'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>2. Control de Entregas Docentes ({teachers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('cronograma')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'cronograma'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>3. Grupos Pedagógicos y Reuniones ({meetings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('equipo')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'equipo'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>4. Equipo de Coordinadores ({coordinators.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: ACOMPAÑAMIENTO Y VISITAS ÁULICAS */}
      {activeSubTab === 'acompanamiento' && (
        <div className="space-y-5">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                Protocolo de Acompañamiento Pedagógico MINERD
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Bitácora de Observación de Clases y Acuerdos de Mejora
              </h2>
              <p className="text-xs text-slate-500">
                Registre las visitas realizadas a los maestros en el aula, valore el desarrollo de los momentos pedagógicos y envíe la retroalimentación constructiva por WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setVisitTeacherName(teachers[0]?.name || '');
                setVisitGrade(teachers[0]?.grades?.[0] || '1er Grado');
                setVisitArea(teachers[0]?.areas?.[0] || 'Lengua Española');
                setIsVisitModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Registrar Acompañamiento Áulico</span>
            </button>
          </div>

          {visits.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <ClipboardCheck className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-base font-black text-slate-800">No hay visitas de acompañamiento registradas aún</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Haga clic en "Registrar Acompañamiento Áulico" para documentar la observación en aula de un docente, fortalezas evidenciadas y compromisos pedagógicos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visits.map(v => (
                <div key={v.id} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                          v.rubricScore.includes('Destacado') ? 'bg-emerald-100 text-emerald-900' :
                          v.rubricScore.includes('Logrado') ? 'bg-blue-100 text-blue-900' :
                          'bg-amber-100 text-amber-900'
                        }`}>
                          {v.rubricScore}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">{v.teacherName}</h3>
                        <p className="text-xs text-slate-500 font-semibold">
                          {v.grade} · {v.area} · Fecha: {v.date}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVisits(prev => prev.filter(item => item.id !== v.id))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
                      <p className="text-slate-800">
                        <strong className="text-indigo-900">Tema Observado:</strong> {v.topicObserved}
                      </p>
                      <p className="text-slate-700">
                        <strong className="text-emerald-800">✓ Fortalezas Destacadas:</strong> {v.strengths}
                      </p>
                      <p className="text-slate-700">
                        <strong className="text-amber-900">⚡ Acuerdos de Mejora:</strong> {v.improvementAgreements}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-slate-500">
                      Coord.: <strong>{v.coordinatorName}</strong> · Próximo seg.: {v.followUpDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappTarget({ name: v.teacherName, phone: v.teacherPhone || '' });
                        setCustomMessage(
                          `🏛️ *${schoolConfig.schoolName.toUpperCase()}*\n📋 *FICHA DE ACOMPAÑAMIENTO PEDAGÓGICO*\n\nEstimado/a *${v.teacherName}* (${v.grade} - ${v.area}):\n\nLe compartimos el resumen de la visita de acompañamiento realizada el *${v.date}* sobre el tema *"${v.topicObserved}"*:\n\n🌟 *Valoración:* ${v.rubricScore}\n✅ *Fortalezas observadas:* ${v.strengths}\n🎯 *Acuerdos y sugerencias:* ${v.improvementAgreements}\n📅 *Próximo seguimiento:* ${v.followUpDate}\n\nAtentamente,\n*${v.coordinatorName}*`
                        );
                      }}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Enviar Retroalimentación</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CONTROL DE ENTREGAS Y CUMPLIMIENTO DOCENTE */}
      {activeSubTab === 'cumplimiento' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Semáforo de Cumplimiento de Planificaciones por Docente
              </h2>
              <p className="text-xs text-slate-500">
                Monitoree en tiempo real cuántos Planes Diarios, Semanales y Unidades de Aprendizaje ha registrado cada docente y envíe recordatorios por WhatsApp.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Docente</th>
                  <th className="py-3.5 px-4">Grado / Asignatura</th>
                  <th className="py-3.5 px-4 text-center">Planes Diarios</th>
                  <th className="py-3.5 px-4 text-center">Matrices Semanales</th>
                  <th className="py-3.5 px-4 text-center">Unidades</th>
                  <th className="py-3.5 px-4 text-center">Estado de Entrega</th>
                  <th className="py-3.5 px-4 text-right">Recordatorio WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No hay docentes registrados en el Padrón de Docentes.
                    </td>
                  </tr>
                ) : (
                  teachers.map(t => {
                    const countDaily = dailyPlans.filter(p => p.teacherId === t.id || p.teacherName === t.name).length;
                    const countWeekly = weeklyPlans.filter(w => w.teacherId === t.id || w.teacherName === t.name).length;
                    const countUnits = learningUnits.filter(u => u.teacherId === t.id || u.teacherName === t.name).length;
                    const total = countDaily + countWeekly + countUnits;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{t.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-700">{t.grades?.join(', ')}</span>
                          {t.areas?.length ? (
                            <span className="ml-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded text-[10px] font-bold">
                              {t.areas.join(', ')}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-slate-800">{countDaily}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-slate-800">{countWeekly}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-black text-slate-800">{countUnits}</td>
                        <td className="py-3.5 px-4 text-center">
                          {total > 0 ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full text-[10px] font-black">
                              Al Día ({total} entregas)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black">
                              Pendiente de Entrega
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setWhatsappTarget({ name: t.name, phone: t.phone || '' });
                              setCustomMessage(
                                `Estimado/a *${t.name}*, le saludamos desde la Coordinación Pedagógica de la *${schoolConfig.schoolName}*. Le recordamos cargar o actualizar su Unidad de Aprendizaje y Planificación de esta semana en la plataforma institucional. ¡Muchas gracias por su dedicación!`
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-300 rounded-xl font-bold cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-green-600" />
                            <span>Recordar Entrega</span>
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
      )}

      {/* SUB-TAB 3: GRUPOS PEDAGÓGICOS Y CRONOGRAMA */}
      {activeSubTab === 'cronograma' && (
        <div className="space-y-5">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                Comunidades de Aprendizaje
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Cronograma de Grupos Pedagógicos, Reuniones de Ciclo y Circulares
              </h2>
              <p className="text-xs text-slate-500">
                Planifique talleres de la Adecuación Curricular, micro-centros y reuniones de coordinación con acuerdos documentados.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMeetingModalOpen(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Agendar Reunión / Grupo Pedagógico</span>
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-black text-slate-800">Sin reuniones o grupos pedagógicos agendados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Agende el próximo Grupo Pedagógico o reunión de ciclo para llevar las actas y convocatorias del equipo docente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map(m => (
                <div key={m.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 rounded-lg text-[10px] font-black">
                        {m.type}
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">{m.title}</h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        📅 {m.date} · ⏰ {m.time} · Dirigido a: {m.targetCycle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMeetings(prev => prev.filter(item => item.id !== m.id))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700">
                    <strong>Agenda / Acuerdos:</strong> {m.agreements}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: EQUIPO DE COORDINADORES */}
      {activeSubTab === 'equipo' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar coordinador por nombre, cédula o ciclo..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Filtrar por Ciclo:</label>
              <select
                value={selectedCycleFilter}
                onChange={(e) => setSelectedCycleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-700 cursor-pointer"
              >
                <option value="all">Todos los Ciclos</option>
                {AVAILABLE_CYCLES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinators Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCoordinators.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm">No se encontraron coordinadores en este filtro</p>
              </div>
            ) : (
              filteredCoordinators.map((coord) => (
                <div
                  key={coord.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-amber-400 font-extrabold flex items-center justify-center text-sm shrink-0 shadow-md">
                        {coord.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border mb-1.5 ${getCycleBadgeColor(coord.cycle)}`}>
                          <ShieldCheck className="w-3 h-3" />
                          {coord.cycle}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">{coord.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          Cédula: <span className="font-mono font-semibold text-slate-700">{coord.idCard}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(coord)}
                        className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Coordinador"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCoordinator(coord.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Coordinador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {coord.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {coord.notes}
                    </p>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">
                        {coord.shift}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold">
                        🔑 PIN: {coord.accessPin || '2025'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappTarget({ name: coord.name, phone: coord.phone });
                        setCustomMessage(`Saludos cordiales *${coord.name}* (${coord.cycle}). Le escribimos desde la Dirección de la ${schoolConfig.schoolName}.`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp ({coord.phone})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR VISITA DE ACOMPAÑAMIENTO ÁULICO */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900">Registrar Acompañamiento Áulico</h3>
              </div>
              <button type="button" onClick={() => setIsVisitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Docente Observado *</label>
                  <select
                    value={visitTeacherName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setVisitTeacherName(name);
                      const found = teachers.find(t => t.name === name);
                      if (found) {
                        if (found.grades?.[0]) setVisitGrade(found.grades[0]);
                        if (found.areas?.[0]) setVisitArea(found.areas[0]);
                      }
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    {teachers.length === 0 && <option value="Docente de Aula">Docente de Aula</option>}
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.grades?.join(', ')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grado / Curso</label>
                  <input
                    type="text"
                    value={visitGrade}
                    onChange={(e) => setVisitGrade(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área / Asignatura</label>
                  <input
                    type="text"
                    value={visitArea}
                    onChange={(e) => setVisitArea(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Visita</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valoración en Rúbrica</label>
                  <select
                    value={visitScore}
                    onChange={(e) => setVisitScore(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Destacado (90-100)">Destacado (90-100)</option>
                    <option value="Logrado (80-89)">Logrado (80-89)</option>
                    <option value="En Proceso (70-79)">En Proceso (70-79)</option>
                    <option value="Requiere Apoyo">Requiere Apoyo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tema o Intención Pedagógica Observada</label>
                <input
                  type="text"
                  value={visitTopic}
                  onChange={(e) => setVisitTopic(e.target.value)}
                  placeholder="Ej. Comprensión de la noticia / Suma de fracciones..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-800 mb-1">Fortalezas Evidenciadas en el Aula</label>
                <textarea
                  rows={2}
                  value={visitStrengths}
                  onChange={(e) => setVisitStrengths(e.target.value)}
                  placeholder="Dominio curricular, buen clima afectivo, participación activa..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">Acuerdos y Oportunidades de Mejora</label>
                <textarea
                  rows={2}
                  value={visitAgreements}
                  onChange={(e) => setVisitAgreements(e.target.value)}
                  placeholder="Uso del tiempo en el cierre, incorporar lista de cotejo..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsVisitModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black cursor-pointer">
                  Guardar Visita Áulica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGENDAR REUNIÓN / GRUPO PEDAGÓGICO */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900">Agendar Grupo Pedagógico o Reunión</h3>
              </div>
              <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Encuentro *</label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Ej. Grupo Pedagógico sobre Evaluación por Competencias"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Actividad</label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Grupo Pedagógico / Micro-centro">Grupo Pedagógico / Micro-centro</option>
                    <option value="Reunión de Ciclo">Reunión de Ciclo</option>
                    <option value="Taller de Adecuación Curricular">Taller de Adecuación Curricular</option>
                    <option value="Circular / Aviso">Circular / Aviso</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dirigido a</label>
                  <input
                    type="text"
                    value={meetingCycle}
                    onChange={(e) => setMeetingCycle(e.target.value)}
                    placeholder="Primer Ciclo / Todo el Claustro"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Temas de Agenda y Acuerdos</label>
                <textarea
                  rows={3}
                  value={meetingAgreements}
                  onChange={(e) => setMeetingAgreements(e.target.value)}
                  placeholder="Puntos a tratar y compromisos asumidos por el equipo..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsMeetingModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-xl font-black cursor-pointer">
                  Guardar en Cronograma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOR ADD / EDIT COORDINATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {editingCoordinator ? 'Editar Coordinador Pedagógico' : 'Registrar Nuevo Coordinador'}
                  </h3>
                  <p className="text-xs text-slate-500">{schoolConfig.schoolName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs">Nombre Completo del Coordinador(a) *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Lic. Rafael Antonio Marte"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Cédula de Identidad *</label>
                  <input
                    type="text"
                    required
                    value={formIdCard}
                    onChange={(e) => setFormIdCard(e.target.value)}
                    placeholder="028-0000000-0"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Teléfono / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="809-555-0000"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-800 text-xs">Clave / PIN de Acceso *</label>
                  <input
                    type="text"
                    required
                    value={formAccessPin}
                    onChange={(e) => setFormAccessPin(e.target.value)}
                    placeholder="Ej. 2025"
                    className="w-full px-3.5 py-2.5 border border-amber-300 bg-amber-50/50 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs">Ciclo que Coordina *</label>
                <select
                  value={formCycle}
                  onChange={(e) => setFormCycle(e.target.value as CoordinatorCycle)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                >
                  {AVAILABLE_CYCLES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs">Tanda / Horario Asignado *</label>
                <select
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value as SchoolShift)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                >
                  <option value="Ambas Tandas (Doble Tanda)">Ambas Tandas (Doble Tanda: 8am-12pm y 1pm-4:45pm)</option>
                  <option value="Tanda Matutina (8:00 AM - 12:00 PM)">Tanda Matutina (8:00 AM - 12:00 PM)</option>
                  <option value="Tanda Vespertina (1:00 PM - 4:45 PM)">Tanda Vespertina (1:00 PM - 4:45 PM)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs">Observaciones / Responsabilidades</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej. Encargado de acompañamiento pedagógico de 1ro a 3ro..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                />
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
                  className="bg-indigo-700 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-extrabold shadow-md cursor-pointer"
                >
                  {editingCoordinator ? 'Guardar Cambios' : 'Registrar Coordinador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {whatsappTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900">Despacho por WhatsApp</h4>
                  <p className="text-xs text-slate-500">Destinatario: {whatsappTarget.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-green-500 outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWhatsappTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppChat(whatsappTarget.phone, customMessage);
                  setWhatsappTarget(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
