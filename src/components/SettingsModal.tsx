import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Building, 
  Check, 
  AlertTriangle,
  MessageSquare,
  Clock,
  HeartHandshake,
  ShieldCheck,
  Award,
  Copyright,
  Phone,
  Sparkles,
  Lock,
  KeyRound,
  UserCheck,
  Image as ImageIcon,
  Trash2,
  FolderArchive,
  Archive,
  History,
  UploadCloud,
  Loader2,
  Laptop,
  Smartphone
} from 'lucide-react';
import { SchoolConfig, SchoolShift } from '../types/minerd';
import { storageService } from '../services/storageService';
import { 
  DIRECTOR_NAME, 
  DIRECTOR_PASSWORD, 
  COORDINATOR_DEFAULT_PASSWORD, 
  ORIENTATOR_DEFAULT_PASSWORD,
  MASTER_PASSWORD 
} from '../services/authService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  onSaveConfig: (config: SchoolConfig) => Promise<void> | void;
  onDataReload: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onDataReload
}) => {
  const [formData, setFormData] = useState<SchoolConfig>(config);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'shifts' | 'whatsapp' | 'staff' | 'security' | 'backup'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [logoUploadError, setLogoUploadError] = useState<string>('');
  
  // Archivo de año escolar
  const [archivesList, setArchivesList] = useState<import('../types/minerd').SchoolYearArchive[]>(() => storageService.getSchoolYearArchives());
  const [nextYearInput, setNextYearInput] = useState<string>('2026-2027');
  const [preserveStaffCheck, setPreserveStaffCheck] = useState<boolean>(true);
  const [archiveNotes, setArchiveNotes] = useState<string>('');
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string>('');
  const [showArchiveConfirmModal, setShowArchiveConfirmModal] = useState<boolean>(false);
  const [syncMode, setSyncModeState] = useState<'eco' | 'local_only' | 'realtime'>(() => storageService.getSyncMode());
  const [isSyncingManual, setIsSyncingManual] = useState<boolean>(false);


  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG o WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('La imagen no debe superar los 2 MB para un óptimo rendimiento.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setFormData(prev => ({ ...prev, logoUrl: base64Url }));
        setLogoUploadError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    setLogoUploadError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planificacion_minerd_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storageService.importDataJSON(content);
        if (success) {
          setImportStatus('¡Datos importados con éxito!');
          onDataReload();
          setTimeout(() => setImportStatus(''), 3000);
        } else {
          setImportStatus('Error: Archivo JSON no válido.');
        }
      }
    };
    reader.readAsText(file);
  };


  const handleArchiveSchoolYear = async () => {
    setIsArchiving(true);
    try {
      const record = await storageService.archiveCurrentSchoolYear({
        nextSchoolYear: nextYearInput.trim() || '2026-2027',
        preserveStaff: preserveStaffCheck,
        notes: archiveNotes
      });
      setArchivesList(storageService.getSchoolYearArchives());
      setArchiveSuccessMsg(`¡Año escolar ${record.schoolYear} archivado con éxito! Se ha iniciado el ciclo ${record.snapshot.config.schoolYear || nextYearInput}.`);
      setShowArchiveConfirmModal(false);
      onDataReload();
      setTimeout(() => setArchiveSuccessMsg(''), 6000);
    } catch (err: any) {
      alert('Error al archivar el año escolar: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsArchiving(false);
    }
  };

    const handleClearAllData = () => {
    if (window.confirm('¿Está seguro de vaciar todos los datos de ejemplo y comenzar desde cero? Se limpiarán los planes, docentes, estudiantes, coordinadores y casos para ingresar los datos reales de su centro educativo.')) {
      storageService.clearAllData();
      onDataReload();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fade-in my-6">
        
        {/* Modern Minimalist Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">Configuración del Centro</h2>
              <p className="text-xs text-slate-300">Ajustes institucionales, Tandas, WhatsApp y Seguridad Directiva</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Tab Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-1 overflow-x-auto text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSettingsTab('general')}
            className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'general'
                ? 'bg-white text-slate-950 border-t-2 border-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Escuela</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('whatsapp')}
            className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'whatsapp'
                ? 'bg-white text-slate-950 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('shifts')}
            className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'shifts'
                ? 'bg-white text-slate-950 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Doble Tanda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('staff')}
            className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'staff'
                ? 'bg-white text-slate-950 border-t-2 border-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>Firmas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('security')}
            className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'security'
                ? 'bg-white text-slate-950 border-t-2 border-amber-500 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Seguridad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('backup')}
            className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSettingsTab === 'backup'
                ? 'bg-white text-slate-950 border-t-2 border-slate-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Respaldo</span>
          </button>

        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: General School Info & Multi-Centro */}
          {activeSettingsTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-black">
                  🏛️
                </div>
                <div>
                  <h4 className="font-extrabold text-blue-950 text-xs">Configuración Oficial del Centro Educativo</h4>
                  <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                    Configure el <strong>Nombre Oficial</strong>, <strong>Código del Centro (MINERD)</strong> y autoridades del plantel. Todos los datos de docentes, planificaciones y psicología se sincronizan automáticamente con este centro educativo.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Oficial del Centro Educativo</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código del Centro (MINERD)
                    <span className="text-emerald-700 font-normal ml-1">(Código Oficial MINERD)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.schoolCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, schoolCode: e.target.value }))}
                    placeholder="Ej. 14668"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-600 mt-1">
                    Código oficial registrado ante el Ministerio de Educación (MINERD).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Año Lectivo Escolar</label>
                  <input
                    type="text"
                    value={formData.schoolYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, schoolYear: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Regional Educativa</label>
                  <input
                    type="text"
                    value={formData.regional}
                    onChange={(e) => setFormData(prev => ({ ...prev, regional: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Distrito Educativo</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Logo Institucional del Centro Educativo */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <label className="font-bold text-xs text-slate-800">Logo Institucional del Centro Educativo</label>
                  </div>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar Logo</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                    {formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo del Centro" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                        <span className="text-[9px] text-slate-400 block mt-0.5">Logo MINERD</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Sube el escudo o logo oficial de tu escuela. Se mostrará en la barra lateral, reportes imprimibles y documentos en PDF.
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Subir Imagen desde mi Dispositivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {logoUploadError && (
                      <p className="text-[11px] text-rose-600 font-bold">{logoUploadError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WhatsApp Notifications Configuration */}
          {activeSettingsTab === 'whatsapp' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-extrabold text-sm text-emerald-950">Notificaciones Automáticas por WhatsApp</h3>
                </div>
                <p className="text-xs text-emerald-800">
                  Active o desactive los envíos inmediatos por WhatsApp al momento en que la Dirección o Coordinación toma una decisión sobre una planificación docente:
                </p>

                {/* Toggles */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.whatsAppConfig?.autoSendOnApproval ?? true}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        whatsAppConfig: {
                          ...prev.whatsAppConfig,
                          autoSendOnApproval: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-950 block">Enviar WhatsApp automáticamente al APROBAR</span>
                      <span className="text-slate-500 text-[11px]">Abre el chat con el docente felicitándole y confirmando la aprobación oficial.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2 bg-white rounded-xl border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.whatsAppConfig?.autoSendOnReturn ?? true}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        whatsAppConfig: {
                          ...prev.whatsAppConfig,
                          autoSendOnReturn: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-amber-950 block">Enviar WhatsApp automáticamente al DEVOLVER con observaciones</span>
                      <span className="text-slate-500 text-[11px]">Envía al docente el detalle de las correcciones pedagógicas requeridas.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Template Customizations */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Plantillas de Mensajes Estándar
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mensaje Estándar: Planificación Aprobada
                  </label>
                  <textarea
                    rows={3}
                    value={formData.whatsAppConfig?.approvedTemplate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      whatsAppConfig: {
                        ...prev.whatsAppConfig,
                        approvedTemplate: e.target.value
                      }
                    }))}
                    placeholder="Variables disponibles: {{teacherName}}, {{planType}}, {{grade}}, {{schoolName}}, {{dateOrWeek}}"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mensaje Estándar: Planificación Devuelta
                  </label>
                  <textarea
                    rows={3}
                    value={formData.whatsAppConfig?.returnedTemplate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      whatsAppConfig: {
                        ...prev.whatsAppConfig,
                        returnedTemplate: e.target.value
                      }
                    }))}
                    placeholder="Variables: {{teacherName}}, {{planType}}, {{grade}}, {{area}}, {{feedback}}"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mensaje Estándar: Citación de Orientación y Psicología
                  </label>
                  <textarea
                    rows={3}
                    value={formData.whatsAppConfig?.psychologyCitationTemplate || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      whatsAppConfig: {
                        ...prev.whatsAppConfig,
                        psychologyCitationTemplate: e.target.value
                      }
                    }))}
                    placeholder="Variables: {{studentName}}, {{citationDate}}, {{citationTime}}, {{schoolName}}"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Shifts & Double Session */}
          {activeSettingsTab === 'shifts' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-700" />
                  <h3 className="font-extrabold text-sm text-indigo-950">Modalidad Escolar: Doble Tanda</h3>
                </div>
                <p className="text-xs text-indigo-800">
                  Nuestra escuela opera bajo el régimen oficial de dos jornadas lectivas:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200 font-bold text-xs text-indigo-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Tanda Matutina: 8:00 AM – 12:00 PM</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200 font-bold text-xs text-indigo-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Tanda Vespertina: 1:00 PM – 4:45 PM</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanda Predeterminada del Centro</label>
                <select
                  value={formData.tanda}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanda: e.target.value as SchoolShift }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="Ambas Tandas (Doble Tanda)">Ambas Tandas (Doble Tanda: 8:00 AM - 12:00 PM / 1:00 PM - 4:45 PM)</option>
                  <option value="Tanda Matutina (8:00 AM - 12:00 PM)">Tanda Matutina (8:00 AM - 12:00 PM)</option>
                  <option value="Tanda Vespertina (1:00 PM - 4:45 PM)">Tanda Vespertina (1:00 PM - 4:45 PM)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: Staff & Signatures */}
          {activeSettingsTab === 'staff' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-600">
                  Personal para Firmas Oficiales y Contactos
                </h3>

                {/* Director */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dirección del Centro</label>
                    <input
                      type="text"
                      value={formData.principalName || DIRECTOR_NAME}
                      onChange={(e) => setFormData(prev => ({ ...prev, principalName: e.target.value }))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp de la Dirección</label>
                    <input
                      type="text"
                      value={formData.principalPhone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, principalPhone: e.target.value }))}
                      placeholder="809-555-0188"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Coordinator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Coordinador(a) Pedagógico(a) General</label>
                    <input
                      type="text"
                      value={formData.coordinatorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, coordinatorName: e.target.value }))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp del Coordinador</label>
                    <input
                      type="text"
                      value={formData.coordinatorPhone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, coordinatorPhone: e.target.value }))}
                      placeholder="Ej. 809-000-0000"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Orientator & Psychology */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Orientador(a) / Psicólogo(a) Escolar</label>
                    <input
                      type="text"
                      value={formData.orientatorName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, orientatorName: e.target.value }))}
                      placeholder="Ej. Licda. Orientadora Escolar"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Orientación & Psicología</label>
                    <input
                      type="text"
                      value={formData.orientatorPhone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, orientatorPhone: e.target.value }))}
                      placeholder="Ej. 809-000-0000"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Security & Permissions */}
          {activeSettingsTab === 'security' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-900 text-white rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Seguridad y Control de Acceso</h3>
                    <p className="text-[11px] text-slate-300">Protección con clave para áreas sensibles de Dirección y Psicología</p>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 space-y-2 border border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span>🏛️ <strong>Dirección ({DIRECTOR_NAME}):</strong></span>
                    <code className="px-2 py-0.5 bg-amber-400 text-slate-950 font-mono font-bold rounded text-xs">
                      {DIRECTOR_PASSWORD}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span>📋 <strong>Coordinación Pedagógica:</strong></span>
                    <code className="px-2 py-0.5 bg-indigo-300 text-slate-950 font-mono font-bold rounded text-xs">
                      {COORDINATOR_DEFAULT_PASSWORD}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span>🧠 <strong>Orientación & Psicología:</strong></span>
                    <code className="px-2 py-0.5 bg-rose-300 text-slate-950 font-mono font-bold rounded text-xs">
                      {ORIENTATOR_DEFAULT_PASSWORD}
                    </code>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
                  <span className="font-bold flex items-center gap-1.5 text-rose-800">
                    <Lock className="w-3.5 h-3.5" /> Módulos Protegidos
                  </span>
                  <ul className="list-disc pl-4 text-[11px] text-rose-700 space-y-0.5">
                    <li>Supervisión y Aprobación Directiva</li>
                    <li>Gestión de Coordinadores</li>
                    <li>Expedientes de Orientación & Psicología</li>
                    <li>Padrón de Docentes y Cédulas</li>
                    <li>Ajustes Institucionales</li>
                  </ul>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <UserCheck className="w-3.5 h-3.5" /> Acceso Libre para Maestros
                  </span>
                  <ul className="list-disc pl-4 text-[11px] text-emerald-700 space-y-0.5">
                    <li>Crear y editar Plan Diario</li>
                    <li>Crear y editar Plan Semanal</li>
                    <li>Diseñar Unidades de Aprendizaje</li>
                    <li>Banco Curricular Oficial MINERD</li>
                    <li>Exportar e Imprimir Documentos</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Backup & Export */}
          {activeSettingsTab === 'backup' && (
            <div className="space-y-4 animate-fade-in">
              {/* --- PANEL DE AUTONOMÍA LOCAL Y AHORRO DE BASE DE DATOS --- */}
              <div className="p-4 rounded-2xl bg-emerald-950 text-white border border-emerald-700/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-emerald-200">
                      Motor de Autonomía de Datos (Local + Servidor Propio + Nube Compacta)
                    </h4>
                    <p className="text-[11px] text-emerald-100/80 mt-0.5">
                      Evita depender de los límites diarios de Firebase guardando primero en el navegador y en el disco del servidor propio.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSyncingManual}
                    onClick={async () => {
                      setIsSyncingManual(true);
                      storageService.clearCloudQuotaPause();
                      await storageService.syncWithServerMirror();
                      await storageService.syncCloudOnce(undefined, true);
                      onDataReload();
                      setIsSyncingManual(false);
                      setImportStatus('¡Sincronización con Servidor Propio y Nube completada!');
                      setTimeout(() => setImportStatus(''), 4000);
                    }}
                    className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    {isSyncingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Sincronizar Ahora</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      storageService.setSyncMode('eco');
                      setSyncModeState('eco');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      syncMode === 'eco'
                        ? 'bg-emerald-500/25 border-emerald-400 text-white'
                        : 'bg-white/5 border-white/10 text-emerald-100/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-extrabold">⚡ Ahorro Inteligente (Recomendado)</div>
                    <p className="text-[10px] opacity-85 mt-0.5">
                      Usa Memoria Local + Servidor Propio y bloques compactos (98% menos consumo de Firebase).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      storageService.setSyncMode('local_only');
                      setSyncModeState('local_only');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      syncMode === 'local_only'
                        ? 'bg-emerald-500/25 border-emerald-400 text-white'
                        : 'bg-white/5 border-white/10 text-emerald-100/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-extrabold">🛡️ 100% Autónomo (Sin Firebase)</div>
                    <p className="text-[10px] opacity-85 mt-0.5">
                      Opera exclusivamente con el Servidor Propio y el navegador. Cero dependencia de la nube.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      storageService.setSyncMode('realtime');
                      setSyncModeState('realtime');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      syncMode === 'realtime'
                        ? 'bg-emerald-500/25 border-emerald-400 text-white'
                        : 'bg-white/5 border-white/10 text-emerald-100/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-extrabold">☁️ Nube Continua</div>
                    <p className="text-[10px] opacity-85 mt-0.5">
                      Escucha en tiempo real en Firebase (solo para cuentas con plan Blaze ilimitado).
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-600">
                  Copia de Seguridad y Sincronización Local / Firebase
                </h3>
                <p className="text-xs text-slate-600">
                  Puede exportar toda la base de datos de planificaciones, docentes, coordinadores, los 728+ estudiantes y casos de orientación en un solo archivo JSON para resguardo.
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-700" />
                    Exportar Base Completa (.json)
                  </button>

                  <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-emerald-700" />
                    Importar Respaldo
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold flex items-center gap-1.5 transition-colors ml-auto cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Vaciar y Comenzar en Limpio
                  </button>
                </div>

                {/* --- NUEVO APARTADO: ARCHIVAR AÑO ESCOLAR COMPLETO & INICIAR NUEVO CICLO --- */}
                <div className="mt-6 pt-5 border-t border-slate-200 space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <FolderArchive className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        Cierre y Archivo de Año Escolar Completo (MINERD)
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                        Guarda una copia congelada con todo el historial del año escolar saliente (calificaciones, asistencias, planificaciones y casos de psicología) y reinicia el sistema desde cero para el nuevo año lectivo.
                      </p>
                    </div>
                  </div>

                  {archiveSuccessMsg && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl font-bold text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{archiveSuccessMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Año Escolar a Cerrar / Archivar:</label>
                      <input
                        type="text"
                        disabled
                        value={formData.schoolYear || '2025-2026'}
                        className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg font-black text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nuevo Año Escolar Entrante:</label>
                      <input
                        type="text"
                        value={nextYearInput}
                        onChange={(e) => setNextYearInput(e.target.value)}
                        placeholder="Ej. 2026-2027"
                        className="w-full p-2 bg-white border border-indigo-300 rounded-lg font-black text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={preserveStaffCheck}
                          onChange={(e) => setPreserveStaffCheck(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <span>Conservar plantilla de docentes y coordinadores para el próximo año</span>
                      </label>
                      <span className="block text-[10px] text-slate-500 ml-6 mt-0.5">
                        Si está marcado, solo se limpian los planes diarios, calificaciones, asistencias y estudiantes, manteniendo sus maestros registrados.
                      </span>
                    </div>

                    <div className="sm:col-span-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowArchiveConfirmModal(true)}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <Archive className="w-4 h-4 text-amber-300" />
                        <span>Archivar Año Escolar {formData.schoolYear || '2025-2026'} e Iniciar Nuevo Año</span>
                      </button>
                    </div>
                  </div>

                  {/* Historial de Años Archivados */}
                  {archivesList.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        Histórico de Años Escolares Archivados ({archivesList.length}):
                      </h5>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {archivesList.map(arch => (
                          <div key={arch.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <span className="font-black text-slate-900">Año Lectivo {arch.schoolYear}</span>
                              <span className="text-[10px] text-slate-500 block">
                                Archivado el {new Date(arch.archivedAt).toLocaleDateString('es-DO')} • {arch.summary.totalStudents} estudiantes, {arch.summary.totalGrades} notas, {arch.summary.totalDailyPlans} planes
                              </span>
                            </div>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[10px] font-bold rounded-full border border-indigo-200">
                              Resguardado
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {importStatus && (
                  <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    {importStatus}
                  </p>
                )}
              </div>

              {/* Descargas de Aplicaciones Multi-Centro */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-600">
                  Descarga de Aplicación Institucional (Escritorio PC y Móvil Android)
                </h3>
                <p className="text-xs text-slate-600">
                  Ambas versiones están conectadas en tiempo real a la nube con sincronización instantánea para la Escuela Dr. José Francisco Peña Gómez.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <a
                    href="/windows-app.zip"
                    download="Sistema_MINERD_Windows_PC.zip"
                    className="p-3.5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Escritorio Windows</div>
                      <div className="text-[10px] text-blue-200">Laptop / PC (.zip)</div>
                    </div>
                  </a>

                  <a
                    href="/android-project-completo.zip"
                    download="Sistema_MINERD_Android_Studio.zip"
                    className="p-3.5 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">App Android</div>
                      <div className="text-[10px] text-emerald-200">Android Studio (.zip)</div>
                    </div>
                  </a>

                  <a
                    href="/ios-project-completo.zip"
                    download="Sistema_MINERD_iOS_Xcode.zip"
                    className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-md border border-slate-700/50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-300 shrink-0 font-black text-sm">
                      
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">App iPhone / iOS</div>
                      <div className="text-[10px] text-indigo-200">Proyecto Xcode (.zip)</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-indigo-950 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>Guardando en la Nube...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado con Éxito!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Guardar Ajustes</span>
                </>
              )}
            </button>
          </div>

      {/* Modal de Confirmación de Cierre y Archivo Anual */}
      {showArchiveConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 border border-amber-400/40 flex items-center justify-center">
              <FolderArchive className="w-6 h-6 text-amber-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                ¿Confirmar Archivo del Año Escolar {formData.schoolYear || '2025-2026'}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta acción creará una copia histórica permanente de todas las planificaciones, calificaciones y asistencias. Luego, <strong>se limpiarán los datos operativos</strong> para dejar la aplicación en blanco para el nuevo ciclo <strong>{nextYearInput}</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-semibold space-y-1">
              <p>• Los datos archivados quedarán resguardados de forma permanente.</p>
              <p>• El nuevo año escolar se configurará como: <strong>{nextYearInput}</strong>.</p>
              <p>• Plantilla de docentes: <strong>{preserveStaffCheck ? 'Se conservará intacta' : 'Se reiniciará'}</strong>.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => setShowArchiveConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isArchiving}
                onClick={handleArchiveSchoolYear}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isArchiving ? 'Archivando y Reiniciando...' : 'Sí, Archivar y Reiniciar'}
              </button>
            </div>
          </div>
        </div>
      )}

        </form>
      </div>
    </div>
  );
};
