export interface StorageInitErrorInfo {
  scope: 'config' | 'teachers' | 'coordinators' | 'plans' | 'state' | 'general';
  message: string;
  timestamp: string;
  originalError?: any;
}

export interface CloudSubscriptionCallbacks {
  onConfig?: (config: SchoolConfig) => void;
  onTeachers?: (teachers: Teacher[]) => void;
  onCoordinators?: (coordinators: Coordinator[]) => void;
  onOrientators?: (orientators: Orientator[]) => void;
  onStudents?: (students: Student[]) => void;
  onDailyPlans?: (plans: DailyPlan[]) => void;
  onWeeklyPlans?: (plans: WeeklyPlan[]) => void;
  onLearningUnits?: (units: LearningUnit[]) => void;
  onPsychologyReports?: (reports: PsychologyCaseReport[]) => void;
  onError?: (scope: string, error: any) => void;
}

import {
  DailyPlan,
  WeeklyPlan,
  LearningUnit,
  SchoolConfig,
  Teacher,
  Coordinator,
  Orientator,
  PsychologyCaseReport,
  ReviewStatus,
  UserRole,
  Student,
  DailyGradeAttendanceSummary,
  StudentSubjectGrade
} from '../types/minerd';
import {
  DEFAULT_SCHOOL_CONFIG,
  DEFAULT_STUDENTS
} from '../data/minerdCurriculum';
import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc,
  getDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';

// Normalized helper to get clean school code
function normalizeSchoolCode(code?: string): string {
  if (!code) return '14668';
  const clean = code.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return clean || '14668';
}

function getStoredSchoolCode(): string {
  try {
    const raw = localStorage.getItem('minerd_current_school_code');
    if (raw) return normalizeSchoolCode(raw);
    const cfg = localStorage.getItem('minerd_school_config_v5');
    if (cfg) {
      const parsed = JSON.parse(cfg);
      if (parsed?.schoolCode) return normalizeSchoolCode(parsed.schoolCode);
    }
  } catch {}
  return '14668';
}

function setStoredSchoolCode(code: string): void {
  try {
    localStorage.setItem('minerd_current_school_code', normalizeSchoolCode(code));
  } catch {}
}

const getStorageKeys = (schoolCode: string) => {
  const code = normalizeSchoolCode(schoolCode);
  return {
    CONFIG: `minerd_cfg_${code}_v5`,
    DAILY_PLANS: `minerd_daily_${code}_v4`,
    WEEKLY_PLANS: `minerd_weekly_${code}_v4`,
    LEARNING_UNITS: `minerd_units_${code}_v4`,
    TEACHERS: `minerd_teachers_${code}_v4`,
    COORDINATORS: `minerd_coords_${code}_v4`,
    ORIENTATORS: `minerd_orientators_${code}_v4`,
    PSYCHOLOGY_REPORTS: `minerd_psychology_${code}_v4`,
    STUDENTS: `minerd_students_${code}_v4`,
    GRADE_ATTENDANCE: `minerd_grade_attendance_${code}_v1`,
    DELETED_TEACHERS: `minerd_deleted_teachers_${code}_v1`,
    STUDENT_GRADES: `minerd_student_grades_${code}_v1`,
    ARCHIVES: `minerd_archives_${code}_v1`
  };
};

function isLegacyDemoCoordinator(id: string, name?: string): boolean {
  if (!id) return false;
  if (id.startsWith('coord-00')) return true;
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    lower.includes('rafael antonio marte') ||
    lower.includes('ramona estévez') ||
    lower.includes('domingo antonio polanco') ||
    lower.includes('altagracia núñez')
  );
}

function isLegacyDemoDailyPlan(id: string, title?: string, unitTheme?: string): boolean {
  if (!id) return false;
  if (id.startsWith('dp-00') || id.startsWith('dp-demo') || id.startsWith('plan-00') || id === 'dp-01' || id === 'dp-02') return true;
  const str = `${title || ''} ${unitTheme || ''}`.toLowerCase();
  return (
    str.includes('la noticia: estructura') ||
    str.includes('fracciones propias e impropias') ||
    str.includes('ecosistemas y biodiversidad')
  );
}

function isLegacyDemoWeeklyPlan(id: string, title?: string, unitTitle?: string): boolean {
  if (!id) return false;
  if (id.startsWith('wp-00') || id.startsWith('wp-demo') || id.startsWith('weekly-00') || id === 'wp-01' || id === 'wp-02') return true;
  const str = `${title || ''} ${unitTitle || ''}`.toLowerCase();
  return (
    str.includes('la noticia') ||
    str.includes('fracciones') ||
    str.includes('ecosistemas')
  );
}

function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? null : value))
  );
}

function mergeById<T extends { id: string }>(localItems: T[], cloudItems: T[]): T[] {
  const map = new Map<string, T>();
  localItems.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  cloudItems.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
}

// Recuperación automática no destructiva de claves anteriores en localStorage
function recoverLegacyLocalStorageData() {
  try {
    const currentCode = getStoredSchoolCode();
    const keys = getStorageKeys(currentCode);

    const tryRecoverList = (targetKey: string, legacyCandidateKeys: string[]) => {
      const existingRaw = localStorage.getItem(targetKey);
      let existingList: any[] = [];
      try {
        if (existingRaw) {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed)) existingList = parsed;
        }
      } catch {}

      const map = new Map<string, any>();
      existingList.forEach((item, i) => map.set(item?.id || `e_${i}`, item));

      let recoveredAny = false;
      for (const lKey of legacyCandidateKeys) {
        if (lKey === targetKey) continue;
        try {
          const raw = localStorage.getItem(lKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach((item, i) => {
                const id = item?.id || `r_${i}`;
                if (!map.has(id)) {
                  map.set(id, item);
                  recoveredAny = true;
                }
              });
            }
          }
        } catch {}
      }

      if (recoveredAny) {
        localStorage.setItem(targetKey, JSON.stringify(Array.from(map.values())));
      }
    };

    tryRecoverList(keys.DAILY_PLANS, [
      `minerd_daily_${currentCode}_v3`,
      `minerd_daily_${currentCode}_v2`,
      `minerd_daily_${currentCode}_v1`,
      'minerd_daily_plans_v4',
      'minerd_daily_plans_v3',
      'minerd_daily_plans_v2',
      'minerd_daily_plans'
    ]);
    tryRecoverList(keys.WEEKLY_PLANS, [
      `minerd_weekly_${currentCode}_v3`,
      `minerd_weekly_${currentCode}_v2`,
      'minerd_weekly_plans_v4',
      'minerd_weekly_plans_v3',
      'minerd_weekly_plans'
    ]);
    tryRecoverList(keys.LEARNING_UNITS, [
      `minerd_units_${currentCode}_v3`,
      `minerd_units_${currentCode}_v2`,
      'minerd_learning_units_v4',
      'minerd_learning_units_v3',
      'minerd_learning_units'
    ]);
    tryRecoverList(keys.TEACHERS, [
      `minerd_teachers_${currentCode}_v3`,
      `minerd_teachers_${currentCode}_v2`,
      'minerd_teachers_v4',
      'minerd_teachers_v3',
      'minerd_teachers'
    ]);
    tryRecoverList(keys.COORDINATORS, [
      `minerd_coords_${currentCode}_v3`,
      'minerd_coordinators_v4',
      'minerd_coordinators_v3',
      'minerd_coordinators'
    ]);
    tryRecoverList(keys.ORIENTATORS, [
      `minerd_orientators_${currentCode}_v3`,
      'minerd_orientators_v4',
      'minerd_orientators'
    ]);
    tryRecoverList(keys.PSYCHOLOGY_REPORTS, [
      `minerd_psychology_${currentCode}_v3`,
      'minerd_psychology_reports_v4',
      'minerd_psychology_reports'
    ]);

    // Recuperar estudiantes de cualquier clave previa en localStorage
    const allStudentCandidateKeys = [
      `minerd_students_${currentCode}_v3`,
      `minerd_students_${currentCode}_v2`,
      `minerd_students_${currentCode}_v1`,
      'minerd_students_v4',
      'minerd_students_v3',
      'minerd_students'
    ];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes('students') && k !== keys.STUDENTS && !allStudentCandidateKeys.includes(k)) {
        allStudentCandidateKeys.push(k);
      }
    }
    tryRecoverList(keys.STUDENTS, allStudentCandidateKeys);
  } catch (e) {
    console.warn('Legacy localStorage recovery warning:', e);
  }
}

