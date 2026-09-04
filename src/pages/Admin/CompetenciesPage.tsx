import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompetencyService, Competency, CompetenciesQueryParams } from '../../services/competencyService';
import { useCategoryService, Category, getCategoryMeta } from '../../services/categoryService';
import { Pagination } from '../../services/responseType';
import CompetencyForm from '../../components/Competencies/CompetencyForm';
import CategoriesTab from '../../components/Competencies/CategoriesTab';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Tabs from '../../components/Common/Tabs';
import Button from '../../components/Common/Button';
import { Plus, Pencil, Trash2, ClipboardList, Tag } from '../../components/Common/Icon';


const ITEMS_PER_PAGE = 9;

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
    const [queryParams, setQueryParams] = useState<CompetenciesQueryParams>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'asc',
        orden_por: 'nombre',
        filtro: '',
        categoria: undefined,
    });

    const updateQueryParam = (key: keyof CompetenciesQueryParams, value: any) =>
        setQueryParams((prev) => ({ ...prev, [key]: value }));

    const updateQueryParams = (updates: Partial<CompetenciesQueryParams>) =>
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

    const prevQueryParamsRef = useRef<CompetenciesQueryParams | null>(null);

    useEffect(() => {
        const currentQueryParams = queryParams;
        const prevQueryParams = prevQueryParamsRef.current;

        // Only fetch if it's the initial load OR if queryParams have genuinely changed.
        // This prevents double-fetching in React 18+ StrictMode on initial mount
        // while still allowing fetches on filter/search changes.
        if (prevQueryParams === null || JSON.stringify(currentQueryParams) !== JSON.stringify(prevQueryParams)) {
            setCompetencies([]); // Clear competencies before fetching new data
            fetchData();
        }

        prevQueryParamsRef.current = currentQueryParams;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

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
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-start">
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
                <Button variant="primary" leftIcon={Plus} onClick={openCreateModal} className="shrink-0 w-full sm:w-auto">
                    Nueva Competencia
                </Button>
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
                                                <div className="flex justify-between gap-3 items-start mb-1">
                                                    <h2 className="card-title text-lg font-bold flex-1">
                                                        {comp.nombre}
                                                    </h2>

                                                    <div className={`badge
                                                        badge-${catMeta.color}
                                                        badge-outline
                                                        h-auto
                                                        py-1
                                                        px-1
                                                        whitespace-normal
                                                        text-center`}>
                                                        {catMeta.nombre} 
                                                    </div>
                                                </div>
                                                <p className="text-sm text-base-content/70 h-10 overflow-hidden text-ellipsis line-clamp-2">
                                                    {comp.descripcion}
                                                </p>
                                                <div className="flex justify-between items-end text-xs opacity-60 border-t border-base-100 pt-3 mt-auto">
                                                    <span>Escala: 1-{comp.escala}</span>
                                                    <div className="card-actions justify-end flex flex-row items-center gap-2">
                                                        <Button variant="primary" outline size="sm" shape="square" leftIcon={Pencil} onClick={() => openEditModal(comp)} />
                                                        <Button variant="error" outline size="sm" shape="square" leftIcon={Trash2} onClick={() => { setDeleteCompetence(comp); setShowDeleteModal(true); }} />
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
    const [activeTab, setActiveTab] = useState<string>("biblioteca");
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
            <Tabs
                tabs={[
                    {
                        id: 'biblioteca',
                        label: 'Biblioteca',
                        icon: <ClipboardList size={16} />,
                    },
                    {
                        id: 'categorias',
                        label: 'Categorías',
                        icon: <Tag size={16} />,
                    },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                variant="bordered"
            />

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