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

// Mock Data - 27 unique positions from CSV
const MOCK_JOBS: Job[] = [
    // DIRECTOR Level
    {
        id: 'job_1',
        nombre: 'Gerente General',
        descripcion: 'Máxima autoridad ejecutiva de la organización, responsable de la estrategia y dirección general.',
        nivel_jerarquico: 'DIRECTOR',
        competencias_requeridas: [
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 5 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 5 },
            { competencia_id: '5', competencia_nombre: 'Gestión de Proyectos', nivel_esperado: 5 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 5 }
        ],
        funciones: [
            'Definir la visión y estrategia organizacional',
            'Liderar el equipo directivo',
            'Asegurar el cumplimiento de objetivos corporativos',
            'Representar a la organización ante stakeholders'
        ],
        banda_salarial_min: 200000,
        banda_salarial_max: 300000
    },
    {
        id: 'job_2',
        nombre: 'Director Administrativa',
        descripcion: 'Responsable de la gestión administrativa, financiera y de recursos de la organización.',
        nivel_jerarquico: 'DIRECTOR',
        competencias_requeridas: [
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 5 },
            { competencia_id: '20', competencia_nombre: 'Contabilidad y Finanzas', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 5 }
        ],
        funciones: [
            'Dirigir la gestión administrativa y financiera',
            'Supervisar presupuestos y recursos',
            'Asegurar cumplimiento normativo y legal',
            'Optimizar procesos administrativos'
        ],
        banda_salarial_min: 120000,
        banda_salarial_max: 180000
    },
    {
        id: 'job_3',
        nombre: 'Director Comercial',
        descripcion: 'Liderazgo de la estrategia comercial y de ventas de la organización.',
        nivel_jerarquico: 'DIRECTOR',
        competencias_requeridas: [
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 5 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 5 },
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 5 },
            { competencia_id: '22', competencia_nombre: 'Preventa y Soluciones', nivel_esperado: 4 }
        ],
        funciones: [
            'Definir estrategia comercial y de ventas',
            'Gestionar relaciones con clientes clave',
            'Liderar equipos comerciales',
            'Alcanzar objetivos de ingresos'
        ],
        banda_salarial_min: 120000,
        banda_salarial_max: 180000
    },
    {
        id: 'job_4',
        nombre: 'Director Gestion Organizacional',
        descripcion: 'Responsable de la gestión del cambio, cultura organizacional y desarrollo institucional.',
        nivel_jerarquico: 'DIRECTOR',
        competencias_requeridas: [
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 5 },
            { competencia_id: '21', competencia_nombre: 'Gestión de Talento Humano', nivel_esperado: 5 },
            { competencia_id: '5', competencia_nombre: 'Gestión de Proyectos', nivel_esperado: 4 }
        ],
        funciones: [
            'Diseñar estrategias de desarrollo organizacional',
            'Liderar procesos de transformación cultural',
            'Implementar sistemas de gestión de calidad',
            'Fortalecer capacidades institucionales'
        ],
        banda_salarial_min: 110000,
        banda_salarial_max: 160000
    },
    {
        id: 'job_5',
        nombre: 'Director de Proyectos',
        descripcion: 'Liderazgo de la cartera de proyectos estratégicos de la organización.',
        nivel_jerarquico: 'DIRECTOR',
        competencias_requeridas: [
            { competencia_id: '5', competencia_nombre: 'Gestión de Proyectos', nivel_esperado: 5 },
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 4 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 4 }
        ],
        funciones: [
            'Dirigir la oficina de gestión de proyectos',
            'Supervisar múltiples proyectos estratégicos',
            'Asegurar entrega de proyectos a tiempo y presupuesto',
            'Gestionar riesgos y stakeholders'
        ],
        banda_salarial_min: 110000,
        banda_salarial_max: 160000
    },
    {
        id: 'job_6',
        nombre: 'Director Soluciones',
        descripcion: 'Responsable del diseño y entrega de soluciones tecnológicas para clientes.',
        nivel_jerarquico: 'DIRECTOR',
        competencias_requeridas: [
            { competencia_id: '22', competencia_nombre: 'Preventa y Soluciones', nivel_esperado: 5 },
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 5 }
        ],
        funciones: [
            'Diseñar arquitecturas de soluciones',
            'Liderar equipos de preventa y soluciones',
            'Asegurar calidad técnica de propuestas',
            'Innovar en ofertas de valor'
        ],
        banda_salarial_min: 110000,
        banda_salarial_max: 160000
    },

    // GERENTE Level
    {
        id: 'job_7',
        nombre: 'Key Account Manager',
        descripcion: 'Gestión de cuentas clave y relaciones estratégicas con clientes principales.',
        nivel_jerarquico: 'GERENTE',
        competencias_requeridas: [
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 5 },
            { competencia_id: '6', competencia_nombre: 'Atención al Cliente', nivel_esperado: 5 },
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 4 }
        ],
        funciones: [
            'Gestionar cartera de clientes estratégicos',
            'Desarrollar planes de cuenta',
            'Identificar oportunidades de crecimiento',
            'Asegurar satisfacción y retención de clientes'
        ],
        banda_salarial_min: 80000,
        banda_salarial_max: 120000
    },

    // LIDER Level
    {
        id: 'job_8',
        nombre: 'Lider Talento Humano',
        descripcion: 'Liderazgo de procesos de gestión del talento, reclutamiento y desarrollo organizacional.',
        nivel_jerarquico: 'LIDER',
        competencias_requeridas: [
            { competencia_id: '21', competencia_nombre: 'Gestión de Talento Humano', nivel_esperado: 5 },
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 4 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 4 }
        ],
        funciones: [
            'Liderar procesos de reclutamiento y selección',
            'Diseñar programas de desarrollo de talento',
            'Gestionar clima y cultura organizacional',
            'Implementar sistemas de evaluación de desempeño'
        ],
        banda_salarial_min: 60000,
        banda_salarial_max: 90000
    },
    {
        id: 'job_9',
        nombre: 'Lider de Soporte',
        descripcion: 'Liderazgo del equipo de soporte técnico y atención a usuarios.',
        nivel_jerarquico: 'LIDER',
        competencias_requeridas: [
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 4 },
            { competencia_id: '16', competencia_nombre: 'Soporte Técnico', nivel_esperado: 5 },
            { competencia_id: '6', competencia_nombre: 'Atención al Cliente', nivel_esperado: 4 }
        ],
        funciones: [
            'Coordinar equipos de soporte técnico',
            'Asegurar niveles de servicio (SLA)',
            'Gestionar escalamiento de incidentes',
            'Mejorar procesos de atención'
        ],
        banda_salarial_min: 55000,
        banda_salarial_max: 85000
    },
    {
        id: 'job_10',
        nombre: 'Lider Tecnico',
        descripcion: 'Liderazgo técnico de equipos de desarrollo y arquitectura de soluciones.',
        nivel_jerarquico: 'LIDER',
        competencias_requeridas: [
            { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 4 },
            { competencia_id: '9', competencia_nombre: 'Desarrollo Fullstack', nivel_esperado: 5 },
            { competencia_id: '5', competencia_nombre: 'Gestión de Proyectos', nivel_esperado: 3 }
        ],
        funciones: [
            'Liderar equipos técnicos de desarrollo',
            'Definir arquitecturas y estándares técnicos',
            'Realizar revisiones de código',
            'Mentoría técnica al equipo'
        ],
        banda_salarial_min: 65000,
        banda_salarial_max: 95000
    },

    // SENIOR Level
    {
        id: 'job_11',
        nombre: 'Ingeniero de Soporte Especializado',
        descripcion: 'Soporte técnico avanzado para problemas complejos y escalados.',
        nivel_jerarquico: 'SENIOR',
        competencias_requeridas: [
            { competencia_id: '16', competencia_nombre: 'Soporte Técnico', nivel_esperado: 5 },
            { competencia_id: '17', competencia_nombre: 'Administración de Sistemas', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 4 }
        ],
        funciones: [
            'Resolver incidentes técnicos complejos',
            'Realizar análisis de causa raíz',
            'Documentar soluciones técnicas',
            'Capacitar a equipo de soporte'
        ],
        banda_salarial_min: 50000,
        banda_salarial_max: 75000
    },
    {
        id: 'job_12',
        nombre: 'Ingeniero Infraestructura AWS',
        descripcion: 'Diseño, implementación y gestión de infraestructura cloud en AWS.',
        nivel_jerarquico: 'SENIOR',
        competencias_requeridas: [
            { competencia_id: '12', competencia_nombre: 'Infraestructura Cloud (AWS)', nivel_esperado: 5 },
            { competencia_id: '17', competencia_nombre: 'Administración de Sistemas', nivel_esperado: 4 },
            { competencia_id: '13', competencia_nombre: 'Ciberseguridad', nivel_esperado: 3 }
        ],
        funciones: [
            'Diseñar arquitecturas cloud en AWS',
            'Implementar infraestructura como código',
            'Optimizar costos y rendimiento',
            'Asegurar alta disponibilidad y seguridad'
        ],
        banda_salarial_min: 60000,
        banda_salarial_max: 90000
    },
    {
        id: 'job_13',
        nombre: 'Ingeniero Preventa',
        descripcion: 'Soporte técnico en procesos de preventa y diseño de soluciones para clientes.',
        nivel_jerarquico: 'SENIOR',
        competencias_requeridas: [
            { competencia_id: '22', competencia_nombre: 'Preventa y Soluciones', nivel_esperado: 5 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 4 }
        ],
        funciones: [
            'Analizar requerimientos de clientes',
            'Diseñar propuestas técnicas',
            'Realizar presentaciones y demos',
            'Estimar esfuerzos y costos'
        ],
        banda_salarial_min: 55000,
        banda_salarial_max: 80000
    },
    {
        id: 'job_14',
        nombre: 'Desarrollador Fullstack',
        descripcion: 'Desarrollo de aplicaciones web completas, frontend y backend.',
        nivel_jerarquico: 'SENIOR',
        competencias_requeridas: [
            { competencia_id: '9', competencia_nombre: 'Desarrollo Fullstack', nivel_esperado: 4 },
            { competencia_id: '11', competencia_nombre: 'JavaScript/TypeScript', nivel_esperado: 4 },
            { competencia_id: '18', competencia_nombre: 'Bases de Datos', nivel_esperado: 3 }
        ],
        funciones: [
            'Desarrollar aplicaciones web escalables',
            'Implementar APIs y servicios backend',
            'Crear interfaces de usuario modernas',
            'Participar en revisiones de código'
        ],
        banda_salarial_min: 50000,
        banda_salarial_max: 75000
    },

    // SEMI_SENIOR Level
    {
        id: 'job_15',
        nombre: 'Analista de Calidad y Procesos',
        descripcion: 'Análisis y mejora de procesos organizacionales, gestión de calidad.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 4 },
            { competencia_id: '5', competencia_nombre: 'Gestión de Proyectos', nivel_esperado: 3 },
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 4 }
        ],
        funciones: [
            'Analizar y documentar procesos',
            'Identificar oportunidades de mejora',
            'Implementar sistemas de gestión de calidad',
            'Realizar auditorías internas'
        ],
        banda_salarial_min: 40000,
        banda_salarial_max: 60000
    },
    {
        id: 'job_16',
        nombre: 'Analista de Datos',
        descripcion: 'Análisis, interpretación y visualización de datos para generar insights de negocio.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '14', competencia_nombre: 'Análisis de Datos', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 4 },
            { competencia_id: '10', competencia_nombre: 'Python Avanzado', nivel_esperado: 3 }
        ],
        funciones: [
            'Analizar datos de negocio',
            'Crear dashboards y reportes',
            'Generar insights y recomendaciones',
            'Automatizar procesos de análisis'
        ],
        banda_salarial_min: 45000,
        banda_salarial_max: 65000
    },
    {
        id: 'job_17',
        nombre: 'Analista de Especialistas',
        descripcion: 'Coordinación y gestión de especialistas técnicos en proyectos.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '5', competencia_nombre: 'Gestión de Proyectos', nivel_esperado: 4 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 4 },
            { competencia_id: '4', competencia_nombre: 'Trabajo en Equipo', nivel_esperado: 4 }
        ],
        funciones: [
            'Coordinar equipos de especialistas',
            'Gestionar asignación de recursos',
            'Hacer seguimiento a proyectos',
            'Reportar avances y métricas'
        ],
        banda_salarial_min: 42000,
        banda_salarial_max: 62000
    },
    {
        id: 'job_18',
        nombre: 'Analista de Marketing',
        descripcion: 'Ejecución de estrategias de marketing digital y análisis de campañas.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '19', competencia_nombre: 'Marketing Digital', nivel_esperado: 4 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 3 }
        ],
        funciones: [
            'Ejecutar campañas de marketing digital',
            'Gestionar redes sociales',
            'Analizar métricas de marketing',
            'Crear contenido promocional'
        ],
        banda_salarial_min: 38000,
        banda_salarial_max: 58000
    },
    {
        id: 'job_19',
        nombre: 'Analista de Operaciones',
        descripcion: 'Gestión y optimización de operaciones técnicas y de servicio.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 4 },
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 4 },
            { competencia_id: '4', competencia_nombre: 'Trabajo en Equipo', nivel_esperado: 3 }
        ],
        funciones: [
            'Monitorear operaciones diarias',
            'Optimizar procesos operativos',
            'Generar reportes de gestión',
            'Coordinar con diferentes áreas'
        ],
        banda_salarial_min: 40000,
        banda_salarial_max: 60000
    },
    {
        id: 'job_20',
        nombre: 'Analista Contable',
        descripcion: 'Gestión contable, registro de transacciones y reportes financieros.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '20', competencia_nombre: 'Contabilidad y Finanzas', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 3 },
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 3 }
        ],
        funciones: [
            'Registrar transacciones contables',
            'Preparar estados financieros',
            'Realizar conciliaciones bancarias',
            'Apoyar en cierres contables'
        ],
        banda_salarial_min: 38000,
        banda_salarial_max: 55000
    },
    {
        id: 'job_21',
        nombre: 'Analista Ciberseguridad',
        descripcion: 'Monitoreo, análisis y respuesta a incidentes de seguridad informática.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '13', competencia_nombre: 'Ciberseguridad', nivel_esperado: 4 },
            { competencia_id: '17', competencia_nombre: 'Administración de Sistemas', nivel_esperado: 3 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 4 }
        ],
        funciones: [
            'Monitorear eventos de seguridad',
            'Analizar vulnerabilidades',
            'Responder a incidentes de seguridad',
            'Implementar controles de seguridad'
        ],
        banda_salarial_min: 45000,
        banda_salarial_max: 65000
    },
    {
        id: 'job_22',
        nombre: 'Analista Administrativo',
        descripcion: 'Soporte en procesos administrativos, documentación y gestión de recursos.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 3 },
            { competencia_id: '4', competencia_nombre: 'Trabajo en Equipo', nivel_esperado: 4 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 3 }
        ],
        funciones: [
            'Gestionar documentación administrativa',
            'Coordinar recursos y logística',
            'Apoyar en procesos de compras',
            'Generar reportes administrativos'
        ],
        banda_salarial_min: 35000,
        banda_salarial_max: 50000
    },
    {
        id: 'job_23',
        nombre: 'QA',
        descripcion: 'Diseño y ejecución de pruebas de calidad de software, automatización de tests.',
        nivel_jerarquico: 'SEMI_SENIOR',
        competencias_requeridas: [
            { competencia_id: '15', competencia_nombre: 'QA y Testing', nivel_esperado: 4 },
            { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 4 },
            { competencia_id: '11', competencia_nombre: 'JavaScript/TypeScript', nivel_esperado: 3 }
        ],
        funciones: [
            'Diseñar casos de prueba',
            'Ejecutar pruebas manuales y automatizadas',
            'Reportar y dar seguimiento a bugs',
            'Automatizar procesos de testing'
        ],
        banda_salarial_min: 42000,
        banda_salarial_max: 62000
    },

    // JUNIOR Level
    {
        id: 'job_24',
        nombre: 'Analista Help Desk',
        descripcion: 'Atención de primer nivel a usuarios, resolución de incidentes básicos.',
        nivel_jerarquico: 'JUNIOR',
        competencias_requeridas: [
            { competencia_id: '16', competencia_nombre: 'Soporte Técnico', nivel_esperado: 3 },
            { competencia_id: '6', competencia_nombre: 'Atención al Cliente', nivel_esperado: 4 },
            { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 3 }
        ],
        funciones: [
            'Atender solicitudes de usuarios',
            'Resolver incidentes de primer nivel',
            'Documentar casos en sistema de tickets',
            'Escalar casos complejos'
        ],
        banda_salarial_min: 28000,
        banda_salarial_max: 40000
    },
    {
        id: 'job_25',
        nombre: 'Analista Mesa de Ayuda',
        descripcion: 'Soporte técnico de primer y segundo nivel, atención telefónica y remota.',
        nivel_jerarquico: 'JUNIOR',
        competencias_requeridas: [
            { competencia_id: '16', competencia_nombre: 'Soporte Técnico', nivel_esperado: 3 },
            { competencia_id: '6', competencia_nombre: 'Atención al Cliente', nivel_esperado: 4 },
            { competencia_id: '4', competencia_nombre: 'Trabajo en Equipo', nivel_esperado: 3 }
        ],
        funciones: [
            'Brindar soporte técnico a usuarios',
            'Resolver problemas de hardware y software',
            'Gestionar tickets de soporte',
            'Mantener base de conocimiento'
        ],
        banda_salarial_min: 28000,
        banda_salarial_max: 42000
    },
    {
        id: 'job_26',
        nombre: 'Aprendiz SENA',
        descripcion: 'Estudiante en formación práctica en diferentes áreas de la organización.',
        nivel_jerarquico: 'JUNIOR',
        competencias_requeridas: [
            { competencia_id: '4', competencia_nombre: 'Trabajo en Equipo', nivel_esperado: 3 },
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 2 }
        ],
        funciones: [
            'Apoyar en tareas asignadas',
            'Aprender procesos organizacionales',
            'Desarrollar competencias técnicas',
            'Cumplir con programa de formación'
        ],
        banda_salarial_min: 15000,
        banda_salarial_max: 20000
    },
    {
        id: 'job_27',
        nombre: 'Auxiliar Servicios Generales',
        descripcion: 'Apoyo en servicios generales, mantenimiento y logística de instalaciones.',
        nivel_jerarquico: 'JUNIOR',
        competencias_requeridas: [
            { competencia_id: '4', competencia_nombre: 'Trabajo en Equipo', nivel_esperado: 3 },
            { competencia_id: '8', competencia_nombre: 'Orientación a Resultados', nivel_esperado: 3 }
        ],
        funciones: [
            'Mantener limpieza de instalaciones',
            'Apoyar en logística de eventos',
            'Gestionar suministros de oficina',
            'Realizar tareas de mantenimiento básico'
        ],
        banda_salarial_min: 18000,
        banda_salarial_max: 25000
    }
];

