import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

// Types
export type OrgUnitType = 'DIVISION' | 'AREA' | 'DEPARTAMENTO' | 'EQUIPO' | 'CELULA' | 'OTRO';

export interface OrgUnit {
    id: string;
    nombre: string;
    tipo: OrgUnitType;
    padre_id?: string | null;
    descripcion?: string;
    subunidades?: OrgUnit[]; // Recursive structure for UI
    nivel?: number; // Helper for indentation if needed
    total_puestos?: number; // Number of positions in this unit
}

// Helper to map backend Org Unit to frontend expectation
const mapUnit = (u: any): OrgUnit => {
    return {
        id: u.id,
        nombre: u.nombre,
        tipo: u.tipo && typeof u.tipo === 'object' ? u.tipo.codigo : (u.tipo_codigo || u.tipo),
        padre_id: u.padre_id || null,
        descripcion: u.descripcion || '',
        total_puestos: u.total_puestos || 0,
        subunidades: Array.isArray(u.subunidades) ? u.subunidades.map(mapUnit) : []
    };
};

export const useOrgUnitService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token } = useAuthStore();

    // GET Tree
    const getOrgTree = async (): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/units`,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la estructura');
            }

            // Map response array of root nodes recursively
            if (response && response.success && Array.isArray(response.data)) {
                const mappedUnidades = response.data.map(mapUnit);
                return {
                    ...response,
                    data: {
                        unidades: mappedUnidades
                    }
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    // CREATE
    const createUnit = async (unit: Omit<OrgUnit, 'id' | 'subunidades'>): Promise<FetchResponse | null> => {
        try {
            const requestData = {
                nombre: unit.nombre,
                descripcion: unit.descripcion,
                tipo_codigo: unit.tipo,
                padre_id: unit.padre_id || null
            };

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/units`,
                method: 'POST',
                body: requestData,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear la unidad');
            }

            if (response && response.success && response.data) {
                return {
                    ...response,
                    data: {
                        unidad: mapUnit(response.data)
                    }
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    // UPDATE
    const updateUnit = async (id: string, unit: Partial<OrgUnit>): Promise<FetchResponse | null> => {
        try {
            const requestData: any = {};
            if (unit.nombre !== undefined) requestData.nombre = unit.nombre;
            if (unit.descripcion !== undefined) requestData.descripcion = unit.descripcion;
            if (unit.tipo !== undefined) requestData.tipo_codigo = unit.tipo;

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/units/${id}`,
                method: 'PATCH',
                body: requestData,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar la unidad');
            }

            if (response && response.success && response.data) {
                return {
                    ...response,
                    data: {
                        unidad: mapUnit(response.data)
                    }
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    // DELETE
    const deleteUnit = async (id: string): Promise<boolean> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/units/${id}`,
                method: 'DELETE',
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar la unidad');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    // GET Unit by ID (with details)
    const getUnitById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/units/${id}`,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la unidad');
            }

            if (response && response.success && response.data) {
                return {
                    ...response,
                    data: {
                        unidad: mapUnit(response.data)
                    }
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    return {
        getOrgTree,
        getUnitById,
        createUnit,
        updateUnit,
        deleteUnit,
        loading,
        error
    };
};
