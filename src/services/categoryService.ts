import { useCallback } from 'react';
import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

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
    pagina?: number;
    items_por_pagina?: number;
}

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
    const { token } = useAuthStore();

    // ── GET list ──────────────────────────────────────────────────────────────

    const getCategories = useCallback(async (params?: CategoryQueryParams): Promise<FetchResponse | null> => {
        try {
            const backendParams: any = {};
            
            if (params?.search) {
                backendParams.busqueda = params.search;
            }
            if (params?.pagina) {
                backendParams.pagina = params.pagina;
            }
            if (params?.items_por_pagina) {
                backendParams.limite = params.items_por_pagina;
            }

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/competencies/categories`,
                params: backendParams,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las categorías');
            }

            // Map backend fields to frontend expectations safely (datos -> categorias)
            if (response && response.success && response.data?.datos) {
                return {
                    ...response,
                    data: {
                        ...response.data,
                        categorias: response.data.datos
                    }
                };
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    }, [fetchData, token, openAlert]);

    // ── CREATE ────────────────────────────────────────────────────────────────

    const createCategory = useCallback(async (
        data: Omit<Category, 'id'>
    ): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/competencies/categories`,
                method: 'POST',
                body: data,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear la categoría');
            }

            // Map backend fields to frontend expectations safely (data -> categoria)
            if (response && response.success && response.data) {
                return {
                    ...response,
                    data: {
                        ...response.data,
                        categoria: response.data
                    }
                };
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    }, [fetchData, token, openAlert]);

    // ── UPDATE ────────────────────────────────────────────────────────────────

    const updateCategory = useCallback(async (
        id: string,
        data: Partial<Omit<Category, 'id'>>
    ): Promise<FetchResponse | null> => {
        try {
            const { slug, ...bodyData } = data; // slug is inmutable according to API docs

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/competencies/categories/${id}`,
                method: 'PATCH',
                body: bodyData,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar la categoría');
            }

            // Map backend fields to frontend expectations safely (data -> categoria)
            if (response && response.success && response.data) {
                return {
                    ...response,
                    data: {
                        ...response.data,
                        categoria: response.data
                    }
                };
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    }, [fetchData, token, openAlert]);

    // ── DELETE ────────────────────────────────────────────────────────────────

    const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/competencies/categories/${id}`,
                method: 'DELETE',
                token: token || null
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar la categoría');
            }

            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    }, [fetchData, token, openAlert]);

    return {
        getCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        loading,
        error,
    };
};
