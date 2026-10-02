import useFetch from '../hooks/useFetch';
import { FetchResponse, Pagination } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import {
    CompetencyEvaluationConfig,
    EstadoAsignacion,
    TipoEvaluacion,
} from './evaluationAssignmentService';
import { ProcessParticipantRow, ProcessParticipantsQueryParams } from '../components/CompetencyEvaluation/types';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Estados legacy del proceso de competencia (compatibilidad hacia atrás).
 * Los nuevos estados extendidos viven en `EstadoProcesoCompetencia`.
 */
export type CompetencyEvaluationStatus = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';

/**
 * Estados extendidos del proceso de evaluación de competencias (nuevo flujo).
 * Mantiene los legacy y agrega EN_CALIFICACION / EN_REVISION / CERRADO.
 */
export type EstadoProcesoCompetencia =
    | CompetencyEvaluationStatus
    | 'EN_CALIFICACION'
    | 'EN_REVISION'
    | 'CERRADO';

export interface CompetencyEvaluationQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: 'asc' | 'desc';
    orden_por?: string;
    search?: string;
    estado?: CompetencyEvaluationStatus | EstadoProcesoCompetencia;
}

export interface CompetencyEvaluationSummary {
    id: string;
    nombre: string;
    descripcion?: string;
    estado: CompetencyEvaluationStatus;
    /** Estado extendido del flujo (BORRADOR, PUBLICADO, EN_CALIFICACION, EN_REVISION, CERRADO, ARCHIVADO). */
    estado_flujo?: EstadoProcesoCompetencia;
    total_competencias: number;
    creado_por: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    total_evaluaciones: number;
}

// Extended type for detailed view with assignments
export interface CompetencyEvaluationDetail extends CompetencyEvaluationSummary {
    competencias_asignadas: string[]; // Competency IDs
    personas_a_evaluar: string[]; // Person IDs
    evaluadores_asignados: string[]; // User IDs
    total_participantes?: number;
    total_evaluadores?: number;
    total_evaluaciones_completadas?: number;
    /** Estado extendido del flujo de competencias (nuevo flujo). */
    estado_flujo?: EstadoProcesoCompetencia;
    /** Configuración del proceso (tipos de evaluación, calibración, corrección). */
    config?: CompetencyEvaluationConfig;
    configuracion?: CompetencyEvaluationConfig;
    /** Origen de las competencias asignadas: 'manual' | 'desde_cargos'. */
    origen_competencias?: 'manual' | 'desde_cargos';
    /** Pesos por competencia (mapa competencia_id → peso). */
    weights?: Record<string, number>;
    pesos?: Record<string, number>;
    /** Plantillas de correo asociadas. */
    templates_asociadas?: string[];
    plantillas_correo_ids?: string[];
    /** Mapa persona/colaborador_id → evaluadores tipo OTRO. */
    evaluadores_por_persona?: Record<string, string[]>;
    evaluadores_por_colaborador?: Record<string, string[]>;
    /** Detalle de las competencias asignadas (orden, sección, peso). */
    competencias?: {
        id: string;
        competencia_id: string;
        nombre: string;
        descripcion?: string;
        escala: number;
        categoria?: { id: string; nombre: string } | string;
        orden: number;
        seccion?: string;
        peso?: number;
        peso_ponderacion?: number;
    }[];
}

// ─── Asignaciones del evaluador ──────────────────────────────────────────────

/** Item de asignación tal como lo devuelve `GET /my-assignments` (y `/assignments`). */
export interface CompetencyAssignment {
    id: string;
    proceso_id: string;
    proceso_nombre: string;
    proceso_estado: EstadoProcesoCompetencia;
    total_competencias: number;
    colaborador_id: string;
    evaluador_id: string;
    /** Nombre legible del evaluador (embellece §9.1/§9.6). */
    evaluador_nombre?: string | null;
    evaluador_email?: string | null;
    tipo: TipoEvaluacion;
    peso: number;
    estado: EstadoAsignacion;
    contador_correcciones: number;
    correccion_disponible: boolean;
    correccion_voluntaria: boolean;
    calibrado_por?: string | null;
    fecha_calibracion?: string | null;
    comentario_calibracion?: string | null;
    colaborador_nombre: string;
    colaborador_cargo: string;
    /** Puntaje vigente de la respuesta (si el backend lo embellece como campo opcional). */
    puntaje_numerico?: number | null;
}

