import React from 'react';
import Button from './Button';
import { Search, X } from './Icon';

export interface FilterOption {
    label: string;
    value: string | number;
}

export interface FilterDefinition {
    key: string;
    label: string;
    options: FilterOption[];
}

interface FilterBarProps {
    onSearch?: (term: string) => void;
    searchTerm?: string;
    searchPlaceholder?: string;
    filters?: FilterDefinition[];
    activeFilters?: Record<string, string | number>;
    onFilterChange?: (key: string, value: string | number) => void;
    onClearFilters?: () => void;
    className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
    onSearch,
    searchTerm = '',
    searchPlaceholder = 'Buscar...',
    filters = [],
    activeFilters = {},
    onFilterChange,
    onClearFilters,
    className = ''
}) => {
    return (
        <div className={`flex flex-col md:flex-row gap-4 mb-6 ${className}`}>
            {/* Search Input */}
            {onSearch && (
                <div className="form-control w-full md:w-auto md:flex-1 max-w-sm">
                    <div className="input-group w-full">
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                className="input input-bordered w-full pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => onSearch(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                                <Search size={20} className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                {filters.map((filter) => (
                    <div key={filter.key} className="form-control">
                        <select
                            className="select select-bordered select-sm w-full max-w-xs capitalize"
                            value={activeFilters[filter.key] || ''}
                            onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
                        >
                            <option value="">{filter.label}: Todos</option>
                            {filter.options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                ))}

                {/* Clear Filters Button (Optional: Implement logic outside or inside) */}
                {Object.values(activeFilters).some(v => v !== '') && onFilterChange && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-error"
                        onClick={onClearFilters}
                        leftIcon={X}
                    >
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
