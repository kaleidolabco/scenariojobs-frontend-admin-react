import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';

// Query params
export interface JobQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    filtro?: string;
    nivel_jerarquico?: string;
}

// Types
export type SeniorityLevel = 'JUNIOR' | 'SEMI_SENIOR' | 'SENIOR' | 'LIDER' | 'GERENTE' | 'DIRECTOR';

export interface CompetencyRequirement {
    competencia_id: string;
    competencia_nombre: string;
    nivel_esperado: number;
}

export interface Job {
    id: string;
    nombre: string;
    descripcion: string;
    nivel_jerarquico: SeniorityLevel;
    competencias_requeridas: CompetencyRequirement[];
    funciones: string[];
    banda_salarial_min?: number;
    banda_salarial_max?: number;
}

// Mock Data
const MOCK_JOBS: Job[] = [
    {
        id: '1',
        nombre: 'Desarrollador Full Stack Senior',
        descripcion: 'Responsable del desarrollo de aplicaciones web completas, desde el frontend hasta el backend.',
        nivel_jerarquico: 'SENIOR',
        competencias_requeridas: [
            { competencia_id: '3', competencia_nombre: 'Python Avanzado', nivel_esperado: 4 },
            { competencia_id: '4', competencia_nombre: 'Inglés', nivel_esperado: 3 },
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 2 }
        ],
        funciones: [
            'Diseñar y desarrollar aplicaciones web escalables',
            'Mentoría a desarrolladores junior',
            'Participar en revisiones de código'
        ],
        banda_salarial_min: 80000,
        banda_salarial_max: 120000
    },
    {
        id: '2',
        nombre: 'Analista de Recursos Humanos',
        descripcion: 'Gestión de procesos de reclutamiento, selección y desarrollo de talento.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 4 },
            { competencia_id: '5', competencia_nombre: 'Resolución de Conflictos', nivel_esperado: 3 }
        ],
        funciones: [
            'Coordinar procesos de selección',
            'Gestionar evaluaciones de desempeño',
            'Implementar programas de capacitación'
        ],
        banda_salarial_min: 50000,
        banda_salarial_max: 70000
    },
    {
        id: '3',
        nombre: 'Gerente de Tecnología',
        descripcion: 'Liderazgo estratégico del área de tecnología e innovación.',
        nivel_jerarquico: 'GERENTE',
        competencias_requeridas: [
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 5 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 5 }
        ],
        funciones: [
            'Definir la estrategia tecnológica',
            'Gestionar equipos multidisciplinarios',
            'Asegurar la alineación con objetivos de negocio'
        ],
        banda_salarial_min: 150000,
        banda_salarial_max: 200000
    }
];

const MOCK_JOBS_RESPONSE: FetchResponse = successMock({
    cargos: MOCK_JOBS,
    paginacion: {
        total_items: 3,
        total_paginas: 1,
        cantidad_por_pagina: 10,
        pagina_actual: 1
    }
});

export const useJobService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getJobs = async (params?: JobQueryParams): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: '/api/jobs',
                body: params,
                mockData: MOCK_JOBS_RESPONSE
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener los cargos');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createJob = async (job: Omit<Job, 'id'>): Promise<FetchResponse | null> => {
        try {
            const newJob = { ...job, id: Math.random().toString(36).substr(2, 9) };
            return (await fetchData({
                url: '/api/jobs',
                method: 'POST',
                body: job,
                mockData: successMock({ cargo: newJob })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updateJob = async (id: string, job: Partial<Job>): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: `/api/jobs/${id}`,
                method: 'PUT',
                body: job,
                mockData: successMock({ cargo: { ...job, id } })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deleteJob = async (id: string): Promise<boolean> => {
        try {
            await fetchData({
                url: `/api/jobs/${id}`,
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

    return {
        getJobs,
        createJob,
        updateJob,
        deleteJob,
        loading,
        error
    };
};
