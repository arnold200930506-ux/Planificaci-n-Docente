import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  X, 
  Building, 
  UserCheck, 
  Award, 
  Calendar, 
  Layers, 
  Sparkles, 
  Lock, 
  Eye, 
  EyeOff,
  FileSpreadsheet,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { Coordinator, CoordinatorCycle, SchoolShift, SchoolConfig } from '../types/minerd';
import { openWhatsAppChat } from '../utils/whatsapp';
import { storageService } from '../services/storageService';

interface CoordinatorsManagementProps {
  coordinators: Coordinator[];
  schoolConfig: SchoolConfig;
  onSaveCoordinator: (coordinator: Coordinator) => Promise<void> | void;
  onDeleteCoordinator: (id: string) => Promise<void> | void;
}

const AVAILABLE_CYCLES: CoordinatorCycle[] = [
  'Primario 2do Ciclo',
  'Primario 1er Ciclo',
  'Nivel Inicial',
  'Secundaria',
  'Registro y Control Académico',
  'Administrativo y Financiero',
  'General Institucional'
];

const AVAILABLE_SHIFTS: SchoolShift[] = [
  'Tanda Matutina (8:00 AM - 12:00 PM)',
  'Tanda Vespertina (1:00 PM - 4:45 PM)',
  'Ambas Tandas (Doble Tanda)'
];

const PRESET_COORDINATOR_ROLES = [
  {
    title: 'Coordinador/a de Registro y Control Académico',
    cycle: 'Registro y Control Académico' as CoordinatorCycle,
    grades: ['Todos los Grados'],
    notes: 'Gestión de actas oficiales, RNE, récord de notas, plataforma SIGERD y certificaciones.'
  },
  {
    title: 'Coordinador/a Administrativo/a y Financiero/a',
    cycle: 'Administrativo y Financiero' as CoordinatorCycle,
    grades: ['Todos los Grados'],
    notes: 'Supervisión de recursos materiales, inventario, logística del centro y personal de apoyo.'
  },
  {
    title: 'Coordinador/a Pedagógico/a de 2do Ciclo Primaria',
    cycle: 'Primario 2do Ciclo' as CoordinatorCycle,
    grades: ['4to Grado', '5to Grado', '6to Grado'],
    notes: 'Acompañamiento pedagógico a docentes, revisión de planes y seguimiento de aprendizajes.'
  },
  {
    title: 'Coordinador/a Pedagógico/a de 1er Ciclo Primaria',
    cycle: 'Primario 1er Ciclo' as CoordinatorCycle,
    grades: ['Pre-Primario', '1ro Grado', '2do Grado', '3ro Grado'],
    notes: 'Acompañamiento en procesos de alfabetización inicial y matemática lúdica.'
  },
  {
    title: 'Coordinador/a Pedagógico/a del Nivel Inicial',
    cycle: 'Nivel Inicial' as CoordinatorCycle,
    grades: ['Maternal', 'Kínder', 'Pre-Primario'],
    notes: 'Acompañamiento en el desarrollo integral, rincones pedagógicos y motricidad.'
  },
  {
    title: 'Coordinador/a Pedagógico/a del Nivel Secundario',
    cycle: 'Secundaria' as CoordinatorCycle,
    grades: ['1ro Secundaria', '2do Secundaria', '3ro Secundaria', '4to Secundaria', '5to Secundaria', '6to Secundaria'],
    notes: 'Supervisión de áreas académicas, proyectos didácticos y pruebas nacionales.'
  },
  {
    title: 'Coordinador/a General Institucional',
    cycle: 'General Institucional' as CoordinatorCycle,
    grades: ['Todos los Grados'],
    notes: 'Articulación institucional, supervisión integral y apoyo a la Dirección Escolar.'
  }
];

