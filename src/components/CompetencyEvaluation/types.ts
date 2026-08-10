/**
 * Tipos y helpers compartidos por las pestañas de Participantes / Evaluadores
 * en el constructor de procesos de evaluación de competencias.
 */

export interface PersonRow {
    id: string;
    nombres: string;
    apellidos: string;
    unidad_organizacional?: string;
    cargo?: string;
    email?: string;
}

export type EvaluatorUser = {
    id: string;
    email: string;
    persona?: { nombres: string; apellidos: string };
};

export type EvaluadoresPorPersona = Record<string, string[]>;

export type OrigenCompetencias = 'manual' | 'desde_cargos';

export interface AvisoDerivacion {
    type: 'SIN_PUESTO' | 'SIN_CARGO' | 'SIN_COMPETENCIAS';
    personaId?: string;
    personaNombre?: string;
    mensaje: string;
}

export interface SugerenciaCompetencias {
    ids: string[];
    pesos: Record<string, number>;
    expectedLevels: Record<string, number>;
    nCargos: number;
    nPersonas: number;
    avisos: AvisoDerivacion[];
}

export const fmtPerson = (p: { nombres: string; apellidos: string }) =>
    `${p.nombres} ${p.apellidos}`;

export const fmtEval = (u: EvaluatorUser) =>
    u.persona ? fmtPerson(u.persona) : u.email;

export const getInitials = (p: PersonRow) =>
    `${p.nombres?.[0] ?? ''}${p.apellidos?.[0] ?? ''}`.toUpperCase();
