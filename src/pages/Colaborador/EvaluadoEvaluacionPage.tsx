import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    usePerformanceService,
    EmployeeEvaluation,
    calcPuntajeFinal,
    calcPuntajeFinalNumerico,
    logroBadgeColor,
    OBJECTIVE_CATEGORY_LABELS,
} from '../../services/performanceService';
import SelfAssessmentPanel, { ObjectiveWithSelf } from '../../components/Performance/SelfAssessmentPanel';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import GenericModal from '../../components/Common/GenericModal';

const MY_EVALS_ROUTE = '/mis-evaluaciones';

// ─── Tipos locales ────────────────────────────────────────────────────────────

type SelfEvalStatus = 'PENDIENTE' | 'EN_PROGRESO' | 'ENVIADA';

interface EvaluationWithSelf extends EmployeeEvaluation {
    objetivos: ObjectiveWithSelf[];
    comentarios_generales_evaluado?: string;
    estado_autoevaluacion?: SelfEvalStatus;
    fecha_autoevaluacion?: string;
}

// ─── Status badge del evaluado ────────────────────────────────────────────────

const SelfStatusBadge: React.FC<{ status: SelfEvalStatus }> = ({ status }) => {
    const map = {
        PENDIENTE: { color: 'ghost', label: 'Sin autoevaluar' },
        EN_PROGRESO: { color: 'warning', label: 'En progreso' },
        ENVIADA: { color: 'success', label: 'Autoevaluación enviada' },
    };
    const { color, label } = map[status];
    return <div className={`badge badge-${color} badge-outline font-medium`}>{label}</div>;
};

// ─── Indicador de progreso autoevaluación ────────────────────────────────────

