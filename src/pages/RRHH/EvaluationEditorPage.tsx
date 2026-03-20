import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    usePerformanceService,
    EmployeeEvaluation,
    Objective,
    ObjectiveTemplate,
    ObjectiveCategory,
    OBJECTIVE_CATEGORY_LABELS,
    calcPuntajeFinal,
    logroBadgeColor,
} from '../../services/performanceService';
import ObjectiveEditor from '../../components/Performance/ObjectiveEditor';
import GenericModal from '../../components/Common/GenericModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import ConfirmationModal from '../../components/Common/ConfirmationModal';

const DESEMPENO_ROUTE = '/desempeno';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const newObjective = (): Objective => ({
    id:            `obj-${Math.random().toString(36).slice(2, 9)}`,
    nombre:        '',
    descripcion:   '',
    categoria:     'OPERATIVO' as ObjectiveCategory,
    indicador:     '',
    formula:       '',
    tendencia:     'POSITIVA',
    unidad_medida: '',
    frecuencia:    'MENSUAL',
    peso:          0,
    meta:          0,
});

const StatusBadge: React.FC<{ estado: EmployeeEvaluation['estado'] }> = ({ estado }) => {
    const map = {
        PENDIENTE:   { color: 'ghost',   label: 'Pendiente'   },
        EN_PROGRESO: { color: 'warning', label: 'En progreso' },
        COMPLETADA:  { color: 'success', label: 'Completada'  },
    };
    const { color, label } = map[estado];
    return <div className={`badge badge-${color} badge-outline font-medium`}>{label}</div>;
};

// ─── Template picker ──────────────────────────────────────────────────────────

const TemplatePicker: React.FC<{
    templates: ObjectiveTemplate[];
    loading: boolean;
    search: string;
    onSearch: (q: string) => void;
    onSelect: (tpl: ObjectiveTemplate) => void;
    onClose: () => void;
}> = ({ templates, loading, search, onSearch, onSelect, onClose }) => (
    <div className="space-y-4">
        <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                className="input input-bordered w-full pl-9 text-sm"
                placeholder="Buscar plantilla..."
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                autoFocus
            />
        </div>
        {loading ? (
            <LoadingIndicator />
        ) : templates.length === 0 ? (
            <div className="text-center py-8 text-base-content/40 text-sm">Sin resultados</div>
        ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {templates.map((tpl) => (
                    <button
                        key={tpl.id}
                        className="w-full text-left rounded-xl border border-base-200 hover:border-primary hover:bg-primary/5 transition-all p-4 group"
                        onClick={() => { onSelect(tpl); onClose(); }}
                    >
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{tpl.nombre}</p>
                            <span className="badge badge-outline badge-sm shrink-0">{OBJECTIVE_CATEGORY_LABELS[tpl.categoria]}</span>
                        </div>
                        {tpl.descripcion && <p className="text-xs text-base-content/60 line-clamp-2">{tpl.descripcion}</p>}
                        <div className="flex gap-3 mt-2 text-xs text-base-content/40">
                            <span>Meta: {tpl.meta} {tpl.unidad_medida}</span>
                            {tpl.peso_sugerido && <span>· Peso sugerido: {tpl.peso_sugerido}%</span>}
                        </div>
                    </button>
                ))}
            </div>
        )}
    </div>
);

// ─── Left panel list ──────────────────────────────────────────────────────────

