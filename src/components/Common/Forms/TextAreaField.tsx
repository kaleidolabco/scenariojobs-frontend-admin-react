import React, { forwardRef } from 'react';

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    required?: boolean;
    helpText?: string;
    error?: string;
    rows?: number;
}

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(({
    label,
    required = false,
    helpText,
    error,
    rows = 3,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="space-y-2">
            <label className="block">
                <span className="label-text font-medium">{label}</span>
                {required && <span className="text-error ml-1">*</span>}
            </label>
            <textarea
                ref={ref}
                rows={rows}
                required={required}
                className={`textarea textarea-bordered w-full focus:border-primary focus:ring-2 focus:ring-primary/20 text-base ${error ? 'textarea-error' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-error text-xs">{error}</p>}
            {helpText && !error && <p className="text-xs text-base-content/60">{helpText}</p>}
        </div>
    );
});

TextAreaField.displayName = 'TextAreaField';

export default TextAreaField;
