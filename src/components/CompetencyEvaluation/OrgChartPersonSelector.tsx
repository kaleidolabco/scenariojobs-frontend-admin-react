import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import { usePersonService, Person } from '../../services/personService';
import { ChevronDown, Check, User, Building2 } from '../../components/Common/Icon';
import Button from '../../components/Common/Button';

interface OrgChartPersonSelectorProps {
    selectedPersonIds: string[];
    onPersonsChange: (ids: string[]) => void;
    onPersonsLoaded?: (persons: Person[]) => void;
}

interface TreeNodeProps {
    unit: OrgUnit;
    level: number;
    selectedUnitId: string | null;
    onSelectUnit: (unit: OrgUnit) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ unit, level, selectedUnitId, onSelectUnit }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = unit.subunidades && unit.subunidades.length > 0;
    const isSelected = selectedUnitId === unit.id;

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'DIVISION':
                return 'badge-primary';
            case 'AREA':
                return 'badge-secondary';
            case 'DEPARTAMENTO':
                return 'badge-accent';
            case 'EQUIPO':
                return 'badge-info';
            default:
                return 'badge-ghost';
        }
    };

    const handleSelectUnit = () => {
        onSelectUnit(unit);
    };

    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={handleSelectUnit}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
                    isSelected
                        ? 'bg-primary/15 border border-primary/30'
                        : 'hover:bg-base-100 border border-transparent'
                }`}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
            >
                {/* Expander */}
                {hasChildren ? (
                    <Button
                        variant="outline"
                        size="xs"
                        shape="circle"
                        className="bg-base-100 border-base-300 hover:bg-base-200 shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                ) : (
                    <div className="w-6 h-6" />
                )}

                {/* Icon */}
                <div className="text-base-content/60 shrink-0">
                    <Building2 size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                        <span className={`badge badge-xs ${getTypeBadgeClass(unit.tipo)}`}>
                            {unit.tipo}
                        </span>
                        <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-base-content'}`}>
                            {unit.nombre}
                        </span>
                    </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                    <div className="box-content w-4 h-4 rounded bg-primary text-primary-content flex items-center justify-center shrink-0">
                        <Check size={14} />
                    </div>
                )}
            </button>

            {/* Children */}
            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-1">
                            {unit.subunidades?.map((child) => (
                                <TreeNode
                                    key={child.id}
                                    unit={child}
                                    level={level + 1}
                                    selectedUnitId={selectedUnitId}
                                    onSelectUnit={onSelectUnit}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const OrgChartPersonSelector: React.FC<OrgChartPersonSelectorProps> = ({
    selectedPersonIds,
    onPersonsChange,
    onPersonsLoaded,
}) => {
    const { getOrgTree, loading: treeLoading } = useOrgUnitService();
    const { getPeople } = usePersonService();

    const [orgTree, setOrgTree] = useState<OrgUnit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);
    const [unitPersons, setUnitPersons] = useState<Person[]>([]);
    const [isLoadingPersons, setIsLoadingPersons] = useState(false);

    // Load org tree
    useEffect(() => {
        const loadTree = async () => {
            const res = await getOrgTree();
            if (res?.success) {
                setOrgTree(res.data.unidades || []);
            }
        };
        loadTree();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load persons when unit is selected
    const handleSelectUnit = useCallback(
        async (unit: OrgUnit) => {
            setSelectedUnit(unit);
            setIsLoadingPersons(true);
            try {
                const res = await getPeople({ departamento: unit.nombre, items_por_pagina: 100 });
                if (res?.success) {
                    const persons = res.data.datos || res.data.personas || [];
                    setUnitPersons(persons);
                    onPersonsLoaded?.(persons);
                }
            } finally {
                setIsLoadingPersons(false);
            }
        },
        [getPeople, onPersonsLoaded]
    );

    const handlePersonToggle = useCallback(
        (personId: string) => {
            const currentIds = new Set(selectedPersonIds);
            if (currentIds.has(personId)) {
                currentIds.delete(personId);
            } else {
                currentIds.add(personId);
            }
            onPersonsChange(Array.from(currentIds));
        },
        [selectedPersonIds, onPersonsChange]
    );

    const handleSelectAllPersons = (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentIds = new Set(selectedPersonIds);
        const allSelected = unitPersons.every((p) => currentIds.has(p.id));

        if (allSelected) {
            unitPersons.forEach((p) => currentIds.delete(p.id));
        } else {
            unitPersons.forEach((p) => currentIds.add(p.id));
        }

        onPersonsChange(Array.from(currentIds));
    };

    const selectedPersonsInUnit = unitPersons.filter((p) => selectedPersonIds.includes(p.id)).length;
    const allPersonsSelected = unitPersons.length > 0 && selectedPersonsInUnit === unitPersons.length;

    if (treeLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-md" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Organigrama */}
            <div className="border border-base-200 rounded-xl p-4 bg-base-50">
                <div className="mb-3">
                    <h4 className="font-semibold text-base-content">Seleccionar unidad organizacional</h4>
                    <p className="text-xs text-base-content/50 mt-0.5">
                        Expande y selecciona un departamento o equipo para ver sus personas
                    </p>
                </div>

                <div className="space-y-1">
                    {orgTree.length === 0 ? (
                        <p className="text-sm text-base-content/40 text-center py-4">
                            No hay unidades organizacionales disponibles
                        </p>
                    ) : (
                        orgTree.map((unit) => (
                            <TreeNode
                                key={unit.id}
                                unit={unit}
                                level={0}
                                selectedUnitId={selectedUnit?.id || null}
                                onSelectUnit={handleSelectUnit}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Personas de la unidad seleccionada */}
            {selectedUnit && (
                <div className="border border-base-200 rounded-xl p-4 bg-base-50">
                    <div className="mb-3">
                        <h4 className="font-semibold text-base-content">
                            Personas en: <span className="text-primary">{selectedUnit.nombre}</span>
                        </h4>
                        <p className="text-xs text-base-content/50 mt-0.5">
                            {isLoadingPersons ? (
                                <>Cargando personas...</>
                            ) : (
                                <>{unitPersons.length} persona{unitPersons.length !== 1 ? 's' : ''} disponible{unitPersons.length !== 1 ? 's' : ''}</>
                            )}
                        </p>
                    </div>

                    {isLoadingPersons ? (
                        <div className="flex items-center justify-center py-6">
                            <span className="loading loading-spinner loading-sm" />
                        </div>
                    ) : unitPersons.length > 0 ? (
                        <div className="space-y-2">
                            {/* Select all button */}
                            <button
                                type="button"
                                onClick={handleSelectAllPersons}
                                className={`w-full px-2 py-1.5 text-xs rounded-md font-medium transition-colors text-left ${
                                    allPersonsSelected
                                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'bg-base-200 text-base-content hover:bg-base-300'
                                }`}
                            >
                                {allPersonsSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                            </button>

                            {/* Persons list */}
                            <div className="space-y-1 max-h-72 overflow-y-auto">
                                {unitPersons.map((person) => {
                                    const isSelected = selectedPersonIds.includes(person.id);
                                    return (
                                        <button
                                            key={person.id}
                                            type="button"
                                            onClick={() => handlePersonToggle(person.id)}
                                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                                                isSelected ? 'bg-primary/10' : 'hover:bg-base-100'
                                            }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                                                    isSelected
                                                        ? 'bg-primary border-primary text-primary-content'
                                                        : 'border-base-300 hover:border-primary bg-base-100'
                                                }`}
                                            >
                                                {isSelected && <Check size={14} />}
                                            </div>
                                            <User size={16} />
                                            <span className="text-sm truncate">
                                                {person.nombres} {person.apellidos}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-base-content/40 italic py-4">
                            No hay personas asignadas a esta unidad.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrgChartPersonSelector;
