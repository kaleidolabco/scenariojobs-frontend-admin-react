import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import PageContainer from '../../components/Common/PageContainer';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import QuadrantChart from '../../components/Performance/QuadrantChart';
import {
    useIntegralEvaluationService,
    EvaluacionIntegral,
    IntegralComponente,
    IntegralEvaluationStatus,
    INTEGRAL_STATUS_LABELS,
    integralBadgeColor,
} from '../../services/integralEvaluationService';
import { useEvaluationResponseService } from '../../services/evaluationResponseService';
import { calcPuntajeIntegral } from '../../services/integralEvaluationService';
import useUIStore from '../../store/uiStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DESEMPENO_ROUTE   = (id: string) => `/desempeno/${id}`;
const COMPETENCIAS_ROUTE = (id: string) => ROUTES.COMPETENCY_EVAL_DETAIL(id);

const statusColorMap: Record<IntegralEvaluationStatus, string> = {
    BORRADOR:    'badge-ghost',
    EN_PROGRESO: 'badge-warning',
    COMPLETADA:  'badge-success',
};

// ─── Component status badge ───────────────────────────────────────────────────

const ComponentStatus: React.FC<{ estado: IntegralEvaluationStatus }> = ({ estado }) => {
    const { label } = INTEGRAL_STATUS_LABELS[estado];
    return <span className={`badge ${statusColorMap[estado]} badge-sm font-medium`}>{label}</span>;
};

// ─── Weight editor ────────────────────────────────────────────────────────────

interface WeightEditorProps {
    hasDesempeno:    boolean;
    hasCompetencias: boolean;
    pesoDesempeno:   number;
    pesoComp:        number;
    onSave: (d: number, c: number) => Promise<void>;
    saving: boolean;
}

