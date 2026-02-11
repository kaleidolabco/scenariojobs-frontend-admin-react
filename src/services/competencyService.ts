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
    categoria: 'HABILIDAD_BLANDA' | 'HABILIDAD_TECNICA' | 'IDIOMA' | 'CONOCIMIENTO_ESPECIFICO';
    escala: number; // e.g., 5 means 1-5 scale
    definiciones_niveles?: CompetencyLevel[];
}

const MOCK_COMPETENCIES_ERROR: FetchResponse = errorMock('Error al obtener las competencias');

const MOCK_COMPETENCIES: FetchResponse = successMock(
    {
        competencias: [
            // Habilidades Blandas
            { 
                id: '1', 
                nombre: 'Liderazgo', 
                descripcion: 'Capacidad para guiar, motivar y dirigir equipos hacia el logro de objetivos.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5,
                definiciones_niveles: [
                    { nivel: 1, nombre: 'Básico', descripcion: 'Apoya en tareas de coordinación con supervisión.' },
                    { nivel: 2, nombre: 'Intermedio', descripcion: 'Coordina equipos pequeños de forma autónoma.' },
                    { nivel: 3, nombre: 'Avanzado', descripcion: 'Lidera equipos medianos con iniciativa propia.' },
                    { nivel: 4, nombre: 'Experto', descripcion: 'Dirige múltiples equipos y proyectos complejos.' },
                    { nivel: 5, nombre: 'Maestro', descripcion: 'Lidera estrategias organizacionales y transformaciones.' }
                ]
            },
            { 
                id: '2', 
                nombre: 'Comunicación Asertiva', 
                descripcion: 'Capacidad de expresarse de manera clara, respetuosa y efectiva.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5,
                definiciones_niveles: [
                    { nivel: 1, nombre: 'Básico', descripcion: 'Comunica información básica de forma clara.' },
                    { nivel: 2, nombre: 'Intermedio', descripcion: 'Comunica ideas complejas a su equipo.' },
                    { nivel: 3, nombre: 'Avanzado', descripcion: 'Presenta a audiencias diversas con impacto.' },
                    { nivel: 4, nombre: 'Experto', descripcion: 'Influye en decisiones estratégicas con su comunicación.' },
                    { nivel: 5, nombre: 'Maestro', descripcion: 'Comunica visión organizacional a todos los niveles.' }
                ]
            },
            { 
                id: '3', 
                nombre: 'Resolución de Conflictos', 
                descripcion: 'Habilidad para mediar, negociar y resolver disputas de manera constructiva.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },
            { 
                id: '4', 
                nombre: 'Trabajo en Equipo', 
                descripcion: 'Capacidad de colaborar efectivamente con otros para alcanzar metas comunes.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },
            { 
                id: '5', 
                nombre: 'Gestión de Proyectos', 
                descripcion: 'Habilidad para planificar, ejecutar y controlar proyectos de manera efectiva.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },
            { 
                id: '6', 
                nombre: 'Atención al Cliente', 
                descripcion: 'Capacidad de brindar servicio de calidad y resolver necesidades del cliente.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },
            { 
                id: '7', 
                nombre: 'Pensamiento Analítico', 
                descripcion: 'Capacidad de analizar información compleja y tomar decisiones basadas en datos.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },
            { 
                id: '8', 
                nombre: 'Orientación a Resultados', 
                descripcion: 'Enfoque en el cumplimiento de objetivos y metas con calidad y eficiencia.', 
                categoria: 'HABILIDAD_BLANDA', 
                escala: 5 
            },

            // Habilidades Técnicas
            { 
                id: '9', 
                nombre: 'Desarrollo Fullstack', 
                descripcion: 'Capacidad de desarrollar aplicaciones completas, frontend y backend.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '10', 
                nombre: 'Python Avanzado', 
                descripcion: 'Desarrollo de scripts y aplicaciones complejas en Python.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '11', 
                nombre: 'JavaScript/TypeScript', 
                descripcion: 'Desarrollo con JavaScript y TypeScript para aplicaciones web modernas.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '12', 
                nombre: 'Infraestructura Cloud (AWS)', 
                descripcion: 'Diseño, implementación y gestión de infraestructura en AWS.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '13', 
                nombre: 'Ciberseguridad', 
                descripcion: 'Conocimientos en seguridad informática, análisis de vulnerabilidades y protección de sistemas.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '14', 
                nombre: 'Análisis de Datos', 
                descripcion: 'Capacidad de analizar, interpretar y visualizar datos para generar insights.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '15', 
                nombre: 'QA y Testing', 
                descripcion: 'Diseño y ejecución de pruebas de calidad de software, automatización de tests.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '16', 
                nombre: 'Soporte Técnico', 
                descripcion: 'Resolución de problemas técnicos, atención a usuarios y troubleshooting.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '17', 
                nombre: 'Administración de Sistemas', 
                descripcion: 'Gestión y mantenimiento de servidores, redes y sistemas operativos.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '18', 
                nombre: 'Bases de Datos', 
                descripcion: 'Diseño, administración y optimización de bases de datos relacionales y NoSQL.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '19', 
                nombre: 'Marketing Digital', 
                descripcion: 'Estrategias de marketing online, SEO, SEM, redes sociales y analítica web.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '20', 
                nombre: 'Contabilidad y Finanzas', 
                descripcion: 'Conocimientos en contabilidad, análisis financiero y reportes.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '21', 
                nombre: 'Gestión de Talento Humano', 
                descripcion: 'Reclutamiento, selección, desarrollo y gestión del talento organizacional.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },
            { 
                id: '22', 
                nombre: 'Preventa y Soluciones', 
                descripcion: 'Capacidad de entender necesidades del cliente y proponer soluciones técnicas.', 
                categoria: 'HABILIDAD_TECNICA', 
                escala: 5 
            },

            // Idiomas
            { 
                id: '23', 
                nombre: 'Inglés', 
                descripcion: 'Dominio del idioma inglés técnico y conversacional.', 
                categoria: 'IDIOMA', 
                escala: 5,
                definiciones_niveles: [
                    { nivel: 1, nombre: 'A1-A2', descripcion: 'Nivel básico, comprensión de frases simples.' },
                    { nivel: 2, nombre: 'B1', descripcion: 'Nivel intermedio, conversación cotidiana.' },
                    { nivel: 3, nombre: 'B2', descripcion: 'Nivel intermedio-alto, conversación técnica.' },
                    { nivel: 4, nombre: 'C1', descripcion: 'Nivel avanzado, fluidez profesional.' },
                    { nivel: 5, nombre: 'C2', descripcion: 'Nivel nativo o bilingüe.' }
                ]
            },
            { 
                id: '24', 
                nombre: 'Español', 
                descripcion: 'Dominio del idioma español.', 
                categoria: 'IDIOMA', 
                escala: 5 
            },

            // Conocimientos Específicos
            {
                id: '25',
                nombre: 'ISO 9001:2015',
                descripcion: 'Conocimiento profundo de los requisitos del sistema de gestión de calidad.',
                categoria: 'CONOCIMIENTO_ESPECIFICO',
                escala: 5
            },
            {
                id: '26',
                nombre: 'Metodología Scrum',
                descripcion: 'Marco de trabajo ágil para el desarrollo y mantenimiento de productos complejos.',
                categoria: 'CONOCIMIENTO_ESPECIFICO',
                escala: 5
            },
            {
                id: '27',
                nombre: 'Gestión de Salesforce',
                descripcion: 'Administración y personalización de la plataforma CRM Salesforce.',
                categoria: 'CONOCIMIENTO_ESPECIFICO',
                escala: 5
            },
            {
                id: '28',
                nombre: 'Normativa GDPR',
                descripcion: 'Reglamento General de Protección de Datos de la Unión Europea.',
                categoria: 'CONOCIMIENTO_ESPECIFICO',
                escala: 5
            }
        ],
        paginacion: {
            total_items: 28,
            total_paginas: 1,
            cantidad_por_pagina: 50,
            pagina_actual: 1
        }
    }
);

export const useCompetencyService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getCompetencies = async ( params?: competenciesQueryParams ): Promise<FetchResponse | null> => {
        try {
            let filtered = [...(MOCK_COMPETENCIES.data.competencias as Competency[])];

            // Apply filters
            if (params?.filtro) {
                const lowerSearch = params.filtro.toLowerCase();
                filtered = filtered.filter(c => 
                    c.nombre.toLowerCase().includes(lowerSearch) ||
                    c.descripcion.toLowerCase().includes(lowerSearch)
                );
            }

            if (params?.categoria) {
                filtered = filtered.filter(c => c.categoria === params.categoria);
            }

            // Sorting
            if (params?.orden_por) {
                filtered.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] || '';
                    const bVal = (b as any)[params.orden_por!] || '';
                    const comparison = aVal > bVal ? 1 : -1;
                    return params.orden === 'desc' ? -comparison : comparison;
                });
            }

            // Pagination
            const page = params?.pagina || 1;
            const pageSize = params?.items_por_pagina || 10;
            const totalItems = filtered.length;
            const totalPages = Math.ceil(totalItems / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedCompetencies = filtered.slice(startIndex, endIndex);

            const response = (await fetchData({
                url: '/api/competencies',
                params: params as any,
                mockData: successMock({
                    competencias: paginatedCompetencies,
                    paginacion: {
                        pagina_actual: page,
                        items_por_pagina: pageSize,
                        total_items: totalItems,
                        total_paginas: totalPages
                    }
                })
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