/** Resumen de estados de las asignaciones del evaluador (mismos filtros que la consulta). */
export interface MyAssignmentsResumen {
    total: number;
    pendientes: number;
    en_progreso: number;
    por_corregir: number;
    en_revision: number;
    completadas: number;
    autoevaluaciones_pendientes: number;
}

export interface AssignmentsQueryParams {
    proceso_id?: string;
    colaborador_id?: string;
    estado?: EstadoAsignacion;
    tipo?: TipoEvaluacion;
    pagina?: number;
    limite?: number;
}

// ─── Payload helpers ──────────────────────────────────────────────────────────

export interface CompetenciaItemPayload {
    competencia_id: string;
    orden: number;
    seccion?: string;
    peso_ponderacion?: number;
}

export interface SaveCompetenciesIncrementalPayload {
    origen: 'manual' | 'desde_cargos';
    agregar?: CompetenciaItemPayload[];
    eliminar?: string[];
    actualizar?: CompetenciaItemPayload[];
    pesos?: Record<string, number>;
    participante_ids?: string[];
}

export interface SaveCompetenciesPayload {
    origen: 'manual' | 'desde_cargos';
    competencias: CompetenciaItemPayload[];
    weights?: Record<string, number>;
    pesos?: Record<string, number>;
}

export interface ParticipantToAdd {
    colaborador_id: string;
    evaluadores?: string[];
}

export interface SaveParticipantsPayload {
    agregar?: ParticipantToAdd[];
    retirar?: string[];
    evaluadores_por_colaborador?: Record<string, string[]>;
}

export interface SaveEmailsPayload {
    plantillas_correo_ids: string[];
}

// ─── Ejecución (evaluador): competencias, respuestas ─────────────────────────

/** Ítem devuelto por `GET /:id/competencies` (§6.1). */
export interface ProcessCompetencyItem {
    id: string;
    competencia_id: string;
    nombre: string;
    descripcion: string;
    escala: number;
    categoria?: { id: string; nombre: string } | string;
    orden?: number;
    seccion?: string;
    peso_ponderacion?: number;
}

/** Body de `POST /competency-evaluations/responses` (§9.3). */
export interface SaveEvaluationResponsePayload {
    asignacion_id: string;
    proceso_id: string;
    colaborador_id: string;
    /** Mapa competencia_id → nivel (0–5); debe incluir todas las competencias activas del proceso. */
    competencias_evaluadas: Record<string, number>;
    comentarios?: { text?: string; video_url?: string };
}

/** Respuesta de evaluación devuelta por `POST/GET /responses` (§9.3/§9.4). */
export interface EvaluationResponseItem {
    id: string;
    asignacion_id: string;
    proceso_id: string;
    colaborador_id: string;
    evaluador_id: string;
    competencias_evaluadas: Record<string, number>;
    comentarios?: { text?: string; video_url?: string };
    estado: EstadoAsignacion;
    puntaje_numerico?: number;
    escala_minima?: number;
    escala_maxima?: number;
    puntaje_normalizado?: number;
    fecha_envio?: string;
    fecha_ultima_edicion?: string;
}

// ─── Revisión / Calibración RRHH y resultados (§9.5, §10) ────────────────────

/** Acción de calibración de RRHH sobre una asignación (§9.5). */
export type AccionCalibracion = 'approve' | 'calibrate' | 'return';

/** Body compartido para `PATCH .../assignments/:id/approve | calibrate | return` (§9.5). */
export interface CalibrationPayload {
    /** Mapa competencia_id → nivel (0–5). Obligatorio; en approve/calibrate se persiste sobre la respuesta. */
    competencias_calibradas: Record<string, number>;
    comentario?: string;
}

/** Item de `niveles_competencia` devuelto por `GET /:procesoId/collaborators/:colaboradorId/competency-levels` (§10). */
export interface CompetencyLevelItem {
    competencia_id: string;
    competencia_nombre: string;
    nivel_obtenido: number;
    /** Etiqueta del nivel obtenido (del catálogo), ej. "Alto". */
    nivel_nombre?: string | null;
    nivel_descripcion?: string | null;
    nivel_esperado: number | null;
    brecha?: number | null;
    escala_maxima: number;
}

// ─── Resumen de revisión y detalle de asignaciones (§9.6, §9.7) ──────────────

