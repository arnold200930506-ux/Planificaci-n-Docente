import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  X,
  UserCheck,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Orientator, SchoolShift, SchoolConfig } from '../types/minerd';
import { openWhatsAppChat } from '../utils/whatsapp';

interface OrientatorsManagementProps {
  orientators: Orientator[];
  schoolConfig: SchoolConfig;
  onSaveOrientator: (orientator: Orientator) => Promise<void> | void;
  onDeleteOrientator: (id: string) => Promise<void> | void;
}

const AVAILABLE_SHIFTS: SchoolShift[] = [
  'Tanda Matutina (8:00 AM - 12:00 PM)',
  'Tanda Vespertina (1:00 PM - 4:45 PM)',
  'Ambas Tandas (Doble Tanda)'
];

export const OrientatorsManagement: React.FC<OrientatorsManagementProps> = ({
  orientators,
  schoolConfig,
  onSaveOrientator,
  onDeleteOrientator
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrientator, setEditingOrientator] = useState<Orientator | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIdCard, setFormIdCard] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('Orientador/a Escolar');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formShift, setFormShift] = useState<SchoolShift>('Ambas Tandas (Doble Tanda)');
  const [formGrades, setFormGrades] = useState<string[]>(['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado']);
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // WhatsApp quick modal
  const [waModalOrientator, setWaModalOrientator] = useState<Orientator | null>(null);
  const [waMessage, setWaMessage] = useState('');

  const handleOpenEdit = (o: Orientator) => {
    setEditingOrientator(o);
    setFormName(o.name);
    setFormIdCard(o.idCard || '');
    setFormRoleTitle(o.roleTitle);
    setFormPhone(o.phone || '');
    setFormEmail(o.email || '');
    setFormShift(o.shift || 'Ambas Tandas (Doble Tanda)');
    setFormGrades(o.assignedGrades || ['1er Grado a 6to Grado']);
    setFormPassword(o.password || '');
    setFormNotes(o.notes || '');
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingOrientator(null);
    setFormName('');
    setFormIdCard('');
    setFormRoleTitle('Orientador/a Escolar');
    setFormPhone('');
    setFormEmail('');
    setFormShift('Ambas Tandas (Doble Tanda)');
    setFormGrades(['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado']);
    setFormPassword('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRoleTitle.trim()) return;

    const newOrientator: Orientator = {
      id: editingOrientator ? editingOrientator.id : `orient-${Date.now()}`,
      name: formName.trim(),
      idCard: formIdCard.trim() || `001-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(Math.random() * 9)}`,
      roleTitle: formRoleTitle.trim(),
      phone: formPhone.trim() || '809-555-0199',
      email: formEmail.trim() || `${formName.toLowerCase().replace(/[^a-z]/g, '')}@minerd.edu.do`,
      shift: formShift,
      assignedGrades: formGrades.length > 0 ? formGrades : ['Todos los Grados'],
      password: formPassword.trim() || undefined,
      status: 'active',
      notes: formNotes.trim()
    };

    await onSaveOrientator(newOrientator);
    setIsModalOpen(false);
  };

  const filteredOrientators = orientators.filter(o => {
    const matchesSearch = 
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.idCard?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.assignedGrades?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesShift = selectedShiftFilter === 'all' || o.shift === selectedShiftFilter;
    return matchesSearch && matchesShift;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-rose-700/60 border border-rose-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-rose-100 shadow-xs">
            <HeartHandshake className="w-4 h-4 text-rose-300" />
            Equipo de Orientación y Psicología
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestión y Asignación de Orientadores y Psicólogos Escolares
          </h1>
          <p className="text-rose-100/85 text-sm leading-relaxed">
            Registre al personal del departamento de Orientación y Psicología de la <strong>{schoolConfig.schoolName}</strong> y asigne sus contraseñas individuales de acceso confidencial.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-slate-950 px-6 py-3 rounded-xl font-extrabold text-sm transition-all shadow-lg hover:shadow-rose-500/25 hover:scale-[1.02] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Registrar Orientador / Psicólogo
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, cargo, cédula..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrar por Tanda:</label>
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none bg-white font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">Todas las Tandas</option>
            {AVAILABLE_SHIFTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orientators Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredOrientators.length === 0 ? (
          <div className="col-span-2 bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-xs text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <UserCheck className="w-7 h-7 stroke-[2]" />
            </div>
            <p className="font-bold text-slate-800 text-sm">No se encontraron orientadores o psicólogos registrados</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Haga clic en "Registrar Orientador / Psicólogo" para agregar a los miembros del equipo y definir sus credenciales de acceso seguro.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Orientador</span>
            </button>
          </div>
        ) : (
          filteredOrientators.map(orient => (
            <div 
              key={orient.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 border border-rose-300 font-black text-base flex items-center justify-center shadow-xs">
                    {orient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{orient.name}</h3>
                    <p className="text-xs font-semibold text-rose-700">{orient.roleTitle}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{orient.idCard} · {orient.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(orient)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar orientador"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`¿Está seguro de eliminar a ${orient.name}?`)) {
                        await onDeleteOrientator(orient.id);
                      }
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar orientador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Acceso al Sistema</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] mt-0.5">
                    {orient.password ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Clave Asignada</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-amber-700">Clave Maestra</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Horario / Tanda</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{orient.shift}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Grados / Secciones Asignadas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {orient.assignedGrades?.map(g => (
                    <span key={g} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {orient.notes && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  "{orient.notes}"
                </p>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {orient.phone || 'Sin WhatsApp'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setWaModalOrientator(orient);
                    setWaMessage(`Estimado/a ${orient.name}, le saludamos de la Dirección de la Escuela Dr. José Francisco Peña Gómez.`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                  WhatsApp
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: CREATE / EDIT ORIENTATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 rounded-2xl text-rose-700">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingOrientator ? 'Editar Orientador / Psicólogo' : 'Registrar Nuevo Orientador / Psicólogo'}
                  </h3>
                  <p className="text-xs text-slate-500">Escuela Dr. José Francisco Peña Gómez</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Licda. Dania Mercedes Almonte"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Cargo / Título Profesional *</label>
                  <input
                    type="text"
                    required
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    placeholder="Ej. Orientadora Escolar / Psicóloga Educativa"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cédula de Identidad</label>
                  <input
                    type="text"
                    value={formIdCard}
                    onChange={(e) => setFormIdCard(e.target.value)}
                    placeholder="001-0498721-3"
                    className="w-full px-3.5 py-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Teléfono WhatsApp</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="809-555-0199"
                    className="w-full px-3.5 py-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Tanda Institucional</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as SchoolShift)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-white font-medium text-xs cursor-pointer"
                  >
                    {AVAILABLE_SHIFTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password / Access Field */}
              <div className="space-y-1 p-3.5 bg-rose-50/60 border border-rose-200 rounded-2xl">
                <label className="font-bold text-rose-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Contraseña Individual de Acceso (Para Módulo de Psicología)</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Asignar contraseña personal (ej. Dania2025)"
                    className="w-full px-3.5 py-2 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-rose-700 font-medium">
                  Esta contraseña permitirá que este profesional acceda de forma confidencial al apartado de Orientación y Psicología.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Grados Asignados (Separados por coma)</label>
                <input
                  type="text"
                  value={formGrades.join(', ')}
                  onChange={(e) => setFormGrades(e.target.value.split(',').map(g => g.trim()).filter(Boolean))}
                  placeholder="1er Grado, 2do Grado, 3er Grado, 4to Grado, 5to Grado, 6to Grado"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Notas / Especialidad</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej. Especialista en mediación de conflictos escolares y acompañamiento conductual..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs leading-relaxed"
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
                  className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {editingOrientator ? 'Guardar Cambios' : 'Registrar Orientador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {waModalOrientator && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900">Mensaje a Orientación</h4>
                  <p className="text-xs text-slate-500">{waModalOrientator.name} ({waModalOrientator.roleTitle})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaModalOrientator(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Mensaje WhatsApp:</label>
              <textarea
                rows={5}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWaModalOrientator(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppChat(waModalOrientator.phone, waMessage);
                  setWaModalOrientator(null);
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Abrir WhatsApp Web / App
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