const ObjectiveList: React.FC<{
    evaluation: EmployeeEvaluation;
    selectedObjId: string | null;
    pesoTotal: number;
    pesoOk: boolean;
    listRef: React.RefObject<HTMLDivElement | null>;
    isCompleted: boolean;
    puntajePreview?: number;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onOpenPicker: () => void;
}> = ({ evaluation, selectedObjId, pesoTotal, pesoOk, listRef, isCompleted, puntajePreview, onSelect, onAdd, onOpenPicker }) => (
    <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-base-200 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3">
                Objetivos ({evaluation.objetivos.length})
            </p>
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-base-content/50">Peso total</span>
                    <span className={`font-bold ${pesoOk ? 'text-success' : pesoTotal > 100 ? 'text-error' : 'text-warning'}`}>
                        {pesoTotal}%
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-base-200 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${pesoOk ? 'bg-success' : pesoTotal > 100 ? 'bg-error' : 'bg-warning'}`}
                        style={{ width: `${Math.min(pesoTotal, 100)}%` }}
                    />
                </div>
                {pesoTotal > 0 && pesoTotal !== 100 && (
                    <p className="text-xs text-base-content/40">
                        {pesoTotal < 100 ? `Falta ${100 - pesoTotal}% por asignar` : `Excede en ${pesoTotal - 100}%`}
                    </p>
                )}
            </div>
            {puntajePreview !== undefined && (
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-base-content/50">Puntaje parcial</span>
                    <span className={`badge badge-${logroBadgeColor(puntajePreview)} badge-sm font-bold`}>
                        {puntajePreview.toFixed(1)}%
                    </span>
                </div>
            )}
        </div>

        {/* Objective items */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-1">
            <AnimatePresence>
                {evaluation.objetivos.map((obj, idx) => {
                    const isSelected = obj.id === selectedObjId;
                    const hasLogro   = obj.calificacion_logro !== undefined;
                    return (
                        <motion.button
                            key={obj.id}
                            layout
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`w-full text-left px-4 py-3 border-l-2 transition-all duration-100 ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-base-200/60'
                            }`}
                            onClick={() => onSelect(obj.id)}
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-xs font-bold text-base-content/30 mt-0.5 shrink-0 w-4">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate leading-tight ${isSelected ? 'text-primary' : ''}`}>
                                        {obj.nombre || <span className="italic text-base-content/30 font-normal">Sin nombre</span>}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-xs text-base-content/40">{obj.peso}%</span>
                                        {obj.categoria && (
                                            <span className="text-xs text-base-content/30">
                                                · {OBJECTIVE_CATEGORY_LABELS[obj.categoria]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    hasLogro ? `bg-${logroBadgeColor(obj.calificacion_logro!)}` : 'bg-base-300'
                                }`} />
                            </div>
                        </motion.button>
                    );
                })}
            </AnimatePresence>
            {evaluation.objetivos.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-base-content/30">Sin objetivos</p>
            )}
        </div>

        {/* Footer */}
        {!isCompleted && (
            <div className="p-3 border-t border-base-200 space-y-2 shrink-0">
                <button className="btn btn-primary btn-sm w-full gap-1" onClick={onAdd}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar objetivo
                </button>
                <button className="btn btn-ghost btn-sm w-full gap-1" onClick={onOpenPicker}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    Desde plantilla
                </button>
            </div>
        )}
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const EvaluationEditorPage: React.FC = () => {
    const { evaluacionId } = useParams<{ evaluacionId: string }>();
    const navigate = useNavigate();
    const { getEvaluationById, saveEvaluation, completeEvaluation, getTemplates } = usePerformanceService();

    const [evaluation, setEvaluation]       = useState<EmployeeEvaluation | null>(null);
    const [isLoading, setIsLoading]         = useState(true);
    const [isSaving, setIsSaving]           = useState(false);
    const [selectedObjId, setSelectedObjId] = useState<string | null>(null);
    const [isDirty, setIsDirty]             = useState(false);
    const [drawerOpen, setDrawerOpen]       = useState(false);

    const [pickerOpen, setPickerOpen]         = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const [templates, setTemplates]           = useState<ObjectiveTemplate[]>([]);
    const [tplLoading, setTplLoading]         = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    // Incrementado cada vez que se aplica una plantilla para forzar remount
    // del ObjectiveEditor y que su draft interno se reinicialice con los datos nuevos
    const [templateKey, setTemplateKey] = useState(0);

    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!evaluacionId) { navigate(DESEMPENO_ROUTE, { replace: true }); return; }
        (async () => {
            setIsLoading(true);
            const res = await getEvaluationById(evaluacionId);
            if (!res?.success) { navigate(DESEMPENO_ROUTE, { replace: true }); return; }
            const ev: EmployeeEvaluation = res.data.evaluacion;
            setEvaluation(ev);
            if (ev.objetivos.length > 0) setSelectedObjId(ev.objetivos[0].id);
            setIsLoading(false);
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evaluacionId]);

    const openTemplatePicker = async () => {
        setTplLoading(true);
        setPickerOpen(true);
        const res = await getTemplates();
        if (res?.success) setTemplates(res.data.plantillas);
        setTplLoading(false);
    };

    useEffect(() => {
        if (!pickerOpen) return;
        const t = setTimeout(async () => {
            setTplLoading(true);
            const res = await getTemplates(templateSearch ? { search: templateSearch } : undefined);
            if (res?.success) setTemplates(res.data.plantillas);
            setTplLoading(false);
        }, 300);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateSearch, pickerOpen]);

    const updateObjective = useCallback((updated: Objective) => {
        setEvaluation((prev) => prev
            ? { ...prev, objetivos: prev.objetivos.map((o) => (o.id === updated.id ? updated : o)) }
            : prev
        );
        setIsDirty(true);
    }, []);

    const addObjective = () => {
        const obj = newObjective();
        setEvaluation((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                estado: prev.estado === 'PENDIENTE' ? 'EN_PROGRESO' : prev.estado,
                objetivos: [...prev.objetivos, obj],
            };
        });
        setSelectedObjId(obj.id);
        setIsDirty(true);
        setDrawerOpen(false);
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);
    };

    const deleteObjective = (id: string) => {
        const remaining = (evaluation?.objetivos ?? []).filter((o) => o.id !== id);
        setEvaluation((prev) => prev ? { ...prev, objetivos: prev.objetivos.filter((o) => o.id !== id) } : prev);
        setSelectedObjId((prev) => prev === id ? (remaining[0]?.id ?? null) : prev);
        setIsDirty(true);
    };

    const applyTemplate = (tpl: ObjectiveTemplate) => {
        if (!selectedObjId || !evaluation) return;
        const current = evaluation.objetivos.find((o) => o.id === selectedObjId);
        if (!current) return;
        updateObjective({
            ...current,
            nombre: tpl.nombre, descripcion: tpl.descripcion,
            categoria: tpl.categoria, indicador: tpl.indicador,
            formula: tpl.formula, tendencia: tpl.tendencia,
            unidad_medida: tpl.unidad_medida, frecuencia: tpl.frecuencia,
            meta: tpl.meta, peso: tpl.peso_sugerido ?? current.peso,
        });
        // Fuerza remount del ObjectiveEditor para reinicializar su draft local
        setTemplateKey((k) => k + 1);
    };

    const handleSave = async () => {
        if (!evaluation) return;
        setIsSaving(true);
        const res = await saveEvaluation(evaluation);
        if (res?.success) { setEvaluation(res.data.evaluacion); setIsDirty(false); }
        setIsSaving(false);
    };

    const handleComplete = async () => {
        if (!evaluation) return;
        setIsSaving(true);
        await saveEvaluation(evaluation);
        const res = await completeEvaluation(evaluation.id);
        if (res?.success) { setEvaluation(res.data.evaluacion); setIsDirty(false); }
        setIsSaving(false);
        setShowCompleteModal(false);
    };

    const pesoTotal      = evaluation?.objetivos.reduce((s, o) => s + (o.peso ?? 0), 0) ?? 0;
    const pesoOk         = pesoTotal === 100;
    const selectedObj    = evaluation?.objetivos.find((o) => o.id === selectedObjId) ?? null;
    const isCompleted    = evaluation?.estado === 'COMPLETADA';
    const puntajePreview = evaluation ? calcPuntajeFinal(evaluation.objetivos) : undefined;

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingIndicator /></div>;
    if (!evaluation) return null;

    const listPanel = (
        <ObjectiveList
            evaluation={evaluation}
            selectedObjId={selectedObjId}
            pesoTotal={pesoTotal}
            pesoOk={pesoOk}
            listRef={listRef}
            isCompleted={isCompleted}
            puntajePreview={puntajePreview}
            onSelect={(id) => { setSelectedObjId(id); setDrawerOpen(false); }}
            onAdd={addObjective}
            onOpenPicker={openTemplatePicker}
        />
    );

    return (
        <div className="flex flex-col h-screen bg-base-100 overflow-hidden">
            {/* Top bar */}
            <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-base-200 shrink-0 z-10">
                <button className="btn btn-ghost btn-sm btn-square" onClick={() => navigate(DESEMPENO_ROUTE)}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button className="btn btn-ghost btn-sm btn-square md:hidden" onClick={() => setDrawerOpen(true)}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="font-bold text-sm md:text-base truncate leading-tight">{evaluation.persona_nombre}</h1>
                    <p className="text-xs text-base-content/50 truncate">{evaluation.ciclo_nombre} · {evaluation.persona_puesto}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge estado={evaluation.estado} />
                    {puntajePreview !== undefined && (
                        <div className={`badge badge-${logroBadgeColor(puntajePreview)} font-bold hidden sm:flex`}>
                            {puntajePreview.toFixed(1)}%
                        </div>
                    )}
                    {!isCompleted && (
                        <>
                            <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={isSaving || !isDirty}>
                                {isSaving && <span className="loading loading-spinner loading-xs mr-1" />}
                                Guardar
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowCompleteModal(true)}
                                disabled={isSaving || !pesoOk || evaluation.objetivos.length === 0}
                                title={!pesoOk ? `Peso total: ${pesoTotal}%. Debe ser 100%.` : ''}
                            >
                                Completar
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Mobile drawer */}
                <AnimatePresence>
                    {drawerOpen && (
                        <>
                            <motion.div
                                className="fixed inset-0 bg-black/40 z-20 md:hidden"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setDrawerOpen(false)}
                            />
                            <motion.div
                                className="fixed left-0 top-0 h-full w-72 bg-base-100 z-30 md:hidden shadow-2xl"
                                initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                {listPanel}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Desktop sidebar */}
                <aside className="hidden md:flex flex-col w-72 border-r border-base-200 bg-base-50/50 shrink-0 overflow-hidden">
                    {listPanel}
                </aside>

                {/* Right panel */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6 max-w-3xl h-full">
                        <AnimatePresence mode="wait">
                            {selectedObj ? (
                                <motion.div
                                    key={`${selectedObj.id}-${templateKey}`}
                                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <ObjectiveEditor
                                        objective={selectedObj}
                                        pesoTotal={pesoTotal}
                                        evaluationCompleted={isCompleted}
                                        onUpdate={updateObjective}
                                        onDelete={() => deleteObjective(selectedObj.id)}
                                        onLoadTemplate={openTemplatePicker}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    className="h-full flex flex-col items-center justify-center text-center gap-4"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                >
                                    <svg className="h-14 w-14 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <div className="opacity-40">
                                        <p className="font-semibold">Sin objetivos aún</p>
                                        <p className="text-sm mt-1">Agrega el primer objetivo desde el panel izquierdo.</p>
                                    </div>
                                    {!isCompleted && (
                                        <button className="btn btn-primary btn-sm" onClick={addObjective}>
                                            Agregar primer objetivo
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Template picker modal */}
            <GenericModal
                isOpen={pickerOpen}
                onClose={() => { setPickerOpen(false); setTemplateSearch(''); }}
                title="Cargar desde plantilla"
                size="md"
            >
                <TemplatePicker
                    templates={templates}
                    loading={tplLoading}
                    search={templateSearch}
                    onSearch={setTemplateSearch}
                    onSelect={applyTemplate}
                    onClose={() => { setPickerOpen(false); setTemplateSearch(''); }}
                />
            </GenericModal>

            {/* Complete confirmation */}
            <ConfirmationModal
                isOpen={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                onConfirm={handleComplete}
                title="Completar evaluación"
                message={`¿Confirmas que deseas marcar como completada la evaluación de ${evaluation.persona_nombre}? El resultado quedará registrado y no podrá editarse.`}
                confirmText="Completar evaluación"
                variant="info"
            />
        </div>
    );
};

export default EvaluationEditorPage;