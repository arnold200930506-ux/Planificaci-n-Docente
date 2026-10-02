import { storageService } from './storageService';

export type AuthRole = 'director' | 'coordinator' | 'orientator' | 'teacher';

export interface AuthSession {
  isUnlocked: boolean;
  role: AuthRole;
  userName: string;
  roleTitle: string;
  unlockedAt: string;
}

export const DIRECTOR_NAME = 'Licdo. Arnold Javier Sanchez';
export const DIRECTOR_PASSWORD = 'Javiersanchez02';
export const MASTER_PASSWORD = DIRECTOR_PASSWORD;

export const COORDINATOR_DEFAULT_PASSWORD = 'Coordinacion2025';
export const ORIENTATOR_DEFAULT_PASSWORD = 'Psicologia2025';

const AUTH_STORAGE_KEY = 'minerd_multirole_auth_session_v4';

export const authService = {
  getDirectorName(): string {
    return DIRECTOR_NAME;
  },

  getSession(): AuthSession {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isUnlocked) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }

    return {
      isUnlocked: false,
      role: 'teacher',
      userName: 'Docente Invitado',
      roleTitle: 'Docente MINERD',
      unlockedAt: ''
    };
  },

  isDirector(): boolean {
    const session = this.getSession();
    return session.isUnlocked && session.role === 'director';
  },

  isUnlocked(): boolean {
    return this.getSession().isUnlocked;
  },

  getCurrentRole(): AuthRole {
    return this.getSession().role;
  },

  getCurrentUserTitle(): string {
    const session = this.getSession();
    if (!session.isUnlocked) return 'Modo Docente (Libre Acceso)';
    return `${session.userName} (${session.roleTitle})`;
  },

  unlockWithRole(
    requestedRole: 'director' | 'coordinator' | 'orientator',
    passwordInput: string,
    remember: boolean = true,
    customUserName?: string
  ): { success: boolean; message?: string } {
    const trimmed = passwordInput.trim();
    if (!trimmed) {
      return { success: false, message: 'Debe ingresar la contraseña de acceso.' };
    }

        // 1. Director check (Licdo. Arnold Javier Sanchez - Escuela Dr. José Francisco Peña Gómez)
    if (requestedRole === 'director') {
      if (trimmed === DIRECTOR_PASSWORD) {
        const session: AuthSession = {
          isUnlocked: true,
          role: 'director',
          userName: customUserName || DIRECTOR_NAME,
          roleTitle: 'Director General',
          unlockedAt: new Date().toISOString()
        };
        this.saveSession(session, remember);
        return { success: true };
      }
      return { success: false, message: 'Contraseña de Dirección incorrecta.' };
    }

    // 2. Coordinator check (checks individual coordinator passwords first, then master)
    if (requestedRole === 'coordinator') {
      const coordinators = storageService.getCoordinators();
      const matchedCoordinator = coordinators.find(c => 
        c.status !== 'inactive' && c.password && c.password.trim() === trimmed
      );

      if (matchedCoordinator) {
        const session: AuthSession = {
          isUnlocked: true,
          role: 'coordinator',
          userName: matchedCoordinator.name,
          roleTitle: matchedCoordinator.roleTitle || 'Coordinación Pedagógica',
          unlockedAt: new Date().toISOString()
        };
        this.saveSession(session, remember);
        return { success: true };
      }

      // Master fallback or director master password
      if (
        trimmed === COORDINATOR_DEFAULT_PASSWORD ||
        trimmed.toLowerCase() === 'coordinacion2025' ||
        trimmed === DIRECTOR_PASSWORD
      ) {
        const firstCoord = coordinators.find(c => c.status !== 'inactive');
        const session: AuthSession = {
          isUnlocked: true,
          role: 'coordinator',
          userName: customUserName || (firstCoord ? firstCoord.name : 'Coordinación Pedagógica'),
          roleTitle: firstCoord ? firstCoord.roleTitle : 'Coordinación Pedagógica',
          unlockedAt: new Date().toISOString()
        };
        this.saveSession(session, remember);
        return { success: true };
      }

      return { success: false, message: 'Contraseña de Coordinación incorrecta. Verifique sus credenciales con la Dirección.' };
    }

    // 3. Orientator / Psychology check (checks individual orientator passwords first, then master)
    if (requestedRole === 'orientator') {
      const orientators = storageService.getOrientators();
      const matchedOrientator = orientators.find(o => 
        o.status !== 'inactive' && o.password && o.password.trim() === trimmed
      );

      if (matchedOrientator) {
        const session: AuthSession = {
          isUnlocked: true,
          role: 'orientator',
          userName: matchedOrientator.name,
          roleTitle: matchedOrientator.roleTitle || 'Orientación y Psicología',
          unlockedAt: new Date().toISOString()
        };
        this.saveSession(session, remember);
        return { success: true };
      }

      // Master fallback or director master password
      if (
        trimmed === ORIENTATOR_DEFAULT_PASSWORD ||
        trimmed.toLowerCase() === 'psicologia2025' ||
        trimmed.toLowerCase() === 'orientacion2025' ||
        trimmed === DIRECTOR_PASSWORD
      ) {
        const firstOrient = orientators.find(o => o.status !== 'inactive');
        const session: AuthSession = {
          isUnlocked: true,
          role: 'orientator',
          userName: customUserName || (firstOrient ? firstOrient.name : 'Equipo de Orientación y Psicología'),
          roleTitle: firstOrient ? firstOrient.roleTitle : 'Orientación y Psicología Escolar',
          unlockedAt: new Date().toISOString()
        };
        this.saveSession(session, remember);
        return { success: true };
      }

      return { success: false, message: 'Contraseña de Orientación y Psicología incorrecta. Verifique sus credenciales con la Dirección.' };
    }

    return { success: false, message: 'Rol de acceso no reconocido.' };
  },

  unlock(password: string, remember: boolean = true): boolean {
    const trimmed = password.trim();
    if (trimmed === DIRECTOR_PASSWORD) {
      return this.unlockWithRole('director', password, remember).success;
    }
    const coordResult = this.unlockWithRole('coordinator', password, remember);
    if (coordResult.success) return true;

    const orientResult = this.unlockWithRole('orientator', password, remember);
    if (orientResult.success) return true;

    return false;
  },

  saveSession(session: AuthSession, remember: boolean = true): void {
    try {
      const serialized = JSON.stringify(session);
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      }
    } catch (e) {
      console.error('Error saving auth session', e);
    }
  },

  lock(): void {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem('minerd_director_auth_session');
      localStorage.removeItem('minerd_director_auth_session');
    } catch (e) {
      console.error('Error clearing auth session', e);
    }
  },

  isRestrictedTab(tab: string): boolean {
    const restrictedTabs = ['dashboard', 'management', 'coordinators', 'psychology', 'teachers'];
    return restrictedTabs.includes(tab);
  },

  isRegistrationCoordinator(): boolean {
    const session = this.getSession();
    if (!session.isUnlocked) return false;
    if (session.role === 'director') return true;
    if (session.role === 'coordinator') {
      const title = (session.roleTitle || '').toLowerCase();
      const name = (session.userName || '').toLowerCase();
      return title.includes('registro') || title.includes('control académico') || name.includes('registro');
    }
    return false;
  },

  canAccessManagementTab(): boolean {
    const session = this.getSession();
    if (!session.isUnlocked) return false;
    if (session.role === 'director') return true;
    // El coordinador de registro tiene acceso a la vista de Supervisión Directiva específicamente para la consulta de asistencia
    if (this.isRegistrationCoordinator()) return true;
    return false;
  },
  canAccessTab(tab: string): boolean {
    if (!this.isRestrictedTab(tab)) {
      return true; // Teacher tabs are always accessible
    }

    const session = this.getSession();
    if (!session.isUnlocked) {
      return false;
    }

    // Directores de Centros: Tienen todos los permisos dentro de su centro
    // (Supervisión Directiva, Coordinadores, Orientación, Padrón Docente, Resumen General)
    // NOTA: La Administración Multi-Centros es reservada exclusivamente para el Super Administrador.
    if (session.role === 'director') {
      return true;
    }

    // COORDINADORES: Tienen acceso a Supervisión Pedagógica ('management'), Coordinadores ('coordinators') y Resumen General ('dashboard')
    if (session.role === 'coordinator') {
      const allowed = ['management', 'coordinators', 'dashboard', 'daily', 'weekly', 'units', 'curriculum', 'attendance', 'print'];
      return allowed.includes(tab);
    }

    // ORIENTADORES: Solo tienen acceso a Área de Orientación ('psychology') y Resumen General ('dashboard'), además del aula
    if (session.role === 'orientator') {
      return ['psychology', 'dashboard', 'daily', 'weekly', 'units', 'curriculum', 'attendance', 'print'].includes(tab);
    }

    return false;
  }
};