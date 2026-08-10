import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';
import { getCompetenciesScalesMap } from './competencyService';

// ─── Helper function for normalized score calculation ────────────────────

/**
 * Calculate normalized score (0-100) based on actual competency scales.
 * For each competency, calculates (score / scale) * 100, then averages all.
 * Scales are retrieved dynamically from competencyService to always use current data.
 */
export const calculateNormalizedScore = (
    competenciasEvaluadas: Record<string, number>
): number | undefined => {
    const competencyIds = Object.keys(competenciasEvaluadas);
    if (competencyIds.length === 0) return undefined;

    // Get fresh scales from master data (no hook dependencies)
    const scalesMap = getCompetenciesScalesMap();

    let totalNormalized = 0;
    let countValid = 0;

    for (const competencyId of competencyIds) {
        const score = competenciasEvaluadas[competencyId];
        const scale = scalesMap[competencyId] || 5; // Default to 5 if competency not found

        if (score !== undefined && score !== null && !isNaN(score)) {
            // Normalize: (score / scale) * 100
            const normalized = (score / scale) * 100;
            totalNormalized += normalized;
            countValid++;
        }
    }

    if (countValid === 0) return undefined;

    // Return average of all normalized scores (0-100)
    return totalNormalized / countValid;
};

/**
 * Calculate average score directly (without percentage conversion).
 * Returns the arithmetic mean of all competency scores.
 * E.g., if evaluating competencies on scale 1-4 with scores [3, 4, 3.5],
 * returns 3.5 (not the normalized percentage).
 */
export const calculateAverageScore = (
    competenciasEvaluadas: Record<string, number>
): number | undefined => {
    const scores = Object.values(competenciasEvaluadas).filter(
        (score) => score !== undefined && score !== null && !isNaN(score)
    );

    if (scores.length === 0) return undefined;

    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
};

/**
 * Detect the maximum scale used from the competencies evaluated.
 * Returns the maximum scale value (e.g., 4 for 1-4 scale, 5 for 1-5 scale).
 */
export const detectMaxScale = (
    competenciasEvaluadas: Record<string, number>
): number => {
    const scalesMap = getCompetenciesScalesMap();
    const scales = Object.keys(competenciasEvaluadas)
        .map(competencyId => scalesMap[competencyId] || 5)
        .filter(scale => scale > 0);
    
    return scales.length > 0 ? Math.max(...scales) : 5;
};

// ─── Types ────────────────────────────────────────────────────────────────────


export interface CompetencyScore {
    [competencyId: string]: number;
}

export interface EvaluationComments {
    text?: string;
    video?: {
        url: string;
        blob?: Blob;
        duration: number;
        recordedAt: Date;
    };
}

export interface EvaluationResponse {
    id: string;
    evaluador_id: string;
    proceso_id: string;
    persona_id: string;
    competencias_evaluadas: CompetencyScore; // Map of competency_id -> score (1-5)
    comentarios: EvaluationComments;
    estado: 'EN_PROGRESO' | 'COMPLETADO';
    fecha_creacion: string;
    fecha_actualizacion: string;
    completado_en?: string; // ISO timestamp when evaluation was finalized
    puntaje_normalizado?: number; // Normalized score (0-100) for display as percentage
    puntaje_numerico?: number; // Average score (e.g., 3.5 for 1-4 scale) for integral calculations
    escala_maxima?: number; // Maximum scale used (e.g., 4 for 1-4 scale, 5 for 1-5 scale)
    /**
     * ID de la asignación (EvaluatorAssignment) a la que pertenece esta respuesta.
     * Vincula la respuesta con el flujo de estados (PENDIENTE/EN_PROGRESO/COMPLETADO/...).
     */
    asignacion_id?: string;
}

export interface EvaluationResponseQueryParams {
    evaluador_id?: string;
    proceso_id?: string;
    persona_id?: string;
    pagina?: number;
    items_por_pagina?: number;
}

// ─── Mock database (GLOBAL - shared between all hook instances) ──────────────

interface EvaluationResponseDB extends EvaluationResponse {}

