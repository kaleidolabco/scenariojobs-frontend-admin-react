import React, { useMemo, useState } from 'react';
import { Search, X, Plus } from '../Common/Icon';
import Button from '../Common/Button';
import OrgChartPersonSelector from './OrgChartPersonSelector';
import EvaluatorPicker from './EvaluatorPicker';
import {
    PersonRow,
    EvaluatorUser,
    EvaluadoresPorPersona,
    fmtPerson,
    fmtEval,
    getInitials,
} from './types';

interface ParticipantsTabProps {
    allPersons: PersonRow[];
    allEvaluators: EvaluatorUser[];
    selectedPersonIds: string[];
    evaluadoresPorPersona: EvaluadoresPorPersona;
    onPersonsChange: (ids: string[]) => void;
    onEvaluadoresPorPersonaChange: (map: EvaluadoresPorPersona) => void;
}

const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
    allPersons,
    allEvaluators,
    selectedPersonIds,
    evaluadoresPorPersona,
    onPersonsChange,
    onEvaluadoresPorPersonaChange,
}) => {
    const [openPickerFor, setOpenPickerFor] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedPersons = selectedPersonIds
        .map((id) => allPersons.find((p) => p.id === id))
        .filter((p): p is PersonRow => Boolean(p));

    const filteredPersons = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return allPersons.filter(
            (p) => !selectedPersonIds.includes(p.id) && (
                p.nombres.toLowerCase().includes(lowerSearch) ||
                p.apellidos.toLowerCase().includes(lowerSearch) ||
                p.email?.toLowerCase().includes(lowerSearch) ||
                p.cargo?.toLowerCase().includes(lowerSearch) ||
                p.unidad_organizacional?.toLowerCase().includes(lowerSearch)
            )
        );
    }, [searchTerm, allPersons, selectedPersonIds]);

    const handleRemovePerson = (id: string) => {
        onPersonsChange(selectedPersonIds.filter((x) => x !== id));
        const next = { ...evaluadoresPorPersona };
        delete next[id];
        onEvaluadoresPorPersonaChange(next);
        if (openPickerFor === id) setOpenPickerFor(null);
    };

    const handleAddPersonFromSearch = (personId: string) => {
        if (!selectedPersonIds.includes(personId)) {
            onPersonsChange([...selectedPersonIds, personId]);
        }
        setSearchTerm('');
    };

    const handleAddEvaluatorToPerson = (personId: string, evalId: string) => {
        const current = evaluadoresPorPersona[personId] ?? [];
        if (current.includes(evalId)) return;
        onEvaluadoresPorPersonaChange({ ...evaluadoresPorPersona, [personId]: [...current, evalId] });
    };

    const handleRemoveEvaluatorFromPerson = (personId: string, evalId: string) => {
        const current = evaluadoresPorPersona[personId] ?? [];
        onEvaluadoresPorPersonaChange({
            ...evaluadoresPorPersona,
            [personId]: current.filter((x) => x !== evalId),
        });
    };

    const togglePicker = (key: string) =>
        setOpenPickerFor((prev) => (prev === key ? null : key));

    return (
        <div className="space-y-6">
            {/* Search bar */}
            <div className="relative">
                <div className="flex items-center gap-2 border border-base-200 rounded-lg bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar participante por nombre, email, cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 outline-none bg-transparent text-sm"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="p-1 rounded-md hover:bg-base-100 text-base-content/40"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {searchTerm && filteredPersons.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-base-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredPersons.map((person) => (
                            <button
                                key={person.id}
                                type="button"
                                onClick={() => handleAddPersonFromSearch(person.id)}
                                className="w-full text-left px-4 py-2.5 hover:bg-primary/5 border-b border-base-100 last:border-b-0 transition-colors flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                        {getInitials(person)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-base-content truncate">
                                            {fmtPerson(person)}
                                        </p>
                                        {person.email && (
                                            <p className="text-xs text-base-content/50 truncate">{person.email}</p>
                                        )}
                                    </div>
                                </div>
                                <Button variant="primary" size="xs" onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleAddPersonFromSearch(person.id);
                                }}>
                                    <Plus size={14} />
                                    Agregar
                                </Button>
                            </button>
                        ))}
                    </div>
                )}

                {searchTerm && filteredPersons.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-base-200 rounded-lg shadow-lg z-10 px-4 py-3 text-center text-sm text-base-content/50">
                        No se encontraron participantes
                    </div>
                )}
            </div>

            {/* Org chart selector */}
            <OrgChartPersonSelector
                selectedPersonIds={selectedPersonIds}
                onPersonsChange={onPersonsChange}
            />

            {/* Persons table */}
            {selectedPersons.length > 0 && (
                <div className="border border-base-200 rounded-xl overflow-hidden">
                    <div className="bg-base-50 border-b border-base-200 px-4 py-3 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-base-content text-sm">
                                Personas a evaluar
                                <span className="ml-2 badge badge-primary badge-sm">{selectedPersons.length}</span>
                            </h3>
                            <p className="text-xs text-base-content/50 mt-0.5">
                                Asigna uno o más evaluadores a cada persona, o usa la sección global al final.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table table-sm w-full">
                            <thead className="bg-base-50/50 text-xs text-base-content/50 uppercase tracking-wide">
                                <tr>
                                    <th className="w-8 pl-4" />
                                    <th>Persona</th>
                                    <th className="hidden md:table-cell">Unidad organizacional</th>
                                    <th>Evaluadores asignados</th>
                                    <th className="w-10" />
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPersons.map((person) => {
                                    const personEvalIds = evaluadoresPorPersona[person.id] ?? [];
                                    const isPickerOpen = openPickerFor === person.id;
                                    return (
                                        <React.Fragment key={person.id}>
                                            <tr className={`border-b border-base-100 transition-colors ${isPickerOpen ? 'bg-primary/3' : 'hover:bg-base-50'}`}>
                                                <td className="pl-4">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                        {getInitials(person)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <p className="font-medium text-sm text-base-content leading-tight">
                                                        {fmtPerson(person)}
                                                    </p>
                                                    {person.cargo && (
                                                        <p className="text-xs text-base-content/50 mt-0.5">{person.cargo}</p>
                                                    )}
                                                </td>
                                                <td className="hidden md:table-cell">
                                                    {person.unidad_organizacional ? (
                                                        <span className="badge badge-ghost badge-sm font-normal">
                                                            {person.unidad_organizacional}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-base-content/30">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {personEvalIds.length === 0 && !isPickerOpen && (
                                                            <span className="text-xs text-base-content/35 italic">
                                                                Sin evaluador específico
                                                            </span>
                                                        )}
                                                        {personEvalIds.map((uid) => {
                                                            const u = allEvaluators.find((x) => x.id === uid);
                                                            if (!u) return null;
                                                            return (
                                                                <span
                                                                    key={uid}
                                                                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20"
                                                                >
                                                                    {fmtEval(u)}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveEvaluatorFromPerson(person.id, uid)}
                                                                        className="w-3.5 h-3.5 rounded-full hover:bg-secondary/20 flex items-center justify-center"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })}
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePicker(person.id)}
                                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                                                isPickerOpen
                                                                    ? 'bg-primary text-primary-content border-primary'
                                                                    : 'border-dashed border-base-300 text-base-content/40 hover:border-primary hover:text-primary'
                                                            }`}
                                                        >
                                                            <Plus size={16} />
                                                            Agregar
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePerson(person.id)}
                                                        className="p-1.5 rounded-md text-base-content/25 hover:text-error hover:bg-error/10 transition-colors"
                                                        title="Quitar persona"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Inline evaluator picker row */}
                                            {isPickerOpen && (
                                                <tr className="bg-primary/3 border-b border-primary/10">
                                                    <td colSpan={5} className="px-4 py-3">
                                                        <EvaluatorPicker
                                                            allEvaluators={allEvaluators}
                                                            assignedIds={personEvalIds}
                                                            onAdd={(eid) => handleAddEvaluatorToPerson(person.id, eid)}
                                                            onRemove={(eid) => handleRemoveEvaluatorFromPerson(person.id, eid)}
                                                            onClose={() => setOpenPickerFor(null)}
                                                            label={`Evaluadores de ${person.nombres} ${person.apellidos}`}
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParticipantsTab;