/** Dimensión de agrupación para `GET /:procesoId/review-summary` (§9.6). */
export type AgruparPor = 'colaborador' | 'evaluador';

/** Conteos globales del proceso (sobre el universo filtrado, sin paginación) en §9.6. */
export interface ReviewSummaryResumen {
    total: number;
    pendientes: number;
    en_progreso: number;
    en_revision: number;
    devueltas: number;
    completadas: number;
    aprobadas: number;
}

/** Grupo (colaborador o evaluador) devuelto por §9.6. */
export interface ReviewSummaryGroup {
    grupo_id: string;
    nombre: string;
    subtitulo?: string | null;
    total_asignaciones: number;
    completadas: number;
    aprobadas: number;
    en_revision: number;
    devueltas: number;
    pendientes_o_en_progreso: number;
    progreso: number;
    asignaciones: CompetencyAssignment[];
}

export interface ReviewSummaryParams {
    agrupar_por?: AgruparPor;
    busqueda?: string;
    estado?: EstadoAsignacion;
    pagina?: number;
    limite?: number;
}

/** Competencia dentro del item de `assignments-detail` (§9.7). */
export interface AssignmentDetailCompetencia {
    competencia_id: string;
    nombre: string;
    descripcion?: string | null;
    /** Nivel original emitido por el evaluador (snapshot del primer log si hubo calibración). */
    nivel_evaluador: number;
    /** Último valor calibrado por RRHH; null si nunca se calibró. */
    nivel_calibrado: number | null;
    /** Valor vigente en la respuesta. */
    nivel_actual: number;
    /** true si la competencia aparece en algún log de calibración. */
    fue_calibrada: boolean;
    /** Etiqueta del nivel vigente (snapshot de la respuesta / catálogo), ej. "Medio". */
    nivel_nombre?: string | null;
    nivel_descripcion?: string | null;
    escala_minima: number;
    escala_maxima: number;
}

/** Item de `GET /:procesoId/assignments-detail` (§9.7). */
export interface AssignmentDetailItem {
    id: string;
    proceso_id: string;
    tipo: TipoEvaluacion;
    estado: EstadoAsignacion;
    peso: number;
    /** Veces que el evaluador corrigió su evaluación. */
    contador_correcciones: number;
    /** Número de entradas en el log de calibración. */
    total_calibraciones: number;
    fecha_registro: string;
    fecha_envio: string | null;
    fecha_ultima_edicion: string | null;
    colaborador: {
        id: string;
        nombres: string;
        apellidos: string;
        nombre_completo: string;
        cargo?: string | null;
    };
    /** Nombre del ocupante del puesto supervisor del colaborador (null si vacante). */
    jefe_directo: string | null;
    evaluador: {
        id: string;
        nombres: string;
        apellidos: string;
        nombre_completo: string;
        correo?: string | null;
    };
    competencias: AssignmentDetailCompetencia[];
    /** Comentarios del evaluador sobre la respuesta (null si no hay respuesta). */
    comentarios_evaluador?: { text?: string; video_url?: string } | null;
    puntaje_numerico: number | null;
    puntaje_normalizado: number | null;
}

