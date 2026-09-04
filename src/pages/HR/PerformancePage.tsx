import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    usePerformanceService,
    EvaluationCycle, EvaluationCycleStatus,
    EmployeeEvaluation, EmployeeEvaluationStatus,
    ObjectiveTemplate, ObjectiveCategory,
    OBJECTIVE_CATEGORY_LABELS, OBJECTIVE_FREQUENCY_LABELS,
    logroBadgeColor,
    calcPuntajeFinalNumerico,
} from '../../services/performanceService';
import { Pagination } from '../../services/responseType';
import { usePersonService, Person } from '../../services/personService';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import FilterBar from '../../components/Common/FilterBar';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import InputField from '../../components/Common/Forms/InputField';
import TextAreaField from '../../components/Common/Forms/TextAreaField';
import SelectField from '../../components/Common/Forms/SelectField';
import Button from '../../components/Common/Button';
import {
    Plus, Pencil, Trash2, Search, Check, X, FileText
} from '../../components/Common/Icon';

const EDITOR_ROUTE = (id: string) => `/desempeno/${id}`;
type ActiveTab = 'evaluaciones' | 'plantillas' | 'ciclos';

// ─── Status badges ────────────────────────────────────────────────────────────

const cycleBadge = (estado: EvaluationCycleStatus) => {
    const m: Record<EvaluationCycleStatus, { c: string; l: string }> = {
        BORRADOR: { c: 'ghost', l: 'Borrador' }, ACTIVO: { c: 'success', l: 'Activo' }, CERRADO: { c: 'error', l: 'Cerrado' },
    };
    return <div className={`badge badge-${m[estado].c} badge-outline text-xs font-medium`}>{m[estado].l}</div>;
};
const evalBadge = (estado: EmployeeEvaluationStatus) => {
    const m: Record<EmployeeEvaluationStatus, { c: string; l: string }> = {
        PENDIENTE: { c: 'ghost', l: 'Pendiente' }, EN_PROGRESO: { c: 'warning', l: 'En progreso' }, COMPLETADA: { c: 'success', l: 'Completada' },
    };
    return <div className={`badge badge-${m[estado].c} badge-outline text-xs font-medium`}>{m[estado].l}</div>;
};

// ─── Tab header ───────────────────────────────────────────────────────────────

