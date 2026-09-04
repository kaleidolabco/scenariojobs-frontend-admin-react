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
    puesto?: string;
    email?: string;
    foto_url?: string;
    fecha_ingreso?: string;
}

export interface ProcessParticipantRow {
    id: string;
    colaborador_id: string;
    persona_id: string;
    nombres: string;
    apellidos: string;
    nombre_completo?: string;
    email?: string;
    foto_url?: string;
    fecha_ingreso?: string;
    cargo?: { id: string; nombre: string } | string;
    puesto?: { id: string; nombre: string } | string;
    unidad_organizacional?: { id: string; nombre: string } | string;
    evaluadores_custom?: string[];
    evaluadores_detalle?: {
        id: string;
        nombre_completo?: string;
        nombres?: string;
        apellidos?: string;
        email?: string;
        cargo?: { id: string; nombre: string } | string;
        puesto?: { id: string; nombre: string } | string;
    }[];
    total_asignaciones?: number;
    fecha_asignacion?: string;
}

export interface ProcessParticipantsQueryParams {
    pagina?: number;
    limite?: number;
    busqueda?: string;
    unidad_organizacional_id?: string;
    cargo_id?: string;
    ordenar_por?: string;
    orden?: 'asc' | 'desc';
}

export type EvaluatorUser = {
    id: string;
    email: string;
    persona?: { nombres?: string; apellidos?: string; nombre_completo?: string };
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
    niveles_esperados?: Record<string, number>;
    nCargos?: number;
    total_cargos?: number;
    nPersonas?: number;
    total_personas?: number;
    total_competencias?: number;
    avisos: AvisoDerivacion[];
}

export const fmtPerson = (p: { nombres?: string; apellidos?: string; nombre_completo?: string }) =>
    p.nombre_completo || `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim();

export const fmtEval = (u: EvaluatorUser) =>
    u.persona ? fmtPerson(u.persona) : u.email;

export const getInitials = (p: { nombres?: string; apellidos?: string; nombre_completo?: string }) => {
    const name = p.nombre_completo || `${p.nombres ?? ''} ${p.apellidos ?? ''}`;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }
    return `${name[0] ?? ''}`.toUpperCase();
};

export const getEntityName = (val?: { id?: string; nombre?: string } | string): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.nombre ?? '';
};

export interface PersonaFuente {
    id: string;
    nombres?: string;
    apellidos?: string;
    departamento?: string;
    puesto_nombre?: string;
    email_personal?: string;
    foto_url?: string;
}

/** Normaliza una persona (del backend) a la fila mostrada en la tabla. */
export const personToRow = (p: PersonaFuente): PersonRow => ({
    id: p.id,
    nombres: p.nombres ?? '',
    apellidos: p.apellidos ?? '',
    unidad_organizacional: p.departamento,
    cargo: p.puesto_nombre,
    puesto: p.puesto_nombre,
    email: p.email_personal,
    foto_url: p.foto_url,
});

/** Normaliza un participante retornado por el backend a PersonRow */
export const participantToPersonRow = (p: ProcessParticipantRow): PersonRow => ({
    id: p.colaborador_id || p.persona_id || p.id,
    nombres: p.nombres,
    apellidos: p.apellidos,
    unidad_organizacional: getEntityName(p.unidad_organizacional),
    cargo: getEntityName(p.cargo),
    puesto: getEntityName(p.puesto),
    email: p.email,
    foto_url: p.foto_url,
    fecha_ingreso: p.fecha_ingreso,
});
