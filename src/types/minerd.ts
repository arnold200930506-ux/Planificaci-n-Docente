export type EducationalLevel = 'inicial' | 'primario_primer_ciclo' | 'primario_segundo_ciclo' | 'secundario_primer_ciclo' | 'secundario_segundo_ciclo';

export type SubjectArea = 
  | 'Lengua Española'
  | 'Matemática'
  | 'Ciencias Sociales'
  | 'Ciencias de la Naturaleza'
  | 'Educación Artística'
  | 'Educación Física'
  | 'Formación Integral Humana y Religiosa'
  | 'Lenguas Extranjeras (Inglés)'
  | 'Lenguas Extranjeras (Francés)';

export type FundamentalCompetencyKey = 
  | 'etica_ciudadana'
  | 'comunicativa'
  | 'pensamiento_logico'
  | 'resolucion_problemas'
  | 'cientifica_tecnologica'
  | 'ambiental_salud'
  | 'desarrollo_personal';

export interface FundamentalCompetency {
  key: FundamentalCompetencyKey;
  name: string;
  shortName: string;
  description: string;
}

export type ClassMomentType = 'inicio' | 'desarrollo' | 'cierre';

export type EvaluationType = 'Diagnóstica' | 'Formativa' | 'Sumativa';
export type EvaluationAgent = 'Autoevaluación' | 'Coevaluación' | 'Heteroevaluación';
export type EvaluationInstrument = 
  | 'Lista de Cotejo'
  | 'Rúbrica Analítica'
  | 'Rúbrica Holística'
  | 'Escala Estimativa'
  | 'Guía de Observación'
  | 'Registro Anecdótico'
  | 'Cuaderno del Estudiante'
  | 'Prueba Escrita / Oral'
  | 'Portafolio de Evidencias';

export type SchoolShift = 
  | 'Tanda Matutina (8:00 AM - 12:00 PM)' 
  | 'Tanda Vespertina (1:00 PM - 4:45 PM)' 
  | 'Ambas Tandas (Doble Tanda)';

export type StudentGrouping = 'Individual' | 'En parejas' | 'Equipos pequeños (3-4)' | 'Grupo grande / Plenaria';

export type ReviewStatus = 'draft' | 'pending' | 'approved' | 'returned';

export type UserRole = 'teacher' | 'coordinator' | 'director' | 'orientator';

export interface WhatsAppConfig {
  autoSendOnApproval: boolean;
  autoSendOnReturn: boolean;
  approvedTemplate?: string;
  returnedTemplate?: string;
  reminderTemplate?: string;
  psychologyCitationTemplate?: string;
}

export type TeacherLevel = 
  | 'Nivel Inicial'
  | 'Nivel Primario Primer Ciclo'
  | 'Nivel Primario Segundo Ciclo'
  | 'Secundaria'
  | 'Auxiliar';

export interface Teacher {
  id: string;
  idCard: string; // Cédula dominicana (ej. 001-1234567-8)
  name: string;
  phone: string; // Número de WhatsApp (ej. 809-555-1234)
  email: string;
  level: TeacherLevel | EducationalLevel | string;
  grades: string[]; // ej. ["4to Grado", "5to Grado"]
  sections: string[]; // ej. ["A", "B"]
  areas?: SubjectArea[];
  shift: SchoolShift;
  status: 'active' | 'inactive';
  notes?: string;
}

export type CoordinatorCycle = 
  | 'Nivel Inicial' 
  | 'Primario 1er Ciclo' 
  | 'Primario 2do Ciclo' 
  | 'Secundaria' 
  | 'Registro y Control Académico'
  | 'Administrativo y Financiero'
  | 'General Institucional';

export interface Coordinator {
  id: string;
  idCard: string;
  name: string;
  roleTitle: string; // ej: "Coordinador/a Pedagógico/a", "Coordinador/a de Registro y Control Académico", "Coordinador/a Administrativo/a y Financiero/a"
  phone: string;
  email: string;
  cycle: CoordinatorCycle;
  shift: SchoolShift;
  assignedGrades: string[];
  department?: 'Pedagógico' | 'Registro y Control' | 'Administrativo y Financiero' | 'General';
  password?: string; // Clave de acceso individual
  status: 'active' | 'inactive';
  notes?: string;
}

export interface Orientator {
  id: string;
  idCard: string;
  name: string;
  roleTitle: string; // ej: "Orientador/a Escolar" | "Psicólogo/a Educativo/a" | "Terapeuta del Aprendizaje"
  phone: string;
  email: string;
  shift: SchoolShift;
  assignedGrades: string[];
  password?: string; // Clave de acceso individual
  status: 'active' | 'inactive';
  notes?: string;
}

