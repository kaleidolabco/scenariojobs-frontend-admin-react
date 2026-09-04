export enum UserStatus {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
    PENDIENTE = 'PENDIENTE',
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
    [UserStatus.ACTIVO]: 'Activo',
    [UserStatus.INACTIVO]: 'Inactivo',
    [UserStatus.PENDIENTE]: 'Pendiente',
};
