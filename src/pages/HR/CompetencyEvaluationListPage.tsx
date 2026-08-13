import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Copy, Trash2, Plus, Activity, CheckCircle, Pencil, BarChart3 } from '../../components/Common/Icon';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import Button from '../../components/Common/Button';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar from '../../components/Common/FilterBar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import StatsCard from '../../components/Common/StatsCard';
import CompetencyEvaluationFormModal from '../../components/CompetencyEvaluation/CompetencyEvaluationFormModal';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import { Pagination } from '../../services/responseType';
import { ESTADO_PROCESO_LABELS, ESTADO_PROCESO_BADGE } from '../../services/evaluationAssignmentService';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationSummary,
    CompetencyEvaluationStatus,
} from '../../services/competencyEvaluationService';

const ITEMS_PER_PAGE = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ estado: CompetencyEvaluationStatus; estadoFlujo?: string }> = ({
    estado,
    estadoFlujo,
}) => {
    const statusKey = (estadoFlujo || estado) as keyof typeof ESTADO_PROCESO_BADGE;
    return (
        <div className={`badge ${ESTADO_PROCESO_BADGE[statusKey] || 'badge-ghost'}`}>
            {ESTADO_PROCESO_LABELS[statusKey] || statusKey.replace('_', ' ')}
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CompetencyEvaluationListPage: React.FC = () => {
    const navigate = useNavigate();
    const { openAlert } = useUIStore();
    const {
        getCompetencyEvaluations,
        getCompetencyEvaluationStats,
        deleteCompetencyEvaluation,
        cloneCompetencyEvaluation,
    } = useCompetencyEvaluationService();

    // State
    const [evaluations, setEvaluations] = useState<CompetencyEvaluationSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false);

    // Query params
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        estado: undefined,
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'asc',
        orden_por: 'nombre',
    });

    // Local search term to enable debouncing
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // UI sort state (backend sort field may differ from column key)
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Map column keys to backend supported sort fields
    // Backend ordenar_por soporta: nombre, fecha_registro, estado
    const SORT_FIELD_MAP: Record<string, string> = {
        fecha_actualizacion: 'fecha_registro',
    };

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
        if (response?.success) {
            setStats((prev) => ({ ...prev, ...(response.data?.stats ?? {}) }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadStats();
    }, []);

    // Debounce the search input to avoid making too many API calls
    useEffect(() => {
        const handler = setTimeout(() => {
            setQueryParams((prev: any) => {
                if (prev.search === localSearchTerm) return prev;
                return { ...prev, search: localSearchTerm, pagina: 1 };
            });
        }, 400);

        return () => clearTimeout(handler);
    }, [localSearchTerm]);

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
        setLocalSearchTerm(term);

    const clearFilters = () => {
        setLocalSearchTerm('');
        setSortConfig({ key: 'nombre', direction: 'asc' });
        setQueryParams({
            search: '',
            estado: undefined,
            pagina: 1,
            items_por_pagina: ITEMS_PER_PAGE,
            orden: 'asc',
            orden_por: 'nombre',
        });
    };

    // Sorting
    const handleSort = (key: string) => {
        const newDirection = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction: newDirection });
        setQueryParams((p: any) => ({
            ...p,
            orden_por: SORT_FIELD_MAP[key] || key,
            orden: newDirection,
            pagina: 1,
        }));
    };

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
            render: (e) => <StatusBadge estado={e.estado} estadoFlujo={e.estado_flujo} />,
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
            label: 'Editar',
            icon: <Edit3 size={16} />,
            onClick: (e) => {
                navigate(ROUTES.COMPETENCY_EVAL_DETAIL(e.id));
            },
            variant: 'ghost',
            tooltip: 'Editar proceso',
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
                searchTerm={localSearchTerm}
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
            <CompetencyEvaluationFormModal
                isOpen={formModalOpen}
                evaluation={evaluationToEdit}
                onClose={() => {
                    setFormModalOpen(false);
                    setEvaluationToEdit(null);
                }}
                onSaved={reloadAll}
            />

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
