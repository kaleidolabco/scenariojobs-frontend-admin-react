import React from 'react';

interface CheckboxOption {
    label: string;
    value: string;
}

interface CheckboxGroupProps {
    label?: string;
    options: CheckboxOption[];
    selectedValues: string[];
    onChange: (selectedValues: string[]) => void;
    className?: string;
    helpText?: string;
    required?: boolean;
    error?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    label,
    options,
    selectedValues,
    onChange,
    className = '',
    helpText,
    required = false,
    error
}) => {
    const handleCheckboxChange = (value: string, checked: boolean) => {
        if (checked) {
            onChange([...selectedValues, value]);
        } else {
            onChange(selectedValues.filter(v => v !== value));
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block">
                    <span className="label-text font-medium">{label}</span>
                    {required && <span className="text-error ml-1">*</span>}
                </label>
            )}

            <div className={`grid grid-cols-1 gap-2 border p-3 rounded-lg bg-base-100 ${error ? 'border-error' : 'border-base-300'}`}>
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded p-1"
                    >
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm"
                            value={option.value}
                            checked={selectedValues.includes(option.value)}
                            onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                        />
                        <span className="label-text">{option.label}</span>
                    </label>
                ))}
            </div>

            {error && <p className="text-error text-xs">{error}</p>}
            {helpText && !error && <p className="text-xs text-base-content/60">{helpText}</p>}
        </div>
    );
};

export default CheckboxGroup;