const SelfProgress: React.FC<{ total: number; done: number }> = ({ total, done }) => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const ok = done === total && total > 0;
    return (
        <div className="px-4 pt-3 pb-2 border-b border-base-200">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-base-content/50">Mi avance</span>
                <span className={`font-bold ${ok ? 'text-success' : 'text-warning'}`}>{done}/{total}</span>
            </div>
            <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${ok ? 'bg-success' : pct > 0 ? 'bg-warning' : 'bg-base-300'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

// ─── Lista de objetivos (panel izquierdo) ─────────────────────────────────────

const ObjectiveListPanel: React.FC<{
    evaluation: EvaluationWithSelf;
    selectedId: string | null;
    listRef: React.RefObject<HTMLDivElement | null>;
    submitted: boolean;
    onSelect: (id: string) => void;
}> = ({ evaluation, selectedId, listRef, submitted, onSelect }) => {
    const objs = evaluation.objetivos;
    const selfDone = objs.filter(o => o.autoevaluacion_comentarios || (o.evidencias_evaluado ?? []).length > 0).length;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-base-200 shrink-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
                    Objetivos ({objs.length})
                </p>
                <SelfProgress total={objs.length} done={selfDone} />
            </div>

            {/* List */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-1">
                <AnimatePresence>
                    {objs.map((obj, idx) => {
                        const isSelected = obj.id === selectedId;
                        const hasAuto = !!(obj.autoevaluacion_comentarios || (obj.evidencias_evaluado ?? []).length > 0);
                        const hasEvalLogro = obj.calificacion_logro !== undefined;

                        return (
                            <motion.button
                                key={obj.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`w-full text-left px-4 py-3 border-l-2 transition-all duration-100 ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-base-200/60'
                                    }`}
                                onClick={() => onSelect(obj.id)}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-xs font-bold text-base-content/30 mt-0.5 w-4 shrink-0">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate leading-tight ${isSelected ? 'text-primary' : ''}`}>
                                            {obj.nombre || <span className="italic text-base-content/30 font-normal">Sin nombre</span>}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs text-base-content/40">{obj.peso}%</span>
                                            {obj.categoria && (
                                                <span className="text-xs text-base-content/30">· {OBJECTIVE_CATEGORY_LABELS[obj.categoria]}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Indicadores: autoevaluación + logro */}
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                        {/* Dot autoevaluación */}
                                        <div className={`w-2 h-2 rounded-full ${submitted || hasAuto ? 'bg-success' : 'bg-base-300'
                                            }`} title={hasAuto ? 'Autoevaluado' : 'Pendiente'} />
                                        {/* Dot logro evaluador */}
                                        {hasEvalLogro && (
                                            <div className={`w-2 h-2 rounded-full bg-${logroBadgeColor(obj.calificacion_logro!)}`}
                                                title={`Logro: ${obj.calificacion_logro!.toFixed(1)}%`} />
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
                {objs.length === 0 && (
                    <p className="px-4 py-8 text-center text-sm text-base-content/30">Sin objetivos asignados</p>
                )}
            </div>

            {/* Legend */}
            <div className="px-4 py-3 border-t border-base-200 space-y-1 shrink-0">
                <div className="flex items-center gap-2 text-xs text-base-content/40">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span>Mi autoevaluación completa</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-base-content/40">
                    <div className="w-2 h-2 rounded-full bg-base-300" />
                    <span>Autoevaluación pendiente</span>
                </div>
            </div>
        </div>
    );
};

// ─── Modal de comentarios generales ──────────────────────────────────────────

const GeneralCommentsModal: React.FC<{
    isOpen: boolean;
    value: string;
    disabled: boolean;
    onClose: () => void;
    onChange: (v: string) => void;
    onSave: () => void;
}> = ({ isOpen, value, disabled, onClose, onChange, onSave }) => (
    <GenericModal isOpen={isOpen} onClose={onClose} title="Comentarios generales" size="md">
        <div className="space-y-4">
            <p className="text-sm text-base-content/60">
                Comparte una reflexión general sobre tu desempeño en este ciclo: logros destacados, aprendizajes y compromisos de mejora.
            </p>
            <textarea
                className="textarea textarea-bordered w-full text-sm leading-relaxed resize-none"
                rows={7}
                placeholder="Escribe aquí tu reflexión general sobre el período evaluado..."
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
            />
            <div className="flex justify-end gap-3">
                <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
                {!disabled && (
                    <button className="btn btn-primary" onClick={() => { onSave(); onClose(); }}>
                        Guardar
                    </button>
                )}
            </div>
        </div>
    </GenericModal>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const EvaluadoEvaluacionPage: React.FC = () => {
    const { evaluacionId } = useParams<{ evaluacionId: string }>();
    const navigate = useNavigate();
    const { getEvaluationById, saveEvaluation } = usePerformanceService();

    const [evaluation, setEvaluation] = useState<EvaluationWithSelf | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showSubmit, setShowSubmit] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!evaluacionId) { navigate(MY_EVALS_ROUTE, { replace: true }); return; }
        (async () => {
            setIsLoading(true);
            const res = await getEvaluationById(evaluacionId);
            if (!res?.success) { navigate(MY_EVALS_ROUTE, { replace: true }); return; }
            const ev = res.data.evaluacion as EvaluationWithSelf;
            // Asegura campos extendidos por defecto
            ev.estado_autoevaluacion = ev.estado_autoevaluacion ?? 'PENDIENTE';
            ev.objetivos = ev.objetivos.map(o => ({
                ...o,
                evidencias_evaluado: (o as any).evidencias_evaluado ?? [],
            }));
            setEvaluation(ev);
            if (ev.objetivos.length > 0) setSelectedId(ev.objetivos[0].id);
            setIsLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [evaluacionId]);

    const updateObjective = useCallback((updated: ObjectiveWithSelf) => {
        setEvaluation(prev => {
            if (!prev) return prev;
            const objetivos = prev.objetivos.map(o => o.id === updated.id ? updated : o);
            const hasAny = objetivos.some(o => o.autoevaluacion_comentarios || (o.evidencias_evaluado ?? []).length > 0);
            return {
                ...prev,
                objetivos,
                estado_autoevaluacion: prev.estado_autoevaluacion === 'ENVIADA'
                    ? 'ENVIADA'
                    : hasAny ? 'EN_PROGRESO' : 'PENDIENTE',
            };
        });
        setIsDirty(true);
    }, []);

    const handleSave = async () => {
        if (!evaluation) return;
        setIsSaving(true);
        // En producción: llamaría a saveSelfEvaluation()
        await saveEvaluation(evaluation as EmployeeEvaluation);
        setIsDirty(false);
        setIsSaving(false);
    };

    const handleSubmit = async () => {
        if (!evaluation) return;
        setIsSaving(true);
        // Guarda primero, luego marca como enviada
        await saveEvaluation(evaluation as EmployeeEvaluation);
        const submitted: EvaluationWithSelf = {
            ...evaluation,
            estado_autoevaluacion: 'ENVIADA',
            fecha_autoevaluacion: new Date().toISOString().split('T')[0],
            objetivos: evaluation.objetivos.map(o => ({ ...o, autoevaluacion_enviada: true })),
        };
        setEvaluation(submitted);
        setIsDirty(false);
        setIsSaving(false);
        setShowSubmit(false);
    };

    const selfStatus = evaluation?.estado_autoevaluacion ?? 'PENDIENTE';
    const submitted = selfStatus === 'ENVIADA';
    const isEvalDone = evaluation?.estado === 'COMPLETADA';
    const selectedObj = evaluation?.objetivos.find(o => o.id === selectedId) ?? null;
    const puntajeEval = evaluation ? calcPuntajeFinal(evaluation.objetivos) : undefined;
    const puntajeEvalNumerico = evaluation ? calcPuntajeFinalNumerico(evaluation.objetivos) : undefined;

    const selfDone = evaluation?.objetivos.filter(o =>
        o.autoevaluacion_comentarios || (o.evidencias_evaluado ?? []).length > 0
    ).length ?? 0;
    const totalObj = evaluation?.objetivos.length ?? 0;
    const canSubmit = !submitted && selfDone > 0;

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingIndicator /></div>;
    if (!evaluation) return null;

    const listPanel = (
        <ObjectiveListPanel
            evaluation={evaluation}
            selectedId={selectedId}
            listRef={listRef}
            submitted={submitted}
            onSelect={id => { setSelectedId(id); setDrawerOpen(false); }}
        />
    );

    return (
        <div className="flex flex-col h-screen bg-base-100 overflow-hidden">
            {/* ── Top bar ── */}
            <header className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-3 border-b border-base-200 shrink-0 z-10">
                {/* First row: Back, info, status */}
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <button className="btn btn-ghost btn-sm btn-square shrink-0" onClick={() => navigate(MY_EVALS_ROUTE)}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    {/* Mobile: abrir drawer */}
                    <button className="btn btn-ghost btn-sm btn-square md:hidden shrink-0" onClick={() => setDrawerOpen(true)}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-sm md:text-base truncate leading-tight">{evaluation.ciclo_nombre}</h1>
                        <p className="text-xs text-base-content/50 truncate">{evaluation.persona_nombre} · {evaluation.persona_puesto}</p>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                        <SelfStatusBadge status={selfStatus} />

                        {/* Puntaje final (solo si completada por evaluador) */}
                        {isEvalDone && puntajeEval !== undefined && (
                            <div className={`badge badge-${logroBadgeColor(puntajeEval)} font-bold hidden sm:flex flex-col gap-0.5`}>
                                {/* <span>{puntajeEval.toFixed(1)}%</span> */}
                                {puntajeEvalNumerico !== undefined && <span className="text-xs">{puntajeEvalNumerico.toFixed(2)}/5</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Second row: Action buttons (stacked on mobile) */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {/* Botón comentarios generales */}
                    <button
                        className="btn btn-ghost btn-sm hidden sm:flex gap-1"
                        onClick={() => setShowComments(true)}
                        title="Comentarios generales"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="hidden lg:inline">{evaluation.comentarios_generales_evaluado ? 'Mis comentarios ✓' : 'Mis comentarios'}</span>
                    </button>

                    {/* Guardar borrador */}
                    {!submitted && (
                        <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={isSaving || !isDirty}>
                            {isSaving && <span className="loading loading-spinner loading-xs mr-1" />}
                            <span className="hidden sm:inline">Guardar</span>
                            <span className="sm:hidden">Guardar</span>
                        </button>
                    )}

                    {/* Enviar autoevaluación */}
                    {!submitted && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowSubmit(true)}
                            disabled={!canSubmit || isSaving}
                            title={!canSubmit ? 'Completa al menos un objetivo antes de enviar' : ''}
                        >
                            <span className="hidden md:inline">Enviar</span>
                            <span className="md:hidden text-xs">Enviar</span>
                        </button>
                    )}
                </div>
            </header>

            {/* ── Body ── */}
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
                    <div className="p-3 md:p-6 max-w-3xl h-full">
                        <AnimatePresence mode="wait">
                            {selectedObj ? (
                                <motion.div
                                    key={selectedObj.id}
                                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.15 }}
                                    className="h-full"
                                >
                                    <SelfAssessmentPanel
                                        objective={selectedObj}
                                        submitted={submitted}
                                        onUpdate={updateObjective}
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
                                        <p className="font-semibold">
                                            {totalObj === 0
                                                ? 'Aún no tienes objetivos asignados'
                                                : 'Selecciona un objetivo del panel izquierdo'}
                                        </p>
                                        <p className="text-sm mt-1">
                                            {totalObj === 0
                                                ? 'Tu evaluador los configurará pronto.'
                                                : 'Completa tu autoevaluación para cada objetivo.'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* ── Modales ── */}

            {/* Comentarios generales */}
            <GeneralCommentsModal
                isOpen={showComments}
                value={evaluation.comentarios_generales_evaluado ?? ''}
                disabled={submitted}
                onClose={() => setShowComments(false)}
                onChange={v => {
                    setEvaluation(prev => prev ? { ...prev, comentarios_generales_evaluado: v } : prev);
                    setIsDirty(true);
                }}
                onSave={() => { /* handleSave() se puede llamar después si isDirty */ }}
            />

            {/* Confirmar envío */}
            <ConfirmationModal
                isOpen={showSubmit}
                onClose={() => setShowSubmit(false)}
                onConfirm={handleSubmit}
                title="Enviar autoevaluación"
                message={`¿Confirmas el envío de tu autoevaluación para el ciclo "${evaluation.ciclo_nombre}"? Una vez enviada, no podrás editarla.`}
                confirmText="Sí, enviar"
                variant="info"
            />
        </div>
    );
};

export default EvaluadoEvaluacionPage;
