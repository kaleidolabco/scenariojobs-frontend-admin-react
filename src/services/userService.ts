import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock, errorMock } from './responseType';
import useUIStore from '../store/uiStore';
import { Person } from './personService';

export interface SystemUser {
    id: string;
    email: string;
    roles: ('ADMIN' | 'HR_MANAGER' | 'EVALUATOR' | 'EMPLOYEE')[];
    estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
    ultimo_acceso?: string;
    persona_id?: string;
    persona?: {
        nombres: string;
        apellidos: string;
        foto?: string;
    };
}

export interface UserQueryParams {
    search?: string;
    rol?: string; // Filter by specific role (check if contained in roles)
    estado?: string;
    page?: number;
    pageSize?: number;
}

// Mock Data
let MOCK_USERS: SystemUser[] = [
    {
        id: 'usr_1',
        email: 'admin@scenariojobs.com',
        roles: ['ADMIN'],
        estado: 'ACTIVO',
        ultimo_acceso: '2023-11-25T10:30:00Z',
        persona_id: 'per_1',
        persona: { nombres: 'Juan', apellidos: 'Admin' }
    },
    {
        id: 'usr_2',
        email: 'rrhh@scenariojobs.com',
        roles: ['HR_MANAGER'],
        estado: 'ACTIVO',
        ultimo_acceso: '2023-11-24T15:45:00Z',
        persona_id: 'per_2',
        persona: { nombres: 'María', apellidos: 'Talento' }
    },
    {
        id: 'usr_3',
        email: 'tech_lead@scenariojobs.com',
        roles: ['EVALUATOR', 'EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2023-11-20T09:15:00Z',
        persona_id: 'per_3',
        persona: { nombres: 'Carlos', apellidos: 'Técnico' }
    },
    {
        id: 'usr_4',
        email: 'blocked@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'BLOQUEADO',
        ultimo_acceso: '2023-10-15T11:00:00Z'
    }
];

export const useUserService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    
    const getUsers = async (params?: UserQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [...MOCK_USERS];

            if (params?.search) {
                const lowerSearch = params.search.toLowerCase();
                filtered = filtered.filter(u => 
                    u.email.toLowerCase().includes(lowerSearch) ||
                    (u.persona && (u.persona.nombres + ' ' + u.persona.apellidos).toLowerCase().includes(lowerSearch))
                );
            }

            if (params?.rol) {
                filtered = filtered.filter(u => u.roles.includes(params.rol as any));
            }

            if (params?.estado) {
                filtered = filtered.filter(u => u.estado === params.estado);
            }

            const response = (await fetchData({
                url: '/api/users',
                params: params as any,
                mockData: successMock({
                    usuarios: filtered,
                    total: filtered.length
                })
            })) as FetchResponse | null;

            if(response?.success === false){
                 throw new Error(response.message || 'Error al obtener usuarios');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const getUserById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const user = MOCK_USERS.find(u => u.id === id);
            
            const mockResponse = user 
                ? successMock({ usuario: user })
                : errorMock('Usuario no encontrado');

            const response = (await fetchData({
                url: `/api/users/${id}`,
                mockData: mockResponse
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response?.message || 'Error');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createUser = async (data: Omit<SystemUser, 'id'>): Promise<FetchResponse | null> => {
        try {
            const newUser: SystemUser = {
                ...data,
                id: 'usr_' + Math.random().toString(36).substr(2, 9),
                estado: 'ACTIVO' // Default
            };
            MOCK_USERS.push(newUser);
            
            return (await fetchData({
                url: '/api/users',
                method: 'POST',
                body: data as any,
                mockData: successMock({ usuario: newUser })
            })) as FetchResponse | null;
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : String(error);
             openAlert(errorMessage, 'error');
             return null;
        }
    };

    const updateUser = async (id: string, data: Partial<SystemUser>): Promise<FetchResponse | null> => {
        try {
            const index = MOCK_USERS.findIndex(u => u.id === id);
            if (index === -1) throw new Error('Usuario no encontrado');

            MOCK_USERS[index] = { ...MOCK_USERS[index], ...data };

            return (await fetchData({
                url: `/api/users/${id}`,
                method: 'PUT',
                body: data as any,
                mockData: successMock({ usuario: MOCK_USERS[index] })
            })) as FetchResponse | null;
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : String(error);
             openAlert(errorMessage, 'error');
             return null;
        }
    };

    const deleteUser = async (id: string): Promise<boolean> => {
        try {
            MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);

            await fetchData({
                url: `/api/users/${id}`,
                method: 'DELETE',
                mockData: successMock({ success: true })
            });
            return true;
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : String(error);
             openAlert(errorMessage, 'error');
             return false;
        }
    };

    const resetPassword = async (id: string): Promise<boolean> => {
         try {
            console.log(`Password reset for user ${id}`);
            
            await fetchData({
                url: `/api/users/${id}/reset-password`,
                method: 'POST',
                mockData: successMock({ success: true })
            });

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
