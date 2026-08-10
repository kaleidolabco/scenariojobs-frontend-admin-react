import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';
import { CompetencyScore } from './evaluationResponseService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TipoEvaluacion = 'AUTOEVALUACION' | 'JEFE_DIRECTO' | 'OTRO';

export type EstadoAsignacion =
    | 'PENDIENTE'
    | 'EN_PROGRESO'
    | 'COMPLETADO'
    | 'EN_REVISION'
    | 'APROBADO'
    | 'DEVUELTO';

export type EstadoProcesoCompetencia =
    | 'BORRADOR'
    | 'PUBLICADO'
    | 'EN_CALIFICACION'
    | 'EN_REVISION'
    | 'ARCHIVADO'
    | 'CERRADO';

export interface TipoEvaluacionConfig {
    tipo: TipoEvaluacion;
    activo: boolean;
    peso: number; // Peso de este tipo en la nota final
}

export interface CorreccionConfig {
    permitir: boolean; // true = se puede corregir después de COMPLETADO
    maximo_por_asignacion: number | null; // null = ilimitado, 0 = bloqueado al completar
    requiere_revision: boolean; // true → al corregir vuelve a EN_REVISION
    permitir_cuando_devuelto: boolean; // true → RRHH al devolver habilita corrección
    permitir_voluntaria: boolean; // true → el evaluador puede corregir desde su panel
}

export interface CompetencyEvaluationConfig {
    tipos_evaluacion: TipoEvaluacionConfig[];
    calibracion_rrhh: {
        activo: boolean;
        modo: 'EDITAR' | 'SOLO_REVISAR';
    };
    correccion: CorreccionConfig;
    revision_obligatoria: boolean;
}

export interface EvaluatorAssignment {
    id: string;
    proceso_id: string;
    persona_id: string;
    evaluador_id: string;
    tipo: TipoEvaluacion;
    peso: number;
    estado: EstadoAsignacion;
    // Control de correcciones
    contador_correcciones: number;
    correccion_disponible: boolean;
    // Calibración
    calibrado_por?: string;
    fecha_calibracion?: string;
    comentario_calibracion?: string;
}

export interface CalibrationLog {
    id: string;
    asignacion_id: string;
    calibrado_por: string;
    competencias_originales: CompetencyScore;
    competencias_calibradas: CompetencyScore;
    comentario: string;
    tipo_accion: 'APROBAR' | 'DEVOLVER' | 'CALIBRAR';
    fecha: string;
}

export interface AsignacionQueryParams {
    proceso_id?: string;
    persona_id?: string;
    evaluador_id?: string;
    estado?: EstadoAsignacion;
    tipo?: TipoEvaluacion;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_TIPOS_EVALUACION: TipoEvaluacionConfig[] = [
    { tipo: 'AUTOEVALUACION', activo: true, peso: 33 },
    { tipo: 'JEFE_DIRECTO', activo: true, peso: 34 },
    { tipo: 'OTRO', activo: false, peso: 33 },
];

export const DEFAULT_CORRECCION: CorreccionConfig = {
    permitir: true,
    maximo_por_asignacion: 1,
    requiere_revision: false,
    permitir_cuando_devuelto: true,
    permitir_voluntaria: false,
};

export const DEFAULT_CALIBRACION_RRHH: CompetencyEvaluationConfig['calibracion_rrhh'] = {
    activo: true,
    modo: 'SOLO_REVISAR',
};

export const DEFAULT_CONFIG: CompetencyEvaluationConfig = {
    tipos_evaluacion: DEFAULT_TIPOS_EVALUACION,
    calibracion_rrhh: DEFAULT_CALIBRACION_RRHH,
    correccion: DEFAULT_CORRECCION,
    revision_obligatoria: false,
};

export const TIPO_EVALUACION_LABELS: Record<TipoEvaluacion, string> = {
    AUTOEVALUACION: 'Autoevaluación',
    JEFE_DIRECTO: 'Jefe directo',
    OTRO: 'Otro evaluador',
};

export const ESTADO_ASIGNACION_LABELS: Record<EstadoAsignacion, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROGRESO: 'En progreso',
    COMPLETADO: 'Completado',
    EN_REVISION: 'En revisión',
    APROBADO: 'Aprobado',
    DEVUELTO: 'Devuelto',
};

