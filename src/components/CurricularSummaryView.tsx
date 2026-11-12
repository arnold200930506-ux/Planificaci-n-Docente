import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
  FileEdit,
  Layers,
  CalendarDays,
  CalendarRange,
  BookOpen,
  Filter
} from 'lucide-react';
import { DailyPlan, WeeklyPlan, LearningUnit } from '../types/minerd';

interface CurricularSummaryViewProps {
  dailyPlans: DailyPlan[];
  weeklyPlans: WeeklyPlan[];
  learningUnits: LearningUnit[];
}

type PlanCategoryFilter = 'all' | 'daily' | 'weekly' | 'unit';
type NormalizedStatus = 'borrador' | 'enviado' | 'aprobado';

interface NormalizedPlanItem {
  id: string;
  title: string;
  planType: 'daily' | 'weekly' | 'unit';
  planTypeLabel: string;
  area: string;
  grade: string;
  status: NormalizedStatus;
}

const STATUS_COLORS: Record<NormalizedStatus, string> = {
  aprobado: '#16A34A', // Emerald 600
  enviado: '#D97706',  // Amber 600
  borrador: '#64748B'  // Slate 500
};

const STATUS_LABELS: Record<NormalizedStatus, string> = {
  aprobado: 'Aprobado',
  enviado: 'Enviado',
  borrador: 'Borrador'
};

function normalizePlanStatus(rawStatus?: string, rawReviewStatus?: string): NormalizedStatus {
  if (rawReviewStatus === 'approved') {
    return 'aprobado';
  }
  if (rawStatus === 'draft' && rawReviewStatus !== 'pending' && rawReviewStatus !== 'returned') {
    return 'borrador';
  }
  if (rawReviewStatus === 'pending' || rawReviewStatus === 'returned' || rawStatus === 'completed') {
    return 'enviado';
  }
  if (rawStatus === 'draft') {
    return 'borrador';
  }
  return 'enviado';
}

function normalizeAreaName(area?: string, level?: string, grade?: string): string {
  const isInicial =
    level === 'inicial' ||
    (grade &&
      (grade.toLowerCase().includes('inicial') ||
        grade.toLowerCase().includes('kínder') ||
        grade.toLowerCase().includes('kinder') ||
        grade.toLowerCase().includes('párvulo') ||
        grade.toLowerCase().includes('pre-primario')));

  if (isInicial && (!area || area.toLowerCase().includes('integral') || area === 'Lengua Española')) {
    return 'Nivel Inicial (Dominios)';
  }
  if (!area || !area.trim()) {
    return 'General / Multidisciplinar';
  }
  if (area.includes('Formación Integral')) {
    return 'Formación Humana';
  }
  if (area.includes('Lenguas Extranjeras')) {
    return 'Lenguas Extranjeras';
  }
  if (area.includes('Desarrollo Integral')) {
    return 'Nivel Inicial (Dominios)';
  }
  return area.trim();
}

