import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    required?: boolean;
    helpText?: string;
    error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    required = false,
    helpText,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-2">
            <label className="block">
                <span className="label-text font-medium">{label}</span>
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <input
                required={required}
                className={`input input-bordered w-full focus:border-primary focus:ring-2 focus:ring-primary/20 text-base ${error ? 'input-error' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-error text-xs">{error}</p>}
            {helpText && !error && <p className="text-xs text-base-content/60">{helpText}</p>}
        </div>
    );
};

export default InputField;