export const ESTADO_ASIGNACION_BADGE: Record<EstadoAsignacion, string> = {
    PENDIENTE: 'badge-ghost',
    EN_PROGRESO: 'badge-warning',
    COMPLETADO: 'badge-info',
    EN_REVISION: 'badge-warning',
    APROBADO: 'badge-success',
    DEVUELTO: 'badge-error',
};

export const ESTADO_PROCESO_LABELS: Record<EstadoProcesoCompetencia, string> = {
    BORRADOR: 'Borrador',
    PUBLICADO: 'Publicado',
    EN_CALIFICACION: 'En calificación',
    EN_REVISION: 'En revisión',
    ARCHIVADO: 'Archivado',
    CERRADO: 'Cerrado',
};

export const ESTADO_PROCESO_BADGE: Record<EstadoProcesoCompetencia, string> = {
    BORRADOR: 'badge-warning',
    PUBLICADO: 'badge-success',
    EN_CALIFICACION: 'badge-info',
    EN_REVISION: 'badge-warning',
    ARCHIVADO: 'badge-ghost',
    CERRADO: 'badge-success',
};

// ─── Mock DB (GLOBAL - shared between all hook instances) ─────────────────────

const GLOBAL_ASIGNACIONES_DB: EvaluatorAssignment[] = [];
const GLOBAL_CALIBRATION_LOGS_DB: CalibrationLog[] = [];
// Per-process config store
const GLOBAL_CONFIG_DB: Record<string, CompetencyEvaluationConfig> = {};

// Per-assignment calibrated scores (override previous competencias_evaluadas)
const GLOBAL_CALIBRATED_SCORES_DB: Record<string, CompetencyScore> = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const genId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Normaliza una configuración parcial aplicando las reglas de negocio descritas
 * en el documento de spec: si `permitir = false` se fuerza `permitir_voluntaria`
 * y `permitir_cuando_devuelto` a false, y `maximo_por_asignacion = 0`.
 */
export const normalizeCorreccionConfig = (c: CorreccionConfig): CorreccionConfig => {
    if (!c.permitir) {
        return {
            ...c,
            permitir_voluntaria: false,
            permitir_cuando_devuelto: false,
            maximo_por_asignacion: 0,
        };
    }
    return c;
};

/**
 * Calcula `correccion_disponible` para una asignación según la política del proceso.
 * Si `maximo_por_asignacion` es null → sin límite (true).
 * Si 0 → bloqueado (false).
 * Si N → (contador_correcciones < N).
 */
