import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import StatusBadge from '../../components/Common/StatusBadge';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
    CompetencyAssignment,
    ProcessCompetencyItem,
    SaveEvaluationResponsePayload,
    EvaluationResponseItem,
} from '../../services/competencyEvaluationService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import { useIntegralEvaluationService } from '../../services/integralEvaluationService';
import {
    EstadoAsignacion,
    ESTADO_ASIGNACION_LABELS,
    ESTADO_ASIGNACION_BADGE,
} from '../../services/evaluationAssignmentService';
import Button from '../../components/Common/Button';
import { Check, Info, ArrowLeft, ListChecks, ClipboardList } from '../../components/Common/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompetencyEvaluationResponse {
    [personId: string]: {
        [competencyId: string]: number;
    };
}

type TabId = 'competencias' | 'comentarios';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

/** Estados desde los cuales el evaluador aún puede editar/guardar (§2.3). */
const EDITABLE_ESTADOS: EstadoAsignacion[] = ['PENDIENTE', 'EN_PROGRESO', 'DEVUELTO'];

const ESTADO_BADGE_MAP = Object.fromEntries(
    Object.entries(ESTADO_ASIGNACION_BADGE).map(([k, color]) => [
        k,
        { color, label: ESTADO_ASIGNACION_LABELS[k as EstadoAsignacion] },
    ])
) as Record<EstadoAsignacion, { color: string; label: string }>;

// ─── Comments Section ─────────────────────────────────────────────────────────