export const CoordinatorsManagement: React.FC<CoordinatorsManagementProps> = ({
  coordinators,
  schoolConfig,
  onSaveCoordinator,
  onDeleteCoordinator
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIdCard, setFormIdCard] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCycle, setFormCycle] = useState<CoordinatorCycle>('Registro y Control Académico');
  const [formShift, setFormShift] = useState<SchoolShift>('Ambas Tandas (Doble Tanda)');
  const [formGrades, setFormGrades] = useState<string[]>(['Todos los Grados']);
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // WhatsApp quick modal
  const [waModalCoord, setWaModalCoord] = useState<Coordinator | null>(null);
  const [waMessage, setWaMessage] = useState('');

  const handleOpenEdit = (c: Coordinator) => {
    setEditingCoordinator(c);
    setFormName(c.name);
    setFormIdCard(c.idCard || '');
    setFormRoleTitle(c.roleTitle);
    setFormPhone(c.phone || '');
    setFormEmail(c.email || '');
    setFormCycle(c.cycle);
    setFormShift(c.shift || 'Ambas Tandas (Doble Tanda)');
    setFormGrades(c.assignedGrades || ['Todos los Grados']);
    setFormPassword(c.password || '');
    setFormNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCoordinator(null);
    setFormName('');
    setFormIdCard('');
    setFormRoleTitle('Coordinador/a de Registro y Control Académico');
    setFormPhone('');
    setFormEmail('');
    setFormCycle('Registro y Control Académico');
    setFormShift('Ambas Tandas (Doble Tanda)');
    setFormGrades(['Todos los Grados']);
    setFormPassword('');
    setFormNotes('Gestión de actas oficiales, RNE, récord de notas, SIGERD y certificaciones estudiantiles.');
    setIsModalOpen(true);
  };

  const handleSelectPreset = (preset: typeof PRESET_COORDINATOR_ROLES[0]) => {
    setFormRoleTitle(preset.title);
    setFormCycle(preset.cycle);
    setFormGrades(preset.grades);
    if (!formNotes || formNotes.trim() === '') {
      setFormNotes(preset.notes);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRoleTitle.trim()) return;

    const newCoord: Coordinator = {
      id: editingCoordinator ? editingCoordinator.id : `coord-${Date.now()}`,
      name: formName.trim(),
      idCard: formIdCard.trim() || `001-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(Math.random() * 9)}`,
      roleTitle: formRoleTitle.trim(),
      phone: formPhone.trim() || '',
      email: formEmail.trim() || `${formName.toLowerCase().replace(/[^a-z]/g, '')}@minerd.edu.do`,
      cycle: formCycle,
      shift: formShift,
      assignedGrades: formGrades.length > 0 ? formGrades : ['Todos los Grados'],
      password: formPassword.trim() || undefined,
      status: 'active',
      notes: formNotes.trim()
    };

    await onSaveCoordinator(newCoord);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Está seguro de eliminar a "${name}" del equipo de coordinación? Esta acción se sincronizará inmediatamente en la nube.`)) {
      await onDeleteCoordinator(id);
    }
  };

  const handleClearAll = () => {
    if (true) {
      storageService.clearAllCoordinators().then(() => {
        // Handled by snapshot
      });
    }
  };

  const getCycleBadge = (cycle: CoordinatorCycle) => {
    switch (cycle) {
      case 'Registro y Control Académico':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Registro y Control'
        };
      case 'Administrativo y Financiero':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Briefcase className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Administrativo'
        };
      case 'Secundaria':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <GraduationCap className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Secundaria'
        };
      case 'Primario 2do Ciclo':
      case 'Primario 1er Ciclo':
      case 'Nivel Inicial':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <Award className="w-3.5 h-3.5 text-blue-600" />,
          label: cycle
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />,
          label: 'Institucional'
        };
    }
  };

  const filteredCoordinators = coordinators.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idCard?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCycle = selectedCycleFilter === 'all' || c.cycle === selectedCycleFilter;
    const matchesShift = selectedShiftFilter === 'all' || c.shift === selectedShiftFilter;

    return matchesSearch && matchesCycle && matchesShift;
  });

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Equipo Directivo & Coordinaciones
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Gestión de Coordinadores
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Administración de Coordinadores Pedagógicos por ciclos, Coordinadores de Registro y Control Académico (SIGERD) y Coordinadores Administrativos del centro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {coordinators.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vaciar Panel</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-5 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>+ Agregar Coordinador</span>
          </button>
        </div>
      </div>

      {/* Quick Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold">Total Equipo</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{coordinators.length}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold">Pedagógicos</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-blue-900">
            {coordinators.filter(c => c.cycle.includes('Primario') || c.cycle.includes('Inicial') || c.cycle === 'Secundaria').length}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold">Registro & Actas</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-900">
            {coordinators.filter(c => c.cycle === 'Registro y Control Académico').length}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-bold">Administrativos</span>
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-900">
            {coordinators.filter(c => c.cycle === 'Administrativo y Financiero').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, cargo o cédula..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCycleFilter}
            onChange={(e) => setSelectedCycleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Todos los Tipos de Coordinación</option>
            {AVAILABLE_CYCLES.map(cycle => (
              <option key={cycle} value={cycle}>{cycle}</option>
            ))}
          </select>

          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Todas las Tandas</option>
            {AVAILABLE_SHIFTS.map(shift => (
              <option key={shift} value={shift}>{shift}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Coordinators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoordinators.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">No hay coordinadores registrados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No se encontraron coordinadores con los filtros seleccionados o la base de datos está lista para agregar al personal de tu centro educativo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNew}
              className="px-4 py-2 bg-slate-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              + Agregar Coordinador Ahora
            </button>
          </div>
        ) : (
          filteredCoordinators.map((coord) => {
            const badge = getCycleBadge(coord.cycle);
            return (
              <div 
                key={coord.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                        {coord.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-950 leading-tight">
                        {coord.roleTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(coord)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar coordinador"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(coord.id, coord.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar coordinador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {coord.idCard && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 font-mono">
                        <span className="text-slate-400 font-sans">Cédula:</span>
                        <span className="font-bold text-slate-800">{coord.idCard}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Tanda:</span>
                      <span className="font-bold text-slate-700">{coord.shift}</span>
                    </div>

                    {coord.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                        "{coord.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {coord.phone || 'Sin número'}
                  </span>

                  {coord.phone && (
                    <button
                      type="button"
                      onClick={() => {
                        setWaModalCoord(coord);
                        setWaMessage(`Estimado/a ${coord.name}, le saludamos desde la Dirección de la ${schoolConfig.schoolName}.`);
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create or Edit Coordinator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
            
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {editingCoordinator ? 'Editar Datos de Coordinador' : 'Registrar Nuevo Coordinador'}
                  </h3>
                  <p className="text-xs text-slate-300">Coordinación Pedagógica, Registro o Administrativa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              
              {/* Quick Preset Selector */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="font-bold text-slate-700 block text-[11px]">
                  💡 Seleccionar Plantilla Rápida de Rol:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COORDINATOR_ROLES.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer border ${
                        formRoleTitle === preset.title
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset.title.replace('Coordinador/a ', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo del Coordinador/a *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Lic. José Manuel Pérez"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Título Oficial de Coordinación *</label>
                <input
                  type="text"
                  required
                  value={formRoleTitle}
                  onChange={(e) => setFormRoleTitle(e.target.value)}
                  placeholder="Ej. Coordinador/a de Registro y Control Académico"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Área / Departamento / Ciclo</label>
                  <select
                    value={formCycle}
                    onChange={(e) => setFormCycle(e.target.value as CoordinatorCycle)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white cursor-pointer"
                  >
                    {AVAILABLE_CYCLES.map((cycle) => (
                      <option key={cycle} value={cycle}>{cycle}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanda Escolar</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as SchoolShift)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white cursor-pointer"
                  >
                    {AVAILABLE_SHIFTS.map((shift) => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cédula de Identidad</label>
                  <input
                    type="text"
                    value={formIdCard}
                    onChange={(e) => setFormIdCard(e.target.value)}
                    placeholder="001-1234567-8"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="809-555-0199"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico Institucional</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="coordinador@minerd.edu.do"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Grados o Ámbitos Bajo Supervisión</label>
                <input
                  type="text"
                  value={formGrades.join(', ')}
                  onChange={(e) => setFormGrades(e.target.value.split(',').map(g => g.trim()).filter(Boolean))}
                  placeholder="Ej. Todos los Grados, 4to Grado, 5to Grado"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                />
              </div>

              {/* Individual Access Password */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Clave Individual de Acceso (Opcional)</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Asignar contraseña personal (ej. coord2025)"
                    className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl font-mono text-slate-900 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-indigo-700">
                  Permite a este coordinador ingresar directamente al módulo de coordinación y supervisión docente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notas o Responsabilidades Específicas</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Descripción de funciones principales, proyectos a cargo..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-950 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  {editingCoordinator ? 'Guardar Cambios' : 'Registrar Coordinador'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {waModalCoord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Mensaje por WhatsApp</h3>
              </div>
              <button
                type="button"
                onClick={() => setWaModalCoord(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">
                Enviar mensaje institucional a <strong>{waModalCoord.name}</strong> ({waModalCoord.phone}):
              </p>
              <textarea
                rows={4}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWaModalCoord(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (waModalCoord.phone) {
                    openWhatsAppChat(waModalCoord.phone, waMessage);
                    setWaModalCoord(null);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Abrir en WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
