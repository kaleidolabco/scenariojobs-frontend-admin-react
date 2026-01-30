import React from 'react';

interface NumberInputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label: string;
    required?: boolean;
    helpText?: string;
    error?: string;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

const NumberInputField: React.FC<NumberInputFieldProps> = ({
    label,
    required = false,
    helpText,
    error,
    onChange,
    min,
    max,
    step = 1,
    value,
    className = '',
    ...props
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        onChange(value);
    };

    return (
        <div className="space-y-2">
            <label className="block">
                <span className="label-text font-medium">{label}</span>
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <input
                type="number"
                required={required}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                className={`input input-bordered text-center w-full focus:border-primary focus:ring-2 focus:ring-primary/20 text-base ${error ? 'input-error' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-error text-xs">{error}</p>}
            {helpText && !error && <p className="text-xs text-base-content/60">{helpText}</p>}
        </div>
    );
};

export default NumberInputField;