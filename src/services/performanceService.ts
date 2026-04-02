import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock, errorMock } from './responseType';
import useUIStore from '../store/uiStore';

// ─── Enums / union types ──────────────────────────────────────────────────────

export type ObjectiveCategory =
    | 'TECNICO'
    | 'COMERCIAL'
    | 'OPERATIVO'
    | 'FINANCIERO'
    | 'ESTRATEGICO'
    | 'DESARROLLO';

export const OBJECTIVE_CATEGORY_LABELS: Record<ObjectiveCategory, string> = {
    TECNICO:     'Técnico',
    COMERCIAL:   'Comercial',
    OPERATIVO:   'Operativo',
    FINANCIERO:  'Financiero',
    ESTRATEGICO: 'Estratégico',
    DESARROLLO:  'Desarrollo',
};

export type ObjectiveTrend     = 'POSITIVA' | 'NEGATIVA';
export type ObjectiveFrequency = 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export const OBJECTIVE_FREQUENCY_LABELS: Record<ObjectiveFrequency, string> = {
    MENSUAL:    'Mensual',
    BIMESTRAL:  'Bimestral',
    TRIMESTRAL: 'Trimestral',
    SEMESTRAL:  'Semestral',
    ANUAL:      'Anual',
};

export type EvaluationCycleStatus    = 'BORRADOR' | 'ACTIVO' | 'CERRADO';
export type EmployeeEvaluationStatus = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';
export type SelfEvaluationStatus     = 'PENDIENTE' | 'EN_PROGRESO' | 'ENVIADA';

// ─── Evidencias ───────────────────────────────────────────────────────────────

export type EvidenciaTipo = 'LINK' | 'ARCHIVO' | 'REFERENCIA' | 'HITO';

export const EVIDENCIA_TIPO_LABELS: Record<EvidenciaTipo, string> = {
    LINK:       'Enlace',
    ARCHIVO:    'Archivo',
    REFERENCIA: 'Referencia',
    HITO:       'Hito',
};

export interface EvidenciaItem {
    id:             string;
    tipo:           EvidenciaTipo;
    titulo:         string;
    descripcion?:   string;
    /** URL externa (LINK) o ruta del archivo (ARCHIVO) */
    url?:           string;
    /** Fecha del hito o del documento — ISO date string */
    fecha?:         string;
    fecha_creacion: string;
}

// ─── Core types ───────────────────────────────────────────────────────────────

export interface ObjectiveBase {
    nombre:        string;
    descripcion?:  string;
    categoria:     ObjectiveCategory;
    indicador:     string;
    formula:       string;
    tendencia:     ObjectiveTrend;
    unidad_medida: string;
    frecuencia:    ObjectiveFrequency;
    peso:          number;
    meta:          number;
}

export interface Objective extends ObjectiveBase {
    id: string;
    resultado?:              number;
    calificacion_logro?:     number;
    nota?:                   1 | 2 | 3 | 4 | 5;
    comentarios_evaluador?:  string;
    /** Evidencias cargadas por el evaluador */
    evidencias_evaluador?:   EvidenciaItem[];
    /** Evidencias cargadas por el evaluado */
    evidencias_evaluado?:    EvidenciaItem[];
    /** Autoevaluación cualitativa del evaluado */
    autoevaluacion_comentarios?: string;
    /** % de logro auto-declarado por el evaluado */
    autocalificacion_evaluado?:  number;
    /** true cuando el evaluado envió su autoevaluación de este objetivo */
    autoevaluacion_enviada?:     boolean;
    /** Valor numérico de 1-5 basado en el porcentaje de logro (< 70%=1, 70-99%=2, 100%=3, 101-109%=4, >109%=5) */
    valor_logro_numerico?:   1 | 2 | 3 | 4 | 5;
}

export interface ObjectiveTemplate extends ObjectiveBase {
    id:             string;
    peso_sugerido?: number;
    tags?:          string[];
}

export interface EvaluationCycle {
    id:           string;
    nombre:       string;
    descripcion?: string;
    fecha_inicio: string;
    fecha_fin:    string;
    estado:       EvaluationCycleStatus;
    total_evaluaciones?:       number;
    evaluaciones_completadas?: number;
}

