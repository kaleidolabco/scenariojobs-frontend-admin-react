import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobService, Job, JobQueryParams } from '../../services/jobService';
import { Pagination } from '../../services/responseType';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import JobForm from '../../components/Jobs/JobForm';
import Button from '../../components/Common/Button';
import { Plus, Pencil, Trash2 } from '../../components/Common/Icon';

const ITEMS_PER_PAGE = 10;

const JobsPage: React.FC = () => {
    const navigate = useNavigate();
    const { getJobs, createJob, updateJob, deleteJob, loading } = useJobService();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
    const isFirstRender = useRef(true);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [queryParams, setQueryParams] = useState<JobQueryParams>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'asc',
        orden_por: 'nombre',
        filtro: searchInput,
        nivel_jerarquico: undefined
    });

    // Update query params
    const updateQueryParam = (key: keyof JobQueryParams, value: any) => {
        setQueryParams(prev => ({ ...prev, [key]: value }));
    };

    const updateQueryParams = (updates: Partial<JobQueryParams>) => {
        setQueryParams(prev => ({ ...prev, ...updates }));
    };

    // Search debounce
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            updateQueryParams({ filtro: searchInput, pagina: 1 });
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    // Fetch data
    const fetchData = async () => {
        const params = Object.fromEntries(
            Object.entries(queryParams).filter(([_, value]) =>
                value !== undefined && value !== '' && value !== null
            )
        );
        const response = await getJobs(params);
        if (response) {
            setJobs(response.data.cargos);
            setPagination(response.data.paginacion);
        }
    };

    useEffect(() => {
        setJobs([]);
        fetchData();
    }, [queryParams]);

    // CRUD handlers
    const handleCreate = async (data: Omit<Job, 'id'>) => {
        const response = await createJob(data);
        if (response) {
            setModalOpen(false);
            fetchData();
        }
    };

    const handleUpdate = async (data: Omit<Job, 'id'>) => {
        if (!editingJob) return;
        const response = await updateJob(editingJob.id, data);
        if (response) {
            setModalOpen(false);
            setEditingJob(null);
            fetchData();
        }
    };

    const handleDeleteClick = (job: Job) => {
        setJobToDelete(job);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (jobToDelete) {
            const success = await deleteJob(jobToDelete.id);
            if (success) {
                setDeleteModalOpen(false);
                setJobToDelete(null);
                fetchData();
            }
        }
    };

    const openEditModal = (job: Job) => {
        navigate(`/cargos/${job.id}`);
    };

    const openCreateModal = () => {
        setEditingJob(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingJob(null);
    };

    // Filters
    const handleFilterChange = (key: string, value: string | number) => {
        updateQueryParams({ [key]: value, pagina: 1 } as any);
    };

    const handleSearch = (term: string) => {
        setSearchInput(term);
    };

    const clearFilters = () => {
        setQueryParams(prev => ({
            ...prev,
            filtro: '',
            nivel_jerarquico: undefined,
            pagina: 1
        }));
        setSearchInput('');
    };

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'nivel_jerarquico',
            label: 'Nivel',
            options: [
                { label: 'Junior', value: 'JUNIOR' },
                { label: 'Semi Senior', value: 'SEMI_SENIOR' },
                { label: 'Senior', value: 'SENIOR' },
                { label: 'Líder', value: 'LIDER' },
                { label: 'Gerente', value: 'GERENTE' },
                { label: 'Director', value: 'DIRECTOR' }
            ]
        }
    ];

    const activeFilters = {
        ...(queryParams.nivel_jerarquico && { nivel_jerarquico: queryParams.nivel_jerarquico })
    };

    // Sorting
    const handleSort = (key: string) => {
        const newDirection = queryParams.orden_por === key && queryParams.orden === 'asc' ? 'desc' : 'asc';
        updateQueryParams({ orden_por: key, orden: newDirection });
    };

    const sortConfig = queryParams.orden_por ? {
        key: queryParams.orden_por,
        direction: queryParams.orden as 'asc' | 'desc'
    } : null;

    // Table configuration
    const columns: TableColumn<Job>[] = [
        {
            key: 'nombre',
            label: 'Cargo',
            sortable: true,
            render: (job) => (
                <div>
                    <div className="font-bold">{job.nombre}</div>
                    <div className="text-xs opacity-50">{job.descripcion.substring(0, 60)}...</div>
                </div>
            )
        },
        {
            key: 'nivel_jerarquico',
            label: 'Nivel',
            sortable: true,
            render: (job) => {
                const badgeColors: Record<string, string> = {
                    'JUNIOR': 'badge-info',
                    'SEMI_SENIOR': 'badge-primary',
                    'SENIOR': 'badge-secondary',
                    'LIDER': 'badge-accent',
                    'GERENTE': 'badge-warning',
                    'DIRECTOR': 'badge-error'
                };
                return (
                    <div className={`badge ${badgeColors[job.nivel_jerarquico] || 'badge-ghost'}`}>
                        {job.nivel_jerarquico.replace('_', ' ')}
                    </div>
                );
            }
        },
        {
            key: 'competencias_requeridas',
            label: 'Competencias',
            render: (job) => (
                <div className="text-sm">
                    {job.competencias_requeridas.length > 0 ? (
                        <span>{job.competencias_requeridas.length} competencia(s)</span>
                    ) : (
                        <span className="opacity-50">Sin definir</span>
                    )}
                </div>
            )
        },
        {
            key: 'funciones',
            label: 'Funciones',
            render: (job) => (
                <div className="text-sm">
                    {job.funciones.length > 0 ? (
                        <span>{job.funciones.length} función(es)</span>
                    ) : (
                        <span className="opacity-50">Sin definir</span>
                    )}
                </div>
            )
        }
    ];

    const actions: TableAction<Job>[] = [
        {
            label: 'Editar',
            icon: <Pencil size={20} />,
            onClick: openEditModal,
            variant: 'ghost',
            tooltip: 'Editar cargo'
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={20} />,
            onClick: handleDeleteClick,
            variant: 'ghost',
            tooltip: 'Eliminar cargo'
        }
    ];

    return (
        <PageContainer
            title="Gestión de Cargos"
            subtitle="Defina los perfiles funcionales con competencias, funciones y bandas salariales."
            actions={
                <Button variant="primary" leftIcon={Plus} onClick={openCreateModal} className="w-full sm:w-auto">
                    Nuevo Cargo
                </Button>
            }
        >
            <FilterBar
                onSearch={handleSearch}
                searchTerm={searchInput}
                searchPlaceholder="Buscar cargos..."
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {loading && !jobs.length ? (
                <LoadingIndicator />
            ) : (
                <GenericTable
                    data={jobs}
                    columns={columns}
                    actions={actions}
                    keyExtractor={(job) => job.id}
                    pagination={pagination}
                    onPageChange={(page) => updateQueryParam('pagina', page)}
                    onPageSizeChange={(size) => updateQueryParams({ items_por_pagina: size, pagina: 1 })}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    emptyMessage="No se encontraron cargos"
                    isLoading={loading}
                />
            )}

            {/* Create/Edit Modal */}
            <GenericModal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editingJob ? 'Editar Cargo' : 'Nuevo Cargo'}
                size="lg"
            >
                <JobForm
                    initialData={editingJob}
                    isLoading={loading}
                    onSubmit={editingJob ? handleUpdate : handleCreate}
                    onCancel={closeModal}
                    isSimplified={true}
                />
            </GenericModal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Cargo"
                message={jobToDelete ? `¿Está seguro de eliminar el cargo "${jobToDelete.nombre}"? Esta acción no se puede deshacer.` : ''}
                confirmText="Eliminar"
                variant="danger"
            />
        </PageContainer>
    );
};

export default JobsPage;
