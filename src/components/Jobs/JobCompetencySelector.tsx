import React, { useState, useEffect } from 'react';
import { CompetencyRequirement } from '../../services/jobService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import RangeField from '../Common/Forms/RangeField';

interface JobCompetencySelectorProps {
    value: CompetencyRequirement[];
    onChange: (value: CompetencyRequirement[]) => void;
}

import AutocompleteField from '../Common/Forms/AutocompleteField';

interface AutocompleteOption {
    id: string;
    name: string;
    detail?: string;
}

const JobCompetencySelector: React.FC<JobCompetencySelectorProps> = ({ value, onChange }) => {
    const { getCompetencies, loading } = useCompetencyService();
    const [competencyOptions, setCompetencyOptions] = useState<AutocompleteOption[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCompetency, setSelectedCompetency] = useState<AutocompleteOption | null>(null);

    // State para almacenar todas las competencias cargadas para referencia (p.ej. escala, definiciones)
    const [allCompetenciesMap, setAllCompetenciesMap] = useState<Map<string, Competency>>(new Map());

    // Debounce search query and fetch competencies
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setCompetencyOptions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const response = await getCompetencies({ filtro: searchQuery, items_por_pagina: 10 });
            if (response && response.success) {
                const competenciesList: Competency[] = response.data.competencias || [];
                const newOptions = competenciesList.map(comp => ({
                    id: comp.id,
                    name: comp.nombre,
                    detail: comp.categoria_nombre
                }));
                setCompetencyOptions(newOptions);

                // Update map with fetched competencies for later reference
                const newMap = new Map(allCompetenciesMap);
                competenciesList.forEach(comp => newMap.set(comp.id, comp));
                setAllCompetenciesMap(newMap);
            }
            setIsSearching(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]); // Remueve allCompetenciesMap de dependencias

    // Cuando las competencias iniciales cambian, asegurar que estén en el mapa de referencia
    useEffect(() => {
        const fetchMissingCompetencies = async () => {
            const missingIds = value.filter(req => !allCompetenciesMap.has(req.competencia_id)).map(req => req.competencia_id);
            if (missingIds.length > 0) {
                const newMap = new Map(allCompetenciesMap);
                for (const id of missingIds) {
                    const response = await getCompetencies({ id_exacto: id }); // Assuming an exact ID filter exists
                    if (response?.success && response.data?.competencias?.length > 0) {
                        newMap.set(id, response.data.competencias[0]);
                    }
                }
                setAllCompetenciesMap(newMap);
            }
        };
        fetchMissingCompetencies();
    }, [value, allCompetenciesMap, getCompetencies]); // Agrega getCompetencies a dependencias

    const handleAddCompetency = (opt: AutocompleteOption) => {
        if (!value.find(req => req.competencia_id === opt.id)) {
            onChange([...value, { competencia_id: opt.id, competencia_nombre: opt.name, nivel_esperado: 1 }]);
        }
        setSearchQuery('');
        setSelectedCompetency(null);
    };

    const handleRemove = (id: string) => {
        onChange(value.filter(req => req.competencia_id !== id));
    };

    const handleLevelChange = (id: string, newLevel: number) => {
        onChange(value.map(req => req.competencia_id === id ? { ...req, nivel_esperado: newLevel } : req));
    };

    // Filtrar opciones ya seleccionadas
    const filteredOptions = competencyOptions.filter(
        opt => !value.some(req => req.competencia_id === opt.id)
    );

    return (
        <div className="space-y-4">
            <AutocompleteField
                label="Añadir Competencia"
                placeholder="Buscar y añadir competencia por nombre o categoría..."
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                options={filteredOptions}
                onSelect={handleAddCompetency}
                onClear={() => {
                    setSelectedCompetency(null);
                    setSearchQuery('');
                }}
                selectedItem={selectedCompetency}
                isLoading={isSearching || loading}
                helpText="Seleccione una competencia para añadirla a este cargo."
            />

            <div className="overflow-x-auto border border-base-300 rounded-lg">
                <table className="table table-sm w-full">
                    <thead className="bg-base-200">
                        <tr>
                            <th>Competencia</th>
                            <th>Nivel Esperado</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {value.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-4 text-base-content/50">
                                    No hay competencias asignadas a este cargo.
                                </td>
                            </tr>
                        ) : (
                            value.map(req => {
                                const fullComp = allCompetenciesMap.get(req.competencia_id);
                                const maxScale = fullComp?.escala || 5;

                                return (
                                    <tr key={req.competencia_id}>
                                        <td className="align-middle">
                                            <div className="font-medium">{req.competencia_nombre}</div>
                                            {fullComp && (
                                                <div className="text-xs opacity-60">
                                                    {fullComp.categoria_nombre}
                                                </div>
                                            )}
                                        </td>
                                        <td className="align-middle">
                                            <div className="flex items-center gap-2">
                                                <RangeField
                                                    min={1}
                                                    max={maxScale}
                                                    value={req.nivel_esperado}
                                                    className="w-32 md:w-48 mt-0!"
                                                    step={1}
                                                    onChange={(val) => handleLevelChange(req.competencia_id, val)}
                                                />
                                                <div className="w-16 text-center font-semibold text-sm">
                                                    {
                                                        fullComp?.definiciones_niveles && (
                                                            fullComp.definiciones_niveles.find(n => n.nivel === req.nivel_esperado)?.nombre 
                                                            
                                                            || "Nivel " + req.nivel_esperado
                                                        )
                                                    }
                                                </div>

                                            </div>
                                            {fullComp?.definiciones_niveles && (
                                                <div className="text-xs opacity-70 mt-1 max-w-xs truncate">
                                                    {fullComp.definiciones_niveles.find(n => n.nivel === req.nivel_esperado)?.descripcion || ""}
                                                </div>
                                            )}
                                        </td>
                                        <td className="align-middle text-right">
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs text-error"
                                                onClick={() => handleRemove(req.competencia_id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JobCompetencySelector;