export interface EmployeeEvaluation {
    id:                    string;
    ciclo_id:              string;
    ciclo_nombre:          string;
    persona_id:            string;
    persona_nombre:        string;
    persona_departamento?: string;
    persona_puesto?:       string;
    estado:                EmployeeEvaluationStatus;
    objetivos:             Objective[];
    puntaje_final?:        number;
    /** Puntaje final numérico ponderado (calculado con valores_logro_numerico de cada objetivo) */
    puntaje_final_numerico?: number;
    fecha_creacion:        string;
    fecha_completado?:     string;
    comentarios_generales?:          string;
    comentarios_generales_evaluado?: string;
    estado_autoevaluacion?:          SelfEvaluationStatus;
    fecha_autoevaluacion?:           string;
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface CycleQueryParams {
    search?: string;
    estado?: EvaluationCycleStatus;
}

export interface EvaluationQueryParams {
    search?:           string;
    ciclo_id?:         string;
    estado?:           EmployeeEvaluationStatus;
    pagina?:           number;
    items_por_pagina?: number;
}

export interface TemplateQueryParams {
    search?:    string;
    categoria?: ObjectiveCategory;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const calcLogro = (obj: Pick<Objective, 'meta' | 'resultado' | 'tendencia'>): number | undefined => {
    if (obj.resultado === undefined || obj.resultado === null) return undefined;
    if (obj.meta === 0) return 0;
    return obj.tendencia === 'POSITIVA'
        ? (obj.resultado / obj.meta) * 100
        : (obj.meta / obj.resultado) * 100;
};

export const calcPuntajeFinal = (objetivos: Objective[]): number | undefined => {
    const conLogro = objetivos.filter(o => o.calificacion_logro !== undefined);
    if (conLogro.length === 0) return undefined;
    const suma      = conLogro.reduce((acc, o) => acc + (o.calificacion_logro! * o.peso) / 100, 0);
    const pesoTotal = conLogro.reduce((acc, o) => acc + o.peso, 0);
    return pesoTotal > 0 ? (suma * 100) / pesoTotal : 0;
};

/** Calcula el valor numérico (1-5) basado en el porcentaje de logro */
export const calcValorLogroNumerico = (porcentajeLogro: number | undefined): 1 | 2 | 3 | 4 | 5 | undefined => {
    if (porcentajeLogro === undefined || porcentajeLogro === null) return undefined;
    if (porcentajeLogro < 70) return 1;
    if (porcentajeLogro < 100) return 2;
    if (porcentajeLogro === 100) return 3;
    if (porcentajeLogro < 110) return 4;
    return 5;
};

/** Calcula el puntaje final numérico ponderado basado en los valores de logro numéricos */
/* export const calcPuntajeFinalNumerico = (objetivos: Objective[]): number | undefined => {
    const conValor = objetivos.filter(o => o.valor_logro_numerico !== undefined);
    if (conValor.length === 0) return undefined;
    const suma      = conValor.reduce((acc, o) => acc + (o.valor_logro_numerico! * o.peso) / 100, 0);
    const pesoTotal = conValor.reduce((acc, o) => acc + o.peso, 0);
    console.log("Puntaje Raw:", suma);
    return pesoTotal > 0 ? suma : undefined;
}; */
export const calcPuntajeFinalNumerico = (objetivos: Objective[]): number | undefined => {
    // 1. Filtramos objetivos que tengan un valor numérico asignado
    const conValor = objetivos.filter(o => o.valor_logro_numerico !== undefined);
    
    if (conValor.length === 0) return undefined;

    // 2. Calculamos la suma ponderada (Nota * Peso)
    // Nota: Eliminamos el espacio en 'sumaPonderada'
    const sumaPonderada = conValor.reduce((acc, o) => {
        return acc + (o.valor_logro_numerico! * o.peso);
    }, 0);

    // 3. Obtenemos la suma de los pesos de los objetivos procesados
    const pesoTotal = conValor.reduce((acc, o) => acc + o.peso, 0);

    // 4. Dividimos la suma ponderada por el peso total para normalizar el puntaje
    const puntajeNumerico = pesoTotal > 0 ? (sumaPonderada / pesoTotal) : 0;
    console.log("Puntaje Raw:", puntajeNumerico);
    return puntajeNumerico;
};

export const NOTA_LABELS: Record<number, string> = {
    1: 'Insuficiente',
    2: 'Regular',
    3: 'Satisfactorio',
    4: 'Destacado',
    5: 'Sobresaliente',
};

export const logroBadgeColor = (logro: number): string => {
    if (logro >= 100) return 'success';
    if (logro >= 80)  return 'info';
    if (logro >= 60)  return 'warning';
    return 'error';
};

export const SELF_EVAL_STATUS_LABELS: Record<SelfEvaluationStatus, { label: string; color: string }> = {
    PENDIENTE:   { label: 'Pendiente',   color: 'ghost'   },
    EN_PROGRESO: { label: 'En progreso', color: 'warning' },
    ENVIADA:     { label: 'Enviada',     color: 'success' },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

let _cycles: EvaluationCycle[] = [
    {
        id: 'cyc-1',
        nombre: 'Semestral H1 2025',
        descripcion: 'Evaluación de desempeño correspondiente al primer semestre de 2025.',
        fecha_inicio: '2025-01-01',
        fecha_fin: '2025-06-30',
        estado: 'CERRADO',
        total_evaluaciones: 3,
        evaluaciones_completadas: 2,
    },
    {
        id: 'cyc-2',
        nombre: 'Semestral H2 2025',
        descripcion: 'Evaluación de desempeño correspondiente al segundo semestre de 2025.',
        fecha_inicio: '2025-07-01',
        fecha_fin: '2025-12-31',
        estado: 'ACTIVO',
        total_evaluaciones: 2,
        evaluaciones_completadas: 0,
    },
    {
        id: 'cyc-3',
        nombre: 'Q1 2026',
        descripcion: 'Evaluación trimestral Q1 2026.',
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-03-31',
        estado: 'BORRADOR',
        total_evaluaciones: 0,
        evaluaciones_completadas: 0,
    },
];

let _evaluations: EmployeeEvaluation[] = [
    {
        id: 'eval-1',
        ciclo_id: 'cyc-2',
        ciclo_nombre: 'Semestral H2 2025',
        persona_id: 'per_49',
        persona_nombre: 'Anderson Tangarife Ortiz',
        persona_departamento: 'Desarrollo Fullstack',
        persona_puesto: 'Lider Tecnico',
        estado: 'EN_PROGRESO',
        fecha_creacion: '2025-07-10',
        estado_autoevaluacion: 'PENDIENTE',
        objetivos: [
            {
                id: 'obj-1-1',
                nombre: 'Entrega de sprints en tiempo y forma',
                descripcion: 'Porcentaje de sprints completados dentro del plazo comprometido.',
                categoria: 'OPERATIVO',
                indicador: 'Sprints entregados a tiempo / Total sprints',
                formula: '(Sprints a tiempo / Total sprints) × 100',
                tendencia: 'POSITIVA',
                unidad_medida: '%',
                frecuencia: 'MENSUAL',
                peso: 35,
                meta: 90,
                resultado: 85,
                calificacion_logro: 94.4,
                valor_logro_numerico: 2,
                nota: 4,
                comentarios_evaluador: 'Buen desempeño general, algunos sprints afectados por dependencias externas.',
                evidencias_evaluador: [
                    {
                        id: 'evid-1-1',
                        tipo: 'LINK',
                        titulo: 'Reporte de sprints H2',
                        url: 'https://jira.example.com/sprint-report-h2',
                        fecha_creacion: '2025-07-10',
                    },
                    {
                        id: 'evid-1-2',
                        tipo: 'HITO',
                        titulo: 'Sprint 12 entregado a tiempo',
                        descripcion: 'Primer sprint del semestre completado con todos los items definidos.',
                        fecha: '2025-07-28',
                        fecha_creacion: '2025-07-28',
                    },
                ],
                evidencias_evaluado: [],
            },
            {
                id: 'obj-1-2',
                nombre: 'Reducción de bugs en producción',
                descripcion: 'Número de bugs críticos introducidos por el equipo en el ambiente productivo.',
                categoria: 'TECNICO',
                indicador: 'Bugs críticos en producción',
                formula: 'Meta - Bugs reales (menor es mejor)',
                tendencia: 'NEGATIVA',
                unidad_medida: 'bugs',
                frecuencia: 'MENSUAL',
                peso: 30,
                meta: 5,
                resultado: 3,
                calificacion_logro: 166.7,
                valor_logro_numerico: 5,
                nota: 5,
                comentarios_evaluador: 'Excelente. Superó la meta significativamente.',
                evidencias_evaluador: [],
                evidencias_evaluado: [],
            },
            {
                id: 'obj-1-3',
                nombre: 'Capacitación del equipo',
                descripcion: 'Horas de capacitación técnica impartidas al equipo en el semestre.',
                categoria: 'DESARROLLO',
                indicador: 'Horas de capacitación',
                formula: 'Horas reales / Horas meta',
                tendencia: 'POSITIVA',
                unidad_medida: 'horas',
                frecuencia: 'SEMESTRAL',
                peso: 20,
                meta: 20,
                evidencias_evaluador: [],
                evidencias_evaluado: [],
            },
            {
                id: 'obj-1-4',
                nombre: 'Satisfacción del cliente interno',
                descripcion: 'Índice de satisfacción de áreas clientes con los entregables del equipo.',
                categoria: 'COMERCIAL',
                indicador: 'NPS interno',
                formula: 'Promedio de encuestas de satisfacción (escala 1-10)',
                tendencia: 'POSITIVA',
                unidad_medida: 'puntos',
                frecuencia: 'SEMESTRAL',
                peso: 15,
                meta: 8,
                evidencias_evaluador: [],
                evidencias_evaluado: [],
            },
        ],
        puntaje_final: undefined,
        puntaje_final_numerico: undefined,
    },
    {
        id: 'eval-2',
        ciclo_id: 'cyc-2',
        ciclo_nombre: 'Semestral H2 2025',
        persona_id: 'per_38',
        persona_nombre: 'Ana Cristina Ocaña Guerrero',
        persona_departamento: 'Dirección Comercial',
        persona_puesto: 'Director Comercial',
        estado: 'PENDIENTE',
        estado_autoevaluacion: 'PENDIENTE',
        fecha_creacion: '2025-07-12',
        objetivos: [],
    },
];

let _templates: ObjectiveTemplate[] = [
    {
        id: 'tpl-1',
        nombre: 'Cumplimiento de meta de ventas',
        descripcion: 'Porcentaje de logro sobre la cuota de ventas asignada al período.',
        categoria: 'COMERCIAL',
        indicador: 'Ventas reales / Meta de ventas',
        formula: '(Ventas reales / Meta de ventas) × 100',
        tendencia: 'POSITIVA',
        unidad_medida: '%',
        frecuencia: 'MENSUAL',
        peso: 40,
        meta: 100,
        peso_sugerido: 40,
        tags: ['ventas', 'comercial', 'cuota'],
    },
    {
        id: 'tpl-2',
        nombre: 'Tiempo medio de resolución de tickets',
        descripcion: 'Tiempo promedio en horas para cerrar un ticket de soporte.',
        categoria: 'OPERATIVO',
        indicador: 'Promedio de horas por ticket',
        formula: 'Suma de tiempos de resolución / Total tickets resueltos',
        tendencia: 'NEGATIVA',
        unidad_medida: 'horas',
        frecuencia: 'MENSUAL',
        peso: 30,
        meta: 4,
        peso_sugerido: 30,
        tags: ['soporte', 'SLA', 'tiempo'],
    },
    {
        id: 'tpl-3',
        nombre: 'Reducción de incidentes de seguridad',
        descripcion: 'Número de incidentes de ciberseguridad registrados en el período.',
        categoria: 'TECNICO',
        indicador: 'Incidentes reportados',
        formula: 'Total incidentes del período',
        tendencia: 'NEGATIVA',
        unidad_medida: 'incidentes',
        frecuencia: 'TRIMESTRAL',
        peso: 25,
        meta: 2,
        peso_sugerido: 25,
        tags: ['seguridad', 'ciberseguridad'],
    },
    {
        id: 'tpl-4',
        nombre: 'Horas de capacitación completadas',
        descripcion: 'Total de horas de formación completadas por el colaborador en el período.',
        categoria: 'DESARROLLO',
        indicador: 'Horas de capacitación',
        formula: 'Horas completadas / Horas requeridas × 100',
        tendencia: 'POSITIVA',
        unidad_medida: 'horas',
        frecuencia: 'SEMESTRAL',
        peso: 20,
        meta: 40,
        peso_sugerido: 20,
        tags: ['capacitación', 'formación', 'desarrollo'],
    },
    {
        id: 'tpl-5',
        nombre: 'Ejecución presupuestal',
        descripcion: 'Porcentaje de ejecución del presupuesto asignado al área.',
        categoria: 'FINANCIERO',
        indicador: 'Presupuesto ejecutado / Presupuesto asignado',
        formula: '(Gasto real / Presupuesto asignado) × 100',
        tendencia: 'POSITIVA',
        unidad_medida: '%',
        frecuencia: 'TRIMESTRAL',
        peso: 35,
        meta: 95,
        peso_sugerido: 35,
        tags: ['finanzas', 'presupuesto'],
    },
    {
        id: 'tpl-6',
        nombre: 'NPS de clientes',
        descripcion: 'Net Promoter Score de los clientes atendidos en el período.',
        categoria: 'ESTRATEGICO',
        indicador: 'NPS',
        formula: '% Promotores - % Detractores',
        tendencia: 'POSITIVA',
        unidad_medida: 'puntos',
        frecuencia: 'SEMESTRAL',
        peso: 30,
        meta: 50,
        peso_sugerido: 30,
        tags: ['clientes', 'satisfacción', 'NPS'],
    },
];

// ─── Service hook ─────────────────────────────────────────────────────────────

export const usePerformanceService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // ══ Cycles ════════════════════════════════════════════════════════════════

    const getCycles = async (params?: CycleQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [..._cycles];
            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(c => c.nombre.toLowerCase().includes(q));
            }
            if (params?.estado) filtered = filtered.filter(c => c.estado === params.estado);
            return (await fetchData({
                url: '/api/performance/cycles',
                mockData: successMock({ ciclos: filtered }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const createCycle = async (
        data: Omit<EvaluationCycle, 'id' | 'total_evaluaciones' | 'evaluaciones_completadas'>
    ): Promise<FetchResponse | null> => {
        try {
            const newCycle: EvaluationCycle = {
                ...data,
                id: `cyc-${Math.random().toString(36).slice(2, 9)}`,
                total_evaluaciones: 0,
                evaluaciones_completadas: 0,
            };
            _cycles = [..._cycles, newCycle];
            return (await fetchData({
                url: '/api/performance/cycles',
                method: 'POST',
                body: data,
                mockData: successMock({ ciclo: newCycle }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const updateCycle = async (id: string, data: Partial<EvaluationCycle>): Promise<FetchResponse | null> => {
        try {
            _cycles = _cycles.map(c => (c.id === id ? { ...c, ...data } : c));
            return (await fetchData({
                url: `/api/performance/cycles/${id}`,
                method: 'PUT',
                body: data,
                mockData: successMock({ ciclo: { ...data, id } }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const deleteCycle = async (id: string): Promise<boolean> => {
        try {
            _cycles = _cycles.filter(c => c.id !== id);
            await fetchData({ url: `/api/performance/cycles/${id}`, method: 'DELETE', mockData: successMock({}) });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    // ══ Evaluations ═══════════════════════════════════════════════════════════

    const getEvaluations = async (params?: EvaluationQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [..._evaluations];
            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(
                    e => e.persona_nombre.toLowerCase().includes(q) || e.ciclo_nombre.toLowerCase().includes(q)
                );
            }
            if (params?.ciclo_id) filtered = filtered.filter(e => e.ciclo_id === params.ciclo_id);
            if (params?.estado)   filtered = filtered.filter(e => e.estado   === params.estado);

            const page     = params?.pagina ?? 1;
            const pageSize = params?.items_por_pagina ?? 10;
            const total    = filtered.length;
            const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

            return (await fetchData({
                url: '/api/performance/evaluations',
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

    const getEvaluationById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const found = _evaluations.find(e => e.id === id);
            const mock  = found ? successMock({ evaluacion: found }) : errorMock('Evaluación no encontrada');
            const res   = (await fetchData({ url: `/api/performance/evaluations/${id}`, mockData: mock })) as FetchResponse | null;
            if (res?.success === false) throw new Error(res.message || 'Error');
            return res;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const createEvaluation = async (
        data: Pick<EmployeeEvaluation, 'ciclo_id' | 'persona_id' | 'persona_nombre' | 'persona_departamento' | 'persona_puesto'>
    ): Promise<FetchResponse | null> => {
        try {
            if (_evaluations.some(e => e.ciclo_id === data.ciclo_id && e.persona_id === data.persona_id)) {
                throw new Error('Ya existe una evaluación para este colaborador en el ciclo seleccionado.');
            }
            const cycle = _cycles.find(c => c.id === data.ciclo_id);
            const newEval: EmployeeEvaluation = {
                ...data,
                id:                    `eval-${Math.random().toString(36).slice(2, 9)}`,
                ciclo_nombre:          cycle?.nombre ?? '',
                estado:                'PENDIENTE',
                estado_autoevaluacion: 'PENDIENTE',
                objetivos:             [],
                fecha_creacion:        new Date().toISOString().split('T')[0],
            };
            _evaluations = [..._evaluations, newEval];
            _cycles = _cycles.map(c =>
                c.id === data.ciclo_id ? { ...c, total_evaluaciones: (c.total_evaluaciones ?? 0) + 1 } : c
            );
            return (await fetchData({
                url: '/api/performance/evaluations',
                method: 'POST',
                body: data,
                mockData: successMock({ evaluacion: newEval }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const saveEvaluation = async (evaluation: EmployeeEvaluation): Promise<FetchResponse | null> => {
        try {
            // Calcular valores numéricos para cada objetivo basados en su porcentaje de logro
            const objetivosConValor = evaluation.objetivos.map(obj => ({
                ...obj,
                valor_logro_numerico: calcValorLogroNumerico(obj.calificacion_logro),
            }));
            
            const puntaje = calcPuntajeFinal(objetivosConValor);
            const puntajeNumerico = calcPuntajeFinalNumerico(objetivosConValor);
            
            const updated: EmployeeEvaluation = { 
                ...evaluation, 
                objetivos: objetivosConValor,
                puntaje_final: puntaje,
                puntaje_final_numerico: puntajeNumerico,
            };
            
            _evaluations = _evaluations.map(e => (e.id === updated.id ? updated : e));
            return (await fetchData({
                url: `/api/performance/evaluations/${evaluation.id}`,
                method: 'PUT',
                body: updated,
                mockData: successMock({ evaluacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const completeEvaluation = async (id: string): Promise<FetchResponse | null> => {
        try {
            const found = _evaluations.find(e => e.id === id);
            if (!found) throw new Error('Evaluación no encontrada');
            const pesoTotal = found.objetivos.reduce((s, o) => s + o.peso, 0);
            if (pesoTotal !== 100) throw new Error(`El peso total de los objetivos es ${pesoTotal}%. Debe ser exactamente 100%.`);
            
            // Calcular valores numéricos para cada objetivo
            const objetivosConValor = found.objetivos.map(obj => ({
                ...obj,
                valor_logro_numerico: calcValorLogroNumerico(obj.calificacion_logro),
            }));
            
            const updated: EmployeeEvaluation = {
                ...found,
                estado:           'COMPLETADA',
                fecha_completado: new Date().toISOString().split('T')[0],
                objetivos:        objetivosConValor,
                puntaje_final:    calcPuntajeFinal(objetivosConValor),
                puntaje_final_numerico: calcPuntajeFinalNumerico(objetivosConValor),
            };
            _evaluations = _evaluations.map(e => (e.id === id ? updated : e));
            _cycles = _cycles.map(c =>
                c.id === found.ciclo_id ? { ...c, evaluaciones_completadas: (c.evaluaciones_completadas ?? 0) + 1 } : c
            );
            return (await fetchData({
                url: `/api/performance/evaluations/${id}/complete`,
                method: 'POST',
                mockData: successMock({ evaluacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const deleteEvaluation = async (id: string): Promise<boolean> => {
        try {
            const found = _evaluations.find(e => e.id === id);
            _evaluations = _evaluations.filter(e => e.id !== id);
            if (found) {
                _cycles = _cycles.map(c =>
                    c.id === found.ciclo_id
                        ? {
                              ...c,
                              total_evaluaciones: Math.max(0, (c.total_evaluaciones ?? 1) - 1),
                              evaluaciones_completadas:
                                  found.estado === 'COMPLETADA'
                                      ? Math.max(0, (c.evaluaciones_completadas ?? 1) - 1)
                                      : c.evaluaciones_completadas,
                          }
                        : c
                );
            }
            await fetchData({ url: `/api/performance/evaluations/${id}`, method: 'DELETE', mockData: successMock({}) });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    // ── Self-evaluation (evaluado) ─────────────────────────────────────────────

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

    const submitSelfEvaluation = async (id: string): Promise<FetchResponse | null> => {
        try {
            const found = _evaluations.find(e => e.id === id);
            if (!found) throw new Error('Evaluación no encontrada');
            const updated: EmployeeEvaluation = {
                ...found,
                estado_autoevaluacion: 'ENVIADA',
                fecha_autoevaluacion:  new Date().toISOString().split('T')[0],
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

    // ══ Templates ═════════════════════════════════════════════════════════════

    const getTemplates = async (params?: TemplateQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [..._templates];
            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(
                    t => t.nombre.toLowerCase().includes(q) ||
                         t.descripcion?.toLowerCase().includes(q) ||
                         t.tags?.some(tag => tag.toLowerCase().includes(q))
                );
            }
            if (params?.categoria) filtered = filtered.filter(t => t.categoria === params.categoria);
            return (await fetchData({
                url: '/api/performance/templates',
                mockData: successMock({ plantillas: filtered }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const createTemplate = async (data: Omit<ObjectiveTemplate, 'id'>): Promise<FetchResponse | null> => {
        try {
            const newTpl: ObjectiveTemplate = { ...data, id: `tpl-${Math.random().toString(36).slice(2, 9)}` };
            _templates = [..._templates, newTpl];
            return (await fetchData({
                url: '/api/performance/templates',
                method: 'POST',
                body: data,
                mockData: successMock({ plantilla: newTpl }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const updateTemplate = async (id: string, data: Partial<ObjectiveTemplate>): Promise<FetchResponse | null> => {
        try {
            _templates = _templates.map(t => (t.id === id ? { ...t, ...data } : t));
            return (await fetchData({
                url: `/api/performance/templates/${id}`,
                method: 'PUT',
                body: data,
                mockData: successMock({ plantilla: { ...data, id } }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const deleteTemplate = async (id: string): Promise<boolean> => {
        try {
            _templates = _templates.filter(t => t.id !== id);
            await fetchData({ url: `/api/performance/templates/${id}`, method: 'DELETE', mockData: successMock({}) });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    return {
        getCycles, createCycle, updateCycle, deleteCycle,
        getEvaluations, getEvaluationById, createEvaluation,
        saveEvaluation, completeEvaluation, deleteEvaluation,
        saveSelfEvaluation, submitSelfEvaluation,
        getTemplates, createTemplate, updateTemplate, deleteTemplate,
        loading, error,
    };
};