const MOCK_JOBS_RESPONSE: FetchResponse = successMock({
    cargos: MOCK_JOBS,
    paginacion: {
        total_items: MOCK_JOBS.length,
        total_paginas: Math.ceil(MOCK_JOBS.length / 10),
        cantidad_por_pagina: 10,
        pagina_actual: 1
    }
});

export const useJobService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getJobs = async (params?: JobQueryParams): Promise<FetchResponse | null> => {
        try {
            let filteredJobs = [...MOCK_JOBS];

            // Apply filters
            if (params?.filtro) {
                const searchTerm = params.filtro.toLowerCase();
                filteredJobs = filteredJobs.filter(j =>
                    j.nombre.toLowerCase().includes(searchTerm) ||
                    j.descripcion.toLowerCase().includes(searchTerm)
                );
            }

            if (params?.nivel_jerarquico) {
                filteredJobs = filteredJobs.filter(j => j.nivel_jerarquico === params.nivel_jerarquico);
            }

            // Sorting
            if (params?.orden_por) {
                filteredJobs.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] || '';
                    const bVal = (b as any)[params.orden_por!] || '';
                    const comparison = aVal > bVal ? 1 : -1;
                    return params.orden === 'desc' ? -comparison : comparison;
                });
            }

            // Pagination
            const page = params?.pagina || 1;
            const pageSize = params?.items_por_pagina || 10;
            const start = (page - 1) * pageSize;
            const paginatedJobs = filteredJobs.slice(start, start + pageSize);

            const response = successMock({
                cargos: paginatedJobs,
                paginacion: {
                    total_items: filteredJobs.length,
                    total_paginas: Math.ceil(filteredJobs.length / pageSize),
                    cantidad_por_pagina: pageSize,
                    pagina_actual: page
                }
            });

            return (await fetchData({
                url: '/api/jobs',
                body: params,
                mockData: response
            })) as FetchResponse | null;
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
