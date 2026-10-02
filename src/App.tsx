import { ErrorBoundary } from './components/ErrorBoundary';
import React, { useState, useEffect } from 'react';
import { SidebarNav, ActiveTab } from './components/SidebarNav';
import { ManagementDashboard } from './components/ManagementDashboard';
import { CoordinatorsManagement } from './components/CoordinatorsManagement';
import { PsychologyGuidance } from './components/PsychologyGuidance';
import { TeacherManagement } from './components/TeacherManagement';
import { AttendanceManagementView } from './components/AttendanceManagementView';
import { Dashboard } from './components/Dashboard';
import { DailyPlanner } from './components/DailyPlanner';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { LearningUnitPlanner } from './components/LearningUnitPlanner';
import { CurriculumBrowser } from './components/CurriculumBrowser';
import { PrintableExporter } from './components/PrintableExporter';
import { SettingsModal } from './components/SettingsModal';
import { AuthLockModal } from './components/AuthLockModal';
import { RestrictedAccessView } from './components/RestrictedAccessView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { 
  DailyPlan, 
  WeeklyPlan, 
  LearningUnit, 
  SchoolConfig, 
  SubjectArea, 
  CurricularTopicSuggestion,
  Teacher,
  Coordinator,
  Orientator,
  PsychologyCaseReport,
  ReviewStatus,
  UserRole
} from './types/minerd';
import { storageService, StorageInitErrorInfo } from './services/storageService';
import { authService, DIRECTOR_NAME } from './services/authService';
import { TRANSVERSAL_AXES, METACOGNITION_QUESTIONS } from './data/minerdCurriculum';

