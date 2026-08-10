/**
 * PATCH — performanceService.ts
 * Campos y métodos nuevos para el módulo "Evaluado".
 * Integrar en el archivo original.
 */

// ─── 1. Extender Objective ────────────────────────────────────────────────────
// Agregar dentro de la interfaz Objective (después de `evidencias?`):

export interface Objective /* extended */ {
    // … campos existentes …

    /** Autoevaluación cualitativa escrita por el propio colaborador */
    autoevaluacion_comentarios?: string;
    /** Archivos o URLs de evidencia cargados por el evaluado */
    evidencias_evaluado?: string[];
    /**
     * % de logro auto-declarado por el evaluado.
     * Visible para el evaluador como referencia, pero no afecta el puntaje final.
     */
    autocalificacion_evaluado?: number;
    /** true cuando el evaluado ya envió su autoevaluación de este objetivo */
    autoevaluacion_enviada?: boolean;
}

// ─── 2. Extender EmployeeEvaluation ──────────────────────────────────────────
// Agregar dentro de la interfaz EmployeeEvaluation:

export interface EmployeeEvaluation /* extended */ {
    // … campos existentes …

    /** Comentario general del colaborador sobre toda la evaluación */
    comentarios_generales_evaluado?: string;
    /**
     * Estado de la autoevaluación del evaluado:
     *   PENDIENTE   → no ha empezado
     *   EN_PROGRESO → guardó algún objetivo pero no envió
     *   ENVIADA     → marcó "enviar autoevaluación"
     */
    estado_autoevaluacion?: 'PENDIENTE' | 'EN_PROGRESO' | 'ENVIADA';
    /** Fecha en que el evaluado envió su autoevaluación */
    fecha_autoevaluacion?: string;
}

// ─── 3. Nuevos tipos ──────────────────────────────────────────────────────────

export type SelfEvaluationStatus = 'PENDIENTE' | 'EN_PROGRESO' | 'ENVIADA';

// ─── 4. Nuevos métodos del hook ───────────────────────────────────────────────
// Agregar al objeto retornado por usePerformanceService():

/*
// Devuelve las evaluaciones del colaborador actualmente autenticado.
// En producción se filtra por persona_id del token JWT.
const getMyEvaluations = async (): Promise<FetchResponse | null> => {
    try {
        // Mock: devuelve evaluaciones de la primera persona
        const myEvals = _evaluations.filter(e => e.persona_id === 'per_49');
        return (await fetchData({
            url: '/api/performance/my-evaluations',
            mockData: successMock({ evaluaciones: myEvals }),
        })) as FetchResponse | null;
    } catch (err) {
        openAlert(err instanceof Error ? err.message : String(err), 'error');
        return null;
    }
};

// Guarda la autoevaluación del evaluado (sin completar).
const saveSelfEvaluation = async (evaluation: EmployeeEvaluation): Promise<FetchResponse | null> => {
    try {
        const hasAny = evaluation.objetivos.some(
            o => o.autoevaluacion_comentarios || (o.evidencias_evaluado ?? []).length > 0
        );
        const updated: EmployeeEvaluation = {
            ...evaluation,
            estado_autoevaluacion: hasAny ? 'EN_PROGRESO' : 'PENDIENTE',
        };
        _evaluations = _evaluations.map(e => (e.id === updated.id ? updated : e));
        return (await fetchData({
            url: `/api/performance/my-evaluations/${evaluation.id}`,
            method: 'PUT',
            body: updated,
            mockData: successMock({ evaluacion: updated }),
        })) as FetchResponse | null;
    } catch (err) {
        openAlert(err instanceof Error ? err.message : String(err), 'error');
        return null;
    }
};

// Marca la autoevaluación como enviada (ya no editable).
const submitSelfEvaluation = async (id: string): Promise<FetchResponse | null> => {
    try {
        const found = _evaluations.find(e => e.id === id);
        if (!found) throw new Error('Evaluación no encontrada');
        const updated: EmployeeEvaluation = {
            ...found,
            estado_autoevaluacion: 'ENVIADA',
            fecha_autoevaluacion: new Date().toISOString().split('T')[0],
            objetivos: found.objetivos.map(o => ({ ...o, autoevaluacion_enviada: true })),
        };
        _evaluations = _evaluations.map(e => (e.id === id ? updated : e));
        return (await fetchData({
            url: `/api/performance/my-evaluations/${id}/submit`,
            method: 'POST',
            mockData: successMock({ evaluacion: updated }),
        })) as FetchResponse | null;
    } catch (err) {
        openAlert(err instanceof Error ? err.message : String(err), 'error');
        return null;
    }
};
*/

// ─── 5. Etiquetas de estado autoevaluación ────────────────────────────────────

export const SELF_EVAL_STATUS_LABELS: Record<SelfEvaluationStatus, { label: string; color: string }> = {
    PENDIENTE:   { label: 'Pendiente',    color: 'ghost'   },
    EN_PROGRESO: { label: 'En progreso',  color: 'warning' },
    ENVIADA:     { label: 'Enviada',      color: 'success' },
};
