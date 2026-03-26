import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryColor =
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'ghost';

export interface Category {
    id: string;
    nombre: string;
    descripcion?: string;
    /** Valor que se almacena en Competency.categoria — debe ser único */
    slug: string;
    /** Variante de badge DaisyUI */
    color: CategoryColor;
}

export interface CategoryQueryParams {
    search?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// Fuente mutable — las 4 categorías originales conservan sus slugs exactos
// para mantener compatibilidad con las competencias ya existentes
let _db: Category[] = [
    {
        id: 'cat-1',
        nombre: 'Competencia Blanda',
        descripcion: 'Habilidades interpersonales, de comunicación y relacionamiento.',
        slug: 'HABILIDAD_BLANDA',
        color: 'primary',
    },
    {
        id: 'cat-2',
        nombre: 'Competencia Técnica',
        descripcion: 'Conocimientos y habilidades técnicas específicas del puesto.',
        slug: 'HABILIDAD_TECNICA',
        color: 'secondary',
    },
    {
        id: 'cat-3',
        nombre: 'Idioma',
        descripcion: 'Dominio de idiomas locales o extranjeros.',
        slug: 'IDIOMA',
        color: 'accent',
    },
    {
        id: 'cat-4',
        nombre: 'Conocimiento Específico',
        descripcion: 'Normas, marcos de trabajo o herramientas específicas del negocio.',
        slug: 'CONOCIMIENTO_ESPECIFICO',
        color: 'info',
    },
    {
        id: 'cat-5',
        nombre: 'Competencias Organizacionales',
        descripcion: 'Factor de Competencias Organizacionales (20%) - Orientación al Servicio, Resultados, Trabajo en Equipo, Comunicación y Proactividad.',
        slug: 'COMPETENCIA_ORGANIZACIONAL',
        color: 'warning',
    },
    {
        id: 'cat-6',
        nombre: 'Entorno Laboral',
        descripcion: 'Factor de Entorno Laboral (20%) - Compromiso, Relaciones Interpersonales, Disciplina, Organización y Responsabilidad.',
        slug: 'COMPETENCIA_ENTORNO_LABORAL',
        color: 'error',
    },
    {
        id: 'cat-7',
        nombre: 'Productividad',
        descripcion: 'Factor de Productividad (60%) - Oportunidad, Efectividad y Calidad en la ejecución de funciones.',
        slug: 'COMPETENCIA_PRODUCTIVIDAD',
        color: 'success',
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Genera un slug desde un nombre: "Mi Categoría" → "MI_CATEGORIA" */
export const slugify = (nombre: string): string =>
    nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

/** Devuelve el label y color de una categoría por su slug, con fallback */
export const getCategoryMeta = (
    slug: string,
    categories: Category[]
): { nombre: string; color: CategoryColor } => {
    const found = categories.find((c) => c.slug === slug);
    return found
        ? { nombre: found.nombre, color: found.color }
        : { nombre: slug, color: 'ghost' };
};

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useCategoryService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // ── GET list ──────────────────────────────────────────────────────────────

    const getCategories = async (params?: CategoryQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [..._db];

            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(
                    (c) =>
                        c.nombre.toLowerCase().includes(q) ||
                        c.descripcion?.toLowerCase().includes(q)
                );
            }

            const response = (await fetchData({
                url: '/api/categories',
                mockData: successMock({ categorias: filtered }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las categorías');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── CREATE ────────────────────────────────────────────────────────────────

    const createCategory = async (
        data: Omit<Category, 'id'>
    ): Promise<FetchResponse | null> => {
        try {
            // Validar slug único
            if (_db.some((c) => c.slug === data.slug)) {
                throw new Error(`Ya existe una categoría con el slug "${data.slug}"`);
            }

            const newCategory: Category = {
                ...data,
                id: `cat-${Math.random().toString(36).slice(2, 9)}`,
            };

            _db = [..._db, newCategory];

            const response = (await fetchData({
                url: '/api/categories',
                method: 'POST',
                body: data,
                mockData: successMock({ categoria: newCategory }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear la categoría');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── UPDATE ────────────────────────────────────────────────────────────────

    const updateCategory = async (
        id: string,
        data: Partial<Omit<Category, 'id'>>
    ): Promise<FetchResponse | null> => {
        try {
            // Validar slug único si cambió
            if (data.slug && _db.some((c) => c.slug === data.slug && c.id !== id)) {
                throw new Error(`Ya existe otra categoría con el slug "${data.slug}"`);
            }

            _db = _db.map((c) => (c.id === id ? { ...c, ...data } : c));

            const response = (await fetchData({
                url: `/api/categories/${id}`,
                method: 'PUT',
                body: data,
                mockData: successMock({ categoria: { ...data, id } }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar la categoría');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    const deleteCategory = async (id: string): Promise<boolean> => {
        try {
            _db = _db.filter((c) => c.id !== id);

            await fetchData({
                url: `/api/categories/${id}`,
                method: 'DELETE',
                mockData: successMock({ success: true }),
            });

            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    return {
        getCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        loading,
        error,
    };
};