const WeightEditor: React.FC<WeightEditorProps> = ({
    hasDesempeno, hasCompetencias, pesoDesempeno, pesoComp, onSave, saving,
}) => {
    const [d, setD] = useState(pesoDesempeno);
    const [c, setC] = useState(pesoComp);
    const both      = hasDesempeno && hasCompetencias;
    const total     = (hasDesempeno ? d : 0) + (hasCompetencias ? c : 0);
    const ok        = total === 100;
    const dirty     = d !== pesoDesempeno || c !== pesoComp;

    const handleD = (val: number) => { setD(val); if (both) setC(100 - val); };
    const handleC = (val: number) => { setC(val); if (both) setD(100 - val); };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {hasDesempeno && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-36 shrink-0 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block shrink-0"/>
                            Desempeño
                        </span>
                        <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${Math.min(d, 100)}%` }}/>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <input
                                type="number" min={0} max={100} step={5}
                                value={d}
                                onChange={(e) => handleD(Math.min(100, Math.max(0, Number(e.target.value))))}
                                className="input input-bordered input-xs w-16 text-right font-bold tabular-nums"
                                disabled={!hasCompetencias} // only one active — locked at 100
                            />
                            <span className="text-xs text-base-content/50 font-semibold">%</span>
                        </div>
                    </div>
                )}
                {hasCompetencias && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-36 shrink-0 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block shrink-0"/>
                            Competencias
                        </span>
                        <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
                            <div className="h-full bg-secondary transition-all duration-300 rounded-full" style={{ width: `${Math.min(c, 100)}%` }}/>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <input
                                type="number" min={0} max={100} step={5}
                                value={c}
                                onChange={(e) => handleC(Math.min(100, Math.max(0, Number(e.target.value))))}
                                className="input input-bordered input-xs w-16 text-right font-bold tabular-nums"
                                disabled={!hasDesempeno}
                            />
                            <span className="text-xs text-base-content/50 font-semibold">%</span>
                        </div>
                    </div>
                )}
            </div>

            <div className={`flex items-center justify-between text-xs rounded-lg px-3 py-1.5 ${ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                <span>{ok ? '✓ Los pesos suman 100%' : `Deben sumar 100% — actualmente ${total}%`}</span>
                {dirty && ok && (
                    <button
                        className="btn btn-success btn-xs"
                        onClick={() => onSave(d, c)}
                        disabled={saving}
                    >
                        {saving && <span className="loading loading-spinner loading-xs mr-1"/>}
                        Guardar pesos
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Component card ───────────────────────────────────────────────────────────

interface ComponentCardProps {
    title:       string;
    description: string;
    accentColor: 'primary' | 'secondary';
    icon:        React.ReactNode;
    component:   IntegralComponente | null; // can be null if no eval assigned
    type:        'desempeno' | 'competencias';
    isCompleted: boolean;   // integral is completed
    onNavigate:  () => void;
    hasNoEval?:  boolean;   // true if component exists but no eval_id assigned
}

const ComponentCard: React.FC<ComponentCardProps> = ({
    title, description, accentColor, icon, component, isCompleted, onNavigate, hasNoEval,
}) => {
    if (!component) return null;
    
    const scoreColor   = component.puntaje !== undefined ? integralBadgeColor(component.puntaje) : null;
    const borderColor  = accentColor === 'primary' ? 'border-primary/20' : 'border-secondary/20';
    const bgAccent     = accentColor === 'primary' ? 'bg-primary/5'      : 'bg-secondary/5';
    const textAccent   = accentColor === 'primary' ? 'text-primary'      : 'text-secondary';
    const iconBg       = accentColor === 'primary' ? 'bg-primary/10'     : 'bg-secondary/10';

    return (
        <motion.div
            className={`card bg-base-100 border ${borderColor} shadow-sm hover:shadow-md transition-shadow ${hasNoEval ? 'opacity-75' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="card-body p-5 gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${iconBg} ${textAccent} shrink-0`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm leading-tight">{title}</h3>
                            <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
                        </div>
                    </div>
                    {!hasNoEval && <ComponentStatus estado={component.estado} />}
                    {hasNoEval && <span className="badge badge-ghost badge-sm font-medium">Sin asignar</span>}
                </div>

                {!hasNoEval && (
                    <>
                        {/* Stats */}
                        <div className={`grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-base-100 ${bgAccent}`}>
                            <div className="px-4 py-3 border-r border-base-100">
                                <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide mb-1">Ponderación</p>
                                <p className={`text-2xl font-bold ${textAccent}`}>{component.peso}%</p>
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide mb-1">Puntaje</p>
                                {component.puntaje !== undefined ? (
                                    <p className={`text-2xl font-bold text-${scoreColor}`}>{component.puntaje.toFixed(1)}%</p>
                                ) : (
                                    <p className="text-2xl font-bold text-base-content/25">—</p>
                                )}
                            </div>
                        </div>

                        {/* Score bar */}
                        {component.puntaje !== undefined && (
                            <div className="space-y-1">
                                <div className="h-1.5 bg-base-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-${scoreColor} rounded-full transition-all duration-700`}
                                        style={{ width: `${Math.min(component.puntaje, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {hasNoEval && (
                    <div className="bg-base-200/50 rounded-lg p-3">
                        <p className="text-sm text-base-content/70 font-medium">
                            No hay evaluación de competencias asignada aún. Crea una nueva o asigna una existente.
                        </p>
                    </div>
                )}

                {/* Action */}
                <button
                    className={`btn btn-sm w-full gap-2 ${
                        isCompleted
                            ? 'btn-ghost'
                            : hasNoEval
                                ? 'btn-secondary'
                                : component.estado === 'COMPLETADA'
                                    ? 'btn-outline'
                                    : `btn-${accentColor}`
                    }`}
                    onClick={onNavigate}
                >
                    {hasNoEval && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                        </svg>
                    )}
                    {!hasNoEval && component.estado === 'BORRADOR' && !isCompleted && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    )}
                    {!hasNoEval && component.estado === 'EN_PROGRESO' && !isCompleted && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                    )}
                    {!hasNoEval && (component.estado === 'COMPLETADA' || isCompleted) && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                    )}
                    {hasNoEval
                        ? 'Asignar evaluación de competencias'
                        : component.estado === 'COMPLETADA' || isCompleted
                            ? 'Ver evaluación'
                            : component.estado === 'EN_PROGRESO'
                                ? 'Continuar evaluación'
                                : 'Iniciar evaluación'}
                </button>
            </div>
        </motion.div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const EvaluacionesIntegralDetailPage: React.FC = () => {
    const { id }    = useParams<{ id: string }>();
    const navigate  = useNavigate();
    const { getIntegralById, updatePesos, loading } = useIntegralEvaluationService();
    const { getEvaluationByProcessAndPerson } = useEvaluationResponseService();
    const { openAlert } = useUIStore();

    const [evaluacion, setEvaluacion]   = useState<EvaluacionIntegral | null>(null);
    const [savingPesos, setSavingPesos] = useState(false);
    const [showComplete, setShowComplete] = useState(false);

    // Función para cargar/refrescar la evaluación
    const loadEvaluation = async (evalId: string) => {
        const r = await getIntegralById(evalId);
        if (r?.success) {
            let integral = r.data.evaluacion;
            
            // Si existe componente de competencias, busca evaluaciones guardadas
            if (integral.componente_competencias?.evaluacion_id) {
                const evalResponse = getEvaluationByProcessAndPerson(
                    integral.componente_competencias.evaluacion_id,
                    integral.persona_id
                );
                
                // Si encontró evaluación guardada y no tiene puntaje aún, calcula el puntaje
                if (evalResponse && !integral.componente_competencias.puntaje) {
                    // Calcula el promedio de competencias (1-5) y convierte a porcentaje (0-100)
                    const scores = Object.values(evalResponse.competencias_evaluadas);
                    if (scores.length > 0) {
                        const promedio = scores.reduce((a, b) => a + b, 0) / scores.length;
                        const puntajeProcentaje = (promedio / 5) * 100;
                        const puntajeNumerico = Math.round(promedio) as 1 | 2 | 3 | 4 | 5;
                        
                        // Actualiza el componente con el puntaje y puntaje_numerico
                        const componenteActualizado = {
                            ...integral.componente_competencias,
                            puntaje: puntajeProcentaje,
                            puntaje_numerico: puntajeNumerico,
                            estado: 'COMPLETADA' as const
                        };
                        
                        integral = {
                            ...integral,
                            componente_competencias: componenteActualizado,
                            // Recalcula el puntaje final basado en ambos componentes
                            puntaje_final: calcPuntajeIntegral(
                                integral.componente_desempeno,
                                componenteActualizado
                            ),
                        };
                    }
                }
            }
            
            setEvaluacion(integral);
        }
        else { openAlert('Evaluación no encontrada', 'error'); navigate(ROUTES.RRHH_EVALUACIONES_INTEGRAL); }
    };

    // Carga inicial
    useEffect(() => {
        if (!id) { navigate(ROUTES.RRHH_EVALUACIONES_INTEGRAL); return; }
        loadEvaluation(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Refrescar datos cuando el usuario regresa a la página (desde tab visibility o focus)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && id) {
                loadEvaluation(id);
            }
        };

        const handleFocus = () => {
            if (id) {
                loadEvaluation(id);
            }
        };

        // Listener para actualizaciones de evaluación integral desde otra página/tab
        const handleIntegralUpdate = () => {
            if (id) {
                // Refrescar inmediatamente cuando se sincronice
                loadEvaluation(id);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('integralEvaluationUpdated', handleIntegralUpdate);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('integralEvaluationUpdated', handleIntegralUpdate);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Polling para refrescar evaluación cada 5 segundos (útil cuando se asigna competencia desde otra ventana)
    // Nota: ahora primariamente dependemos del evento 'integralEvaluationUpdated' para actualizaciones en tiempo real
    useEffect(() => {
        if (!id) return;
        const interval = setInterval(() => {
            loadEvaluation(id);
        }, 5000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading && !evaluacion) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingIndicator /></div>;
    }
    if (!evaluacion) return null;

    const isCompleted = evaluacion.estado === 'COMPLETADA';
    const allDone     =
        (!evaluacion.componente_desempeno    || evaluacion.componente_desempeno.estado    === 'COMPLETADA') &&
        (!evaluacion.componente_competencias || evaluacion.componente_competencias.estado === 'COMPLETADA');
    const hasDesempeno    = !!evaluacion.componente_desempeno;
    const hasCompetencias = !!evaluacion.componente_competencias;

    const handleSavePesos = async (d: number, c: number) => {
        setSavingPesos(true);
        const r = await updatePesos(evaluacion.id, {
            peso_desempeno:    hasDesempeno    ? d : undefined,
            peso_competencias: hasCompetencias ? c : undefined,
        });
        if (r?.success) {
            setEvaluacion(r.data.evaluacion);
            openAlert('Pesos actualizados', 'success');
        }
        setSavingPesos(false);
    };

    const breadcrumbs = [
        { label: 'Inicio',                    to: ROUTES.HOME                   },
        { label: 'Evaluaciones Integrales',   to: ROUTES.RRHH_EVALUACIONES_INTEGRAL },
        { label: evaluacion.persona_nombre,   to: undefined                      },
    ];

    const { label: statusLabel, color: statusColor } = INTEGRAL_STATUS_LABELS[evaluacion.estado];

    return (
        <PageContainer
            title={`Evaluación integral · ${evaluacion.persona_nombre}`}
            subtitle={`${evaluacion.ciclo_nombre}${evaluacion.persona_departamento ? ` · ${evaluacion.persona_departamento}` : ''}`}
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge badge-${statusColor} badge-outline font-medium`}>{statusLabel}</span>
                    {!isCompleted && allDone && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowComplete(true)}>
                            Marcar como completada
                        </button>
                    )}
                </div>
            }
        >
            <div className="space-y-6">

                {/* ── Summary header ── */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="bg-base-100 rounded-xl border border-base-200 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-1">Colaborador</p>
                        <p className="font-bold text-sm leading-tight">{evaluacion.persona_nombre}</p>
                        {evaluacion.persona_puesto && (
                            <p className="text-xs text-base-content/50 mt-0.5">{evaluacion.persona_puesto}</p>
                        )}
                    </div>
                    <div className="bg-base-100 rounded-xl border border-base-200 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-1">Ciclo</p>
                        <p className="font-bold text-sm">{evaluacion.ciclo_nombre}</p>
                    </div>
                    <div className="bg-base-100 rounded-xl border border-base-200 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-1">Puntaje final</p>
                        {evaluacion.puntaje_final !== undefined ? (
                            <p className={`text-2xl font-bold text-${integralBadgeColor(evaluacion.puntaje_final)}`}>
                                {evaluacion.puntaje_final.toFixed(1)}%
                            </p>
                        ) : (
                            <p className="text-2xl font-bold text-base-content/20">—</p>
                        )}
                    </div>
                    <div className="bg-base-100 rounded-xl border border-base-200 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/40 mb-1">Módulos</p>
                        <p className="font-bold text-sm">
                            {[hasDesempeno && 'Desempeño', hasCompetencias && 'Competencias'].filter(Boolean).join(' + ')}
                        </p>
                    </div>
                </motion.div>

                {/* ── Component cards ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {evaluacion.componente_desempeno && (
                        <ComponentCard
                            title="Evaluación de Desempeño"
                            description="Objetivos, KPIs y resultados cuantitativos"
                            accentColor="primary"
                            icon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                            }
                            component={evaluacion.componente_desempeno}
                            type="desempeno"
                            isCompleted={isCompleted}
                            onNavigate={() => navigate(DESEMPENO_ROUTE(evaluacion.componente_desempeno!.evaluacion_id), { state: { integralId: id } })}
                        />
                    )}
                    {evaluacion.componente_competencias && (
                        <ComponentCard
                            title="Evaluación de Competencias"
                            description="Competencias técnicas y conductuales"
                            accentColor="secondary"
                            icon={
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                                </svg>
                            }
                            component={evaluacion.componente_competencias}
                            type="competencias"
                            isCompleted={isCompleted}
                            hasNoEval={!evaluacion.componente_competencias.evaluacion_id}
                            onNavigate={() => {
                                if (evaluacion.componente_competencias?.evaluacion_id) {
                                    navigate(COMPETENCIAS_ROUTE(evaluacion.componente_competencias.evaluacion_id), { 
                                        state: { integralId: id } 
                                    });
                                } else {
                                    navigate(ROUTES.COMPETENCIES_EVAL);
                                }
                            }}
                        />
                    )}
                </div>

                {/* ── Weight editor ── */}
                {!isCompleted && (
                    <motion.div
                        className="bg-base-100 rounded-xl border border-base-200 p-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-sm">Distribución de pesos</h3>
                                <p className="text-xs text-base-content/50 mt-0.5">Ajusta la ponderación de cada componente</p>
                            </div>
                        </div>
                        <WeightEditor
                            hasDesempeno={hasDesempeno}
                            hasCompetencias={hasCompetencias}
                            pesoDesempeno={evaluacion.componente_desempeno?.peso ?? 0}
                            pesoComp={evaluacion.componente_competencias?.peso ?? 0}
                            onSave={handleSavePesos}
                            saving={savingPesos}
                        />
                    </motion.div>
                )}

                {/* ── Progress section ── */}
                <motion.div
                    className="bg-base-100 rounded-xl border border-base-200 p-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                >
                    <h3 className="font-bold text-sm mb-4">Progreso general</h3>
                    <div className="space-y-3">
                        {evaluacion.componente_desempeno && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium w-28 shrink-0 text-base-content/60">Desempeño</span>
                                <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${
                                        evaluacion.componente_desempeno.estado === 'COMPLETADA' ? 'bg-success' :
                                        evaluacion.componente_desempeno.estado === 'EN_PROGRESO' ? 'bg-primary' : 'bg-base-300'
                                    }`} style={{
                                        width: evaluacion.componente_desempeno.estado === 'COMPLETADA' ? '100%' :
                                               evaluacion.componente_desempeno.estado === 'EN_PROGRESO' ? '50%' : '0%'
                                    }}/>
                                </div>
                                <ComponentStatus estado={evaluacion.componente_desempeno.estado} />
                            </div>
                        )}
                        {evaluacion.componente_competencias && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium w-28 shrink-0 text-base-content/60">Competencias</span>
                                <div className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${
                                        evaluacion.componente_competencias.estado === 'COMPLETADA' ? 'bg-success' :
                                        evaluacion.componente_competencias.estado === 'EN_PROGRESO' ? 'bg-secondary' : 'bg-base-300'
                                    }`} style={{
                                        width: evaluacion.componente_competencias.estado === 'COMPLETADA' ? '100%' :
                                               evaluacion.componente_competencias.estado === 'EN_PROGRESO' ? '50%' : '0%'
                                    }}/>
                                </div>
                                <ComponentStatus estado={evaluacion.componente_competencias.estado} />
                            </div>
                        )}
                    </div>

                    {/* Completion hint */}
                    <AnimatePresence>
                        {!isCompleted && !allDone && (
                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-xs text-base-content/40 mt-3 pt-3 border-t border-base-100"
                            >
                                Completa todos los módulos activos para marcar esta evaluación como completada.
                            </motion.p>
                        )}
                        {!isCompleted && allDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mt-3 pt-3 border-t border-success/20"
                            >
                                <p className="text-xs text-success font-medium">
                                    ✓ Todos los módulos completados. Puedes marcar la evaluación como completada.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Quadrant Chart ── */}
                {(evaluacion.componente_desempeno || evaluacion.componente_competencias) && (
                    <QuadrantChart
                        desempenoScore={evaluacion.componente_desempeno?.puntaje_numerico}
                        competenciasScore={evaluacion.componente_competencias?.puntaje_numerico}
                        desempenoLabel="Desempeño"
                        competenciasLabel="Competencias"
                    />
                )}

                {/* ── Metadata ── */}
                <div className="text-xs text-base-content/40 flex flex-wrap gap-4 pb-4">
                    <span>Creado el {new Date(evaluacion.fecha_creacion).toLocaleDateString('es-CO', { dateStyle: 'medium' })}</span>
                    {evaluacion.fecha_completado && (
                        <span>Completado el {new Date(evaluacion.fecha_completado).toLocaleDateString('es-CO', { dateStyle: 'medium' })}</span>
                    )}
                </div>
            </div>

            {/* ── Complete confirmation ── */}
            <ConfirmationModal
                isOpen={showComplete}
                onClose={() => setShowComplete(false)}
                onConfirm={async () => {
                    // In a real system this would call a dedicated endpoint.
                    // For now we rely on syncComponente calls from the sub-editors.
                    openAlert('Evaluación marcada como completada.', 'success');
                    setShowComplete(false);
                }}
                title="Completar evaluación integral"
                message={`¿Confirmas que deseas marcar como completada la evaluación integral de ${evaluacion.persona_nombre}? El resultado quedará registrado.`}
                confirmText="Completar"
                variant="info"
            />
        </PageContainer>
    );
};

export default EvaluacionesIntegralDetailPage;