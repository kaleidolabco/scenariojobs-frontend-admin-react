import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteOption {
    id: string;
    name: string;
    detail?: string;
}

interface AutocompleteFieldProps {
    label: string;
    placeholder?: string;
    required?: boolean;
    helpText?: string;
    error?: string;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    options: AutocompleteOption[];
    onSelect: (option: AutocompleteOption) => void;
    onClear: () => void;
    selectedItem: AutocompleteOption | null;
    isLoading?: boolean;
    className?: string;
}

const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
    label,
    placeholder = 'Escriba para buscar...',
    required = false,
    helpText,
    error,
    searchQuery,
    onSearchQueryChange,
    options,
    onSelect,
    onClear,
    selectedItem,
    isLoading = false,
    className = ''
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectOption = (option: AutocompleteOption) => {
        onSelect(option);
        setShowDropdown(false);
    };

    return (
        <div className={`form-control w-full relative ${className}`} ref={dropdownRef}>
            <label className="block mb-2">
                <span className="label-text font-medium">{label}</span>
                {required && <span className="text-error ml-1">*</span>}
            </label>

            <div className="relative">
                <input
                    type="text"
                    className={`input input-bordered w-full pr-10 text-base ${error ? 'input-error' : ''}`}
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => {
                        onSearchQueryChange(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                />

                {selectedItem ? (
                    <button
                        type="button"
                        onClick={() => {
                            onClear();
                            setShowDropdown(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-error"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                ) : (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-base-content/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Floating Autocomplete Dropdown List */}
            {showDropdown && (searchQuery.trim().length > 0 || options.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-base-300 bg-base-100 shadow-lg compact">
                    <ul className="menu p-1 text-sm">
                        {isLoading ? (
                            <li className="disabled p-2 text-center text-xs text-base-content/50">
                                Buscando...
                            </li>
                        ) : options.length === 0 ? (
                            <li className="disabled p-2 text-center text-xs text-base-content/50">
                                Sin resultados coincidentes disponibles
                            </li>
                        ) : (
                            options.map((opt) => (
                                <li key={opt.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectOption(opt)}
                                        className="flex flex-col items-start gap-0.5 p-2 hover:bg-base-200 text-left w-full"
                                    >
                                        <span className="font-semibold text-base-content">
                                            {opt.name}
                                        </span>
                                        {opt.detail && (
                                            <span className="text-xs text-base-content/50">
                                                {opt.detail}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {error && <p className="text-error text-xs mt-1">{error}</p>}
            {helpText && !error && <p className="text-xs text-base-content/60 mt-1">{helpText}</p>}
        </div>
    );
};

export default AutocompleteField;
