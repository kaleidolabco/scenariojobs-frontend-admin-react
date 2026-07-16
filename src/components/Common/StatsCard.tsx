import React from 'react';

export type StatsCardVariant =
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral';

export type StatsCardSize = 'sm' | 'md' | 'lg';

export interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    variant?: StatsCardVariant;
    size?: StatsCardSize;
    trend?: {
        value: string | number;
        direction: 'up' | 'down' | 'flat';
    };
    description?: string;
    className?: string;
    onClick?: () => void;
}

const VARIANT_BG: Record<StatsCardVariant, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
    neutral: 'bg-base-200 text-base-content',
};

const TREND_COLOR = {
    up: 'text-success',
    down: 'text-error',
    flat: 'text-base-content/50',
};

const SIZE_PADDING: Record<StatsCardSize, string> = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
};

const SIZE_VALUE: Record<StatsCardSize, string> = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
};

const SIZE_LABEL: Record<StatsCardSize, string> = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
};

const SIZE_ICON_BOX: Record<StatsCardSize, string> = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-3.5',
};

const TrendIcon: React.FC<{ direction: 'up' | 'down' | 'flat' }> = ({ direction }) => {
    if (direction === 'up') {
        return (
            <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
        );
    }
    if (direction === 'down') {
        return (
            <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
        );
    }
    return (
        <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
    );
};

const StatsCard: React.FC<StatsCardProps> = ({
    label,
    value,
    icon,
    variant = 'primary',
    size = 'md',
    trend,
    description,
    className = '',
    onClick,
}) => {
    const Wrapper = onClick ? 'button' : 'div';
    const interactiveClasses = onClick
        ? 'hover:shadow-md hover:border-primary/30 transition-all cursor-pointer text-left w-full'
        : '';

    return (
        <Wrapper
            onClick={onClick}
            className={`card bg-base-100 shadow border border-base-200 ${interactiveClasses} ${className}`.trim()}
        >
            <div className={`card-body ${SIZE_PADDING[size]} flex-row items-center gap-4`}>
                {icon && (
                    <div className={`rounded-xl ${VARIANT_BG[variant]} ${SIZE_ICON_BOX[size]}`}>
                        {icon}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className={`font-bold text-base-content leading-tight ${SIZE_VALUE[size]}`}>
                        {value}
                    </p>
                    <p className={`${SIZE_LABEL[size]} text-base-content/60 leading-tight mt-0.5`}>
                        {label}
                    </p>
                    {description && (
                        <p className="text-[11px] text-base-content/50 mt-1 truncate">{description}</p>
                    )}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-1 text-[11px] font-medium ${TREND_COLOR[trend.direction]}`}>
                            <TrendIcon direction={trend.direction} />
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
            </div>
        </Wrapper>
    );
};

export interface StatsGridProps {
    stats: StatsCardProps[];
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
}

const GRID_COLS: Record<NonNullable<StatsGridProps['columns']>, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
};

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, columns = 4, className = '' }) => (
    <div className={`grid ${GRID_COLS[columns]} gap-4 ${className}`.trim()}>
        {stats.map((s, i) => (
            <StatsCard key={`${s.label}-${i}`} {...s} />
        ))}
    </div>
);

export default StatsCard;
