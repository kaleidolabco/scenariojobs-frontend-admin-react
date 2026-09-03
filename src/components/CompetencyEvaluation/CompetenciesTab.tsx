import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../../services/categoryService';
import { useCategoryService } from '../../services/categoryService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import {
    Search,
    X,
    AlertTriangle,
    Tag as IconTagIcon,
    ChevronUp,
    ChevronDown,
} from '../Common/Icon';
import Button from '../Common/Button';
import GenericModal from '../Common/GenericModal';
import NumberInputField from '../Common/Forms/NumberInputField';
import WeightBar from './WeightBar';
import { OrigenCompetencias, SugerenciaCompetencias } from './types';
import { CompetencyAssignmentItem } from '../../hooks/useCompetencyEvaluationDetail';

const CATALOG_PAGE_LIMIT = 100;

interface CompetenciesTabProps {
    selectedIds: string[];
    competencyItems: CompetencyAssignmentItem[];
    origen: OrigenCompetencias;
    onOrigenChange: (o: OrigenCompetencias) => void;
    sugerencia: SugerenciaCompetencias | null;
    derivedDirty: boolean;
    onAplicar: (mode: 'reemplazar' | 'fusionar') => void;
    onToggle: (id: string, nombre?: string, descripcion?: string, escala?: number, categoria?: { id: string; nombre: string } | string, seccion?: string) => void;
    onWeightChange: (id: string, w: number) => void;
    onUpdateItems: (items: CompetencyAssignmentItem[]) => void;
    onClearAll: () => void;
    dirty: boolean;
    saving: boolean;
    onSave: () => void;
}