const TabHeader: React.FC<{ active: ActiveTab; onChange: (t: ActiveTab) => void }> = ({ active, onChange }) => (
    <div className="border-b border-base-200 mb-5">
        <div className="flex gap-0">
            {([
                { id: 'evaluaciones' as ActiveTab, label: 'Evaluaciones' },
                { id: 'plantillas' as ActiveTab, label: 'Plantillas' },
                { id: 'ciclos' as ActiveTab, label: 'Ciclos' },
            ]).map(tab => (
                <button key={tab.id} onClick={() => onChange(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${active === tab.id ? 'border-primary text-primary' : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                        }`}
                >{tab.label}</button>
            ))}
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — CICLOS
// ═══════════════════════════════════════════════════════════════════════════════

const CyclesTab: React.FC = () => {
    const { getCycles, createCycle, updateCycle, deleteCycle, loading } = usePerformanceService();
    const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
    const [modalOpen, setModal] = useState(false);
    const [editing, setEditing] = useState<EvaluationCycle | null>(null);
    const [deleting, setDel] = useState<EvaluationCycle | null>(null);
    const blank = { nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', estado: 'BORRADOR' as EvaluationCycleStatus };
    const [form, setForm] = useState(blank);

    const load = useCallback(async () => {
        const r = await getCycles(); if (r?.success) setCycles(r.data.ciclos);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm(blank); setModal(true); };
    const openEdit = (c: EvaluationCycle) => { setEditing(c); setForm({ nombre: c.nombre, descripcion: c.descripcion ?? '', fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin, estado: c.estado }); setModal(true); };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = editing ? await updateCycle(editing.id, form) : await createCycle(form);
        if (res?.success) { await load(); setModal(false); }
    };

    const confirmDel = async () => {
        if (!deleting) return;
        if (await deleteCycle(deleting.id)) await load();
        setDel(null);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-base-content/60">{cycles.length} ciclos configurados</p>
                <Button variant="primary" size="sm" onClick={openCreate} leftIcon={Plus}>
                    Nuevo ciclo
                </Button>
            </div>

            {loading && !cycles.length ? <LoadingIndicator /> : (
                <div className="overflow-x-auto rounded-xl border border-base-200">
                    <table className="table table-zebra w-full">
                        <thead><tr className="text-xs uppercase tracking-wider text-base-content/50 bg-base-200/60">
                            <th className="font-semibold">Ciclo</th>
                            <th className="font-semibold hidden md:table-cell">Período</th>
                            <th className="font-semibold hidden sm:table-cell">Progreso</th>
                            <th className="font-semibold">Estado</th>
                            <th className="font-semibold text-right">Acciones</th>
                        </tr></thead>
                        <tbody>{cycles.map(c => {
                            const prog = c.total_evaluaciones ? Math.round(((c.evaluaciones_completadas ?? 0) / c.total_evaluaciones) * 100) : 0;
                            return (
                                <tr key={c.id}>
                                    <td>
                                        <p className="font-semibold text-sm">{c.nombre}</p>
                                        {c.descripcion && <p className="text-xs text-base-content/50 max-w-xs line-clamp-1">{c.descripcion}</p>}
                                    </td>
                                    <td className="hidden md:table-cell text-sm text-base-content/70">{c.fecha_inicio} → {c.fecha_fin}</td>
                                    <td className="hidden sm:table-cell">{c.total_evaluaciones ? (
                                        <div className="space-y-1 min-w-28">
                                            <div className="flex justify-between text-xs text-base-content/60"><span>{c.evaluaciones_completadas}/{c.total_evaluaciones}</span><span>{prog}%</span></div>
                                            <div className="h-1.5 bg-base-200 rounded-full overflow-hidden"><div className="h-full bg-success rounded-full" style={{ width: `${prog}%` }} /></div>
                                        </div>
                                    ) : <span className="text-xs text-base-content/30">Sin evaluaciones</span>}</td>
                                    <td>{cycleBadge(c.estado)}</td>
                                    <td><div className="flex justify-end gap-2">
                                        <Button variant="primary" size="sm" shape="square" outline onClick={() => openEdit(c)}>
                                            <Pencil size={16} />
                                        </Button>
                                        <Button variant="error" size="sm" shape="square" outline onClick={() => setDel(c)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div></td>
                                </tr>
                            );
                        })}</tbody>
                    </table>
                </div>
            )}

            <GenericModal isOpen={modalOpen} onClose={() => setModal(false)} title={editing ? 'Editar ciclo' : 'Nuevo ciclo'} size="md">
                <form onSubmit={submit} className="space-y-4">
                    <InputField label="Nombre" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Semestral H1 2026" />
                    <TextAreaField label="Descripción" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="label-text font-medium block">Fecha inicio <span className="text-error">*</span></label><input type="date" className="input input-bordered w-full" required value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
                        <div className="space-y-1"><label className="label-text font-medium block">Fecha fin <span className="text-error">*</span></label><input type="date" className="input input-bordered w-full" required value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} /></div>
                    </div>
                    <SelectField label="Estado" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as EvaluationCycleStatus })} options={[{ value: 'BORRADOR', label: 'Borrador' }, { value: 'ACTIVO', label: 'Activo' }, { value: 'CERRADO', label: 'Cerrado' }]} />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit" disabled={loading} loading={loading}>
                            {editing ? 'Guardar cambios' : 'Crear ciclo'}
                        </Button>
                    </div>
                </form>
            </GenericModal>
            <ConfirmationModal isOpen={!!deleting} onClose={() => setDel(null)} onConfirm={confirmDel} title="Eliminar ciclo" message={`¿Eliminar el ciclo "${deleting?.nombre}"? Se eliminarán también sus evaluaciones asociadas.`} confirmText="Eliminar" variant="danger" />
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — EVALUACIONES
// ═══════════════════════════════════════════════════════════════════════════════

interface EvaluationsTabProps {
    newOpen: boolean;
    setNewOpen: (open: boolean) => void;
}

const EvaluationsTab: React.FC<EvaluationsTabProps> = ({ newOpen, setNewOpen }) => {
    const navigate = useNavigate();
    const { getEvaluations, getCycles, createEvaluation, deleteEvaluation, loading } = usePerformanceService();
    const { getPeople } = usePersonService();

    const [evals, setEvals] = useState<EmployeeEvaluation[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        ciclo_id: undefined,
        estado: undefined,
        pagina: 1,
        items_por_pagina: 10,
    });

    const [people, setPeople] = useState<Person[]>([]);
    const [pSearch, setPSearch] = useState('');
    const [selPerson, setSelPerson] = useState<Person | null>(null);
    const [selCycle, setSelCycle] = useState('');
    const [deleting, setDeleting] = useState<EmployeeEvaluation | null>(null);

    const loadCycles = useCallback(async () => { const r = await getCycles(); if (r?.success) setCycles(r.data.ciclos); /* eslint-disable-next-line */ }, []);
    const loadEvals = useCallback(async () => {
        const r = await getEvaluations({
            search: queryParams.search || undefined,
            ciclo_id: queryParams.ciclo_id || undefined,
            estado: queryParams.estado as EmployeeEvaluationStatus || undefined,
            pagina: queryParams.pagina,
            items_por_pagina: queryParams.items_por_pagina
        });
        if (r?.success) { setEvals(r.data.evaluaciones); setPagination(r.data.paginacion); }
        /* eslint-disable-next-line */
    }, [queryParams]);

    useEffect(() => { loadCycles(); }, [loadCycles]);
    useEffect(() => { loadEvals(); }, [loadEvals]);

    useEffect(() => {
        if (!newOpen) return;
        const t = setTimeout(async () => { const r = await getPeople({ search: pSearch || undefined, estado: 'ACTIVO', items_por_pagina: 8 }); if (r?.success) setPeople(r.data.personas); }, 300);
        return () => clearTimeout(t);
        /* eslint-disable-next-line */
    }, [pSearch, newOpen]);

    // Inicializar datos cuando se abre el modal
    useEffect(() => {
        if (!newOpen) return;
        (async () => { setSelPerson(null); setPSearch(''); setSelCycle(''); const r = await getPeople({ estado: 'ACTIVO', items_por_pagina: 8 }); if (r?.success) setPeople(r.data.personas); })();
        /* eslint-disable-next-line */
    }, [newOpen]);

    const createEval = async () => {
        if (!selPerson || !selCycle) return;
        const r = await createEvaluation({ ciclo_id: selCycle, persona_id: selPerson.id, persona_nombre: `${selPerson.nombres} ${selPerson.apellidos}`, persona_departamento: selPerson.departamento, persona_puesto: selPerson.puesto_nombre });
        if (r?.success) { await loadEvals(); setNewOpen(false); }
    };

    const confirmDel = async () => { if (!deleting) return; if (await deleteEvaluation(deleting.id)) await loadEvals(); setDeleting(null); };

    // Filter Definitions
    const filterDefinitions = [
        {
            key: 'ciclo_id',
            label: 'Ciclo',
            options: cycles.map(c => ({ label: c.nombre, value: c.id }))
        },
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: 'Pendiente', value: 'PENDIENTE' },
                { label: 'En progreso', value: 'EN_PROGRESO' },
                { label: 'Completada', value: 'COMPLETADA' }
            ]
        }
    ];

    const activeFilters = {
        ...(queryParams.ciclo_id && { ciclo_id: queryParams.ciclo_id }),
        ...(queryParams.estado && { estado: queryParams.estado }),
    };

    const handleFilterChange = (key: string, value: any) => {
        setQueryParams((prev: any) => ({ ...prev, [key]: value, pagina: 1 }));
    };

    const handleSearch = (term: string) => {
        setQueryParams((prev: any) => ({ ...prev, search: term, pagina: 1 }));
    };

    const clearFilters = () => {
        setQueryParams({
            search: '',
            ciclo_id: undefined,
            estado: undefined,
            pagina: 1,
            items_por_pagina: 10,
        });
    };

    return (
        <>
            <FilterBar
                onSearch={handleSearch}
                searchTerm={queryParams.search || ''}
                searchPlaceholder="Buscar colaborador o evaluación..."
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {loading && !evals.length ? <LoadingIndicator /> : evals.length === 0 ? (
                <div className="text-center py-14 text-base-content/40">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Sin evaluaciones</p>
                </div>
            ) : (
                <GenericTable
                    data={evals}
                    columns={[
                        {
                            key: 'persona_nombre',
                            label: 'Colaborador',
                            render: (ev) => (
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-sm">{ev.persona_nombre}</span>
                                    <span className="text-xs text-base-content/50">{ev.persona_puesto}</span>
                                </div>
                            ),
                        },
                        {
                            key: 'ciclo_nombre',
                            label: 'Ciclo',
                            render: (ev) => <span className="text-sm text-base-content/70">{ev.ciclo_nombre}</span>,
                        },
                        {
                            key: 'objetivos',
                            label: 'Objetivos',
                            render: (ev) => <span className="badge badge-ghost badge-sm">{ev.objetivos.length} obj.</span>,
                        },
                        {
                            key: 'estado',
                            label: 'Estado',
                            render: (ev) => evalBadge(ev.estado),
                        },
                        {
                            key: 'puntaje_final',
                            label: 'Puntaje',
                            render: (ev) => {
                                const puntajeNumerico = calcPuntajeFinalNumerico(ev.objetivos);
                                return ev.puntaje_final !== undefined
                                    ? <div className={`badge badge-${logroBadgeColor(ev.puntaje_final)} font-bold whitespace-normal`}>
                                        <div className="flex flex-col items-center gap-0.5">
                                            {/* <span>{ev.puntaje_final.toFixed(1)}%</span> */}
                                            {puntajeNumerico !== undefined && <span className="text-xs">{puntajeNumerico.toFixed(2)}/5</span>}
                                        </div>
                                    </div>
                                    : <span className="text-xs text-base-content/30">—</span>;
                            },
                        },
                    ] as TableColumn<EmployeeEvaluation>[]}
                    actions={[
                        {
                            label: 'Editar',
                            icon: <Pencil size={16} />,
                            onClick: (ev) => navigate(EDITOR_ROUTE(ev.id)),
                            variant: 'ghost',
                            tooltip: 'Editar evaluación',
                        },
                        {
                            label: 'Eliminar',
                            icon: <Trash2 size={16} />,
                            onClick: (ev) => setDeleting(ev),
                            variant: 'ghost',
                            tooltip: 'Eliminar',
                        },
                    ] as TableAction<EmployeeEvaluation>[]}
                    keyExtractor={(ev) => ev.id}
                    pagination={pagination}
                    onPageChange={(page) => setQueryParams((p: any) => ({ ...p, pagina: page }))}
                    onPageSizeChange={(size) => setQueryParams((p: any) => ({ ...p, items_por_pagina: size, pagina: 1 }))}
                    emptyMessage="No se encontraron evaluaciones"
                    isLoading={loading}
                />
            )}

            {/* New evaluation modal */}
            <GenericModal isOpen={newOpen} onClose={() => setNewOpen(false)} title="Nueva evaluación de desempeño" size="md">
                <div className="space-y-5">
                    <SelectField label="Ciclo de evaluación" required value={selCycle} onChange={e => setSelCycle(e.target.value)}
                        options={[{ value: '', label: 'Seleccionar ciclo...' }, ...cycles.filter(c => c.estado !== 'CERRADO').map(c => ({ value: c.id, label: c.nombre }))]} />
                    <div className="space-y-2">
                        <label className="label-text font-medium block">Colaborador <span className="text-error">*</span></label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
                            <input className="input input-bordered w-full pl-9 text-sm" placeholder="Buscar colaborador..." value={pSearch} onChange={e => setPSearch(e.target.value)} />
                        </div>
                        {selPerson && (
                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                                <Check className="h-4 w-4 text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{selPerson.nombres} {selPerson.apellidos}</p>
                                    <p className="text-xs text-base-content/50">{selPerson.puesto_nombre}</p>
                                </div>
                                <Button variant="ghost" size="sm" shape="square" onClick={() => setSelPerson(null)}>
                                    <X size={14} />
                                </Button>
                            </div>
                        )}
                        {!selPerson && people.length > 0 && (
                            <div className="border border-base-200 rounded-xl overflow-hidden divide-y divide-base-200 max-h-52 overflow-y-auto">
                                {people.map(p => (
                                    <button key={p.id} className="w-full text-left px-3 py-2.5 hover:bg-base-200/60 transition-colors" onClick={() => setSelPerson(p)}>
                                        <p className="text-sm font-medium">{p.nombres} {p.apellidos}</p>
                                        <p className="text-xs text-base-content/50">{p.departamento} · {p.puesto_nombre}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={createEval} disabled={!selPerson || !selCycle || loading} loading={loading}>
                            Crear evaluación
                        </Button>
                    </div>
                </div>
            </GenericModal>
            <ConfirmationModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDel} title="Eliminar evaluación" message={`¿Eliminar la evaluación de "${deleting?.persona_nombre}"?`} confirmText="Eliminar" variant="danger" />
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — PLANTILLAS
// ═══════════════════════════════════════════════════════════════════════════════

const CAT_OPTIONS = Object.entries(OBJECTIVE_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));
const FREQ_OPTIONS = Object.entries(OBJECTIVE_FREQUENCY_LABELS).map(([v, l]) => ({ value: v, label: l }));

const TemplatesTab: React.FC = () => {
    const { getTemplates, createTemplate, updateTemplate, deleteTemplate, loading } = usePerformanceService();
    const [templates, setTemplates] = useState<ObjectiveTemplate[]>([]);
    const [search, setSearch] = useState('');
    const [fCat, setFCat] = useState('');
    const [modalOpen, setModal] = useState(false);
    const [editing, setEditing] = useState<ObjectiveTemplate | null>(null);
    const [deleting, setDeleting] = useState<ObjectiveTemplate | null>(null);
    const [tagInput, setTagInput] = useState('');

    const blank = (): Omit<ObjectiveTemplate, 'id'> => ({ nombre: '', descripcion: '', categoria: 'OPERATIVO', indicador: '', formula: '', tendencia: 'POSITIVA', unidad_medida: '', frecuencia: 'MENSUAL', peso: 0, meta: 0, peso_sugerido: undefined, tags: [] });
    const [form, setForm] = useState<Omit<ObjectiveTemplate, 'id'>>(blank());

    const load = useCallback(async () => { const r = await getTemplates(); if (r?.success) setTemplates(r.data.plantillas); /* eslint-disable-next-line */ }, []);
    useEffect(() => { load(); }, [load]);

    const filtered = templates.filter(t => {
        const q = search.toLowerCase();
        return (!q || t.nombre.toLowerCase().includes(q) || t.descripcion?.toLowerCase().includes(q) || t.tags?.some(g => g.toLowerCase().includes(q))) && (!fCat || t.categoria === fCat);
    });

    const openCreate = () => { setEditing(null); setForm(blank()); setTagInput(''); setModal(true); };
    const openEdit = (t: ObjectiveTemplate) => { setEditing(t); setForm({ ...t }); setTagInput(''); setModal(true); };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = editing ? await updateTemplate(editing.id, form) : await createTemplate(form);
        if (r?.success) { await load(); setModal(false); }
    };

    const confirmDel = async () => { if (!deleting) return; if (await deleteTemplate(deleting.id)) await load(); setDeleting(null); };
    const addTag = () => { if (!tagInput.trim()) return; setForm(f => ({ ...f, tags: [...(f.tags ?? []), tagInput.trim()] })); setTagInput(''); };

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
                    <input className="input input-bordered w-full pl-9 text-sm" placeholder="Buscar plantillas..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="select select-bordered text-sm w-full sm:w-52" value={fCat} onChange={e => setFCat(e.target.value)}>
                    <option value="">Todas las categorías</option>
                    {CAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Button variant="primary" onClick={openCreate} leftIcon={Plus}>
                    Nueva plantilla
                </Button>
            </div>

            {loading && !templates.length ? <LoadingIndicator /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(tpl => (
                            <motion.div key={tpl.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="card-body p-5">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-bold text-sm leading-snug flex-1">{tpl.nombre}</h3>
                                        <span className="badge badge-outline badge-sm shrink-0">{OBJECTIVE_CATEGORY_LABELS[tpl.categoria]}</span>
                                    </div>
                                    {tpl.descripcion && <p className="text-xs text-base-content/60 line-clamp-2 mb-2">{tpl.descripcion}</p>}
                                    <div className="flex flex-wrap gap-1 mb-3">{tpl.tags?.map(tag => <span key={tag} className="badge badge-ghost badge-sm text-xs">{tag}</span>)}</div>
                                    <div className="grid grid-cols-2 gap-1 text-xs text-base-content/60 border-t border-base-100 pt-3">
                                        <div><span className="text-base-content/40">Meta:</span> {tpl.meta} {tpl.unidad_medida}</div>
                                        <div><span className="text-base-content/40">Peso:</span> {tpl.peso_sugerido ?? tpl.peso}%</div>
                                        <div><span className="text-base-content/40">Tendencia:</span> {tpl.tendencia === 'POSITIVA' ? '↑' : '↓'} {tpl.tendencia.toLowerCase()}</div>
                                        <div><span className="text-base-content/40">Frec.:</span> {OBJECTIVE_FREQUENCY_LABELS[tpl.frecuencia]}</div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-3">
                                        <Button variant="primary" size="sm" shape="square" outline onClick={() => openEdit(tpl)}>
                                            <Pencil size={16} />
                                        </Button>
                                        <Button variant="error" size="sm" shape="square" outline onClick={() => setDeleting(tpl)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
            {filtered.length === 0 && !loading && (
                <div className="text-center py-14 text-base-content/40">
                    <p className="font-medium">Sin plantillas</p>
                    <p className="text-sm mt-1">{search || fCat ? 'Sin resultados.' : 'Crea la primera plantilla de objetivo.'}</p>
                </div>
            )}

            <GenericModal isOpen={modalOpen} onClose={() => setModal(false)} title={editing ? 'Editar plantilla' : 'Nueva plantilla'} size="lg">
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nombre" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Meta de ventas mensual" />
                        <SelectField label="Categoría" required value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as ObjectiveCategory })} options={CAT_OPTIONS} />
                    </div>
                    <TextAreaField label="Descripción" rows={2} value={form.descripcion ?? ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Indicador" required value={form.indicador} onChange={e => setForm({ ...form, indicador: e.target.value })} placeholder="Qué se mide" helpText="Ej: Ventas reales / Meta de ventas" />
                        <SelectField label="Tendencia" required value={form.tendencia} onChange={e => setForm({ ...form, tendencia: e.target.value as 'POSITIVA' | 'NEGATIVA' })} options={[{ value: 'POSITIVA', label: 'Positiva (más es mejor)' }, { value: 'NEGATIVA', label: 'Negativa (menos es mejor)' }]} />
                    </div>
                    <TextAreaField label="Fórmula" required rows={2} value={form.formula} onChange={e => setForm({ ...form, formula: e.target.value })} placeholder="Cómo se calcula el resultado" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InputField label="Unidad" required value={form.unidad_medida} onChange={e => setForm({ ...form, unidad_medida: e.target.value })} placeholder="%, $, hrs" />
                        <SelectField label="Frecuencia" value={form.frecuencia} onChange={e => setForm({ ...form, frecuencia: e.target.value as any })} options={FREQ_OPTIONS} />
                        <div className="space-y-1"><label className="label-text font-medium block">Meta <span className="text-error">*</span></label><input type="number" className="input input-bordered w-full" required value={form.meta || ''} onChange={e => setForm({ ...form, meta: parseFloat(e.target.value) || 0 })} /></div>
                        <div className="space-y-1"><label className="label-text font-medium block">Peso sugerido (%)</label><input type="number" min={0} max={100} className="input input-bordered w-full" value={form.peso_sugerido ?? ''} onChange={e => setForm({ ...form, peso_sugerido: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
                    </div>
                    <div className="space-y-2">
                        <label className="label-text font-medium block">Tags</label>
                        <div className="flex gap-2">
                            <input className="input input-bordered input-sm flex-1" placeholder="Agregar tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                            <Button variant="primary" size="sm" onClick={addTag} disabled={!tagInput.trim()}>Agregar</Button>
                        </div>
                        <div className="flex flex-wrap gap-1">{(form.tags ?? []).map(tag => (
                            <span key={tag} className="badge badge-ghost gap-1">{tag}
                                <button type="button" className="text-error text-xs" onClick={() => setForm(f => ({ ...f, tags: f.tags?.filter(t => t !== tag) }))}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}</div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit" disabled={loading} loading={loading}>
                            {editing ? 'Guardar cambios' : 'Crear plantilla'}
                        </Button>
                    </div>
                </form>
            </GenericModal>
            <ConfirmationModal isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDel} title="Eliminar plantilla" message={`¿Eliminar la plantilla "${deleting?.nombre}"?`} confirmText="Eliminar" variant="danger" />
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const PerformancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('evaluaciones');
    const [evalNewOpen, setEvalNewOpen] = useState(false);

    return (
        <PageContainer
            title="Desempeño"
            subtitle="Gestiona ciclos de evaluación, evaluaciones individuales por objetivos y plantillas reutilizables."
            actions={activeTab === 'evaluaciones' ? (
                <Button variant="primary" onClick={() => setEvalNewOpen(true)} leftIcon={Plus}>
                    Nuevo plan
                </Button>
            ) : undefined}
        >
            <TabHeader active={activeTab} onChange={setActiveTab} />
            <AnimatePresence mode="wait">
                {activeTab === 'ciclos' && (
                    <motion.div key="ciclos" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}>
                        <CyclesTab />
                    </motion.div>
                )}
                {activeTab === 'evaluaciones' && (
                    <motion.div key="evaluaciones" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}>
                        <EvaluationsTab newOpen={evalNewOpen} setNewOpen={setEvalNewOpen} />
                    </motion.div>
                )}
                {activeTab === 'plantillas' && (
                    <motion.div key="plantillas" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}>
                        <TemplatesTab />
                    </motion.div>
                )}
            </AnimatePresence>
        </PageContainer>
    );
};

export default PerformancePage;
