import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import FormSection from '../../components/Common/Forms/FormSection';
import InputField from '../../components/Common/Forms/InputField';
import TextAreaField from '../../components/Common/Forms/TextAreaField';
import SelectField from '../../components/Common/Forms/SelectField';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
    CompetencyEvaluationStatus,
} from '../../services/competencyEvaluationService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import { useCategoryService, Category } from '../../services/categoryService';
import { useUserService } from '../../services/userService';
import { usePersonService } from '../../services/personService';
import OrgChartPersonSelector from '../../components/Competencies/OrgChartPersonSelector';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'general' | 'competencias' | 'participantes';
type WeightMap = Record<string, number>;

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChevronDown = ({ open }: { open: boolean }) => (
    <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
const IconCheck = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);
const IconSearch = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const IconX = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const IconUser = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const IconWarning = () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: CompetencyEvaluationStatus; label: string }[] = [
    { value: 'BORRADOR',  label: 'Borrador'  },
    { value: 'PUBLICADO', label: 'Publicado' },
    { value: 'ARCHIVADO', label: 'Archivado' },
];

const STATUS_BADGE: Record<CompetencyEvaluationStatus, string> = {
    BORRADOR:  'badge-warning',
    PUBLICADO: 'badge-success',
    ARCHIVADO: 'badge-ghost',
};

// ─── Tab Header ───────────────────────────────────────────────────────────────

