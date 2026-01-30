import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock, errorMock } from './responseType';

// Stores
import useUIStore from '../store/uiStore';

export interface competenciesQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    categoria?: string;
    filtro?: string;
}   

export interface CompetencyLevel {
    nivel: number;
    nombre?: string; // Optional custom name for the level (e.g. "Expert", "Novice")
    descripcion: string; // Detailed behavior description
}

export interface Competency {
    id: string;
    nombre: string;
    descripcion: string;
    categoria: 'HABILIDAD_BLANDA' | 'HABILIDAD_TECNICA' | 'IDIOMA';
    escala: number; // e.g., 5 means 1-5 scale
    definiciones_niveles?: CompetencyLevel[];
}

const MOCK_COMPETENCIES_ERROR: FetchResponse = errorMock('Error al obtener las competencias');

const MOCK_COMPETENCIES: FetchResponse = successMock(
    {
        competencias: [
            { 
                id: '1', 
                nombre: 'Liderazgo', 
                descripcion: 'Capacidad para guiar y motivar equipos.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 2,
                definiciones_niveles: [
                    { nivel: 1, nombre: 'Inicial', descripcion: 'Dirige equipos pequeños con supervisión.' },
                    { nivel: 2, nombre: 'Experto', descripcion: 'Lidera estrategias organizacionales complejas.' }
                ]
            },
            { 
                id: '2', 
                nombre: 'Comunicación Asertiva', 
                descripcion: 'Expresarse de manera clara y respetuosa.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },
            { 
                id: '3', 
                nombre: 'Python Avanzado', 
                descripcion: 'Desarrollo de scripts y aplicaciones complejas en Python.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '4', 
                nombre: 'Inglés', 
                descripcion: 'Dominio del idioma inglés técnico y conversacional.', 
                categoria: 'IDIOMA', 
                escala: 5 
            },
            { 
                id: '5', 
                nombre: 'Resolución de Conflictos', 
                descripcion: 'Habilidad para mediar y resolver disputas.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },
        ],
        paginacion: {
            total_items: 6,
            total_paginas: 2,
            cantidad_por_pagina: 5,
            pagina_actual: 1
        }
    }
);

export const useCompetencyService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getCompetencies = async ( params?: competenciesQueryParams ): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: '/api/competencies',
                body: params,
                mockData: MOCK_COMPETENCIES
            })) as FetchResponse | null;

            if(response?.success === false){
                throw new Error(response.message || 'Error al obtener las competencias');
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createCompetency = async (competency: Omit<Competency, 'id'>): Promise<FetchResponse | null> => {
        try {
            const newCompetency = { ...competency, id: Math.random().toString(36).substr(2, 9) };
            return (await fetchData({
                url: '/api/competencies',
                method: 'POST',
                body: competency,
                mockData: successMock({ competencia : newCompetency})
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updateCompetency = async (id: string, competency: Partial<Competency>): Promise<FetchResponse | null> => {
        try {
        return (await fetchData({
            url: `/api/competencies/${id}`,
            method: 'PUT',
            body: competency,
            mockData: successMock({ competencia : {...competency, id }})
        })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deleteCompetency = async (id: string): Promise<boolean> => {
        try {   
            await fetchData({
                url: `/api/competencies/${id}`,
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
        getCompetencies,
        createCompetency,
        updateCompetency,
        deleteCompetency,
        loading,
        error
    };
};
