import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../../services/categoryService';
import { Competency } from '../../services/competencyService';
import { Check as IconCheckIcon, X } from '../Common/Icon';
import ChevronToggle from '../Common/ChevronToggle';
import NumberInputField from '../Common/Forms/NumberInputField';

export type WeightMap = Record<string, number>;

interface CategoryGroupProps {
    category: Category;
    competencies: Competency[];
    selectedIds: string[];
    weights: WeightMap;
    expectedLevels?: Record<string, number>;
    onToggle: (id: string) => void;
    onWeightChange: (id: string, w: number) => void;
    onRemoveCategory: (slug: string) => void;
    searchTerm: string;
    autoOpen?: boolean;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
    category,
    competencies,
    selectedIds,
    weights,
    expectedLevels,
    onToggle,
    onWeightChange,
    onRemoveCategory,
    searchTerm,
    autoOpen = false,
}) => {
    const [open, setOpen] = useState(false);
    const expanded = open || autoOpen;

    const filtered = useMemo(() => {
        if (!searchTerm) return competencies;
        const q = searchTerm.toLowerCase();
        return competencies.filter(
            (c) => c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
        );
    }, [competencies, searchTerm]);

    const selectedInGroup = filtered.filter((c) => selectedIds.includes(c.id)).length;
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
            {/* Group header */}
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
                    {expanded && filtered.length > 0 && (
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
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemoveCategory(category.slug); }}
                        className="p-1.5 rounded-md text-base-content/30 hover:text-error hover:bg-error/10 transition-colors"
                        title="Quitar categoría"
                    >
                        <X size={14} />
                    </button>
                    <ChevronToggle open={expanded} />
                </div>
            </div>

            {/* Rows */}
            <AnimatePresence initial={false}>
                {expanded && (
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
                                    const weight = weights[comp.id] ?? 0;
                                    return (
                                        <div
                                            key={comp.id}
                                            className={`flex items-start gap-4 px-5 py-3.5 transition-colors ${
                                                isSelected ? 'bg-primary/5' : 'bg-base-100 hover:bg-base-50'
                                            }`}
                                        >
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

                                            <div className="flex-1 min-w-0">
                                                <p className={`flex flex-wrap items-center gap-2 text-sm font-semibold leading-tight ${isSelected ? 'text-base-content' : 'text-base-content/80'}`}>
                                                    {comp.nombre}
                                                    {expectedLevels?.[comp.id] != null && (
                                                        <span className="badge badge-sm badge-outline badge-secondary gap-1 font-medium">
                                                            <span className="text-[10px] uppercase tracking-wide opacity-70">Esperado</span>
                                                            {expectedLevels[comp.id]}/{comp.escala}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-base-content/50 mt-0.5 line-clamp-2 leading-relaxed">
                                                    {comp.descripcion}
                                                </p>
                                                <span className="text-xs text-base-content/35 mt-1 inline-block">
                                                    Escala 1–{comp.escala}
                                                </span>
                                            </div>

                                            <AnimatePresence>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, width: 0 }}
                                                        animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="shrink-0 overflow-hidden"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <NumberInputField
                                                                label=""
                                                                min={0}
                                                                max={100}
                                                                step={0.01}
                                                                value={weight}
                                                                onChange={(val) => {
                                                                    const clamped = Math.min(100, Math.max(0, isNaN(val) ? 0 : Math.round(val * 100) / 100));
                                                                    onWeightChange(comp.id, clamped);
                                                                }}
                                                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                                className="input-xs w-16 text-xs"
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

export default CategoryGroup;
