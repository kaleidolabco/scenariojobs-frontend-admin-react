import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Plus, Trash2, Clock } from '../Common/Icon';
import Button from '../Common/Button';
import GenericTable, { TableColumn, TableAction } from '../Common/GenericTable';
import OrgChartPersonSelector from './OrgChartPersonSelector';
import EvaluatorPicker from './EvaluatorPicker';
import { usePersonService, Person } from '../../services/personService';
import { useCompetencyEvaluationService, ParticipantToAdd } from '../../services/competencyEvaluationService';
import { Pagination } from '../../services/responseType';
import {
    PersonRow,
    EvaluadoresPorPersona,
    ProcessParticipantRow,
    EvaluatorUser,
    fmtPerson,
    fmtEval,
    getInitials,
    getEntityName,
    personToRow,
} from './types';

interface ParticipantsTabProps {
    evaluationId: string;
    selectedPersonIds: string[];
    evaluadoresPorPersona: EvaluadoresPorPersona;
    onPersonsChange: (ids: string[]) => void;
    onEvaluadoresPorPersonaChange: (map: EvaluadoresPorPersona) => void;
    onPersonasDetalle: (rows: PersonRow[]) => void;
    onServerParticipantsLoaded?: (ids: string[]) => void;
    dirty: boolean;
    saving: boolean;
    onSave: (incrementalPayload?: { agregar: ParticipantToAdd[]; retirar: string[] }) => void;
}

const SEARCH_LIMIT = 20;

const personToParticipantRow = (p: Person): ProcessParticipantRow => ({
    id: p.id,
    colaborador_id: p.id,
    persona_id: p.id,
    nombres: p.nombres,
    apellidos: p.apellidos,
    email: p.usuario_email || p.email_personal,
});