// IMPORTANT: This is initialized outside the hook to be shared globally
// across all instances of useEvaluationResponseService
const GLOBAL_EVALUATION_RESPONSES_DB: EvaluationResponseDB[] = [];

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useEvaluationResponseService = () => {
    const { fetchData } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // Reference to global DB for this instance
    const getDB = () => GLOBAL_EVALUATION_RESPONSES_DB;
    const updateDB = (newDB: EvaluationResponseDB[]) => {
        GLOBAL_EVALUATION_RESPONSES_DB.length = 0;
        GLOBAL_EVALUATION_RESPONSES_DB.push(...newDB);
    };

    // ── GET list ──────────────────────────────────────────────────────────────

    const getEvaluationResponses = async (
        params?: EvaluationResponseQueryParams
    ): Promise<FetchResponse | null> => {
        try {
            //console.log('getEvaluationResponses called with params:', params);
            //console.log('Current DB:', getDB());
            
            let filtered = [...getDB()];

            // Filters
            if (params?.evaluador_id) {
                filtered = filtered.filter((r) => r.evaluador_id === params.evaluador_id);
            }
            if (params?.proceso_id) {
                filtered = filtered.filter((r) => r.proceso_id === params.proceso_id);
            }
            if (params?.persona_id) {
                filtered = filtered.filter((r) => r.persona_id === params.persona_id);
            }

            //console.log('Filtered responses:', filtered);

            // Pagination
            const page = params?.pagina ?? 1;
            const pageSize = params?.items_por_pagina ?? 10;
            const totalItems = filtered.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const start = (page - 1) * pageSize;
            const paginated = filtered.slice(start, start + pageSize);

            const response = (await fetchData({
                url: '/api/evaluation-responses',
                params: params as any,
                mockData: successMock({
                    respuestas: paginated,
                    paginacion: {
                        pagina_actual: page,
                        items_por_pagina: pageSize,
                        total_items: totalItems,
                        total_paginas: totalPages,
                    },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las respuestas');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET by ID ─────────────────────────────────────────────────────────────

    const getEvaluationResponse = async (id: string): Promise<FetchResponse | null> => {
        try {
            const response_data = getDB().find((r) => r.id === id);
            if (!response_data) {
                throw new Error('Respuesta no encontrada');
            }

            const response = (await fetchData({
                url: `/api/evaluation-responses/${id}`,
                mockData: successMock({ respuesta: response_data }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la respuesta');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET by evaluator, process, and person ──────────────────────────────────

    const getEvaluationResponseByKey = async (
        evaluadorId: string,
        procesoId: string,
        personaId: string
    ): Promise<FetchResponse | null> => {
        try {
            //console.log('getEvaluationResponseByKey called with:', { evaluadorId, procesoId, personaId });
            //console.log('Current DB:', getDB());
            
            const response_data = getDB().find(
                (r) =>
                    r.evaluador_id === evaluadorId &&
                    r.proceso_id === procesoId &&
                    r.persona_id === personaId
            );

            // console.log('Found response in DB:', response_data);

            // Use fetchData with mockData for consistency
            const response = (await fetchData({
                url: `/api/evaluation-responses/find`,
                params: { evaluador_id: evaluadorId, proceso_id: procesoId, persona_id: personaId },
                mockData: successMock({ respuesta: response_data || null }),
            })) as FetchResponse | null;

            //console.log('fetchData response:', response);

            return response;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    // ── CREATE or UPDATE ──────────────────────────────────────────────────────

    const saveEvaluationResponse = async (
        data: Omit<EvaluationResponse, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
    ): Promise<FetchResponse | null> => {
        try {
            //console.log('saveEvaluationResponse called with:', data);
            
            // Check if already exists
            const existing = getDB().find(
                (r) =>
                    r.evaluador_id === data.evaluador_id &&
                    r.proceso_id === data.proceso_id &&
                    r.persona_id === data.persona_id
            );

            let saved: EvaluationResponseDB;
            const now = new Date().toISOString();

            // Calculate both normalized score (0-100%) and average score for integral
            const puntaje_normalizado = calculateNormalizedScore(data.competencias_evaluadas);
            const puntaje_numerico = calculateAverageScore(data.competencias_evaluadas);
            const escala_maxima = detectMaxScale(data.competencias_evaluadas);

            if (existing) {
                // UPDATE
                saved = {
                    ...existing,
                    ...data,
                    fecha_actualizacion: now,
                    puntaje_normalizado, // Normalized percentage for display
                    puntaje_numerico,    // Average score for integral calculations
                    escala_maxima,       // Maximum scale used
                    completado_en: data.estado === 'COMPLETADO' ? now : existing.completado_en,
                };
                //console.log('Updating existing response:', saved);
                updateDB(getDB().map((r) => (r.id === existing.id ? saved : r)));
            } else {
                // CREATE
                saved = {
                    ...data,
                    id: `evr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    fecha_creacion: now,
                    fecha_actualizacion: now,
                    puntaje_normalizado, // Normalized percentage for display
                    puntaje_numerico,    // Average score for integral calculations
                    escala_maxima,       // Maximum scale used
                    completado_en: data.estado === 'COMPLETADO' ? now : undefined,
                };
                //console.log('Creating new response:', saved);
                updateDB([...getDB(), saved]);
            }

            //console.log('Global DB after save:', getDB());

            const response = (await fetchData({
                url: '/api/evaluation-responses',
                method: existing ? 'PUT' : 'POST',
                body: data,
                mockData: successMock({ respuesta: saved }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al guardar la respuesta');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    const deleteEvaluationResponse = async (id: string): Promise<boolean> => {
        try {
            updateDB(getDB().filter((r) => r.id !== id));

            const response = (await fetchData({
                url: `/api/evaluation-responses/${id}`,
                method: 'DELETE',
                mockData: successMock({ message: 'Respuesta eliminada' }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar la respuesta');
            }

            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    // ── Check if person is evaluated by evaluator in a process ────────────────

    const isPersonEvaluated = async (
        evaluadorId: string,
        procesoId: string,
        personaId: string
    ): Promise<boolean> => {
        const response_data = getDB().find(
            (r) =>
                r.evaluador_id === evaluadorId &&
                r.proceso_id === procesoId &&
                r.persona_id === personaId &&
                r.estado === 'COMPLETADO'
        );
        return !!response_data;
    };

    // ── Get evaluation by process and person ────────────────────────────────

    const getEvaluationByProcessAndPerson = (
        procesoId: string,
        personaId: string
    ): EvaluationResponse | undefined => {
        return getDB().find(
            (r) => r.proceso_id === procesoId && r.persona_id === personaId && r.estado === 'COMPLETADO'
        );
    };

    // ── Get evaluation by assignment id ─────────────────────────────────────

    const getEvaluationByAsignacion = (asignacionId: string): EvaluationResponse | undefined => {
        return getDB().find((r) => r.asignacion_id === asignacionId);
    };

    return {
        getEvaluationResponses,
        getEvaluationResponse,
        getEvaluationResponseByKey,
        saveEvaluationResponse,
        deleteEvaluationResponse,
        isPersonEvaluated,
        getEvaluationByProcessAndPerson,
        getEvaluationByAsignacion,
    };
};
