import React from 'react';

interface RangeFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label?: string;
    required?: boolean;
    helpText?: string;
    error?: string;
    onChange: (value: number) => void;
    value: number;
    min?: number;
    max?: number;
    step?: number;
}

const RangeField: React.FC<RangeFieldProps> = ({
    label,
    required = false,
    helpText,
    error,
    className = '',
    onChange,
    value,
    min = 0,
    max = 100,
    step = 1,
    ...props
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block">
                    <span className="label-text font-medium">{label}</span>
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}
            <input
                type="range"
                required={required}
                className={`range range-xs range-primary ${error ? 'range-error' : ''} ${className}`}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                {...props}
            />
            {error && <p className="text-error text-xs">{error}</p>}
            {helpText && !error && <p className="text-xs text-base-content/60">{helpText}</p>}
        </div>
    );
};

export default RangeField;
