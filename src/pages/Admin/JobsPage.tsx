import React, { useEffect, useState } from 'react';
import { useJobService, Job, JobQueryParams } from '../../services/jobService';
import { Pagination } from '../../services/responseType';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import JobForm from '../../components/Jobs/JobForm';

const ITEMS_PER_PAGE = 10;

const JobsPage: React.FC = () => {
    const { getJobs, createJob, updateJob, deleteJob, loading } = useJobService();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

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
        setEditingJob(job);
        setModalOpen(true);
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
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            ),
            onClick: openEditModal,
            variant: 'ghost',
            tooltip: 'Editar cargo'
        },
        {
            label: 'Eliminar',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
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
                <button className="btn btn-primary w-full sm:w-auto" onClick={openCreateModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Cargo
                </button>
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
                <div className="flex justify-center p-10">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : (
                <GenericTable
                    data={jobs}
                    columns={columns}
                    actions={actions}
                    keyExtractor={(job) => job.id}
                    currentPage={queryParams.pagina || 1}
                    totalPages={pagination?.total_paginas || 1}
                    pageSize={queryParams.items_por_pagina || ITEMS_PER_PAGE}
                    onPageChange={(page) => updateQueryParam('pagina', page)}
                    onPageSizeChange={(size) => updateQueryParams({ items_por_pagina: size, pagina: 1 })}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    emptyMessage="No se encontraron cargos"
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
