export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN', // SaaS Owner
    ADMIN = 'ADMIN',             // Tenant Admin
    HR_MANAGER = 'HR_MANAGER',   // Gestor de Evaluaciones
    EVALUATOR = 'EVALUATOR',     // Evaluador
    EMPLOYEE = 'EMPLOYEE',       // Evaluado/Empleado
}

export const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrador',
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.HR_MANAGER]: 'Gestor de RRHH',
    [UserRole.EVALUATOR]: 'Evaluador',
    [UserRole.EMPLOYEE]: 'Colaborador',
};
