import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
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
import EmailConfigTab from '../../components/Common/EmailConfigTab';
import Button from '../../components/Common/Button';
import {
    ChevronDown,
    Check as IconCheckIcon,
    Search,
    X,
    AlertTriangle,
    Plus,
    Tag as IconTagIcon,
} from '../../components/Common/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'general' | 'competencias' | 'participantes' | 'correos';
type WeightMap = Record<string, number>;
type EvaluadoresPorPersona = Record<string, string[]>; // personId → evaluatorIds[]

interface PersonRow {
    id: string;
    nombres: string;
    apellidos: string;
    unidad_organizacional?: string;
    cargo?: string;
    email?: string;
}

type EvaluatorUser = { id: string; email: string; persona?: { nombres: string; apellidos: string } };

// ─── Participant helpers ──────────────────────────────────────────────────────

const fmtPerson   = (p: { nombres: string; apellidos: string }) => `${p.nombres} ${p.apellidos}`;
const fmtEval     = (u: EvaluatorUser) => u.persona ? fmtPerson(u.persona) : u.email;
const getInitials = (p: PersonRow) =>
    `${p.nombres?.[0] ?? ''}${p.apellidos?.[0] ?? ''}`.toUpperCase();

// ─── Icons ────────────────────────────────────────────────────────────────────
// Todos unificados a lucide. La rotación del chevron se aplica vía className en el sitio de uso.