interface CommentsSectionProps {
    textComment: string;
    onTextChange: (value: string) => void;
    disabled?: boolean;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ textComment, onTextChange, disabled }) => {
    const [activeCommentTab, setActiveCommentTab] = useState<'text' | 'video'>('text');

    return (
        <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-base-100 border border-base-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <ClipboardList size={16} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-base-content">Comentarios del evaluador</h4>
                        <p className="text-xs text-base-content/60 mt-0.5">
                            Proporciona observaciones adicionales sobre el desempeño de la persona evaluada.
                            Puedes escribir un comentario de texto o grabar un video.
                        </p>
                    </div>
                </div>
            </div>

            {/* Inner tabs: text vs video */}
            <div className="flex gap-1 p-1 bg-base-200 rounded-lg w-fit">
                <button
                    type="button"
                    onClick={() => setActiveCommentTab('text')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeCommentTab === 'text'
                            ? 'bg-base-100 text-base-content shadow-sm'
                            : 'text-base-content/60 hover:text-base-content'
                    }`}
                >
                    <ClipboardList size={16} />
                    Comentario escrito
                </button>
                <button
                    type="button"
                    disabled
                    title="Próximamente: el comentario en video estará disponible"
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-not-allowed opacity-50"
                >
                    Video
                    <span className="badge badge-ghost badge-xs">Próximamente</span>
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeCommentTab === 'text' ? (
                    <motion.div
                        key="text"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                    >
                        <label className="block">
                            <span className="text-sm font-medium text-base-content mb-2 block">
                                Observaciones generales
                            </span>
                            <textarea
                                value={textComment}
                                onChange={(e) => onTextChange(e.target.value)}
                                placeholder="Escribe aquí tus comentarios sobre el desempeño de la persona evaluada. Puedes mencionar fortalezas, áreas de mejora, logros destacados, etc."
                                rows={6}
                                disabled={disabled}
                                className="textarea textarea-bordered w-full text-sm resize-none focus:outline-none focus:border-primary disabled:opacity-60"
                            />
                        </label>
                        <div className="flex items-center justify-between text-xs text-base-content/40">
                            <span>Los comentarios son opcionales pero enriquecen la evaluación</span>
                            <span>{textComment.length} caracteres</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="video"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CompetencyEvaluationEvaluatorDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { processId } = useParams<{ processId: string }>();
    const [searchParams] = useSearchParams();
    const personId = searchParams.get('personId');
    const asignacionId = searchParams.get('asignacionId');
    const tipo = searchParams.get('tipo');
    const integralId = (location.state as { integralId?: string } | null)?.integralId;
    const { openAlert } = useUIStore();

    const { getCompetencyEvaluationDetail, getMyAssignments, getProcessCompetencies, startAssignment, saveResponse, getResponseByAssignment } =
        useCompetencyEvaluationService();
    const { getCompetencyById } = useCompetencyService();
    const { syncComponente } = useIntegralEvaluationService();

    // State
    const [loading, setLoading] = useState(true);
    const [process, setProcess] = useState<CompetencyEvaluationDetail | null>(null);
    const [assignment, setAssignment] = useState<CompetencyAssignment | null>(null);
    const [existingResponse, setExistingResponse] = useState<EvaluationResponseItem | null>(null);
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [responses, setResponses] = useState<CompetencyEvaluationResponse>({});
    const [isSaving, setIsSaving] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState<TabId>('competencias');
    const [textComment, setTextComment] = useState('');

    const tabs: Tab[] = [
        { id: 'competencias', label: 'Competencias', icon: <ListChecks size={16} /> },
        { id: 'comentarios', label: 'Comentarios', icon: <ClipboardList size={16} /> },
    ];

    const readOnly = assignment
        ? !EDITABLE_ESTADOS.includes(assignment.estado)
        : true;
    const colaboradorNombre = assignment?.colaborador_nombre ?? '';

    // Load data
    useEffect(() => {
        const load = async () => {
            if (!processId || !personId || !asignacionId) {
                openAlert('Faltan parámetros requeridos', 'error');
                const fallback = tipo === 'AUTOEVALUACION' ? ROUTES.MI_COMPETENCIAS_EVAL : ROUTES.GRADING_PENDING;
                navigate(fallback);
                return;
            }

            setLoading(true);
            try {
                // 1. Asignación (self-scoped): estado, nombre del colaborador y flags de corrección
                let foundAssignment: CompetencyAssignment | null = null;
                const [assignRes, processRes] = await Promise.all([
                    getMyAssignments({ proceso_id: processId, colaborador_id: personId, limite: 100 }),
                    getCompetencyEvaluationDetail(processId),
                ]);

                if (assignRes?.success) {
                    const asignaciones = (assignRes.data?.asignaciones ?? []) as CompetencyAssignment[];
                    foundAssignment = asignaciones.find((a) => a.id === asignacionId) ?? null;
                    setAssignment(foundAssignment);
                }
                if (processRes?.success && processRes.data?.evaluacion) {
                    setProcess(processRes.data.evaluacion);
                }

                // 2. Competencias activas del proceso (§6.1, paginado) ordenadas por `orden`
                const items: ProcessCompetencyItem[] = [];
                let pagina = 1;
                let totalPaginas = 1;
                do {
                    const compRes = await getProcessCompetencies(processId, { pagina, limite: 100 });
                    if (!compRes?.success || !compRes.data) break;
                    items.push(...((compRes.data.datos ?? []) as ProcessCompetencyItem[]));
                    totalPaginas = compRes.data.paginacion?.total_paginas ?? 1;
                    pagina += 1;
                } while (pagina <= totalPaginas);

                const ordered = [...items].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

                // 3. Detalle de cada competencia para obtener `definiciones_niveles`
                const detalles = await Promise.all(
                    ordered.map(async (item) => {
                        const res = await getCompetencyById(item.competencia_id);
                        return res?.success && res.data?.competencia
                            ? (res.data.competencia as Competency)
                            : null;
                    })
                );

                const merged: Competency[] = ordered.map((item, idx) => {
                    const full = detalles[idx];
                    const escala = full?.escala ?? item.escala ?? 1;
                    const definiciones_niveles = full?.definiciones_niveles?.length
                        ? full.definiciones_niveles
                        : Array.from({ length: escala }, (_, i) => ({
                              nivel: i + 1,
                              nombre: `Nivel ${i + 1}`,
                              descripcion: '',
                          }));
                    return {
                        id: item.competencia_id,
                        nombre: full?.nombre ?? item.nombre,
                        descripcion: full?.descripcion ?? item.descripcion,
                        categoria: full?.categoria ?? '',
                        escala,
                        definiciones_niveles,
                    };
                });
                setCompetencies(merged);

                // 4. Respuesta existente de esta asignación (§9.4)
                const respRes = await getResponseByAssignment(asignacionId);
                const savedResponse: EvaluationResponseItem | null =
                    respRes?.success && respRes.data?.respuesta ? respRes.data.respuesta : null;
                setExistingResponse(savedResponse);
                setResponses({ [personId]: savedResponse?.competencias_evaluadas ?? {} });
                setTextComment(savedResponse?.comentarios?.text ?? '');

                // 5. Marcar EN_PROGRESO al abrir una asignación pendiente (§9.3).
                //    Solo desde PENDIENTE: desde COMPLETADO/EN_REVISION la re-apertura
                //    cuenta como corrección y la dispara la lista ("Corregir").
                if (foundAssignment?.estado === 'PENDIENTE') {
                    const startRes = await startAssignment(asignacionId);
                    if (startRes?.success && startRes.data?.asignacion) {
                        setAssignment(startRes.data.asignacion as CompetencyAssignment);
                    }
                }
            } catch (error) {
                openAlert('Error al cargar los datos', 'error');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processId, personId, asignacionId]);

    // Handlers
    const handleSelectLevel = (competencyId: string, level: number) => {
        if (readOnly) return;
        setResponses((prev) => ({
            ...prev,
            [personId!]: {
                ...prev[personId!],
                [competencyId]: level,
            },
        }));
    };

    const handleSave = async () => {
        if (!process || !assignment || !processId || !personId || !asignacionId) return;

        const evaluated = responses[personId] ?? {};
        const faltantes = competencies.filter((c) => typeof evaluated[c.id] !== 'number');
        if (faltantes.length > 0) {
            openAlert(`Debes evaluar todas las ${competencies.length} competencias`, 'warning');
            setActiveTab('competencias');
            return;
        }

        setIsSaving(true);
        try {
            const payload: SaveEvaluationResponsePayload = {
                asignacion_id: asignacionId,
                proceso_id: processId,
                colaborador_id: personId,
                competencias_evaluadas: evaluated,
                comentarios: textComment.trim().length > 0 ? { text: textComment } : {},
            };

            const result = await saveResponse(payload);

            if (result?.success) {
                const saved: EvaluationResponseItem | undefined = result.data?.respuesta;

                // If part of an integral evaluation, sync the component
                if (integralId && saved && saved.puntaje_normalizado !== undefined && saved.puntaje_numerico !== undefined) {
                    await syncComponente(integralId, 'competencias', {
                        puntaje: saved.puntaje_normalizado,
                        puntaje_numerico: saved.puntaje_numerico,
                        escala_maxima: saved.escala_maxima,
                        estado: 'COMPLETADA',
                    });

                    window.dispatchEvent(new Event('integralEvaluationUpdated'));
                }

                openAlert(
                    saved?.estado === 'EN_REVISION'
                        ? 'Evaluación enviada correctamente. Queda pendiente de revisión.'
                        : 'Evaluación guardada correctamente',
                    'success'
                );
                const fallback = tipo === 'AUTOEVALUACION' ? ROUTES.MI_COMPETENCIAS_EVAL : ROUTES.GRADING_PENDING;
                navigate(fallback);
            }
            // En caso de null el servicio ya mostró el mensaje del backend
        } catch (error) {
            openAlert('Error al guardar la evaluación', 'error');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Guards
    if (loading) return <LoadingIndicator />;

    if (!process || !assignment) {
        return (
            <PageContainer
                title="Error"
                subtitle="No se encontraron los datos solicitados"
                breadcrumbs={[
                    { label: 'Inicio', to: ROUTES.HOME },
                    { label: ROLE_LABELS[UserRole.EVALUATOR], to: undefined },
                    { label: 'Mis Evaluaciones', to: ROUTES.GRADING_PENDING },
                ]}
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="text-6xl mb-4">❌</div>
                        <h3 className="text-lg font-semibold text-base-content mb-2">
                            Evaluación no encontrada
                        </h3>
                        <p className="text-sm text-base-content/60 mb-4">
                            La evaluación solicitada no existe.
                        </p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(ROUTES.GRADING_PENDING)}
                        >
                            Volver a evaluaciones
                        </Button>
                    </div>
                </div>
            </PageContainer>
        );
    }

    const evaluatedCount = Object.keys(responses[personId!] || {}).length;
    const allEvaluated = evaluatedCount === competencies.length;

    const isAutoevaluacion = tipo === 'AUTOEVALUACION';

    const breadcrumbs = isAutoevaluacion
        ? [
            { label: 'Inicio', to: ROUTES.HOME },
            { label: 'Empleado', to: undefined },
            { label: 'Autoevaluación Competencias', to: ROUTES.MI_COMPETENCIAS_EVAL },
            { label: colaboradorNombre, to: undefined },
        ]
        : [
            { label: 'Inicio', to: ROUTES.HOME },
            { label: 'Evaluador', to: undefined },
            { label: 'Mis Evaluaciones', to: ROUTES.GRADING_PENDING },
            { label: colaboradorNombre, to: undefined },
        ];

    const returnRoute = isAutoevaluacion ? ROUTES.MI_COMPETENCIAS_EVAL : ROUTES.GRADING_PENDING;

    return (
        <PageContainer
            title={`${isAutoevaluacion ? 'Autoevaluación' : 'Evaluar'}: ${colaboradorNombre}`}
            subtitle={process.nombre}
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(returnRoute)}
                        leftIcon={ArrowLeft}
                    >
                        Volver
                    </Button>

                    {assignment && (
                        <div className="flex items-center gap-2">
                            <StatusBadge estado={assignment.estado} map={ESTADO_BADGE_MAP} size="sm" />
                            {readOnly && (
                                <span className="text-xs text-base-content/60">
                                    Vista de solo lectura
                                    {existingResponse?.puntaje_numerico !== undefined &&
                                        ` · Puntaje ${existingResponse.puntaje_numerico}/5`}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress */}
                {competencies.length > 0 && (
                    <div className="bg-base-100 border border-base-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-base-content">
                                Competencias evaluadas
                            </span>
                            <span className="text-sm font-bold text-primary">
                                {evaluatedCount}/{competencies.length}
                            </span>
                        </div>
                        <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(evaluatedCount / competencies.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="border-b border-base-200">
                    <div className="flex gap-0">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                        isActive
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-base-content/60 hover:text-base-content hover:border-base-300'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}

                                    {/* Badge: pending competencies count on the competencias tab */}
                                    {tab.id === 'competencias' && !allEvaluated && competencies.length > 0 && (
                                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning text-warning-content text-[10px] font-bold">
                                            {competencies.length - evaluatedCount}
                                        </span>
                                    )}
                                    {tab.id === 'competencias' && allEvaluated && (
                                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-success text-success-content text-[10px]">
                                            <Check size={16} />
                                        </span>
                                    )}

                                    {/* Comment dot indicator */}
                                    {tab.id === 'comentarios' && textComment.trim().length > 0 && (
                                        <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'competencias' && (
                        <motion.div
                            key="competencias"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.18 }}
                            className="space-y-4"
                        >
                            {competencies.map((comp) => {
                                const selectedLevel = responses[personId!]?.[comp.id];
                                const selectedLevelObj = comp.definiciones_niveles?.find(
                                    (l) => l.nivel === selectedLevel
                                );

                                return (
                                    <div
                                        key={comp.id}
                                        className="border border-base-200 rounded-lg p-4 bg-base-50"
                                    >
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-base-content">{comp.nombre}</h4>
                                            <p className="text-sm text-base-content/60 mt-1">{comp.descripcion}</p>
                                        </div>

                                        <div className="space-y-2">
                                            {comp.definiciones_niveles?.map((level) => (
                                                <button
                                                    key={level.nivel}
                                                    type="button"
                                                    disabled={readOnly}
                                                    onClick={() => handleSelectLevel(comp.id, level.nivel)}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                        selectedLevel === level.nivel
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-base-200 hover:bg-base-100'
                                                    } ${readOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                                                selectedLevel === level.nivel
                                                                    ? 'bg-primary border-primary text-primary-content'
                                                                    : 'border-base-300'
                                                            }`}
                                                        >
                                                            {selectedLevel === level.nivel && <Check size={16} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{level.nombre}</p>
                                                            {level.descripcion && (
                                                                <p className="text-xs text-base-content/60 mt-0.5">
                                                                    {level.descripcion}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {selectedLevelObj && (
                                            <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20 flex gap-2">
                                                <Info size={16} />
                                                <p className="text-xs text-primary">
                                                    Nivel seleccionado:{' '}
                                                    <strong>{selectedLevelObj.nombre}</strong>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {activeTab === 'comentarios' && (
                        <motion.div
                            key="comentarios"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.18 }}
                        >
                            <CommentsSection
                                textComment={textComment}
                                onTextChange={setTextComment}
                                disabled={readOnly}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t border-base-200">
                    {readOnly ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(returnRoute)}
                        >
                            Volver
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(returnRoute)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                disabled={!allEvaluated || isSaving}
                                loading={isSaving}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Evaluación'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default CompetencyEvaluationEvaluatorDetailPage;
