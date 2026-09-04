import React from 'react';

export interface StatusBadgeConfig {
    /** Clase de badge daisyUI, ej. 'badge-warning'. */
    color: string;
    /** Etiqueta legible. */
    label: string;
    /** Color de punto opcional (clase bg-*), ej. 'bg-warning'. */
    dot?: string;
}

export interface StatusBadgeProps {
    /** Estado a renderizar. */
    estado: string;
    /** Mapa estado → config visual. Permite reutilizar el componente en cualquier módulo. */
    map: Record<string, StatusBadgeConfig>;
    /** Tamaño del badge. */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Renderizar como outline. */
    outline?: boolean;
}

const SIZE_CLASS: Record<NonNullable<StatusBadgeProps['size']>, string> = {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg',
};

/**
 * Componente unificado de badge de estado.
 * Reemplaza las múltiples definiciones inline de `StatusBadge` repartidas por el repo.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
    estado,
    map,
    size = 'sm',
    outline = false,
}) => {
    const cfg = map[estado];
    if (!cfg) {
        return (
            <span className={`badge badge-ghost ${SIZE_CLASS[size]} font-medium`}>
                {estado}
            </span>
        );
    }
    return (
        <span
            className={`badge ${cfg.color} ${SIZE_CLASS[size]} gap-1.5 font-medium ${
                outline ? 'badge-outline' : ''
            }`}
        >
            {cfg.dot && (
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            )}
            {cfg.label}
        </span>
    );
};

export default StatusBadge;
