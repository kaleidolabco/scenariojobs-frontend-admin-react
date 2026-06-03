import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useCategoryService,
    Category,
    CategoryColor,
    slugify,
} from '../../services/categoryService';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import SelectField from '../Common/Forms/SelectField';
import GenericModal from '../Common/GenericModal';
import ConfirmationModal from '../Common/ConfirmationModal';
import LoadingIndicator from '../Common/LoadingIndicator';
import FilterBar from '../Common/FilterBar';

// ─── Color options ────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { value: CategoryColor; label: string }[] = [
    { value: 'primary',   label: 'Primario' },
    { value: 'secondary', label: 'Secundario' },
    { value: 'accent',    label: 'Acento' },
    { value: 'info',      label: 'Información' },
    { value: 'success',   label: 'Éxito' },
    { value: 'warning',   label: 'Advertencia' },
    { value: 'error',     label: 'Error' },
    { value: 'ghost',     label: 'Neutral' },
];

// ─── Badge preview ────────────────────────────────────────────────────────────

const CategoryBadge: React.FC<{ nombre: string; color: CategoryColor }> = ({ nombre, color }) => (
    <div className={`badge 
        badge-${color} 
        badge-outline
        h-auto
        py-1
        px-1
        whitespace-normal
        text-center`}>
        {nombre}
    </div>
);

// ─── Category form ────────────────────────────────────────────────────────────

