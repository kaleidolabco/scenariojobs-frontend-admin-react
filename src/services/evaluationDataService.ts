/**
 * Mock data for competency evaluations - used in development
 * Contains evaluation processes, persons, competencies, and evaluators
 */

import { CompetencyEvaluationDetail } from './competencyEvaluationService';


// ─── Evaluation Processes ──────────────────────────────────────────────────────

export const MOCK_EVALUATION_PROCESSES: CompetencyEvaluationDetail[] = [
    {
        id: 'eval_proc_001',
        nombre: 'Evaluación de Competencias – Líderes Q1 2026',
        descripcion: 'Evaluación integral de competencias técnicas y blandas para líderes y supervisores de la organización.',
        estado: 'PUBLICADO',
        total_competencias: 8,
        creado_por: 'Ana García López',
        fecha_creacion: '2026-01-15T09:00:00Z',
        fecha_actualizacion: '2026-03-20T14:30:00Z',
        total_evaluaciones: 5,
        // Competencias asignadas: Liderazgo, Comunicación, Trabajo en Equipo, Orientación a Resultados, etc.
        competencias_asignadas: ['1', '2', '3', '4', '5', '6', '7', '8'],
        // Personas a evaluar
        personas_a_evaluar: ['per_1', 'per_3', 'per_7', 'per_12', 'per_25'],
        // Evaluadores asignados (evaluadores que pueden calificar)
        evaluadores_asignados: ['usr_9', 'usr_10', 'usr_30'],
    },
    {
        id: 'eval_proc_002',
        nombre: 'Competencias Digitales – Equipo Tecnología',
        descripcion: 'Evaluación de habilidades digitales, transformación digital y competencias técnicas para el equipo de tecnología.',
        estado: 'PUBLICADO',
        total_competencias: 7,
        creado_por: 'Carlos Medina',
        fecha_creacion: '2026-02-05T10:30:00Z',
        fecha_actualizacion: '2026-03-10T16:00:00Z',
        total_evaluaciones: 12,
        // Competencias: Orientación al Cliente, Comunicación, Trabajo en Equipo, etc.
        competencias_asignadas: ['1', '2', '3', '4', '5', '6', '9'],
        personas_a_evaluar: ['per_1', 'per_3', 'per_18', 'per_22', 'per_31'],
        evaluadores_asignados: ['usr_39', 'usr_32', 'usr_11'],
    },
    {
        id: 'eval_proc_003',
        nombre: 'Evaluación de Servicio al Cliente',
        descripcion: 'Evaluación de competencias de atención al cliente, comunicación asertiva y resolución de conflictos.',
        estado: 'PUBLICADO',
        total_competencias: 5,
        creado_por: 'Laura Torres',
        fecha_creacion: '2026-02-20T08:00:00Z',
        fecha_actualizacion: '2026-03-15T13:45:00Z',
        total_evaluaciones: 8,
        // Competencias: Orientación al Cliente, Comunicación, Resolución de Conflictos, etc.
        competencias_asignadas: ['1', '4', '5', '7', '12'],
        personas_a_evaluar: ['per_2', 'per_4', 'per_6', 'per_15', 'per_28'],
        evaluadores_asignados: ['usr_38', 'usr_41'],
    },
    {
        id: 'eval_proc_004',
        nombre: 'Análisis de Brechas – Equipo Administrativo',
        descripcion: 'Identificación de brechas de competencias para preparar planes de desarrollo individual y organizacional.',
        estado: 'PUBLICADO',
        total_competencias: 10,
        creado_por: 'Pedro Ruiz Gómez',
        fecha_creacion: '2026-01-30T11:00:00Z',
        fecha_actualizacion: '2026-03-18T15:20:00Z',
        total_evaluaciones: 6,
        // Competencias amplias
        competencias_asignadas: ['2', '3', '4', '8', '9', '10', '11', '12', '13', '6'],
        personas_a_evaluar: ['per_5', 'per_10', 'per_19', 'per_24', 'per_33', 'per_42'],
        evaluadores_asignados: ['usr_50', 'usr_51', 'usr_9'],
    },
];

// ─── Mock Assessment Data (responses already saved) ───────────────────────────

/**
 * Mock evaluation responses for demonstration
 * Maps: evaluador_id -> proceso_id -> persona_id -> competencia_id -> nivel
 */
export const MOCK_EVALUATION_RESPONSES = {
    'usr_9': {
        'eval_proc_001': {
            'per_1': { '1': 4, '4': 3, '3': 4, '2': 4, '5': 3, '6': 4, '7': 3, '8': 4 },
            'per_3': { '1': 3, '4': 3, '3': 3, '2': 3, '5': 2, '6': 3, '7': 3, '8': 3 },
        },
        'eval_proc_003': {
            'per_2': { '1': 4, '4': 4, '5': 3, '7': 4, '12': 4 },
        },
    },
    'usr_10': {
        'eval_proc_001': {
            'per_7': { '1': 3, '4': 3, '3': 4, '2': 3, '5': 3, '6': 3, '7': 4, '8': 3 },
            'per_12': { '1': 2, '4': 2, '3': 2, '2': 2, '5': 2, '6': 2, '7': 2, '8': 2 },
        },
    },
};

// ─── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Filter evaluation processes assigned to an evaluator
 */
export const getProcessesForEvaluator = (evaluatorId: string): CompetencyEvaluationDetail[] => {
    return MOCK_EVALUATION_PROCESSES.filter((proc) =>
        proc.evaluadores_asignados.includes(evaluatorId)
    );
};

/**
 * Get evaluation responses for an evaluator
 */
export const getEvaluatorResponses = (evaluatorId: string) => {
    return MOCK_EVALUATION_RESPONSES[evaluatorId as keyof typeof MOCK_EVALUATION_RESPONSES] || {};
};

/**
 * Check if person has been evaluated by evaluator in a process
 */
export const isPersonEvaluated = (
    evaluatorId: string,
    processId: string,
    personId: string
): boolean => {
    const responses = MOCK_EVALUATION_RESPONSES[evaluatorId as keyof typeof MOCK_EVALUATION_RESPONSES];
    if (!responses) return false;
    const processResponses = responses[processId as keyof typeof responses];
    if (!processResponses) return false;
    return !!processResponses[personId as keyof typeof processResponses];
};
