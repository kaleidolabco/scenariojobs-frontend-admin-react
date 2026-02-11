import React, { useEffect, useState } from 'react';
import { useCompetencyService, Competency, competenciesQueryParams } from '../../services/competencyService';
import { Pagination } from '../../services/responseType';
import CompetencyForm from '../../components/Competencies/CompetencyForm';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS_PER_PAGE = 9;

const CompetenciesPage: React.FC = () => {
    const { getCompetencies, createCompetency, updateCompetency, deleteCompetency, loading } = useCompetencyService();
    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
    const [deleteCompetence, setDeleteCompetence] = useState<Competency | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    // Estado unificado para todos los parámetros de consulta
    const [queryParams, setQueryParams] = useState<competenciesQueryParams>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'asc',
        orden_por: 'nombre',
        filtro: searchInput,
        categoria: undefined,
    });

    // Función para actualizar parámetros individuales
    const updateQueryParam = (key: keyof competenciesQueryParams, value: any) => {
        setQueryParams(prev => ({ ...prev, [key]: value }));
    };

    // Función para actualizar múltiples parámetros a la vez
    const updateQueryParams = (updates: Partial<competenciesQueryParams>) => {
        setQueryParams(prev => ({ ...prev, ...updates }));
    };

    // useEffect para manejar el filtro de búsqueda
    // Se ejecuta cada vez que el input de búsqueda cambia y espera 500 ms para ejecutar la consulta
    useEffect(() => {
        const timeout = setTimeout(() => {
            updateQueryParams({
                filtro: searchInput,
                pagina: 1
            });
        }, 500); // 500 ms (ajustable)

        return () => clearTimeout(timeout);
    }, [searchInput]);

    // Función para limpiar todos los filtros
    const clearFilters = () => {
        setQueryParams(prev => ({
            ...prev,
            filtro: '',
            categoria: undefined,
            pagina: 1, // Resetear a la primera página
        }));
    };

    // Función para obtener los datos
    const fetchData = async () => {
        // Filtrar solo los parámetros que tienen valor
        const params = Object.fromEntries(
            Object.entries(queryParams).filter(([_, value]) =>
                value !== undefined && value !== '' && value !== null
            )
        );

        const response = await getCompetencies(params);
        if (response) {
            setCompetencies(response.data.competencias);
            setPagination(response.data.paginacion);
        }
    };

    // useEffect para obtener los datos cuando cambian los queryParams
    useEffect(() => {
        // Limpiar competencias anteriores
        setCompetencies([]);
        fetchData();
    }, [queryParams]);

    // Función para crear una competencia
    const handleCreate = async (data: Omit<Competency, 'id'>) => {
        const response = await createCompetency(data);
        if (response) {
            setCompetencies([...competencies, response.data.competencia]);
            setModalOpen(false);
        }
    };

    // Función para actualizar una competencia
    const handleUpdate = async (data: Omit<Competency, 'id'>) => {
        if (!editingCompetency) return;
        const response = await updateCompetency(editingCompetency.id, data);
        if (response) {
            setCompetencies(competencies.map(c => c.id === editingCompetency.id ? response.data.competencia : c));
            setModalOpen(false);
            setEditingCompetency(null);
        }
    };

    // Función para eliminar una competencia
    // Función para manejar la solicitud de eliminación
    const handleDeleteClick = (comp: Competency) => {
        setDeleteCompetence(comp);
        setShowDeleteModal(true);
    };

    // Función para confirmar la eliminación
    const handleConfirmDelete = async () => {
        if (deleteCompetence) {
            const success = await deleteCompetency(deleteCompetence.id);
            if (success) {
                setCompetencies(competencies.filter(c => c.id !== deleteCompetence.id));
            }
            setDeleteCompetence(null);
        }
    };

    const openEditModal = (comp: Competency) => {
        setEditingCompetency(comp);
        setModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingCompetency(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingCompetency(null);
    }

    const handleFilterChange = (key: string, value: string | number) => {
        updateQueryParams({ [key]: value, pagina: 1 } as any);
    };

    const handleSearch = (term: string) => {
        setSearchInput(term);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || (pagination && page > pagination?.total_paginas)) return;
        updateQueryParam('pagina', page);
    };

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'categoria',
            label: 'Categoría',
            options: [
                { label: 'Blanda (Soft)', value: 'HABILIDAD_BLANDA' },
                { label: 'Técnica (Hard)', value: 'HABILIDAD_TECNICA' },
                { label: 'Idioma', value: 'IDIOMA' },
            ]
        }
    ];

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'HABILIDAD_BLANDA': return <div className="badge badge-primary badge-outline">Blanda</div>;
            case 'HABILIDAD_TECNICA': return <div className="badge badge-secondary badge-outline">Técnica</div>;
            case 'IDIOMA': return <div className="badge badge-accent badge-outline">Idioma</div>;
            default: return <div className="badge badge-ghost">Otro</div>;
        }
    };

    // Obtener filtros activos para el FilterBar
    const activeFilters = {
        ...(queryParams.categoria && { categoria: queryParams.categoria })
    };

    return (
        <PageContainer
            title="Biblioteca de Competencias"
            subtitle="Gestiona las habilidades, competencias y sus niveles para la organización."
            actions={
                <button className="btn btn-primary w-full sm:w-auto" onClick={openCreateModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Nueva Competencia
                </button>
            }
        >
            <FilterBar
                onSearch={handleSearch}
                searchTerm={searchInput}
                searchPlaceholder="Buscar competencias..."
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {loading && !competencies.length ? (
                <LoadingIndicator />
            ) : (
                <>
                    {competencies.length === 0 ? (
                        <div className="text-center py-10 opacity-60">No se encontraron competencias.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence mode='popLayout'>
                                {competencies.map(comp => (
                                    <motion.div
                                        key={comp.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="card-body p-5">
                                            <div className="flex justify-between items-start mb-1">
                                                <h2 className="card-title text-lg font-bold text-base-content">{comp.nombre}</h2>
                                                {getCategoryBadge(comp.categoria)}
                                            </div>
                                            <p className="text-sm text-base-content/70 h-10 overflow-hidden text-ellipsis line-clamp-2">{comp.descripcion}</p>

                                            <div className="flex justify-between items-end text-xs opacity-60 border-t border-base-100 pt-3 mt-auto">
                                                <span>Escala: 1-{comp.escala}</span>

                                                <div className="card-actions justify-end flex flex-row items-center gap-2">
                                                    <button
                                                        className="btn btn-square btn-outline btn-sm btn-primary"
                                                        onClick={() => openEditModal(comp)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        className="btn btn-square btn-outline btn-sm btn-error"
                                                        onClick={() => handleDeleteClick(comp)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                            {/* Page size selector */}
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-base-content/60">Mostrar:</span>
                                <select
                                    className="select select-bordered select-sm w-20"
                                    value={queryParams.items_por_pagina}
                                    onChange={(e) => updateQueryParams({ items_por_pagina: Number(e.target.value), pagina: 1 })}
                                    disabled={loading}
                                >
                                    <option value={6}>6</option>
                                    <option value={9}>9</option>
                                    <option value={12}>12</option>
                                    <option value={18}>18</option>
                                </select>
                                <span className="text-base-content/60">por página</span>
                            </div>

                            {/* Pagination controls */}
                            <div className="join">
                                <button
                                    className="join-item btn btn-sm"
                                    onClick={() => handlePageChange(queryParams?.pagina ? queryParams?.pagina - 1 : 1)}
                                    disabled={queryParams?.pagina === 1 || loading}
                                >
                                    «
                                </button>
                                {Array.from({ length: pagination?.total_paginas }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`join-item btn btn-sm ${page === queryParams?.pagina ? 'btn-active' : ''}`}
                                        onClick={
                                            queryParams?.pagina === page ? undefined
                                                : () => handlePageChange(page)
                                        }
                                        disabled={loading}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className="join-item btn btn-sm"
                                    onClick={() => handlePageChange(queryParams?.pagina ? queryParams?.pagina + 1 : 1)}
                                    disabled={queryParams?.pagina === pagination?.total_paginas || loading}
                                >
                                    »
                                </button>
                            </div>

                            {/* Pagination info */}
                            <div className="text-sm text-base-content/60">
                                Mostrando {(((queryParams.pagina || 1) - 1) * (queryParams.items_por_pagina || ITEMS_PER_PAGE)) + 1} - {Math.min((queryParams.pagina || 1) * (queryParams.items_por_pagina || ITEMS_PER_PAGE), pagination.total_items)} de {pagination.total_items}
                            </div>
                        </div>
                    )}
                </>
            )}

            <GenericModal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editingCompetency ? 'Editar Competencia' : 'Nueva Competencia'}
                size="lg"
            >
                <CompetencyForm
                    initialData={editingCompetency}
                    isLoading={loading}
                    onSubmit={editingCompetency ? handleUpdate : handleCreate}
                    onCancel={closeModal}
                />
            </GenericModal>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Competencia"
                message={deleteCompetence ? `¿Estás seguro de que deseas eliminar la competencia "${deleteCompetence.nombre}"? Esta acción no se puede deshacer.` : ""}
                confirmText="Eliminar"
                variant="danger"
            />
        </PageContainer>
    );
};

export default CompetenciesPage;