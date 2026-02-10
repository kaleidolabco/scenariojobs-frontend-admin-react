import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock, errorMock } from './responseType';
import useUIStore from '../store/uiStore';

export interface Person {
    id: string;
    nombres: string;
    apellidos: string;
    email_personal?: string;
    telefono?: string;
    foto?: string;
    fecha_ingreso?: string;
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
}

// Mock Data
let MOCK_PEOPLE: Person[] = [
    {
        id: 'per_1',
        nombres: 'Juan',
        apellidos: 'Admin',
        email_personal: 'juan.admin@gmail.com',
        fecha_ingreso: '2020-01-15',
        departamento: 'Gerencia',
        puesto_id: 'pos_1',
        puesto_nombre: 'CEO',
        usuario_id: 'usr_1',
        usuario_email: 'admin@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_2',
        nombres: 'María',
        apellidos: 'Talento',
        email_personal: 'maria.talento@hotmail.com',
        fecha_ingreso: '2021-03-10',
        departamento: 'RRHH',
        puesto_nombre: 'Gerente RRHH', // No linked position ID yet example
        usuario_id: 'usr_2',
        usuario_email: 'rrhh@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_3',
        nombres: 'Carlos',
        apellidos: 'Técnico',
        email_personal: 'charlie.tech@gmail.com',
        fecha_ingreso: '2022-06-01',
        departamento: 'Tecnología',
        puesto_id: 'pos_2',
        puesto_nombre: 'Tech Lead',
        usuario_id: 'usr_3',
        usuario_email: 'tech_lead@scenariojobs.com',
        estado: 'ACTIVO'
    },
    {
        id: 'per_4',
        nombres: 'Ana',
        apellidos: 'Analista',
        email_personal: 'ana.analista@yahoo.com',
        fecha_ingreso: '2023-01-20',
        departamento: 'Operaciones',
        estado: 'ACTIVO'
    }
];

export const usePersonService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    
    const getPeople = async (params?: PersonQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [...MOCK_PEOPLE];

            if (params?.search) {
                const lowerSearch = params.search.toLowerCase();
                filtered = filtered.filter(p => 
                    (p.nombres + ' ' + p.apellidos).toLowerCase().includes(lowerSearch) ||
                    (p.email_personal && p.email_personal.toLowerCase().includes(lowerSearch))
                );
            }

            if (params?.departamento) {
                filtered = filtered.filter(p => p.departamento === params.departamento);
            }

            if (params?.estado) {
                filtered = filtered.filter(p => p.estado === params.estado);
            }

            const response = (await fetchData({
                url: '/api/people',
                params: params as any,
                mockData: successMock({
                    personas: filtered,
                    total: filtered.length
                })
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
            const person = MOCK_PEOPLE.find(p => p.id === id);
            
            // Should simulate error if not found? 
            // Usually API returns 404, here we mock response
            const mockResponse = person 
                ? successMock({ persona: person })
                : errorMock('Persona no encontrada');

            const response = (await fetchData({
                url: `/api/people/${id}`,
                mockData: mockResponse
            })) as FetchResponse | null;

            if (response?.success === false) {
                 // Don't throw if it's just not found, let component handle or throw?
                 // Current pattern handles error here:
                 throw new Error(response?.message || 'Error');
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
            const newPerson: Person = {
                ...data,
                id: 'per_' + Math.random().toString(36).substr(2, 9),
                estado: 'ACTIVO' // Default
            };
            
            // In a real mock, we update the array before resolving? 
            // Or useFetch mockData simulates the response.
            // We should update the source array here for persistence within session.
            MOCK_PEOPLE.push(newPerson);

            return (await fetchData({
                url: '/api/people',
                method: 'POST',
                body: data as any,
                mockData: successMock({ persona: newPerson })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updatePerson = async (id: string, data: Partial<Person>): Promise<FetchResponse | null> => {
        try {
            const index = MOCK_PEOPLE.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Persona no encontrada');

            MOCK_PEOPLE[index] = { ...MOCK_PEOPLE[index], ...data };

            return (await fetchData({
                url: `/api/people/${id}`,
                method: 'PUT',
                body: data as any,
                mockData: successMock({ persona: MOCK_PEOPLE[index] })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deletePerson = async (id: string): Promise<boolean> => {
         try {
            MOCK_PEOPLE = MOCK_PEOPLE.filter(p => p.id !== id);

             await fetchData({
                url: `/api/people/${id}`,
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

    // New method: Create user account for person
    const createUserAccount = async (personId: string, email: string, role: string): Promise<boolean> => {
        try {
            console.log(`Creating user for person ${personId} with email ${email}`);
            // In a real app, this would call userService to create the user and then link it
            
             await fetchData({
                url: `/api/people/${personId}/create-user`,
                method: 'POST',
                body: { email, role },
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
        getPeople,
        getPersonById,
        createPerson,
        updatePerson,
        deletePerson,
        createUserAccount,
        loading,
        error
    };
};
