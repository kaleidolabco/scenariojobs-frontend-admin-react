import { useCallback } from 'react';
import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { UserRole } from '../constants/roles';
import { UserStatus } from '../constants/userStatus';

export interface SystemUser {
    id: string;
    email: string;
    roles: UserRole[];
    estado: UserStatus;
    ultimo_acceso?: string;
    colaborador?: {
        id?: string;
        nombres: string;
        apellidos: string;
        foto?: string;
    } | null;
}

export interface UserQueryParams {
    search?: string;
    rol?: string; // Filter by specific role (check if contained in roles)
    estado?: UserStatus;
    pagina?: number;
    items_por_pagina?: number;
    ordenar_por?: string;
    orden?: 'asc' | 'desc';
}

export interface CreateUserRequest {
    correo: string;
    entidad_id: string;
    estado?: UserStatus;
    colaborador_id?: string;
    roles?: string[];
    nombres?: string;
    apellidos?: string;
    enviar_correo?: boolean;
}

export interface UpdateUserRequest {
    correo?: string;
    estado?: UserStatus;
    colaborador_id?: string;
    roles?: string[];
    nombres?: string;
    apellidos?: string;
}

export const useUserService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token, user } = useAuthStore();

    // Helper function to get tenant ID from user profile or token
    const getTenantId = (): string => {
        return user?.entidad_id || user?.tenant_id || '';
    };

    const getUsers = useCallback(async (params?: UserQueryParams): Promise<FetchResponse | null> => {
        try {
            // Convert frontend params to backend params
            const backendParams: any = {};
            
            if (params?.search) {
                backendParams.busqueda = params.search;
            }
            
            if (params?.rol) {
                backendParams.rol = params.rol;
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
                url: `${import.meta.env.VITE_API_URL}/users`,
                params: backendParams,
                token: token || null
            })) as FetchResponse | null;

            if(response?.success === false){
                 throw new Error(response.message || 'Error al obtener usuarios');
            }

            // Map backend fields to frontend expectations safely
            if (response && response.success && response.data?.datos) {
                const mappedDatos = response.data.datos.map((u: any) => ({
                    ...u,
                    email: u.correo || u.email,
                    colaborador: u.colaborador ? {
                        id: u.colaborador.id,
                        nombres: u.colaborador.nombres,
                        apellidos: u.colaborador.apellidos,
                        foto: u.colaborador.foto
                    } : null
                }));

                return {
                    ...response,
                    data: {
                        ...response.data,
                        datos: mappedDatos
                    }
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    }, [fetchData, token, openAlert]);

    const getUserById = useCallback(async (id: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/users/${id}`,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response?.message || 'Error al obtener usuario');
            }

            // Map backend fields to frontend expectations safely
            if (response && response.success && response.data) {
                const u = response.data;
                const mappedUser = {
                    ...u,
                    email: u.correo || u.email,
                    colaborador: u.colaborador ? {
                        id: u.colaborador.id,
                        nombres: u.colaborador.nombres,
                        apellidos: u.colaborador.apellidos,
                        foto: u.colaborador.foto
                    } : null,
                    colaborador_id: u.colaborador?.id || u.colaborador_id
                };

                return {
                    ...response,
                    data: mappedUser
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    }, [fetchData, token, openAlert]);

    const createUser = async (data: CreateUserRequest): Promise<FetchResponse | null> => {
        try {
            // Add tenant ID to the request
            const requestData = {
                ...data,
                enviar_correo: false, // Para pruebas, se puede quitar esta línea o hacerla configurable
                entidad_id: getTenantId()
            };

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/users`,
                method: 'POST',
                body: requestData,
                token: token || null
            })) as FetchResponse | null;

            if(response?.success === false){
                throw new Error(response.message || 'Error al crear usuario');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updateUser = async (id: string, data: UpdateUserRequest): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/users/${id}`,
                method: 'PATCH',
                body: data,
                token: token || null
            })) as FetchResponse | null;

            if(response?.success === false){
                throw new Error(response.message || 'Error al actualizar usuario');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deleteUser = async (id: string): Promise<boolean> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/users/${id}`,
                method: 'DELETE',
                token: token || null
            });

            if(response?.success === false){
                throw new Error(response.message || 'Error al eliminar usuario');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    const resetPassword = async (id: string): Promise<boolean> => {
         try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/users/${id}/reset-password`,
                method: 'POST',
                token: token || null
            });

            if(response?.success === false){
                throw new Error(response.message || 'Error al resetear contraseña');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    return {
        getUsers,
        getUserById,
        createUser,
        updateUser,
        deleteUser,
        resetPassword,
        loading,
        error
    };
};
