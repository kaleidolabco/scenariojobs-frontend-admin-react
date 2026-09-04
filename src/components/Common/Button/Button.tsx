import React, { forwardRef } from 'react';
import type { LucideIcon } from '../Icon';

// ─── Variantes y tamaños DaisyUI ───────────────────────────────────────────
export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'ghost'
    | 'outline'
    | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonShape = 'default' | 'circle' | 'square';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    info: 'btn-info',
    success: 'btn-success',
    warning: 'btn-warning',
    error: 'btn-error',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    link: 'btn-link',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
};

const SHAPE_CLASS: Record<ButtonShape, string> = {
    default: '',
    circle: 'btn-circle',
    square: 'btn-square',
};

// ─── Props ───────────────────────────────────────────────────────────────────
export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    outline?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    iconSize?: number;
    children?: React.ReactNode;
}

const Spinner = ({ className = '' }: { className?: string }) => (
    <span className={`loading loading-spinner ${className}`} aria-hidden="true" />
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            shape = 'default',
            outline = false,
            fullWidth = false,
            loading = false,
            leftIcon: LeftIcon,
            rightIcon: RightIcon,
            iconSize,
            type = 'button',
            disabled,
            className = '',
            children,
            ...rest
        },
        ref
    ) => {
        // Resolución de tamaño por defecto del ícono según el size del botón.
        const computedIconSize = iconSize ?? (size === 'xs' ? 14 : size === 'sm' ? 16 : 18);

        // Si el botón es sólo ícono (no children) pero no se especificó shape,
        // forzamos btn-square para que DaisyUI lo pinte bien.
        const effectiveShape =
            shape === 'default' && children === undefined && (LeftIcon || RightIcon) && !fullWidth
                ? 'square'
                : shape;

        const computedVariant = outline && variant !== 'ghost' && variant !== 'link'
            ? `btn-outline ${VARIANT_CLASS[variant]}`
            : VARIANT_CLASS[variant];

        const classes = [
            'btn',
            computedVariant,
            SIZE_CLASS[size],
            SHAPE_CLASS[effectiveShape],
            fullWidth ? 'w-full' : '',
            // loading ? 'loading' : '',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const iconProps = {
            size: computedIconSize,
            className: children !== undefined ? 'shrink-0' : '',
            'aria-hidden': true,
        } as const;

        return (
            <button
                ref={ref}
                type={type}
                className={classes}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                {...rest}
            >
                {loading && <Spinner/>}
                {!loading && LeftIcon && <LeftIcon {...iconProps} />}
                {children !== undefined && <span className="shrink-0 flex flex-row gap-2">{children}</span>}
                {!loading && RightIcon && <RightIcon {...iconProps} />}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
