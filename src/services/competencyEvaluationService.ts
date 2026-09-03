import useFetch from '../hooks/useFetch';
import { FetchResponse, Pagination } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { CompetencyEvaluationConfig } from './evaluationAssignmentService';
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

    return {
        getCompetencyEvaluations,
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
    };
};
