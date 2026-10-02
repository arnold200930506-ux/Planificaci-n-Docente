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
  DailyGradeAttendanceSummary
} from '../types/minerd';
import {
  DEFAULT_SCHOOL_CONFIG,
  DEFAULT_STUDENTS
} from '../data/minerdCurriculum';
import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
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
    GRADE_ATTENDANCE: `minerd_grade_attendance_${code}_v1`
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

export const storageService = {
  getCurrentSchoolCode(): string {
    return getStoredSchoolCode();
  },

  setCurrentSchoolCode(code: string): void {
    setStoredSchoolCode(code);
  },



  // --- Realtime Firestore Synchronization Engine (Scoped to current school) ---
  subscribeToCloudData(callbacks: CloudSubscriptionCallbacks): () => void {
    const unsubscribes: (() => void)[] = [];
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);

    try {
      // 1. School Config (/schools/{code}/config/main)
      const unsubConfig = onSnapshot(doc(db, 'schools', currentCode, 'config', 'main'), (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data() as Partial<SchoolConfig>;
          const localData = this.getConfig();
          const baseDefault: SchoolConfig = currentCode === '14668' 
            ? DEFAULT_SCHOOL_CONFIG 
            : {
                ...DEFAULT_SCHOOL_CONFIG,
                schoolName: `Centro Educativo ${currentCode}`,
                schoolCode: currentCode,
                regional: 'Regional Educativa',
                district: 'Distrito Educativo',
                principalName: '',
                principalPhone: '',
                coordinatorName: '',
                coordinatorPhone: '',
                teacherName: '',
                teacherPhone: ''
              };

          const mergedConfig: SchoolConfig = {
            ...baseDefault,
            ...localData,
            ...cloudData,
            schoolCode: currentCode
          };

          try {
            localStorage.setItem(keys.CONFIG, JSON.stringify(mergedConfig));
          } catch (e) {
            console.warn('LocalStorage save error for config', e);
          }
          if (callbacks.onConfig) callbacks.onConfig(mergedConfig);
        } else {
          // If not in cloud yet, persist current local config
          const localData = this.getConfig();
          setDoc(doc(db, 'schools', currentCode, 'config', 'main'), cleanForFirestore(localData), { merge: true }).catch(() => {});
        }
      }, (err) => {
        console.error('[STORAGE_INIT_ERROR] Firestore config listener falló al leer la configuración:', {
          code: err.code,
          message: err.message,
          schoolCode: currentCode
        });
        if (callbacks.onError) {
          callbacks.onError('config', err);
        }
      });
      unsubscribes.push(unsubConfig);

      // 2. Teachers Collection (/schools/{code}/teachers)
      const unsubTeachers = onSnapshot(collection(db, 'schools', currentCode, 'teachers'), (snap) => {
        const cloudList: Teacher[] = [];
        snap.forEach(d => {
          if (d.id.startsWith('prof-00') || d.id.startsWith('t-00')) {
            deleteDoc(doc(db, 'schools', currentCode, 'teachers', d.id)).catch(() => {});
            return;
          }
          cloudList.push(d.data() as Teacher);
        });

        const localList = this.getTeachers();

        if (snap.empty && localList.length > 0) {
          localList.forEach(t => {
            setDoc(doc(db, 'schools', currentCode, 'teachers', t.id), cleanForFirestore(t), { merge: true }).catch(() => {});
          });
          if (callbacks.onTeachers) callbacks.onTeachers(localList);
        } else {
          const map = new Map<string, Teacher>();
          cloudList.forEach(t => map.set(t.id, t));
          localList.forEach(t => {
            if (!map.has(t.id) && !t.id.startsWith('prof-00') && !t.id.startsWith('t-00')) {
              map.set(t.id, t);
              setDoc(doc(db, 'schools', currentCode, 'teachers', t.id), cleanForFirestore(t), { merge: true }).catch(() => {});
            }
          });
          const finalList = Array.from(map.values());
          try {
            localStorage.setItem(keys.TEACHERS, JSON.stringify(finalList));
          } catch {}
          if (callbacks.onTeachers) callbacks.onTeachers(finalList);
        }
      }, (err) => console.warn('Firestore teachers listener error', err));
      unsubscribes.push(unsubTeachers);

      // 3. Coordinators Collection
      const unsubCoords = onSnapshot(collection(db, 'schools', currentCode, 'coordinators'), (snap) => {
        const cloudList: Coordinator[] = [];
        snap.forEach(d => {
          const c = d.data() as Coordinator;
          if (isLegacyDemoCoordinator(d.id, c.name)) {
            deleteDoc(doc(db, 'schools', currentCode, 'coordinators', d.id)).catch(() => {});
            return;
          }
          cloudList.push(c);
        });

        const localList = this.getCoordinators();

        if (snap.empty && localList.length > 0) {
          localList.forEach(c => {
            setDoc(doc(db, 'schools', currentCode, 'coordinators', c.id), cleanForFirestore(c), { merge: true }).catch(() => {});
          });
          if (callbacks.onCoordinators) callbacks.onCoordinators(localList);
        } else {
          const map = new Map<string, Coordinator>();
          cloudList.forEach(c => map.set(c.id, c));
          localList.forEach(c => {
            if (!map.has(c.id) && !isLegacyDemoCoordinator(c.id, c.name)) {
              map.set(c.id, c);
              setDoc(doc(db, 'schools', currentCode, 'coordinators', c.id), cleanForFirestore(c), { merge: true }).catch(() => {});
            }
          });
          const finalList = Array.from(map.values());
          try {
            localStorage.setItem(keys.COORDINATORS, JSON.stringify(finalList));
          } catch {}
          if (callbacks.onCoordinators) callbacks.onCoordinators(finalList);
        }
      }, (err) => console.warn('Firestore coordinators listener error', err));
      unsubscribes.push(unsubCoords);

      // 4. Orientators Collection
      const unsubOrientators = onSnapshot(collection(db, 'schools', currentCode, 'orientators'), (snap) => {
        const cloudList: Orientator[] = [];
        snap.forEach(d => cloudList.push(d.data() as Orientator));
        const localList = this.getOrientators();

        if (snap.empty && localList.length > 0) {
          localList.forEach(o => {
            setDoc(doc(db, 'schools', currentCode, 'orientators', o.id), cleanForFirestore(o), { merge: true }).catch(() => {});
          });
          if (callbacks.onOrientators) callbacks.onOrientators(localList);
        } else {
          const map = new Map<string, Orientator>();
          cloudList.forEach(o => map.set(o.id, o));
          localList.forEach(o => {
            if (!map.has(o.id)) {
              map.set(o.id, o);
              setDoc(doc(db, 'schools', currentCode, 'orientators', o.id), cleanForFirestore(o), { merge: true }).catch(() => {});
            }
          });
          const finalList = Array.from(map.values());
          try {
            localStorage.setItem(keys.ORIENTATORS, JSON.stringify(finalList));
          } catch {}
          if (callbacks.onOrientators) callbacks.onOrientators(finalList);
        }
      }, (err) => console.warn('Firestore orientators listener error', err));
      unsubscribes.push(unsubOrientators);

      // 5. Students Collection
      const unsubStudents = onSnapshot(collection(db, 'schools', currentCode, 'students'), (snap) => {
        const list: Student[] = [];
        snap.forEach(d => {
          if (d.id.startsWith('std-00')) {
            deleteDoc(doc(db, 'schools', currentCode, 'students', d.id)).catch(() => {});
            return;
          }
          list.push(d.data() as Student);
        });
        try {
          localStorage.setItem(keys.STUDENTS, JSON.stringify(list));
        } catch {}
        if (callbacks.onStudents) callbacks.onStudents(list);
      }, (err) => console.warn('Firestore students listener error', err));
      unsubscribes.push(unsubStudents);

      // 5.5 Grade Attendances Collection
      const unsubGradeAttendance = onSnapshot(collection(db, 'schools', currentCode, 'gradeAttendances'), (snap) => {
        const list: DailyGradeAttendanceSummary[] = [];
        snap.forEach(d => {
          list.push(d.data() as DailyGradeAttendanceSummary);
        });
        try {
          localStorage.setItem(keys.GRADE_ATTENDANCE, JSON.stringify(list));
        } catch {}
      }, (err) => console.warn('Firestore grade attendances listener error', err));
      unsubscribes.push(unsubGradeAttendance);

      // 6. Daily Plans Collection
      const unsubDailyPlans = onSnapshot(collection(db, 'schools', currentCode, 'dailyPlans'), (snap) => {
        const list: DailyPlan[] = [];
        snap.forEach(d => {
          const p = d.data() as DailyPlan;
          if (isLegacyDemoDailyPlan(d.id, p.title, p.unitTheme)) {
            deleteDoc(doc(db, 'schools', currentCode, 'dailyPlans', d.id)).catch(() => {});
            return;
          }
          list.push(p);
        });
        try {
          localStorage.setItem(keys.DAILY_PLANS, JSON.stringify(list));
        } catch {}
        if (callbacks.onDailyPlans) callbacks.onDailyPlans(list);
      }, (err) => console.warn('Firestore dailyPlans listener error', err));
      unsubscribes.push(unsubDailyPlans);

      // 7. Weekly Plans Collection
      const unsubWeeklyPlans = onSnapshot(collection(db, 'schools', currentCode, 'weeklyPlans'), (snap) => {
        const list: WeeklyPlan[] = [];
        snap.forEach(d => {
          const w = d.data() as WeeklyPlan;
          if (isLegacyDemoWeeklyPlan(d.id, w.title, w.unitTitle)) {
            deleteDoc(doc(db, 'schools', currentCode, 'weeklyPlans', d.id)).catch(() => {});
            return;
          }
          list.push(w);
        });
        try {
          localStorage.setItem(keys.WEEKLY_PLANS, JSON.stringify(list));
        } catch {}
        if (callbacks.onWeeklyPlans) callbacks.onWeeklyPlans(list);
      }, (err) => console.warn('Firestore weeklyPlans listener error', err));
      unsubscribes.push(unsubWeeklyPlans);

      // 8. Learning Units Collection
      const unsubUnits = onSnapshot(collection(db, 'schools', currentCode, 'learningUnits'), (snap) => {
        const list: LearningUnit[] = [];
        snap.forEach(d => list.push(d.data() as LearningUnit));
        try {
          localStorage.setItem(keys.LEARNING_UNITS, JSON.stringify(list));
        } catch {}
        if (callbacks.onLearningUnits) callbacks.onLearningUnits(list);
      }, (err) => console.warn('Firestore learningUnits listener error', err));
      unsubscribes.push(unsubUnits);

      // 9. Psychology Reports Collection
      const unsubPsychology = onSnapshot(collection(db, 'schools', currentCode, 'psychologyReports'), (snap) => {
        const list: PsychologyCaseReport[] = [];
        snap.forEach(d => list.push(d.data() as PsychologyCaseReport));
        try {
          localStorage.setItem(keys.PSYCHOLOGY_REPORTS, JSON.stringify(list));
        } catch {}
        if (callbacks.onPsychologyReports) callbacks.onPsychologyReports(list);
      }, (err) => console.warn('Firestore psychologyReports listener error', err));
      unsubscribes.push(unsubPsychology);

    } catch (e) {
      console.error('Error setting up Firestore subscriptions', e);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
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
    try {
      const data = localStorage.getItem(keys.TEACHERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => !t.id.startsWith('prof-00') && !t.id.startsWith('t-00'));
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

  deleteTeacher(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const teachers = this.getTeachers().filter(t => t.id !== id);
    try {
      localStorage.setItem(keys.TEACHERS, JSON.stringify(teachers));
      deleteDoc(doc(db, 'schools', currentCode, 'teachers', id)).catch(e => console.error('Cloud deleteTeacher error', e));
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
      units.forEach(u => setDoc(doc(db, 'schools', currentCode, 'learningUnits', u.id), cleanForFirestore(u), { merge: true }).catch(() => {}));
    } catch (e) {
      console.error('Error saving learning units', e);
    }
  },

  saveLearningUnit(unit: LearningUnit): void {
    const units = this.getLearningUnits();
    const index = units.findIndex(u => u.id === unit.id);
    const updated = {
      ...unit,
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
      cleanList.forEach(s => setDoc(doc(db, 'schools', currentCode, 'students', s.id), cleanForFirestore(s), { merge: true }).catch(() => {}));
    } catch (e) {
      console.error('Error saving students', e);
    }
  },

  saveStudent(student: Student): void {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
      students[index] = student;
    } else {
      students.push(student);
    }
    this.saveStudents(students);
  },

  deleteStudent(id: string): void {
    const currentCode = this.getCurrentSchoolCode();
    const keys = getStorageKeys(currentCode);
    const students = this.getStudents().filter(s => s.id !== id);
    try {
      localStorage.setItem(keys.STUDENTS, JSON.stringify(students));
      deleteDoc(doc(db, 'schools', currentCode, 'students', id)).catch(e => console.error('Cloud deleteStudent error', e));
    } catch (e) {
      console.error('Error deleting student', e);
    }
  },

  importStudentsInBulk(newStudents: Student[]): { added: number; updated: number; total: number } {
    const currentCode = this.getCurrentSchoolCode();
    const existing = this.getStudents();
    const map = new Map<string, Student>();

    existing.forEach(s => {
      const key = (s.rne && s.rne.trim()) ? s.rne.trim().toLowerCase() : `${s.name.toLowerCase().trim()}_${s.grade}_${s.section}`;
      map.set(key, s);
    });

    let added = 0;
    let updated = 0;

    newStudents.forEach(ns => {
      const key = (ns.rne && ns.rne.trim()) ? ns.rne.trim().toLowerCase() : `${ns.name.toLowerCase().trim()}_${ns.grade}_${ns.section}`;
      if (map.has(key)) {
        const prev = map.get(key)!;
        const mergedObj = { ...prev, ...ns };
        map.set(key, mergedObj);
        setDoc(doc(db, 'schools', currentCode, 'students', mergedObj.id), cleanForFirestore(mergedObj), { merge: true }).catch(() => {});
        updated++;
      } else {
        map.set(key, ns);
        setDoc(doc(db, 'schools', currentCode, 'students', ns.id), cleanForFirestore(ns), { merge: true }).catch(() => {});
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
      version: '5.0-multischool',
      schoolCode: this.getCurrentSchoolCode(),
      exportDate: new Date().toISOString(),
      config: this.getConfig(),
      coordinators: this.getCoordinators(),
      orientators: this.getOrientators(),
      teachers: this.getTeachers(),
      students: this.getStudents(),
      psychologyReports: this.getPsychologyReports(),
      dailyPlans: this.getDailyPlans(),
      weeklyPlans: this.getWeeklyPlans(),
      learningUnits: this.getLearningUnits()
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
      return true;
    } catch (e) {
      console.error('Error importing backup JSON data', e);
      return false;
    }
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
};
