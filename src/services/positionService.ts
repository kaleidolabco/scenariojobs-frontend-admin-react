import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

// Query params
export interface PositionQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    filtro?: string;
    unidad_id?: string;
    estado?: 'VACANTE' | 'OCUPADO';
}

// Types
export type PositionStatus = 'VACANTE' | 'OCUPADO';

export interface Position {
    id: string;
    nombre: string;
    unidad_id: string;
    unidad_nombre?: string; // For display
    cargo_id: string;
    cargo_nombre?: string; // For display
    jefe_puesto_id?: string | null;
    jefe_puesto_nombre?: string; // For display
    persona_id?: string | null; // Backwards compatibility mapping of colaborador_id
    persona_nombre?: string; // Backwards compatibility mapping of colaborador_nombre
    colaborador_id?: string | null;
    colaborador_nombre?: string;
    colaborador_foto?: string;
    estado: PositionStatus;
    fecha_creacion?: string;
}

export const usePositionService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token } = useAuthStore();

    const getPositions = async (params?: PositionQueryParams): Promise<FetchResponse | null> => {
        try {
            const backendParams: any = {};

            if (params?.pagina) {
                backendParams.pagina = params.pagina;
            }
            if (params?.items_por_pagina) {
                backendParams.limite = params.items_por_pagina;
            }
            if (params?.filtro) {
                backendParams.busqueda = params.filtro;
            }
            if (params?.unidad_id) {
                backendParams.unidad_id = params.unidad_id;
            }
            if (params?.estado) {
                backendParams.estado = params.estado;
            }
            if (params?.orden_por) {
                backendParams.ordenar_por = params.orden_por;
            }
            if (params?.orden) {
                backendParams.orden = params.orden;
            }

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/positions`,
                params: backendParams,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener puestos');
            }

            // Map backend fields to frontend expectations safely
            if (response && response.success && response.data?.datos) {
                const mappedDatos = response.data.datos.map((p: any) => ({
                    ...p,
                    persona_id: p.colaborador_id || null,
                    persona_nombre: p.colaborador_nombre || null,
                    colaborador_id: p.colaborador_id || null,
                    colaborador_nombre: p.colaborador_nombre || null
                }));

                return {
                    ...response,
                    data: {
                        ...response.data,
                        puestos: mappedDatos // Map for existing list usage (OrgUnitDetailPage expects 'puestos')
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

    const getPositionById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/positions/${id}`,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response?.message || 'Error al obtener detalle del puesto');
            }

            // Map backend fields to frontend expectations safely
            if (response && response.success && response.data) {
                const p = response.data;
                const mappedPosition = {
                    ...p,
                    persona_id: p.colaborador_id || null,
                    persona_nombre: p.colaborador_nombre || null,
                    colaborador_id: p.colaborador_id || null,
                    colaborador_nombre: p.colaborador_nombre || null
                };

                return {
                    ...response,
                    data: {
                        ...response.data,
                        puesto: mappedPosition // Map for existing detail usage (OrgPositionDetailPage expects 'puesto')
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

    const createPosition = async (position: Omit<Position, 'id' | 'estado'>): Promise<FetchResponse | null> => {
        try {
            const requestBody = {
                nombre: position.nombre,
                unidad_id: position.unidad_id,
                cargo_id: position.cargo_id,
                jefe_puesto_id: position.jefe_puesto_id || null
            };

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/positions`,
                method: 'POST',
                body: requestBody,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear puesto');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updatePosition = async (id: string, position: Partial<Position>): Promise<FetchResponse | null> => {
        try {
            const requestBody = {
                nombre: position.nombre,
                unidad_id: position.unidad_id,
                cargo_id: position.cargo_id,
                jefe_puesto_id: position.jefe_puesto_id || null
            };

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/positions/${id}`,
                method: 'PATCH',
                body: requestBody,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar puesto');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deletePosition = async (id: string): Promise<boolean> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/positions/${id}`,
                method: 'DELETE',
                token: token || null
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar puesto');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    const assignPerson = async (positionId: string, personId: string, startDate: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/positions/${positionId}/assign`,
                method: 'POST',
                body: { colaborador_id: personId, fecha_inicio: startDate },
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al asignar persona al puesto');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const unassignPerson = async (positionId: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/positions/${positionId}/unassign`,
                method: 'POST',
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al desasignar persona del puesto');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    return {
        getPositions,
        getPositionById,
        createPosition,
        updatePosition,
        deletePosition,
        assignPerson,
        unassignPerson,
        loading,
        error
    };
};
