import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit3, Copy, Trash2, Plus, Activity, CheckCircle, Pencil, BarChart3 } from '../../components/Common/Icon';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import Button from '../../components/Common/Button';
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
import StatsCard from '../../components/Common/StatsCard';
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
                <Button variant="ghost" size="sm" disabled={isLoading}>
                    Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isLoading} loading={isLoading}>
                    {isLoading ? 'Guardando...' : evaluation ? 'Actualizar' : 'Crear Proceso'}
                </Button>
            </div>
        </form>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CompetencyEvaluationListPage: React.FC = () => {
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
            icon: <Eye size={16} />,
            onClick: (e) => {
                navigate(ROUTES.COMPETENCY_EVAL_DETAIL(e.id));
            },
            variant: 'ghost',
            tooltip: 'Ver detalle',
        },
        {
            label: 'Editar',
            icon: <Edit3 size={16} />,
            onClick: (e) => {
                navigate(ROUTES.COMPETENCY_EVAL_DETAIL(e.id));
            },
            variant: 'ghost',
            tooltip: 'Editar',
        },
        {
            label: 'Clonar',
            icon: <Copy size={16} />,
            onClick: (e) => {
                setEvaluationToClone(e);
                setCloneModalOpen(true);
            },
            variant: 'ghost',
            tooltip: 'Clonar proceso',
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={16} />,
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
        { label: ROLE_LABELS[UserRole.HR_MANAGER], to: undefined },
        { label: 'Evaluación de Competencias', to: undefined },
    ];

    // Render
    return (
        <PageContainer
            title="Evaluación de Competencias"
            subtitle="Crea y administra procesos de evaluación de competencias"
            breadcrumbs={breadcrumbs}
            actions={
                <Button variant="primary" leftIcon={Plus} onClick={() => handleOpenForm()}>
                    Nuevo Proceso
                </Button>
            }
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    label="Total de procesos"
                    value={stats.total}
                    variant="primary"
                    icon={<Activity size={24} />}
                />
                <StatsCard
                    label="Publicados"
                    value={stats.publicadas}
                    variant="success"
                    icon={<CheckCircle size={24} />}
                />
                <StatsCard
                    label="En borrador"
                    value={stats.borradores}
                    variant="warning"
                    icon={<Pencil size={24} />}
                />
                <StatsCard
                    label="Total evaluaciones"
                    value={stats.total_evaluaciones}
                    variant="info"
                    icon={<BarChart3 size={24} />}
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
                        pagination={pagination}
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

export default CompetencyEvaluationListPage;
