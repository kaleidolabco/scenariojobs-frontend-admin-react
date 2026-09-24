import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Tabs from '../../components/Common/Tabs';
import EmailConfigTab from '../../components/EmailConfig/EmailConfigTab';
import Button from '../../components/Common/Button';
import { ROUTES } from '../../constants/routes';
import { EstadoProcesoCompetencia } from '../../services/competencyEvaluationService';
import useCompetencyEvaluationDetail from '../../hooks/useCompetencyEvaluationDetail';
import ConfirmationModal from '../../components/Common/ConfirmationModal';

import CompetenciesTab from '../../components/CompetencyEvaluation/CompetenciesTab';
import ParticipantsTab from '../../components/CompetencyEvaluation/ParticipantsTab';
import GeneralTab from '../../components/CompetencyEvaluation/GeneralTab';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<EstadoProcesoCompetencia, string> = {
    BORRADOR: 'badge-warning',
    PUBLICADO: 'badge-success',
    EN_CALIFICACION: 'badge-info',
    EN_REVISION: 'badge-warning',
    CERRADO: 'badge-success',
    ARCHIVADO: 'badge-ghost',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CompetencyEvaluationAdminDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const {
        evaluation,
        loading,
        dirtyGeneral,
        dirtyCompetencias,
        dirtyParticipantes,
        dirtyCorreos,
        savingGeneral,
        savingCompetencias,
        savingParticipantes,
        savingCorreos,
        formData,
        config,
        errors,
        origen,
        sugerencia,
        derivedDirty,
        activeTab,
        setActiveTab,
        totalWeight,
        registrarPersonas,
        setServerParticipantIds,
        handleChange,
        handleToggleCompetency,
        handleUpdateCompetencyItems,
        handleWeightChange,
        handleClearCompetencies,
        handleOrigenChange,
        applySugerencias,
        handleToggleTipoEvaluacion,
        handleTipoPesoChange,
        handleCalibracionChange,
        handleCorreccionChange,
        handleToggleRevisionObligatoria,
        saveGeneral,
        saveCompetenciasTab,
        saveParticipantsTab,
        saveEmailsTab,
        updateEstadoProceso,
    } = useCompetencyEvaluationDetail(id);

    // ── Publish confirmation modal state ────────────────────────────────────────
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);

    // ── Current process state from evaluation (authoritative source) ────────────
    const currentState = (evaluation?.estado_flujo || evaluation?.estado || 'BORRADOR') as EstadoProcesoCompetencia;
    const isBorrador = currentState === 'BORRADOR';

    // ── Tabs (con badges) ──────────────────────────────────────────────────────

    const compsCount = formData.competencias_asignadas.length > 0 ? formData.competencias_asignadas.length : (evaluation?.total_competencias ?? 0);
    const partsCount = formData.personas_a_evaluar.length > 0 ? formData.personas_a_evaluar.length : (evaluation?.total_participantes ?? 0);

    const weightOk = totalWeight === 100;
    const tabsDef = [
        { id: 'general', label: 'Información General' },
        {
            id: 'competencias',
            label: 'Competencias',
            badge: (
                <span className="flex items-center gap-1 ml-1">
                    {compsCount > 0 && (
                        <span className="badge badge-sm badge-primary">{compsCount}</span>
                    )}
                    {compsCount > 0 && (
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
            badge: partsCount > 0 && (
                <span className="badge badge-sm badge-primary ml-1">{partsCount}</span>
            ),
        },
        { id: 'correos', label: 'Correos' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: ROLE_LABELS[UserRole.HR_MANAGER], to: undefined },
        { label: 'Evaluación de Competencias', to: ROUTES.COMPETENCIES_EVAL },
        { label: evaluation?.nombre || '…', to: undefined },
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

    const statusLabelMap: Record<EstadoProcesoCompetencia, string> = {
        BORRADOR: 'Borrador',
        PUBLICADO: 'Publicado',
        EN_CALIFICACION: 'En Calificación',
        EN_REVISION: 'En Revisión',
        CERRADO: 'Cerrado',
        ARCHIVADO: 'Archivado',
    };

    return (
        <PageContainer
            title={formData.nombre || evaluation.nombre}
            subtitle={isBorrador ? 'Edita el proceso de evaluación de competencias' : `Proceso en estado: ${statusLabelMap[currentState]} — Solo visualización y ajustes de políticas`}
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[currentState]} badge-outline font-medium`}>
                        {statusLabelMap[currentState]}
                    </span>
                    {isBorrador && (
                        <Button
                            variant="info"
                            onClick={() => setPublishConfirmOpen(true)}
                            disabled={publishLoading}
                            loading={publishLoading}
                        >
                            Publicar
                        </Button>
                    )}
                    {/* <Button variant="ghost" onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)}>
                        Cancelar
                    </Button> */}
                </div>
            }
        >
            {isBorrador && (
                <div className="alert alert-info mb-4">
                    <span>
                        El proceso está en estado <strong>Borrador</strong>. 
                        Puedes editar toda la configuración. Al publicar, se generarán las asignaciones de evaluadores
                        y las competencias, participantes y tipos de evaluación quedarán bloqueados.
                        Solo se podrán ajustar las políticas de corrección y calibración.
                    </span>
                </div>
            )}
            {!isBorrador && (
                <div className="alert alert-warning mb-4">
                    <span>
                        El proceso está en estado <strong>{statusLabelMap[currentState]}</strong>. 
                        La edición de competencias, participantes y configuración de tipos de evaluación está bloqueada.
                        Solo se pueden ajustar las políticas de corrección y calibración en la pestaña "Información General".
                    </span>
                </div>
            )}

            <Tabs
                tabs={tabsDef}
                activeTab={activeTab}
                onChange={(t) => setActiveTab(t as typeof activeTab)}
                variant="bordered"
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
                        <GeneralTab
                            formData={{
                                nombre: formData.nombre,
                                descripcion: formData.descripcion,
                            }}
                            config={config}
                            errors={errors}
                            onFieldChange={handleChange}
                            onTipoToggle={handleToggleTipoEvaluacion}
                            onTipoPesoChange={handleTipoPesoChange}
                            onCalibracionChange={handleCalibracionChange}
                            onCorreccionChange={handleCorreccionChange}
                            onRevisionObligatoriaToggle={handleToggleRevisionObligatoria}
                            dirty={dirtyGeneral}
                            saving={savingGeneral}
                            onSave={saveGeneral}
                        />
                    )}

                    {activeTab === 'competencias' && (
                        <CompetenciesTab
                            selectedIds={formData.competencias_asignadas}
                            competencyItems={formData.competencias_items}
                            origen={origen}
                            onOrigenChange={handleOrigenChange}
                            sugerencia={sugerencia}
                            derivedDirty={derivedDirty}
                            onAplicar={applySugerencias}
                            onToggle={handleToggleCompetency}
                            onWeightChange={handleWeightChange}
                            onUpdateItems={handleUpdateCompetencyItems}
                            onClearAll={handleClearCompetencies}
                            dirty={dirtyCompetencias}
                            saving={savingCompetencias}
                            onSave={saveCompetenciasTab}
                        />
                    )}

                    {activeTab === 'participantes' && evaluation && (
                        <ParticipantsTab
                            evaluationId={evaluation.id}
                            selectedPersonIds={formData.personas_a_evaluar}
                            evaluadoresPorPersona={formData.evaluadores_por_persona}
                            onPersonsChange={(ids) => handleChange('personas_a_evaluar', ids)}
                            onEvaluadoresPorPersonaChange={(map) => handleChange('evaluadores_por_persona', map)}
                            onPersonasDetalle={registrarPersonas}
                            onServerParticipantsLoaded={setServerParticipantIds}
                            dirty={dirtyParticipantes}
                            saving={savingParticipantes}
                            onSave={saveParticipantsTab}
                        />
                    )}

                    {activeTab === 'correos' && evaluation && (
                        <EmailConfigTab
                            evaluationId={evaluation.id}
                            evaluationType="competencia"
                            data={{ templates_asociadas: formData.templates_asociadas }}
                            onChange={(data) => handleChange('templates_asociadas', data.templates_asociadas)}
                            dirty={dirtyCorreos}
                            saving={savingCorreos}
                            onSave={saveEmailsTab}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Publish Confirmation Modal */}
            <ConfirmationModal
                isOpen={publishConfirmOpen}
                onClose={() => setPublishConfirmOpen(false)}
                onConfirm={async () => {
                    setPublishLoading(true);
                    try {
                        const res = await updateEstadoProceso(id!, 'PUBLICADO');
                        if (res?.success) {
                            setPublishConfirmOpen(false);
                            // Reload the page to reflect new state
                            window.location.reload();
                        }
                    } finally {
                        setPublishLoading(false);
                    }
                }}
                title="Publicar proceso de evaluación"
                message={
                    <>
                        <p className="mb-4">
                            ¿Estás seguro de que quieres publicar este proceso de evaluación?
                        </p>

                        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                            <p className="mb-2 font-medium text-warning-content">
                                Ten en cuenta antes de publicar
                            </p>

                            <ul className="list-disc pl-6 space-y-2 text-sm text-base-content/80">
                                <li>
                                    Una vez publicado, <strong>no podrás volver a Borrador</strong>.
                                </li>
                                <li>
                                    Se generarán automáticamente las asignaciones de evaluadores si no existen.
                                    Esto requiere al menos <strong>1 competencia y 1 participante</strong>.
                                </li>
                                <li>
                                    Las <strong>competencias, participantes y tipos de evaluación</strong>
                                    quedarán bloqueados para edición.
                                </li>
                                <li>
                                    Después de publicar, solo podrás modificar las{' '}
                                    <strong>políticas de corrección y calibración</strong> desde
                                    "Información General".
                                </li>
                            </ul>
                        </div>
                    </>
                }
                confirmText="Publicar"
                cancelText="Cancelar"
                variant="info"
            />
        </PageContainer>
    );
};

export default CompetencyEvaluationAdminDetailPage;