const ChevronToggle = ({ open }: { open: boolean }) => (
    <ChevronDown
        size={16}
        className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    />
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
        {
            id: 'correos',
            label: 'Correos',
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
    onRemoveCategory: (slug: string) => void;
    searchTerm: string;
}> = ({ category, competencies, selectedIds, weights, onToggle, onWeightChange, onRemoveCategory, searchTerm }) => {
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!searchTerm) return competencies;
        const q = searchTerm.toLowerCase();
        return competencies.filter(
            (c) => c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
        );
    }, [competencies, searchTerm]);

    const selectedInGroup   = filtered.filter((c) => selectedIds.includes(c.id)).length;
    const allSelectedInGroup = filtered.length > 0 && selectedInGroup === filtered.length;

    const handleSelectAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (allSelectedInGroup) {
            filtered.forEach((c) => { if (selectedIds.includes(c.id)) onToggle(c.id); });
        } else {
            filtered.filter((c) => !selectedIds.includes(c.id)).forEach((c) => onToggle(c.id));
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="border border-base-200 rounded-xl overflow-hidden"
        >
            {/* Group header — div to avoid nested <button> hydration error */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={(e) => e.key === 'Enter' && setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 bg-base-50 hover:bg-base-100 transition-colors gap-2 cursor-pointer select-none"
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
                            onClick={(e) => { e.stopPropagation(); handleSelectAll(e); }}
                            className={`px-2.5 py-1.5 text-xs sm:text-sm rounded-md font-medium transition-colors ${
                                allSelectedInGroup
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'bg-base-200 text-base-content hover:bg-base-300'
                            }`}
                        >
                            {allSelectedInGroup ? 'Deseleccionar todas' : 'Seleccionar todas'}
                        </button>
                    )}

                    {/* Remove category button */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveCategory(category.slug); }}
                        className="p-1.5 rounded-md text-base-content/30 hover:text-error hover:bg-error/10 transition-colors"
                        title="Quitar categoría"
                    >
                        <X size={14} />
                    </button>

                    <ChevronToggle open={open} />
                </div>
            </div>

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
                        {filtered.length === 0 ? (
                            <div className="px-5 py-6 text-center text-sm text-base-content/40">
                                Sin coincidencias para "{searchTerm}"
                            </div>
                        ) : (
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
                                            {/* Checkbox */}
                                            <button
                                                type="button"
                                                onClick={() => onToggle(comp.id)}
                                                className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                                                    isSelected
                                                        ? 'bg-primary border-primary text-primary-content'
                                                        : 'border-base-300 hover:border-primary bg-base-100'
                                                }`}
                                            >
                                                {isSelected && <IconCheckIcon size={14} />}
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

                                            {/* Weight input */}
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
                                                                    const val = e.target.value === ''
                                                                        ? 0
                                                                        : Math.min(100, Math.max(0, Number(e.target.value)));
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
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Add Category Dropdown ────────────────────────────────────────────────────

const AddCategoryDropdown: React.FC<{
    availableCategories: Category[];
    onAdd: (slug: string) => void;
}> = ({ availableCategories, onAdd }) => {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState('');
    const ref = React.useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = availableCategories.filter((c) =>
        c.nombre.toLowerCase().includes(search.toLowerCase())
    );

    if (availableCategories.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="btn btn-outline btn-sm gap-2"
            >
                <Plus size={16} />
                Agregar categoría
                <ChevronToggle open={open} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-30 w-72 bg-base-100 border border-base-200 rounded-xl shadow-lg overflow-hidden"
                    >
                        {/* Search inside dropdown */}
                        <div className="p-2 border-b border-base-200">
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                                    <Search size={16} />
                                </span>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Buscar categoría..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input input-bordered input-xs w-full pl-8"
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <p className="text-center text-sm text-base-content/40 py-6">
                                    Sin resultados
                                </p>
                            ) : (
                                filtered.map((cat) => (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        onClick={() => { onAdd(cat.slug); setOpen(false); setSearch(''); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 transition-colors text-left border-b border-base-100 last:border-0"
                                    >
                                        <span className={`badge badge-${cat.color} badge-sm font-semibold shrink-0`}>
                                            {cat.nombre}
                                        </span>
                                    </button>
                                ))
                            )}
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
    const [search, setSearch]           = useState('');
    // Only categories the user has explicitly added
    const [activeSlugs, setActiveSlugs] = useState<string[]>(() => {
        // On load, pre-populate with slugs that already have selected competencies
        if (selectedIds.length === 0) return [];
        const slugsWithSelected = new Set(
            allCompetencies
                .filter((c) => selectedIds.includes(c.id))
                .map((c) => c.categoria)
        );
        return allCategories
            .filter((cat) => slugsWithSelected.has(cat.slug))
            .map((cat) => cat.slug);
    });

    const totalWeight = selectedIds.reduce((s, id) => s + (weights[id] ?? 0), 0);
    const weightOk    = totalWeight === 100;

    // Categories still available to add
    const availableToAdd = allCategories.filter((c) => !activeSlugs.includes(c.slug));

    // Active category objects in insertion order
    const activeCategories = activeSlugs
        .map((slug) => allCategories.find((c) => c.slug === slug))
        .filter((c): c is Category => Boolean(c));

    const handleAddCategory = (slug: string) => {
        setActiveSlugs((prev) => [...prev, slug]);
    };

    const handleRemoveCategory = (slug: string) => {
        // Deselect all competencies that belong to this category
        const compsInCat = allCompetencies
            .filter((c) => c.categoria === slug && selectedIds.includes(c.id))
            .map((c) => c.id);
        compsInCat.forEach((id) => onToggle(id));
        setActiveSlugs((prev) => prev.filter((s) => s !== slug));
    };

    const distributeEvenly = () => {
        if (selectedIds.length === 0) return;
        const base  = Math.floor(100 / selectedIds.length);
        const extra = 100 - base * selectedIds.length;
        selectedIds.forEach((id, i) => onWeightChange(id, base + (i === 0 ? extra : 0)));
    };

    const handleClearAll = () => {
        onClearAll();
        setActiveSlugs([]);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                        <Search size={16} />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar competencia..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-bordered input-sm w-full pl-9"
                        disabled={activeSlugs.length === 0}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <AddCategoryDropdown
                    availableCategories={availableToAdd}
                    onAdd={handleAddCategory}
                />
            </div>

            {/* Weight controls */}
            {selectedIds.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex-1 w-full">
                        <WeightBar total={totalWeight} />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={distributeEvenly}>
                            Distribuir uniformemente
                        </Button>
                        <Button variant="ghost" size="sm" className="text-error" onClick={handleClearAll}>
                            Limpiar selección
                        </Button>
                    </div>
                </div>
            )}

            {/* Weight warning */}
            {selectedIds.length > 0 && !weightOk && (
                <div className={`alert py-2.5 ${totalWeight > 100 ? 'alert-error' : 'alert-warning'}`}>
                    <AlertTriangle size={16} />
                    <span className="text-sm">
                        {totalWeight > 100
                            ? `Los pesos exceden 100% en ${totalWeight - 100}%. Ajusta los valores.`
                            : `Faltan ${100 - totalWeight}% por asignar. Los pesos deben sumar 100%.`}
                    </span>
                </div>
            )}

            {/* Empty state — no categories added yet */}
            {activeSlugs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-2 border-dashed border-base-300 rounded-xl py-14 flex flex-col items-center justify-center gap-4 text-center"
                >
                    <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-base-content/30">
                        <IconTagIcon size={16} />
                    </div>
                    <div>
                        <p className="font-semibold text-base-content/60 text-sm">Sin categorías agregadas</p>
                        <p className="text-xs text-base-content/40 mt-1 max-w-xs">
                            Usa el botón <strong>Agregar categoría</strong> para elegir qué grupos de competencias incluir en esta evaluación.
                        </p>
                    </div>
                    {availableToAdd.length > 0 && (
                        <AddCategoryDropdown
                            availableCategories={availableToAdd}
                            onAdd={handleAddCategory}
                        />
                    )}
                </motion.div>
            )}

            {/* Category groups */}
            <AnimatePresence>
                {activeCategories.map((cat) => (
                    <CategoryGroup
                        key={cat.slug}
                        category={cat}
                        competencies={allCompetencies.filter((c) => c.categoria === cat.slug)}
                        selectedIds={selectedIds}
                        weights={weights}
                        onToggle={onToggle}
                        onWeightChange={onWeightChange}
                        onRemoveCategory={handleRemoveCategory}
                        searchTerm={search}
                    />
                ))}
            </AnimatePresence>

            {/* All categories added */}
            {activeSlugs.length > 0 && availableToAdd.length === 0 && (
                <p className="text-xs text-center text-base-content/40 pt-2">
                    Todas las categorías han sido agregadas.
                </p>
            )}
        </div>
    );
};

// ─── Evaluator Picker (inline search panel) ───────────────────────────────────

const EvaluatorPicker: React.FC<{
    allEvaluators: EvaluatorUser[];
    assignedIds: string[];
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
    label?: string;
}> = ({ allEvaluators, assignedIds, onAdd, onRemove, onClose, label }) => {
    const [search, setSearch] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const available = allEvaluators.filter(
        (u) => !assignedIds.includes(u.id) &&
            fmtEval(u).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="border border-primary/30 rounded-lg bg-base-100 p-3 space-y-2 shadow-sm">
            {label && (
                <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">{label}</p>
            )}

            {/* Already assigned chips */}
            {assignedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {assignedIds.map((uid) => {
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
                                    onClick={() => onRemove(uid)}
                                    className="w-3.5 h-3.5 rounded-full hover:bg-secondary/20 flex items-center justify-center"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                    <Search size={16} />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar evaluador..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-bordered input-xs w-full pl-8"
                />
            </div>

            {/* Results */}
            {search && (
                <div className="max-h-36 overflow-y-auto divide-y divide-base-200 border border-base-200 rounded-lg">
                    {available.length === 0 ? (
                        <p className="text-xs text-center text-base-content/40 py-3">Sin resultados</p>
                    ) : (
                        available.slice(0, 6).map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => { onAdd(u.id); setSearch(''); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/5 transition-colors text-left"
                            >
                                <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 text-xs font-bold">
                                    {(u.persona?.nombres?.[0] ?? u.email[0]).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-medium">{fmtEval(u)}</p>
                                    <p className="text-[10px] text-base-content/40">{u.email}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}

            <div className="flex justify-end">
                <Button variant="ghost" size="xs" onClick={onClose}>
                    Cerrar
                </Button>
            </div>
        </div>
    );
};

// ─── Participants Tab ─────────────────────────────────────────────────────────

const ParticipantsTab: React.FC<{
    allPersons: PersonRow[];
    allEvaluators: EvaluatorUser[];
    selectedPersonIds: string[];
    evaluadoresPorPersona: EvaluadoresPorPersona;
    onPersonsChange: (ids: string[]) => void;
    onEvaluadoresPorPersonaChange: (map: EvaluadoresPorPersona) => void;
}> = ({
    allPersons,
    allEvaluators,
    selectedPersonIds,
    evaluadoresPorPersona,
    onPersonsChange,
    onEvaluadoresPorPersonaChange,
}) => {
    // Which picker is open: personId | 'global' | null
    const [openPickerFor, setOpenPickerFor] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedPersons = selectedPersonIds
        .map((id) => allPersons.find((p) => p.id === id))
        .filter((p): p is PersonRow => Boolean(p));

    // Filter persons based on search term
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
        // Also clean up per-person evaluators
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
            {/* ── Search bar ── */}
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

                {/* Search results dropdown */}
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

            {/* ── Org chart selector ── */}
            <OrgChartPersonSelector
                selectedPersonIds={selectedPersonIds}
                onPersonsChange={onPersonsChange}
            />

            {/* ── Persons table ── */}
            {selectedPersons.length > 0 && (
                <div className="border border-base-200 rounded-xl overflow-hidden">
                    {/* Table header */}
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
                                    const isPickerOpen  = openPickerFor === person.id;

                                    return (
                                        <React.Fragment key={person.id}>
                                            <tr className={`border-b border-base-100 transition-colors ${isPickerOpen ? 'bg-primary/3' : 'hover:bg-base-50'}`}>
                                                {/* Avatar */}
                                                <td className="pl-4">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                        {getInitials(person)}
                                                    </div>
                                                </td>

                                                {/* Name + cargo */}
                                                <td>
                                                    <p className="font-medium text-sm text-base-content leading-tight">
                                                        {fmtPerson(person)}
                                                    </p>
                                                    {person.cargo && (
                                                        <p className="text-xs text-base-content/50 mt-0.5">{person.cargo}</p>
                                                    )}
                                                </td>

                                                {/* Unidad organizacional */}
                                                <td className="hidden md:table-cell">
                                                    {person.unidad_organizacional ? (
                                                        <span className="badge badge-ghost badge-sm font-normal">
                                                            {person.unidad_organizacional}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-base-content/30">—</span>
                                                    )}
                                                </td>

                                                {/* Evaluators chips + add button */}
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

                                                {/* Remove person */}
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

    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [isDirty, setIsDirty]       = useState(false);
    const [evaluation, setEvaluation] = useState<CompetencyEvaluationDetail | null>(null);

    const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
    const [allCategories, setAllCategories]     = useState<Category[]>([]);
    const [allPersons, setAllPersons]           = useState<PersonRow[]>([]);
    const [allEvaluators, setAllEvaluators]     = useState<EvaluatorUser[]>([]);

    const [activeTab, setActiveTab] = useState<ActiveTab>('general');

    const [formData, setFormData] = useState({
        nombre:                  '',
        descripcion:             '',
        estado:                  'BORRADOR' as CompetencyEvaluationStatus,
        competencias_asignadas:  [] as string[],
        weights:                 {} as WeightMap,
        personas_a_evaluar:      [] as string[],
        evaluadores_por_persona: {} as EvaluadoresPorPersona,
        templates_asociadas:     [] as string[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const load = async () => {
            if (!id) { navigate(ROUTES.COMPETENCIES_EVAL); return; }
            setLoading(true);
            try {
                const [evalRes, compRes, catRes, usersRes, personsRes] = await Promise.all([
                    getCompetencyEvaluationDetail(id),
                    getCompetencies({ items_por_pagina: 200 }),
                    getCategories(),
                    getUsers(),
                    getPeople({ items_por_pagina: 500 }),
                ]);

                if (evalRes?.success) {
                    const ev = evalRes.data.evaluacion as CompetencyEvaluationDetail & { weights?: WeightMap; templates_asociadas?: string[] };
                    setEvaluation(ev);
                    setFormData({
                        nombre:                  ev.nombre,
                        descripcion:             ev.descripcion || '',
                        estado:                  ev.estado,
                        competencias_asignadas:  ev.competencias_asignadas || [],
                        weights:                 ev.weights ?? {},
                        personas_a_evaluar:      ev.personas_a_evaluar || [],
                        evaluadores_por_persona: (ev as any).evaluadores_por_persona ?? {},
                        templates_asociadas:     ev.templates_asociadas ?? [],
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
                total_competencias:     formData.competencias_asignadas.length,
                // @ts-ignore extended fields
                weights:                   formData.weights,
                evaluadores_por_persona:   formData.evaluadores_por_persona,
                templates_asociadas:       formData.templates_asociadas,
            });
            if (res?.success) {
                openAlert('Proceso actualizado correctamente', 'success');
                setIsDirty(false);
            }
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbs = [
        { label: 'Inicio',                     to: ROUTES.HOME              },
        { label: ROLE_LABELS[UserRole.HR_MANAGER], to: undefined                },
        { label: 'Evaluación de Competencias', to: ROUTES.COMPETENCIES_EVAL },
        { label: evaluation?.nombre || '…',    to: undefined                },
    ];

    if (loading) return <LoadingIndicator />;

    if (!evaluation) return (
        <PageContainer title="No encontrado" breadcrumbs={breadcrumbs}>
            <div className="alert alert-error max-w-md">
                <span>No se encontró la evaluación</span>
                <Button size="sm" onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)}>Volver</Button>
            </div>
        </PageContainer>
    );

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
                    <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !isDirty} loading={saving}>
                        Guardar cambios
                    </Button>
                </div>
            }
        >
            <TabHeader
                active={activeTab}
                onChange={setActiveTab}
                competencyCount={formData.competencias_asignadas.length}
                personCount={formData.personas_a_evaluar.length}
                totalWeight={totalWeight}
            />

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
                            evaluadoresPorPersona={formData.evaluadores_por_persona}
                            onPersonsChange={(ids) => handleChange('personas_a_evaluar', ids)}
                            onEvaluadoresPorPersonaChange={(map) => handleChange('evaluadores_por_persona', map)}
                        />
                    )}

                    {activeTab === 'correos' && evaluation && (
                        <EmailConfigTab
                            evaluationId={evaluation.id}
                            evaluationType="competencia"
                            data={{ templates_asociadas: formData.templates_asociadas }}
                            onChange={(data) => handleChange('templates_asociadas', data.templates_asociadas)}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </PageContainer>
    );
};

export default CompetencyEvalDetailPage;