import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar from '../../components/Common/FilterBar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import FormSection from '../../components/Common/Forms/FormSection';
import InputField from '../../components/Common/Forms/InputField';
import TextAreaField from '../../components/Common/Forms/TextAreaField';
import SelectField from '../../components/Common/Forms/SelectField';
import NumberInputField from '../../components/Common/Forms/NumberInputField';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import { Pagination } from '../../services/responseType';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationSummary,
    CompetencyEvaluationStatus,
} from '../../services/competencyEvaluationService';

const ITEMS_PER_PAGE = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ estado: CompetencyEvaluationStatus }> = ({ estado }) => {
    const map: Record<CompetencyEvaluationStatus, { cls: string; label: string; dot: string }> = {
        BORRADOR: { cls: 'badge-warning', label: 'Borrador', dot: 'bg-warning' },
        PUBLICADO: { cls: 'badge-success', label: 'Publicado', dot: 'bg-success' },
        ARCHIVADO: { cls: 'badge-ghost', label: 'Archivado', dot: 'bg-base-content/30' },
    };
    const { cls, label, dot } = map[estado];
    return (
        <div className={`badge ${cls} badge-sm gap-1.5 font-medium`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </div>
    );
};

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

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const IconCopy = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const IconTrash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const IconStar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ─── Form Modal Content ───────────────────────────────────────────────────────

interface CompetencyEvaluationFormProps {
    evaluation?: CompetencyEvaluationSummary;
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
}

const CompetencyEvaluationForm: React.FC<CompetencyEvaluationFormProps> = ({
    evaluation,
    onSubmit,
    isLoading = false,
}) => {
    const [formData, setFormData] = useState({
        nombre: evaluation?.nombre ?? '',
        descripcion: evaluation?.descripcion ?? '',
        estado: evaluation?.estado ?? 'BORRADOR' as CompetencyEvaluationStatus,
        total_competencias: evaluation?.total_competencias ?? 0,
        creado_por: evaluation?.creado_por ?? 'Usuario Actual',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (formData.nombre.length > 255) newErrors.nombre = 'El nombre no puede exceder 255 caracteres';
        if (formData.descripcion.length > 1000) newErrors.descripcion = 'La descripción no puede exceder 1000 caracteres';
        if (formData.total_competencias < 0) newErrors.total_competencias = 'El número de competencias debe ser mayor a 0';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="Información General" description="Datos básicos del proceso de evaluación">
                <div className="space-y-4">
                    <InputField
                        label="Nombre del Proceso"
                        name="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        placeholder="Ej: Evaluación de Competencias – Líderes 2025"
                        required
                        error={errors.nombre}
                        maxLength={255}
                    />

                    <TextAreaField
                        label="Descripción"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange('descripcion', e.target.value)}
                        placeholder="Descripción detallada del proceso evaluativo..."
                        rows={3}
                        maxLength={1000}
                        error={errors.descripcion}
                        helpText={`${formData.descripcion.length}/1000`}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Estado"
                            name="estado"
                            value={formData.estado}
                            onChange={(e) =>
                                handleInputChange('estado', e.target.value as CompetencyEvaluationStatus)
                            }
                            options={[
                                { value: 'BORRADOR', label: 'Borrador' },
                                { value: 'PUBLICADO', label: 'Publicado' },
                                { value: 'ARCHIVADO', label: 'Archivado' },
                            ]}
                        />

                        <NumberInputField
                            label="Total de Competencias"
                            name="total_competencias"
                            value={formData.total_competencias}
                            onChange={(value) => handleInputChange('total_competencias', value)}
                            min={0}
                            error={errors.total_competencias}
                        />
                    </div>
                </div>
            </FormSection>

            <div className="flex gap-3 justify-end pt-4 border-t">
                <button type="button" className="btn btn-ghost btn-sm" disabled={isLoading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <span className="loading loading-spinner loading-sm" />
                            Guardando...
                        </>
                    ) : evaluation ? (
                        'Actualizar'
                    ) : (
                        'Crear Proceso'
                    )}
                </button>
            </div>
        </form>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const EvaluationCompetencyPage: React.FC = () => {
    const navigate = useNavigate();
    const { openAlert } = useUIStore();
    const {
        getCompetencyEvaluations,
        getCompetencyEvaluationStats,
        createCompetencyEvaluation,
        updateCompetencyEvaluation,
        deleteCompetencyEvaluation,
        cloneCompetencyEvaluation,
    } = useCompetencyEvaluationService();

    // State
    const [evaluations, setEvaluations] = useState<CompetencyEvaluationSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Query params
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        estado: undefined,
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'asc',
        orden_por: 'nombre',
    });

    // Modals
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [evaluationToEdit, setEvaluationToEdit] = useState<CompetencyEvaluationSummary | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [evaluationToDelete, setEvaluationToDelete] = useState<CompetencyEvaluationSummary | null>(null);
    const [cloneModalOpen, setCloneModalOpen] = useState(false);
    const [evaluationToClone, setEvaluationToClone] = useState<CompetencyEvaluationSummary | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        publicadas: 0,
        borradores: 0,
        total_evaluaciones: 0,
    });

    const loadStats = useCallback(async () => {
        const response = await getCompetencyEvaluationStats();
        if (response?.success) setStats(response.data.stats);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadStats();
    }, []);

    // Load data
    const loadEvaluations = useCallback(async () => {
        setLoading(true);
        const response = await getCompetencyEvaluations({
            search: queryParams.search || undefined,
            estado: queryParams.estado,
            pagina: queryParams.pagina,
            items_por_pagina: queryParams.items_por_pagina,
            orden: queryParams.orden,
            orden_por: queryParams.orden_por,
        });
        if (response?.success) {
            setEvaluations(response.data.evaluaciones);
            setPagination(response.data.paginacion as Pagination);
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    useEffect(() => {
        loadEvaluations();
    }, [loadEvaluations]);

    // Handlers
    const reloadAll = useCallback(() => {
        loadEvaluations();
        loadStats();
    }, [loadEvaluations, loadStats]);

    const handleOpenForm = (evaluation?: CompetencyEvaluationSummary) => {
        setEvaluationToEdit(evaluation ?? null);
        setFormModalOpen(true);
    };

    const handleFormSubmit = async (formData: any) => {
        setFormLoading(true);
        try {
            let response;
            if (evaluationToEdit) {
                response = await updateCompetencyEvaluation(evaluationToEdit.id, {
                    nombre: formData.nombre,
                    descripcion: formData.descripcion,
                    estado: formData.estado,
                    total_competencias: formData.total_competencias,
                });
            } else {
                response = await createCompetencyEvaluation({
                    nombre: formData.nombre,
                    descripcion: formData.descripcion,
                    estado: formData.estado,
                    total_competencias: formData.total_competencias,
                    creado_por: formData.creado_por,
                });
            }

            if (response?.success) {
                openAlert(
                    evaluationToEdit
                        ? `"${formData.nombre}" actualizado correctamente.`
                        : `Proceso "${formData.nombre}" creado correctamente.`,
                    'success'
                );
                setFormModalOpen(false);
                setEvaluationToEdit(null);
                reloadAll();
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!evaluationToDelete) return;
        const success = await deleteCompetencyEvaluation(evaluationToDelete.id);
        if (success) {
            openAlert(`Proceso "${evaluationToDelete.nombre}" eliminado.`, 'success');
            setDeleteModalOpen(false);
            setEvaluationToDelete(null);
            reloadAll();
        }
    };

    const handleClone = async () => {
        if (!evaluationToClone) return;
        const response = await cloneCompetencyEvaluation(evaluationToClone.id);
        if (response?.success) {
            openAlert(`Se creó una copia de "${evaluationToClone.nombre}".`, 'success');
            setCloneModalOpen(false);
            setEvaluationToClone(null);
            reloadAll();
        }
    };

    // Filter helpers
    const filterDefinitions = [
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: 'Borrador', value: 'BORRADOR' },
                { label: 'Publicado', value: 'PUBLICADO' },
                { label: 'Archivado', value: 'ARCHIVADO' },
            ],
        },
    ];

    const activeFilters = {
        ...(queryParams.estado && { estado: queryParams.estado }),
    };

    const handleFilterChange = (key: string, value: any) =>
        setQueryParams((p: any) => ({ ...p, [key]: value, pagina: 1 }));

    const handleSearch = (term: string) =>
        setQueryParams((p: any) => ({ ...p, search: term, pagina: 1 }));

    const clearFilters = () =>
        setQueryParams({
            search: '',
            estado: undefined,
            pagina: 1,
            items_por_pagina: ITEMS_PER_PAGE,
            orden: 'asc',
            orden_por: 'nombre',
        });

    // Sorting
    const handleSort = (key: string) => {
        const newDirection = queryParams.orden_por === key && queryParams.orden === 'asc' ? 'desc' : 'asc';
        setQueryParams((p: any) => ({ ...p, orden_por: key, orden: newDirection, pagina: 1 }));
    };

    const sortConfig = queryParams.orden_por
        ? { key: queryParams.orden_por, direction: queryParams.orden as 'asc' | 'desc' }
        : null;

    // Table config
    const columns: TableColumn<CompetencyEvaluationSummary>[] = [
        {
            key: 'nombre',
            label: 'Proceso de Evaluación',
            sortable: true,
            render: (e) => (
                <div className="flex flex-col gap-0.5 max-w-xs">
                    <span className="font-semibold text-base-content leading-snug">{e.nombre}</span>
                    {e.descripcion && (
                        <span className="text-xs text-base-content/50 truncate">{e.descripcion}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'estado',
            label: 'Estado',
            sortable: true,
            render: (e) => <StatusBadge estado={e.estado} />,
        },
        {
            key: 'total_competencias',
            label: 'Competencias',
            render: (e) => (
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-base-content">{e.total_competencias}</span>
                    <span className="text-base-content/50">competencias</span>
                </div>
            ),
        },
        {
            key: 'total_evaluaciones',
            label: 'Evaluaciones',
            render: (e) => (
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-base-content">{e.total_evaluaciones}</span>
                    <span className="text-base-content/50">realizadas</span>
                </div>
            ),
        },
        {
            key: 'fecha_actualizacion',
            label: 'Actualización',
            sortable: true,
            render: (e) => (
                <span className="text-sm text-base-content/70">
                    {new Date(e.fecha_actualizacion).toLocaleDateString('es-ES')}
                </span>
            ),
        },
    ];

    const actions: TableAction<CompetencyEvaluationSummary>[] = [
        {
            label: 'Ver detalle',
            icon: <IconEye />,
            onClick: (e) => {
                navigate(ROUTES.COMPETENCY_EVAL_DETAIL(e.id));
            },
            variant: 'ghost',
            tooltip: 'Ver detalle',
        },
        {
            label: 'Editar',
            icon: <IconEdit />,
            onClick: (e) => {
                navigate(ROUTES.COMPETENCY_EVAL_DETAIL(e.id));
            },
            variant: 'ghost',
            tooltip: 'Editar',
        },
        {
            label: 'Clonar',
            icon: <IconCopy />,
            onClick: (e) => {
                setEvaluationToClone(e);
                setCloneModalOpen(true);
            },
            variant: 'ghost',
            tooltip: 'Clonar proceso',
        },
        {
            label: 'Eliminar',
            icon: <IconTrash />,
            onClick: (e) => {
                setEvaluationToDelete(e);
                setDeleteModalOpen(true);
            },
            variant: 'ghost',
            tooltip: 'Eliminar',
        },
    ];

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'RRHH', to: undefined },
        { label: 'Evaluación de Competencias', to: undefined },
    ];

    // Render
    return (
        <PageContainer
            title="Evaluación de Competencias"
            subtitle="Crea y administra procesos de evaluación de competencias"
            breadcrumbs={breadcrumbs}
            actions={
                <button
                    className="btn btn-primary"
                    onClick={() => handleOpenForm()}
                >
                    <IconPlus />
                    Nuevo Proceso
                </button>
            }
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    label="Total de procesos"
                    value={stats.total}
                    colorClass="bg-primary/10 text-primary"
                    icon={<IconStar />}
                />
                <StatsCard
                    label="Publicados"
                    value={stats.publicadas}
                    colorClass="bg-success/10 text-success"
                    icon={
                        <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <StatsCard
                    label="En borrador"
                    value={stats.borradores}
                    colorClass="bg-warning/10 text-warning"
                    icon={
                        <svg className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    }
                />
                <StatsCard
                    label="Total evaluaciones"
                    value={stats.total_evaluaciones}
                    colorClass="bg-info/10 text-info"
                    icon={
                        <svg className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                />
            </div>

            {/* Filter Bar */}
            <FilterBar
                onSearch={handleSearch}
                searchTerm={queryParams.search || ''}
                searchPlaceholder="Buscar proceso por nombre o descripción..."
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {/* Table */}
            {loading && !evaluations.length ? (
                <LoadingIndicator />
            ) : (
                <GenericTable
                    data={evaluations}
                    columns={columns}
                    actions={actions}
                    keyExtractor={(e) => e.id}
                    currentPage={queryParams.pagina || 1}
                    totalPages={pagination?.total_paginas || 1}
                    pageSize={queryParams.items_por_pagina || ITEMS_PER_PAGE}
                    onPageChange={(page) => setQueryParams((p: any) => ({ ...p, pagina: page }))}
                    onPageSizeChange={(size) => setQueryParams((p: any) => ({ ...p, items_por_pagina: size, pagina: 1 }))}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    emptyMessage="No se encontraron procesos. ¡Crea el primero!"
                    isLoading={false}
                />
            )}

            {/* Form Modal */}
            <GenericModal
                isOpen={formModalOpen}
                onClose={() => {
                    setFormModalOpen(false);
                    setEvaluationToEdit(null);
                }}
                title={evaluationToEdit ? 'Editar Proceso' : 'Crear Nuevo Proceso'}
                size="lg"
            >
                <CompetencyEvaluationForm
                    evaluation={evaluationToEdit ?? undefined}
                    onSubmit={handleFormSubmit}
                    isLoading={formLoading}
                />
            </GenericModal>

            {/* Clone Confirmation */}
            <ConfirmationModal
                isOpen={cloneModalOpen}
                onClose={() => setCloneModalOpen(false)}
                onConfirm={handleClone}
                title="Clonar Proceso"
                message={`Se creará una copia exacta de "${evaluationToClone?.nombre}" en estado Borrador. ¿Deseas continuar?`}
                confirmText="Clonar"
                variant="info"
            />

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Proceso"
                message={
                    evaluationToDelete?.total_evaluaciones && evaluationToDelete.total_evaluaciones > 0
                        ? `"${evaluationToDelete.nombre}" tiene ${evaluationToDelete.total_evaluaciones} evaluaciones asociadas. Eliminarla podría afectar reportes históricos. ¿Está seguro?`
                        : `¿Está seguro de eliminar "${evaluationToDelete?.nombre}"? Esta acción no se puede deshacer.`
                }
                confirmText="Eliminar Definitivamente"
                variant="danger"
            />
        </PageContainer>
    );
};

export default EvaluationCompetencyPage;