export default function App() {
  // Free teacher dashboard as primary entry
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Authentication & Lock State for Director/Coordinators
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => authService.isUnlocked());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingTargetTab, setPendingTargetTab] = useState<ActiveTab | null>(null);

  // Core data states
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => storageService.getConfig());
  const [teachers, setTeachers] = useState<Teacher[]>(() => storageService.getTeachers());
  const [coordinators, setCoordinators] = useState<Coordinator[]>(() => storageService.getCoordinators());
  const [orientators, setOrientators] = useState<Orientator[]>(() => storageService.getOrientators());
  const [psychologyReports, setPsychologyReports] = useState<PsychologyCaseReport[]>(() => storageService.getPsychologyReports());
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>(() => storageService.getDailyPlans());
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>(() => storageService.getWeeklyPlans());
  const [learningUnits, setLearningUnits] = useState<LearningUnit[]>(() => storageService.getLearningUnits());

  // Active items being edited or printed
  const [editingDailyPlan, setEditingDailyPlan] = useState<DailyPlan | null>(null);
  const [editingWeeklyPlan, setEditingWeeklyPlan] = useState<WeeklyPlan | null>(null);
  
  // Print exporter selection state
  const [printType, setPrintType] = useState<'daily' | 'weekly' | 'unit'>('daily');
  const [printId, setPrintId] = useState<string>('');

  const [currentSchoolCode, setCurrentSchoolCode] = useState<string>(() => storageService.getCurrentSchoolCode());

  // Storage & Firebase initialization diagnostic state
  const [initError, setInitError] = useState<StorageInitErrorInfo | null>(null);

  // Subscribe to Cloud Firestore in real time with comprehensive diagnostics
  useEffect(() => {
    console.log('[APP_INIT] Iniciando suscripción y lectura de configuración para el centro:', currentSchoolCode);
    
    try {
      const unsubscribe = storageService.subscribeToCloudData({
        onConfig: (cfg) => {
          console.log('[APP_INIT] Configuración institucional recibida correctamente:', cfg.schoolName);
          setSchoolConfig(cfg);
          setInitError(null);
        },
        onTeachers: (tList) => setTeachers(tList),
        onCoordinators: (cList) => setCoordinators(cList),
        onOrientators: (oList) => setOrientators(oList),
        onPsychologyReports: (rList) => setPsychologyReports(rList),
        onDailyPlans: (dList) => setDailyPlans(dList),
        onWeeklyPlans: (wList) => setWeeklyPlans(wList),
        onLearningUnits: (uList) => setLearningUnits(uList),
        onError: (scope, err) => {
          const errorPayload: StorageInitErrorInfo = {
            scope: scope === 'config' ? 'config' : 'general',
            message: err?.message || 'Error al conectar con la base de datos de Firebase.',
            timestamp: new Date().toLocaleTimeString(),
            originalError: err
          };
          console.error('[APP_INIT_ERROR] Error en storageService al sincronizar con Firebase:', errorPayload);
          setInitError(errorPayload);
        }
      });
      return () => unsubscribe();
    } catch (e: any) {
      console.error('[APP_INIT_CRITICAL] Excepción síncrona en inicialización de storageService:', e);
      setInitError({
        scope: 'state',
        message: e?.message || 'Excepción crítica al inicializar storageService.',
        timestamp: new Date().toLocaleTimeString(),
        originalError: e
      });
    }
  }, [currentSchoolCode]);

  const handleSwitchSchool = (newCode: string) => {
    storageService.setCurrentSchoolCode(newCode);
    setCurrentSchoolCode(newCode);
    reloadAllData();
  };

  const reloadAllData = () => {
    const code = storageService.getCurrentSchoolCode();
    setCurrentSchoolCode(code);
    setSchoolConfig(storageService.getConfig());
    setTeachers(storageService.getTeachers());
    setCoordinators(storageService.getCoordinators());
    setOrientators(storageService.getOrientators());
    setPsychologyReports(storageService.getPsychologyReports());
    setDailyPlans(storageService.getDailyPlans());
    setWeeklyPlans(storageService.getWeeklyPlans());
    setLearningUnits(storageService.getLearningUnits());
  };

  // Pending review count across daily & weekly plans
  const pendingReviewCount = 
    dailyPlans.filter(p => p.reviewStatus === 'pending' || (!p.reviewStatus && p.status === 'completed')).length +
    weeklyPlans.filter(p => p.reviewStatus === 'pending' || (!p.reviewStatus && p.status === 'completed')).length;

  // Authentication Handlers
  const handleRequestUnlock = (targetTab?: ActiveTab, defaultRole?: 'director' | 'coordinator' | 'orientator') => {
    if (targetTab) {
      setPendingTargetTab(targetTab);
    }
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsUnlocked(true);
    setIsAuthModalOpen(false);
    if (pendingTargetTab) {
      setActiveTab(pendingTargetTab);
      setPendingTargetTab(null);
    }
  };

  const handleLockSession = () => {
    authService.lock();
    setIsUnlocked(false);
    if (authService.isRestrictedTab(activeTab)) {
      setActiveTab('daily');
    }
  };

  // Handlers for Teachers
  const handleSaveTeacher = (teacher: Teacher) => {
    storageService.saveTeacher(teacher);
    setTeachers(storageService.getTeachers());
  };

  const handleDeleteTeacher = (id: string) => {
    storageService.deleteTeacher(id);
    setTeachers(storageService.getTeachers());
  };

  const handleImportTeachersBatch = (newTeachers: Teacher[]) => {
    storageService.importTeachersBatch(newTeachers);
    setTeachers(storageService.getTeachers());
  };

  // Handlers for Coordinators
  const handleSaveCoordinator = async (coordinator: Coordinator) => {
    await storageService.saveCoordinator(coordinator);
    setCoordinators(storageService.getCoordinators());
  };

  const handleDeleteCoordinator = async (id: string) => {
    await storageService.deleteCoordinator(id);
    setCoordinators(storageService.getCoordinators());
  };

  // Handlers for Orientators & Psychologists
  const handleSaveOrientator = async (orientator: Orientator) => {
    await storageService.saveOrientator(orientator);
    setOrientators(storageService.getOrientators());
  };

  const handleDeleteOrientator = async (id: string) => {
    await storageService.deleteOrientator(id);
    setOrientators(storageService.getOrientators());
  };

  // Handlers for Psychology & Guidance Reports
  const handleSavePsychologyReport = (report: PsychologyCaseReport) => {
    storageService.savePsychologyReport(report);
    setPsychologyReports(storageService.getPsychologyReports());
  };

  const handleDeletePsychologyReport = (id: string) => {
    storageService.deletePsychologyReport(id);
    setPsychologyReports(storageService.getPsychologyReports());
  };

  // Supervision & Review Handlers
  const handleUpdateDailyReview = (planId: string, status: ReviewStatus, feedback?: string) => {
    storageService.updateDailyPlanReview(
      planId,
      status,
      schoolConfig.coordinatorName || DIRECTOR_NAME,
      'director',
      feedback
    );
    setDailyPlans(storageService.getDailyPlans());
  };

  const handleUpdateWeeklyReview = (planId: string, status: ReviewStatus, feedback?: string) => {
    storageService.updateWeeklyPlanReview(
      planId,
      status,
      schoolConfig.coordinatorName || DIRECTOR_NAME,
      'director',
      feedback
    );
    setWeeklyPlans(storageService.getWeeklyPlans());
  };

  const handleUpdateUnitReview = (planId: string, status: ReviewStatus, feedback?: string) => {
    const units = storageService.getLearningUnits();
    const idx = units.findIndex(u => u.id === planId);
    if (idx >= 0) {
      units[idx] = {
        ...units[idx],
        reviewStatus: status,
        reviewerName: schoolConfig.coordinatorName || DIRECTOR_NAME,
        reviewedAt: new Date().toISOString(),
        reviewFeedback: feedback || units[idx].reviewFeedback,
        updatedAt: new Date().toISOString()
      };
      storageService.saveLearningUnits(units);
      setLearningUnits(units);
    }
  };

  // Handlers for Daily Plans
  const handleNewDailyPlan = () => {
    setEditingDailyPlan(null);
    setActiveTab('daily');
  };

  const handleEditDailyPlan = (plan: DailyPlan) => {
    setEditingDailyPlan(plan);
    setActiveTab('daily');
  };

  const handleDuplicateDailyPlan = (plan: DailyPlan) => {
    const duplicated: DailyPlan = {
      ...plan,
      id: `dp-${Date.now()}`,
      title: `${plan.title} (Copia)`,
      unitTheme: `${plan.unitTheme} (Copia)`,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      reviewStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storageService.saveDailyPlan(duplicated);
    setDailyPlans(storageService.getDailyPlans());
    setEditingDailyPlan(duplicated);
    setActiveTab('daily');
  };

  const handleSaveDailyPlan = (plan: DailyPlan) => {
    storageService.saveDailyPlan(plan);
    setDailyPlans(storageService.getDailyPlans());
    setEditingDailyPlan(plan);
  };

  const handleDeleteDailyPlan = (id: string) => {
    storageService.deleteDailyPlan(id);
    setDailyPlans(storageService.getDailyPlans());
    if (editingDailyPlan?.id === id) {
      setEditingDailyPlan(null);
    }
  };

  // Handlers for Weekly Plans
  const handleNewWeeklyPlan = () => {
    setEditingWeeklyPlan(null);
    setActiveTab('weekly');
  };

  const handleEditWeeklyPlan = (plan: WeeklyPlan) => {
    setEditingWeeklyPlan(plan);
    setActiveTab('weekly');
  };

  const handleSaveWeeklyPlan = (plan: WeeklyPlan) => {
    storageService.saveWeeklyPlan(plan);
    setWeeklyPlans(storageService.getWeeklyPlans());
    setEditingWeeklyPlan(plan);
  };

  // Handlers for Learning Units
  const handleSaveUnit = (unit: LearningUnit) => {
    storageService.saveLearningUnit(unit);
    setLearningUnits(storageService.getLearningUnits());
  };

  const handleDeleteUnit = (id: string) => {
    storageService.deleteLearningUnit(id);
    setLearningUnits(storageService.getLearningUnits());
  };

  // Print Handlers
  const handlePrintPlan = (type: 'daily' | 'weekly' | 'unit', id: string) => {
    setPrintType(type);
    setPrintId(id);
    setActiveTab('print');
  };

  // Curriculum Suggestion Integration
  const handleSelectTopicForNewPlan = (area: SubjectArea, topic: CurricularTopicSuggestion) => {
    const today = new Date().toISOString().split('T')[0];
    const newPlan: DailyPlan = {
      id: `dp-${Date.now()}`,
      title: topic.name,
      date: today,
      level: 'primario_segundo_ciclo',
      grade: '4to Grado',
      section: 'A',
      area: area,
      unitTheme: topic.name,
      pedagogicalIntention: topic.suggestedIntention,
      teacherName: schoolConfig.teacherName,
      fundamentalCompetencies: ['comunicativa', 'pensamiento_logico'],
      specificCompetencies: topic.specificCompetencies,
      transversalAxis: TRANSVERSAL_AXES[0],
      conceptualContents: topic.conceptual,
      proceduralContents: topic.procedural,
      attitudinalContents: topic.attitudinal,
      achievementIndicators: topic.indicators,
      startDuration: 15,
      startActivities: topic.startSuggestions.join('\n'),
      developmentDuration: 60,
      developmentActivities: topic.devSuggestions.join('\n'),
      studentGrouping: 'Equipos pequeños (3-4)',
      closeDuration: 15,
      closeActivities: topic.closeSuggestions.join('\n'),
      metacognitionQuestions: METACOGNITION_QUESTIONS.slice(0, 3).join('\n'),
      didacticResources: topic.resourceSuggestions,
      evaluationTypes: ['Formativa'],
      evaluationAgents: ['Heteroevaluación'],
      evaluationInstruments: ['Rúbrica Analítica'],
      evaluationCriteria: topic.indicators.join('\n'),
      status: 'draft',
      reviewStatus: 'pending',
      notes: 'Generado desde el Catálogo Curricular MINERD.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEditingDailyPlan(newPlan);
    setActiveTab('daily');
  };

  // Convert Weekly Day to Daily Plan
  const handleCreateDailyFromWeeklyDay = (dayData: {
    date: string;
    grade: string;
    section: string;
    area: SubjectArea;
    unitTheme: string;
    pedagogicalIntention: string;
    startActivities: string;
    developmentActivities: string;
    closeActivities: string;
    dayOfWeek?: string;
  }) => {
    const newPlan: DailyPlan = {
      id: `dp-${Date.now()}`,
      title: dayData.unitTheme,
      date: dayData.date,
      level: 'primario_segundo_ciclo',
      grade: dayData.grade,
      section: dayData.section,
      area: dayData.area,
      unitTheme: dayData.unitTheme,
      pedagogicalIntention: dayData.pedagogicalIntention,
      teacherName: schoolConfig.teacherName,
      fundamentalCompetencies: ['comunicativa', 'pensamiento_logico'],
      specificCompetencies: [],
      transversalAxis: TRANSVERSAL_AXES[0],
      conceptualContents: [],
      proceduralContents: [],
      attitudinalContents: [],
      achievementIndicators: [],
      startDuration: 15,
      startActivities: dayData.startActivities,
      developmentDuration: 60,
      developmentActivities: dayData.developmentActivities,
      studentGrouping: 'Equipos pequeños (3-4)',
      closeDuration: 15,
      closeActivities: dayData.closeActivities,
      metacognitionQuestions: METACOGNITION_QUESTIONS.slice(0, 3).join('\n'),
      didacticResources: ['Pizarra y marcadores', 'Fascículo MINERD'],
      evaluationTypes: ['Formativa'],
      evaluationAgents: ['Heteroevaluación'],
      evaluationInstruments: ['Lista de Cotejo'],
      evaluationCriteria: '',
      status: 'completed',
      reviewStatus: 'pending',
      notes: 'Generado desde la matriz semanal.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setEditingDailyPlan(newPlan);
    setActiveTab('daily');
  };

  const handleSaveSchoolConfig = async (newConfig: SchoolConfig) => {
    const oldCode = storageService.getCurrentSchoolCode();
    await storageService.saveConfig(newConfig);
    setSchoolConfig(newConfig);
    if (newConfig.schoolCode && newConfig.schoolCode !== oldCode) {
      setCurrentSchoolCode(newConfig.schoolCode);
      reloadAllData();
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800">
      
      {/* Vertical Left Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewDailyPlan={handleNewDailyPlan}
        schoolName={schoolConfig.schoolName}
        schoolCode={schoolConfig.schoolCode}
        logoUrl={schoolConfig.logoUrl}
        district={schoolConfig.district}
        pendingReviewCount={pendingReviewCount}
        activeRole={schoolConfig.activeRole}
        isUnlocked={isUnlocked}
        onRequestUnlock={handleRequestUnlock}
        onLockSession={handleLockSession}
      />

      {/* Main Content Workspace to the Right of Sidebar */}
      <div className="flex-1 lg:pl-72 sm:lg:pl-80 flex flex-col min-w-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        
        {/* Banner de Diagnóstico de Inicialización Firebase / Storage */}
        {initError && (
          <div className="no-print mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <span className="font-bold text-xs">⚠️</span>
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold text-amber-950">Aviso de Inicialización de Datos ({initError.scope.toUpperCase()})</p>
              <p className="text-amber-800 mt-0.5">{initError.message}</p>
              <p className="text-[10px] text-amber-700 font-mono mt-1">Registrado a las {initError.timestamp} • Operando con copia local de contingencia.</p>
            </div>
            <button
              type="button"
              onClick={() => setInitError(null)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* --- RESTRICTED TAB 1: Panel de Supervisión Directiva & Coordinación --- */}
        {activeTab === 'management' && (
          authService.canAccessTab('management') ? (
            <ManagementDashboard
              dailyPlans={dailyPlans}
              weeklyPlans={weeklyPlans}
              learningUnits={learningUnits}
              teachers={teachers}
              schoolConfig={schoolConfig}
              onUpdateDailyReview={handleUpdateDailyReview}
              onUpdateWeeklyReview={handleUpdateWeeklyReview}
              onUpdateUnitReview={handleUpdateUnitReview}
              onViewPlanToPrint={handlePrintPlan}
            />
          ) : (
            <RestrictedAccessView
              title="Supervisión Directiva y Acompañamiento"
              description="Este módulo está reservado para la Dirección y Coordinación Pedagógica para revisar, aprobar o devolver planificaciones institucionales."
              defaultRole="coordinator"
              onUnlocked={handleAuthSuccess}
              onNavigateToTeacherMode={() => setActiveTab('daily')}
            />
          )
        )}

        {/* --- RESTRICTED TAB 2: Apartado de Coordinadores Pedagógicos --- */}
        {activeTab === 'coordinators' && (
          authService.canAccessTab('coordinators') ? (
            <CoordinatorsManagement
              coordinators={coordinators}
              schoolConfig={schoolConfig}
              onSaveCoordinator={handleSaveCoordinator}
              onDeleteCoordinator={handleDeleteCoordinator}
            />
          ) : (
            <RestrictedAccessView
              title="Gestión de Coordinadores Pedagógicos"
              description="Administración del equipo de coordinación pedagógica por ciclos y tandas escolares."
              defaultRole="coordinator"
              onUnlocked={handleAuthSuccess}
              onNavigateToTeacherMode={() => setActiveTab('daily')}
            />
          )
        )}

        {/* --- RESTRICTED TAB 3: Reportes de Orientación y Psicología --- */}
        {activeTab === 'psychology' && (
          authService.canAccessTab('psychology') ? (
            <PsychologyGuidance
              reports={psychologyReports}
              schoolConfig={schoolConfig}
              teachers={teachers}
              orientators={orientators}
              onSaveReport={handleSavePsychologyReport}
              onDeleteReport={handleDeletePsychologyReport}
              onSaveOrientator={handleSaveOrientator}
              onDeleteOrientator={handleDeleteOrientator}
            />
          ) : (
            <RestrictedAccessView
              title="Unidad de Orientación y Psicología"
              description="Expedientes confidenciales de casos de estudiantes, seguimiento conductual y citaciones familiares."
              defaultRole="orientator"
              onUnlocked={handleAuthSuccess}
              onNavigateToTeacherMode={() => setActiveTab('daily')}
            />
          )
        )}

        {/* --- RESTRICTED TAB 4: Gestión de Docentes e Importación Excel --- */}
        {activeTab === 'teachers' && (
          authService.canAccessTab('teachers') ? (
            <TeacherManagement
              teachers={teachers}
              schoolConfig={schoolConfig}
              onSaveTeacher={handleSaveTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onImportBatch={handleImportTeachersBatch}
            />
          ) : (
            <RestrictedAccessView
              title="Padrón de Docentes y Cédulas"
              description="Gestión oficial del personal docente, asignación de áreas y tandas."
              defaultRole="coordinator"
              onUnlocked={handleAuthSuccess}
              onNavigateToTeacherMode={() => setActiveTab('daily')}
            />
          )
        )}

        {/* --- FREE TEACHER TAB 5: Control de Asistencia y Matrícula --- */}
        {activeTab === 'attendance' && (
          <AttendanceManagementView
            schoolConfig={schoolConfig}
            orientators={orientators}
            onDispatchPsychologyReport={handleSavePsychologyReport}
            onNavigateToPsychology={() => {
              if (authService.canAccessTab('psychology')) {
                setActiveTab('psychology');
              } else {
                handleRequestUnlock('psychology', 'orientator');
              }
            }}
          />
        )}

        {/* --- RESTRICTED TAB: Dashboard Resumen General (Dirección / Coordinación) --- */}
        {activeTab === 'dashboard' && (
          authService.canAccessTab('dashboard') ? (
            <Dashboard
              dailyPlans={dailyPlans}
              weeklyPlans={weeklyPlans}
              learningUnits={learningUnits}
              schoolConfig={schoolConfig}
              teachers={teachers}
              onEditDailyPlan={handleEditDailyPlan}
              onEditWeeklyPlan={handleEditWeeklyPlan}
              onDuplicateDailyPlan={handleDuplicateDailyPlan}
              onDeleteDailyPlan={handleDeleteDailyPlan}
              onNewDailyPlan={handleNewDailyPlan}
              onNewWeeklyPlan={handleNewWeeklyPlan}
              onSaveDailyPlan={handleSaveDailyPlan}
              onSaveWeeklyPlan={handleSaveWeeklyPlan}
              onSaveUnitPlan={handleSaveUnit}
              onPrintPlan={handlePrintPlan}
              onNavigateTab={(tab) => {
                if (authService.isRestrictedTab(tab) && !isUnlocked) {
                  handleRequestUnlock(tab);
                } else {
                  setActiveTab(tab);
                }
              }}
            />
          ) : (
            <RestrictedAccessView
              title="Resumen General Institucional"
              description="Módulo reservado para el Equipo de Dirección y Supervisión Pedagógica con estadísticas globales del centro."
              defaultRole="coordinator"
              onUnlocked={handleAuthSuccess}
              onNavigateToTeacherMode={() => setActiveTab('daily')}
            />
          )
        )}

        {/* --- FREE TEACHER TAB 6: Planificador Diario --- */}
        {activeTab === 'daily' && (
          <DailyPlanner
            initialPlan={editingDailyPlan}
            schoolConfig={schoolConfig}
            teachers={teachers}
            onSave={handleSaveDailyPlan}
            onDelete={handleDeleteDailyPlan}
            onCancel={() => setActiveTab('daily')}
            onPrint={(id) => handlePrintPlan('daily', id)}
            onDispatchPsychologyReport={handleSavePsychologyReport}
          />
        )}

        {/* --- FREE TEACHER TAB 7: Planificador Semanal --- */}
        {activeTab === 'weekly' && (
          <WeeklyPlanner
            initialPlan={editingWeeklyPlan}
            schoolConfig={schoolConfig}
            teachers={teachers}
            onSave={handleSaveWeeklyPlan}
            onCancel={() => setActiveTab('daily')}
            onPrint={(id) => handlePrintPlan('weekly', id)}
            onCreateDailyFromWeeklyDay={handleCreateDailyFromWeeklyDay}
          />
        )}

        {/* --- FREE TEACHER TAB 8: Unidades de Aprendizaje --- */}
        {activeTab === 'units' && (
          <LearningUnitPlanner
            units={learningUnits}
            schoolConfig={schoolConfig}
            onSaveUnit={handleSaveUnit}
            onDeleteUnit={handleDeleteUnit}
            onPrintUnit={(id) => handlePrintPlan('unit', id)}
          />
        )}

        {/* --- FREE TEACHER TAB 9: Banco Curricular MINERD --- */}
        {activeTab === 'curriculum' && (
          <CurriculumBrowser
            onSelectTopicForNewPlan={handleSelectTopicForNewPlan}
          />
        )}

        {/* --- FREE TEACHER TAB 10: Generador y Exportador Imprimible --- */}
        {activeTab === 'print' && (
          <PrintableExporter
            dailyPlans={dailyPlans}
            weeklyPlans={weeklyPlans}
            learningUnits={learningUnits}
            schoolConfig={schoolConfig}
            selectedType={printType}
            selectedId={printId || dailyPlans[0]?.id || ''}
            onSelectPlan={(type, id) => {
              setPrintType(type);
              setPrintId(id);
            }}
            onBack={() => setActiveTab('daily')}
          />
        )}
        {/* Institutional Authorship & License Footer */}
        <footer className="no-print mt-12 py-6 px-4 border-t border-slate-200 text-center text-xs text-slate-500 bg-white/60 backdrop-blur-xs rounded-2xl max-w-7xl mx-auto shadow-xs space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
              Escuela Dr. José Francisco Peña Gómez (Código SIGERD: 14668)
            </span>
            <span>•</span>
            <span className="font-bold text-slate-800">
              Desarrollado y Diseñado por: Licdo. Arnold Javier Sanchez
            </span>
            <span>•</span>
            <span className="text-slate-500">
              Distrito Educativo 12-01 (Higüey)
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Licdo. Arnold Javier Sanchez. Todos los derechos reservados. Sistema de Planificación Curricular bajo Diseño por Competencias del MINERD. Software Registrado y Protegido.
          </p>
        </footer>
      </main>


      {/* Modern Minimalist Institutional Footer */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">{schoolConfig.schoolName}</span>
            <span>·</span>
            <span>{schoolConfig.district}</span>
            <span>·</span>
            <span>{schoolConfig.regional}</span>
          </div>

          <div className="text-slate-400 text-center sm:text-right font-medium">
            Dirección: <strong className="text-slate-200">{DIRECTOR_NAME}</strong> · Currículo Oficial MINERD · República Dominicana
          </div>
        </div>
      </footer>
      </div>

      {/* Settings Modal (Protected) */}
            {/* Super Admin Central Modal */}


      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={schoolConfig}
        onSaveConfig={handleSaveSchoolConfig}
        onDataReload={reloadAllData}
      />

      {/* Global Authentication / Unlock Modal */}
      <AuthLockModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingTargetTab(null);
        }}
        onSuccess={handleAuthSuccess}
        defaultRole={
          pendingTargetTab === 'psychology' ? 'orientator' :
          pendingTargetTab === 'coordinators' || pendingTargetTab === 'management' ? 'coordinator' :
          'director'
        }
        targetFeatureName={
          pendingTargetTab === 'management' ? 'Supervisión Directiva' :
          pendingTargetTab === 'coordinators' ? 'Gestión de Coordinadores' :
          pendingTargetTab === 'psychology' ? 'Orientación y Psicología' :
          pendingTargetTab === 'teachers' ? 'Padrón Docente & Excel' :
          'Ajustes Institucionales'
        }
      />

      {/* Realtime Offline Status Indicator */}
      <OfflineIndicator />

    </div>
    </ErrorBoundary>
  );
}