export const CurricularSummaryView: React.FC<CurricularSummaryViewProps> = ({
  dailyPlans,
  weeklyPlans,
  learningUnits
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PlanCategoryFilter>('all');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'percentage' | 'count'>('percentage');

  // Consolidate all plans into a unified analytical dataset
  const allItems = useMemo<NormalizedPlanItem[]>(() => {
    const items: NormalizedPlanItem[] = [];

    dailyPlans.forEach((p) => {
      items.push({
        id: p.id,
        title: p.unitTheme || p.title || 'Plan Diario',
        planType: 'daily',
        planTypeLabel: 'Planes Diarios',
        area: normalizeAreaName(p.area, p.level, p.grade),
        grade: p.grade || 'Sin grado',
        status: normalizePlanStatus(p.status, p.reviewStatus)
      });
    });

    weeklyPlans.forEach((w) => {
      items.push({
        id: w.id,
        title: w.unitTitle || w.title || 'Plan Semanal',
        planType: 'weekly',
        planTypeLabel: 'Planes Semanales',
        area: normalizeAreaName(w.area, w.level, w.grade),
        grade: w.grade || 'Sin grado',
        status: normalizePlanStatus(w.status, w.reviewStatus)
      });
    });

    learningUnits.forEach((u) => {
      items.push({
        id: u.id,
        title: u.title || 'Unidad de Aprendizaje',
        planType: 'unit',
        planTypeLabel: 'Unidades Didácticas',
        area: normalizeAreaName(u.area, u.level, u.grade),
        grade: u.grade || 'Sin grado',
        status: normalizePlanStatus(u.status, u.reviewStatus)
      });
    });

    return items;
  }, [dailyPlans, weeklyPlans, learningUnits]);

  // Unique pedagogical areas present
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((item) => set.add(item.area));
    return Array.from(set).sort();
  }, [allItems]);

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.planType === selectedCategory;
      const matchArea = selectedAreaFilter === 'all' || item.area === selectedAreaFilter;
      return matchCat && matchArea;
    });
  }, [allItems, selectedCategory, selectedAreaFilter]);

  // Global Status Summary (Borrador, Enviado, Aprobado)
  const statusSummary = useMemo(() => {
    const total = filteredItems.length;
    const counts: Record<NormalizedStatus, number> = {
      borrador: 0,
      enviado: 0,
      aprobado: 0
    };

    filteredItems.forEach((item) => {
      counts[item.status]++;
    });

    const pct = (val: number) => (total > 0 ? Number(((val / total) * 100).toFixed(1)) : 0);

    return {
      total,
      borradorCount: counts.borrador,
      borradorPct: pct(counts.borrador),
      enviadoCount: counts.enviado,
      enviadoPct: pct(counts.enviado),
      aprobadoCount: counts.aprobado,
      aprobadoPct: pct(counts.aprobado),
      pieData: [
        {
          name: 'Aprobado',
          key: 'aprobado' as NormalizedStatus,
          value: counts.aprobado,
          percentage: pct(counts.aprobado),
          color: STATUS_COLORS.aprobado
        },
        {
          name: 'Enviado',
          key: 'enviado' as NormalizedStatus,
          value: counts.enviado,
          percentage: pct(counts.enviado),
          color: STATUS_COLORS.enviado
        },
        {
          name: 'Borrador',
          key: 'borrador' as NormalizedStatus,
          value: counts.borrador,
          percentage: pct(counts.borrador),
          color: STATUS_COLORS.borrador
        }
      ]
    };
  }, [filteredItems]);

  // Breakdown by Plan Type (Diarios, Semanales, Unidades)
  const planTypeBreakdown = useMemo(() => {
    const types: Array<{ key: 'daily' | 'weekly' | 'unit'; label: string }> = [
      { key: 'daily', label: 'Planes Diarios' },
      { key: 'weekly', label: 'Planes Semanales' },
      { key: 'unit', label: 'Unidades' }
    ];

    return types.map((t) => {
      const subset = allItems.filter(
        (i) => i.planType === t.key && (selectedAreaFilter === 'all' || i.area === selectedAreaFilter)
      );
      const total = subset.length;
      const borrador = subset.filter((i) => i.status === 'borrador').length;
      const enviado = subset.filter((i) => i.status === 'enviado').length;
      const aprobado = subset.filter((i) => i.status === 'aprobado').length;

      const pct = (v: number) => (total > 0 ? Number(((v / total) * 100).toFixed(1)) : 0);

      return {
        type: t.label,
        key: t.key,
        total,
        Borrador: chartMode === 'percentage' ? pct(borrador) : borrador,
        Enviado: chartMode === 'percentage' ? pct(enviado) : enviado,
        Aprobado: chartMode === 'percentage' ? pct(aprobado) : aprobado,
        borradorCount: borrador,
        enviadoCount: enviado,
        aprobadoCount: aprobado,
        borradorPct: pct(borrador),
        enviadoPct: pct(enviado),
        aprobadoPct: pct(aprobado)
      };
    });
  }, [allItems, selectedAreaFilter, chartMode]);

  // Breakdown by Pedagogical Area (Asignatura / Dominio)
  const areaBreakdown = useMemo(() => {
    const defaultAreas = [
      'Lengua Española',
      'Matemática',
      'Ciencias Sociales',
      'Ciencias de la Naturaleza',
      'Educación Artística',
      'Educación Física',
      'Formación Humana',
      'Lenguas Extranjeras',
      'Nivel Inicial (Dominios)'
    ];

    const areaMap = new Map<
      string,
      {
        area: string;
        total: number;
        borrador: number;
        enviado: number;
        aprobado: number;
        daily: number;
        weekly: number;
        unit: number;
      }
    >();

    // Seed areas that have items, or default areas if empty so chart is always informative
    const sourceItems = allItems.filter(
      (i) => selectedCategory === 'all' || i.planType === selectedCategory
    );

    if (sourceItems.length === 0) {
      defaultAreas.slice(0, 6).forEach((area) => {
        areaMap.set(area, {
          area,
          total: 0,
          borrador: 0,
          enviado: 0,
          aprobado: 0,
          daily: 0,
          weekly: 0,
          unit: 0
        });
      });
    } else {
      sourceItems.forEach((item) => {
        if (!areaMap.has(item.area)) {
          areaMap.set(item.area, {
            area: item.area,
            total: 0,
            borrador: 0,
            enviado: 0,
            aprobado: 0,
            daily: 0,
            weekly: 0,
            unit: 0
          });
        }
        const entry = areaMap.get(item.area)!;
        entry.total++;
        entry[item.status]++;
        entry[item.planType]++;
      });
    }

    const globalTotal = Math.max(sourceItems.length, 1);

    return Array.from(areaMap.values())
      .sort((a, b) => b.total - a.total)
      .map((entry) => {
        const pct = (v: number) =>
          entry.total > 0 ? Number(((v / entry.total) * 100).toFixed(1)) : 0;
        const shareOfSchoolPct =
          sourceItems.length > 0 ? Number(((entry.total / globalTotal) * 100).toFixed(1)) : 0;

        return {
          ...entry,
          shortArea: entry.area.length > 18 ? entry.area.slice(0, 16) + '…' : entry.area,
          Borrador: chartMode === 'percentage' ? pct(entry.borrador) : entry.borrador,
          Enviado: chartMode === 'percentage' ? pct(entry.enviado) : entry.enviado,
          Aprobado: chartMode === 'percentage' ? pct(entry.aprobado) : entry.aprobado,
          borradorPct: pct(entry.borrador),
          enviadoPct: pct(entry.enviado),
          aprobadoPct: pct(entry.aprobado),
          shareOfSchoolPct
        };
      });
  }, [allItems, selectedCategory, chartMode]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 sm:p-7 space-y-6">
      {/* Header & Interactive Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-4 h-4" />
            <span>Analítica Pedagógica MINERD</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{statusSummary.total} planificaciones evaluadas</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Resumen Curricular: Estado de Planificaciones y Áreas Pedagógicas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Distribución porcentual de planes diarios, semanales y unidades didácticas clasificados por estado (borrador, enviado y aprobado) y asignatura.
          </p>
        </div>

        {/* Interactive Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Plan Category Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700">
            {[
              { id: 'all', label: 'Todos', count: allItems.length },
              { id: 'daily', label: 'Diarios', count: dailyPlans.length },
              { id: 'weekly', label: 'Semanales', count: weeklyPlans.length },
              { id: 'unit', label: 'Unidades', count: learningUnits.length }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as PlanCategoryFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label} <span className="font-mono tabular-nums opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Area Selector */}
          <div className="relative">
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="py-2 px-3 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las Áreas Pedagógicas</option>
              {availableAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Toggle (% vs Count) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setChartMode('percentage')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === 'percentage'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Porcentaje (%)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('count')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                chartMode === 'count'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Cantidad (#)
            </button>
          </div>
        </div>
      </div>

      {/* Top Status KPI Strip: Borrador, Enviado, Aprobado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Borrador */}
        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <FileEdit className="w-3.5 h-3.5 text-slate-500" />
              <span>Estado: Borrador</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {statusSummary.borradorPct}%
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                ({statusSummary.borradorCount} de {statusSummary.total})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              En elaboración por el docente
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-mono font-bold text-xs tabular-nums">
            {statusSummary.borradorCount}
          </div>
        </div>

        {/* Enviado */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Estado: Enviado (En Revisión)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono tabular-nums">
                {statusSummary.enviadoPct}%
              </span>
              <span className="text-xs font-mono tabular-nums text-amber-700/80 dark:text-amber-400/80">
                ({statusSummary.enviadoCount} de {statusSummary.total})
              </span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70">
              Remitidos a Coordinación / Dirección
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center font-mono font-bold text-xs tabular-nums">
            {statusSummary.enviadoCount}
          </div>
        </div>

        {/* Aprobado */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estado: Aprobado</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                {statusSummary.aprobadoPct}%
              </span>
              <span className="text-xs font-mono tabular-nums text-emerald-700/80 dark:text-emerald-400/80">
                ({statusSummary.aprobadoCount} de {statusSummary.total})
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/70">
              Validados por Coordinación Pedagógica
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs tabular-nums">
            {statusSummary.aprobadoCount}
          </div>
        </div>
      </div>

      {/* Main Data Visualization Grid: Left (Donut + Type Chart) | Right (Stacked Bar Chart by Pedagogical Area) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (5 cols): Distribution by Status & Plan Type */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              1. Proporción por Estado y Tipo de Plan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparativa entre Planes Diarios, Semanales y Unidades
            </p>
          </div>

          {statusSummary.total === 0 ? (
            <div className="py-10 text-center space-y-2">
              <PieChartIcon className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sin planes registrados en este filtro
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Al registrar planes diarios, semanales o unidades, verá aquí la proporción automática por estado.
              </p>
            </div>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusSummary.pieData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusSummary.pieData
                      .filter((d) => d.value > 0)
                      .map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${value} planes (${props?.payload?.percentage ?? 0}%)`,
                      String(name)
                    ]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  />
                  <Legend verticalAlign="bottom" height={28} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Breakdown Bars by Plan Type (Diarios, Semanales, Unidades) */}
          <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/70">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Desglose por Modalidad de Planificación:
            </p>
            {planTypeBreakdown.map((row) => (
              <div key={row.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{row.type}</span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-400">
                    {row.total} total · Aprob: {row.aprobadoPct}% · Env: {row.enviadoPct}% · Borr: {row.borradorPct}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  {row.aprobadoPct > 0 && (
                    <div
                      style={{ width: `${row.aprobadoPct}%`, backgroundColor: STATUS_COLORS.aprobado }}
                      title={`Aprobado: ${row.aprobadoCount} (${row.aprobadoPct}%)`}
                      className="h-full transition-all duration-300"
                    />
                  )}
                  {row.enviadoPct > 0 && (
                    <div
                      style={{ width: `${row.enviadoPct}%`, backgroundColor: STATUS_COLORS.enviado }}
                      title={`Enviado: ${row.enviadoCount} (${row.enviadoPct}%)`}
                      className="h-full transition-all duration-300"
                    />
                  )}
                  {row.borradorPct > 0 && (
                    <div
                      style={{ width: `${row.borradorPct}%`, backgroundColor: STATUS_COLORS.borrador }}
                      title={`Borrador: ${row.borradorCount} (${row.borradorPct}%)`}
                      className="h-full transition-all duration-300"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (7 cols): Stacked Bar Chart by Pedagogical Area */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                2. Clasificación por Área Pedagógica y Estado ({chartMode === 'percentage' ? '%' : '#'})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Porcentaje y volumen de planes (Borrador, Enviado y Aprobado) en cada asignatura o dominio
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={areaBreakdown}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.35} />
                <XAxis
                  type="number"
                  domain={chartMode === 'percentage' ? [0, 100] : [0, 'auto']}
                  tickFormatter={(v) => (chartMode === 'percentage' ? `${v}%` : `${v}`)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="shortArea"
                  width={130}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    chartMode === 'percentage' ? `${value}%` : `${value} planes`,
                    String(name)
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="Aprobado"
                  stackId="status"
                  fill={STATUS_COLORS.aprobado}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Enviado"
                  stackId="status"
                  fill={STATUS_COLORS.enviado}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Borrador"
                  stackId="status"
                  fill={STATUS_COLORS.borrador}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Tabular Summary by Pedagogical Area */}
          <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/80 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Área Pedagógica</th>
                  <th className="py-2.5 px-2 text-right">Diarios / Sem / Unid</th>
                  <th className="py-2.5 px-2 text-right">Borrador</th>
                  <th className="py-2.5 px-2 text-right">Enviado</th>
                  <th className="py-2.5 px-3 text-right">Aprobado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                {areaBreakdown.map((item) => (
                  <tr
                    key={item.area}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                      {item.area}
                      <span className="ml-1.5 text-[10px] font-normal text-slate-500">
                        ({item.shareOfSchoolPct}% del centro)
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">
                      {item.daily}D · {item.weekly}S · {item.unit}U
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">
                      {item.borradorPct}% ({item.borrador})
                    </td>
                    <td className="py-2 px-2 text-right text-amber-700 dark:text-amber-400 font-bold">
                      {item.enviadoPct}% ({item.enviado})
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                      {item.aprobadoPct}% ({item.aprobado})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
