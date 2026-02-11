import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock, errorMock } from './responseType';
import useUIStore from '../store/uiStore';

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
    pagina?: number;
    items_por_pagina?: number;
}

// Mock Data - All 55 users from CSV with appropriate roles
let MOCK_USERS: SystemUser[] = [
    // ADMIN - Gerente General
    {
        id: 'usr_13',
        email: 'juan.erazo@scenariojobs.com',
        roles: ['ADMIN'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T20:30:00Z',
        persona_id: 'per_13',
        persona: { nombres: 'Juan Fernando', apellidos: 'Erazo Ramirez' }
    },
    // HR_MANAGER - Lider Talento Humano, Director Gestion Organizacional
    {
        id: 'usr_9',
        email: 'claudia.cifuentes@scenariojobs.com',
        roles: ['HR_MANAGER', 'EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T19:45:00Z',
        persona_id: 'per_9',
        persona: { nombres: 'Claudia Fernanda', apellidos: 'Cifuentes Marin' }
    },
    {
        id: 'usr_39',
        email: 'carolina.ordonez@scenariojobs.com',
        roles: ['HR_MANAGER', 'EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T18:20:00Z',
        persona_id: 'per_39',
        persona: { nombres: 'Carolina', apellidos: 'Ordoñez Lopez' }
    },
    // EVALUATOR - Directors and Leaders
    {
        id: 'usr_10',
        email: 'diego.cifuentes@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T17:30:00Z',
        persona_id: 'per_10',
        persona: { nombres: 'Diego Alejandro', apellidos: 'Cifuentes Marin' }
    },
    {
        id: 'usr_38',
        email: 'ana.ocana@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T16:15:00Z',
        persona_id: 'per_38',
        persona: { nombres: 'Ana Cristina', apellidos: 'Ocaña Guerrero' }
    },
    {
        id: 'usr_30',
        email: 'leonardo.lopez@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T15:00:00Z',
        persona_id: 'per_30',
        persona: { nombres: 'Leonardo Pablo', apellidos: 'Lopez Zuluaga' }
    },
    {
        id: 'usr_32',
        email: 'john.marin@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T14:30:00Z',
        persona_id: 'per_32',
        persona: { nombres: 'John Fredy', apellidos: 'Marin Cortazar' }
    },
    {
        id: 'usr_40',
        email: 'luz.ortiz@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T13:45:00Z',
        persona_id: 'per_40',
        persona: { nombres: 'Luz Mayerlin', apellidos: 'Ortiz Florez' }
    },
    {
        id: 'usr_54',
        email: 'ana.aranda@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T12:20:00Z',
        persona_id: 'per_54',
        persona: { nombres: 'Ana Cristina', apellidos: 'Aranda Castrillon' }
    },
    {
        id: 'usr_22',
        email: 'rolando.hernandez@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T11:30:00Z',
        persona_id: 'per_22',
        persona: { nombres: 'Rolando', apellidos: 'Hernandez Lopez' }
    },
    {
        id: 'usr_27',
        email: 'kevin.landazury@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T10:45:00Z',
        persona_id: 'per_27',
        persona: { nombres: 'Kevin', apellidos: 'Landazury Guerrero' }
    },
    {
        id: 'usr_53',
        email: 'jhon.bedoya@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T09:30:00Z',
        persona_id: 'per_53',
        persona: { nombres: 'Jhon Steven', apellidos: 'Bedoya Ramirez' }
    },
    {
        id: 'usr_49',
        email: 'anderson.tangarife@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T08:15:00Z',
        persona_id: 'per_49',
        persona: { nombres: 'Anderson', apellidos: 'Tangarife Ortiz' }
    },
    {
        id: 'usr_50',
        email: 'jaider.valencia@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T07:45:00Z',
        persona_id: 'per_50',
        persona: { nombres: 'Jaider Duvan', apellidos: 'Valencia Segura' }
    },
    {
        id: 'usr_48',
        email: 'luis.rosero@scenariojobs.com',
        roles: ['EVALUATOR'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T20:30:00Z',
        persona_id: 'per_48',
        persona: { nombres: 'Luis Miguel', apellidos: 'Rosero Mingan' }
    },
    // EMPLOYEE - All other employees
    {
        id: 'usr_1',
        email: 'carlos.acosta@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T19:00:00Z',
        persona_id: 'per_1',
        persona: { nombres: 'Carlos Alberto', apellidos: 'Acosta Angulo' }
    },
    {
        id: 'usr_2',
        email: 'yeiler.alvarez@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T18:30:00Z',
        persona_id: 'per_2',
        persona: { nombres: 'Yeiler', apellidos: 'Alvarez Rodriguez' }
    },
    {
        id: 'usr_3',
        email: 'juan.alzate@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T17:45:00Z',
        persona_id: 'per_3',
        persona: { nombres: 'Juan Camilo', apellidos: 'Alzate Murillo' }
    },
    {
        id: 'usr_4',
        email: 'alejandra.arguello@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T16:30:00Z',
        persona_id: 'per_4',
        persona: { nombres: 'Alejandra', apellidos: 'Arguello Holguin' }
    },
    {
        id: 'usr_5',
        email: 'johan.asprilla@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T15:45:00Z',
        persona_id: 'per_5',
        persona: { nombres: 'Johan', apellidos: 'Asprilla Quiñonez' }
    },
    {
        id: 'usr_6',
        email: 'julian.britto@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T14:20:00Z',
        persona_id: 'per_6',
        persona: { nombres: 'Julian', apellidos: 'Britto Azcarate' }
    },
    {
        id: 'usr_7',
        email: 'jose.castro@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T13:30:00Z',
        persona_id: 'per_7',
        persona: { nombres: 'Jose Luis', apellidos: 'Castro Valderruten' }
    },
    {
        id: 'usr_8',
        email: 'edier.castro@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T12:45:00Z',
        persona_id: 'per_8',
        persona: { nombres: 'Edier Johan', apellidos: 'Castro Vargas' }
    },
    {
        id: 'usr_11',
        email: 'carlos.duque@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T11:15:00Z',
        persona_id: 'per_11',
        persona: { nombres: 'Carlos Danny', apellidos: 'Duque Contreras' }
    },
    {
        id: 'usr_12',
        email: 'camilo.enciso@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T10:30:00Z',
        persona_id: 'per_12',
        persona: { nombres: 'Camilo Andres', apellidos: 'Enciso Rojas' }
    },
    {
        id: 'usr_14',
        email: 'jhon.escarraga@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T09:45:00Z',
        persona_id: 'per_14',
        persona: { nombres: 'Jhon Jairo', apellidos: 'Escarraga Lasprilla' }
    },
    {
        id: 'usr_15',
        email: 'andres.garcia@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T08:30:00Z',
        persona_id: 'per_15',
        persona: { nombres: 'Andres Leonardo', apellidos: 'Garcia Yara' }
    },
    {
        id: 'usr_16',
        email: 'jorge.garzon@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-10T07:15:00Z',
        persona_id: 'per_16',
        persona: { nombres: 'Jorge Eduardo', apellidos: 'Garzon Galeano' }
    },
    {
        id: 'usr_17',
        email: 'jeffrey.gazabon@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T20:00:00Z',
        persona_id: 'per_17',
        persona: { nombres: 'Jeffrey Jose', apellidos: 'Gazabon Acosta' }
    },
    {
        id: 'usr_18',
        email: 'jean.giron@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T19:30:00Z',
        persona_id: 'per_18',
        persona: { nombres: 'Jean Sebastian', apellidos: 'Giron Montes' }
    },
    {
        id: 'usr_19',
        email: 'duvan.gongora@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T18:45:00Z',
        persona_id: 'per_19',
        persona: { nombres: 'Duvan Dario', apellidos: 'Gongora Quiñonez' }
    },
    {
        id: 'usr_20',
        email: 'juan.gonzalez@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T17:30:00Z',
        persona_id: 'per_20',
        persona: { nombres: 'Juan Pablo', apellidos: 'Gonzalez Velasco' }
    },
    {
        id: 'usr_21',
        email: 'jorge.guerra@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T16:15:00Z',
        persona_id: 'per_21',
        persona: { nombres: 'Jorge Julian', apellidos: 'Guerra Riaño' }
    },
    {
        id: 'usr_23',
        email: 'andres.hernandez@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T15:00:00Z',
        persona_id: 'per_23',
        persona: { nombres: 'Andres Felipe', apellidos: 'Hernandez Polindara' }
    },
    {
        id: 'usr_24',
        email: 'joan.hurtado@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T14:30:00Z',
        persona_id: 'per_24',
        persona: { nombres: 'Joan Sebastian', apellidos: 'Hurtado Angulo' }
    },
    {
        id: 'usr_25',
        email: 'johan.hurtado@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T13:45:00Z',
        persona_id: 'per_25',
        persona: { nombres: 'Johan Esti', apellidos: 'Hurtado Orobio' }
    },
    {
        id: 'usr_26',
        email: 'ivan.hurtado@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T12:30:00Z',
        persona_id: 'per_26',
        persona: { nombres: 'Ivan Dario', apellidos: 'Hurtado Quintero' }
    },
    {
        id: 'usr_28',
        email: 'juan.largo@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T11:15:00Z',
        persona_id: 'per_28',
        persona: { nombres: 'Juan Sebastian', apellidos: 'Largo Muñoz' }
    },
    {
        id: 'usr_29',
        email: 'carlos.lopez@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T10:00:00Z',
        persona_id: 'per_29',
        persona: { nombres: 'Carlos Alberto', apellidos: 'Lopez Criollo' }
    },
    {
        id: 'usr_31',
        email: 'santiago.lozano@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T09:30:00Z',
        persona_id: 'per_31',
        persona: { nombres: 'Santiago', apellidos: 'Lozano Osorio' }
    },
    {
        id: 'usr_33',
        email: 'jhon.marin@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T08:45:00Z',
        persona_id: 'per_33',
        persona: { nombres: 'Jhon Alexis', apellidos: 'Marin Rodriguez' }
    },
    {
        id: 'usr_34',
        email: 'fredy.mercado@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-09T07:30:00Z',
        persona_id: 'per_34',
        persona: { nombres: 'Fredy Esteban', apellidos: 'Mercado Gomez' }
    },
    {
        id: 'usr_35',
        email: 'cristhian.morales@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T20:15:00Z',
        persona_id: 'per_35',
        persona: { nombres: 'Cristhian Andres', apellidos: 'Morales Zapata' }
    },
    {
        id: 'usr_36',
        email: 'andres.moreno@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T19:00:00Z',
        persona_id: 'per_36',
        persona: { nombres: 'Andres Felipe', apellidos: 'Moreno Montoya' }
    },
    {
        id: 'usr_37',
        email: 'marly.munoz@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T18:30:00Z',
        persona_id: 'per_37',
        persona: { nombres: 'Marly Yuliana', apellidos: 'Muñoz Pelaez' }
    },
    {
        id: 'usr_41',
        email: 'yeraldin.osorio@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T17:45:00Z',
        persona_id: 'per_41',
        persona: { nombres: 'Yeraldin', apellidos: 'Osorio Gonzalez' }
    },
    {
        id: 'usr_42',
        email: 'jasson.oviedo@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T16:30:00Z',
        persona_id: 'per_42',
        persona: { nombres: 'Jasson Alexander', apellidos: 'Oviedo Lucano' }
    },
    {
        id: 'usr_43',
        email: 'kevin.ramirez@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T15:15:00Z',
        persona_id: 'per_43',
        persona: { nombres: 'Kevin Andres', apellidos: 'Ramirez Guzman' }
    },
    {
        id: 'usr_44',
        email: 'juan.rengifo@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T14:00:00Z',
        persona_id: 'per_44',
        persona: { nombres: 'Juan Angel', apellidos: 'Rengifo Cardenas' }
    },
    {
        id: 'usr_45',
        email: 'jenifer.rivera@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T13:30:00Z',
        persona_id: 'per_45',
        persona: { nombres: 'Jenifer Andrea', apellidos: 'Rivera Melecio' }
    },
    {
        id: 'usr_46',
        email: 'diego.rojas@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T12:45:00Z',
        persona_id: 'per_46',
        persona: { nombres: 'Diego Alejandro', apellidos: 'Rojas Reina' }
    },
    {
        id: 'usr_47',
        email: 'javier.roncancio@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T11:30:00Z',
        persona_id: 'per_47',
        persona: { nombres: 'Javier Antonio', apellidos: 'Roncancio Cuellar' }
    },
    {
        id: 'usr_51',
        email: 'abelardo.vergara@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T10:15:00Z',
        persona_id: 'per_51',
        persona: { nombres: 'Abelardo', apellidos: 'Vergara Sinisterra' }
    },
    {
        id: 'usr_52',
        email: 'juan.vidal@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T09:00:00Z',
        persona_id: 'per_52',
        persona: { nombres: 'Juan Esteban', apellidos: 'Vidal Barona' }
    },
    {
        id: 'usr_55',
        email: 'camilo.enciso2@scenariojobs.com',
        roles: ['EMPLOYEE'],
        estado: 'ACTIVO',
        ultimo_acceso: '2026-02-08T08:30:00Z',
        persona_id: 'per_55',
        persona: { nombres: 'Camilo Andres', apellidos: 'Enciso Rojas' }
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

            // Pagination
            const page = params?.pagina || 1;
            const pageSize = params?.items_por_pagina || 10;
            const totalItems = filtered.length;
            const totalPages = Math.ceil(totalItems / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedUsers = filtered.slice(startIndex, endIndex);

            const response = (await fetchData({
                url: '/api/users',
                params: params as any,
                mockData: successMock({
                    usuarios: paginatedUsers,
                    paginacion: {
                        pagina_actual: page,
                        items_por_pagina: pageSize,
                        total_items: totalItems,
                        total_paginas: totalPages
                    }
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
