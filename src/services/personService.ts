import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

export interface Person {
    id: string;
    nombres: string;
    apellidos: string;
    email_personal?: string;
    telefono?: string;
    foto?: string;
    fecha_ingreso?: string;
    fecha_nacimiento?: string;
    departamento?: string;
    puesto_id?: string;
    puesto_nombre?: string;
    usuario_id?: string;
    usuario_email?: string; // For display purposes
    estado: 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
}

export interface PersonQueryParams {
    search?: string;
    departamento?: string;
    estado?: string;
    pagina?: number;
    items_por_pagina?: number;
    ordenar_por?: string;
    orden?: 'asc' | 'desc';
}

export const usePersonService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token } = useAuthStore();
    
    const getPeople = async (params?: PersonQueryParams): Promise<FetchResponse | null> => {
        try {
            const backendParams: any = {};

            if (params?.search) {
                backendParams.busqueda = params.search;
            }

            if (params?.departamento) {
                backendParams.departamento = params.departamento;
            }

            if (params?.estado) {
                backendParams.estado = params.estado;
            }

            if (params?.pagina) {
                backendParams.pagina = params.pagina;
            }

            if (params?.items_por_pagina) {
                backendParams.limite = params.items_por_pagina;
            }

            if (params?.ordenar_por) {
                backendParams.ordenar_por = params.ordenar_por;
            }

            if (params?.orden) {
                backendParams.orden = params.orden;
            }

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/collaborators`,
                params: backendParams,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener personal');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const getPersonById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/collaborators/${id}`,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                 throw new Error(response?.message || 'Error al obtener detalle del colaborador');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createPerson = async (data: Omit<Person, 'id'>): Promise<FetchResponse | null> => {
        try {
            const requestBody: any = {
                nombres: data.nombres,
                apellidos: data.apellidos,
                email_personal: data.email_personal,
                telefono: data.telefono,
                foto_url: data.foto, // From api docs: foto_url is expected, but let's send both or map appropriately
                fecha_nacimiento: data.fecha_nacimiento,
                fecha_ingreso: data.fecha_ingreso,
                estado: data.estado || 'ACTIVO',
                puesto_id: data.puesto_id,
                usuario_id: data.usuario_id
            };

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/collaborators`,
                method: 'POST',
                body: requestBody,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear colaborador');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updatePerson = async (id: string, data: Partial<Person>): Promise<FetchResponse | null> => {
        try {
            const requestBody: any = {
                nombres: data.nombres,
                apellidos: data.apellidos,
                email_personal: data.email_personal,
                telefono: data.telefono,
                foto_url: data.foto,
                fecha_nacimiento: data.fecha_nacimiento,
                fecha_ingreso: data.fecha_ingreso,
                estado: data.estado,
                puesto_id: data.puesto_id,
                usuario_id: data.usuario_id
            };

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/collaborators/${id}`,
                method: 'PATCH',
                body: requestBody,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar colaborador');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deletePerson = async (id: string): Promise<boolean> => {
         try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/collaborators/${id}`,
                method: 'DELETE',
                token: token || null
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar colaborador');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    return {
        getPeople,
        getPersonById,
        createPerson,
        updatePerson,
        deletePerson,
        loading,
        error
    };
};