export type PsychologyCaseType = 
  | 'Conductual / Comportamiento'
  | 'Emocional / Psicológico'
  | 'Rendimiento Académico / Aprendizaje'
  | 'Convivencia Escolar / Disciplina'
  | 'Situación Familiar / Vulnerabilidad'
  | 'Asistencia / Ausentismo Frecuente'
  | 'Necesidades Específicas de Apoyo Educativo (NEAE)';

export type PsychologyPriority = 'Normal' | 'Media' | 'Alta' | 'Urgente';

export type PsychologyCaseStatus = 
  | 'Abierto'
  | 'En Acompañamiento'
  | 'Citación a Padres Realizada'
  | 'Resuelto / Cerrado'
  | 'Derivado a CAD / MINERD / CONANI';

export interface PsychologyCaseReport {
  id: string;
  caseCode: string; // ej: OP-2025-001
  date: string;
  studentName: string;
  studentRne: string; // Registro Nacional de Estudiante
  age?: number;
  grade: string;
  section: string;
  shift: SchoolShift;
  referringTeacher: string;
  caseType: PsychologyCaseType;
  priority: PsychologyPriority;
  incidentDescription: string;
  interventionPlan: string;
  parentName: string;
  parentPhone: string;
  citationDate?: string;
  citationTime?: string;
  citationNotes?: string;
  orientatorId?: string; // ID del orientador seleccionado
  orientatorName: string; // Nombre del orientador asignado
  status: PsychologyCaseStatus;
  observations?: string;
  referringTeacherPhone?: string; // Teléfono o WhatsApp del maestro que remitió
  acknowledgmentDate?: string;    // Fecha/hora en que Orientación recibió el caso
  resolutionNotes?: string;        // Informe de Conclusión / Resolución del caso
  teacherRecommendations?: string; // Pautas y Recomendaciones Pedagógicas para el Docente en Aula
  resolutionDate?: string;         // Fecha de conclusión
  resolutionSentToTeacher?: boolean; // Si ya fue enviado al maestro por WhatsApp
  createdAt: string;
  updatedAt: string;
}

export interface DailyGradeAttendanceSummary {
  id: string; // ej: 2026-09-30_4to Grado_A_matutina
  date: string;
  grade: string;
  section: string;
  shift: SchoolShift;
  teacherName?: string;
  totalEnrolled: number;
  presentCount: number;
  presentMales?: number;
  presentFemales?: number;
  absentCount: number;
  absentMales?: number;
  absentFemales?: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number; // Porcentaje 0-100%
  records: StudentAttendanceRecord[];
  submittedAt: string;
  submittedBy?: string;
}

export interface ReviewLog {
  reviewerName: string;
  reviewerRole: 'director' | 'coordinator';
  reviewedAt: string;
  status: ReviewStatus;
  feedback?: string;
}

export interface SchoolDirectorAccount {
  id: string; // ID único o igual al código de centro
  schoolCode: string;
  schoolName: string;
  regional: string;
  district: string;
  tanda: SchoolShift;
  directorName: string;
  directorPhone?: string;
  directorIdCard?: string;
  directorEmail?: string;
  password?: string; // Contraseña individual de acceso para este director
  logoUrl?: string; // Logo institucional (Base64 o URL)
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface SchoolConfig {
  schoolName: string;
  schoolCode: string;
  regional: string;
  district: string;
  schoolYear: string;
  tanda: SchoolShift;
  logoUrl?: string; // Logo institucional del centro educativo (Base64 o URL)
  teacherName: string;
  teacherPhone?: string;
  coordinatorName: string;
  coordinatorPhone?: string;
  principalName: string;
  principalPhone?: string;
  orientatorName?: string;
  orientatorPhone?: string;
  activeRole: UserRole;
  whatsAppConfig: WhatsAppConfig;
}

export interface Student {
  id: string;
  number?: number; // Número de orden en la lista (ej. 1, 2, 3...)
  name: string;
  gender?: 'M' | 'F' | 'Masculino' | 'Femenino';
  rne: string; // Registro Nacional de Estudiantes
  grade: string;
  section: string;
  shift: SchoolShift;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
}

export type StudentAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentAttendanceRecord {
  studentId: string;
  studentName: string;
  studentRne: string;
  status: StudentAttendanceStatus;
  notes?: string;
}

export interface DailyAttendance {
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number; // Porcentaje de asistencia 0-100%
  records: StudentAttendanceRecord[];
}

export interface PlanAttachment {
  id: string;
  name: string;
  size: number; // Bytes
  type: string; // MIME type or extension
  dataUrl?: string; // Base64 data for storage & preview
  url?: string; // Optional external cloud URL (Drive, YouTube, etc.)
  category?: 'document' | 'rubric' | 'activity' | 'guide' | 'image' | 'link' | 'external_plan' | 'other';
  uploadedAt: string;
}

export interface DailyPlan {
  id: string;
  title: string;
  date: string;
  level: EducationalLevel;
  grade: string;
  section: string;
  area: SubjectArea;
  unitTheme: string;
  pedagogicalIntention: string;
  
