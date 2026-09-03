import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Tabs from '../../components/Common/Tabs';
import EmailConfigTab from '../../components/EmailConfig/EmailConfigTab';
import Button from '../../components/Common/Button';
import { ROUTES } from '../../constants/routes';
import { CompetencyEvaluationStatus } from '../../services/competencyEvaluationService';
import useCompetencyEvaluationDetail from '../../hooks/useCompetencyEvaluationDetail';

import CompetenciesTab from '../../components/CompetencyEvaluation/CompetenciesTab';
import ParticipantsTab from '../../components/CompetencyEvaluation/ParticipantsTab';
import GeneralTab from '../../components/CompetencyEvaluation/GeneralTab';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<CompetencyEvaluationStatus, string> = {
    BORRADOR: 'badge-warning',
    PUBLICADO: 'badge-success',
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
    } = useCompetencyEvaluationDetail(id);

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

    const statusLabelMap: Record<CompetencyEvaluationStatus, string> = {
        BORRADOR: 'Borrador',
        PUBLICADO: 'Publicado',
        ARCHIVADO: 'Archivado',
    };

    return (
        <PageContainer
            title={formData.nombre || evaluation.nombre}
            subtitle="Edita el proceso de evaluación de competencias"
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[formData.estado]} badge-outline font-medium`}>
                        {statusLabelMap[formData.estado]}
                    </span>
                    <Button variant="ghost" onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)}>
                        Cancelar
                    </Button>
                </div>
            }
        >
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
                                estado: formData.estado,
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
        </PageContainer>
    );
};

export default CompetencyEvaluationAdminDetailPage;