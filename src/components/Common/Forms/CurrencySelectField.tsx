import React from 'react';
import SelectField from './SelectField';

interface CurrencySelectFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    helpText?: string;
    required?: boolean;
    disabled?: boolean;
}

export const CURRENCIES = [
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'COP', label: 'COP - Peso Colombiano' },
    { value: 'MXN', label: 'MXN - Peso Mexicano' },
    { value: 'CLP', label: 'CLP - Peso Chileno' },
    { value: 'ARS', label: 'ARS - Peso Argentino' },
    { value: 'PEN', label: 'PEN - Sol Peruano' },
    { value: 'BRL', label: 'BRL - Real Brasileño' },
];

const CurrencySelectField: React.FC<CurrencySelectFieldProps> = ({
    label,
    value,
    onChange,
    helpText,
    required,
    disabled,
}) => {
    return (
        <SelectField
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            options={CURRENCIES}
            helpText={helpText}
            required={required}
            disabled={disabled}
        />
    );
};

export default CurrencySelectField;
