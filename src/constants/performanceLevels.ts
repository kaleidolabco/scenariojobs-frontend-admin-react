/**
 * Performance Levels Configuration
 * Configuración de niveles de desempeño y competencias
 */

export interface PerformanceLevel {
    level: number;
    label: string;
    shortLabel: string;
}

export interface PerformanceLevelsConfig {
    levels: PerformanceLevel[];
    gridSize: number; // Número de niveles (4, 5, etc.)
}

/**
 * Configuración predefinida de niveles
 * Puedes cambiar DEFAULT_LEVELS_CONFIG para usar 4 ó 5 niveles
 */

// Configuración con 5 niveles (Insuficiente - Excepcional)
export const LEVELS_CONFIG_5: PerformanceLevelsConfig = {
    gridSize: 5,
    levels: [
        { level: 1, label: 'Insuficiente', shortLabel: 'Insuf.' },
        { level: 2, label: 'Parcial', shortLabel: 'Parc.' },
        { level: 3, label: 'Satisfactorio', shortLabel: 'Satisf.' },
        { level: 4, label: 'Destacado', shortLabel: 'Dest.' },
        { level: 5, label: 'Excepcional', shortLabel: 'Excep.' },
    ],
};

// Configuración con 4 niveles (Insuficiente - Excepcional, sin Parcial)
export const LEVELS_CONFIG_4: PerformanceLevelsConfig = {
    gridSize: 4,
    levels: [
        { level: 1, label: 'Insuficiente', shortLabel: 'Insuf.' },
        { level: 2, label: 'Satisfactorio', shortLabel: 'Satisf.' },
        { level: 3, label: 'Destacado', shortLabel: 'Dest.' },
        { level: 4, label: 'Excepcional', shortLabel: 'Excep.' },
    ],
};

// Configuración con 3 niveles (Bajo - Alto)
export const LEVELS_CONFIG_3: PerformanceLevelsConfig = {
    gridSize: 3,
    levels: [
        { level: 1, label: 'Bajo', shortLabel: 'Bajo' },
        { level: 2, label: 'Medio', shortLabel: 'Medio' },
        { level: 3, label: 'Alto', shortLabel: 'Alto' },
    ],
};

/**
 * CONFIGURACIÓN PREDETERMINADA
 * Cambia esta línea para usar diferente número de niveles en toda la aplicación
 */
export const DEFAULT_LEVELS_CONFIG: PerformanceLevelsConfig = LEVELS_CONFIG_5;

/**
 * Helper: Obtener color según puntuación y número de niveles
 */
export const getColorForScore = (score: number | undefined, gridSize: number = DEFAULT_LEVELS_CONFIG.gridSize): string => {
    if (score === undefined) return 'text-base-300';
    
    if (gridSize === 5) {
        if (score <= 1.5) return 'text-error';
        if (score <= 2.5) return 'text-warning';
        if (score <= 3.5) return 'text-info';
        if (score <= 4.5) return 'text-success';
        return 'text-success';
    } else if (gridSize === 4) {
        if (score <= 1.5) return 'text-error';
        if (score <= 2.5) return 'text-warning';
        if (score <= 3.5) return 'text-info';
        return 'text-success';
    } else if (gridSize === 3) {
        if (score <= 1.5) return 'text-error';
        if (score <= 2.5) return 'text-warning';
        return 'text-success';
    }
    
    return 'text-base-300';
};

/**
 * Helper: Obtener color de fondo según puntuación y número de niveles
 */
export const getBackgroundColorForScore = (score: number | undefined, gridSize: number = DEFAULT_LEVELS_CONFIG.gridSize): string => {
    if (score === undefined) return 'bg-base-100';
    
    if (gridSize === 5) {
        if (score <= 1.5) return 'bg-error/10';
        if (score <= 2.5) return 'bg-warning/10';
        if (score <= 3.5) return 'bg-info/10';
        if (score <= 4.5) return 'bg-success/10';
        return 'bg-success/10';
    } else if (gridSize === 4) {
        if (score <= 1.5) return 'bg-error/10';
        if (score <= 2.5) return 'bg-warning/10';
        if (score <= 3.5) return 'bg-info/10';
        return 'bg-success/10';
    } else if (gridSize === 3) {
        if (score <= 1.5) return 'bg-error/10';
        if (score <= 2.5) return 'bg-warning/10';
        return 'bg-success/10';
    }
    
    return 'bg-base-100';
};
