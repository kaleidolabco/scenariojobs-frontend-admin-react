import React from 'react';
import { ChevronDown } from './Icon';

/**
 * Ícono reutilizable de "chevron" que rota 180° cuando está abierto.
 * Útil para acordeones y dropdowns.
 */
const ChevronToggle: React.FC<{ open: boolean }> = ({ open }) => (
    <ChevronDown
        size={16}
        className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    />
);

export default ChevronToggle;
