import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';
import { MOCK_EVALUATION_PROCESSES } from './evaluationDataService';
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
}

// ─── Mock data ────────────────────────────────────────────────────────────────

interface CompetencyEvaluationDB extends CompetencyEvaluationDetail {}

let _db: CompetencyEvaluationDB[] = MOCK_EVALUATION_PROCESSES;

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useCompetencyEvaluationService = () => {
    const { fetchData } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // ── GET list ──────────────────────────────────────────────────────────────

    const getCompetencyEvaluations = async (
        params?: CompetencyEvaluationQueryParams
    ): Promise<FetchResponse | null> => {
        try {
            let filtered = [..._db];

            // Filters
            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(
                    (e) =>
                        e.nombre.toLowerCase().includes(q) ||
                        e.descripcion?.toLowerCase().includes(q)
                );
            }
            if (params?.estado) filtered = filtered.filter((e) => e.estado === params.estado);

            // Sorting
            if (params?.orden_por) {
                filtered.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] ?? '';
                    const bVal = (b as any)[params.orden_por!] ?? '';
                    const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                    return params.orden === 'desc' ? -cmp : cmp;
                });
            }

            // Pagination
            const page = params?.pagina ?? 1;
            const pageSize = params?.items_por_pagina ?? 10;
            const totalItems = filtered.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const start = (page - 1) * pageSize;
            const paginated = filtered.slice(start, start + pageSize);

            const response = (await fetchData({
                url: '/api/competency-evaluations',
                params: params as any,
                mockData: successMock({
                    evaluaciones: paginated,
                    paginacion: {
                        pagina_actual: page,
                        items_por_pagina: pageSize,
                        total_items: totalItems,
                        total_paginas: totalPages,
                    },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las evaluaciones de competencias');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET detail ────────────────────────────────────────────────────────────

    const getCompetencyEvaluationDetail = async (id: string): Promise<FetchResponse | null> => {
        try {
            const evaluation = _db.find((e) => e.id === id);
            if (!evaluation) throw new Error('Evaluación no encontrada');

            const response = (await fetchData({
                url: `/api/competency-evaluations/${id}`,
                mockData: successMock({ evaluacion: evaluation }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la evaluación');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET evaluation for person ─────────────────────────────────────────────

    /**
     * Search for a competency evaluation that has the given person assigned
     * Returns the first evaluation where persona_id is in personas_a_evaluar
     */
    const getCompetencyEvaluationForPerson = async (personaId: string): Promise<FetchResponse | null> => {
        try {
            const evaluation = _db.find((e) => 
                e.personas_a_evaluar && e.personas_a_evaluar.includes(personaId)
            );

            const response = (await fetchData({
                url: `/api/competency-evaluations/person/${personaId}`,
                mockData: evaluation
                    ? successMock({ evaluacion: evaluation })
                    : successMock({ evaluacion: null }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al buscar evaluación de competencias');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET stats ─────────────────────────────────────────────────────────────

    const getCompetencyEvaluationStats = async (): Promise<FetchResponse | null> => {
        try {
            const stats = {
                total: _db.length,
                publicadas: _db.filter((e) => e.estado === 'PUBLICADO').length,
                borradores: _db.filter((e) => e.estado === 'BORRADOR').length,
                total_evaluaciones: _db.reduce((s, e) => s + e.total_evaluaciones, 0),
            };

            const response = (await fetchData({
                url: '/api/competency-evaluations/stats',
                mockData: successMock({ stats }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las estadísticas');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── CREATE ────────────────────────────────────────────────────────────────

    const createCompetencyEvaluation = async (
        data: Omit<CompetencyEvaluationSummary, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'total_evaluaciones'>
    ): Promise<FetchResponse | null> => {
        try {
            const newEvaluation: CompetencyEvaluationDB = {
                ...data,
                id: `ceval-${Math.random().toString(36).slice(2, 9)}`,
                total_evaluaciones: 0,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString(),
                competencias_asignadas: [],
                personas_a_evaluar: [],
                evaluadores_asignados: [],
            };

            _db = [..._db, newEvaluation];

            const response = (await fetchData({
                url: '/api/competency-evaluations',
                method: 'POST',
                body: data,
                mockData: successMock({ evaluacion: newEvaluation }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear la evaluación');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── UPDATE ────────────────────────────────────────────────────────────────

    const updateCompetencyEvaluation = async (
        id: string,
        data: Partial<CompetencyEvaluationDetail>
    ): Promise<FetchResponse | null> => {
        try {
            _db = _db.map((e) =>
                e.id === id ? { ...e, ...data, fecha_actualizacion: new Date().toISOString() } : e
            );

            const response = (await fetchData({
                url: `/api/competency-evaluations/${id}`,
                method: 'PUT',
                body: data,
                mockData: successMock({
                    evaluacion: { ...data, id, fecha_actualizacion: new Date().toISOString() },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar la evaluación');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    const deleteCompetencyEvaluation = async (id: string): Promise<boolean> => {
        try {
            _db = _db.filter((e) => e.id !== id);

            const response = (await fetchData({
                url: `/api/competency-evaluations/${id}`,
                method: 'DELETE',
                mockData: successMock({ message: 'Evaluación eliminada' }),
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
        try {
            const sourceEval = _db.find((e) => e.id === id);
            if (!sourceEval) throw new Error('Evaluación no encontrada');

            const clonedEval: CompetencyEvaluationDB = {
                ...sourceEval,
                id: `ceval-${Math.random().toString(36).slice(2, 9)}`,
                nombre: `${sourceEval.nombre} (Copia)`,
                estado: 'BORRADOR',
                total_evaluaciones: 0,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString(),
            };

            _db = [..._db, clonedEval];

            const response = (await fetchData({
                url: `/api/competency-evaluations/${id}/clone`,
                method: 'POST',
                mockData: successMock({ evaluacion: clonedEval }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al clonar la evaluación');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
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
        try {
            _db = _db.map((e) =>
                e.id === id
                    ? { ...e, estado_flujo: estadoFlujo, fecha_actualizacion: new Date().toISOString() }
                    : e
            );

            const response = (await fetchData({
                url: `/api/competency-evaluations/${id}/estado`,
                method: 'PATCH',
                body: { estado_flujo: estadoFlujo },
                mockData: successMock({ evaluacion: { id, estado_flujo: estadoFlujo } }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar estado del proceso');
            }
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
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
    };
};
