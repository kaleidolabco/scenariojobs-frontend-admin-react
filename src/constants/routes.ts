export const ROUTES = {
    // Public
    LOGIN: '/autenticacion',
    NOT_FOUND: '/404',

    // Dashboard Common
    HOME: '/inicio',

    // Admin / Config (Tenant Admin)
    COMPANY_CONFIG: '/empresa',
    USERS: '/usuarios',
    ROLES: '/roles',
    
    // Organizational Structure (New Module)
    ORG_UNITS: '/unidades',
    ORG_POSITIONS: '/puestos',

    // Talent Config
    JOBS: '/cargos', // Renamed from POSITIONS (Perfiles Funcionales)
    COMPETENCIES: '/competencias',
    STAFF_DIRECTORY: '/personal',

    // Assessment Engine (HR Manager)
    ASSESSMENTS: '/evaluaciones',
    ASSESSMENT_CREATE: '/evaluaciones/crear',
    ASSESSMENT_EDIT: (id: string) => `/evaluaciones/${id}/editar`,

    // Processes (HR Manager)
    PROCESSES: '/procesos',
    PROCESS_CREATE: '/procesos/crear',
    PROCESS_EDIT: (id: string) => `/procesos/${id}/editar`,

    // Grading (Evaluator)
    GRADING_PENDING: '/calificacion',
    GRADING_DETAIL: (id: string) => `/calificacion/${id}`,

    // Execution (Employee/Candidate)
    MY_ASSESSMENTS: '/mis-evaluaciones',
    TAKE_ASSESSMENT: (id: string) => `/mis-evaluaciones/${id}/realizar`,
    MY_OBJECTIVES: '/mis-objetivos',
    MY_OBJECTIVE_DETAIL: (id: string) => `/mis-objetivos/${id}`,

    // Team Management (Evaluator/Leader)
    MY_TEAM: '/mi-equipo',
    TEAM_MEMBER_OBJECTIVES: (userId: string) => `/mi-equipo/${userId}/objetivos`,
    OBJECTIVE_REVIEW: (id: string) => `/objetivos-equipo/${id}/validar`, // Puede mantenerse para acceso directo o refactorizar

    // Analytics (Admin/HR)
    ANALYTICS_DASHBOARD: '/analisis',
    GAP_ANALYSIS: '/analisis/brechas',
    OBJECTIVES_REPORT: '/analisis/objetivos',
};

export const ROUTE_LABELS: Record<string, string> = {
    [ROUTES.HOME]: 'Inicio',
    [ROUTES.COMPANY_CONFIG]: 'Configuración Empresa',
    [ROUTES.USERS]: 'Usuarios',
    [ROUTES.ROLES]: 'Roles',
    [ROUTES.ORG_UNITS]: 'Unidades Org.',
    [ROUTES.ORG_POSITIONS]: 'Puestos',
    [ROUTES.JOBS]: 'Cargos (Perfiles)',
    [ROUTES.COMPETENCIES]: 'Competencias',
    [ROUTES.STAFF_DIRECTORY]: 'Directorio',
    [ROUTES.ASSESSMENTS]: 'Evaluaciones',
    [ROUTES.ASSESSMENT_CREATE]: 'Crear Evaluación',
    [ROUTES.PROCESSES]: 'Procesos',
    [ROUTES.PROCESS_CREATE]: 'Crear Proceso',
    [ROUTES.GRADING_PENDING]: 'Calificación',
    [ROUTES.MY_ASSESSMENTS]: 'Mis Evaluaciones',
    [ROUTES.MY_OBJECTIVES]: 'Mis Objetivos',
    [ROUTES.MY_TEAM]: 'Mi Equipo',
    [ROUTES.ANALYTICS_DASHBOARD]: 'Analítica',
    [ROUTES.GAP_ANALYSIS]: 'Brechas',
    [ROUTES.OBJECTIVES_REPORT]: 'Reporte Objetivos',
};
