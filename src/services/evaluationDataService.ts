/**
 * Mock data for competency evaluations - used in development
 * Contains evaluation processes, persons, competencies, and evaluators
 */

//import { p } from 'framer-motion/client';
import { CompetencyEvaluationDetail } from './competencyEvaluationService';


// ─── Evaluation Processes ──────────────────────────────────────────────────────

export const MOCK_EVALUATION_PROCESSES: (CompetencyEvaluationDetail & { weights?: Record<string, number>; evaluadores_por_persona?: Record<string, string[]> })[] = [
    {
        id: 'eval_proc_001',
        nombre: 'Evaluación de Competencias - Líderes Q1 2026',
        descripcion: 'Evaluación integral de competencias técnicas y blandas para líderes y supervisores de la organización.',
        estado: 'PUBLICADO',
        total_competencias: 8,
        creado_por: 'Ana García López',
        fecha_creacion: '2026-01-15T09:00:00Z',
        fecha_actualizacion: '2026-03-20T14:30:00Z',
        total_evaluaciones: 5,
        competencias_asignadas: ['1', '2', '3', '4', '5', '6', '7', '8'],
        personas_a_evaluar: ['per_1', 'per_3', 'per_7', 'per_12', 'per_25', 'per_49'],
        evaluadores_asignados: ['usr_9', 'usr_10', 'usr_30'],
        weights: { '1': 15, '2': 15, '3': 12, '4': 12, '5': 12, '6': 12, '7': 11, '8': 11 },
        evaluadores_por_persona: {
            'per_1': ['usr_9', 'usr_10'],
            'per_3': ['usr_10', 'usr_30'],
            'per_7': ['usr_9'],
            'per_12': ['usr_30'],
            'per_25': ['usr_9', 'usr_10', 'usr_30'],
            'per_49': ['usr_9'],
        },
    },
    {
        id: 'eval_proc_002',
        nombre: 'Competencias Digitales - Equipo Tecnología',
        descripcion: 'Evaluación de habilidades digitales, transformación digital y competencias técnicas para el equipo de tecnología.',
        estado: 'PUBLICADO',
        total_competencias: 7,
        creado_por: 'Carlos Medina',
        fecha_creacion: '2026-02-05T10:30:00Z',
        fecha_actualizacion: '2026-03-10T16:00:00Z',
        total_evaluaciones: 12,
        competencias_asignadas: ['1', '2', '3', '4', '5', '6', '9'],
        personas_a_evaluar: ['per_8', 'per_14', 'per_18', 'per_22', 'per_31'],
        evaluadores_asignados: ['usr_39', 'usr_32', 'usr_11'],
        weights: { '1': 20, '2': 18, '3': 17, '4': 15, '5': 15, '6': 10, '9': 5 },
        evaluadores_por_persona: {
            'per_8': ['usr_39'],
            'per_14': ['usr_32', 'usr_11'],
            'per_18': ['usr_39', 'usr_32'],
            'per_22': ['usr_11'],
            'per_31': ['usr_39', 'usr_32', 'usr_11'],
        },
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
        competencias_asignadas: ['1', '4', '5', '7', '12'],
        personas_a_evaluar: ['per_2', 'per_4', 'per_6', 'per_15', 'per_28'],
        evaluadores_asignados: ['usr_38', 'usr_41'],
        weights: { '1': 25, '4': 25, '5': 25, '7': 15, '12': 10 },
        evaluadores_por_persona: {
            'per_2': ['usr_38'],
            'per_4': ['usr_41'],
            'per_6': ['usr_38', 'usr_41'],
            'per_15': ['usr_38'],
            'per_28': ['usr_41'],
        },
    },
    {
        id: 'eval_proc_004',
        nombre: 'Análisis de Brechas - Equipo Administrativo',
        descripcion: 'Identificación de brechas de competencias para preparar planes de desarrollo individual y organizacional.',
        estado: 'PUBLICADO',
        total_competencias: 10,
        creado_por: 'Pedro Ruiz Gómez',
        fecha_creacion: '2026-01-30T11:00:00Z',
        fecha_actualizacion: '2026-03-18T15:20:00Z',
        total_evaluaciones: 6,
        competencias_asignadas: ['2', '3', '4', '8', '9', '10', '11', '12', '13', '6'],
        personas_a_evaluar: ['per_5', 'per_10', 'per_19', 'per_24', 'per_33', 'per_42'],
        evaluadores_asignados: ['usr_50', 'usr_51', 'usr_9'],
        weights: { '2': 10, '3': 10, '4': 11, '8': 11, '9': 10, '10': 10, '11': 12, '12': 11, '13': 9, '6': 6 },
        evaluadores_por_persona: {
            'per_5': ['usr_50'],
            'per_10': ['usr_51'],
            'per_19': ['usr_9'],
            'per_24': ['usr_50', 'usr_51'],
            'per_33': ['usr_51', 'usr_9'],
            'per_42': ['usr_50', 'usr_9'],
        },
    },
];