interface CategoryFormProps {
    initialData?: Category | null;
    isLoading: boolean;
    onSubmit: (data: Omit<Category, 'id'>) => void;
    onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, isLoading, onSubmit, onCancel }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [slug, setSlug] = useState('');
    const [color, setColor] = useState<CategoryColor>('primary');
    const [slugEdited, setSlugEdited] = useState(false);

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre);
            setDescripcion(initialData.descripcion ?? '');
            setSlug(initialData.slug);
            setColor(initialData.color);
            setSlugEdited(true); // En edición no auto-generar slug
        } else {
            setNombre('');
            setDescripcion('');
            setSlug('');
            setColor('primary');
            setSlugEdited(false);
        }
    }, [initialData]);

    const handleNombreChange = (value: string) => {
        setNombre(value);
        if (!slugEdited) setSlug(slugify(value));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ nombre, descripcion: descripcion || undefined, slug, color });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                    label="Nombre"
                    required
                    value={nombre}
                    onChange={(e) => handleNombreChange(e.target.value)}
                    placeholder="Ej: Competencia Blanda"
                    helpText="Nombre visible para los usuarios"
                />
                <SelectField
                    label="Color del badge"
                    value={color}
                    onChange={(e) => setColor(e.target.value as CategoryColor)}
                    options={COLOR_OPTIONS}
                    helpText="Apariencia visual en las listas"
                />
            </div>

            <TextAreaField
                label="Descripción"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción de qué tipo de competencias agrupa..."
                helpText="Opcional. Ayuda a los administradores a clasificar correctamente."
            />

            {/* Slug field */}
            <div className="space-y-2">
                <label className="block">
                    <span className="label-text font-medium">Slug</span>
                    <span className="text-error ml-1">*</span>
                </label>
                <div className="flex items-center gap-2">
                    <input
                        className="input input-bordered w-full font-mono text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={slug}
                        onChange={(e) => { setSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')); setSlugEdited(true); }}
                        placeholder="HABILIDAD_BLANDA"
                        required
                        disabled={!!initialData} // El slug no se puede editar — rompe la FK con competencias
                    />
                    {!initialData && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-square shrink-0"
                            onClick={() => { setSlug(slugify(nombre)); setSlugEdited(false); }}
                            title="Regenerar desde nombre"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>
                <p className="text-xs text-base-content/60">
                    {initialData
                        ? 'El slug no se puede cambiar porque las competencias existentes lo referencian.'
                        : 'Identificador único en mayúsculas. Se genera automáticamente desde el nombre.'}
                </p>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-base-200 px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-base-content/50 font-medium uppercase tracking-wider">Vista previa:</span>
                <CategoryBadge nombre={nombre || 'Nombre'} color={color} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading || !nombre || !slug}>
                    {isLoading ? <span className="loading loading-spinner loading-sm" /> : null}
                    {initialData ? 'Guardar cambios' : 'Crear categoría'}
                </button>
            </div>
        </form>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface CategoriesTabProps {
    /** Callback para notificar al padre que las categorías cambiaron (reload FilterBar, etc.) */
    onCategoriesChanged: () => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({ onCategoriesChanged }) => {
    const { getCategories, createCategory, updateCategory, deleteCategory, loading } = useCategoryService();

    const [categories, setCategories] = useState<Category[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const loadCategoriesData = useCallback(async (searchTerm: string = '') => {
        const res = await getCategories(searchTerm ? { search: searchTerm } : undefined);
        if (res?.success) setCategories(res.data.categorias);
    }, [getCategories]);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        loadCategoriesData(debouncedSearch);
    }, [loadCategoriesData, debouncedSearch]);

    const handleSearch = (searchTerm: string) => {
        setSearch(searchTerm);
    };

    const handleCreate = async (data: Omit<Category, 'id'>) => {
        const res = await createCategory(data);
        if (res?.success) {
            await loadCategoriesData(search);
            onCategoriesChanged();
            setModalOpen(false);
        }
    };

    const handleUpdate = async (data: Omit<Category, 'id'>) => {
        if (!editingCategory) return;
        const res = await updateCategory(editingCategory.id, data);
        if (res?.success) {
            await loadCategoriesData(search);
            onCategoriesChanged();
            setModalOpen(false);
            setEditingCategory(null);
        }
    };

    const handleDeleteClick = (cat: Category) => {
        setDeletingCategory(cat);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCategory) return;
        const ok = await deleteCategory(deletingCategory.id);
        if (ok) {
            await loadCategoriesData(search);
            onCategoriesChanged();
        }
        setDeletingCategory(null);
        setShowDeleteModal(false);
    };

    const openEdit = (cat: Category) => { setEditingCategory(cat); setModalOpen(true); };
    const openCreate = () => { setEditingCategory(null); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditingCategory(null); };

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-start">
                <FilterBar
                    onSearch={handleSearch}
                    searchTerm={search}
                    searchPlaceholder="Buscar categorías..."
                    className="flex-1"
                />
                <button className="btn btn-primary shrink-0 w-full sm:w-auto" onClick={openCreate}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva categoría
                </button>
            </div>

            {/* Content */}
            {loading && !categories.length ? (
                <LoadingIndicator />
            ) : categories.length === 0 && search === '' ? (
                <div className="text-center py-14 text-base-content/40">
                    <svg className="h-10 w-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="font-medium">No hay categorías</p>
                    <p className="text-sm mt-1">
                        Crea la primera categoría para comenzar.
                    </p>
                </div>
            ) : categories.length === 0 && search !== '' ? (
                <div className="text-center py-14 text-base-content/40">
                    <svg className="h-10 w-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="font-medium">No se encontraron categorías</p>
                    <p className="text-sm mt-1">
                        Ninguna categoría coincide con la búsqueda "{search}".
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-base-200">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr className="text-xs uppercase tracking-wider text-base-content/50 bg-base-200/60">
                                <th className="font-semibold">Categoría</th>
                                <th className="font-semibold hidden sm:table-cell">Descripción</th>
                                <th className="font-semibold hidden md:table-cell">Slug</th>
                                <th className="font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {categories.map((cat) => (
                                    <motion.tr
                                        key={cat.id}
                                        layout
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <CategoryBadge nombre={cat.nombre} color={cat.color} />
                                                {/* descripción y slug en mobile */}
                                                <p className="text-xs text-base-content/50 sm:hidden line-clamp-1">{cat.descripcion}</p>
                                                <span className="font-mono text-xs text-base-content/30 md:hidden">{cat.slug}</span>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell">
                                            <p className="text-sm text-base-content/70 max-w-xs line-clamp-2">
                                                {cat.descripcion ?? <span className="italic text-base-content/30">Sin descripción</span>}
                                            </p>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <span className="font-mono text-xs bg-base-200 px-2 py-1 rounded">
                                                {cat.slug}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="btn btn-square btn-outline btn-sm btn-primary"
                                                    onClick={() => openEdit(cat)}
                                                    title="Editar"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="btn btn-square btn-outline btn-sm btn-error"
                                                    onClick={() => handleDeleteClick(cat)}
                                                    title="Eliminar"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info footer */}
            {categories.length > 0 && (
                <p className="text-xs text-base-content/40 text-right">
                    {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
                </p>
            )}

            {/* Create / Edit modal */}
            <GenericModal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
                size="lg"
            >
                <CategoryForm
                    initialData={editingCategory}
                    isLoading={loading}
                    onSubmit={editingCategory ? handleUpdate : handleCreate}
                    onCancel={closeModal}
                />
            </GenericModal>

            {/* Delete confirmation modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setDeletingCategory(null); }}
                onConfirm={handleConfirmDelete}
                title="Eliminar categoría"
                message={
                    deletingCategory
                        ? `¿Estás seguro de que deseas eliminar la categoría "${deletingCategory.nombre}"? Las competencias asignadas a esta categoría quedarán sin clasificar.`
                        : ''
                }
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default CategoriesTab;
