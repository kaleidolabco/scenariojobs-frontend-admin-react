import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../../services/categoryService';
import { Competency } from '../../services/competencyService';
import {
    Search,
    X,
    AlertTriangle,
    Tag as IconTagIcon,
} from '../Common/Icon';
import Button from '../Common/Button';
import GenericModal from '../Common/GenericModal';
import WeightBar from './WeightBar';
import CategoryGroup, { WeightMap } from './CategoryGroup';
import AddCategoryDropdown from './AddCategoryDropdown';
import { OrigenCompetencias, SugerenciaCompetencias } from './types';

interface CompetenciesTabProps {
    allCompetencies: Competency[];
    allCategories: Category[];
    selectedIds: string[];
    weights: WeightMap;
    origen: OrigenCompetencias;
    onOrigenChange: (o: OrigenCompetencias) => void;
    sugerencia: SugerenciaCompetencias | null;
    derivedDirty: boolean;
    onAplicar: (mode: 'reemplazar' | 'fusionar') => void;
    onToggle: (id: string) => void;
    onWeightChange: (id: string, w: number) => void;
    onClearAll: () => void;
}

const CompetenciesTab: React.FC<CompetenciesTabProps> = ({
    allCompetencies,
    allCategories,
    selectedIds,
    weights,
    origen,
    onOrigenChange,
    sugerencia,
    derivedDirty,
    onAplicar,
    onToggle,
    onWeightChange,
    onClearAll,
}) => {
    const [search, setSearch] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [activeSlugs, setActiveSlugs] = useState<string[]>(() => {
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
    const weightOk = totalWeight === 100;

    const availableToAdd = allCategories.filter((c) => !activeSlugs.includes(c.slug));

    const q = search.trim().toLowerCase();
    const searching = q.length > 0;

    const matchedCompetencies = searching
        ? allCompetencies.filter(
              (c) => c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
          )
        : [];
    const matchedSlugs = Array.from(
        new Set(matchedCompetencies.map((c) => c.categoria))
    );
    const matchedCategories = matchedSlugs
        .map((slug) => allCategories.find((c) => c.slug === slug))
        .filter((c): c is Category => Boolean(c));

    const activeCategories = activeSlugs
        .map((slug) => allCategories.find((c) => c.slug === slug))
        .filter((c): c is Category => Boolean(c));

    const handleAddCategory = (slug: string) => {
        setActiveSlugs((prev) => [...prev, slug]);
    };

    const handleRemoveCategory = (slug: string) => {
        const compsInCat = allCompetencies
            .filter((c) => c.categoria === slug && selectedIds.includes(c.id))
            .map((c) => c.id);
        compsInCat.forEach((id) => onToggle(id));
        setActiveSlugs((prev) => prev.filter((s) => s !== slug));
    };

    const distributeEvenly = () => {
        if (selectedIds.length === 0) return;
        const base = Math.floor(100 / selectedIds.length);
        const extra = 100 - base * selectedIds.length;
        selectedIds.forEach((id, i) => onWeightChange(id, base + (i === 0 ? extra : 0)));
    };

    const handleClearAll = () => {
        onClearAll();
        setActiveSlugs([]);
    };

    const applySugerencia = (mode: 'reemplazar' | 'fusionar') => {
        if (!sugerencia) return;
        const newSlugs = new Set(
            allCompetencies.filter((c) => sugerencia.ids.includes(c.id)).map((c) => c.categoria)
        );
        setActiveSlugs((prev) =>
            mode === 'fusionar'
                ? Array.from(new Set([...prev, ...newSlugs]))
                : Array.from(newSlugs)
        );
        onAplicar(mode);
    };

    const handleAplicarClick = () => {
        if (!sugerencia) return;
        if (selectedIds.length === 0) {
            applySugerencia('reemplazar');
            return;
        }
        setConfirmOpen(true);
    };

    return (
        <div className="space-y-4">
            {/* Origen de competencias */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wide whitespace-nowrap">
                        Origen
                    </span>
                    <div className="join">
                        <button
                            type="button"
                            className={`join-item btn btn-sm ${origen === 'manual' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => onOrigenChange('manual')}
                        >
                            Selección manual
                        </button>
                        <button
                            type="button"
                            className={`join-item btn btn-sm ${origen === 'desde_cargos' ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => onOrigenChange('desde_cargos')}
                        >
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
                                        ? `${sugerencia.ids.length} competencia(s) derivada(s) de ${sugerencia.nCargos} cargo(s) · ${sugerencia.nPersonas} persona(s) seleccionada(s)`
                                        : 'Selecciona participantes para derivar automáticamente las competencias de sus cargos.'}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAplicarClick}
                                    disabled={!sugerencia || sugerencia.ids.length === 0}
                                >
                                    {derivedDirty ? 'Aplicar y actualizar' : 'Aplicar sugerencias'}
                                </Button>
                            </div>
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

                        {sugerencia && sugerencia.ids.length > 0 && selectedIds.length > 0 && !derivedDirty && (
                            <p className="text-xs text-base-content/40">
                                Las competencias ya aplicadas se mantienen. Puedes ajustar la selección o los pesos manualmente.
                            </p>
                        )}
                    </div>
                )}
            </div>

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

            {/* Empty state */}
            {activeSlugs.length === 0 && !searching && (
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
            {searching ? (
                matchedCategories.length > 0 ? (
                    <div className="space-y-4">
                        <p className="text-xs text-base-content/50">
                            {matchedCompetencies.length} coincidencia(s) para{" "}
                            <strong className="text-base-content/70">"{search}"</strong>
                        </p>
                        <AnimatePresence>
                            {matchedCategories.map((cat) => (
                                <CategoryGroup
                                    key={cat.slug}
                                    category={cat}
                                    competencies={allCompetencies.filter((c) => c.categoria === cat.slug)}
                                    selectedIds={selectedIds}
                                    weights={weights}
                                    expectedLevels={sugerencia?.expectedLevels}
                                    onToggle={onToggle}
                                    onWeightChange={onWeightChange}
                                    onRemoveCategory={handleRemoveCategory}
                                    searchTerm={search}
                                    autoOpen
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-base-300 rounded-xl py-14 flex flex-col items-center justify-center gap-3 text-center px-6">
                        <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-base-content/30">
                            <Search size={16} />
                        </div>
                        <p className="font-semibold text-base-content/60 text-sm">Sin resultados</p>
                        <p className="text-xs text-base-content/40 max-w-xs">
                            No hay competencias que coincidan con "<strong>{search}</strong>".
                        </p>
                    </div>
                )
            ) : (
                <>
                    <AnimatePresence>
                        {activeCategories.map((cat) => (
                            <CategoryGroup
                                key={cat.slug}
                                category={cat}
                                competencies={allCompetencies.filter((c) => c.categoria === cat.slug)}
                                selectedIds={selectedIds}
                                weights={weights}
                                expectedLevels={sugerencia?.expectedLevels}
                                onToggle={onToggle}
                                onWeightChange={onWeightChange}
                                onRemoveCategory={handleRemoveCategory}
                                searchTerm={search}
                            />
                        ))}
                    </AnimatePresence>

                    {activeSlugs.length > 0 && availableToAdd.length === 0 && (
                        <p className="text-xs text-center text-base-content/40 pt-2">
                            Todas las categorías han sido agregadas.
                        </p>
                    )}
                </>
            )}

            {/* Confirmación al aplicar sugerencias con selección manual previa */}
            <GenericModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Aplicar sugerencias de cargos"
                size="sm"
            >
                <p className="text-sm text-base-content/70">
                    Ya tienes <strong>{selectedIds.length}</strong> competencia(s) seleccionada(s)
                    manualmente. ¿Cómo deseas aplicar las <strong>{sugerencia?.ids.length ?? 0}</strong> sugeridas?
                </p>
                <div className="flex flex-wrap justify-end gap-2 mt-5">
                    <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setConfirmOpen(false); applySugerencia('fusionar'); }}
                    >
                        Fusionar
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => { setConfirmOpen(false); applySugerencia('reemplazar'); }}
                    >
                        Reemplazar
                    </Button>
                </div>
            </GenericModal>
        </div>
    );
};

export default CompetenciesTab;