  // Teacher association
  teacherId?: string;
  teacherName?: string;
  teacherPhone?: string;

  // Attendance tracking
  attendance?: DailyAttendance;

  // Attachments / Digital Resources
  attachments?: PlanAttachment[];

  // Curricular elements
  fundamentalCompetencies: FundamentalCompetencyKey[];
  specificCompetencies: string[];
  transversalAxis: string;
  conceptualContents: string[];
  proceduralContents: string[];
  attitudinalContents: string[];
  achievementIndicators: string[];

  // Class moments (durations in minutes)
  startDuration: number;
  startActivities: string;
  
  developmentDuration: number;
  developmentActivities: string;
  studentGrouping: StudentGrouping;

  closeDuration: number;
  closeActivities: string;
  metacognitionQuestions: string;

  // Additional elements
  didacticResources: string[];
  
  // Evaluation
  evaluationTypes: EvaluationType[];
  evaluationAgents: EvaluationAgent[];
  evaluationInstruments: EvaluationInstrument[];
  evaluationCriteria: string;

  // Metadata & Review Flow
  status: 'draft' | 'completed' | 'reviewed';
  reviewStatus: ReviewStatus;
  reviewerName?: string;
  reviewerRole?: 'director' | 'coordinator';
  reviewedAt?: string;
  reviewFeedback?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyDayPlan {
  pedagogicalIntention: string;
  topic: string;
  startActivity: string;
  developmentActivity: string;
  closeActivity: string;
  resources: string;
  evaluation: string;
  linkedDailyPlanId?: string;
}

export interface WeeklyPlan {
  id: string;
  title: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  level: EducationalLevel;
  grade: string;
  section: string;
  area: SubjectArea;
  unitTitle: string;
  unitCompetency: string;
  transversalAxis: string;
  achievementIndicators: string[];
  days: {
    lunes: WeeklyDayPlan;
    martes: WeeklyDayPlan;
    miercoles: WeeklyDayPlan;
    jueves: WeeklyDayPlan;
    viernes: WeeklyDayPlan;
  };
  generalResources: string[];
  generalEvaluation: string;
  
  // Attachments / Digital Resources
  attachments?: PlanAttachment[];
  
  // Teacher & Review
  teacherId?: string;
  teacherName?: string;
  teacherPhone?: string;
  status: 'draft' | 'completed' | 'reviewed';
  reviewStatus: ReviewStatus;
  reviewerName?: string;
  reviewerRole?: 'director' | 'coordinator';
  reviewedAt?: string;
  reviewFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningUnit {
  id: string;
  title: string;
  level: EducationalLevel;
  grade: string;
  area: SubjectArea;
  durationWeeks: number;
  startDate: string;
  endDate: string;
  transversalAxis: string;
  learningSituation: {
    startingPoint: string;
    studentRole: string;
    challengeQuestion: string;
    finalProduct: string;
  };
  fundamentalCompetencies: FundamentalCompetencyKey[];
  specificCompetencies: string[];
  conceptualContents: string[];
  proceduralContents: string[];
  attitudinalContents: string[];
  achievementIndicators: string[];
  didacticalSequenceSummary: string;
  
  // Attachments / Digital Resources
  attachments?: PlanAttachment[];
  
  // Teacher & Review
  teacherId?: string;
  teacherName?: string;
  teacherPhone?: string;
  status: 'draft' | 'completed' | 'reviewed';
  reviewStatus: ReviewStatus;
  reviewerName?: string;
  reviewerRole?: 'director' | 'coordinator';
  reviewedAt?: string;
  reviewFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurricularTopicSuggestion {
  name: string;
  grade?: string; // Grado correspondiente a la adecuación curricular
  suggestedIntention: string;
  specificCompetencies: string[];
  conceptual: string[];
  procedural: string[];
  attitudinal: string[];
  indicators: string[];
  startSuggestions: string[];
  devSuggestions: string[];
  closeSuggestions: string[];
  resourceSuggestions: string[];
}
