import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { CompetencyEvaluationConfig } from './evaluationAssignmentService';

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
    orden?: string;
    orden_por?: string;
    search?: string;
    estado?: CompetencyEvaluationStatus;
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
    /** Estado extendido del flujo de competencias (nuevo flujo). */
    estado_flujo?: EstadoProcesoCompetencia;
    /** Configuración del proceso (tipos de evaluación, calibración, corrección). */
    config?: CompetencyEvaluationConfig;
    /** Origen de las competencias asignadas: 'manual' | 'desde_cargos'. */
    origen_competencias?: 'manual' | 'desde_cargos';
    /** Pesos por competencia (mapa competencia_id → peso). */
    weights?: Record<string, number>;
    /** Plantillas de correo asociadas. */
    templates_asociadas?: string[];
    /** Mapa persona/colaborador_id → evaluadores tipo OTRO. */
    evaluadores_por_persona?: Record<string, string[]>;
    /** Detalle de las competencias asignadas (orden, sección, peso). */
    competencias?: {
        id: string;
        competencia_id: string;
        nombre: string;
        escala: number;
        orden: number;
        seccion?: string;
        peso: number;
    }[];
}

// ─── Payload helpers ──────────────────────────────────────────────────────────

export interface CompetenciaItemPayload {
    competencia_id: string;
    orden: number;
    seccion?: string;
    peso: number;
}

export interface SaveCompetenciesPayload {
    origen: 'manual' | 'desde_cargos';
    competencias: CompetenciaItemPayload[];
    weights?: Record<string, number>;
}

export interface SaveParticipantsPayload {
    colaborador_ids: string[];
    evaluadores_por_colaborador?: Record<string, string[]>;
}

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useCompetencyEvaluationService = () => {
    const { fetchData } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token } = useAuthStore();

    const BASE_URL = `${import.meta.env.VITE_API_URL}/competency-evaluations`;
    const EVAL_URL = `${import.meta.env.VITE_API_URL}/evaluations`;

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
                            evaluaciones: response.data.datos ?? [],
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
        competencias?: { competencia_id: string }[];
    };

    const mapDetail = (raw: RawDetail): CompetencyEvaluationDetail => {
        const competencias = raw.competencias ?? [];
        return {
            ...raw,
            personas_a_evaluar: raw.colaboradores_evaluados ?? raw.personas_a_evaluar ?? [],
            evaluadores_por_persona: raw.evaluadores_por_colaborador ?? raw.evaluadores_por_persona ?? {},
            competencias_asignadas:
                raw.competencias_asignadas ??
                competencias.map((c) => c.competencia_id) ??
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

    /**
     * Busca un proceso activo (PUBLICADO, EN_CALIFICACION, EN_REVISION) en el
     * que el colaborador participe. Retorna el primero encontrado o null.
     */
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
                    // El backend puede retornar las estadísticas planas ({total, ...})
                    // o ya envueltas en una clave `stats`. Normalizamos a {stats}.
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

    /**
     * Actualiza sólo el estado extendido del flujo (estado_flujo).
     * No toca los campos legacy (estado) salvo que se solicite.
     */
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

    // ── Guardado por secciones del proceso ─────────────────────────────────────

    /**
     * Reemplaza la configuración General del proceso (tipos de evaluación,
     * calibración RRHH, revisión obligatoria y política de corrección).
     */
    const saveConfig = async (
        procesoId: string,
        config: CompetencyEvaluationConfig,
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${EVAL_URL}/${procesoId}/config`,
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
     * Reemplaza completamente las competencias del proceso, sus pesos y el origen.
     */
    const saveCompetencies = async (
        procesoId: string,
        payload: SaveCompetenciesPayload,
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${EVAL_URL}/${procesoId}/competencies`,
                    method: 'PUT',
                    body: payload,
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
     * Reemplaza completamente los participantes y evaluadores adicionales (OTRO).
     * Requiere al menos un colaborador.
     */
    const saveParticipants = async (
        procesoId: string,
        payload: SaveParticipantsPayload,
    ): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${EVAL_URL}/${procesoId}/participants`,
                    method: 'PUT',
                    body: payload,
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
     * Destructiva: el backend resuelve AUTOEVALUACION y JEFE_DIRECTO.
     */
    const generateAsignaciones = async (procesoId: string): Promise<FetchResponse | null> => {
        return run(
            (async () => {
                const response = (await fetchData({
                    url: `${EVAL_URL}/${procesoId}/generar-asignaciones`,
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
        saveConfig,
        saveCompetencies,
        saveParticipants,
        generateAsignaciones,
    };
};
