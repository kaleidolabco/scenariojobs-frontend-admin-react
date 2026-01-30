import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    required?: boolean;
    helpText?: string;
    error?: string;
    options: SelectOption[];
}

const SelectField: React.FC<SelectFieldProps> = ({
    label,
    required = false,
    helpText,
    error,
    options,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-2">
            <label className="block">
                <span className="label-text font-medium">{label}</span>
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <select
                required={required}
                className={`select select-bordered w-full focus:border-primary focus:ring-2 focus:ring-primary/20 text-base ${error ? 'select-error' : ''} ${className}`}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-error text-xs">{error}</p>}
            {helpText && !error && <p className="text-xs text-base-content/60">{helpText}</p>}
        </div>
    );
};

export default SelectField;