const CompetenciesTab: React.FC<CompetenciesTabProps> = ({
    selectedIds,
    competencyItems,
    origen,
    onOrigenChange,
    sugerencia,
    derivedDirty,
    onAplicar,
    onToggle,
    onWeightChange,
    onUpdateItems,
    onClearAll,
    dirty,
    saving,
    onSave,
}) => {
    const { getCompetencies } = useCompetencyService();
    const { getCategories } = useCategoryService();
    const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);

    // Carga catálogo completo de competencias y categorías.
    // Se usa para: (1) barra de búsqueda "agregar por nombre", (2) mostrar
    // categorías disponibles, (3) resolver nombres/descripciones de competencias
    // ya asignadas (competencyItems solo trae IDs del backend).
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setCatalogLoading(true);
            try {
                const catRes = await getCategories();
                if (!cancelled && catRes?.success) {
                    setAllCategories(catRes.data.categorias || []);
                }
                const items: Competency[] = [];
                let page = 1;
                for (;;) {
                    const res = await getCompetencies({ pagina: page, items_por_pagina: CATALOG_PAGE_LIMIT });
                    if (!res?.success) break;
                    const comps = res.data.competencias || [];
                    items.push(...comps);
                    const total = res.data.paginacion?.total ?? items.length;
                    if (items.length >= total || comps.length === 0) break;
                    page += 1;
                }
                if (!cancelled) setAllCompetencies(items);
            } finally {
                if (!cancelled) setCatalogLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [getCompetencies, getCategories]);

    const [search, setSearch] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);

    const totalWeight = useMemo(
        () => competencyItems.reduce((s, i) => s + i.peso_ponderacion, 0),
        [competencyItems],
    );
    const weightOk = Math.round(totalWeight * 100) / 100 === 100;

    const q = search.trim().toLowerCase();
    const searching = q.length > 0;

    const matchedCompetencies = searching
        ? allCompetencies.filter(
            (c) => !selectedIds.includes(c.id) &&
            (c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q))
        )
        : [];

    const sections = useMemo(() => {
        const map = new Map<string, CompetencyAssignmentItem[]>();
        competencyItems.forEach((item) => {
            const sec = item.seccion || 'General';
            if (!map.has(sec)) map.set(sec, []);
            map.get(sec)!.push(item);
        });
        return Array.from(map.entries()).sort((a, b) => {
            const minA = Math.min(...a[1].map((i) => i.orden));
            const minB = Math.min(...b[1].map((i) => i.orden));
            return minA - minB;
        });
    }, [competencyItems]);

    const handleMoveSection = (fromIdx: number, direction: -1 | 1) => {
        const toIdx = fromIdx + direction;
        if (toIdx < 0 || toIdx >= sections.length) return;
        const newSections = [...sections];
        [newSections[fromIdx], newSections[toIdx]] = [newSections[toIdx], newSections[fromIdx]];
        let orden = 0;
        const items: CompetencyAssignmentItem[] = [];
        newSections.forEach(([, comps]) => {
            comps.forEach((c) => {
                items.push({ ...c, orden });
                orden++;
            });
        });
        onUpdateItems(items);
    };

    const handleMoveItem = (sectionName: string, fromIdx: number, direction: -1 | 1) => {
        const toIdx = fromIdx + direction;
        const sectionItems = competencyItems.filter((i) => i.seccion === sectionName);
        if (toIdx < 0 || toIdx >= sectionItems.length) return;

        const newSectionItems = [...sectionItems];
        [newSectionItems[fromIdx], newSectionItems[toIdx]] = [newSectionItems[toIdx], newSectionItems[fromIdx]];

        let orden = 0;
        const allItems: CompetencyAssignmentItem[] = [];
        sections.forEach(([name]) => {
            const updated = name === sectionName ? newSectionItems : competencyItems.filter((i) => i.seccion === name);
            updated.forEach((c) => {
                allItems.push({ ...c, orden });
                orden++;
            });
        });
        onUpdateItems(allItems);
    };

    const distributeEvenly = () => {
        if (competencyItems.length === 0) return;
        const base = Math.floor(100 / competencyItems.length);
        const extra = 100 - base * competencyItems.length;
        const updated = competencyItems.map((item, i) => ({
            ...item,
            peso_ponderacion: base + (i === 0 ? extra : 0),
        }));
        onUpdateItems(updated);
    };

    const handleAplicarClick = () => {
        if (!sugerencia) return;
        if (selectedIds.length === 0) {
            onAplicar('reemplazar');
            return;
        }
        setConfirmOpen(true);
    };

    return (
        <div className="space-y-4">
            {catalogLoading && allCompetencies.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <span className="loading loading-spinner loading-lg" />
                </div>
            ) : (
                <>
                    {/* Origen */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wide whitespace-nowrap">
                                Origen
                            </span>
                            <div className="join">
                                <button type="button" className={`join-item btn btn-sm ${origen === 'manual' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onOrigenChange('manual')}>
                                    Selección manual
                                </button>
                                <button type="button" className={`join-item btn btn-sm ${origen === 'desde_cargos' ? 'btn-primary' : 'btn-outline'}`} onClick={() => onOrigenChange('desde_cargos')}>
                                    Desde cargos de participantes
                                </button>
                            </div>
                        </div>

                        {origen === 'desde_cargos' && (
                            <div className={`border rounded-xl p-4 space-y-3 ${derivedDirty ? 'border-warning bg-warning/5' : 'border-base-200 bg-base-50'}`}>
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-base-content text-sm flex items-center gap-2 flex-wrap">
                                            Competencias desde cargos
                                            {derivedDirty && (
                                                <span className="badge badge-warning badge-sm gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-warning-content inline-block" />
                                                    Los participantes cambiaron
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-base-content/50 mt-1">
                                            {sugerencia && sugerencia.ids.length > 0
                                                ? `${sugerencia.ids.length} competencia(s) derivada(s) de ${sugerencia.nCargos} cargo(s) · ${sugerencia.nPersonas} persona(s)`
                                                : 'Selecciona participantes para derivar automáticamente las competencias de sus cargos.'}
                                        </p>
                                    </div>
                                    <Button variant="primary" size="sm" onClick={handleAplicarClick} disabled={!sugerencia || sugerencia.ids.length === 0}>
                                        {derivedDirty ? 'Aplicar y actualizar' : 'Aplicar sugerencias'}
                                    </Button>
                                </div>
                                {sugerencia && sugerencia.avisos.length > 0 && (
                                    <div className="space-y-1.5">
                                        {sugerencia.avisos.map((aviso, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-base-content/60">
                                                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" />
                                                <span>{aviso.mensaje}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search bar + dropdown */}
                    <div className="relative">
                        <div className="flex items-center gap-2 border border-base-200 rounded-lg bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Buscar competencia para agregar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 outline-none bg-transparent text-sm"
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch('')} className="p-1 rounded-md hover:bg-base-100 text-base-content/40">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {searching && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-base-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                {matchedCompetencies.length > 0 ? (
                                    <>
                                        <div className="px-3 py-1.5 bg-base-50 border-b border-base-100">
                                            <p className="text-[10px] text-base-content/40">{matchedCompetencies.length} resultado(s)</p>
                                        </div>
                                        {matchedCompetencies.slice(0, 15).map((comp) => {
                                            const cat = allCategories.find((c) => c.slug === comp.categoria);
                                            return (
                                                <button
                                                    key={comp.id}
                                                    type="button"
                                                    onClick={() => {
                                                        onToggle(comp.id, comp.nombre, comp.descripcion, comp.escala, comp.categoria as any, cat?.nombre);
                                                        setSearch('');
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-primary/5 border-b border-base-100 last:border-b-0 transition-colors flex items-center justify-between gap-3"
                                                >
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                            {comp.nombre[0]?.toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-xs text-base-content truncate">{comp.nombre}</p>
                                                            {comp.descripcion && <p className="text-[10px] text-base-content/40 truncate">{comp.descripcion}</p>}
                                                        </div>
                                                    </div>
                                                    {cat && <span className={`badge badge-xs badge-${cat.color} shrink-0`}>{cat.nombre}</span>}
                                                </button>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="px-4 py-3 text-center text-xs text-base-content/40">
                                        No se encontraron competencias
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Weight controls */}
                    {competencyItems.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <div className="flex-1 w-full"><WeightBar total={totalWeight} /></div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="ghost" size="sm" onClick={distributeEvenly}>Distribuir uniformemente</Button>
                                <Button variant="ghost" size="sm" className="text-error" onClick={onClearAll}>Limpiar selección</Button>
                            </div>
                        </div>
                    )}

                    {competencyItems.length > 0 && !weightOk && (
                        <div className={`alert py-2.5 ${totalWeight > 100 ? 'alert-error' : 'alert-warning'}`}>
                            <AlertTriangle size={16} />
                            <span className="text-sm">
                                {totalWeight > 100 ? `Los pesos exceden 100% en ${totalWeight - 100}%.` : `Faltan ${100 - totalWeight}% por asignar.`}
                            </span>
                        </div>
                    )}

                    {/* Sections */}
                    {sections.length === 0 && !searching ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-2 border-dashed border-base-300 rounded-xl py-14 flex flex-col items-center justify-center gap-4 text-center"
                        >
                            <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-base-content/30">
                                <IconTagIcon size={16} />
                            </div>
                            <div>
                                <p className="font-semibold text-base-content/60 text-sm">Sin competencias asignadas</p>
                                <p className="text-xs text-base-content/40 mt-1 max-w-xs">
                                    Busca competencias arriba o cambia a "Desde cargos" para sugerencias automáticas.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {sections.map(([sectionName, items], sIdx) => (
                                <SectionBlock
                                    key={sectionName}
                                    name={sectionName}
                                    items={items}
                                    allCompetencies={allCompetencies}
                                    sugerencia={sugerencia}
                                    canMoveUp={sIdx > 0}
                                    canMoveDown={sIdx < sections.length - 1}
                                    onMoveUp={() => handleMoveSection(sIdx, -1)}
                                    onMoveDown={() => handleMoveSection(sIdx, 1)}
                                    onToggle={onToggle}
                                    onWeightChange={onWeightChange}
                                    onMoveItem={(fromIdx, dir) => handleMoveItem(sectionName, fromIdx, dir)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Confirm modal */}
                    <GenericModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Aplicar sugerencias de cargos" size="sm">
                        <p className="text-sm text-base-content/70">
                            Ya tienes <strong>{selectedIds.length}</strong> competencia(s) seleccionada(s).
                            ¿Cómo deseas aplicar las <strong>{sugerencia?.ids.length ?? 0}</strong> sugeridas?
                        </p>
                        <div className="flex flex-wrap justify-end gap-2 mt-5">
                            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                            <Button variant="outline" size="sm" onClick={() => { setConfirmOpen(false); onAplicar('fusionar'); }}>Fusionar</Button>
                            <Button variant="primary" size="sm" onClick={() => { setConfirmOpen(false); onAplicar('reemplazar'); }}>Reemplazar</Button>
                        </div>
                    </GenericModal>

                    {/* Save */}
                    <div className="flex items-center justify-between gap-3 border-t border-base-200 pt-4">
                        <span className={`text-xs ${dirty ? 'text-warning' : 'text-base-content/40'}`}>
                            {dirty ? 'Hay cambios sin guardar' : 'Sin cambios pendientes'}
                        </span>
                        <Button variant="primary" size="sm" onClick={onSave} disabled={!dirty || saving} loading={saving}>
                            Guardar cambios
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Section Block ──────────────────────────────────────────────────────────

interface SectionBlockProps {
    name: string;
    items: CompetencyAssignmentItem[];
    allCompetencies: Competency[];
    sugerencia: SugerenciaCompetencias | null;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onToggle: CompetenciesTabProps['onToggle'];
    onWeightChange: CompetenciesTabProps['onWeightChange'];
    onMoveItem: (fromIdx: number, direction: -1 | 1) => void;
}

const SectionBlock: React.FC<SectionBlockProps> = ({
    name,
    items,
    allCompetencies,
    sugerencia,
    canMoveUp,
    canMoveDown,
    onMoveUp,
    onMoveDown,
    onToggle,
    onWeightChange,
    onMoveItem,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const sectionWeight = items.reduce((s, i) => s + i.peso_ponderacion, 0);
    const resolveComp = (compId: string) => allCompetencies.find((c) => c.id === compId);

    return (
        <div className="border border-base-200 rounded-xl overflow-hidden">
            {/* Section header — styled like a table header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary text-secondary-content">
                <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer select-none"
                >
                    <svg className={`w-3.5 h-3.5 transition-transform shrink-0 ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="font-semibold text-sm">{name}</span>
                    <span className="text-xs opacity-60">{items.length} competencia(s)</span>
                                            <span className={`text-xs font-bold ${Math.round(sectionWeight * 100) / 100 === 100 ? 'text-success-content' : 'opacity-70'}`}>
                        {sectionWeight}%
                    </span>
                </button>
                <div className="flex items-center gap-0.5 shrink-0">
                    <button type="button" onClick={onMoveUp} disabled={!canMoveUp}
                        className="p-1 rounded hover:bg-secondary-content/10 disabled:opacity-20 transition-colors" title="Mover sección arriba">
                        <ChevronUp size={14} />
                    </button>
                    <button type="button" onClick={onMoveDown} disabled={!canMoveDown}
                        className="p-1 rounded hover:bg-secondary-content/10 disabled:opacity-20 transition-colors" title="Mover sección abajo">
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="divide-y divide-base-100">
                            {items.map((item, idx) => {
                                const comp = resolveComp(item.competencia_id);
                                const expected = sugerencia?.expectedLevels?.[item.competencia_id];
                                return (
                                    <div key={item.competencia_id} className="flex items-start gap-2 px-4 py-3 bg-white hover:bg-base-50 transition-colors group">
                                        {/* Move controls */}
                                        <div className="flex flex-col items-center gap-0 shrink-0 mt-0.5">
                                            <button type="button" onClick={() => onMoveItem(idx, -1)} disabled={idx === 0}
                                                className="p-0.5 rounded text-base-content/20 hover:text-base-content/60 hover:bg-base-200 disabled:opacity-0 transition-colors">
                                                <ChevronUp size={12} />
                                            </button>
                                            <span className="text-[10px] text-base-content/20 font-mono tabular-nums leading-none">{idx + 1}</span>
                                            <button type="button" onClick={() => onMoveItem(idx, 1)} disabled={idx === items.length - 1}
                                                className="p-0.5 rounded text-base-content/20 hover:text-base-content/60 hover:bg-base-200 disabled:opacity-0 transition-colors">
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-base-content leading-tight">
                                                {comp?.nombre ?? item.nombre ?? item.competencia_id}
                                                {expected != null && (
                                                    <span className="badge badge-sm badge-outline badge-secondary gap-1 font-medium ml-2">
                                                        <span className="text-[10px] uppercase opacity-70">Esperado</span>
                                                        {expected}/{comp?.escala ?? 5}
                                                    </span>
                                                )}
                                            </p>
                                            {(comp?.descripcion || item.descripcion) && (
                                                <p className="text-xs text-base-content/40 mt-0.5 line-clamp-1">{comp?.descripcion ?? item.descripcion}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <NumberInputField
                                                label=""
                                                min={0}
                                                max={100}
                                                step={0.01}
                                                value={item.peso_ponderacion}
                                                onChange={(val) => {
                                                    const clamped = Math.min(100, Math.max(0, isNaN(val) ? 0 : Math.round(val * 100) / 100));
                                                    onWeightChange(item.competencia_id, clamped);
                                                }}
                                                className="input-xs w-16 text-xs"
                                            />
                                            <span className="text-[10px] text-base-content/50 font-semibold -ml-1">%</span>
                                            <button
                                                type="button"
                                                onClick={() => onToggle(item.competencia_id)}
                                                className="p-1 rounded-md text-base-content/30 hover:text-error hover:bg-error/10 transition-colors"
                                                title="Quitar competencia"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
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

export default CompetenciesTab;
