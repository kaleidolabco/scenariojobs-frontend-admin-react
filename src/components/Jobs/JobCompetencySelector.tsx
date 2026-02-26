import React, { useState, useEffect } from 'react';
import { CompetencyRequirement } from '../../services/jobService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import RangeField from '../Common/Forms/RangeField';

interface JobCompetencySelectorProps {
    value: CompetencyRequirement[];
    onChange: (value: CompetencyRequirement[]) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
    'HABILIDAD_BLANDA': 'Soft Skill',
    'HABILIDAD_TECNICA': 'Hard Skill',
    'IDIOMA': 'Idioma',
    'CONOCIMIENTO_ESPECIFICO': 'Conocimiento Específico'
};

const JobCompetencySelector: React.FC<JobCompetencySelectorProps> = ({ value, onChange }) => {
    const { getCompetencies, loading } = useCompetencyService();
    const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCompetencies = async () => {
            const response = await getCompetencies({ pagina: 1, items_por_pagina: 1000 });
            if (response && response.data.competencias) {
                setAllCompetencies(response.data.competencias);
            }
        };
        fetchCompetencies();
    }, []);

    const handleAdd = (comp: Competency) => {
        if (!value.find(v => v.competencia_id === comp.id)) {
            onChange([...value, { competencia_id: comp.id, competencia_nombre: comp.nombre, nivel_esperado: 1 }]);
        }
        setSearchTerm('');
    };

    const handleRemove = (id: string) => {
        onChange(value.filter(v => v.competencia_id !== id));
    };

    const handleLevelChange = (id: string, newLevel: number) => {
        onChange(value.map(v => v.competencia_id === id ? { ...v, nivel_esperado: newLevel } : v));
    };

    const availableCompetencies = allCompetencies.filter(c =>
        !value.find(v => v.competencia_id === c.id) &&
        (c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            <div className="dropdown w-full">
                <input
                    tabIndex={0}
                    type="text"
                    placeholder="Buscar y añadir competencia..."
                    className="input input-bordered w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {(searchTerm || availableCompetencies.length > 0) && (
                    <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto mt-1 border border-base-300">
                        {loading && <li><span className="loading loading-spinner loading-sm m-auto"></span></li>}
                        {!loading && availableCompetencies.length === 0 && <li><a className="text-base-content/50 cursor-default hover:bg-transparent">No se encontraron resultados</a></li>}
                        {!loading && availableCompetencies.map(comp => (
                            <li key={comp.id}>
                                <a onClick={() => handleAdd(comp)} className="flex justify-between items-center">
                                    <span>{comp.nombre}</span>
                                    <span className="badge badge-sm badge-ghost">{CATEGORY_LABELS[comp.categoria] || comp.categoria}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

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
                                const fullComp = allCompetencies.find(c => c.id === req.competencia_id);
                                const maxScale = fullComp?.escala || 5;

                                return (
                                    <tr key={req.competencia_id}>
                                        <td className="align-middle">
                                            <div className="font-medium">{req.competencia_nombre}</div>
                                            {fullComp && (
                                                <div className="text-xs opacity-60">
                                                    {CATEGORY_LABELS[fullComp.categoria] || fullComp.categoria}
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
                                                    Nivel {req.nivel_esperado}
                                                </div>
                                            </div>
                                            {fullComp?.definiciones_niveles && (
                                                <div className="text-xs opacity-70 mt-1 max-w-xs truncate">
                                                    {fullComp.definiciones_niveles.find(n => n.nivel === req.nivel_esperado)?.descripcion || ''}
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
