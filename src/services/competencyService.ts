import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';

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
    nombre?: string;
    descripcion: string;
}

export interface Competency {
    id: string;
    nombre: string;
    descripcion: string;
    /** Slug de la categoría — referencia a Category.slug en categoryService */
    categoria: string;
    escala: number;
    definiciones_niveles?: CompetencyLevel[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_COMPETENCIES_DATA = [
    // Competencias Organizacionales
    { id: '1', nombre: 'Orientación de Servicio al Cliente', descripcion: ' Tiene capacidad y disposición para colaborar con los clientes internos/externos, comprendiendo y satisfaciendo sus necesidades y expectativas.', categoria: 'COMPETENCIA_ORGANIZACIONAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Atiende al cliente solo cuando se solicita directamente, sin considerar necesidades adicionales.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Atiende adecuadamente a clientes, cumpliendo soluciones básicas requeridas.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Comprende necesidades del cliente, aporta soluciones de calidad manteniendo buen trato.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Se anticipa a necesidades del cliente, propone mejoras y genera satisfacción integral.' } ] },
    { id: '2', nombre: 'Orientación a Resultados', descripcion: 'Encamina sus acciones al logro de lo esperado, dedicando el tiempo, recursos y esfuerzo necesario para lograr los objetivos de su cargo. Revisar resultado indicadores de gestión.', categoria: 'COMPETENCIA_ORGANIZACIONAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Requiere supervisión constante para cumplir con resultados establecidos.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Cumple objetivos asignados con supervisión ocasional, revisando indicadores básicos.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Supera objetivos esperados, optimiza recursos y revisa indicadores consistentemente.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Logra resultados excepcionales, contenientes y sostenibles, define y alcanza objetivos estratégicos.' } ] },
    { id: '3', nombre: 'Trabajo en Equipo', descripcion: 'Participa y colabora activamente promoviendo la ayuda mutua y la solidaridad generando visión compartida para lograr objetivos comunes.', categoria: 'COMPETENCIA_ORGANIZACIONAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Trabajo individual sin disposición frecuente para colaborar o ayudar.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Colabora cuando se solicita, mantiene relaciones laborales respetuosas y contribuye al ambiente.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Contribuye activamente a construcción de visión compartida inspirando equipo.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Promueve colaboración integral, genera cohesión y lidera equipo hacia objetivos estratégicos.' } ] },
    { id: '4', nombre: 'Comunicación Efectiva', descripcion: 'Su comunicación (oral-escrita) es estructurada, concisa, directa y oportuna, haciendo uso de la empatía y asertividad adecuada.', categoria: 'COMPETENCIA_ORGANIZACIONAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Comunicación frecuentemente confusa o incompleta, genera conflictos ocasionales.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Comunica de manera clara en la mayoría de situaciones, usa empatía básica.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Comunica de manera estructurada y empática, facilitando comprensión en contextos complejos.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Domina comunicación estratégica, impacta audiencias diversas, facilita resolución de conflictos.' } ] },
    { id: '5', nombre: 'Proactividad', descripcion: 'Es participativo y propone ideas para mejorar el desarrollo de su gestión, investiga y ejecuta acciones que generan valor agregado a su cargo.', categoria: 'COMPETENCIA_ORGANIZACIONAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Sin iniciativa, requiere indicaciones para tareas asignadas.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Propone ideas ocasionalmente y participa en mejoras cuando se solicita.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Propone implementa mejoras, investiga alternativas agregando valor consistentemente.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Líder en iniciativas de mejora, genera transformaciones y anticipa oportunidades.' } ] },
    
    // Competencias de Entorno Laboral
    { id: '6', nombre: 'Compromiso Organizacional', descripcion: 'En su comportamiento y actitud demuestra un alto sentido de pertenencia y lealtad con INFODEC.', categoria: 'COMPETENCIA_ENTORNO_LABORAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Muestra poco sentido de pertenencia e identifica poco con valores de INFODEC.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Cumple con compromisos institucionales, aunque límitado en su identificación.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Demuestra sentido de pertenencia coherente con comportamiento organizacional.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Actúa como embajador, fortalece cultura organizacional y promueve valores de INFODEC.' } ] },
    { id: '7', nombre: 'Relaciones Interpersonales', descripcion: 'Establece y mantiene relaciones de respeto y armonía con grupos externos, sus colaboradores y compañeros propiciando un buen ambiente laboral.', categoria: 'COMPETENCIA_ENTORNO_LABORAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Dificultad para establer relaciones, genera conflictos frecuentes.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Mantiene relaciones respetuosas, colabora cuando es necesario en ambiente laboral.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Establece relaciones armónicas, contribuye a ambiente positivo consistentemente.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Fomenta relaciones constructivas, media conflictos y genera ambiente colaborativo.' } ] },
    { id: '8', nombre: 'Disciplina', descripcion: 'Cumple con las políticas, normas, procedimientos y políticas establecidas por la compañía (Horarios, ausentismos, en general con el reglamento interno de trabajo).', categoria: 'COMPETENCIA_ENTORNO_LABORAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Incumple normas y procedimientos frecuentemente.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Cumple normas básicas con recordatorios ocasionales de procedimientos.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Cumple políticas de manera consistente, comunicando procedimientos al equipo.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Modelo de cumplimiento, promueve disciplina y asegura adherencia organizacional.' } ] },
    { id: '9', nombre: 'Organización', descripcion: 'Cuida y controla los recursos asignados para el desarrollo de sus funciones, manteniendo organizado su puesto de trabajo.', categoria: 'COMPETENCIA_ENTORNO_LABORAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Desorden frecuente, pérdida de recursos y documentación.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Mantiene básico orden en puesto de trabajo y recursos asignados.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Administra eficientemente recursos y mantiene estándares de orden.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Optimiza gestión de recursos y establece modelos de organización para equipo.' } ] },
    { id: '10', nombre: 'Responsabilidad', descripcion: 'Ejecuta las funciones y deberes propios del cargo (definidas en el manual de responsabilidad), sin que requiera control permanente.', categoria: 'COMPETENCIA_ENTORNO_LABORAL', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Requiere supervisión constante, frecuentes incumplimientos.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Cumple funciones con supervisión ocasional de manera adecuada.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Ejecuta responsabilidades de forma autónoma y confiable.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Anticipa responsabilidades, garantiza resultados y lidera por ejemplo.' } ] },
    
    // Competencias de Productividad
    { id: '11', nombre: 'Oportunidad', descripcion: 'Realiza y presenta su gestión, reportes e informes de acuerdo a la programación establecida.', categoria: 'COMPETENCIA_PRODUCTIVIDAD', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Entrega gestión, reportes fuera de plazos establecidos frecuentemente.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Presenta gestión y reportes dentro de plazos establecidos.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Cumple de manera consistente con programación, a veces adelanta entregas.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Se anticipa a plazos, asegura información oportuna y confiable.' } ] },
    { id: '12', nombre: 'Efectividad', descripcion: 'Cumple con los objetivos de su cargo, trabajando con dedicación para tener resultados con calidad, distribuyendo adecuadamente el tiempo y utilizando adecuadamente los recursos.', categoria: 'COMPETENCIA_PRODUCTIVIDAD', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Presenta dificultades para cumplir objetivos, uso ineficiente de tiempo y recursos.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Cumple objetivos asignados utilizando adecuadamente tiempo y recursos.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Alcanza y supera objetivos de cargo demostrando dedicación y precisión.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Logra resultados excepcionales con dedicación continua y máxima eficiencia.' } ] },
    { id: '13', nombre: 'Calidad', descripcion: 'Tiene la habilidad y la mentalidad para realizar sus tareas y responsabilidades de manera precisa a un nivel consistente y alto, cumpliendo o superando los estándares establecidos.', categoria: 'COMPETENCIA_PRODUCTIVIDAD', escala: 4, definiciones_niveles: [ { nivel: 1, nombre: 'Bajo', descripcion: 'Entrega frecuentemente trabajo con errores, debajo de estándares mínimos.' }, { nivel: 2, nombre: 'Medio', descripcion: 'Cumple estándares básicos requiriendo revisión ocasional por errores.' }, { nivel: 3, nombre: 'Alto', descripcion: 'Entrega trabajo consistente, preciso y acorde a estándares establecidos.' }, { nivel: 4, nombre: 'Muy Alto', descripcion: 'Supera estándares, trabajo impecable anticipando problemas de calidad.' } ] },
    
    // Habilidades Blandas (mantener las existentes)
    { id: '14', nombre: 'Liderazgo', descripcion: 'Capacidad para guiar, motivar y dirigir equipos hacia el logro de objetivos.', categoria: 'HABILIDAD_BLANDA', escala: 5, definiciones_niveles: [ { nivel: 1, nombre: 'Básico', descripcion: 'Apoya en tareas de coordinación con supervisión.' }, { nivel: 2, nombre: 'Intermedio', descripcion: 'Coordina equipos pequeños de forma autónoma.' }, { nivel: 3, nombre: 'Avanzado', descripcion: 'Lidera equipos medianos con iniciativa propia.' }, { nivel: 4, nombre: 'Experto', descripcion: 'Dirige múltiples equipos y proyectos complejos.' }, { nivel: 5, nombre: 'Maestro', descripcion: 'Lidera estrategias organizacionales y transformaciones.' } ] },
    { id: '15', nombre: 'Comunicación Asertiva', descripcion: 'Capacidad de expresarse de manera clara, respetuosa y efectiva.', categoria: 'HABILIDAD_BLANDA', escala: 5, definiciones_niveles: [ { nivel: 1, nombre: 'Básico', descripcion: 'Comunica información básica de forma clara.' }, { nivel: 2, nombre: 'Intermedio', descripcion: 'Comunica ideas complejas a su equipo.' }, { nivel: 3, nombre: 'Avanzado', descripcion: 'Presenta a audiencias diversas con impacto.' }, { nivel: 4, nombre: 'Experto', descripcion: 'Influye en decisiones estratégicas con su comunicación.' }, { nivel: 5, nombre: 'Maestro', descripcion: 'Comunica visión organizacional a todos los niveles.' } ] },
    { id: '16', nombre: 'Resolución de Conflictos', descripcion: 'Habilidad para mediar, negociar y resolver disputas de manera constructiva.', categoria: 'HABILIDAD_BLANDA', escala: 5 },
    { id: '17', nombre: 'Trabajo en Equipo (Blanda)', descripcion: 'Capacidad de colaborar efectivamente con otros para alcanzar metas comunes.', categoria: 'HABILIDAD_BLANDA', escala: 5 },
    { id: '18', nombre: 'Gestión de Proyectos', descripcion: 'Habilidad para planificar, ejecutar y controlar proyectos de manera efectiva.', categoria: 'HABILIDAD_BLANDA', escala: 5 },
    { id: '19', nombre: 'Atención al Cliente (Blanda)', descripcion: 'Capacidad de brindar servicio de calidad y resolver necesidades del cliente.', categoria: 'HABILIDAD_BLANDA', escala: 5 },
    { id: '20', nombre: 'Pensamiento Analítico', descripcion: 'Capacidad de analizar información compleja y tomar decisiones basadas en datos.', categoria: 'HABILIDAD_BLANDA', escala: 5 },
    { id: '21', nombre: 'Orientación a Resultados (Blanda)', descripcion: 'Enfoque en el cumplimiento de objetivos y metas con calidad y eficiencia.', categoria: 'HABILIDAD_BLANDA', escala: 5 },
    // Habilidades Técnicas
    { id: '22', nombre: 'Desarrollo Fullstack', descripcion: 'Capacidad de desarrollar aplicaciones completas, frontend y backend.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '23', nombre: 'Python Avanzado', descripcion: 'Desarrollo de scripts y aplicaciones complejas en Python.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '24', nombre: 'JavaScript/TypeScript', descripcion: 'Desarrollo con JavaScript y TypeScript para aplicaciones web modernas.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '25', nombre: 'Infraestructura Cloud (AWS)', descripcion: 'Diseño, implementación y gestión de infraestructura en AWS.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '26', nombre: 'Ciberseguridad', descripcion: 'Conocimientos en seguridad informática, análisis de vulnerabilidades y protección de sistemas.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '27', nombre: 'Análisis de Datos', descripcion: 'Capacidad de analizar, interpretar y visualizar datos para generar insights.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '28', nombre: 'QA y Testing', descripcion: 'Diseño y ejecución de pruebas de calidad de software, automatización de tests.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '29', nombre: 'Soporte Técnico', descripcion: 'Resolución de problemas técnicos, atención a usuarios y troubleshooting.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '30', nombre: 'Administración de Sistemas', descripcion: 'Gestión y mantenimiento de servidores, redes y sistemas operativos.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '31', nombre: 'Bases de Datos', descripcion: 'Diseño, administración y optimización de bases de datos relacionales y NoSQL.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '32', nombre: 'Marketing Digital', descripcion: 'Estrategias de marketing online, SEO, SEM, redes sociales y analítica web.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '33', nombre: 'Contabilidad y Finanzas', descripcion: 'Conocimientos en contabilidad, análisis financiero y reportes.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '34', nombre: 'Gestión de Talento Humano', descripcion: 'Reclutamiento, selección, desarrollo y gestión del talento organizacional.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    { id: '35', nombre: 'Preventa y Soluciones', descripcion: 'Capacidad de entender necesidades del cliente y proponer soluciones técnicas.', categoria: 'HABILIDAD_TECNICA', escala: 5 },
    // Idiomas
    { id: '36', nombre: 'Inglés', descripcion: 'Dominio del idioma inglés técnico y conversacional.', categoria: 'IDIOMA', escala: 5, definiciones_niveles: [ { nivel: 1, nombre: 'A1-A2', descripcion: 'Nivel básico, comprensión de frases simples.' }, { nivel: 2, nombre: 'B1', descripcion: 'Nivel intermedio, conversación cotidiana.' }, { nivel: 3, nombre: 'B2', descripcion: 'Nivel intermedio-alto, conversación técnica.' }, { nivel: 4, nombre: 'C1', descripcion: 'Nivel avanzado, fluidez profesional.' }, { nivel: 5, nombre: 'C2', descripcion: 'Nivel nativo o bilingüe.' } ] },
    { id: '37', nombre: 'Español', descripcion: 'Dominio del idioma español.', categoria: 'IDIOMA', escala: 5 },
    // Conocimientos específicos
    { id: '38', nombre: 'ISO 9001:2015', descripcion: 'Conocimiento profundo de los requisitos del sistema de gestión de calidad.', categoria: 'CONOCIMIENTO_ESPECIFICO', escala: 5 },
    { id: '39', nombre: 'Metodología Scrum', descripcion: 'Marco de trabajo ágil para el desarrollo y mantenimiento de productos complejos.', categoria: 'CONOCIMIENTO_ESPECIFICO', escala: 5 },
    { id: '40', nombre: 'Gestión de Salesforce', descripcion: 'Administración y personalización de la plataforma CRM Salesforce.', categoria: 'CONOCIMIENTO_ESPECIFICO', escala: 5 },
    { id: '41', nombre: 'Normativa GDPR', descripcion: 'Reglamento General de Protección de Datos de la Unión Europea.', categoria: 'CONOCIMIENTO_ESPECIFICO', escala: 5 },
];

export const useCompetencyService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getCompetencies = async (params?: competenciesQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [...MOCK_COMPETENCIES_DATA] as Competency[];

            if (params?.filtro) {
                const q = params.filtro.toLowerCase();
                filtered = filtered.filter(c =>
                    c.nombre.toLowerCase().includes(q) ||
                    c.descripcion.toLowerCase().includes(q)
                );
            }

            if (params?.categoria) {
                filtered = filtered.filter(c => c.categoria === params.categoria);
            }

            if (params?.orden_por) {
                filtered.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] || '';
                    const bVal = (b as any)[params.orden_por!] || '';
                    const cmp = aVal > bVal ? 1 : -1;
                    return params.orden === 'desc' ? -cmp : cmp;
                });
            }

            const page = params?.pagina ?? 1;
            const pageSize = params?.items_por_pagina ?? 10;
            const totalItems = filtered.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const start = (page - 1) * pageSize;
            const paginated = filtered.slice(start, start + pageSize);

            const response = (await fetchData({
                url: '/api/competencies',
                params: params as any,
                mockData: successMock({
                    competencias: paginated,
                    paginacion: { pagina_actual: page, items_por_pagina: pageSize, total_items: totalItems, total_paginas: totalPages },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) throw new Error(response.message || 'Error al obtener las competencias');
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
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
                mockData: successMock({ competencia: newCompetency }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const updateCompetency = async (id: string, competency: Partial<Competency>): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: `/api/competencies/${id}`,
                method: 'PUT',
                body: competency,
                mockData: successMock({ competencia: { ...competency, id } }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const deleteCompetency = async (id: string): Promise<boolean> => {
        try {
            await fetchData({
                url: `/api/competencies/${id}`,
                method: 'DELETE',
                mockData: successMock({ success: true }),
            });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    return { getCompetencies, createCompetency, updateCompetency, deleteCompetency, loading, error };
};