const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
    evaluationId,
    selectedPersonIds,
    evaluadoresPorPersona,
    onPersonsChange,
    onEvaluadoresPorPersonaChange,
    onPersonasDetalle,
    onServerParticipantsLoaded,
    dirty,
    saving,
    onSave,
}) => {
    const { getPeople } = usePersonService();
    const { getProcessParticipants } = useCompetencyEvaluationService();
    const pickerRef = useRef<HTMLDivElement>(null);
    const prevDirtyRef = useRef(dirty);
    const baselineServerIdsRef = useRef<Set<string>>(new Set());

    const [openPickerFor, setOpenPickerFor] = useState<string | null>(null);
    const [pickerAnchor, setPickerAnchor] = useState<{ top: number; left: number } | null>(null);
    const [evaluadoresCache, setEvaluadoresCache] = useState<Record<string, EvaluatorUser>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Person[]>([]);
    const [searching, setSearching] = useState(false);

    // Servidor paginado
    const [participantsList, setParticipantsList] = useState<ProcessParticipantRow[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableParams, setTableParams] = useState({
        pagina: 1,
        limite: 10,
        busqueda: '',
        ordenar_por: 'fecha_registro',
        orden: 'desc' as 'asc' | 'desc',
    });

    // Caché local de personas recién agregadas (antes de guardarse)
    const [localPersonsCache, setLocalPersonsCache] = useState<Record<string, ProcessParticipantRow>>({});

    const { pagina, limite, busqueda, ordenar_por, orden } = tableParams;

    // ── after save: clear pending & reload ──────────────────────────────
    useEffect(() => {
        if (prevDirtyRef.current && !dirty) {
            setLocalPersonsCache({});
            loadProcessParticipants();
        }
        prevDirtyRef.current = dirty;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirty]);

    // ── Derived: pending vs server participants ────────────────────────
    const serverIds = useMemo(
        () => new Set(participantsList.map((p) => p.colaborador_id || p.persona_id || p.id)),
        [participantsList],
    );

    const pendingParticipants = useMemo(
        () =>
            selectedPersonIds
                .filter((id) => !serverIds.has(id) && localPersonsCache[id])
                .map((id) => localPersonsCache[id]),
        [selectedPersonIds, serverIds, localPersonsCache],
    );

    const displayData = useMemo(
        () => [...pendingParticipants, ...participantsList],
        [pendingParticipants, participantsList],
    );

    const totalDisplayCount = (pagination?.total ?? 0) + pendingParticipants.length;

    // ── Load server participants ───────────────────────────────────────
    const loadProcessParticipants = useCallback(async () => {
        if (!evaluationId) return;
        setTableLoading(true);
        try {
            const res = await getProcessParticipants(evaluationId, {
                pagina,
                limite,
                busqueda,
                ordenar_por,
                orden,
            });
            if (res?.success && res.data) {
                const datos: ProcessParticipantRow[] = res.data.datos || res.data.participantes || [];
                setParticipantsList(datos);
                setPagination(res.data.paginacion || null);

                const serverIdsArr = datos.map((p) => p.colaborador_id || p.persona_id || p.id);
                onServerParticipantsLoaded?.(serverIdsArr);
                baselineServerIdsRef.current = new Set(serverIdsArr);

                const rows: PersonRow[] = datos.map((p) => ({
                    id: p.colaborador_id || p.persona_id || p.id,
                    nombres: p.nombres,
                    apellidos: p.apellidos,
                    unidad_organizacional: getEntityName(p.unidad_organizacional),
                    cargo: getEntityName(p.cargo),
                    email: p.email,
                }));
                onPersonasDetalle(rows);
            }
        } finally {
            setTableLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evaluationId, pagina, limite, busqueda, ordenar_por, orden]);

    useEffect(() => {
        loadProcessParticipants();
    }, [loadProcessParticipants]);

    // ── Search: people from company directory ──────────────────────────
    useEffect(() => {
        const term = searchTerm.trim();
        if (term.length === 0) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const handler = setTimeout(async () => {
            const res = await getPeople({ search: term, items_por_pagina: SEARCH_LIMIT });
            const list = res?.success ? res.data.datos || res.data.personas || [] : [];
            setSearchResults(list);
            setSearching(false);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, getPeople]);

    // ── Handlers: participants ─────────────────────────────────────────

    const handleAddPersonFromSearch = (person: Person) => {
        if (!selectedPersonIds.includes(person.id)) {
            onPersonsChange([...selectedPersonIds, person.id]);
        }
        const row = personToParticipantRow(person);
        setLocalPersonsCache((prev) => ({ ...prev, [person.id]: row }));
        onPersonasDetalle([personToRow(person)]);
        setSearchTerm('');
    };

    const handleRemovePerson = (id: string) => {
        onPersonsChange(selectedPersonIds.filter((x) => x !== id));

        const next = { ...evaluadoresPorPersona };
        delete next[id];
        onEvaluadoresPorPersonaChange(next);

        setLocalPersonsCache((prev) => {
            const nextCache = { ...prev };
            delete nextCache[id];
            return nextCache;
        });

        setParticipantsList((prev) => prev.filter((p) => (p.colaborador_id || p.persona_id || p.id) !== id));

        if (openPickerFor === id) {
            setOpenPickerFor(null);
            setPickerAnchor(null);
        }
    };

    const getServerEvalIds = (personId: string): string[] => {
        const participant = displayData.find(
            (p) => (p.colaborador_id || p.persona_id || p.id) === personId,
        );
        return participant?.evaluadores_custom ?? [];
    };

    const handleAddEvaluatorToPerson = (personId: string, evalId: string, user?: EvaluatorUser) => {
        const current = evaluadoresPorPersona[personId] ?? getServerEvalIds(personId);
        if (current.includes(evalId)) return;
        onEvaluadoresPorPersonaChange({ ...evaluadoresPorPersona, [personId]: [...current, evalId] });
        if (user) {
            setEvaluadoresCache((prev) => ({ ...prev, [evalId]: user }));
        }
    };

    const handleRemoveEvaluatorFromPerson = (personId: string, evalId: string) => {
        const current = evaluadoresPorPersona[personId] ?? getServerEvalIds(personId);
        onEvaluadoresPorPersonaChange({
            ...evaluadoresPorPersona,
            [personId]: current.filter((x) => x !== evalId),
        });
    };

    const togglePicker = (key: string, event: React.MouseEvent) => {
        if (openPickerFor === key) {
            setOpenPickerFor(null);
            setPickerAnchor(null);
        } else {
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            setOpenPickerFor(key);
            setPickerAnchor({ top: rect.bottom + 4, left: rect.left });
        }
    };

    useEffect(() => {
        if (!openPickerFor) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setOpenPickerFor(null);
                setPickerAnchor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openPickerFor]);

    const handleUnitPersonsLoaded = useCallback(
        (persons: Person[]) => {
            const cacheUpdate: Record<string, ProcessParticipantRow> = {};
            persons.forEach((p) => {
                cacheUpdate[p.id] = personToParticipantRow(p);
            });
            setLocalPersonsCache((prev) => ({ ...prev, ...cacheUpdate }));
            onPersonasDetalle(persons.map(personToRow));
        },
        [onPersonasDetalle],
    );

    // ── Table columns ──────────────────────────────────────────────────
    const columns: TableColumn<ProcessParticipantRow>[] = [
        {
            key: 'nombres',
            label: 'Participante',
            sortable: true,
            render: (p) => {
                const pid = p.colaborador_id || p.persona_id || p.id;
                const isPending = !serverIds.has(pid);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(p)}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-base-content leading-tight truncate">
                                    {p.nombre_completo || fmtPerson(p)}
                                </p>
                                {isPending && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                                        <Clock size={10} />
                                        Sin guardar
                                    </span>
                                )}
                            </div>
                            {p.email && (
                                <p className="text-xs text-base-content/50 truncate">{p.email}</p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'unidad_organizacional',
            label: 'Unidad Organizacional',
            render: (p) => {
                const unidad = getEntityName(p.unidad_organizacional);
                return unidad ? (
                    <span className="badge badge-ghost badge-sm font-normal">{unidad}</span>
                ) : (
                    <span className="text-xs text-base-content/30">—</span>
                );
            },
        },
        {
            key: 'cargo',
            label: 'Cargo / Puesto',
            render: (p) => {
                const cargoName = getEntityName(p.cargo);
                const puestoName = getEntityName(p.puesto);
                return (
                    <div>
                        {cargoName && <p className="text-xs font-medium text-base-content">{cargoName}</p>}
                        {puestoName && <p className="text-[10px] text-base-content/50">{puestoName}</p>}
                        {!cargoName && !puestoName && <span className="text-xs text-base-content/30">—</span>}
                    </div>
                );
            },
        },
        {
            key: 'evaluadores',
            label: 'Evaluadores Asignados',
            render: (p) => {
                const pid = p.colaborador_id || p.persona_id || p.id;
                const hasLocalChanges = pid in evaluadoresPorPersona;
                const customEvalIds = hasLocalChanges
                    ? evaluadoresPorPersona[pid]
                    : (p.evaluadores_custom ?? []);
                const detalles = p.evaluadores_detalle ?? [];

                const resolveEvalName = (uid: string): string => {
                    const cached = evaluadoresCache[uid];
                    if (cached) return fmtEval(cached);
                    const fromDetalle = detalles.find((d) => d.id === uid);
                    if (fromDetalle) return fromDetalle.nombre_completo || fmtPerson(fromDetalle);
                    return '';
                };

                return (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {customEvalIds.length === 0 && detalles.length === 0 && (
                            <span className="text-xs text-base-content/35 italic">
                                Evaluadores automáticos
                            </span>
                        )}
                        {customEvalIds.length === 0 && !hasLocalChanges && detalles.length > 0 && (
                            <span className="text-xs text-base-content/35 italic">
                                Evaluadores automáticos (Auto y Jefe)
                            </span>
                        )}
                        {customEvalIds.map((uid) => {
                            const displayName = resolveEvalName(uid) || uid;
                            return (
                                <span
                                    key={uid}
                                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20"
                                >
                                    {displayName}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEvaluatorFromPerson(pid, uid)}
                                        className="w-3.5 h-3.5 rounded-full hover:bg-secondary/20 flex items-center justify-center text-secondary/70 hover:text-secondary"
                                        title="Quitar evaluador"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            );
                        })}
                        <button
                            type="button"
                            onClick={(e) => togglePicker(pid, e)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-base-300 text-base-content/40 hover:border-primary hover:text-primary transition-colors"
                        >
                            <Plus size={14} />
                            Agregar
                        </button>
                    </div>
                );
            },
        },
    ];

    const actions: TableAction<ProcessParticipantRow>[] = [
        {
            label: 'Eliminar participante',
            icon: <Trash2 size={16} />,
            onClick: (p) => {
                const pid = p.colaborador_id || p.persona_id || p.id;
                handleRemovePerson(pid);
            },
            variant: 'error',
            tooltip: 'Quitar del proceso',
        },
    ];

    // ── Save: compute incremental diff for PATCH ──────────────────────
    const handleSave = () => {
        const baseline = baselineServerIdsRef.current;
        const desiredSet = new Set([...selectedPersonIds, ...participantsList.map((p) => p.colaborador_id || p.persona_id || p.id)]);

        const agregar: ParticipantToAdd[] = selectedPersonIds
            .filter((id) => !baseline.has(id))
            .map((id) => ({
                colaborador_id: id,
                evaluadores: evaluadoresPorPersona[id],
            }));

        const retirar: string[] = [...baseline].filter((id) => !desiredSet.has(id));

        onSave(agregar.length > 0 || retirar.length > 0 ? { agregar, retirar } : undefined);
    };

    return (
        <div className="space-y-6">
            {/* Search bar para agregar nuevo participante */}
            <div className="relative">
                <div className="flex items-center gap-2 border border-base-200 rounded-lg bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar participante en la empresa por nombre, email, cargo..."
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

                {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-base-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {searching ? (
                            <div className="px-4 py-3 text-center text-sm text-base-content/50">
                                Buscando...
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((person) => (
                                <button
                                    key={person.id}
                                    type="button"
                                    onClick={() => handleAddPersonFromSearch(person)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-primary/5 border-b border-base-100 last:border-b-0 transition-colors flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                            {getInitials(personToRow(person))}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-base-content truncate">
                                                {person.nombres} {person.apellidos}
                                            </p>
                                            {person.email_personal && (
                                                <p className="text-xs text-base-content/50 truncate">
                                                    {person.email_personal}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="primary" size="xs" onClick={(ev) => {
                                        ev.stopPropagation();
                                        handleAddPersonFromSearch(person);
                                    }}>
                                        <Plus size={14} />
                                        Agregar
                                    </Button>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-center text-sm text-base-content/50">
                                No se encontraron participantes
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Org chart selector */}
            <OrgChartPersonSelector
                selectedPersonIds={selectedPersonIds}
                onPersonsChange={onPersonsChange}
                onPersonsLoaded={handleUnitPersonsLoaded}
            />

            {/* Participants table (merged pending + server) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base-content text-sm">
                        Personas a evaluar
                        <span className="ml-2 badge badge-primary badge-sm">
                            {totalDisplayCount}
                        </span>
                    </h3>
                </div>

                <GenericTable
                    data={displayData}
                    columns={columns}
                    actions={actions}
                    keyExtractor={(p) => p.colaborador_id || p.persona_id || p.id}
                    pagination={pagination}
                    onPageChange={(page) => setTableParams((p) => ({ ...p, pagina: page }))}
                    onPageSizeChange={(size) => setTableParams((p) => ({ ...p, limite: size, pagina: 1 }))}
                    sortConfig={{ key: tableParams.ordenar_por, direction: tableParams.orden }}
                    onSort={(key) => {
                        const newDir = tableParams.ordenar_por === key && tableParams.orden === 'asc' ? 'desc' : 'asc';
                        setTableParams((p) => ({ ...p, ordenar_por: key, orden: newDir }));
                    }}
                    emptyMessage="No hay participantes asignados a este proceso."
                    isLoading={tableLoading}
                />
            </div>

            {/* Guardado de la pestaña */}
            <div className="flex items-center justify-between gap-3 border-t border-base-200 pt-4">
                <span className={`text-xs ${dirty ? 'text-warning' : 'text-base-content/40'}`}>
                    {dirty ? 'Hay cambios sin guardar en esta pestaña' : 'Sin cambios pendientes'}
                </span>
                <Button variant="primary" onClick={handleSave} disabled={!dirty || saving} loading={saving}>
                    Guardar cambios
                </Button>
            </div>

            {/* Panel flotante para seleccionar evaluadores */}
            {openPickerFor && pickerAnchor && (() => {
                const activeParticipant = displayData.find(
                    (p) => (p.colaborador_id || p.persona_id || p.id) === openPickerFor,
                );
                const pickerHasLocal = openPickerFor in evaluadoresPorPersona;
                const customEvalIds = pickerHasLocal
                    ? evaluadoresPorPersona[openPickerFor]
                    : (activeParticipant?.evaluadores_custom ?? []);

                const detalleEvals = activeParticipant?.evaluadores_detalle ?? [];
                const mergedCache: Record<string, EvaluatorUser> = { ...evaluadoresCache };
                for (const ev of detalleEvals) {
                    if (!mergedCache[ev.id]) {
                        mergedCache[ev.id] = {
                            id: ev.id,
                            email: ev.email ?? '',
                            persona: (ev.nombres || ev.apellidos)
                                ? { nombres: ev.nombres ?? '', apellidos: ev.apellidos ?? '' }
                                : ev.nombre_completo
                                    ? { nombre_completo: ev.nombre_completo }
                                    : undefined,
                        };
                    }
                }

                const adjustedLeft = Math.min(pickerAnchor.left, window.innerWidth - 380);
                const adjustedTop = pickerAnchor.top + 200 > window.innerHeight
                    ? Math.max(8, pickerAnchor.top - 220)
                    : pickerAnchor.top;

                return (
                    <div ref={pickerRef} className="fixed z-50 w-[360px] bg-white rounded-xl shadow-xl border border-base-200 p-4 space-y-3"
                        style={{ top: adjustedTop, left: adjustedLeft }}>
                        <div className="flex items-center justify-between border-b border-base-100 pb-2">
                            <h4 className="text-sm font-semibold text-base-content truncate">
                                {activeParticipant
                                    ? `Eval. para ${activeParticipant.nombres} ${activeParticipant.apellidos || ''}`
                                    : 'Asignar Evaluador'}
                            </h4>
                            <button
                                type="button"
                                onClick={() => { setOpenPickerFor(null); setPickerAnchor(null); }}
                                className="p-1 rounded-md hover:bg-base-100 text-base-content/40 hover:text-base-content shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <EvaluatorPicker
                            assignedIds={customEvalIds}
                            onAdd={(eid, user) => handleAddEvaluatorToPerson(openPickerFor, eid, user)}
                            onRemove={(eid) => handleRemoveEvaluatorFromPerson(openPickerFor, eid)}
                            onClose={() => { setOpenPickerFor(null); setPickerAnchor(null); }}
                            usersCache={mergedCache}
                        />
                    </div>
                );
            })()}
        </div>
    );
};

export default ParticipantsTab;
