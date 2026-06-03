import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompetencyService, Competency, competenciesQueryParams } from '../../services/competencyService';
import { useCategoryService, Category, getCategoryMeta } from '../../services/categoryService';
import { Pagination } from '../../services/responseType';
import CompetencyForm from '../../components/Competencies/CompetencyForm';
import CategoriesTab from '../../components/Competencies/CategoriesTab';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'biblioteca' | 'categorias';

const ITEMS_PER_PAGE = 9;

// ─── Tab header ───────────────────────────────────────────────────────────────

const TabHeader: React.FC<{
    active: ActiveTab;
    onChange: (tab: ActiveTab) => void;
}> = ({ active, onChange }) => {
    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        {
            id: 'biblioteca',
            label: 'Biblioteca',
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
        },
        {
            id: 'categorias',
            label: 'Categorías',
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="border-b border-base-200 mb-5">
            <div className="flex gap-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150
                            ${active === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── Biblioteca tab ───────────────────────────────────────────────────────────

const BibliotecaTab: React.FC<{ categories: Category[] }> = ({ categories }) => {
    const { getCompetencies, createCompetency, updateCompetency, deleteCompetency, loading } = useCompetencyService();

    const [competencies, setCompetencies] = useState<Competency[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
    const [deleteCompetence, setDeleteCompetence] = useState<Competency | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [queryParams, setQueryParams] = useState<competenciesQueryParams>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'asc',
        orden_por: 'nombre',
        filtro: '',
        categoria: undefined,
    });

    const updateQueryParam = (key: keyof competenciesQueryParams, value: any) =>
        setQueryParams((prev) => ({ ...prev, [key]: value }));

    const updateQueryParams = (updates: Partial<competenciesQueryParams>) =>
        setQueryParams((prev) => ({ ...prev, ...updates }));

    // Debounce de búsqueda
    useEffect(() => {
        const t = setTimeout(() => updateQueryParams({ filtro: searchInput, pagina: 1 }), 500);
        return () => clearTimeout(t);
    }, [searchInput]);

    const clearFilters = () =>
        setQueryParams((prev) => ({ ...prev, filtro: '', categoria: undefined, pagina: 1 }));

    const fetchData = useCallback(async () => {
        const params = Object.fromEntries(
            Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '' && v !== null)
        );
        const res = await getCompetencies(params);
        if (res) {
            setCompetencies(res.data.competencias);
            setPagination(res.data.paginacion);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    useEffect(() => {
        setCompetencies([]);
        fetchData();
    }, [fetchData]);

    const handleCreate = async (data: Omit<Competency, 'id'>) => {
        const res = await createCompetency(data);
        if (res) {
            setModalOpen(false);
            fetchData();
        }
    };

    const handleUpdate = async (data: Omit<Competency, 'id'>) => {
        if (!editingCompetency) return;
        const res = await updateCompetency(editingCompetency.id, data);
        if (res) {
            setModalOpen(false);
            setEditingCompetency(null);
            fetchData();
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteCompetence) return;
        const ok = await deleteCompetency(deleteCompetence.id);
        if (ok) {
            fetchData();
        }
        setDeleteCompetence(null);
        setShowDeleteModal(false);
    };

    const openEditModal = (comp: Competency) => { setEditingCompetency(comp); setModalOpen(true); };
    const openCreateModal = () => { setEditingCompetency(null); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingCompetency(null); };

    const handleFilterChange = (key: string, value: string | number) =>
        updateQueryParams({ [key]: value, pagina: 1 } as any);

    const handlePageChange = (page: number) => {
        if (page < 1 || (pagination && page > pagination.total_paginas)) return;
        updateQueryParam('pagina', page);
    };

    // Filtros dinámicos desde categorías cargadas
    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'categoria',
            label: 'Categoría',
            options: categories.map((c) => ({ label: c.nombre, value: c.slug })),
        },
    ];

    const activeFilters = {
        ...(queryParams.categoria && { categoria: queryParams.categoria }),
    };

    return (
        <>
            {/* Toolbar: search/filters + action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex-1">
                    <FilterBar
                        onSearch={(t) => setSearchInput(t)}
                        searchTerm={searchInput}
                        searchPlaceholder="Buscar competencias..."
                        filters={filterDefinitions}
                        activeFilters={activeFilters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                    />
                </div>
                <button className="btn btn-primary shrink-0 w-full sm:w-auto" onClick={openCreateModal}>
                    <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Competencia
                </button>
            </div>

            {loading && !competencies.length ? (
                <LoadingIndicator />
            ) : (
                <>
                    {competencies.length === 0 ? (
                        <div className="text-center py-10 opacity-60">No se encontraron competencias.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {competencies.map((comp) => {
                                    const catMeta = getCategoryMeta(comp.categoria, categories);
                                    return (
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
                                                    <h2 className="card-title text-lg font-bold text-base-content">
                                                        {comp.nombre}
                                                    </h2>
                                                    <div className={`badge badge-${catMeta.color} badge-outline`}>
                                                        {catMeta.nombre}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-base-content/70 h-10 overflow-hidden text-ellipsis line-clamp-2">
                                                    {comp.descripcion}
                                                </p>
                                                <div className="flex justify-between items-end text-xs opacity-60 border-t border-base-100 pt-3 mt-auto">
                                                    <span>Escala: 1-{comp.escala}</span>
                                                    <div className="card-actions justify-end flex flex-row items-center gap-2">
                                                        <button
                                                            className="btn btn-square btn-outline btn-sm btn-primary"
                                                            onClick={() => openEditModal(comp)}
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="btn btn-square btn-outline btn-sm btn-error"
                                                            onClick={() => { setDeleteCompetence(comp); setShowDeleteModal(true); }}
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Paginación */}
                    {pagination && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
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
                            <div className="join">
                                <button
                                    className="join-item btn btn-sm"
                                    onClick={() => handlePageChange((queryParams.pagina ?? 1) - 1)}
                                    disabled={queryParams.pagina === 1 || loading}
                                >«</button>
                                {Array.from({ length: pagination.total_paginas }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={`join-item btn btn-sm ${page === queryParams.pagina ? 'btn-active' : ''}`}
                                        onClick={queryParams.pagina === page ? undefined : () => handlePageChange(page)}
                                        disabled={loading}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className="join-item btn btn-sm"
                                    onClick={() => handlePageChange((queryParams.pagina ?? 1) + 1)}
                                    disabled={queryParams.pagina === pagination.total_paginas || loading}
                                >»</button>
                            </div>
                            <div className="text-sm text-base-content/60">
                                Mostrando {(((queryParams.pagina ?? 1) - 1) * (queryParams.items_por_pagina ?? ITEMS_PER_PAGE)) + 1}–{Math.min((queryParams.pagina ?? 1) * (queryParams.items_por_pagina ?? ITEMS_PER_PAGE), pagination.total)} de {pagination.total}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal crear/editar */}
            <GenericModal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editingCompetency ? 'Editar Competencia' : 'Nueva Competencia'}
                size="lg"
            >
                <CompetencyForm
                    initialData={editingCompetency}
                    categories={categories}
                    isLoading={loading}
                    onSubmit={editingCompetency ? handleUpdate : handleCreate}
                    onCancel={closeModal}
                />
            </GenericModal>

            {/* Modal eliminar */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Competencia"
                message={
                    deleteCompetence
                        ? `¿Estás seguro de que deseas eliminar la competencia "${deleteCompetence.nombre}"? Esta acción no se puede deshacer.`
                        : ''
                }
                confirmText="Eliminar"
                variant="danger"
            />
        </>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const CompetenciesPage: React.FC = () => {
    const { getCategories } = useCategoryService();
    const [activeTab, setActiveTab] = useState<ActiveTab>('biblioteca');
    const [categories, setCategories] = useState<Category[]>([]);

    const loadCategories = useCallback(async () => {
        const res = await getCategories();
        if (res?.success) setCategories(res.data.categorias);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    return (
        <PageContainer
            title="Competencias"
            subtitle="Gestiona las habilidades y competencias y sus categorías para la organización."
        >
            <TabHeader active={activeTab} onChange={setActiveTab} />

            <AnimatePresence mode="wait">
                {activeTab === 'biblioteca' ? (
                    <motion.div
                        key="biblioteca"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <BibliotecaTab categories={categories} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="categorias"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <CategoriesTab onCategoriesChanged={loadCategories} />
                    </motion.div>
                )}
            </AnimatePresence>
        </PageContainer>
    );
};

export default CompetenciesPage;