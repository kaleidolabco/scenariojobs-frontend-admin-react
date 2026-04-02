import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock, errorMock } from './responseType';
import useUIStore from '../store/uiStore';

// ─── Status ───────────────────────────────────────────────────────────────────

export type IntegralEvaluationStatus = 'BORRADOR' | 'EN_PROGRESO' | 'COMPLETADA';

export const INTEGRAL_STATUS_LABELS: Record<IntegralEvaluationStatus, { label: string; color: string }> = {
    BORRADOR:    { label: 'Borrador',    color: 'ghost'   },
    EN_PROGRESO: { label: 'En progreso', color: 'warning' },
    COMPLETADA:  { label: 'Completada',  color: 'success' },
};

// ─── Component types ──────────────────────────────────────────────────────────

export interface IntegralComponente {
    evaluacion_id: string;
    peso:    number;
    puntaje?: number;
    /** Valor numérico 1-5 basado en el puntaje porcentual (<70%=1, 70-99%=2, 100%=3, 101-109%=4, >109%=5) */
    puntaje_numerico?: 1 | 2 | 3 | 4 | 5;
    estado:  IntegralEvaluationStatus;
}

// ─── Core type ────────────────────────────────────────────────────────────────

export interface EvaluacionIntegral {
    id:                    string;
    ciclo_id:              string;
    ciclo_nombre:          string;
    persona_id:            string;
    persona_nombre:        string;
    persona_departamento?: string;
    persona_puesto?:       string;
    componente_desempeno?:      IntegralComponente;
    componente_competencias?:   IntegralComponente;
    estado:              IntegralEvaluationStatus;
    puntaje_final?:      number;
    fecha_creacion:      string;
    fecha_completado?:   string;
    comentarios?:        string;
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface IntegralQueryParams {
    search?:           string;
    ciclo_id?:         string;
    estado?:           IntegralEvaluationStatus;
    persona_id?:       string;
    pagina?:           number;
    items_por_pagina?: number;
}

// ─── Create input ─────────────────────────────────────────────────────────────

export interface CreateIntegralInput {
    ciclo_id:              string;
    ciclo_nombre:          string;
    persona_id:            string;
    persona_nombre:        string;
    persona_departamento?: string;
    persona_puesto?:       string;
    componentes: {
        incluir_desempeno:      boolean;
        peso_desempeno?:        number;
        /** ID of a pre-created EmployeeEvaluation. If omitted a placeholder ID is generated. */
        desempeno_eval_id?:     string;
        incluir_competencias:   boolean;
        peso_competencias?:     number;
        /** ID of a pre-created CompetencyEvaluationDetail. If omitted a placeholder ID is generated. */
        competencias_eval_id?:  string;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte un puntaje porcentual a valor numérico 1-5 */
export const calcValorNumerico = (puntaje: number | undefined): 1 | 2 | 3 | 4 | 5 | undefined => {
    if (puntaje === undefined) return undefined;
    if (puntaje < 70) return 1;
    if (puntaje < 100) return 2;
    if (puntaje === 100) return 3;
    if (puntaje <= 109) return 4;
    return 5;
};

export const calcPuntajeIntegral = (
    componente_desempeno?:    IntegralComponente,
    componente_competencias?: IntegralComponente,
): number | undefined => {
    const activos = [componente_desempeno, componente_competencias]
        .filter((c): c is IntegralComponente => !!c && c.puntaje !== undefined);
    if (activos.length === 0) return undefined;
    const pesoTotalActivo = activos.reduce((s, c) => s + c.peso, 0);
    if (pesoTotalActivo === 0) return undefined;
    const suma = activos.reduce((s, c) => s + (c.puntaje! * c.peso) / 100, 0);
    return (suma * 100) / pesoTotalActivo;
};

export const deriveIntegralStatus = (
    componente_desempeno?:    IntegralComponente,
    componente_competencias?: IntegralComponente,
): IntegralEvaluationStatus => {
    const activos = [componente_desempeno, componente_competencias].filter(Boolean) as IntegralComponente[];
    if (activos.length === 0) return 'BORRADOR';
    if (activos.every((c) => c.estado === 'COMPLETADA')) return 'COMPLETADA';
    if (activos.some((c) => c.estado !== 'BORRADOR'))    return 'EN_PROGRESO';
    return 'BORRADOR';
};

export const integralBadgeColor = (score: number): string => {
    if (score >= 100) return 'success';
    if (score >= 80)  return 'info';
    if (score >= 60)  return 'warning';
    return 'error';
};

// ─── Mock data ────────────────────────────────────────────────────────────────

let _integrales: EvaluacionIntegral[] = [
    {
        id:                   'integ-1',
        ciclo_id:             'cyc-2',
        ciclo_nombre:         'Semestral H2 2025',
        persona_id:           'per_49',
        persona_nombre:       'Anderson Tangarife Ortiz',
        persona_departamento: 'Desarrollo Fullstack',
        persona_puesto:       'Lider Tecnico',
        estado:               'EN_PROGRESO',
        fecha_creacion:       '2025-07-10',
        componente_desempeno: {
            evaluacion_id: 'eval-1',
            peso:          60,
            puntaje:       undefined,
            estado:        'EN_PROGRESO',
        },
        componente_competencias: {
            evaluacion_id: 'eval_proc_001',
            peso:          40,
            puntaje:       undefined,
            estado:        'BORRADOR',
        },
    },
    {
        id:                   'integ-2',
        ciclo_id:             'cyc-2',
        ciclo_nombre:         'Semestral H2 2025',
        persona_id:           'per_38',
        persona_nombre:       'Ana Cristina Ocaña Guerrero',
        persona_departamento: 'Dirección Comercial',
        persona_puesto:       'Director Comercial',
        estado:               'BORRADOR',
        fecha_creacion:       '2025-07-12',
        componente_desempeno: {
            evaluacion_id: 'eval-2',
            peso:          100,
            puntaje:       undefined,
            estado:        'BORRADOR',
        },
    },
];

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useIntegralEvaluationService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // ── LIST ──────────────────────────────────────────────────────────────────

    const getIntegrales = async (params?: IntegralQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [..._integrales];
            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(
                    (i) => i.persona_nombre.toLowerCase().includes(q) || i.ciclo_nombre.toLowerCase().includes(q)
                );
            }
            if (params?.ciclo_id)   filtered = filtered.filter((i) => i.ciclo_id   === params.ciclo_id);
            if (params?.estado)     filtered = filtered.filter((i) => i.estado     === params.estado);
            if (params?.persona_id) filtered = filtered.filter((i) => i.persona_id === params.persona_id);

            const page      = params?.pagina           ?? 1;
            const pageSize  = params?.items_por_pagina ?? 10;
            const total     = filtered.length;
            const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

            return (await fetchData({
                url: '/api/integral-evaluations',
                mockData: successMock({
                    evaluaciones: paginated,
                    paginacion: {
                        pagina_actual:    page,
                        items_por_pagina: pageSize,
                        total_items:      total,
                        total_paginas:    Math.max(1, Math.ceil(total / pageSize)),
                    },
                }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET BY ID ─────────────────────────────────────────────────────────────

    const getIntegralById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const found = _integrales.find((i) => i.id === id);
            const mock  = found
                ? successMock({ evaluacion: found })
                : errorMock('Evaluación integral no encontrada');
            const res = (await fetchData({ url: `/api/integral-evaluations/${id}`, mockData: mock })) as FetchResponse | null;
            if (res?.success === false) throw new Error(res.message || 'Error');
            return res;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── CREATE ────────────────────────────────────────────────────────────────

    const createIntegral = async (input: CreateIntegralInput): Promise<FetchResponse | null> => {
        try {
            // Guard: one person per cycle
            if (_integrales.some((i) => i.ciclo_id === input.ciclo_id && i.persona_id === input.persona_id)) {
                throw new Error('Ya existe una evaluación integral para este colaborador en el ciclo seleccionado.');
            }

            const { componentes } = input;

            if (!componentes.incluir_desempeno && !componentes.incluir_competencias) {
                throw new Error('Debes incluir al menos un componente de evaluación.');
            }

            const pesoDesempeno    = componentes.incluir_desempeno    ? (componentes.peso_desempeno    ?? 0) : 0;
            const pesoCompetencias = componentes.incluir_competencias ? (componentes.peso_competencias ?? 0) : 0;
            if (pesoDesempeno + pesoCompetencias !== 100) {
                throw new Error(`Los pesos deben sumar 100%. Actualmente suman ${pesoDesempeno + pesoCompetencias}%.`);
            }

            // Use caller-provided IDs, or fall back to placeholder generation
            const desempenoEvalId    = componentes.incluir_desempeno
                ? (componentes.desempeno_eval_id    ?? `eval-${Math.random().toString(36).slice(2, 9)}`)
                : undefined;
            const competenciasEvalId = componentes.incluir_competencias
                ? (componentes.competencias_eval_id ?? `ceval-${Math.random().toString(36).slice(2, 9)}`)
                : undefined;

            const newIntegral: EvaluacionIntegral = {
                id:                   `integ-${Math.random().toString(36).slice(2, 9)}`,
                ciclo_id:             input.ciclo_id,
                ciclo_nombre:         input.ciclo_nombre,
                persona_id:           input.persona_id,
                persona_nombre:       input.persona_nombre,
                persona_departamento: input.persona_departamento,
                persona_puesto:       input.persona_puesto,
                estado:               'BORRADOR',
                fecha_creacion:       new Date().toISOString().split('T')[0],
                componente_desempeno: desempenoEvalId ? {
                    evaluacion_id: desempenoEvalId,
                    peso:          pesoDesempeno,
                    estado:        'BORRADOR',
                } : undefined,
                componente_competencias: competenciasEvalId ? {
                    evaluacion_id: competenciasEvalId,
                    peso:          pesoCompetencias,
                    estado:        'BORRADOR',
                } : undefined,
            };

            _integrales = [..._integrales, newIntegral];

            return (await fetchData({
                url: '/api/integral-evaluations',
                method: 'POST',
                body: input,
                mockData: successMock({ evaluacion: newIntegral }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── SYNC COMPONENT ────────────────────────────────────────────────────────

    const syncComponente = async (
        integralId: string,
        tipo: 'desempeno' | 'competencias',
        update: { estado: IntegralEvaluationStatus; puntaje?: number }
    ): Promise<FetchResponse | null> => {
        try {
            const integral = _integrales.find((i) => i.id === integralId);
            if (!integral) throw new Error('Evaluación integral no encontrada');

            const field   = tipo === 'desempeno' ? 'componente_desempeno' : 'componente_competencias';
            const current = integral[field];
            if (!current) throw new Error(`Componente ${tipo} no existe en esta evaluación.`);

            // Calcular puntaje_numerico automáticamente basado en puntaje
            const puntaje_numerico = update.puntaje !== undefined ? calcValorNumerico(update.puntaje) : current.puntaje_numerico;
            const updatedComponent: IntegralComponente = { ...current, ...update, puntaje_numerico };
            const updatedIntegral: EvaluacionIntegral = {
                ...integral,
                [field]: updatedComponent,
                estado: deriveIntegralStatus(
                    tipo === 'desempeno'    ? updatedComponent : integral.componente_desempeno,
                    tipo === 'competencias' ? updatedComponent : integral.componente_competencias,
                ),
                puntaje_final: calcPuntajeIntegral(
                    tipo === 'desempeno'    ? updatedComponent : integral.componente_desempeno,
                    tipo === 'competencias' ? updatedComponent : integral.componente_competencias,
                ),
            };

            _integrales = _integrales.map((i) => (i.id === integralId ? updatedIntegral : i));

            return (await fetchData({
                url:    `/api/integral-evaluations/${integralId}/sync-component`,
                method: 'PATCH',
                body:   { tipo, ...update },
                mockData: successMock({ evaluacion: updatedIntegral }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── UPDATE WEIGHTS ────────────────────────────────────────────────────────

    const updatePesos = async (
        id: string,
        pesos: { peso_desempeno?: number; peso_competencias?: number }
    ): Promise<FetchResponse | null> => {
        try {
            const integral = _integrales.find((i) => i.id === id);
            if (!integral) throw new Error('Evaluación integral no encontrada');

            const totalPeso =
                (pesos.peso_desempeno    ?? integral.componente_desempeno?.peso    ?? 0) +
                (pesos.peso_competencias ?? integral.componente_competencias?.peso ?? 0);

            if (totalPeso !== 100) {
                throw new Error(`Los pesos deben sumar 100%. Actualmente suman ${totalPeso}%.`);
            }

            const updated: EvaluacionIntegral = {
                ...integral,
                componente_desempeno: integral.componente_desempeno
                    ? { ...integral.componente_desempeno, peso: pesos.peso_desempeno ?? integral.componente_desempeno.peso }
                    : undefined,
                componente_competencias: integral.componente_competencias
                    ? { ...integral.componente_competencias, peso: pesos.peso_competencias ?? integral.componente_competencias.peso }
                    : undefined,
            };

            _integrales = _integrales.map((i) => (i.id === id ? updated : i));

            return (await fetchData({
                url:    `/api/integral-evaluations/${id}/weights`,
                method: 'PATCH',
                body:   pesos,
                mockData: successMock({ evaluacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── UPDATE COMMENTS ───────────────────────────────────────────────────────

    const updateComentarios = async (id: string, comentarios: string): Promise<FetchResponse | null> => {
        try {
            _integrales = _integrales.map((i) => (i.id === id ? { ...i, comentarios } : i));
            return (await fetchData({
                url:    `/api/integral-evaluations/${id}`,
                method: 'PATCH',
                body:   { comentarios },
                mockData: successMock({ ok: true }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    const deleteIntegral = async (id: string): Promise<boolean> => {
        try {
            _integrales = _integrales.filter((i) => i.id !== id);
            await fetchData({ url: `/api/integral-evaluations/${id}`, method: 'DELETE', mockData: successMock({}) });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    // ── STATS ─────────────────────────────────────────────────────────────────

    const getStats = async (): Promise<FetchResponse | null> => {
        try {
            const stats = {
                total:        _integrales.length,
                borrador:     _integrales.filter((i) => i.estado === 'BORRADOR').length,
                en_progreso:  _integrales.filter((i) => i.estado === 'EN_PROGRESO').length,
                completadas:  _integrales.filter((i) => i.estado === 'COMPLETADA').length,
                con_ambos:    _integrales.filter((i) => i.componente_desempeno && i.componente_competencias).length,
            };
            return (await fetchData({
                url: '/api/integral-evaluations/stats',
                mockData: successMock({ stats }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    return {
        getIntegrales,
        getIntegralById,
        createIntegral,
        syncComponente,
        updatePesos,
        updateComentarios,
        deleteIntegral,
        getStats,
        loading,
        error,
    };
};