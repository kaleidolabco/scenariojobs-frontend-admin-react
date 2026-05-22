export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN', // SaaS Owner
    ADMIN = 'ADMIN_EMPRESA',             // Tenant Admin
    HR_MANAGER = 'GESTOR_TALENTO',   // Gestor de Evaluaciones
    EVALUATOR = 'EVALUADOR',     // Evaluador
    EMPLOYEE = 'COLABORADOR',       // Evaluado/Empleado
}

export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrador',
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.HR_MANAGER]: 'Gestor de RRHH',
    [UserRole.EVALUATOR]: 'Evaluador',
    [UserRole.EMPLOYEE]: 'Colaborador',
};
