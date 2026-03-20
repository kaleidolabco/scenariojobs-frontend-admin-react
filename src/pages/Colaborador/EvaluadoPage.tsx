import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    usePerformanceService,
    EmployeeEvaluation,
    EmployeeEvaluationStatus,
    calcPuntajeFinal,
    logroBadgeColor,
} from '../../services/performanceService';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import PageContainer from '../../components/Common/PageContainer';

// ─── Icons ────────────────────────────────────────────────────────────────────

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, colorClass }) => (
    <div className={`card bg-base-100 shadow border border-base-200`}>
        <div className="card-body p-4 flex-row items-center gap-4">
            <div className={`p-3 rounded-xl ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-base-content">{value}</p>
                <p className="text-xs text-base-content/60 leading-tight">{label}</p>
            </div>
        </div>
    </div>
);

const IconChart = () => (
    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const IconFire = () => (
    <svg className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657L13.414 22.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
    </svg>
);

const IconTarget = () => (
    <svg className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const IconCheck = () => (
    <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Ruta al editor del evaluado
const EDITOR_ROUTE = (id: string) => `/mi-desempeno/${id}`;

// ─── Tipos extendidos (mientras se integran en performanceService) ─────────────
type SelfEvalStatus = 'PENDIENTE' | 'EN_PROGRESO' | 'ENVIADA';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const evalStatusMap: Record<EmployeeEvaluationStatus, { color: string; label: string }> = {
    PENDIENTE:   { color: 'ghost',   label: 'Pendiente'   },
    EN_PROGRESO: { color: 'warning', label: 'En progreso' },
    COMPLETADA:  { color: 'success', label: 'Completada'  },
};

const selfEvalStatusMap: Record<SelfEvalStatus, { color: string; label: string; icon: React.ReactNode }> = {
    PENDIENTE: {
        color: 'ghost',
        label: 'Sin autoevaluar',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="9" strokeWidth={1.5}/>
            </svg>
        ),
    },
    EN_PROGRESO: {
        color: 'warning',
        label: 'Autoevaluación en progreso',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        ),
    },
    ENVIADA: {
        color: 'success',
        label: 'Autoevaluación enviada',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        ),
    },
};

// ─── Tarjeta de evaluación ────────────────────────────────────────────────────

interface EvalCardProps {
    evaluation: EmployeeEvaluation;
    onOpen: (id: string) => void;
}

const EvalCard: React.FC<EvalCardProps> = ({ evaluation, onOpen }) => {
    // Deriva el estado de autoevaluación desde los datos existentes
    const selfStatus: SelfEvalStatus =
        (evaluation as any).estado_autoevaluacion ?? 'PENDIENTE';
    const selfInfo = selfEvalStatusMap[selfStatus];
    const evalInfo = evalStatusMap[evaluation.estado];

    const puntaje = calcPuntajeFinal(evaluation.objetivos);
    const objConAuto = evaluation.objetivos.filter(
        (o: any) => o.autoevaluacion_comentarios || (o.evidencias_evaluado ?? []).length > 0
    ).length;
    const totalObj = evaluation.objetivos.length;
    const autoProgress = totalObj > 0 ? Math.round((objConAuto / totalObj) * 100) : 0;
    const isCompleted = evaluation.estado === 'COMPLETADA';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
            onClick={() => onOpen(evaluation.id)}
        >
            <div className="card-body p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight truncate">{evaluation.ciclo_nombre}</h3>
                        <p className="text-xs text-base-content/50 mt-0.5">
                            {evaluation.persona_departamento} · {evaluation.persona_puesto}
                        </p>
                    </div>
                    <div className={`badge badge-${evalInfo.color} badge-outline text-xs font-medium shrink-0`}>
                        {evalInfo.label}
                    </div>
                </div>

                {/* Objetivos progress */}
                {totalObj > 0 ? (
                    <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs text-base-content/50">
                            <span>{totalObj} objetivo{totalObj !== 1 ? 's' : ''}</span>
                            <span className={`font-medium text-${selfInfo.color === 'ghost' ? 'base-content/50' : selfInfo.color}`}>
                                {objConAuto}/{totalObj} autoevaluados
                            </span>
                        </div>
                        <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    selfStatus === 'ENVIADA' ? 'bg-success' : autoProgress > 0 ? 'bg-warning' : 'bg-base-300'
                                }`}
                                style={{ width: `${autoProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-base-content/30 mb-3 italic">Sin objetivos asignados aún</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-base-100">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                        selfInfo.color === 'ghost' ? 'text-base-content/40' :
                        selfInfo.color === 'warning' ? 'text-warning' : 'text-success'
                    }`}>
                        {selfInfo.icon}
                        {selfInfo.label}
                    </div>
                    {isCompleted && puntaje !== undefined ? (
                        <div className={`badge badge-${logroBadgeColor(puntaje)} font-bold text-sm`}>
                            {puntaje.toFixed(1)}%
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                            {totalObj > 0 ? 'Ir a evaluar' : 'Ver detalle'}
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
    <div className="text-center py-20 text-base-content/40">
        <svg className="h-12 w-12 mx-auto mb-4 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
        </svg>
        <p className="font-semibold text-base">Sin evaluaciones asignadas</p>
        <p className="text-sm mt-1">Cuando tu líder cree una evaluación para ti, aparecerá aquí.</p>
    </div>
);

// ─── Section divider ──────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; count: number }> = ({ label, count }) => (
    <div className="flex items-center gap-3 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">{label}</p>
        <span className="badge badge-ghost badge-sm">{count}</span>
        <div className="flex-1 h-px bg-base-200"/>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const EvaluadoPage: React.FC = () => {
    const navigate = useNavigate();
    const { getEvaluations, loading } = usePerformanceService();
    const [evals, setEvals] = useState<EmployeeEvaluation[]>([]);

    // En producción, getMyEvaluations() filtraría por el usuario autenticado.
    // Por ahora reutilizamos getEvaluations y filtramos por persona de demo.
    const load = useCallback(async () => {
        const r = await getEvaluations({ items_por_pagina: 50 });
        if (r?.success) setEvals(r.data.evaluaciones);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    const active    = evals.filter(e => e.estado !== 'COMPLETADA');
    const completed = evals.filter(e => e.estado === 'COMPLETADA');

    // Métricas de resumen
    const totalObjs = evals.reduce((s, e) => s + e.objetivos.length, 0);
    const selfDone  = evals.reduce((s, e) => {
        return s + e.objetivos.filter((o: any) => o.autoevaluacion_comentarios || (o.evidencias_evaluado ?? []).length > 0).length;
    }, 0);

    return (
        <PageContainer
            title="Mis evaluaciones"
            subtitle="Consulta tus ciclos de desempeño y completa tu autoevaluación por objetivos."
        >
            {loading && !evals.length ? (
                <LoadingIndicator />
            ) : evals.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-8">
                    {/* Summary strip */}
                    {totalObjs > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <StatsCard
                                label="Evaluaciones"
                                value={evals.length}
                                colorClass="bg-primary/10 text-primary"
                                icon={<IconChart />}
                            />
                            <StatsCard
                                label="Activas"
                                value={active.length}
                                colorClass="bg-warning/10 text-warning"
                                icon={<IconFire />}
                            />
                            <StatsCard
                                label="Objetivos totales"
                                value={totalObjs}
                                colorClass="bg-info/10 text-info"
                                icon={<IconTarget />}
                            />
                            <StatsCard
                                label="Autoevaluados"
                                value={`${selfDone}/${totalObjs}`}
                                colorClass="bg-success/10 text-success"
                                icon={<IconCheck />}
                            />
                        </div>
                    )}

                    {/* Active evaluations */}
                    {active.length > 0 && (
                        <section>
                            <SectionLabel label="En curso" count={active.length} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {active.map(ev => (
                                        <EvalCard key={ev.id} evaluation={ev} onOpen={id => navigate(EDITOR_ROUTE(id))} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}

                    {/* Completed evaluations */}
                    {completed.length > 0 && (
                        <section>
                            <SectionLabel label="Completadas" count={completed.length} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {completed.map(ev => (
                                        <EvalCard key={ev.id} evaluation={ev} onOpen={id => navigate(EDITOR_ROUTE(id))} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </PageContainer>
    );
};

export default EvaluadoPage;