export const calcularCorreccionDisponible = (
    contadorCorrecciones: number,
    maxPorAsignacion: number | null,
    procesoCerrado: boolean,
): boolean => {
    if (procesoCerrado) return false;
    if (maxPorAsignacion === null) return true;
    return contadorCorrecciones < maxPorAsignacion;
};

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useEvaluationAssignmentService = () => {
    const { fetchData } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getAsignacionesDB = () => GLOBAL_ASIGNACIONES_DB;
    const updateAsignacionesDB = (next: EvaluatorAssignment[]) => {
        GLOBAL_ASIGNACIONES_DB.length = 0;
        GLOBAL_ASIGNACIONES_DB.push(...next);
    };
    const getLogsDB = () => GLOBAL_CALIBRATION_LOGS_DB;
    const updateLogsDB = (next: CalibrationLog[]) => {
        GLOBAL_CALIBRATION_LOGS_DB.length = 0;
        GLOBAL_CALIBRATION_LOGS_DB.push(...next);
    };

    // ── Config ────────────────────────────────────────────────────────────

    const getConfig = (procesoId: string): CompetencyEvaluationConfig => {
        return GLOBAL_CONFIG_DB[procesoId] ?? DEFAULT_CONFIG;
    };

    const setConfig = (procesoId: string, config: CompetencyEvaluationConfig) => {
        GLOBAL_CONFIG_DB[procesoId] = {
            ...config,
            correccion: normalizeCorreccionConfig(config.correccion),
        };
    };

    const updateConfig = async (
        procesoId: string,
        config: CompetencyEvaluationConfig,
    ): Promise<FetchResponse | null> => {
        try {
            setConfig(procesoId, config);
            const response = (await fetchData({
                url: `/api/evaluations/${procesoId}/config`,
                method: 'PUT',
                body: config,
                mockData: successMock({ config }),
            })) as FetchResponse | null;
            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar configuración');
            }
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET asignaciones ────────────────────────────────────────────────────

    const getAsignaciones = async (
        params?: AsignacionQueryParams,
    ): Promise<FetchResponse | null> => {
        try {
            let filtered = [...getAsignacionesDB()];
            if (params?.proceso_id) filtered = filtered.filter((a) => a.proceso_id === params.proceso_id);
            if (params?.persona_id) filtered = filtered.filter((a) => a.persona_id === params.persona_id);
            if (params?.evaluador_id) filtered = filtered.filter((a) => a.evaluador_id === params.evaluador_id);
            if (params?.estado) filtered = filtered.filter((a) => a.estado === params.estado);
            if (params?.tipo) filtered = filtered.filter((a) => a.tipo === params.tipo);

            const response = (await fetchData({
                url: '/api/evaluations/asignaciones',
                params: params as any,
                mockData: successMock({ asignaciones: filtered }),
            })) as FetchResponse | null;
            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener asignaciones');
            }
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    /**
     * Devuelve todas las asignaciones de forma síncrona (utilidad para UI).
     */
    const getAsignacionesSync = (params?: AsignacionQueryParams): EvaluatorAssignment[] => {
        let filtered = [...getAsignacionesDB()];
        if (params?.proceso_id) filtered = filtered.filter((a) => a.proceso_id === params.proceso_id);
        if (params?.persona_id) filtered = filtered.filter((a) => a.persona_id === params.persona_id);
        if (params?.evaluador_id) filtered = filtered.filter((a) => a.evaluador_id === params.evaluador_id);
        if (params?.estado) filtered = filtered.filter((a) => a.estado === params.estado);
        if (params?.tipo) filtered = filtered.filter((a) => a.tipo === params.tipo);
        return filtered;
    };

    // ── Generación de asignaciones a partir de participantes ────────────────

    /**
     * Genera (o regenera) las asignaciones para un proceso dados:
     *  - personas seleccionadas
     *  - configuración de tipos activos
     *  - mapa persona_id → evaluadores tipo OTRO
     *  - mapa persona_id → jefe (evaluador_id del jefe del puesto)
     *
     * El parámetro `jefePorPersona` se resuelve externamente a partir del organigrama.
     */
    const generarAsignaciones = (
        procesoId: string,
        personaIds: string[],
        config: CompetencyEvaluationConfig,
        evaluadoresOtros: Record<string, string[]>,
        jefePorPersona: Record<string, string | null>,
    ): EvaluatorAssignment[] => {
        const activosTipos = config.tipos_evaluacion.filter((t) => t.activo);

        // Elimina asignaciones existentes del proceso que ya no tienen persona seleccionada
        const prev = getAsignacionesDB().filter((a) => a.proceso_id === procesoId);
        const restantes = prev.filter((a) => personaIds.includes(a.persona_id));

        const nuevas: EvaluatorAssignment[] = [];
        const resultado: EvaluatorAssignment[] = [...restantes];

        personaIds.forEach((personaId) => {
            activosTipos.forEach((tipoConfig) => {
                // ¿Ya existe una asignación para (persona, tipo)?
                const yaExiste = resultado.some(
                    (a) =>
                        a.proceso_id === procesoId &&
                        a.persona_id === personaId &&
                        a.tipo === tipoConfig.tipo,
                );
                if (yaExiste) return;

                let evaluadorId: string | null = null;
                if (tipoConfig.tipo === 'AUTOEVALUACION') {
                    // El evaluador es la propia persona (resuelto externamente como user_id)
                    // Se resuelve en quien genera; si no llega, se omite.
                    evaluadorId = null;
                } else if (tipoConfig.tipo === 'JEFE_DIRECTO') {
                    evaluadorId = jefePorPersona[personaId] ?? null;
                } else if (tipoConfig.tipo === 'OTRO') {
                    // Se generan N asignaciones, una por cada evaluador OTRO
                    const otros = evaluadoresOtros[personaId] ?? [];
                    otros.forEach((eid) => {
                        nuevas.push({
                            id: genId('asn'),
                            proceso_id: procesoId,
                            persona_id: personaId,
                            evaluador_id: eid,
                            tipo: 'OTRO',
                            peso: tipoConfig.peso,
                            estado: 'PENDIENTE',
                            contador_correcciones: 0,
                            correccion_disponible: calcularCorreccionDisponible(
                                0,
                                config.correccion.maximo_por_asignacion,
                                false,
                            ),
                        });
                    });
                    return;
                }

                if (tipoConfig.tipo === 'AUTOEVALUACION') {
                    // El evaluador_id se establece al "user_id" de la persona. Si no hay, se salta.
                    if (!evaluadorId) return;
                } else if (tipoConfig.tipo === 'JEFE_DIRECTO') {
                    if (!evaluadorId) return;
                }

                nuevas.push({
                    id: genId('asn'),
                    proceso_id: procesoId,
                    persona_id: personaId,
                    evaluador_id: evaluadorId!,
                    tipo: tipoConfig.tipo,
                    peso: tipoConfig.peso,
                    estado: 'PENDIENTE',
                    contador_correcciones: 0,
                    correccion_disponible: calcularCorreccionDisponible(
                        0,
                        config.correccion.maximo_por_asignacion,
                        false,
                    ),
                });
            });
        });

        // Elimina las asignaciones tipo OTRO que ya no estén en evaluadoresOtros para esa persona
        const finalAsignaciones = resultado.filter((a) => {
            if (a.tipo !== 'OTRO') return true;
            const otros = evaluadoresOtros[a.persona_id] ?? [];
            return otros.includes(a.evaluador_id);
        });

        const todas = [...finalAsignaciones, ...nuevas];
        // Reemplaza en la DB las del proceso por las nuevas
        const fueraProceso = getAsignacionesDB().filter((a) => a.proceso_id !== procesoId);
        updateAsignacionesDB([...fueraProceso, ...todas]);

        return todas;
    };

    /**
     * Elimina todas las asignaciones de un proceso (usado al guardar y limpiar).
     */
    const limpiarAsignacionesProceso = (procesoId: string) => {
        updateAsignacionesDB(getAsignacionesDB().filter((a) => a.proceso_id !== procesoId));
    };

    // ── Transiciones de estado ───────────────────────────────────────────────

    /**
     * Marca el inicio de la edición de una asignación: PENDIENTE/DEVUELTO/COMPLETADO → EN_PROGRESO.
     * Cuenta como "corrección" si era COMPLETADO.
     */
    const iniciarEdicion = async (asignacionId: string): Promise<FetchResponse | null> => {
        try {
            const all = getAsignacionesDB();
            const idx = all.findIndex((a) => a.id === asignacionId);
            if (idx === -1) throw new Error('Asignación no encontrada');

            const a = all[idx];
            const config = getConfig(a.proceso_id);

            const eraCompletado = a.estado === 'COMPLETADO';
            const nuevoContador = eraCompletado ? a.contador_correcciones + 1 : a.contador_correcciones;

            const updated: EvaluatorAssignment = {
                ...a,
                estado: 'EN_PROGRESO',
                contador_correcciones: nuevoContador,
                correccion_disponible: calcularCorreccionDisponible(
                    nuevoContador,
                    config.correccion.maximo_por_asignacion,
                    false,
                ),
                // Al iniciar una corrección se limpia la calibración previa
                calibrado_por: undefined,
                fecha_calibracion: undefined,
                comentario_calibracion: undefined,
            };

            const next = [...all];
            next[idx] = updated;
            updateAsignacionesDB(next);

            // Limpia puntajes calibrados si los había
            delete GLOBAL_CALIBRATED_SCORES_DB[asignacionId];

            return (await fetchData({
                url: `/api/evaluations/asignaciones/${asignacionId}/iniciar`,
                method: 'PATCH',
                mockData: successMock({ asignacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    /**
     * Completa una asignación: EN_PROGRESO → COMPLETADO (o EN_REVISION si
     * revision_obligatoria / requiere_revision).
     */
    const completarAsignacion = async (asignacionId: string): Promise<FetchResponse | null> => {
        try {
            const all = getAsignacionesDB();
            const idx = all.findIndex((a) => a.id === asignacionId);
            if (idx === -1) throw new Error('Asignación no encontrada');

            const a = all[idx];
            const config = getConfig(a.proceso_id);

            const nuevoEstado: EstadoAsignacion =
                config.revision_obligatoria || config.correccion.requiere_revision
                    ? 'EN_REVISION'
                    : 'COMPLETADO';

            const updated: EvaluatorAssignment = {
                ...a,
                estado: nuevoEstado,
            };
            const next = [...all];
            next[idx] = updated;
            updateAsignacionesDB(next);

            // Transición automática del proceso si todas las asignaciones de una persona
            // están COMPLETADO o APROBADO (cuando revision_obligatoria = false) se evalúa
            // en el servicio de proceso; aquí sólo devolvemos la asignación actualizada.

            return (await fetchData({
                url: `/api/evaluations/asignaciones/${asignacionId}/completar`,
                method: 'PATCH',
                mockData: successMock({ asignacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── Calibración RRHH ────────────────────────────────────────────────────

    const getCalibrationLogs = (asignacionId: string): CalibrationLog[] => {
        return getLogsDB().filter((l) => l.asignacion_id === asignacionId);
    };

    const setCalibratedScores = (asignacionId: string, scores: CompetencyScore) => {
        GLOBAL_CALIBRATED_SCORES_DB[asignacionId] = { ...scores };
    };

    const getCalibratedScores = (asignacionId: string): CompetencyScore | undefined => {
        return GLOBAL_CALIBRATED_SCORES_DB[asignacionId];
    };

    const aprobarAsignacion = async (
        asignacionId: string,
        calibradoPor: string,
        comentario: string,
        competenciasCalibradas?: CompetencyScore,
    ): Promise<FetchResponse | null> => {
        try {
            const all = getAsignacionesDB();
            const idx = all.findIndex((a) => a.id === asignacionId);
            if (idx === -1) throw new Error('Asignación no encontrada');

            const a = all[idx];
            const now = new Date().toISOString();

            // Persistir puntajes calibrados si se enviaron
            if (competenciasCalibradas) {
                setCalibratedScores(asignacionId, competenciasCalibradas);
            }

            const updated: EvaluatorAssignment = {
                ...a,
                estado: 'APROBADO',
                calibrado_por: calibradoPor,
                fecha_calibracion: now,
                comentario_calibracion: comentario,
            };
            const next = [...all];
            next[idx] = updated;
            updateAsignacionesDB(next);

            const log: CalibrationLog = {
                id: genId('clog'),
                asignacion_id: asignacionId,
                calibrado_por: calibradoPor,
                competencias_originales: {} as CompetencyScore, // se completa externamente si modo EDITAR
                competencias_calibradas: competenciasCalibradas ?? ({} as CompetencyScore),
                comentario,
                tipo_accion: 'APROBAR',
                fecha: now,
            };
            updateLogsDB([...getLogsDB(), log]);

            return (await fetchData({
                url: `/api/evaluations/asignaciones/${asignacionId}/aprobar`,
                method: 'PATCH',
                body: { calibrado_por: calibradoPor, comentario, competencias_calibradas: competenciasCalibradas },
                mockData: successMock({ asignacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const calibrarAsignacion = async (
        asignacionId: string,
        calibradoPor: string,
        comentario: string,
        competenciasCalibradas: CompetencyScore,
    ): Promise<FetchResponse | null> => {
        try {
            const all = getAsignacionesDB();
            const idx = all.findIndex((a) => a.id === asignacionId);
            if (idx === -1) throw new Error('Asignación no encontrada');

            const a = all[idx];
            const now = new Date().toISOString();
            setCalibratedScores(asignacionId, competenciasCalibradas);

            const updated: EvaluatorAssignment = {
                ...a,
                estado: 'EN_REVISION', // sigue en revisión
                calibrado_por: calibradoPor,
                fecha_calibracion: now,
                comentario_calibracion: comentario,
            };
            const next = [...all];
            next[idx] = updated;
            updateAsignacionesDB(next);

            const log: CalibrationLog = {
                id: genId('clog'),
                asignacion_id: asignacionId,
                calibrado_por: calibradoPor,
                competencias_originales: {} as CompetencyScore,
                competencias_calibradas: competenciasCalibradas,
                comentario,
                tipo_accion: 'CALIBRAR',
                fecha: now,
            };
            updateLogsDB([...getLogsDB(), log]);

            return (await fetchData({
                url: `/api/evaluations/asignaciones/${asignacionId}/calibrar`,
                method: 'PATCH',
                body: { calibrado_por: calibradoPor, comentario, competencias_calibradas: competenciasCalibradas },
                mockData: successMock({ asignacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const devolverAsignacion = async (
        asignacionId: string,
        calibradoPor: string,
        comentario: string,
    ): Promise<FetchResponse | null> => {
        try {
            const all = getAsignacionesDB();
            const idx = all.findIndex((a) => a.id === asignacionId);
            if (idx === -1) throw new Error('Asignación no encontrada');

            const a = all[idx];
            const config = getConfig(a.proceso_id);

            if (!config.correccion.permitir_cuando_devuelto) {
                throw new Error('La política de corrección no permite devoluciones.');
            }

            const now = new Date().toISOString();
            // Al devolver, la asignación vuelve a EN_PROGRESO y limpia la calibración
            const updated: EvaluatorAssignment = {
                ...a,
                estado: 'DEVUELTO',
                calibrado_por: undefined,
                fecha_calibracion: undefined,
                comentario_calibracion: comentario,
            };
            const next = [...all];
            next[idx] = updated;
            updateAsignacionesDB(next);

            // La transición DEVUELTO → EN_PROGRESO ocurre cuando el evaluador reanuda
            // (en iniciarEdicion) — así el evaluador ve "Devuelto" en su panel y
            // explícitamente reabre para corregir.

            const log: CalibrationLog = {
                id: genId('clog'),
                asignacion_id: asignacionId,
                calibrado_por: calibradoPor,
                competencias_originales: {} as CompetencyScore,
                competencias_calibradas: {} as CompetencyScore,
                comentario,
                tipo_accion: 'DEVOLVER',
                fecha: now,
            };
            updateLogsDB([...getLogsDB(), log]);

            return (await fetchData({
                url: `/api/evaluations/asignaciones/${asignacionId}/devolver`,
                method: 'PATCH',
                body: { calibrado_por: calibradoPor, comentario },
                mockData: successMock({ asignacion: updated }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── Cálculo de resultados ──────────────────────────────────────────────

    /**
     * Calcula el nivel obtenido por competencia para una persona en un proceso,
     * combinando los puntajes calibrados (si existen) o los puntajes crudos de
     * las respuestas aprobadas/completadas, ponderados por tipo de evaluación.
     *
     * @param procesoId
     * @param personaId
     * @param respuestasPorAsignacion  Mapa asignacionId → CompetencyScore
     *   (los puntajes crudos guardados por evaluationResponseService).
     * @returns Mapa competencyId → nivel obtenido (ponderado).
     */
    const calcularNivelesPorCompetencia = (
        procesoId: string,
        personaId: string,
        respuestasPorAsignacion: Record<string, CompetencyScore>,
    ): CompetencyScore => {
        const asignaciones = getAsignacionesSync({
            proceso_id: procesoId,
            persona_id: personaId,
        }).filter((a) => a.estado === 'APROBADO' || a.estado === 'COMPLETADO');

        if (asignaciones.length === 0) return {};

        // Suma de pesos por tipo (para normalización)
        const pesoTotal = asignaciones.reduce((s, a) => s + a.peso, 0) || 1;

        // Acumula por kompetencia: suma(score * peso) y soma(peso)
        const numerador: Record<string, number> = {};
        const denominador: Record<string, number> = {};

        asignaciones.forEach((a) => {
            const crudo = respuestasPorAsignacion[a.id] ?? {};
            const calibrado = getCalibratedScores(a.id);
            const score = calibrado ?? crudo;
            const peso = a.peso / pesoTotal;

            Object.entries(score).forEach(([compId, val]) => {
                numerador[compId] = (numerador[compId] ?? 0) + val * peso;
                denominador[compId] = (denominador[compId] ?? 0) + peso;
            });
        });

        const resultado: CompetencyScore = {};
        Object.keys(numerador).forEach((compId) => {
            const den = denominador[compId] || 1;
            resultado[compId] = numerador[compId] / den;
        });
        return resultado;
    };

    // ── Transición automática de proceso ───────────────────────────────────

    /**
     * Verifica si todas las asignaciones de un proceso están COMPLETADO/APROBADO
     * (según revision_obligatoria). Devuelve el estado sugerido del proceso:
     *  - EN_REVISION si todas completas (con revisión obligatoria)
     *  - EN_REVISION si todas completas pero pendiente calibrar RRHH
     *  - null si aún faltan pendientes/en progreso
     */
    const evaluarTransicionProceso = (procesoId: string): EstadoProcesoCompetencia | null => {
        const all = getAsignacionesSync({ proceso_id: procesoId });
        if (all.length === 0) return null;

        const config = getConfig(procesoId);
        // TODO: estado bloqueante (proceso CERRADO) — no se computa aquí.

        if (config.revision_obligatoria) {
            const todosCompletos = all.every(
                (a) => a.estado === 'COMPLETADO' || a.estado === 'EN_REVISION' || a.estado === 'APROBADO',
            );
            return todosCompletos ? 'EN_REVISION' : null;
        }
        // Sin revisión obligatoria: cuando todas aprobadas → EN_REVISION (calibración RRHH).
        const todosAprobados = all.every((a) => a.estado === 'APROBADO');
        if (todosAprobados) return 'EN_REVISION';

        // Si todas completas (no requiere revisión), sigue en calificación; el RRHH
        // cierra manualmente cuando apruebe.
        return null;
    };

    return {
        // Config
        getConfig,
        setConfig,
        updateConfig,
        // Asignaciones
        getAsignaciones,
        getAsignacionesSync,
        generarAsignaciones,
        limpiarAsignacionesProceso,
        iniciarEdicion,
        completarAsignacion,
        // Calibración
        getCalibrationLogs,
        getCalibratedScores,
        setCalibratedScores,
        aprobarAsignacion,
        calibrarAsignacion,
        devolverAsignacion,
        // Resultados
        calcularNivelesPorCompetencia,
        evaluarTransicionProceso,
    };
};
