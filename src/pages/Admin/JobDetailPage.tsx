import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { useJobService, Job, CompetencyRequirement } from '../../services/jobService';
import { JobFunction } from '../../services/functionService';
import JobForm from '../../components/Jobs/JobForm';
import JobCompetencySelector from '../../components/Jobs/JobCompetencySelector';
import { FunctionManagerModal } from '../../components/Functions';
import { ROUTES } from '../../constants/routes';
import Tabs from '../../components/Common/Tabs';
import { CURRENCIES } from '../../components/Common/Forms/CurrencySelectField';
import Button from '../../components/Common/Button';
import { Pencil, Trash2, FileText } from '../../components/Common/Icon';

const JobDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getJobById, updateJob, deleteJob, syncJobCompetencies, syncJobFunctions, loading } = useJobService();

    const [job, setJob] = useState<Job | null>(null);
    const [activeTab, setActiveTab] = useState<string>('info');

    // Modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [functionsModalOpen, setFunctionsModalOpen] = useState(false);

    // States for editing competencies/functions directly
    const [competencias, setCompetencias] = useState<CompetencyRequirement[]>([]);
    const [funciones, setFunciones] = useState<JobFunction[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            loadJobData();
        }
    }, [id]);

    const loadJobData = async () => {
        if (!id) return;
        const response = await getJobById(id);
        if (response && response.success && response.data) {
            const found = response.data;
            setJob(found);
            setCompetencias(found.competencias_requeridas || []);
            setFunciones(found.funciones as JobFunction[] || []);
        }
    };

    const handleUpdateBasic = async (data: Omit<Job, 'id'>) => {
        if (!job) return;
        setSaving(true);
        const response = await updateJob(job.id, data);
        setSaving(false);
        if (response) {
            setEditModalOpen(false);
            loadJobData();
        }
    };

    const handleSaveCompetencies = async () => {
        if (!job) return;
        setSaving(true);
        const success = await syncJobCompetencies(job.id, competencias);
        setSaving(false);
        if (success) {
            loadJobData();
        }
    };

    const handleSaveFunctions = async (updatedFunciones: JobFunction[]) => {
        if (!job) return;
        setSaving(true);
        const success = await syncJobFunctions(job.id, updatedFunciones);
        setSaving(false);
        if (success) {
            setFunciones(updatedFunciones);
            loadJobData();
        }
    };

    const handleDelete = async () => {
        if (!job) return;
        const success = await deleteJob(job.id);
        if (success) {
            navigate(ROUTES.JOBS);
        }
    };

    if (loading && !job) {
        return (
            <PageContainer title="Cargando..." subtitle="">
                <LoadingIndicator />
            </PageContainer>
        );
    }

    if (!job) {
        return (
            <PageContainer title="Cargo no encontrado" subtitle="">
                <div className="text-center py-10">
                    <p className="mb-4">El perfil funcional solicitado no existe o no se pudo cargar.</p>
                    <button className="btn btn-primary" onClick={() => navigate(ROUTES.JOBS)}>
                        Volver al listado
                    </button>
                </div>
            </PageContainer>
        );
    }

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Cargos (Perfiles)', to: ROUTES.JOBS },
        { label: job.nombre, to: undefined }
    ];

    const badgeColors: Record<string, string> = {
        'JUNIOR': 'badge-info',
        'SEMI_SENIOR': 'badge-primary',
        'SENIOR': 'badge-secondary',
        'LIDER': 'badge-accent',
        'GERENTE': 'badge-warning',
        'DIRECTOR': 'badge-error'
    };

    return (
        <PageContainer
            title={job.nombre}
            subtitle="Detalle del perfil funcional con sus competencias y funciones estructuradas."
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setEditModalOpen(true)}>
                        Editar Ficha
                    </Button>
                    <Button variant="error" outline size="sm" leftIcon={Trash2} onClick={() => setDeleteModalOpen(true)}>
                        Eliminar
                    </Button>
                </div>
            }
        >
            <Tabs
                tabs={[
                    { id: 'info', label: 'Información Básica' },
                    { id: 'competencies', label: 'Competencias Requeridas' },
                    { id: 'functions', label: 'Funciones y Conocimientos' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="bordered"
            />
            <div className="space-y-6">
                {activeTab === 'info' && (
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                        <div className="card-body">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-base-200">
                                <div>
                                    <h3 className="font-bold text-lg text-base-content">{job.nombre}</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className={`badge ${badgeColors[job.nivel_jerarquico] || 'badge-ghost'}`}>
                                            Nivel: {job.nivel_jerarquico.replace('_', ' ')}
                                        </div>
                                        <div className="badge badge-outline">
                                            {competencias.length} Competencia(s)
                                        </div>
                                        <div className="badge badge-outline">
                                            {funciones.length} Función(es)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Descripción del Cargo</span>
                                    <p className="text-sm mt-1 text-base-content/85 leading-relaxed">{job.descripcion}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="bg-base-200/40 rounded-xl p-4 border border-base-200">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Salario Mínimo</span>
                                        <p className="text-lg font-bold text-base-content mt-1">
                                            {job.banda_salarial_min ? `${CURRENCIES.find(c => c.value === (job.moneda || 'USD'))?.label?.split(" ")[0] || ""} ${job.banda_salarial_min.toLocaleString()} ${job.periodo_salarial ? `/ ${job.periodo_salarial.toLowerCase()}` : ''}` : 'No definido'}
                                        </p>
                                    </div>
                                    <div className="bg-base-200/40 rounded-xl p-4 border border-base-200">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Salario Máximo</span>
                                        <p className="text-lg font-bold text-base-content mt-1">
                                            {job.banda_salarial_max ? `${CURRENCIES.find(c => c.value === (job.moneda || 'USD'))?.label?.split(" ")[0] || ""} ${job.banda_salarial_max.toLocaleString()} ${job.periodo_salarial ? `/ ${job.periodo_salarial.toLowerCase()}` : ''}` : 'No definido'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'competencies' && (
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center justify-between pb-4 border-b border-base-200 mb-4">
                                <h3 className="font-bold text-lg text-base-content">Competencias del Cargo</h3>
                                <Button variant="primary" size="sm" onClick={handleSaveCompetencies} loading={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Competencias'}
                                </Button>
                            </div>

                            <JobCompetencySelector
                                value={competencias}
                                onChange={setCompetencias}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'functions' && (
                    <div className="card bg-base-100 border border-base-200 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center justify-between pb-4 border-b border-base-200 mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-base-content">Funciones y Responsabilidades</h3>
                                    <p className="text-xs text-base-content/60 mt-0.5">Estructura jerárquica de capacidades y conocimientos.</p>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => setFunctionsModalOpen(true)}>
                                    Gestionar Estructura
                                </Button>
                            </div>

                            {funciones.length > 0 ? (
                                <div className="space-y-4">
                                    {funciones.map((func, index) => (
                                        <div key={func.id || index} className="collapse collapse-arrow bg-base-200/50 rounded-xl border border-base-200">
                                            <input type="checkbox" defaultChecked={index === 0} />
                                            <div className="collapse-title font-semibold text-base-content">
                                                {index + 1}. {func.titulo || 'Sin título'}
                                            </div>
                                            <div className="collapse-content space-y-4 text-sm pt-2">
                                                {func.descripcion && (
                                                    <p className="text-base-content/70 italic bg-base-100 p-3 rounded-lg border border-base-200">
                                                        {func.descripcion}
                                                    </p>
                                                )}

                                                <div className="space-y-3">
                                                    <h5 className="font-bold text-xs uppercase tracking-wider text-base-content/50">Capacidades ({func.capacidades?.length || 0})</h5>
                                                    {func.capacidades?.map((cap, capIdx) => (
                                                        <div key={cap.id || capIdx} className="bg-base-100 rounded-lg p-4 border border-base-200 space-y-3">
                                                            <div className="font-semibold text-base-content">{cap.titulo}</div>
                                                            {cap.descripcion && <p className="text-xs text-base-content/60">{cap.descripcion}</p>}

                                                            <div className="pl-4 border-l-2 border-primary space-y-2">
                                                                <h6 className="font-bold text-[10px] uppercase tracking-wider text-base-content/40">Conocimientos ({cap.conocimientos?.length || 0})</h6>
                                                                {cap.conocimientos?.map((know, knowIdx) => (
                                                                    <div key={know.id || knowIdx} className="bg-base-200/40 rounded p-3 space-y-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="font-medium text-sm text-base-content">{know.titulo}</span>
                                                                            <div className="flex gap-1.5">
                                                                                <span className="badge badge-sm badge-outline">{know.tipoConocimiento}</span>
                                                                                <span className="badge badge-sm badge-ghost">Nivel {know.nivelDesarrollo}</span>
                                                                            </div>
                                                                        </div>
                                                                        {know.modulos && know.modulos.length > 0 && (
                                                                            <div className="text-xs opacity-70 mt-2">
                                                                                Módulos: {know.modulos.map(m => m.titulo).join(', ')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-base-200/30 rounded-xl border border-dashed border-base-300">
                                    <FileText size={48} className="mx-auto mb-2 opacity-40 text-base-content" />
                                    <p className="text-sm font-medium text-base-content/70">No hay funciones configuradas</p>
                                    <p className="text-xs text-base-content/50 mt-1">Haz clic en el botón de arriba para configurar la estructura funcional.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal (Simplified Form) */}
            <GenericModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Editar Ficha del Cargo"
                size="lg"
            >
                <JobForm
                    initialData={job}
                    isLoading={saving}
                    onSubmit={handleUpdateBasic}
                    onCancel={() => setEditModalOpen(false)}
                    isSimplified={true}
                />
            </GenericModal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Cargo"
                message={`¿Está seguro de eliminar el cargo "${job.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />

            {/* Function Manager Modal */}
            <FunctionManagerModal
                isOpen={functionsModalOpen}
                onClose={() => setFunctionsModalOpen(false)}
                onSave={handleSaveFunctions}
                initialFunctions={funciones}
                isLoading={saving}
            />
        </PageContainer>
    );
};

export default JobDetailPage;
