import React, { useState, useRef } from 'react';
import { 
  Users, 
  UploadCloud, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Check, 
  X,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  Award,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { Teacher, TeacherLevel, SchoolConfig, SchoolShift } from '../types/minerd';
import { 
  parseExcelFile, 
  parseRawPastedText, 
  generateTemplateExcelWorkbook,
  ImportResult,
  ParsedTeacherRow 
} from '../utils/excelImporter';
import { openWhatsAppChat } from '../utils/whatsapp';

interface TeacherManagementProps {
  teachers: Teacher[];
  schoolConfig: SchoolConfig;
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onImportBatch: (teachers: Teacher[]) => void;
}

export const AVAILABLE_TEACHER_LEVELS: TeacherLevel[] = [
  'Nivel Primario Primer Ciclo',
  'Nivel Primario Segundo Ciclo',
  'Nivel Inicial',
  'Secundaria',
  'Auxiliar'
];

const AVAILABLE_GRADES = [
  'Pre-Kínder', 'Kínder', 'Pre-Primario',
  '1er Grado', '2do Grado', '3er Grado',
  '4to Grado', '5to Grado', '6to Grado',
  '1er Año Secundaria', '2do Año Secundaria', '3er Año Secundaria',
  '4to Año Secundaria', '5to Año Secundaria', '6to Año Secundaria',
  'Varios Grados / Rotativo'
];

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  schoolConfig,
  onSaveTeacher,
  onDeleteTeacher,
  onImportBatch
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'import'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  
  // Single Teacher Form state
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formIdCard, setFormIdCard] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formLevel, setFormLevel] = useState<TeacherLevel>('Nivel Primario Primer Ciclo');
  const [formGrades, setFormGrades] = useState<string[]>(['1er Grado']);
  const [formSections, setFormSections] = useState<string[]>(['A']);
  const [formShift, setFormShift] = useState<SchoolShift>('Ambas Tandas (Doble Tanda)');
  const [formNotes, setFormNotes] = useState('');

  // Import from Excel state
  const [pastedText, setPastedText] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick message modal
  const [whatsappModalTeacher, setWhatsappModalTeacher] = useState<Teacher | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  // Helper to normalize any legacy level string to the 5 official TeacherLevels
  const normalizeLevel = (rawLevel?: string): TeacherLevel => {
    if (!rawLevel) return 'Nivel Primario Primer Ciclo';
    const lower = rawLevel.toLowerCase();
    if (lower.includes('auxiliar') || lower.includes('apoyo')) return 'Auxiliar';
    if (lower.includes('inicial') || lower.includes('kinder') || lower.includes('pre-primario')) return 'Nivel Inicial';
    if (lower.includes('segundo ciclo') || lower.includes('2do ciclo') || lower.includes('4to') || lower.includes('5to') || lower.includes('6to')) {
      return 'Nivel Primario Segundo Ciclo';
    }
    if (lower.includes('primer ciclo') || lower.includes('1er ciclo') || lower.includes('1ro') || lower.includes('2do') || lower.includes('3ro')) {
      return 'Nivel Primario Primer Ciclo';
    }
    if (lower.includes('secundar') || lower.includes('media') || lower.includes('bachillerato')) return 'Secundaria';
    return (rawLevel as TeacherLevel) || 'Nivel Primario Primer Ciclo';
  };

  // Open Edit Modal
  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormIdCard(t.idCard || '');
    setFormPhone(t.phone || '');
    setFormEmail(t.email || '');
    setFormLevel(normalizeLevel(t.level));
    setFormGrades(t.grades && t.grades.length > 0 ? t.grades : ['1er Grado']);
    setFormSections(t.sections && t.sections.length > 0 ? t.sections : ['A']);
    setFormShift(t.shift || 'Ambas Tandas (Doble Tanda)');
    setFormNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormIdCard('');
    setFormPhone('');
    setFormEmail('');
    setFormLevel('Nivel Primario Primer Ciclo');
    setFormGrades(['1er Grado']);
    setFormSections(['A']);
    setFormShift('Ambas Tandas (Doble Tanda)');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const teacherToSave: Teacher = {
      id: editingTeacher ? editingTeacher.id : `tch-${Date.now()}`,
      name: formName.trim(),
      idCard: formIdCard.trim() || `001-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(Math.random() * 9)}`,
      phone: formPhone.trim() || '',
      email: formEmail.trim() || `${formName.toLowerCase().replace(/[^a-z]/g, '')}@minerd.edu.do`,
      level: formLevel,
      grades: formGrades.length > 0 ? formGrades : ['1er Grado'],
      sections: formSections.length > 0 ? formSections : ['A'],
      shift: formShift,
      notes: formNotes.trim(),
      status: 'active'
    };

    onSaveTeacher(teacherToSave);
    setIsModalOpen(false);
  };

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportSuccessMessage(null);
    try {
      const result = await parseExcelFile(file);
      setImportResult(result);
    } catch (err) {
      alert('Hubo un error al procesar el archivo Excel. Verifique el formato.');
      console.error(err);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Pasted Text Parse
  const handleParsePasted = () => {
    if (!pastedText.trim()) return;
    setImportSuccessMessage(null);
    const result = parseRawPastedText(pastedText);
    setImportResult(result);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!importResult || importResult.teachers.length === 0) return;
    onImportBatch(importResult.teachers);
    setImportSuccessMessage(`¡Éxito! Se han importado ${importResult.teachers.length} docentes a la base de datos institucional.`);
    setImportResult(null);
    setPastedText('');
    setTimeout(() => {
      setActiveSubTab('list');
    }, 1800);
  };

  // Visual Badges for Teacher Levels
  const getLevelBadge = (level: string) => {
    const norm = normalizeLevel(level);
    switch (norm) {
      case 'Nivel Inicial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Nivel Inicial
          </span>
        );
      case 'Nivel Primario Primer Ciclo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-50 text-sky-800 border border-sky-200">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            Primario 1er Ciclo
          </span>
        );
      case 'Nivel Primario Segundo Ciclo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            Primario 2do Ciclo
          </span>
        );
      case 'Secundaria':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 text-purple-800 border border-purple-200">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            Secundaria
          </span>
        );
      case 'Auxiliar':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-teal-50 text-teal-800 border border-teal-200">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            Auxiliar Docente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            {level}
          </span>
        );
    }
  };

  // Filter teachers
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.idCard?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.grades?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(t.level).toLowerCase().includes(searchQuery.toLowerCase());

    const teacherNormLevel = normalizeLevel(t.level);
    const matchesLevel = selectedLevelFilter === 'all' || teacherNormLevel === selectedLevelFilter;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-teal-300">
            <Users className="w-4 h-4" />
            Claustro Docente Institucional
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Gestión de Maestros y Personal Docente
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl font-medium leading-relaxed">
            Administre la nómina docente de la <strong className="text-white">{schoolConfig.schoolName}</strong> organizada por Nivel Inicial, Primaria (1er y 2do Ciclo), Secundaria y Auxiliares.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <button
            type="button"
            onClick={generateTemplateExcelWorkbook}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-300" />
            Descargar Plantilla Excel
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-teal-500/10 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Nuevo Docente
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-2 w-full sm:w-auto self-start border border-slate-300">
        <button
          type="button"
          onClick={() => setActiveSubTab('list')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeSubTab === 'list'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          Nómina de Docentes ({teachers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('import')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeSubTab === 'import'
              ? 'bg-white text-teal-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-600" />
          Importar desde Excel / Hoja de Cálculo
        </button>
      </div>

      {/* TAB 1: LISTA DE DOCENTES */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          
          {/* Filters and Search */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, cédula, grado o nivel..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-slate-50 focus:bg-white font-medium transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Filtrar por Nivel / Cargo:</label>
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">Todos los Niveles / Cargos</option>
                {AVAILABLE_TEACHER_LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of Teachers */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Docente</th>
                    <th className="px-4 py-4">Cédula</th>
                    <th className="px-4 py-4">Nivel / Ciclo / Cargo</th>
                    <th className="px-4 py-4">Grado(s) y Sección</th>
                    <th className="px-4 py-4">Tanda / Horario</th>
                    <th className="px-4 py-4">WhatsApp / Contacto</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-sm text-slate-700">No se encontraron docentes registrados</p>
                        <p className="text-xs text-slate-400 mt-1">Haga clic en "+ Nuevo Docente" para agregar el personal docente.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 border border-teal-300 text-teal-800 font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                              {teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{teacher.name}</p>
                              <p className="text-xs text-slate-500 font-normal">{teacher.email || 'Sin correo institucional'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-600 font-semibold">
                          {teacher.idCard || '-'}
                        </td>
                        <td className="px-4 py-4">
                          {getLevelBadge(teacher.level)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs font-bold text-slate-800">
                            {teacher.grades?.join(', ') || 'Sin grado'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Sección: {teacher.sections?.join(', ') || 'A'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-700">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {teacher.shift || 'Ambas Tandas'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setWhatsappModalTeacher(teacher);
                                setCustomMessage(`Estimado/a ${teacher.name}, le saludamos de la Coordinación Pedagógica de la ${schoolConfig.schoolName}.`);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 font-bold text-xs transition-colors cursor-pointer"
                              title="Enviar mensaje por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                              {teacher.phone || 'Avisar'}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(teacher)}
                              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                              title="Editar ficha"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Está seguro de eliminar a "${teacher.name}" del claustro docente?`)) {
                                  onDeleteTeacher(teacher.id);
                                }
                              }}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Eliminar maestro"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* TAB 2: IMPORTAR DESDE EXCEL */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          
          {importSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 animate-fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <p className="font-bold text-sm">{importSuccessMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box 1: Subir Archivo Excel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-black text-slate-900">
                <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                <h3>Opción 1: Cargar Archivo .xlsx / .csv</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Seleccione un libro de Excel oficial de nómina. El sistema reconocerá automáticamente las columnas de Nombre, Cédula, Teléfono, Nivel/Ciclo (Inicial, Primaria, Secundaria, Auxiliar) y Grado.
              </p>

              <div 
                className="border-2 border-dashed border-teal-300 rounded-2xl p-8 text-center bg-teal-50/40 hover:bg-teal-50/80 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <UploadCloud className="w-12 h-12 text-teal-600 animate-pulse" />
                <div>
                  <p className="text-sm font-black text-slate-800">
                    Haga clic aquí para seleccionar su archivo Excel
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Soporta formatos .xlsx, .xls y .csv</p>
                </div>
                <button
                  type="button"
                  disabled={isProcessingFile}
                  className="mt-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs"
                >
                  {isProcessingFile ? 'Leyendo archivo...' : 'Examinar en mi Computadora'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">¿Deseas la plantilla base?</span>
                <button
                  type="button"
                  onClick={generateTemplateExcelWorkbook}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Plantilla Oficial (.xlsx)
                </button>
              </div>
            </div>

            {/* Box 2: Pegar directamente celdas de Excel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-black text-slate-900">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3>Opción 2: Pegar Celdas Copiadas de Excel</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Abra su hoja de Excel, seleccione las filas de maestros, presione <strong>Ctrl + C</strong> y péguelas aquí:
              </p>

              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Nombre Completo&#9;Cédula&#9;Teléfono&#9;Nivel / Ciclo&#9;Grado&#9;Sección&#10;Prof. Carmen Rosario&#9;001-1827364-5&#9;809-555-0101&#9;Nivel Primario Primer Ciclo&#9;2do Grado&#9;A"
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 text-slate-800"
              />

              <button
                type="button"
                onClick={handleParsePasted}
                disabled={!pastedText.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                Procesar y Validar Datos Pegados
              </button>
            </div>
          </div>

          {/* Import Preview Table */}
          {importResult && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    Vista Previa de Importación ({importResult.validCount} docentes listos)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Revise la información antes de guardar en la base de datos institucional.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportResult(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importResult.validCount === 0}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar e Importar {importResult.validCount} Docentes
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-3"># Fila</th>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Cédula</th>
                      <th className="p-3">Teléfono</th>
                      <th className="p-3">Nivel / Cargo</th>
                      <th className="p-3">Grado(s)</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importResult.parsedRows.map((row) => (
                      <tr key={row.rowNumber} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="p-3 font-mono text-slate-500">{row.rowNumber}</td>
                        <td className="p-3 font-bold text-slate-900">{row.name || '(Sin nombre)'}</td>
                        <td className="p-3 font-mono">{row.idCard}</td>
                        <td className="p-3 font-mono">{row.phone}</td>
                        <td className="p-3">{getLevelBadge(row.level)}</td>
                        <td className="p-3 font-bold">{row.grades.join(', ')} "{row.sections.join(', ')}"</td>
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Válido
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold flex items-center gap-1" title={row.errors.join(', ')}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL REGISTRAR / EDITAR DOCENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 rounded-2xl text-teal-700">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingTeacher ? 'Editar Ficha del Docente' : 'Registrar Nuevo Docente'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{schoolConfig.schoolName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 text-xs">Nombre Completo del Docente *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Prof. Carmen Altagracia Rosario"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Cédula de Identidad</label>
                  <input
                    type="text"
                    value={formIdCard}
                    onChange={(e) => setFormIdCard(e.target.value)}
                    placeholder="001-1827364-5"
                    className="w-full px-3.5 py-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Teléfono WhatsApp (Avisos Directos)</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="809-555-0101"
                    className="w-full px-3.5 py-2.5 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* DESPLEGABLE MEJORADO DE NIVELES Y CARGO (SIN ÁREA CURRICULAR) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 text-xs">
                    Nivel / Ciclo / Cargo Asignado *
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as TeacherLevel)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white font-bold text-slate-800 cursor-pointer shadow-xs"
                  >
                    {AVAILABLE_TEACHER_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Grado(s) Asignado(s)</label>
                  <select
                    value={formGrades[0] || '1er Grado'}
                    onChange={(e) => setFormGrades([e.target.value])}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white font-semibold cursor-pointer"
                  >
                    {AVAILABLE_GRADES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-xs">Sección(es)</label>
                  <input
                    type="text"
                    value={formSections.join(', ')}
                    onChange={(e) => setFormSections(e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean))}
                    placeholder="A, B"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 text-xs">Tanda / Jornada</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as SchoolShift)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white font-medium cursor-pointer"
                  >
                    <option value="Ambas Tandas (Doble Tanda)">Ambas Tandas (Doble Tanda)</option>
                    <option value="Tanda Matutina (8:00 AM - 12:00 PM)">Tanda Matutina (8:00 AM - 12:00 PM)</option>
                    <option value="Tanda Vespertina (1:00 PM - 4:45 PM)">Tanda Vespertina (1:00 PM - 4:45 PM)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs">Correo Institucional (Opcional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ejemplo@minerd.edu.do"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
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
                  className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                >
                  {editingTeacher ? 'Guardar Cambios' : 'Registrar Docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP CUSTOM MODAL */}
      {whatsappModalTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Enviar Aviso por WhatsApp</h4>
                  <p className="text-xs text-slate-500">Destinatario: {whatsappModalTeacher.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalTeacher(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Mensaje a Enviar:</label>
              <textarea
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs leading-relaxed font-sans focus:ring-2 focus:ring-green-500 outline-none"
              />
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-green-600" />
                Número de destino: <strong className="font-mono text-slate-800">{whatsappModalTeacher.phone || 'Sin número'}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWhatsappModalTeacher(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppChat(whatsappModalTeacher.phone, customMessage);
                  setWhatsappModalTeacher(null);
                }}
                className="bg-green-600 hover:bg-green-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
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
