import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import VideoRecorder from '../../components/Common/VideoRecorder';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
} from '../../services/competencyEvaluationService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import { usePersonService, Person } from '../../services/personService';
import { useEvaluationResponseService, EvaluationComments } from '../../services/evaluationResponseService';
import { useIntegralEvaluationService } from '../../services/integralEvaluationService';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const IconInfo = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconArrowLeft = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const IconListCheck = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const IconMessageSquare = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
);

const IconVideo = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

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

// ─── Comments Section ─────────────────────────────────────────────────────────

interface CommentsSectionProps {
    textComment: string;
    onTextChange: (value: string) => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ textComment, onTextChange }) => {
    const [activeCommentTab, setActiveCommentTab] = useState<'text' | 'video'>('text');

    return (
        <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-base-100 border border-base-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <IconMessageSquare />
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
                    <IconMessageSquare />
                    Comentario escrito
                </button>
                <button
                    type="button"
                    onClick={() => setActiveCommentTab('video')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeCommentTab === 'video'
                            ? 'bg-base-100 text-base-content shadow-sm'
                            : 'text-base-content/60 hover:text-base-content'
                    }`}
                >
                    <IconVideo />
                    Comentario en video
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
                                className="textarea textarea-bordered w-full text-sm resize-none focus:outline-none focus:border-primary"
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
                    >
                        <VideoRecorder />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CompetencyEvaluationDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { processId } = useParams<{ processId: string }>();
    const [searchParams] = useSearchParams();
    const personId = searchParams.get('personId');
    const integralId = (location.state as any)?.integralId;
    const { openAlert } = useUIStore();

    const { getCompetencyEvaluationDetail } = useCompetencyEvaluationService();
    const { getCompetencies } = useCompetencyService();
    const { getPersonById } = usePersonService();
    const { saveEvaluationResponse, getEvaluationResponseByKey } = useEvaluationResponseService();
    const { syncComponente } = useIntegralEvaluationService();

    // State
    const [loading, setLoading] = useState(true);
    const [process, setProcess] = useState<CompetencyEvaluationDetail | null>(null);
    const [person, setPerson] = useState<Person | null>(null);
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [responses, setResponses] = useState<CompetencyEvaluationResponse>({});
    const [isSaving, setIsSaving] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState<TabId>('competencias');
    const [textComment, setTextComment] = useState('');

    const tabs: Tab[] = [
        { id: 'competencias', label: 'Competencias', icon: <IconListCheck /> },
        { id: 'comentarios', label: 'Comentarios', icon: <IconMessageSquare /> },
    ];

    // Load data
    useEffect(() => {
        const load = async () => {
            if (!processId || !personId) {
                openAlert('Faltan parámetros requeridos', 'error');
                navigate(ROUTES.GRADING_PENDING);
                return;
            }

            setLoading(true);
            try {
                const processRes = await getCompetencyEvaluationDetail(processId);
                if (processRes?.success && processRes.data?.evaluacion) {
                    setProcess(processRes.data.evaluacion);
                }

                const personRes = await getPersonById(personId);
                if (personRes?.success && personRes.data?.persona) {
                    setPerson(personRes.data.persona);
                }

                const compRes = await getCompetencies({ items_por_pagina: 200 });
                if (compRes?.success && processRes?.success && processRes.data?.evaluacion) {
                    const allComps = compRes.data.competencias || [];
                    const assignedCompIds = processRes.data.evaluacion.competencias_asignadas || [];
                    const assignedComps = allComps.filter((comp: Competency) =>
                        assignedCompIds.includes(comp.id)
                    );
                    setCompetencies(assignedComps);
                }

                // Load existing responses if available
                if (personId) {
                    const MOCK_EVALUATOR_ID = 'usr_9';
                    const existingRes = await getEvaluationResponseByKey(MOCK_EVALUATOR_ID, processId, personId);
                    
                    //console.log('Loaded evaluation response:', existingRes);
                    
                    if (existingRes?.success && existingRes.data?.respuesta) {
                        // Load saved responses
                        const savedResponse = existingRes.data.respuesta;
                        //console.log('Restoring saved responses:', savedResponse.competencias_evaluadas);
                        setResponses({
                            [personId]: savedResponse.competencias_evaluadas || {},
                        });
                        // Load saved comments if any
                        if (savedResponse.comentarios?.text) {
                            setTextComment(savedResponse.comentarios.text);
                        }
                    } else {
                        // No saved responses, start fresh
                        //console.log('No saved responses found, starting fresh');
                        setResponses({ [personId]: {} });
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
    }, [processId, personId]);

    // Handlers
    const handleSelectLevel = (competencyId: string, level: number) => {
        setResponses((prev) => ({
            ...prev,
            [personId!]: {
                ...prev[personId!],
                [competencyId]: level,
            },
        }));
    };

    const handleSave = async () => {
        if (!person || !process) return;

        const evaluatedCount = Object.keys(responses[personId!] || {}).length;
        if (evaluatedCount !== competencies.length) {
            openAlert(`Debes evaluar todas las ${competencies.length} competencias`, 'warning');
            setActiveTab('competencias');
            return;
        }

        setIsSaving(true);
        try {
            // Mock evaluator ID for development - TODO: Replace with actual currentUser
            const MOCK_EVALUATOR_ID = 'usr_9';

            // Prepare comments object
            const comentarios: EvaluationComments = {};
            if (textComment.trim().length > 0) {
                comentarios.text = textComment;
            }

            const saveData = {
                evaluador_id: MOCK_EVALUATOR_ID,
                proceso_id: processId!,
                persona_id: personId!,
                competencias_evaluadas: responses[personId!],
                comentarios,
                estado: 'COMPLETADO' as const,
            };
            
            //console.log('Saving evaluation data:', saveData);

            // Save evaluation response
            const result = await saveEvaluationResponse(saveData);

            //console.log('Save result:', result);

            if (result?.success) {
                // If part of an integral evaluation, sync the component
                if (integralId && result.data?.respuesta) {
                    const evalResponse = result.data.respuesta;
                    
                    // Use the scores already calculated in the service
                    if (evalResponse.puntaje_normalizado !== undefined && evalResponse.puntaje_numerico !== undefined) {
                        // Sync competencias component with integral evaluation
                        await syncComponente(integralId, 'competencias', {
                            puntaje: evalResponse.puntaje_normalizado,       // For display (0-100%)
                            puntaje_numerico: evalResponse.puntaje_numerico, // For integral (e.g., 3.5)
                            escala_maxima: evalResponse.escala_maxima,       // Maximum scale (e.g., 4 or 5)
                            estado: 'COMPLETADA',
                        });
                        
                        // Notify integral evaluation page to refresh
                        window.dispatchEvent(new Event('integralEvaluationUpdated'));
                    }
                }
                
                openAlert('Evaluación guardada correctamente', 'success');
                navigate(ROUTES.GRADING_PENDING);
            } else {
                openAlert('Error al guardar la evaluación', 'error');
            }
        } catch (error) {
            openAlert('Error al guardar la evaluación', 'error');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Guards
    if (loading) return <LoadingIndicator />;

    if (!process || !person) {
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
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.GRADING_PENDING)}
                            className="btn btn-primary btn-sm"
                        >
                            Volver a evaluaciones
                        </button>
                    </div>
                </div>
            </PageContainer>
        );
    }

    const evaluatedCount = Object.keys(responses[personId!] || {}).length;
    const allEvaluated = evaluatedCount === competencies.length;

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Evaluador', to: undefined },
        { label: 'Mis Evaluaciones', to: ROUTES.GRADING_PENDING },
        { label: `${person.nombres} ${person.apellidos}`, to: undefined },
    ];

    return (
        <PageContainer
            title={`Evaluar: ${person.nombres} ${person.apellidos}`}
            subtitle={process.nombre}
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.GRADING_PENDING)}
                        className="btn btn-ghost btn-sm gap-2"
                    >
                        <IconArrowLeft />
                        Volver
                    </button>
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
                                            <IconCheck />
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
                                                    onClick={() => handleSelectLevel(comp.id, level.nivel)}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                        selectedLevel === level.nivel
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-base-200 hover:bg-base-100'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                                                selectedLevel === level.nivel
                                                                    ? 'bg-primary border-primary text-primary-content'
                                                                    : 'border-base-300'
                                                            }`}
                                                        >
                                                            {selectedLevel === level.nivel && <IconCheck />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-sm">{level.nombre}</p>
                                                            <p className="text-xs text-base-content/60 mt-0.5">
                                                                {level.descripcion}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {selectedLevelObj && (
                                            <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20 flex gap-2">
                                                <IconInfo />
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
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t border-base-200">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.GRADING_PENDING)}
                        className="btn btn-ghost btn-sm"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!allEvaluated || isSaving}
                        className="btn btn-primary btn-sm"
                    >
                        {isSaving ? (
                            <>
                                <span className="loading loading-spinner loading-xs" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Evaluación'
                        )}
                    </button>
                </div>
            </div>
        </PageContainer>
    );
};

export default CompetencyEvaluationDetailPage;