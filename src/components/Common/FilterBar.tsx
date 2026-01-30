import React from 'react';

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
                                className="input input-bordered w-full pr-10"
                                value={searchTerm}
                                onChange={(e) => onSearch(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                    <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={onClearFilters}
                    >
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
