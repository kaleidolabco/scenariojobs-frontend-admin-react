export const ROUTES = {
    // Public
    LOGIN: '/autenticacion',
    NOT_FOUND: '/404',

    // Dashboard Common
    HOME: '/inicio',

    // Admin / Config (Tenant Admin)
    COMPANY_CONFIG: '/configuracion/empresa',
    USERS: '/usuarios',
    ROLES: '/configuracion/roles',
    COMPETENCIES: '/competencias',
    POSITIONS: '/cargos',
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

    // Analytics (Admin/HR)
    ANALYTICS_DASHBOARD: '/analisis',
    GAP_ANALYSIS: '/analisis/brechas',
};
