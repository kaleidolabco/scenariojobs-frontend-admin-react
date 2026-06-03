/**
 * MIGRACIÓN DE DATOS MOCK: De funciones como strings a estructura jerárquica
 * 
 * Este archivo proporciona helpers para actualizar los datos mock en jobService.ts
 * al nuevo formato de funciones jerárquicas.
 * 
 * Opciones de migración:
 * 1. MANUAL: Actualizar cada job individualmente (recomendado para pocos jobs)
 * 2. SEMI-AUTOMATIZADA: Usar la función helper convertLegacyFunctionsToHierarchical
 * 3. TOTALMENTE AUTOMATIZADA: Ejecutar script de conversión
 */

import { convertLegacyFunctionsToHierarchical } from './jobService';
import { JobFunction, createEmptyCapability, createEmptyKnowledge, createEmptyModule, createEmptyTopic, /* createEmptyDetail */ } from './functionService';

/**
 * Ejemplo 1: Migración manual para un job
 * 
 * ANTES:
 * {
 *     id: 'job_1',
 *     nombre: 'Gerente General',
 *     funciones: [
 *         'Definir la visión y estrategia organizacional',
 *         'Liderar el equipo directivo',
 *         ...
 *     ]
 * }
 * 
 * DESPUÉS:
 * {
 *     id: 'job_1',
 *     nombre: 'Gerente General',
 *     funciones: [
 *         {
 *             id: 'func_xxx',
 *             titulo: 'Gestión Estratégica',
 *             capacidades: [...]
 *         },
 *         {
 *             id: 'func_yyy',
 *             titulo: 'Liderazgo',
 *             capacidades: [...]
 *         }
 *     ]
 * }
 */

export function createCustomJobFunction(
    titulo: string,
    capacidades: { titulo: string; conocimientos: string[] }[]
): JobFunction {
    const jobFunc: JobFunction = {
        id: `func_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        titulo,
        descripcion: `Función: ${titulo}`,
        capacidades: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    jobFunc.capacidades = capacidades.map(cap => {
        const capability = createEmptyCapability();
        capability.titulo = cap.titulo;

        capability.conocimientos = cap.conocimientos.map(know => {
            const knowledge = createEmptyKnowledge();
            knowledge.titulo = know;

            const module = createEmptyModule();
            module.titulo = `${know} - Módulo Base`;

            const topic = createEmptyTopic();
            topic.titulo = `${know} - Temas Principales`;
            topic.detalles = [
                {
                    id: `det_${Date.now()}`,
                    titulo: 'Descripción',
                    descripcion: `Detalles sobre ${know}`
                }
            ];

            module.temas = [topic];
            knowledge.modulos = [module];

            return knowledge;
        });

        return capability;
    });

    return jobFunc;
}

/**
 * Ejemplo 2: Migración automática usando helper
 * 
 * Para cada job, ejecuta:
 * const funcionesActualizadas = convertLegacyFunctionsToHierarchical(
 *     ['Función 1', 'Función 2', ...],
 *     'Nombre de Función Principal'
 * );
 * 
 * Luego reemplaza el array de strings con el resultado
 */

/**
 * Ejemplo 3: Migración de Gerente General (job_1)
 * 
 * Este es un ejemplo completo de cómo quedaría después de la migración
 */
export const MIGRATED_JOB_1_EXAMPLE = {
    id: 'job_1',
    nombre: 'Gerente General',
    descripcion: 'Máxima autoridad ejecutiva de la organización, responsable de la estrategia y dirección general.',
    nivel_jerarquico: 'DIRECTOR' as const,
    competencias_requeridas: [
        { competencia_id: '1', competencia_nombre: 'Liderazgo', nivel_esperado: 5 },
        { competencia_id: '2', competencia_nombre: 'Comunicación Asertiva', nivel_esperado: 5 },
        { competencia_id: '5', competencia_nombre: 'Gestión de Proyectos', nivel_esperado: 5 },
        { competencia_id: '7', competencia_nombre: 'Pensamiento Analítico', nivel_esperado: 5 }
    ],
    funciones: [
        {
            id: 'func_gerente_general_001',
            titulo: 'Dirección Estratégica',
            descripcion: 'Responsable de la dirección estratégica y visión de la organización',
            capacidades: [
                {
                    id: 'cap_001',
                    titulo: 'Definición de Visión Estratégica',
                    descripcion: 'Capacidad de definir y comunicar la visión estratégica',
                    conocimientos: [
                        {
                            id: 'know_001',
                            titulo: 'Planificación Estratégica',
                            tipoConocimiento: 'ESTANDAR' as const,
                            fuentes: ['INTERNA' as const],
                            nivelDesarrollo: 3 as const,
                            modulos: [
                                {
                                    id: 'mod_001',
                                    titulo: 'Análisis FODA',
                                    temas: [
                                        {
                                            id: 'tema_001',
                                            titulo: 'Metodología FODA',
                                            detalles: [
                                                {
                                                    id: 'det_001',
                                                    titulo: 'Fortalezas y Debilidades Internas',
                                                    descripcion: 'Análisis de factores internos'
                                                },
                                                {
                                                    id: 'det_002',
                                                    titulo: 'Oportunidades y Amenazas Externas',
                                                    descripcion: 'Análisis de factores externos'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'func_gerente_general_002',
            titulo: 'Liderazgo Organizacional',
            descripcion: 'Responsable del liderazgo del equipo directivo',
            capacidades: [
                {
                    id: 'cap_002',
                    titulo: 'Liderazgo de Equipo',
                    conocimientos: [
                        {
                            id: 'know_002',
                            titulo: 'Estilos de Liderazgo',
                            tipoConocimiento: 'INTERNO' as const,
                            fuentes: ['INTERNA' as const],
                            nivelDesarrollo: 3 as const,
                            modulos: [
                                {
                                    id: 'mod_002',
                                    titulo: 'Liderazgo Situacional',
                                    temas: [
                                        {
                                            id: 'tema_002',
                                            titulo: 'Adaptación al Contexto',
                                            detalles: [
                                                {
                                                    id: 'det_003',
                                                    titulo: 'Diagnóstico de Madurez del Equipo',
                                                    descripcion: 'Evaluar el nivel de desarrollo del equipo'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ] as any, // Aquí iría el array completo de JobFunction[]
    banda_salarial_min: 200000,
    banda_salarial_max: 300000
};

/**
 * PASOS para migrar los datos mock:
 * 
 * 1. OPCIÓN RÁPIDA (Recomendada para iniciar):
 *    - Reemplazar toda la sección de mock data MOCK_JOBS con estructuras que usen
 *      la función convertLegacyFunctionsToHierarchical
 *    
 * 2. OPCIÓN EXHAUSTIVA (Recomendada para producción):
 *    - Diseñar manualmente la estructura de funciones para cada cargo
 *    - Considerar las responsabilidades reales y competencias
 *    - Crear funciones con múltiples capacidades y módulos bien organizados
 *    
 * 3. CÓDIGO DE ACTUALIZACIÓN:
 * 
 *    En jobService.ts, para cada job antiguo:
 *    
 *    const MOCK_JOBS: Job[] = [
 *        {
 *            ...jobData,
 *            funciones: convertLegacyFunctionsToHierarchical(
 *                ['Definir la visión...', 'Liderar el equipo...', ...],
 *                'Gestión Ejecutiva'
 *            )
 *        }
 *    ];
 */

// Exportar para uso en jobService.ts
export { convertLegacyFunctionsToHierarchical };
