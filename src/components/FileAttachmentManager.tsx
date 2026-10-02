import React, { useState, useRef } from 'react';
import { 
  Paperclip, 
  Upload, 
  Trash2, 
  Download, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileCheck,
  Plus, 
  X,
  AlertCircle,
  File,
  Eye,
  CheckCircle2,
  Sparkles,
  Layers,
  FileUp,
  FolderOpen
} from 'lucide-react';
import { PlanAttachment } from '../types/minerd';

interface FileAttachmentManagerProps {
  attachments: PlanAttachment[];
  onChange: (attachments: PlanAttachment[]) => void;
  title?: string;
  subtitle?: string;
  readOnly?: boolean;
  allowCategoryChange?: boolean;
  showApprovalNotice?: boolean;
}

export const FileAttachmentManager: React.FC<FileAttachmentManagerProps> = ({
  attachments = [],
  onChange,
  title = 'Archivos Adjuntos y Planificaciones Previas',
  subtitle = 'Arrastre o adjunte sus planificaciones previamente realizadas (PDF, Word, Excel), guías, rúbricas o enlaces de Google Drive para revisión y aprobación institucional.',
  readOnly = false,
  allowCategoryChange = true,
  showApprovalNotice = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkCategory, setLinkCategory] = useState<PlanAttachment['category']>('external_plan');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<PlanAttachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeInfo = (attachment: PlanAttachment) => {
    if (attachment.url && !attachment.dataUrl) {
      return {
        label: 'ENLACE',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        badgeBg: 'bg-indigo-500 text-white',
        icon: <LinkIcon className="w-5 h-5 text-indigo-600" />
      };
    }
    const name = (attachment.name || '').toLowerCase();
    const type = (attachment.type || '').toLowerCase();

    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return {
        label: 'PDF',
        color: 'text-rose-600 bg-rose-50 border-rose-200',
        badgeBg: 'bg-rose-500 text-white',
        icon: <FileText className="w-5 h-5 text-rose-600" />
      };
    }
    if (
      type.includes('sheet') || 
      type.includes('excel') || 
      type.includes('spreadsheet') || 
      name.endsWith('.xlsx') || 
      name.endsWith('.xls') || 
      name.endsWith('.csv')
    ) {
      return {
        label: 'EXCEL',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-600 text-white',
        icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
      };
    }
    if (
      type.includes('presentation') || 
      type.includes('powerpoint') || 
      name.endsWith('.pptx') || 
      name.endsWith('.ppt')
    ) {
      return {
        label: 'PPT',
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-500 text-white',
        icon: <FileSpreadsheet className="w-5 h-5 text-amber-600" />
      };
    }
    if (
      type.includes('image') || 
      name.endsWith('.png') || 
      name.endsWith('.jpg') || 
      name.endsWith('.jpeg') || 
      name.endsWith('.webp') ||
      name.endsWith('.svg')
    ) {
      return {
        label: 'IMAGEN',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        badgeBg: 'bg-purple-500 text-white',
        icon: <ImageIcon className="w-5 h-5 text-purple-600" />
      };
    }
    if (
      type.includes('word') || 
      type.includes('document') || 
      name.endsWith('.docx') || 
      name.endsWith('.doc')
    ) {
      return {
        label: 'WORD',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        badgeBg: 'bg-blue-600 text-white',
        icon: <FileCheck className="w-5 h-5 text-blue-600" />
      };
    }
    return {
      label: 'DOC',
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      badgeBg: 'bg-slate-600 text-white',
      icon: <File className="w-5 h-5 text-slate-600" />
    };
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'external_plan':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1 shadow-2xs">
            <FileText className="w-3 h-3 text-indigo-600" />
            Planificación Previa (Para Aprobación)
          </span>
        );
      case 'rubric':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-600" />
            Rúbrica / Instrumento
          </span>
        );
      case 'activity':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
            Ficha / Actividad
          </span>
        );
      case 'guide':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
            Guía Pedagógica
          </span>
        );
      case 'link':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-md flex items-center gap-1">
            <LinkIcon className="w-3 h-3 text-purple-600" />
            Enlace Cloud / Drive
          </span>
        );
      case 'image':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
            Lámina / Material Visual
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
            Recurso Adjunto
          </span>
        );
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const maxSizeBytes = 12 * 1024 * 1024; // 12MB limit per file
    const fileArray = Array.from(files);

    fileArray.forEach(file => {
      if (file.size > maxSizeBytes) {
        setErrorMsg(`El archivo "${file.name}" supera el tamaño máximo permitido de 12MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        let category: PlanAttachment['category'] = 'external_plan';
        const lower = file.name.toLowerCase();
        
        if (lower.includes('rubrica') || lower.includes('cotejo') || lower.includes('escala') || lower.includes('evaluacion')) {
          category = 'rubric';
        } else if (lower.includes('guia') || lower.includes('fasciculo') || lower.includes('secuencia')) {
          category = 'guide';
        } else if (lower.includes('actividad') || lower.includes('ejercicio') || lower.includes('tarea') || lower.includes('ficha')) {
          category = 'activity';
        } else if (file.type.startsWith('image/')) {
          category = 'image';
        } else {
          category = 'external_plan';
        }

        const newAttachment: PlanAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: result,
          category,
          uploadedAt: new Date().toISOString()
        };

        onChange([...attachments, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const title = linkTitle.trim() || finalUrl;

    const attachment: PlanAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: title,
      size: 0,
      type: 'url',
      url: finalUrl,
      category: linkCategory,
      uploadedAt: new Date().toISOString()
    };

    onChange([...attachments, attachment]);
    setLinkUrl('');
    setLinkTitle('');
    setIsAddingLink(false);
  };

  const handleRemoveAttachment = (id: string) => {
    onChange(attachments.filter(a => a.id !== id));
    if (previewItem?.id === id) {
      setPreviewItem(null);
    }
  };

  const handleUpdateCategory = (id: string, category: PlanAttachment['category']) => {
    onChange(attachments.map(a => a.id === id ? { ...a, category } : a));
  };

  const handleDownload = (item: PlanAttachment) => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.dataUrl) {
      const a = document.createElement('a');
      a.href = item.dataUrl;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      
      {/* Header with Title and Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Paperclip className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              {title}
            </h4>
            <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {attachments.length} {attachments.length === 1 ? 'adjunto' : 'adjuntos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl font-medium">
            {subtitle}
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddingLink(true)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Adjuntar Enlace Web</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Seleccionar Archivos</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.svg,.txt,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {/* Institutional Approval Notice Banner */}
      {showApprovalNotice && (
        <div className="p-3.5 bg-gradient-to-r from-amber-50/80 via-indigo-50/50 to-blue-50/80 border border-amber-200/80 rounded-2xl flex items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold">
              ✓
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Planificaciones Previas y Archivos Sujetos a Aprobación
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Los archivos de planificaciones anteriores o documentos adjuntos cargados aquí serán verificados y aprobados por la <strong>Dirección General (Licdo. Arnold Javier Sanchez)</strong> o por el equipo de <strong>Coordinación Pedagógica</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message if any */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between gap-2 animate-shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMsg(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal / Form for Web & Cloud Link */}
      {isAddingLink && (
        <form onSubmit={handleAddLink} className="p-4.5 bg-indigo-50/70 border border-indigo-200/90 rounded-2xl space-y-3.5 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-950 uppercase tracking-wider">
              <LinkIcon className="w-4 h-4 text-indigo-600" />
              <span>Adjuntar Enlace Web (Google Drive / Classroom / MINERD / Documentos Cloud)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingLink(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-indigo-100/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                URL / Enlace del Recurso *
              </label>
              <input
                type="text"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/... o enlace web"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Tipo / Categoría
              </label>
              <select
                value={linkCategory}
                onChange={(e) => setLinkCategory(e.target.value as PlanAttachment['category'])}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
              >
                <option value="external_plan">Planificación Previa (Para Aprobación)</option>
                <option value="guide">Guía Didáctica / Fascículo</option>
                <option value="rubric">Rúbrica / Instrumento de Evaluación</option>
                <option value="activity">Ficha de Actividad / Tarea</option>
                <option value="link">Enlace Digital / Carpeta Drive</option>
                <option value="other">Otro Recurso Educativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
              Nombre o Título Descriptivo (Opcional)
            </label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Ej: Planificación de Unidad 2 en Google Docs - 4to Grado"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingLink(false)}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
            >
              Guardar Enlace
            </button>
          </div>
        </form>
      )}

      {/* Modern Stylized Tailwind Dropzone Area */}
      {!readOnly && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/80 scale-[1.01] shadow-md ring-4 ring-indigo-100'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30'
          }`}
        >
          {/* Subtle decorative background pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-100/30 pointer-events-none" />

          <div className="relative flex flex-col items-center justify-center gap-2.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 ${
              isDragging ? 'bg-indigo-600 text-white scale-110' : 'bg-indigo-100/80 text-indigo-600'
            }`}>
              {isDragging ? (
                <FileUp className="w-6 h-6 animate-bounce" />
              ) : (
                <Upload className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>

            <div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                {isDragging ? '¡Suelta tus archivos aquí!' : (
                  <>Arrastra y suelta tus archivos aquí, o <span className="text-indigo-600 underline font-black">examina tu equipo</span></>
                )}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Soporta archivos <strong>PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)</strong> e imágenes hasta 12MB.
              </p>
            </div>

            {/* Quick format tags */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center pt-1">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                PDF
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                DOCX / Word
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                XLSX / Excel
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                PPTX / Presentación
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                PNG / JPG
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Attachments List with Enhanced Type Previews */}
      {attachments.length > 0 ? (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Documentos y Recursos Adjuntos ({attachments.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Sujeto a aprobación por Dirección y Coordinación
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {attachments.map((item) => {
              const fileInfo = getFileTypeInfo(item);
              const isImage = item.type?.startsWith('image/') || (item.dataUrl && item.dataUrl.startsWith('data:image/'));

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 hover:shadow-xs transition-all gap-3 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Thumbnail for image or stylized icon badge */}
                    {isImage && item.dataUrl ? (
                      <div 
                        onClick={() => setPreviewItem(item)}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-purple-200 bg-slate-50 shrink-0 cursor-pointer relative group/img"
                        title="Clic para ver vista previa"
                      >
                        <img 
                          src={item.dataUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" 
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${fileInfo.color}`}>
                        {fileInfo.icon}
                        <span className={`text-[9px] font-black px-1 rounded-sm mt-0.5 leading-none ${fileInfo.badgeBg}`}>
                          {fileInfo.label}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-extrabold text-slate-900 truncate max-w-md">
                          {item.name}
                        </p>
                        {getCategoryBadge(item.category)}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        {item.size > 0 && (
                          <span className="font-semibold text-slate-600">{formatFileSize(item.size)}</span>
                        )}
                        {item.size > 0 && <span>•</span>}
                        <span>
                          {new Date(item.uploadedAt).toLocaleDateString('es-DO', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>

                        {/* Category changer if permitted */}
                        {!readOnly && allowCategoryChange && (
                          <>
                            <span>•</span>
                            <select
                              value={item.category || 'external_plan'}
                              onChange={(e) => handleUpdateCategory(item.id, e.target.value as PlanAttachment['category'])}
                              className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md px-1.5 py-0.5 border-none outline-none cursor-pointer"
                            >
                              <option value="external_plan">Planificación Previa</option>
                              <option value="guide">Guía Didáctica</option>
                              <option value="rubric">Rúbrica</option>
                              <option value="activity">Ficha de Actividad</option>
                              <option value="link">Enlace Cloud</option>
                              <option value="other">Otro Recurso</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Preview / Download / Delete) */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      title="Ver detalles o vista previa"
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      title={item.url ? 'Abrir enlace externo' : 'Descargar archivo'}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                    >
                      {item.url ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(item.id)}
                        title="Eliminar adjunto"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-xs text-slate-400 font-medium">
          No hay archivos adjuntos ni planificaciones previas agregadas.
        </div>
      )}

      {/* Preview Modal / Lightbox for Files & Images */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  {getFileTypeInfo(previewItem).icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-slate-900 truncate">
                    {previewItem.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getCategoryBadge(previewItem.category)}
                    {previewItem.size > 0 && (
                      <span className="text-xs text-slate-400 font-semibold">{formatFileSize(previewItem.size)}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="py-2">
              {previewItem.dataUrl && (previewItem.type?.startsWith('image/') || previewItem.dataUrl.startsWith('data:image/')) ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[400px]">
                  <img 
                    src={previewItem.dataUrl} 
                    alt={previewItem.name} 
                    className="max-h-[400px] w-auto object-contain" 
                  />
                </div>
              ) : previewItem.url ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <ExternalLink className="w-10 h-10 text-indigo-600 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Enlace Externo / Cloud</p>
                    <p className="text-xs text-indigo-600 font-medium break-all mt-1">{previewItem.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(previewItem.url, '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en Nueva Pestaña</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">{previewItem.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      Este documento está listo para ser revisado por la Dirección o Coordinación Pedagógica.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(previewItem)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-950 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Documento</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewItem)}
                className="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