export interface AssignmentsDetailParams {
    asignacion_id?: string;
    colaborador_id?: string;
    evaluador_id?: string;
    estado?: EstadoAsignacion;
    tipo?: TipoEvaluacion;
    busqueda?: string;
    ordenar_por?: string;
    orden?: 'asc' | 'desc';
    pagina?: number;
    limite?: number;
}

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useCompetencyEvaluationService = () => {
    const { fetchData } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token } = useAuthStore();

    const BASE_URL = `${import.meta.env.VITE_API_URL}/competency-evaluations`;

    const run = async (promise: Promise<FetchResponse | null>): Promise<FetchResponse | null> => {
        try {
            return await promise;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET list ──────────────────────────────────────────────────────────────

    const getCompetencyEvaluations = async (
        params?: CompetencyEvaluationQueryParams
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const backendParams: Record<string, string | number | undefined> = {};
                if (params?.search) backendParams.busqueda = params.search;
                if (params?.estado) backendParams.estado = params.estado;
                if (params?.pagina) backendParams.pagina = params.pagina;
                if (params?.items_por_pagina) backendParams.limite = params.items_por_pagina;
                if (params?.orden_por) backendParams.ordenar_por = params.orden_por;
                if (params?.orden) backendParams.orden = params.orden;

                const response = (await fetchData({
                    url: BASE_URL,
                    params: backendParams,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener las evaluaciones de competencias');
                }

                if (response?.success && response.data) {
                    return {
                        ...response,
                        data: {
                            evaluaciones: response.data.datos ?? response.data.evaluaciones ?? [],
                            paginacion: response.data.paginacion ?? null,
                        },
                    };
                }

                return response;
            })()
        );
    };

    // ── GET mis asignaciones (self-scoped) ────────────────────────────────────

    const getMyAssignments = async (
        params?: AssignmentsQueryParams
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const backendParams: Record<string, string | number | undefined> = {};
                if (params?.proceso_id) backendParams.proceso_id = params.proceso_id;
                if (params?.colaborador_id) backendParams.colaborador_id = params.colaborador_id;
                if (params?.estado) backendParams.estado = params.estado;
                if (params?.tipo) backendParams.tipo = params.tipo;
                if (params?.pagina) backendParams.pagina = params.pagina;
                if (params?.limite) backendParams.limite = params.limite;

                const response = (await fetchData({
                    url: `${BASE_URL}/my-assignments`,
                    params: backendParams,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener tus asignaciones de evaluación');
                }

                if (response?.success && response.data) {
                    const resumen: MyAssignmentsResumen = response.data.resumen ?? {};
                    const datos: CompetencyAssignment[] =
                        response.data.data?.datos ?? response.data.datos ?? [];
                    const paginacion: Pagination =
                        response.data.data?.paginacion ?? response.data.paginacion ?? null;
                    return {
                        ...response,
                        data: { resumen, asignaciones: datos, paginacion },
                    };
                }

                return response;
            })()
        );
    };

    // ── GET detail ────────────────────────────────────────────────────────────

    type RawDetail = CompetencyEvaluationDetail & {
        colaboradores_evaluados?: string[];
        evaluadores_por_colaborador?: Record<string, string[]>;
        plantillas_correo_ids?: string[];
        pesos?: Record<string, number>;
        configuracion?: CompetencyEvaluationConfig;
    };

    const mapDetail = (raw: RawDetail): CompetencyEvaluationDetail => {
        const competencias = raw.competencias ?? [];
        const weights = raw.pesos ?? raw.weights ?? {};
        const templates = raw.plantillas_correo_ids ?? raw.templates_asociadas ?? [];
        const config = raw.configuracion ?? raw.config;
        const personas = raw.colaboradores_evaluados ?? raw.personas_a_evaluar ?? [];
        const evaluadoresPorPersona = raw.evaluadores_por_colaborador ?? raw.evaluadores_por_persona ?? {};

        return {
            ...raw,
            config,
            weights,
            pesos: weights,
            personas_a_evaluar: personas,
            evaluadores_por_persona: evaluadoresPorPersona,
            evaluadores_por_colaborador: evaluadoresPorPersona,
            templates_asociadas: templates,
            plantillas_correo_ids: templates,
            competencias_asignadas:
                raw.competencias_asignadas ??
                competencias.map((c) => c.competencia_id || c.id) ??
                [],
        };
    };

    const getCompetencyEvaluationDetail = async (id: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${id}`,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener la evaluación');
                }

                if (response?.success && response.data) {
                    return { ...response, data: { evaluacion: mapDetail(response.data) } };
                }

                return response;
            })()
        );
    };

    // ── GET evaluation for person ─────────────────────────────────────────────

    const getCompetencyEvaluationForPerson = async (personaId: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/colaborador/${personaId}`,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al buscar evaluación de competencias');
                }

                if (response?.success) {
                    const raw = response.data;
                    return { ...response, data: { evaluacion: raw ? mapDetail(raw) : null } };
                }

                return response;
            })()
        );
    };

    // ── GET stats ─────────────────────────────────────────────────────────────

    const getCompetencyEvaluationStats = async (): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/stats`,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener las estadísticas');
                }

                if (response?.success && response.data) {
                    const raw = response.data;
                    const stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : raw;
                    return { ...response, data: { stats } };
                }

                return response;
            })()
        );
    };

    // ── CREATE ────────────────────────────────────────────────────────────────

    const createCompetencyEvaluation = async (
        data: Pick<CompetencyEvaluationSummary, 'nombre' | 'descripcion' | 'estado'>
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: BASE_URL,
                    method: 'POST',
                    body: {
                        nombre: data.nombre,
                        descripcion: data.descripcion,
                        estado: data.estado,
                    },
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al crear la evaluación');
                }

                return response;
            })()
        );
    };

    // ── UPDATE ────────────────────────────────────────────────────────────────

    const updateCompetencyEvaluation = async (
        id: string,
        data: Partial<Pick<CompetencyEvaluationSummary, 'nombre' | 'descripcion' | 'estado'>>
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${id}`,
                    method: 'PUT',
                    body: data,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al actualizar la evaluación');
                }

                return response;
            })()
        );
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    const deleteCompetencyEvaluation = async (id: string): Promise<boolean> => {
        try {
            const response = (await fetchData({
                url: `${BASE_URL}/${id}`,
                method: 'DELETE',
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar la evaluación');
            }

            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    // ── CLONE ─────────────────────────────────────────────────────────────────

    const cloneCompetencyEvaluation = async (id: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${id}/clone`,
                    method: 'POST',
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al clonar la evaluación');
                }

                return response;
            })()
        );
    };

    // ── UPDATE ESTADO DEL FLUJO ────────────────────────────────────────────────

    const updateEstadoProceso = async (
        id: string,
        estadoFlujo: EstadoProcesoCompetencia,
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${id}/estado`,
                    method: 'PATCH',
                    body: { estado_flujo: estadoFlujo },
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al actualizar estado del proceso');
                }
                return response;
            })()
        );
    };

    // ── Guardado por secciones modulares del proceso ──────────────────────────

    /**
     * Consulta la configuración General de evaluación del proceso.
     */
    const getConfig = async (procesoId: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/config`,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener la configuración');
                }
                return response;
            })()
        );
    };

    /**
     * Guarda la configuración General del proceso (tipos de evaluación,
     * calibración RRHH, revisión obligatoria y política de corrección).
     */
    const saveConfig = async (
        procesoId: string,
        config: CompetencyEvaluationConfig,
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/config`,
                    method: 'PUT',
                    body: config,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al guardar la configuración');
                }
                return response;
            })()
        );
    };

    /**
     * Consulta las competencias asignadas al proceso (paginado).
     */
    const getProcessCompetencies = async (
        procesoId: string,
        params?: { pagina?: number; limite?: number; busqueda?: string; categoria_id?: string; ordenar_por?: string; orden?: string }
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const backendParams: Record<string, string | number | undefined> = {};
                if (params?.pagina) backendParams.pagina = params.pagina;
                if (params?.limite) backendParams.limite = params.limite;
                if (params?.busqueda) backendParams.busqueda = params.busqueda;
                if (params?.categoria_id) backendParams.categoria_id = params.categoria_id;
                if (params?.ordenar_por) backendParams.ordenar_por = params.ordenar_por;
                if (params?.orden) backendParams.orden = params.orden;

                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/competencies`,
                    params: Object.keys(backendParams).length > 0 ? backendParams : undefined,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener las competencias del proceso');
                }
                return response;
            })()
        );
    };

    /**
     * Actualiza incrementalmente las competencias del proceso (PATCH).
     */
    const saveCompetencies = async (
        procesoId: string,
        payload: SaveCompetenciesIncrementalPayload,
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const body: Record<string, unknown> = { origen: payload.origen };

                if (payload.origen === 'desde_cargos') {
                    body.participante_ids = payload.participante_ids ?? [];
                } else {
                    body.agregar = payload.agregar ?? [];
                    body.eliminar = payload.eliminar ?? [];
                    body.actualizar = payload.actualizar ?? [];
                    body.pesos = payload.pesos ?? {};
                }

                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/competencies`,
                    method: 'PATCH',
                    body,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al guardar las competencias');
                }
                return response;
            })()
        );
    };

    /**
     * Consulta los participantes asignados al proceso de manera paginada y filtrable.
     */
    const getProcessParticipants = async (
        procesoId: string,
        params?: ProcessParticipantsQueryParams
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const backendParams: Record<string, string | number | undefined> = {};
                if (params?.pagina) backendParams.pagina = params.pagina;
                if (params?.limite) backendParams.limite = params.limite;
                if (params?.busqueda) backendParams.busqueda = params.busqueda;
                if (params?.unidad_organizacional_id) backendParams.unidad_organizacional_id = params.unidad_organizacional_id;
                if (params?.cargo_id) backendParams.cargo_id = params.cargo_id;
                if (params?.ordenar_por) backendParams.ordenar_por = params.ordenar_por;
                if (params?.orden) backendParams.orden = params.orden;

                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/participants`,
                    params: backendParams,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener los participantes');
                }

                if (response?.success && response.data) {
                    const datos: ProcessParticipantRow[] = response.data.datos ?? response.data.participantes ?? [];
                    const paginacion: Pagination = response.data.paginacion ?? {
                        total: datos.length,
                        pagina: params?.pagina ?? 1,
                        limite: params?.limite ?? 20,
                        total_paginas: 1,
                    };
                    return { ...response, data: { datos, paginacion } };
                }

                return response;
            })()
        );
    };

    /**
     * Actualiza incrementalmente participantes y evaluadores de un proceso (PATCH).
     */
    const saveParticipants = async (
        procesoId: string,
        payload: SaveParticipantsPayload,
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/participants`,
                    method: 'PATCH',
                    body: {
                        agregar: payload.agregar ?? [],
                        retirar: payload.retirar ?? [],
                        evaluadores_por_colaborador: payload.evaluadores_por_colaborador ?? {},
                    },
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al guardar los participantes');
                }
                return response;
            })()
        );
    };

    /**
     * Genera (o regenera) las asignaciones de evaluadores para cada participante.
     */
    const generateAsignaciones = async (procesoId: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/generate-assignments`,
                    method: 'POST',
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al generar las asignaciones');
                }
                return response;
            })()
        );
    };

    /**
     * Calcula en el backend las competencias sugeridas derivadas de los cargos.
     * Si se omiten `colaboradorIds`, usa todos los participantes activos del proceso.
     */
    const getCompetenciasSugeridas = async (
        procesoId: string,
        colaboradorIds?: string[],
        pagina?: number,
        limite?: number
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const body: Record<string, unknown> = {};
                if (colaboradorIds && colaboradorIds.length > 0) {
                    body.colaborador_ids = colaboradorIds;
                }
                body.pagina = pagina ?? 1;
                body.limite = limite ?? 100;

                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/suggested-competencies`,
                    method: 'POST',
                    body,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al calcular las competencias sugeridas');
                }
                return response;
            })()
        );
    };

    /**
     * Consulta las plantillas de correo vinculadas al proceso.
     */
    const getProcessEmails = async (procesoId: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/emails`,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener los correos del proceso');
                }
                return response;
            })()
        );
    };

    /**
     * Guarda las plantillas de correo vinculadas al proceso.
     */
    const saveProcessEmails = async (
        procesoId: string,
        payload: SaveEmailsPayload
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/emails`,
                    method: 'PUT',
                    body: { plantillas_correo_ids: payload.plantillas_correo_ids },
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al guardar las plantillas de correo');
                }
                return response;
            })()
        );
    };

    // ── Ejecución: transiciones y respuestas del evaluador (§9.3/§9.4) ───────

    /**
     * `PATCH /assignments/:asignacionId/start` (§9.3) — pasa la asignación a EN_PROGRESO.
     * Desde COMPLETADO/EN_REVISION el backend lo interpreta como corrección (requiere
     * `config.correccion.permitir`; puede devolver 403).
     * Devuelve `data.asignacion` con el item actualizado.
     */
    const startAssignment = async (asignacionId: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/assignments/${asignacionId}/start`,
                    method: 'PATCH',
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'No se pudo iniciar la asignación');
                }
                if (response?.success && response.data) {
                    return { ...response, data: { asignacion: response.data } };
                }
                return response;
            })()
        );
    };

    /**
     * `POST /responses` (§9.3) — upsert 1:1 por `asignacion_id`.
     * El backend calcula puntajes y transiciona la asignación (COMPLETADO o EN_REVISION).
     * Devuelve `data.respuesta`.
     */
    const saveResponse = async (
        payload: SaveEvaluationResponsePayload
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/responses`,
                    method: 'POST',
                    body: payload as unknown as Record<string, unknown>,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al guardar la respuesta');
                }
                if (response?.success && response.data) {
                    return { ...response, data: { respuesta: response.data } };
                }
                return response;
            })()
        );
    };

    /**
     * `GET /responses?asignacion_id=...` (§9.4) — respuesta exacta de una asignación.
     * Devuelve `data.respuesta` (null si aún no existe).
     */
    const getResponseByAssignment = async (
        asignacionId: string
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/responses`,
                    params: { asignacion_id: asignacionId, limite: 1 },
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al consultar la respuesta');
                }
                if (response?.success && response.data) {
                    const datos: EvaluationResponseItem[] = response.data.datos ?? [];
                    return { ...response, data: { respuesta: datos[0] ?? null } };
                }
                return response;
            })()
        );
    };

    // ── Revisión / Calibración RRHH (§9.1 admin, §9.5) y resultados (§10) ────

    /**
     * `GET /assignments` (§9.1) — cola de revisión para RRHH.
     * A diferencia de `my-assignments`, no devuelve `resumen`; si el usuario no
     * tiene `EVALUACIONES:VER_TODAS`, el backend la auto-scopa al usuario.
     * Devuelve `data.asignaciones` + `data.paginacion`.
     */
    const getAssignments = async (
        params?: AssignmentsQueryParams
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const backendParams: Record<string, string | number | undefined> = {};
                if (params?.proceso_id) backendParams.proceso_id = params.proceso_id;
                if (params?.colaborador_id) backendParams.colaborador_id = params.colaborador_id;
                if (params?.estado) backendParams.estado = params.estado;
                if (params?.tipo) backendParams.tipo = params.tipo;
                if (params?.pagina) backendParams.pagina = params.pagina;
                if (params?.limite) backendParams.limite = params.limite;

                const response = (await fetchData({
                    url: `${BASE_URL}/assignments`,
                    params: Object.keys(backendParams).length > 0 ? backendParams : undefined,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener las asignaciones');
                }
                if (response?.success && response.data) {
                    return {
                        ...response,
                        data: {
                            asignaciones: (response.data.datos ?? []) as CompetencyAssignment[],
                            paginacion: (response.data.paginacion ?? null) as Pagination | null,
                        },
                    };
                }
                return response;
            })()
        );
    };

    /**
     * Ejecuta una acción de calibración de RRHH (§9.5) sobre una asignación:
     * `approve` → APROBADO · `calibrate` → permanece EN_REVISION · `return` → DEVUELTO.
     * Requiere `EVALUACIONES:EDITAR` + `EVALUACIONES:VER_TODAS` y las políticas de config.
     * Devuelve `data` tal cual (`{ id, estado }`).
     */
    const executeCalibracion = async (
        asignacionId: string,
        accion: AccionCalibracion,
        payload: CalibrationPayload
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/assignments/${asignacionId}/${accion}`,
                    method: 'PATCH',
                    body: payload as unknown as Record<string, unknown>,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'No se pudo ejecutar la acción');
                }
                return response;
            })()
        );
    };

    /**
     * `GET /:procesoId/collaborators/:colaboradorId/competency-levels` (§10) —
     * consolidado ponderado por competencia (sólo asignaciones COMPLETADO/APROBADO)
     * y brecha frente al nivel esperado del cargo activo.
     * Devuelve `data.niveles_competencia` + `data.brechas`.
     */
    const getCompetencyLevels = async (
        procesoId: string,
        colaboradorId: string
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/collaborators/${colaboradorId}/competency-levels`,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener los niveles consolidados');
                }
                if (response?.success && response.data) {
                    return {
                        ...response,
                        data: {
                            niveles_competencia: (response.data.niveles_competencia ?? []) as CompetencyLevelItem[],
                            brechas: (response.data.brechas ?? {}) as Record<string, number>,
                        },
                    };
                }
                return response;
            })()
        );
    };

    /**
     * `GET /:procesoId/review-summary` (§9.6) — vista de revisión RRHH agrupada
     * por `agrupar_por` ('colaborador' | 'evaluador'), con contadores globales en `resumen`.
     * Vista exclusiva RRHH (403 sin `EVALUACIONES:VER_TODAS`).
     * Devuelve `data.resumen` + `data.grupos` + `data.paginacion` (paginación sobre grupos).
     */
    const getReviewSummary = async (
        procesoId: string,
        params?: ReviewSummaryParams
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const backendParams: Record<string, string | number | undefined> = {};
                if (params?.agrupar_por) backendParams.agrupar_por = params.agrupar_por;
                if (params?.busqueda) backendParams.busqueda = params.busqueda;
                if (params?.estado) backendParams.estado = params.estado;
                if (params?.pagina) backendParams.pagina = params.pagina;
                if (params?.limite) backendParams.limite = params.limite;

                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/review-summary`,
                    params: Object.keys(backendParams).length > 0 ? backendParams : undefined,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener el resumen de revisión');
                }
                if (response?.success && response.data) {
                    return {
                        ...response,
                        data: {
                            resumen: (response.data.resumen ?? null) as ReviewSummaryResumen | null,
                            grupos: (response.data.data?.datos ?? response.data.datos ?? []) as ReviewSummaryGroup[],
                            paginacion: (response.data.data?.paginacion ?? response.data.paginacion ?? null) as Pagination | null,
                        },
                    };
                }
                return response;
            })()
        );
    };

    /**
     * `GET /:procesoId/assignments-detail` (§9.7, variante scoped) — lista plana,
     * ordenable y paginada de asignaciones con el detalle por competencia
     * (nivel original / calibrado / vigente) y comentarios.
     * Vista exclusiva RRHH (403 sin `EVALUACIONES:VER_TODAS`).
     * Devuelve `data.datos` + `data.paginacion`.
     */
    const getAssignmentsDetail = async (
        procesoId: string,
        params?: AssignmentsDetailParams
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const backendParams: Record<string, string | number | undefined> = {};
                if (params?.asignacion_id) backendParams.asignacion_id = params.asignacion_id;
                if (params?.colaborador_id) backendParams.colaborador_id = params.colaborador_id;
                if (params?.evaluador_id) backendParams.evaluador_id = params.evaluador_id;
                if (params?.estado) backendParams.estado = params.estado;
                if (params?.tipo) backendParams.tipo = params.tipo;
                if (params?.busqueda) backendParams.busqueda = params.busqueda;
                if (params?.ordenar_por) backendParams.ordenar_por = params.ordenar_por;
                if (params?.orden) backendParams.orden = params.orden;
                if (params?.pagina) backendParams.pagina = params.pagina;
                if (params?.limite) backendParams.limite = params.limite;

                const response = (await fetchData({
                    url: `${BASE_URL}/${procesoId}/assignments-detail`,
                    params: Object.keys(backendParams).length > 0 ? backendParams : undefined,
                    token: token || null,
                })) as FetchResponse | null;

                if (response?.success === false) {
                    throw new Error(response.message || 'Error al obtener el detalle de asignaciones');
                }
                if (response?.success && response.data) {
                    return {
                        ...response,
                        data: {
                            datos: (response.data.datos ?? []) as AssignmentDetailItem[],
                            paginacion: (response.data.paginacion ?? null) as Pagination | null,
                        },
                    };
                }
                return response;
            })()
        );
    };

    /**
     * Detalle de una ÚNICA asignación vía §9.7 (`?asignacion_id=`, variante scoped).
     * Devuelve `data.detalle` (null si no existe).
     */
    const getAssignmentDetail = async (
        procesoId: string,
        asignacionId: string
    ): Promise<FetchResponse | null> => {
        const res = await getAssignmentsDetail(procesoId, {
            asignacion_id: asignacionId,
            limite: 1,
        });
        if (res?.success && res.data) {
            const datos = (res.data.datos ?? []) as AssignmentDetailItem[];
            return { ...res, data: { detalle: datos[0] ?? null } };
        }
        return res;
    };

    return {
        getCompetencyEvaluations,
        getMyAssignments,
        getCompetencyEvaluationDetail,
        getCompetencyEvaluationForPerson,
        getCompetencyEvaluationStats,
        createCompetencyEvaluation,
        updateCompetencyEvaluation,
        deleteCompetencyEvaluation,
        cloneCompetencyEvaluation,
        updateEstadoProceso,
        getConfig,
        saveConfig,
        getProcessCompetencies,
        saveCompetencies,
        getProcessParticipants,
        saveParticipants,
        generateAsignaciones,
        getCompetenciasSugeridas,
        getProcessEmails,
        saveProcessEmails,
        startAssignment,
        saveResponse,
        getResponseByAssignment,
        getAssignments,
        executeCalibracion,
        getCompetencyLevels,
        getReviewSummary,
        getAssignmentsDetail,
        getAssignmentDetail,
    };
};