recoverLegacyLocalStorageData();

function pushToServerMirror(schoolCode: string, payload: Record<string, any>) {
  if (typeof window === 'undefined') return;
  fetch('/api/storage/mirror', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schoolCode, payload })
  }).catch(() => {});
}

export const storageService = {
  getCurrentSchoolCode(): string {
    return getStoredSchoolCode();
  },

  setCurrentSchoolCode(code: string): void {
    setStoredSchoolCode(code);
  },

  // --- Sincronización con el Espejo Persistente del Servidor (.data/school_storage_mirror.json) ---
  async syncWithServerMirror(callbacks?: CloudSubscriptionCallbacks): Promise<void> {
    if (typeof window === 'undefined') return;
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);

    try {
      // 1. Obtener datos guardados en el disco del servidor
      const res = await fetch(`/api/storage/mirror?schoolCode=${encodeURIComponent(currentCode)}`);
      if (res.ok) {
        const json = await res.json();
        const serverData = json?.data;
        if (serverData) {
          if (serverData.config) {
            const mergedCfg = { ...this.getConfig(), ...serverData.config, schoolCode: currentCode };
            localStorage.setItem(keys.CONFIG, JSON.stringify(mergedCfg));
            callbacks?.onConfig?.(mergedCfg);
          }
          if (Array.isArray(serverData.teachers) && serverData.teachers.length > 0) {
            const deletedIds = this.getDeletedTeacherIds();
            const merged = mergeById(this.getTeachers(), serverData.teachers).filter(
              (t) => !deletedIds.includes(t.id)
            );
            localStorage.setItem(keys.TEACHERS, JSON.stringify(merged));
            callbacks?.onTeachers?.(merged);
          }
          if (Array.isArray(serverData.coordinators) && serverData.coordinators.length > 0) {
            const merged = mergeById(this.getCoordinators(), serverData.coordinators);
            localStorage.setItem(keys.COORDINATORS, JSON.stringify(merged));
            callbacks?.onCoordinators?.(merged);
          }
          if (Array.isArray(serverData.orientators) && serverData.orientators.length > 0) {
            const merged = mergeById(this.getOrientators(), serverData.orientators);
            localStorage.setItem(keys.ORIENTATORS, JSON.stringify(merged));
            callbacks?.onOrientators?.(merged);
          }
          if (Array.isArray(serverData.students) && serverData.students.length > 0) {
            const merged = mergeById(this.getStudents(), serverData.students);
            localStorage.setItem(keys.STUDENTS, JSON.stringify(merged));
            callbacks?.onStudents?.(merged);
          }
          if (Array.isArray(serverData.dailyPlans) && serverData.dailyPlans.length > 0) {
            const merged = mergeById(this.getDailyPlans(), serverData.dailyPlans);
            localStorage.setItem(keys.DAILY_PLANS, JSON.stringify(merged));
            callbacks?.onDailyPlans?.(merged);
          }
          if (Array.isArray(serverData.weeklyPlans) && serverData.weeklyPlans.length > 0) {
            const merged = mergeById(this.getWeeklyPlans(), serverData.weeklyPlans);
            localStorage.setItem(keys.WEEKLY_PLANS, JSON.stringify(merged));
            callbacks?.onWeeklyPlans?.(merged);
          }
          if (Array.isArray(serverData.learningUnits) && serverData.learningUnits.length > 0) {
            const merged = mergeById(this.getLearningUnits(), serverData.learningUnits);
            localStorage.setItem(keys.LEARNING_UNITS, JSON.stringify(merged));
            callbacks?.onLearningUnits?.(merged);
          }
          if (Array.isArray(serverData.psychologyReports) && serverData.psychologyReports.length > 0) {
            const merged = mergeById(this.getPsychologyReports(), serverData.psychologyReports);
            localStorage.setItem(keys.PSYCHOLOGY_REPORTS, JSON.stringify(merged));
            callbacks?.onPsychologyReports?.(merged);
          }
        }
      }

      // 2. Respaldar el estado local actual hacia el servidor
      pushToServerMirror(currentCode, {
        config: this.getConfig(),
        teachers: this.getTeachers(),
        coordinators: this.getCoordinators(),
        orientators: this.getOrientators(),
        students: this.getStudents(),
        dailyPlans: this.getDailyPlans(),
        weeklyPlans: this.getWeeklyPlans(),
        learningUnits: this.getLearningUnits(),
        psychologyReports: this.getPsychologyReports()
      });
    } catch (e) {
      console.warn('Server mirror sync warning:', e);
    }
  },

  // --- Control de Autonomía Local / Ahorro de Base de Datos en la Nube ---
  getSyncMode(): 'eco' | 'local_only' | 'realtime' {
    try {
      const mode = localStorage.getItem('minerd_storage_sync_mode') as 'eco' | 'local_only' | 'realtime' | null;
      if (mode === 'local_only' || mode === 'eco' || mode === 'realtime') return mode;
    } catch {}
    return 'eco'; // Por defecto: Modo Ahorro Extremo (Local + Servidor Propio + Nube bajo demanda)
  },

  setSyncMode(mode: 'eco' | 'local_only' | 'realtime'): void {
    try {
      localStorage.setItem('minerd_storage_sync_mode', mode);
    } catch {}
  },

  isCloudQuotaPaused(): boolean {
    try {
      const pausedUntil = Number(localStorage.getItem('minerd_cloud_quota_paused_until') || '0');
      return Date.now() < pausedUntil;
    } catch {
      return false;
    }
  },

  markCloudQuotaExhausted(): void {
    try {
      // Pausar lecturas automáticas a Firebase por 2 horas si la cuota gratuita diaria se agotó
      localStorage.setItem('minerd_cloud_quota_paused_until', String(Date.now() + 2 * 60 * 60 * 1000));
    } catch {}
  },

  clearCloudQuotaPause(): void {
    try {
      localStorage.removeItem('minerd_cloud_quota_paused_until');
      localStorage.removeItem('minerd_last_cloud_pull_ts');
    } catch {}
  },

  // --- Descarga única y compacta desde Firebase (consume ~95% menos lecturas que onSnapshot permanente) ---
  async syncCloudOnce(callbacks?: CloudSubscriptionCallbacks, force = false): Promise<void> {
    if (typeof window === 'undefined') return;
    const mode = this.getSyncMode();
    if (mode === 'local_only') return;
    if (!force && this.isCloudQuotaPaused()) return;

    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);

    // En modo 'eco', evitar consultar Firebase más de 1 vez cada 30 minutos al recargar la página
    const COOLDOWN_MS = 30 * 60 * 1000;
    try {
      const lastPull = Number(localStorage.getItem('minerd_last_cloud_pull_ts') || '0');
      if (!force && Date.now() - lastPull < COOLDOWN_MS) {
        return;
      }
      localStorage.setItem('minerd_last_cloud_pull_ts', String(Date.now()));
    } catch {}

    try {
      // 1. Config + Bloques Compactos de Estudiantes (solo 3-4 documentos en lugar de 728)
      const configSnap = await getDocs(collection(db, 'schools', currentCode, 'config'));
      const chunkStudents: Student[] = [];
      configSnap.forEach((d) => {
        if (d.id === 'main') {
          const cloudData = d.data() as Partial<SchoolConfig>;
          const localData = this.getConfig();
          const mergedConfig: SchoolConfig = {
            ...DEFAULT_SCHOOL_CONFIG,
            ...localData,
            ...cloudData,
            schoolCode: currentCode
          };
          localStorage.setItem(keys.CONFIG, JSON.stringify(mergedConfig));
          pushToServerMirror(currentCode, { config: mergedConfig });
          callbacks?.onConfig?.(mergedConfig);
        } else if (d.id.startsWith('studentsRoster_chunk_')) {
          const data = d.data();
          if (Array.isArray(data.items)) {
            data.items.forEach((st: Student) => {
              if (st && st.id && !st.id.startsWith('std-00')) {
                chunkStudents.push(st);
              }
            });
          }
        }
      });

      if (chunkStudents.length > 0) {
        const finalStudents = mergeById(this.getStudents(), chunkStudents);
        localStorage.setItem(keys.STUDENTS, JSON.stringify(finalStudents));
        pushToServerMirror(currentCode, { students: finalStudents });
        callbacks?.onStudents?.(finalStudents);
      } else if (force && this.getStudents().length === 0) {
        // Solo si el usuario fuerza sincronización manual y aún no hay bloques compactos, leer colección legada
        const legacyStudentsSnap = await getDocs(collection(db, 'schools', currentCode, 'students'));
        const legacyList: Student[] = [];
        legacyStudentsSnap.forEach((d) => {
          if (!d.id.startsWith('std-00')) legacyList.push(d.data() as Student);
        });
        if (legacyList.length > 0) {
          const finalStudents = mergeById(this.getStudents(), legacyList);
          // Guardar inmediatamente en formato compacto de bloques para nunca más leer 728 docs sueltos
          this.saveStudents(finalStudents);
          callbacks?.onStudents?.(finalStudents);
        }
      }

      // 2. Docentes, Coordinadores y Orientadores
      const [teachersSnap, coordsSnap, orientatorsSnap] = await Promise.all([
        getDocs(collection(db, 'schools', currentCode, 'teachers')),
        getDocs(collection(db, 'schools', currentCode, 'coordinators')),
        getDocs(collection(db, 'schools', currentCode, 'orientators'))
      ]);

      const deletedIds = this.getDeletedTeacherIds();
      const cloudTeachers: Teacher[] = [];
      teachersSnap.forEach((d) => {
        if (!d.id.startsWith('prof-00') && !d.id.startsWith('t-00') && !deletedIds.includes(d.id)) {
          cloudTeachers.push(d.data() as Teacher);
        }
      });
      if (cloudTeachers.length > 0) {
        const finalTeachers = mergeById(this.getTeachers(), cloudTeachers).filter((t) => !deletedIds.includes(t.id));
        localStorage.setItem(keys.TEACHERS, JSON.stringify(finalTeachers));
        pushToServerMirror(currentCode, { teachers: finalTeachers });
        callbacks?.onTeachers?.(finalTeachers);
      }

      const cloudCoords: Coordinator[] = [];
      coordsSnap.forEach((d) => {
        const c = d.data() as Coordinator;
        if (!isLegacyDemoCoordinator(d.id, c.name)) cloudCoords.push(c);
      });
      if (cloudCoords.length > 0) {
        const finalCoords = mergeById(this.getCoordinators(), cloudCoords);
        localStorage.setItem(keys.COORDINATORS, JSON.stringify(finalCoords));
        pushToServerMirror(currentCode, { coordinators: finalCoords });
        callbacks?.onCoordinators?.(finalCoords);
      }

      const cloudOrientators: Orientator[] = [];
      orientatorsSnap.forEach((d) => cloudOrientators.push(d.data() as Orientator));
      if (cloudOrientators.length > 0) {
        const finalOrientators = mergeById(this.getOrientators(), cloudOrientators);
        localStorage.setItem(keys.ORIENTATORS, JSON.stringify(finalOrientators));
        pushToServerMirror(currentCode, { orientators: finalOrientators });
        callbacks?.onOrientators?.(finalOrientators);
      }

      // 3. Planes Diarios, Semanales, Unidades y Psicología
      const [dailySnap, weeklySnap, unitsSnap, psychSnap] = await Promise.all([
        getDocs(collection(db, 'schools', currentCode, 'dailyPlans')),
        getDocs(collection(db, 'schools', currentCode, 'weeklyPlans')),
        getDocs(collection(db, 'schools', currentCode, 'learningUnits')),
        getDocs(collection(db, 'schools', currentCode, 'psychologyReports'))
      ]);

      const cloudDaily: DailyPlan[] = [];
      dailySnap.forEach((d) => {
        const p = d.data() as DailyPlan;
        if (!isLegacyDemoDailyPlan(d.id, p.title, p.unitTheme)) cloudDaily.push(p);
      });
      if (cloudDaily.length > 0) {
        const finalDaily = mergeById(this.getDailyPlans(), cloudDaily);
        localStorage.setItem(keys.DAILY_PLANS, JSON.stringify(finalDaily));
        pushToServerMirror(currentCode, { dailyPlans: finalDaily });
        callbacks?.onDailyPlans?.(finalDaily);
      }

      const cloudWeekly: WeeklyPlan[] = [];
      weeklySnap.forEach((d) => {
        const w = d.data() as WeeklyPlan;
        if (!isLegacyDemoWeeklyPlan(d.id, w.title, w.unitTitle)) cloudWeekly.push(w);
      });
      if (cloudWeekly.length > 0) {
        const finalWeekly = mergeById(this.getWeeklyPlans(), cloudWeekly);
        localStorage.setItem(keys.WEEKLY_PLANS, JSON.stringify(finalWeekly));
        pushToServerMirror(currentCode, { weeklyPlans: finalWeekly });
        callbacks?.onWeeklyPlans?.(finalWeekly);
      }

      const cloudUnits: LearningUnit[] = [];
      unitsSnap.forEach((d) => cloudUnits.push(d.data() as LearningUnit));
      if (cloudUnits.length > 0) {
        const finalUnits = mergeById(this.getLearningUnits(), cloudUnits);
        localStorage.setItem(keys.LEARNING_UNITS, JSON.stringify(finalUnits));
        pushToServerMirror(currentCode, { learningUnits: finalUnits });
        callbacks?.onLearningUnits?.(finalUnits);
      }

      const cloudPsych: PsychologyCaseReport[] = [];
      psychSnap.forEach((d) => cloudPsych.push(d.data() as PsychologyCaseReport));
      if (cloudPsych.length > 0) {
        const finalPsych = mergeById(this.getPsychologyReports(), cloudPsych);
        localStorage.setItem(keys.PSYCHOLOGY_REPORTS, JSON.stringify(finalPsych));
        pushToServerMirror(currentCode, { psychologyReports: finalPsych });
        callbacks?.onPsychologyReports?.(finalPsych);
      }
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || String(err?.message || '').includes('Quota exceeded')) {
        this.markCloudQuotaExhausted();
      }
      console.warn('[STORAGE_ECO_SYNC] Operando con almacenamiento local y servidor propio:', err?.code || err);
    }
  },

  // --- Motor Principal de Sincronización (Local-First + Servidor Propio + Ahorro de Nube) ---
  subscribeToCloudData(callbacks: CloudSubscriptionCallbacks): () => void {
    const unsubscribes: (() => void)[] = [];
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);

    // 1. Sincronizar de inmediato con el espejo del servidor local (0 lecturas de Firebase)
    this.syncWithServerMirror(callbacks);

    // 2. Mantener sincronización periódica con el Servidor Propio cada 15 segundos (0 costo de Firebase)
    const serverPollInterval = window.setInterval(() => {
      this.syncWithServerMirror(callbacks);
    }, 15000);
    unsubscribes.push(() => window.clearInterval(serverPollInterval));

    const mode = this.getSyncMode();

    // Si está en modo 100% Local + Servidor o en Modo Ahorro (por defecto), NO abrimos 10 onSnapshot permanentes
    if (mode === 'local_only') {
      return () => {
        unsubscribes.forEach((unsub) => unsub());
      };
    }

    if (mode === 'eco') {
      // Descarga ligera con enfriamiento de 30 minutos (evita agotar las 50,000 lecturas gratuitas de Firebase)
      this.syncCloudOnce(callbacks, false);
      return () => {
        unsubscribes.forEach((unsub) => unsub());
      };
    }

    // Modo 'realtime' (solo cuando el usuario lo elige explícitamente y la cuota no está pausada)
    if (this.isCloudQuotaPaused()) {
      return () => {
        unsubscribes.forEach((unsub) => unsub());
      };
    }

    try {
      // Escucha compacta de Configuración + Bloques de Estudiantes (sin escuchar los 728 documentos sueltos)
      const unsubStudentChunks = onSnapshot(
        collection(db, 'schools', currentCode, 'config'),
        (snap) => {
          const chunkStudents: Student[] = [];
          snap.forEach((d) => {
            if (d.id === 'main') {
              const cloudData = d.data() as Partial<SchoolConfig>;
              const mergedConfig: SchoolConfig = {
                ...DEFAULT_SCHOOL_CONFIG,
                ...this.getConfig(),
                ...cloudData,
                schoolCode: currentCode
              };
              localStorage.setItem(keys.CONFIG, JSON.stringify(mergedConfig));
              pushToServerMirror(currentCode, { config: mergedConfig });
              callbacks.onConfig?.(mergedConfig);
            } else if (d.id.startsWith('studentsRoster_chunk_')) {
              const data = d.data();
              if (Array.isArray(data.items)) {
                data.items.forEach((st: Student) => {
                  if (st && st.id && !st.id.startsWith('std-00')) {
                    chunkStudents.push(st);
                  }
                });
              }
            }
          });
          if (chunkStudents.length > 0) {
            const finalList = mergeById(this.getStudents(), chunkStudents);
            localStorage.setItem(keys.STUDENTS, JSON.stringify(finalList));
            pushToServerMirror(currentCode, { students: finalList });
            callbacks.onStudents?.(finalList);
          }
        },
        (err) => {
          if (err.code === 'resource-exhausted') this.markCloudQuotaExhausted();
        }
      );
      unsubscribes.push(unsubStudentChunks);
    } catch (e) {
      console.error('Error setting up Firestore subscriptions', e);
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  },

  // --- Config ---
  getConfig(): SchoolConfig {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);

    try {
      const data = localStorage.getItem(keys.CONFIG);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...(currentCode === '14668' ? DEFAULT_SCHOOL_CONFIG : {
            ...DEFAULT_SCHOOL_CONFIG,
            schoolName: `Centro Educativo ${currentCode}`,
            schoolCode: currentCode,
            regional: 'Regional Educativa',
            district: 'Distrito Educativo',
            principalName: '',
            principalPhone: ''
          }),
          ...parsed,
          schoolCode: currentCode
        };
      }
    } catch (e) {
      console.error('Error reading school config from localStorage', e);
    }

    if (currentCode === '14668') {
      return DEFAULT_SCHOOL_CONFIG;
    }
    return {
      ...DEFAULT_SCHOOL_CONFIG,
      schoolName: `Centro Educativo ${currentCode}`,
      schoolCode: currentCode,
      regional: 'Regional Educativa',
      district: 'Distrito Educativo',
      principalName: '',
      principalPhone: ''
    };
  },

  async saveConfig(config: SchoolConfig): Promise<void> {
    const newCode = normalizeSchoolCode(config.schoolCode);
    const oldCode = this.getCurrentSchoolCode();

    if (newCode !== oldCode) {
      setStoredSchoolCode(newCode);
    }

    const current = this.getConfig();
    const merged: SchoolConfig = {
      ...current,
      ...config,
      schoolCode: newCode
    };

    const keys = getStorageKeys(newCode);
    try {
      localStorage.setItem(keys.CONFIG, JSON.stringify(merged));
      pushToServerMirror(newCode, { config: merged });
    } catch (e) {
      console.warn('LocalStorage error while saving config', e);
    }

    try {
      await setDoc(doc(db, 'schools', newCode, 'config', 'main'), cleanForFirestore(merged), { merge: true });
      // If code is 14668, also update legacy root doc for backward compatibility
      if (newCode === '14668') {
        await setDoc(doc(db, 'schoolConfig', 'main'), cleanForFirestore(merged), { merge: true });
      }
    } catch (e) {
      console.error('Error saving school config to cloud Firestore', e);
    }
  },

  // --- Coordinators Management ---
  getCoordinators(): Coordinator[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.COORDINATORS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => !isLegacyDemoCoordinator(c.id, c.name));
        }
      }
    } catch (e) {
      console.error('Error reading coordinators from localStorage', e);
    }
    return [];
  },

  async saveCoordinators(coordinators: Coordinator[]): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const cleanList = coordinators.filter(c => !isLegacyDemoCoordinator(c.id, c.name));
    try {
      localStorage.setItem(keys.COORDINATORS, JSON.stringify(cleanList));
      pushToServerMirror(currentCode, { coordinators: cleanList });
    } catch (e) {
      console.warn('LocalStorage error while saving coordinators', e);
    }
    try {
      const promises = cleanList.map(c => 
        setDoc(doc(db, 'schools', currentCode, 'coordinators', c.id), cleanForFirestore(c), { merge: true })
      );
      await Promise.all(promises);
    } catch (e) {
      console.error('Error saving coordinators to cloud Firestore', e);
    }
  },

  async saveCoordinator(coordinator: Coordinator): Promise<void> {
    const coords = this.getCoordinators();
    const index = coords.findIndex(c => c.id === coordinator.id);
    if (index >= 0) {
      coords[index] = coordinator;
    } else {
      coords.push(coordinator);
    }
    await this.saveCoordinators(coords);
  },

  async deleteCoordinator(id: string): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const coords = this.getCoordinators().filter(c => c.id !== id);
    try {
      localStorage.setItem(keys.COORDINATORS, JSON.stringify(coords));
      await deleteDoc(doc(db, 'schools', currentCode, 'coordinators', id));
    } catch (e) {
      console.error('Error deleting coordinator from cloud Firestore', e);
    }
  },

  // --- Orientators & School Psychologists Management ---
  getOrientators(): Orientator[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.ORIENTATORS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading orientators from localStorage', e);
    }
    return [];
  },

  async saveOrientators(orientators: Orientator[]): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      localStorage.setItem(keys.ORIENTATORS, JSON.stringify(orientators));
      pushToServerMirror(currentCode, { orientators });
      const promises = orientators.map(o => 
        setDoc(doc(db, 'schools', currentCode, 'orientators', o.id), cleanForFirestore(o), { merge: true })
      );
      await Promise.all(promises);
    } catch (e) {
      console.error('Error saving orientators to cloud Firestore', e);
    }
  },

  async saveOrientator(orientator: Orientator): Promise<void> {
    const list = this.getOrientators();
    const index = list.findIndex(o => o.id === orientator.id);
    if (index >= 0) {
      list[index] = orientator;
    } else {
      list.push(orientator);
    }
    await this.saveOrientators(list);
  },

  async deleteOrientator(id: string): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const list = this.getOrientators().filter(o => o.id !== id);
    try {
      localStorage.setItem(keys.ORIENTATORS, JSON.stringify(list));
      await deleteDoc(doc(db, 'schools', currentCode, 'orientators', id));
    } catch (e) {
      console.error('Error deleting orientator from cloud Firestore', e);
    }
  },

  // --- Psychology & Guidance Reports Management ---
  getPsychologyReports(): PsychologyCaseReport[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.PSYCHOLOGY_REPORTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading psychology reports from localStorage', e);
    }
    return [];
  },

  savePsychologyReports(reports: PsychologyCaseReport[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      localStorage.setItem(keys.PSYCHOLOGY_REPORTS, JSON.stringify(reports));
      pushToServerMirror(currentCode, { psychologyReports: reports });
      reports.forEach(r => setDoc(doc(db, 'schools', currentCode, 'psychologyReports', r.id), cleanForFirestore(r), { merge: true }).catch(() => {}));
    } catch (e) {
      console.error('Error saving psychology reports', e);
    }
  },

  savePsychologyReport(report: PsychologyCaseReport): void {
    const reports = this.getPsychologyReports();
    const index = reports.findIndex(r => r.id === report.id);
    const updated = {
      ...report,
      updatedAt: new Date().toISOString()
    };
    if (index >= 0) {
      reports[index] = updated;
    } else {
      reports.unshift(updated);
    }
    this.savePsychologyReports(reports);
  },

  deletePsychologyReport(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const reports = this.getPsychologyReports().filter(r => r.id !== id);
    try {
      localStorage.setItem(keys.PSYCHOLOGY_REPORTS, JSON.stringify(reports));
      deleteDoc(doc(db, 'schools', currentCode, 'psychologyReports', id)).catch(e => console.error('Cloud deletePsychologyReport error', e));
    } catch (e) {
      console.error('Error deleting psychology report', e);
    }
  },

  // --- Teachers Management ---
  getTeachers(): Teacher[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    const deletedIds = this.getDeletedTeacherIds();
    try {
      const data = localStorage.getItem(keys.TEACHERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => !t.id.startsWith('prof-00') && !t.id.startsWith('t-00') && !deletedIds.includes(t.id));
        }
      }
    } catch (e) {
      console.error('Error reading teachers from localStorage', e);
    }
    return [];
  },

  saveTeachers(teachers: Teacher[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      const cleanList = teachers.filter(t => !t.id.startsWith('prof-00') && !t.id.startsWith('t-00'));
      localStorage.setItem(keys.TEACHERS, JSON.stringify(cleanList));
      pushToServerMirror(currentCode, { teachers: cleanList });
      cleanList.forEach(t => setDoc(doc(db, 'schools', currentCode, 'teachers', t.id), cleanForFirestore(t), { merge: true }).catch(() => {}));
    } catch (e) {
      console.error('Error saving teachers', e);
    }
  },

  saveTeacher(teacher: Teacher): void {
    const teachers = this.getTeachers();
    const index = teachers.findIndex(t => t.id === teacher.id);
    if (index >= 0) {
      teachers[index] = teacher;
    } else {
      teachers.push(teacher);
    }
    this.saveTeachers(teachers);
  },


  getDeletedTeacherIds(): string[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.DELETED_TEACHERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  trackDeletedTeacherId(id: string): void {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    const list = this.getDeletedTeacherIds();
    if (!list.includes(id)) {
      list.push(id);
      try {
        localStorage.setItem(keys.DELETED_TEACHERS, JSON.stringify(list));
      } catch {}
    }
  },

  deleteTeacher(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    this.trackDeletedTeacherId(id);
    const teachers = this.getTeachers().filter(t => t.id !== id);
    try {
      localStorage.setItem(keys.TEACHERS, JSON.stringify(teachers));
      deleteDoc(doc(db, 'schools', currentCode, 'teachers', id))
        .then(() => console.log('[Storage] Docente eliminado de Firebase Firestore:', id))
        .catch(e => console.error('Cloud deleteTeacher error', e));
    } catch (e) {
      console.error('Error deleting teacher', e);
    }
  },

  importTeachersBatch(newTeachers: Teacher[]): number {
    const currentCode = this.getCurrentSchoolCode();
    const existing = this.getTeachers();
    const map = new Map<string, Teacher>();

    existing.forEach(t => {
      const key = t.idCard || t.id;
      map.set(key, t);
    });

    let addedCount = 0;
    newTeachers.forEach(t => {
      const key = t.idCard || t.id;
      if (!map.has(key)) {
        addedCount++;
      }
      map.set(key, t);
      setDoc(doc(db, 'schools', currentCode, 'teachers', t.id), cleanForFirestore(t), { merge: true }).catch(() => {});
    });

    const merged = Array.from(map.values());
    this.saveTeachers(merged);
    return addedCount;
  },


  // --- Almacén Robusto de Archivos Adjuntos (PDF / Docs) ---
  async saveAttachmentFile(attachmentId: string, dataUrl: string, name: string): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    try {
      // 1. Guardar en localStorage scoped
      try {
        localStorage.setItem(`minerd_att_${currentCode}_${attachmentId}`, dataUrl);
      } catch (localErr) {
        console.warn('LocalStorage lleno para adjunto, sincronizando a la nube:', localErr);
      }
      
      // 2. Guardar en Firestore si el tamaño es menor a 1MB
      if (dataUrl.length < 1048576) {
        await setDoc(doc(db, 'schools', currentCode, 'attachments', attachmentId), {
          id: attachmentId,
          name,
          dataUrl,
          savedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    } catch (e) {
      console.error('Error guardando archivo adjunto:', e);
    }
  },

  async getAttachmentDataUrl(attachmentId: string): Promise<string | null> {
    const currentCode = this.getCurrentSchoolCode();
    // 1. Probar en localStorage primero
    try {
      const local = localStorage.getItem(`minerd_att_${currentCode}_${attachmentId}`);
      if (local) return local;
    } catch {}

    // 2. Buscar en Firestore
    try {
      const snap = await getDoc(doc(db, 'schools', currentCode, 'attachments', attachmentId));
      if (snap.exists()) {
        const data = snap.data();
        if (data?.dataUrl) {
          try {
            localStorage.setItem(`minerd_att_${currentCode}_${attachmentId}`, data.dataUrl);
          } catch {}
          return data.dataUrl;
        }
      }
    } catch (e) {
      console.warn('Error buscando adjunto en Firestore:', e);
    }

    // 3. Buscar en los planes actuales si el dataUrl está presente
    const dailyPlans = this.getDailyPlans();
    for (const p of dailyPlans) {
      if (p.attachments) {
        const found = p.attachments.find(a => a.id === attachmentId);
        if (found?.dataUrl) return found.dataUrl;
      }
    }

    const weeklyPlans = this.getWeeklyPlans();
    for (const w of weeklyPlans) {
      if (w.attachments) {
        const found = w.attachments.find(a => a.id === attachmentId);
        if (found?.dataUrl) return found.dataUrl;
      }
    }

    return null;
  },

  // --- Daily Plans ---
  getDailyPlans(): DailyPlan[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.DAILY_PLANS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => !isLegacyDemoDailyPlan(p.id, p.title, p.unitTheme));
        }
      }
    } catch (e) {
      console.error('Error reading daily plans from localStorage', e);
    }
    return [];
  },

  saveDailyPlans(plans: DailyPlan[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      const cleanList = plans.filter(p => !isLegacyDemoDailyPlan(p.id, p.title, p.unitTheme));
      localStorage.setItem(keys.DAILY_PLANS, JSON.stringify(cleanList));
      pushToServerMirror(currentCode, { dailyPlans: cleanList });
      cleanList.forEach(p => setDoc(doc(db, 'schools', currentCode, 'dailyPlans', p.id), cleanForFirestore(p), { merge: true }).catch(() => {}));
    } catch (e) {
      console.error('Error saving daily plans', e);
    }
  },

  saveDailyPlan(plan: DailyPlan): void {
    const plans = this.getDailyPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    const updatedPlan: DailyPlan = {
      ...plan,
      reviewStatus: plan.reviewStatus || 'pending',
      updatedAt: new Date().toISOString()
    };
    if (index >= 0) {
      plans[index] = updatedPlan;
    } else {
      plans.unshift(updatedPlan);
    }
    this.saveDailyPlans(plans);
  },

  updateDailyPlanReview(
    planId: string, 
    reviewStatus: ReviewStatus, 
    reviewerName: string, 
    reviewerRole: 'director' | 'coordinator', 
    feedback?: string
  ): DailyPlan | null {
    const plans = this.getDailyPlans();
    const planIndex = plans.findIndex(p => p.id === planId);
    if (planIndex === -1) return null;

    const currentPlan = plans[planIndex];
    const updatedPlan: DailyPlan = {
      ...currentPlan,
      reviewStatus,
      reviewerName,
      reviewerRole,
      reviewedAt: new Date().toISOString(),
      reviewFeedback: feedback || currentPlan.reviewFeedback,
      updatedAt: new Date().toISOString()
    };

    plans[planIndex] = updatedPlan;
    this.saveDailyPlans(plans);
    return updatedPlan;
  },

  deleteDailyPlan(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const plans = this.getDailyPlans().filter(p => p.id !== id);
    try {
      localStorage.setItem(keys.DAILY_PLANS, JSON.stringify(plans));
      deleteDoc(doc(db, 'schools', currentCode, 'dailyPlans', id)).catch(e => console.error('Cloud deleteDailyPlan error', e));
    } catch (e) {
      console.error('Error deleting daily plan', e);
    }
  },

  // --- Weekly Plans ---
  getWeeklyPlans(): WeeklyPlan[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.WEEKLY_PLANS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(w => !isLegacyDemoWeeklyPlan(w.id, w.title, w.unitTitle));
        }
      }
    } catch (e) {
      console.error('Error reading weekly plans from localStorage', e);
    }
    return [];
  },

  saveWeeklyPlans(plans: WeeklyPlan[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      const cleanList = plans.filter(w => !isLegacyDemoWeeklyPlan(w.id, w.title, w.unitTitle));
      localStorage.setItem(keys.WEEKLY_PLANS, JSON.stringify(cleanList));
      pushToServerMirror(currentCode, { weeklyPlans: cleanList });
      cleanList.forEach(w => setDoc(doc(db, 'schools', currentCode, 'weeklyPlans', w.id), cleanForFirestore(w), { merge: true }).catch(() => {}));
    } catch (e) {
      console.error('Error saving weekly plans', e);
    }
  },

  saveWeeklyPlan(plan: WeeklyPlan): void {
    const plans = this.getWeeklyPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    const updated = {
      ...plan,
      reviewStatus: plan.reviewStatus || 'pending',
      updatedAt: new Date().toISOString()
    };
    if (index >= 0) {
      plans[index] = updated;
    } else {
      plans.unshift(updated);
    }
    this.saveWeeklyPlans(plans);
  },

  updateWeeklyPlanReview(
    planId: string, 
    reviewStatus: ReviewStatus, 
    reviewerName: string, 
    reviewerRole: 'director' | 'coordinator', 
    feedback?: string
  ): WeeklyPlan | null {
    const plans = this.getWeeklyPlans();
    const index = plans.findIndex(p => p.id === planId);
    if (index === -1) return null;

    const current = plans[index];
    const updated: WeeklyPlan = {
      ...current,
      reviewStatus,
      reviewerName,
      reviewerRole,
      reviewedAt: new Date().toISOString(),
      reviewFeedback: feedback || current.reviewFeedback,
      updatedAt: new Date().toISOString()
    };

    plans[index] = updated;
    this.saveWeeklyPlans(plans);
    return updated;
  },

  deleteWeeklyPlan(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const plans = this.getWeeklyPlans().filter(p => p.id !== id);
    try {
      localStorage.setItem(keys.WEEKLY_PLANS, JSON.stringify(plans));
      deleteDoc(doc(db, 'schools', currentCode, 'weeklyPlans', id)).catch(e => console.error('Cloud deleteWeeklyPlan error', e));
    } catch (e) {
      console.error('Error deleting weekly plan', e);
    }
  },

  // --- Learning Units ---
  getLearningUnits(): LearningUnit[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.LEARNING_UNITS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading learning units from localStorage', e);
    }
    return [];
  },

  saveLearningUnits(units: LearningUnit[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      localStorage.setItem(keys.LEARNING_UNITS, JSON.stringify(units));
      pushToServerMirror(currentCode, { learningUnits: units });
    } catch (e) {
      console.warn('LocalStorage quota warning saving learning units, saving lightweight copy:', e);
      try {
        const light = units.map(u => ({
          ...u,
          attachments: Array.isArray(u.attachments) ? u.attachments.map(a => ({ ...a, dataUrl: undefined })) : []
        }));
        localStorage.setItem(keys.LEARNING_UNITS, JSON.stringify(light));
        pushToServerMirror(currentCode, { learningUnits: light });
      } catch {}
    }
    try {
      units.forEach(u => {
        const sanitized = {
          ...u,
          attachments: Array.isArray(u.attachments)
            ? u.attachments.map(a => ({ ...a, dataUrl: a.dataUrl && a.dataUrl.length > 200000 ? undefined : a.dataUrl }))
            : []
        };
        setDoc(doc(db, 'schools', currentCode, 'learningUnits', u.id), cleanForFirestore(sanitized), { merge: true }).catch(err => console.error('Firestore saveLearningUnit error:', err));
      });
    } catch (e) {
      console.error('Error saving learning units to Firestore', e);
    }
  },

  saveLearningUnit(unit: LearningUnit): void {
    const units = this.getLearningUnits();
    const unitId = unit.id || `lu-${Date.now()}`;
    const index = units.findIndex(u => u.id === unitId);
    const updated: LearningUnit = {
      ...unit,
      id: unitId,
      createdAt: unit.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (index >= 0) {
      units[index] = updated;
    } else {
      units.unshift(updated);
    }
    this.saveLearningUnits(units);
  },

  deleteLearningUnit(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const units = this.getLearningUnits().filter(u => u.id !== id);
    try {
      localStorage.setItem(keys.LEARNING_UNITS, JSON.stringify(units));
      deleteDoc(doc(db, 'schools', currentCode, 'learningUnits', id)).catch(e => console.error('Cloud deleteLearningUnit error', e));
    } catch (e) {
      console.error('Error deleting learning unit', e);
    }
  },

  // --- Consolidado de Asistencia por Grado (Registro y Dirección) ---
  getGradeAttendances(): DailyGradeAttendanceSummary[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.GRADE_ATTENDANCE);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading grade attendances from localStorage', e);
    }
    return [];
  },

  saveGradeAttendances(list: DailyGradeAttendanceSummary[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      localStorage.setItem(keys.GRADE_ATTENDANCE, JSON.stringify(list));
      list.forEach(item => {
        setDoc(doc(db, 'schools', currentCode, 'gradeAttendances', item.id), cleanForFirestore(item), { merge: true }).catch(() => {});
      });
    } catch (e) {
      console.error('Error saving grade attendances', e);
    }
  },

  saveGradeAttendanceRecord(record: DailyGradeAttendanceSummary): void {
    const list = this.getGradeAttendances();
    const index = list.findIndex(r => r.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.unshift(record);
    }
    this.saveGradeAttendances(list);
  },

  getGradeAttendanceByDate(date: string): DailyGradeAttendanceSummary[] {
    return this.getGradeAttendances().filter(r => r.date === date);
  },

  // --- Students & Attendance Management ---
  getStudents(): Student[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.STUDENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => !s.id.startsWith('std-00'));
        }
      }
    } catch (e) {
      console.error('Error reading students from localStorage', e);
    }
    return [];
  },

  saveStudents(students: Student[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      const cleanList = students.filter(s => !s.id.startsWith('std-00'));
      localStorage.setItem(keys.STUDENTS, JSON.stringify(cleanList));
      pushToServerMirror(currentCode, { students: cleanList });

      // Guardar en bloques compactos (250 alumnos por bloque) para no agotar la cuota diaria de lecturas/escrituras con 728+ estudiantes
      const CHUNK_SIZE = 250;
      const totalChunks = Math.ceil(cleanList.length / CHUNK_SIZE);
      for (let c = 0; c < Math.max(totalChunks, 1); c++) {
        const chunkItems = cleanList.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
        setDoc(
          doc(db, 'schools', currentCode, 'config', `studentsRoster_chunk_${c}`),
          cleanForFirestore({
            chunkIndex: c,
            totalChunks,
            totalStudents: cleanList.length,
            updatedAt: new Date().toISOString(),
            students: chunkItems
          }),
          { merge: true }
        ).catch(() => {});
      }

      // Si son pocos estudiantes (<= 40), también sincronizar documentos individuales
      if (cleanList.length <= 40) {
        cleanList.forEach(s =>
          setDoc(doc(db, 'schools', currentCode, 'students', s.id), cleanForFirestore(s), { merge: true }).catch(() => {})
        );
      }
    } catch (e) {
      console.error('Error saving students', e);
    }
  },

  saveStudent(student: Student): void {
    const currentCode = this.getCurrentSchoolCode();
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    this.saveStudents(students);
    setDoc(doc(db, 'schools', currentCode, 'students', student.id), cleanForFirestore(student), { merge: true }).catch(() => {});
  },

  deleteStudentsBySection(grade: string, section: string): number {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const all = this.getStudents();
    
    // Identificar a los estudiantes de la sección indicada
    const toDelete = all.filter(
      s => s.grade === grade && s.section.trim().toLowerCase() === section.trim().toLowerCase()
    );
    const toKeep = all.filter(
      s => !(s.grade === grade && s.section.trim().toLowerCase() === section.trim().toLowerCase())
    );

    try {
      localStorage.setItem(keys.STUDENTS, JSON.stringify(toKeep));
      pushToServerMirror(currentCode, { students: toKeep });
      this.saveStudents(toKeep);
      toDelete.forEach(s => {
        deleteDoc(doc(db, 'schools', currentCode, 'students', s.id)).catch(() => {});
      });
    } catch (e) {
      console.error('Error deleting students by section', e);
    }

    return toDelete.length;
  },

  deleteStudent(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const students = this.getStudents().filter(s => s.id !== id);
    try {
      localStorage.setItem(keys.STUDENTS, JSON.stringify(students));
      pushToServerMirror(currentCode, { students });
      deleteDoc(doc(db, 'schools', currentCode, 'students', id)).catch(e => console.error('Cloud deleteStudent error', e));
    } catch (e) {
      console.error('Error deleting student', e);
    }
  },

  importStudentsInBulk(newStudents: Student[]): { added: number; updated: number; total: number } {
    const existing = this.getStudents();
    const map = new Map<string, Student>();

    existing.forEach(s => {
      const key = (s.rne && s.rne.trim() && !s.rne.startsWith('RNE-'))
        ? s.rne.trim().toLowerCase()
        : `${s.name.toLowerCase().trim()}_${s.grade}_${s.section}`;
      map.set(key, s);
    });

    let added = 0;
    let updated = 0;

    newStudents.forEach(ns => {
      const key = (ns.rne && ns.rne.trim() && !ns.rne.startsWith('RNE-'))
        ? ns.rne.trim().toLowerCase()
        : `${ns.name.toLowerCase().trim()}_${ns.grade}_${ns.section}`;
      if (map.has(key)) {
        const prev = map.get(key)!;
        const mergedObj = { ...prev, ...ns };
        map.set(key, mergedObj);
        updated++;
      } else {
        map.set(key, ns);
        added++;
      }
    });

    const merged = Array.from(map.values());
    this.saveStudents(merged);
    return { added, updated, total: merged.length };
  },

  getStudentsByGradeAndSection(grade: string, section: string): Student[] {
    const all = this.getStudents();
    const filtered = all.filter(s => s.grade === grade && s.section.toLowerCase() === section.toLowerCase());
    if (filtered.length > 0) return filtered;
    const gradeFiltered = all.filter(s => s.grade === grade);
    if (gradeFiltered.length > 0) return gradeFiltered;
    return all.slice(0, 8);
  },

  getStudentAbsenteeismReport(studentRneOrName: string): {
    totalAbsences: number;
    totalUnexcused: number;
    totalLates: number;
    totalSessions: number;
    absenceDates: string[];
    isHighRisk: boolean;
  } {
    const dailyPlans = this.getDailyPlans();
    let totalAbsences = 0;
    let totalUnexcused = 0;
    let totalLates = 0;
    let totalSessions = 0;
    const absenceDates: string[] = [];

    dailyPlans.forEach(plan => {
      if (plan.attendance && Array.isArray(plan.attendance.records)) {
        const record = plan.attendance.records.find(
          r => (r.studentRne && r.studentRne === studentRneOrName) || r.studentName.toLowerCase() === studentRneOrName.toLowerCase()
        );
        if (record) {
          totalSessions++;
          if (record.status === 'absent') {
            totalAbsences++;
            totalUnexcused++;
            absenceDates.push(plan.date || 'Sin fecha');
          } else if (record.status === 'excused') {
            totalAbsences++;
          } else if (record.status === 'late') {
            totalLates++;
          }
        }
      }
    });

    const isHighRisk = totalUnexcused >= 3 || totalAbsences >= 4;

    return {
      totalAbsences,
      totalUnexcused,
      totalLates,
      totalSessions,
      absenceDates,
      isHighRisk
    };
  },

  exportAllDataJSON(): string {
    const payload = {
      version: '6.0-institutional',
      schoolCode: this.getCurrentSchoolCode(),
      exportDate: new Date().toISOString(),
      config: this.getConfig(),
      coordinators: this.getCoordinators(),
      orientators: this.getOrientators(),
      teachers: this.getTeachers(),
      students: this.getStudents(),
      studentGrades: this.getStudentGrades(),
      gradeAttendances: this.getGradeAttendances(),
      psychologyReports: this.getPsychologyReports(),
      dailyPlans: this.getDailyPlans(),
      weeklyPlans: this.getWeeklyPlans(),
      learningUnits: this.getLearningUnits(),
      archives: this.getSchoolYearArchives(),
      authBackup: {
        directorPwd: localStorage.getItem('minerd_director_pwd_v1') || '',
        coordPwd: localStorage.getItem('minerd_coord_pwd_v1') || '',
        orientPwd: localStorage.getItem('minerd_orient_pwd_v1') || ''
      }
    };
    return JSON.stringify(payload, null, 2);
  },

  importDataJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.schoolCode) {
        this.setCurrentSchoolCode(parsed.schoolCode);
      }
      if (parsed.config) this.saveConfig(parsed.config);
      if (Array.isArray(parsed.coordinators)) this.saveCoordinators(parsed.coordinators);
      if (Array.isArray(parsed.orientators)) this.saveOrientators(parsed.orientators);
      if (Array.isArray(parsed.teachers)) this.saveTeachers(parsed.teachers);
      if (Array.isArray(parsed.students)) this.saveStudents(parsed.students);
      if (Array.isArray(parsed.psychologyReports)) this.savePsychologyReports(parsed.psychologyReports);
      if (Array.isArray(parsed.dailyPlans)) this.saveDailyPlans(parsed.dailyPlans);
      if (Array.isArray(parsed.weeklyPlans)) this.saveWeeklyPlans(parsed.weeklyPlans);
      if (Array.isArray(parsed.learningUnits)) this.saveLearningUnits(parsed.learningUnits);
      if (Array.isArray(parsed.studentGrades)) this.saveStudentGrades(parsed.studentGrades);
      if (Array.isArray(parsed.gradeAttendances)) this.saveGradeAttendances(parsed.gradeAttendances);
      if (Array.isArray(parsed.archives)) {
        const keys = getStorageKeys(this.getCurrentSchoolCode());
        try { localStorage.setItem(keys.ARCHIVES, JSON.stringify(parsed.archives)); } catch {}
      }
      if (parsed.authBackup) {
        if (parsed.authBackup.directorPwd) localStorage.setItem('minerd_director_pwd_v1', parsed.authBackup.directorPwd);
        if (parsed.authBackup.coordPwd) localStorage.setItem('minerd_coord_pwd_v1', parsed.authBackup.coordPwd);
        if (parsed.authBackup.orientPwd) localStorage.setItem('minerd_orient_pwd_v1', parsed.authBackup.orientPwd);
      }
      return true;
    } catch (e) {
      console.error('Error importing backup JSON data', e);
      return false;
    }
  },

  
  // --- Archivo de Año Escolar & Reinicio Anual MINERD ---
  getSchoolYearArchives(): import('../types/minerd').SchoolYearArchive[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.ARCHIVES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading archives', e);
    }
    return [];
  },

  async archiveCurrentSchoolYear(params: {
    nextSchoolYear: string;
    preserveStaff: boolean; // Si conserva la plantilla de docentes y coordinadores
    notes?: string;
  }): Promise<import('../types/minerd').SchoolYearArchive> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const config = this.getConfig();
    const currentYear = config.schoolYear || '2025-2026';

    const teachers = this.getTeachers();
    const coordinators = this.getCoordinators();
    const orientators = this.getOrientators();
    const students = this.getStudents();
    const grades = this.getStudentGrades();
    const dailyPlans = this.getDailyPlans();
    const weeklyPlans = this.getWeeklyPlans();
    const learningUnits = this.getLearningUnits();
    const psychologyReports = this.getPsychologyReports();
    const gradeAttendances = this.getGradeAttendances();

    const archiveRecord: import('../types/minerd').SchoolYearArchive = {
      id: `archive_${currentYear.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`,
      archivedAt: new Date().toISOString(),
      schoolYear: currentYear,
      schoolCode: currentCode,
      schoolName: config.schoolName,
      summary: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalDailyPlans: dailyPlans.length,
        totalWeeklyPlans: weeklyPlans.length,
        totalUnits: learningUnits.length,
        totalGrades: grades.length,
        totalPsychologyCases: psychologyReports.length
      },
      snapshot: {
        config: { ...config },
        teachers: [...teachers],
        coordinators: [...coordinators],
        orientators: [...orientators],
        students: [...students],
        grades: [...grades],
        dailyPlans: [...dailyPlans],
        weeklyPlans: [...weeklyPlans],
        learningUnits: [...learningUnits],
        psychologyReports: [...psychologyReports],
        gradeAttendances: [...gradeAttendances]
      },
      notes: params.notes || `Año escolar ${currentYear} archivado con éxito para apertura del ciclo ${params.nextSchoolYear}.`
    };

    // 1. Guardar en el histórico de archivos
    const archives = this.getSchoolYearArchives();
    archives.unshift(archiveRecord);
    try {
      localStorage.setItem(keys.ARCHIVES, JSON.stringify(archives));
      await setDoc(
        doc(db, 'schools', currentCode, 'archives', archiveRecord.id),
        cleanForFirestore(archiveRecord),
        { merge: true }
      ).catch(() => {});
    } catch (e) {
      console.error('Error saving archive snapshot', e);
    }

    // 2. Limpiar datos operativos del año lectivo cerrado (Planes, Calificaciones, Asistencias, Casos cerrados)
    this.saveDailyPlans([]);
    this.saveWeeklyPlans([]);
    this.saveLearningUnits([]);
    this.saveStudentGrades([]);
    this.saveGradeAttendances([]);
    this.saveStudents([]); // Los estudiantes se reinician para matricular el nuevo padrón del siguiente año

    // Si no desea conservar docentes/coordinadores, los limpia; si no, los preserva
    if (!params.preserveStaff) {
      this.saveTeachers([]);
      this.saveCoordinators([]);
      this.saveOrientators([]);
    }

    // 3. Actualizar la configuración escolar con el nuevo año escolar
    const updatedConfig: SchoolConfig = {
      ...config,
      schoolYear: params.nextSchoolYear
    };
    this.saveConfig(updatedConfig);

    return archiveRecord;
  },

  resetToDefaults(): void {
    this.saveConfig(DEFAULT_SCHOOL_CONFIG);
    this.saveCoordinators([]);
    this.saveTeachers([]);
    this.saveOrientators([]);
    this.saveStudents([]);
    this.savePsychologyReports([]);
    this.saveDailyPlans([]);
    this.saveWeeklyPlans([]);
    this.saveLearningUnits([]);
  },

  clearAllData(): void {
    this.resetToDefaults();
  },

  // =========================================================================
  // --- SUPER ADMIN: GESTIÓN DE DIRECTORES Y CENTROS EDUCATIVOS ---
  // =========================================================================
  getDirectorAccounts(): import('../types/minerd').SchoolDirectorAccount[] {
    try {
      const data = localStorage.getItem('minerd_all_director_accounts_v1');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading director accounts from localStorage', e);
    }
    
    // Seed default Pena Gomez account if empty
    const defaultAccount: import('../types/minerd').SchoolDirectorAccount = {
      id: '14668',
      schoolCode: '14668',
      schoolName: 'Escuela Dr. José Francisco Peña Gómez',
      regional: 'Regional 12 (Higüey)',
      district: 'Distrito Educativo 12-01 (Higüey)',
      tanda: 'Ambas Tandas (Doble Tanda)',
      directorName: 'Licdo. Arnold Javier Sanchez',
      directorPhone: '809-555-1234',
      directorIdCard: '001-1234567-8',
      directorEmail: 'arnold200930506@gmail.com',
      password: 'Javiersanchez02',
      logoUrl: '',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      notes: 'Centro Sede Principal (Super Administrador)'
    };
    return [defaultAccount];
  },

  async saveDirectorAccount(account: import('../types/minerd').SchoolDirectorAccount): Promise<void> {
    const list = this.getDirectorAccounts();
    const existingIndex = list.findIndex(a => a.schoolCode === account.schoolCode || a.id === account.id);
    let updatedList: import('../types/minerd').SchoolDirectorAccount[];

    const cleanAccount: import('../types/minerd').SchoolDirectorAccount = {
      ...account,
      schoolCode: normalizeSchoolCode(account.schoolCode),
      id: account.id || normalizeSchoolCode(account.schoolCode),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...cleanAccount };
    } else {
      updatedList = [cleanAccount, ...list];
    }

    try {
      localStorage.setItem('minerd_all_director_accounts_v1', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage error while saving director account', e);
    }

    // Save to Firestore central registry
    try {
      await setDoc(
        doc(db, 'directorAccounts', cleanAccount.schoolCode),
        cleanForFirestore(cleanAccount),
        { merge: true }
      );
    } catch (e) {
      console.error('Error saving director account to Firestore registry', e);
    }

    // Also update the target school's own config (/schools/{code}/config/main)
    try {
      const schoolConfigDoc = {
        schoolName: cleanAccount.schoolName,
        schoolCode: cleanAccount.schoolCode,
        regional: cleanAccount.regional,
        district: cleanAccount.district,
        tanda: cleanAccount.tanda,
        principalName: cleanAccount.directorName,
        principalPhone: cleanAccount.directorPhone || '',
        logoUrl: cleanAccount.logoUrl || ''
      };
      await setDoc(
        doc(db, 'schools', cleanAccount.schoolCode, 'config', 'main'),
        cleanForFirestore(schoolConfigDoc),
        { merge: true }
      );
    } catch (e) {
      console.error('Error auto-syncing school config for new center', e);
    }
  },

  async deleteDirectorAccount(schoolCode: string): Promise<void> {
    if (schoolCode === '14668') {
      throw new Error('No es posible eliminar el centro principal de la sede.');
    }

    const list = this.getDirectorAccounts().filter(a => a.schoolCode !== schoolCode && a.id !== schoolCode);
    try {
      localStorage.setItem('minerd_all_director_accounts_v1', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage error deleting director account', e);
    }

    try {
      await deleteDoc(doc(db, 'directorAccounts', schoolCode));
    } catch (e) {
      console.error('Error deleting director account from Firestore registry', e);
    }
  },

  async clearAllCoordinators(): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const coords = this.getCoordinators();
    try {
      localStorage.setItem(keys.COORDINATORS, JSON.stringify([]));
      const promises = coords.map(c => deleteDoc(doc(db, 'schools', currentCode, 'coordinators', c.id)));
      await Promise.all(promises);
    } catch (e) {
      console.error('Error clearing coordinators from cloud Firestore', e);
    }
  },
  async clearAllStudents(): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      // 1. Limpiar localStorage de todos los prefijos posibles de estudiantes
      localStorage.setItem(keys.STUDENTS, JSON.stringify([]));
      localStorage.removeItem(keys.STUDENTS);
      localStorage.removeItem(`minerd_students_${currentCode}_v4`);
      localStorage.removeItem(`minerd_students_${currentCode}_v3`);
      localStorage.removeItem(`minerd_students_${currentCode}_v2`);
      localStorage.removeItem(`minerd_students_${currentCode}_v1`);
      localStorage.removeItem('minerd_students_v4');
      localStorage.removeItem('minerd_students_v3');
      localStorage.removeItem('minerd_students');

      // 2. Traer todos los documentos existentes en la colección students de Firestore y borrarlos
      const querySnap = await getDocs(collection(db, 'schools', currentCode, 'students'));
      const deletePromises: Promise<any>[] = [];
      querySnap.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, 'schools', currentCode, 'students', docSnap.id)));
      });
      await Promise.all(deletePromises);
      console.log(`Borrados ${deletePromises.length} estudiantes en Firestore para el centro ${currentCode}`);
    } catch (e) {
      console.error('Error al limpiar todos los estudiantes de Firestore:', e);
    }
  },

  async clearAllDailyPlans(): Promise<void> {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const plans = this.getDailyPlans();
    try {
      localStorage.setItem(keys.DAILY_PLANS, JSON.stringify([]));
      const promises = plans.map(p => deleteDoc(doc(db, 'schools', currentCode, 'dailyPlans', p.id)));
      await Promise.all(promises);
    } catch (e) {
      console.error('Error clearing daily plans from cloud Firestore', e);
    }
  },

  // --- Sistema de Calificaciones por Período MINERD ---
  getStudentGrades(): StudentSubjectGrade[] {
    const keys = getStorageKeys(this.getCurrentSchoolCode());
    try {
      const data = localStorage.getItem(keys.STUDENT_GRADES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading student grades', e);
    }
    return [];
  },

  saveStudentGrades(grades: StudentSubjectGrade[]): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    try {
      localStorage.setItem(keys.STUDENT_GRADES, JSON.stringify(grades));
      grades.forEach(g => {
        const docId = `${g.studentId}_${g.period}_${g.subject}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        setDoc(doc(db, 'schools', currentCode, 'studentGrades', docId), cleanForFirestore(g), { merge: true }).catch(() => {});
      });
    } catch (e) {
      console.error('Error saving student grades', e);
    }
  },

  saveSingleStudentGrade(grade: StudentSubjectGrade): void {
    const currentCode = this.getCurrentSchoolCode();
    const grades = this.getStudentGrades();
    const index = grades.findIndex(
      g => g.studentId === grade.studentId && g.period === grade.period && g.subject === grade.subject
    );
    if (index >= 0) {
      grades[index] = grade;
    } else {
      grades.push(grade);
    }
    const keys = getStorageKeys(currentCode);
    try {
      localStorage.setItem(keys.STUDENT_GRADES, JSON.stringify(grades));
      const docId = `${grade.studentId}_${grade.period}_${grade.subject}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      setDoc(doc(db, 'schools', currentCode, 'studentGrades', docId), cleanForFirestore(grade), { merge: true }).catch(() => {});
    } catch (e) {
      console.error('Error saving single student grade', e);
    }
  },

  publishGradesBatch(params: { grade: string; section: string; subject: string; period: string }): number {
    const grades = this.getStudentGrades();
    let count = 0;
    const now = new Date().toISOString();
    const updated = grades.map(g => {
      if (g.grade === params.grade && g.section === params.section && g.subject === params.subject && g.period === params.period) {
        count++;
        return {
          ...g,
          published: true,
          publishedAt: now,
          updatedAt: now
        };
      }
      return g;
    });
    this.saveStudentGrades(updated);
    return count;
  },

};
