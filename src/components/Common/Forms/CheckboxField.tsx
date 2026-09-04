import React from 'react';

interface CheckboxFieldProps {
    label?: React.ReactNode;
    description?: React.ReactNode;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    error?: string;
    name?: string;
    className?: string;
    size?: 'sm' | 'md';
}

/**
 * Checkbox reutilizable con estilos DaisyUI.
 * Soporta label y descripción opcionales; sin label renderiza solo el checkbox.
 */
const CheckboxField: React.FC<CheckboxFieldProps> = ({
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    error,
    name,
    className = '',
    size = 'sm',
}) => {
    const checkboxClass = size === 'sm' ? 'checkbox-sm' : '';

    return (
        <label
            className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        >
            <input
                type="checkbox"
                className={`checkbox checkbox-primary ${checkboxClass}`}
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled}
                name={name}
                onChange={(e) => onChange?.(e.target.checked)}
            />
            {(label || description || error) && (
                <span className="text-sm">
                    {label && <span className="font-medium text-base-content">{label}</span>}
                    {description && (
                        <span className="block text-xs text-base-content/50 mt-0.5">{description}</span>
                    )}
                    {error && <span className="block text-xs text-error mt-0.5">{error}</span>}
                </span>
            )}
        </label>
    );
};

export default CheckboxField;