const TabHeader: React.FC<{
    active: ActiveTab;
    onChange: (t: ActiveTab) => void;
    competencyCount: number;
    personCount: number;
    totalWeight: number;
}> = ({ active, onChange, competencyCount, personCount, totalWeight }) => {
    const weightOk = totalWeight === 100;

    const tabs: { id: ActiveTab; label: string; badge?: React.ReactNode }[] = [
        { id: 'general', label: 'Información General' },
        {
            id: 'competencias',
            label: 'Competencias',
            badge: (
                <span className="flex items-center gap-1 ml-1">
                    {competencyCount > 0 && (
                        <span className="badge badge-sm badge-primary">{competencyCount}</span>
                    )}
                    {competencyCount > 0 && (
                        <span className={`badge badge-sm ${weightOk ? 'badge-success' : 'badge-warning'}`}>
                            {totalWeight}%
                        </span>
                    )}
                </span>
            ),
        },
        {
            id: 'participantes',
            label: 'Participantes',
            badge: personCount > 0 && (
                <span className="badge badge-sm badge-primary ml-1">{personCount}</span>
            ),
        },
    ];

    return (
        <div className="border-b border-base-200 mb-6 overflow-x-auto">
            <div className="flex gap-0 min-w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                            active === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                        }`}
                    >
                        {tab.label}
                        {tab.badge}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── Weight Bar ───────────────────────────────────────────────────────────────

const WeightBar: React.FC<{ total: number }> = ({ total }) => {
    const ok      = total === 100;
    const over    = total > 100;
    const barCls  = ok ? 'bg-success' : over ? 'bg-error' : 'bg-warning';
    const textCls = ok ? 'text-success' : over ? 'text-error' : 'text-warning';

    return (
        <div className="bg-base-100 border border-base-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-base-content">Distribución de pesos</span>
                <span className={`font-bold tabular-nums ${textCls}`}>{total}% / 100%</span>
            </div>
            <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full transition-colors duration-300 ${barCls}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(total, 100)}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>
            <p className="text-xs text-base-content/50">
                {ok
                    ? '✓ Los pesos suman exactamente 100%'
                    : over
                    ? `Excede en ${total - 100}%. Reduce algunos pesos.`
                    : `Faltan ${100 - total}% por asignar.`}
            </p>
        </div>
    );
};

// ─── Category Group ───────────────────────────────────────────────────────────

const CategoryGroup: React.FC<{
    category: Category;
    competencies: Competency[];
    selectedIds: string[];
    weights: WeightMap;
    onToggle: (id: string) => void;
    onWeightChange: (id: string, w: number) => void;
    searchTerm: string;
}> = ({ category, competencies, selectedIds, weights, onToggle, onWeightChange, searchTerm }) => {
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!searchTerm) return competencies;
        const q = searchTerm.toLowerCase();
        return competencies.filter(
            (c) => c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
        );
    }, [competencies, searchTerm]);

    const selectedInGroup = filtered.filter((c) => selectedIds.includes(c.id)).length;
    const allSelectedInGroup = filtered.length > 0 && selectedInGroup === filtered.length;

    if (filtered.length === 0) return null;

    const handleSelectAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (allSelectedInGroup) {
            // Deseleccionar todos
            filtered.forEach((c) => {
                if (selectedIds.includes(c.id)) onToggle(c.id);
            });
        } else {
            // Seleccionar todos
            const idsToSelect = filtered.filter((c) => !selectedIds.includes(c.id)).map((c) => c.id);
            idsToSelect.forEach((id) => onToggle(id));
        }
    };

    return (
        <div className="border border-base-200 rounded-xl overflow-hidden">
            {/* Group header */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 bg-base-50 hover:bg-base-100 transition-colors gap-2"
            >
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                    <span className={`badge badge-${category.color} badge-xs sm:badge-sm font-semibold shrink-0`}>
                        {category.nombre}
                    </span>
                    <span className="text-xs text-base-content/40 hidden sm:inline">
                        {filtered.length} competencia{filtered.length !== 1 ? 's' : ''}
                    </span>
                    {selectedInGroup > 0 && (
                        <span className="text-xs font-semibold text-primary hidden sm:inline">
                            · {selectedInGroup} seleccionada{selectedInGroup !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {open && filtered.length > 0 && (
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className={`px-2.5 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                                allSelectedInGroup
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'bg-base-200 text-base-content hover:bg-base-300'
                            }`}
                        >
                            {allSelectedInGroup ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        </button>
                    )}
                    <IconChevronDown open={open} />
                </div>
            </button>

            {/* Rows */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="divide-y divide-base-100">
                            {filtered.map((comp) => {
                                const isSelected = selectedIds.includes(comp.id);
                                const weight     = weights[comp.id] ?? 0;

                                return (
                                    <div
                                        key={comp.id}
                                        className={`flex items-start gap-4 px-5 py-3.5 transition-colors ${
                                            isSelected ? 'bg-primary/5' : 'bg-base-100 hover:bg-base-50'
                                        }`}
                                    >
                                        {/* Custom checkbox */}
                                        <button
                                            type="button"
                                            onClick={() => onToggle(comp.id)}
                                            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                                                isSelected
                                                    ? 'bg-primary border-primary text-primary-content'
                                                    : 'border-base-300 hover:border-primary bg-base-100'
                                            }`}
                                        >
                                            {isSelected && <IconCheck />}
                                        </button>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold leading-tight ${isSelected ? 'text-base-content' : 'text-base-content/80'}`}>
                                                {comp.nombre}
                                            </p>
                                            <p className="text-xs text-base-content/50 mt-0.5 line-clamp-2 leading-relaxed">
                                                {comp.descripcion}
                                            </p>
                                            <span className="text-xs text-base-content/35 mt-1 inline-block">
                                                Escala 1–{comp.escala}
                                            </span>
                                        </div>

                                        {/* Weight input — slides in when selected */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, width: 0 }}
                                                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="shrink-0 overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-1.5 bg-base-200/70 rounded-lg px-3 py-2 border border-base-300 min-w-[80px]">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            value={weight === 0 ? '' : weight}
                                                            placeholder="0"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                const val = e.target.value === '' ? 0 : Math.min(100, Math.max(0, Number(e.target.value)));
                                                                onWeightChange(comp.id, val);
                                                            }}
                                                            className="w-12 bg-transparent text-sm font-bold text-base-content text-right outline-none tabular-nums"
                                                        />
                                                        <span className="text-xs text-base-content/50 font-semibold">%</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Competencies Tab ─────────────────────────────────────────────────────────

const CompetenciesTab: React.FC<{
    allCompetencies: Competency[];
    allCategories: Category[];
    selectedIds: string[];
    weights: WeightMap;
    onToggle: (id: string) => void;
    onWeightChange: (id: string, w: number) => void;
    onClearAll: () => void;
}> = ({ allCompetencies, allCategories, selectedIds, weights, onToggle, onWeightChange, onClearAll }) => {
    const [search, setSearch]               = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    const totalWeight = selectedIds.reduce((s, id) => s + (weights[id] ?? 0), 0);
    const weightOk    = totalWeight === 100;

    const grouped = useMemo(() => {
        return allCategories
            .map((cat) => ({
                category:     cat,
                competencies: allCompetencies.filter(
                    (c) => c.categoria === cat.slug && (!categoryFilter || cat.slug === categoryFilter)
                ),
            }))
            .filter((g) => g.competencies.length > 0);
    }, [allCompetencies, allCategories, categoryFilter]);

    const distributeEvenly = () => {
        if (selectedIds.length === 0) return;
        const base  = Math.floor(100 / selectedIds.length);
        const extra = 100 - base * selectedIds.length;
        selectedIds.forEach((id, i) => onWeightChange(id, base + (i === 0 ? extra : 0)));
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                        <IconSearch />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar competencia..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-bordered input-sm w-full pl-9"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content"
                        >
                            <IconX />
                        </button>
                    )}
                </div>
                <select
                    className="select select-bordered select-sm w-full sm:w-56"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {allCategories.map((c) => (
                        <option key={c.id} value={c.slug}>{c.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Weight controls (only when something is selected) */}
            {selectedIds.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex-1 w-full">
                        <WeightBar total={totalWeight} />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={distributeEvenly} className="btn btn-ghost btn-sm">
                            Distribuir uniformemente
                        </button>
                        <button type="button" onClick={onClearAll} className="btn btn-ghost btn-sm text-error">
                            Limpiar selección
                        </button>
                    </div>
                </div>
            )}

            {/* Weight warning */}
            {selectedIds.length > 0 && !weightOk && (
                <div className={`alert py-2.5 ${totalWeight > 100 ? 'alert-error' : 'alert-warning'}`}>
                    <IconWarning />
                    <span className="text-sm">
                        {totalWeight > 100
                            ? `Los pesos exceden 100% en ${totalWeight - 100}%. Ajusta los valores.`
                            : `Faltan ${100 - totalWeight}% por asignar. Los pesos deben sumar 100%.`}
                    </span>
                </div>
            )}

            {/* Category groups */}
            <div className="space-y-3">
                {grouped.map(({ category, competencies }) => (
                    <CategoryGroup
                        key={category.id}
                        category={category}
                        competencies={competencies}
                        selectedIds={selectedIds}
                        weights={weights}
                        onToggle={onToggle}
                        onWeightChange={onWeightChange}
                        searchTerm={search}
                    />
                ))}
                {search && grouped.every((g) => {
                    const q = search.toLowerCase();
                    return !g.competencies.some(
                        (c) => c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
                    );
                }) && (
                    <div className="text-center py-10 text-base-content/40 text-sm">
                        Sin resultados para "{search}"
                    </div>
                )}
                {!search && grouped.length === 0 && (
                    <div className="text-center py-10 text-base-content/40 text-sm">
                        No hay competencias disponibles.
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Participants Tab ─────────────────────────────────────────────────────────

const ParticipantsTab: React.FC<{
    allPersons: Array<{ id: string; nombres: string; apellidos: string }>;
    allEvaluators: Array<{ id: string; email: string; persona?: { nombres: string; apellidos: string } }>;
    selectedPersonIds: string[];
    selectedEvaluatorIds: string[];
    onPersonsChange: (ids: string[]) => void;
    onEvaluatorsChange: (ids: string[]) => void;
}> = ({ allPersons, allEvaluators, selectedPersonIds, selectedEvaluatorIds, onPersonsChange, onEvaluatorsChange }) => {
    const [evaluatorSearch, setEvaluatorSearch] = useState('');

    const fmt     = (p: { nombres: string; apellidos: string }) => `${p.nombres} ${p.apellidos}`;
    const fmtUser = (u: any) => u.persona ? fmt(u.persona) : u.email;

    const filteredEvaluators = allEvaluators.filter(
        (u) => !selectedEvaluatorIds.includes(u.id) && fmtUser(u).toLowerCase().includes(evaluatorSearch.toLowerCase())
    );

    const PersonTag: React.FC<{ label: string; onRemove: () => void; variant?: 'primary' | 'secondary' }> = ({
        label, onRemove, variant = 'primary',
    }) => (
        <span className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-sm font-medium border
            ${variant === 'primary'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-secondary/10 text-secondary border-secondary/20'}`}>
            {label}
            <button
                type="button"
                onClick={onRemove}
                className={`w-4 h-4 rounded-full flex items-center justify-center
                    ${variant === 'primary' ? 'hover:bg-primary/20' : 'hover:bg-secondary/20'}`}
            >
                <IconX />
            </button>
        </span>
    );

    return (
        <div className="space-y-6">
            {/* ── Selector de Organigrama ── */}
            <OrgChartPersonSelector
                selectedPersonIds={selectedPersonIds}
                onPersonsChange={onPersonsChange}
            />

            {/* ── Personas Seleccionadas ── */}
            {selectedPersonIds.length > 0 && (
                <div className="border border-base-200 rounded-xl p-4 bg-base-50">
                    <div>
                        <h3 className="font-semibold text-base-content mb-3">
                            Personas seleccionadas ({selectedPersonIds.length})
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedPersonIds.map((pid) => {
                            const p = allPersons.find((x) => x.id === pid);
                            if (!p) return null;
                            return (
                                <PersonTag
                                    key={pid}
                                    label={fmt(p)}
                                    onRemove={() => onPersonsChange(selectedPersonIds.filter((x) => x !== pid))}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Evaluadores */}
            <div className="border border-base-200 rounded-xl p-4 bg-base-50">
                <div>
                    <h3 className="font-semibold text-base-content">Evaluadores asignados</h3>
                    <p className="text-xs text-base-content/50 mt-0.5">
                        Quiénes realizarán las evaluaciones
                    </p>
                </div>

                {selectedEvaluatorIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {selectedEvaluatorIds.map((uid) => {
                            const u = allEvaluators.find((x) => x.id === uid);
                            if (!u) return null;
                            return (
                                <PersonTag
                                    key={uid}
                                    label={fmtUser(u)}
                                    variant="secondary"
                                    onRemove={() => onEvaluatorsChange(selectedEvaluatorIds.filter((x) => x !== uid))}
                                />
                            );
                        })}
                    </div>
                )}

                <div className="relative mt-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                        <IconSearch />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar y agregar evaluador..."
                        value={evaluatorSearch}
                        onChange={(e) => setEvaluatorSearch(e.target.value)}
                        className="input input-bordered input-sm w-full pl-9"
                    />
                </div>

                {evaluatorSearch && (
                    <div className="border border-base-200 rounded-xl overflow-hidden shadow-sm mt-2">
                        {filteredEvaluators.length === 0 ? (
                            <p className="p-4 text-sm text-center text-base-content/40">Sin resultados</p>
                        ) : (
                            filteredEvaluators.slice(0, 8).map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => { onEvaluatorsChange([...selectedEvaluatorIds, u.id]); setEvaluatorSearch(''); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/5 transition-colors border-b border-base-100 last:border-0"
                                >
                                    <div className="w-7 h-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                                        <IconUser />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm">{fmtUser(u)}</p>
                                        <p className="text-xs text-base-content/40">{u.email}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {selectedEvaluatorIds.length === 0 && !evaluatorSearch && (
                    <p className="text-sm text-base-content/40 italic mt-3">
                        Ningún evaluador asignado.
                    </p>
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CompetencyEvalDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { openAlert } = useUIStore();

    const { getCompetencyEvaluationDetail, updateCompetencyEvaluation } = useCompetencyEvaluationService();
    const { getCompetencies }  = useCompetencyService();
    const { getCategories }    = useCategoryService();
    const { getUsers }         = useUserService();
    const { getPeople }        = usePersonService();

    // ── Data ──────────────────────────────────────────────────────────────────
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [isDirty, setIsDirty]   = useState(false);
    const [evaluation, setEvaluation] = useState<CompetencyEvaluationDetail | null>(null);

    const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
    const [allCategories, setAllCategories]     = useState<Category[]>([]);
    const [allPersons, setAllPersons]           = useState<Array<{ id: string; nombres: string; apellidos: string }>>([]);
    const [allEvaluators, setAllEvaluators]     = useState<Array<{ id: string; email: string; persona?: { nombres: string; apellidos: string } }>>([]);

    // ── UI ────────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<ActiveTab>('general');

    // ── Form ──────────────────────────────────────────────────────────────────
    const [formData, setFormData] = useState({
        nombre:                 '',
        descripcion:            '',
        estado:                 'BORRADOR' as CompetencyEvaluationStatus,
        competencias_asignadas: [] as string[],
        weights:                {} as WeightMap,
        personas_a_evaluar:     [] as string[],
        evaluadores_asignados:  [] as string[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            if (!id) { navigate(ROUTES.COMPETENCIES_EVAL); return; }
            setLoading(true);
            try {
                const [evalRes, compRes, catRes, usersRes, personsRes] = await Promise.all([
                    getCompetencyEvaluationDetail(id),
                    getCompetencies({ items_por_pagina: 200 }),   // fetch all
                    getCategories(),
                    getUsers(),
                    getPeople({ items_por_pagina: 500 }),  // fetch all
                ]);

                if (evalRes?.success) {
                    const ev = evalRes.data.evaluacion as CompetencyEvaluationDetail & { weights?: WeightMap };
                    setEvaluation(ev);
                    setFormData({
                        nombre:                 ev.nombre,
                        descripcion:            ev.descripcion || '',
                        estado:                 ev.estado,
                        competencias_asignadas: ev.competencias_asignadas || [],
                        weights:                ev.weights ?? {},
                        personas_a_evaluar:     ev.personas_a_evaluar || [],
                        evaluadores_asignados:  ev.evaluadores_asignados || [],
                    });
                }
                if (compRes?.success)    setAllCompetencies(compRes.data.competencias  || []);
                if (catRes?.success)     setAllCategories(catRes.data.categorias        || []);
                if (usersRes?.success)   setAllEvaluators(
                    (usersRes.data.usuarios || []).filter((u: any) => u.roles?.includes('EVALUATOR'))
                );
                if (personsRes?.success) setAllPersons(personsRes.data.personas         || []);
            } catch {
                openAlert('Error al cargar los datos', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleChange = useCallback((field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
        setIsDirty(true);
    }, []);

    const handleToggleCompetency = useCallback((compId: string) => {
        setFormData((prev) => {
            const isSelected = prev.competencias_asignadas.includes(compId);
            const newIds     = isSelected
                ? prev.competencias_asignadas.filter((c) => c !== compId)
                : [...prev.competencias_asignadas, compId];
            const newWeights = { ...prev.weights };
            if (isSelected) delete newWeights[compId];
            else newWeights[compId] = 0;
            return { ...prev, competencias_asignadas: newIds, weights: newWeights };
        });
        setIsDirty(true);
    }, []);

    const handleWeightChange = useCallback((compId: string, w: number) => {
        setFormData((prev) => ({ ...prev, weights: { ...prev.weights, [compId]: w } }));
        setIsDirty(true);
    }, []);

    const handleClearCompetencies = () => {
        setFormData((prev) => ({ ...prev, competencias_asignadas: [], weights: {} }));
        setIsDirty(true);
    };

    const totalWeight = formData.competencias_asignadas.reduce(
        (s, id) => s + (formData.weights[id] ?? 0), 0
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nombre.trim())             newErrors.nombre      = 'El nombre es requerido';
        if (formData.nombre.length > 255)        newErrors.nombre      = 'Máximo 255 caracteres';
        if (formData.descripcion.length > 1000)  newErrors.descripcion = 'Máximo 1000 caracteres';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setActiveTab('general');
            return false;
        }
        if (formData.competencias_asignadas.length > 0 && totalWeight !== 100) {
            openAlert('Los pesos de las competencias deben sumar exactamente 100%.', 'error');
            setActiveTab('competencias');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate() || !id) return;
        setSaving(true);
        try {
            const res = await updateCompetencyEvaluation(id, {
                nombre:                 formData.nombre,
                descripcion:            formData.descripcion,
                estado:                 formData.estado,
                competencias_asignadas: formData.competencias_asignadas,
                personas_a_evaluar:     formData.personas_a_evaluar,
                evaluadores_asignados:  formData.evaluadores_asignados,
                total_competencias:     formData.competencias_asignadas.length,
                // @ts-ignore extended field
                weights:                formData.weights,
            });
            if (res?.success) {
                openAlert('Proceso actualizado correctamente', 'success');
                setIsDirty(false);
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Breadcrumbs ───────────────────────────────────────────────────────────
    const breadcrumbs = [
        { label: 'Inicio',                     to: ROUTES.HOME              },
        { label: 'RRHH',                       to: undefined                },
        { label: 'Evaluación de Competencias', to: ROUTES.COMPETENCIES_EVAL },
        { label: evaluation?.nombre || '…',    to: undefined                },
    ];

    // ── Guards ────────────────────────────────────────────────────────────────
    if (loading) return <LoadingIndicator />;

    if (!evaluation) return (
        <PageContainer title="No encontrado" breadcrumbs={breadcrumbs}>
            <div className="alert alert-error max-w-md">
                <span>No se encontró la evaluación</span>
                <button className="btn btn-sm" onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)}>Volver</button>
            </div>
        </PageContainer>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <PageContainer
            title={formData.nombre || evaluation.nombre}
            subtitle="Edita el proceso de evaluación de competencias"
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[formData.estado]} badge-outline font-medium`}>
                        {STATUS_OPTIONS.find((o) => o.value === formData.estado)?.label}
                    </span>
                    {isDirty && (
                        <span className="badge badge-warning badge-sm gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning-content inline-block" />
                            Sin guardar
                        </span>
                    )}
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                    >
                        {saving
                            ? <><span className="loading loading-spinner loading-xs" /> Guardando...</>
                            : 'Guardar cambios'}
                    </button>
                </div>
            }
        >
            {/* Tabs */}
            <TabHeader
                active={activeTab}
                onChange={setActiveTab}
                competencyCount={formData.competencias_asignadas.length}
                personCount={formData.personas_a_evaluar.length}
                totalWeight={totalWeight}
            />

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                >
                    {activeTab === 'general' && (
                        <FormSection
                            title="Información del proceso"
                            description="Configura los datos básicos y el estado de esta evaluación"
                        >
                            <div className="space-y-4 max-w-2xl">
                                <InputField
                                    label="Nombre del proceso"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={(e) => handleChange('nombre', e.target.value)}
                                    placeholder="Ej: Evaluación de Competencias – Líderes 2025"
                                    required
                                    error={errors.nombre}
                                    maxLength={255}
                                />
                                <TextAreaField
                                    label="Descripción"
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={(e) => handleChange('descripcion', e.target.value)}
                                    placeholder="Descripción detallada del proceso evaluativo..."
                                    rows={4}
                                    maxLength={1000}
                                    error={errors.descripcion}
                                    helpText={`${formData.descripcion.length}/1000`}
                                />
                                <div className="max-w-xs">
                                    <SelectField
                                        label="Estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={(e) => handleChange('estado', e.target.value as CompetencyEvaluationStatus)}
                                        options={STATUS_OPTIONS}
                                    />
                                </div>
                            </div>
                        </FormSection>
                    )}

                    {activeTab === 'competencias' && (
                        <CompetenciesTab
                            allCompetencies={allCompetencies}
                            allCategories={allCategories}
                            selectedIds={formData.competencias_asignadas}
                            weights={formData.weights}
                            onToggle={handleToggleCompetency}
                            onWeightChange={handleWeightChange}
                            onClearAll={handleClearCompetencies}
                        />
                    )}

                    {activeTab === 'participantes' && (
                        <ParticipantsTab
                            allPersons={allPersons}
                            allEvaluators={allEvaluators}
                            selectedPersonIds={formData.personas_a_evaluar}
                            selectedEvaluatorIds={formData.evaluadores_asignados}
                            onPersonsChange={(ids) => handleChange('personas_a_evaluar', ids)}
                            onEvaluatorsChange={(ids) => handleChange('evaluadores_asignados', ids)}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </PageContainer>
    );
};

export default CompetencyEvalDetailPage;