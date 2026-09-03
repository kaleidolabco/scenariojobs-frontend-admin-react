import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
    CompetencyEvaluationStatus,
} from '../services/competencyEvaluationService';
import {
    CompetencyEvaluationConfig,
    CorreccionConfig,
    TipoEvaluacion,
    DEFAULT_CONFIG,
} from '../services/evaluationAssignmentService';
import {
    OrigenCompetencias,
    SugerenciaCompetencias,
    EvaluadoresPorPersona,
    PersonRow,
} from '../components/CompetencyEvaluation/types';
import type { WeightMap } from '../components/CompetencyEvaluation/CategoryGroup';
import useUIStore from '../store/uiStore';

export interface CompetencyAssignmentItem {
    competencia_id: string;
    nombre?: string;
    descripcion?: string;
    escala?: number;
    categoria?: { id: string; nombre: string } | string;
    orden: number;
    seccion: string;
    peso_ponderacion: number;
}

export interface CompetencyEvaluationDetailFormState {
    nombre: string;
    descripcion: string;
    estado: CompetencyEvaluationStatus;
    competencias_asignadas: string[];
    competencias_items: CompetencyAssignmentItem[];
    weights: WeightMap;
    personas_a_evaluar: string[];
    evaluadores_por_persona: EvaluadoresPorPersona;
    templates_asociadas: string[];
}

const INITIAL_FORM: CompetencyEvaluationDetailFormState = {
    nombre: '',
    descripcion: '',
    estado: 'BORRADOR',
    competencias_asignadas: [],
    competencias_items: [],
    weights: {},
    personas_a_evaluar: [],
    evaluadores_por_persona: {},
    templates_asociadas: [],
};

/**
 * Hook que centraliza el estado, la carga modular por pestañas (lazy loading con caché)
 * y el guardado de la vista de detalle de un proceso de evaluación de competencias.
 */
export const useCompetencyEvaluationDetail = (id?: string) => {
    const { openAlert } = useUIStore();
    const {
        getCompetencyEvaluationDetail,
        updateCompetencyEvaluation,
        getConfig,
        saveConfig,
        getProcessCompetencies,
        saveCompetencies,
        saveParticipants,
        getCompetenciasSugeridas,
        getProcessEmails,
        saveProcessEmails,
    } = useCompetencyEvaluationService();

    const [loading, setLoading] = useState(true);
    const [dirtyGeneral, setDirtyGeneral] = useState(false);
    const [dirtyCompetencias, setDirtyCompetencias] = useState(false);
    const [dirtyParticipantes, setDirtyParticipantes] = useState(false);
    const [dirtyCorreos, setDirtyCorreos] = useState(false);

    const [savingGeneral, setSavingGeneral] = useState(false);
    const [savingCompetencias, setSavingCompetencias] = useState(false);
    const [savingParticipantes, setSavingParticipantes] = useState(false);
    const [savingCorreos, setSavingCorreos] = useState(false);

    const [evaluation, setEvaluation] = useState<CompetencyEvaluationDetail | null>(null);
    const [formData, setFormData] = useState<CompetencyEvaluationDetailFormState>(INITIAL_FORM);
    const [config, setConfig] = useState<CompetencyEvaluationConfig>(DEFAULT_CONFIG);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [origen, setOrigen] = useState<OrigenCompetencias>('manual');
    const [appliedSugerenciaKey, setAppliedSugerenciaKey] = useState<string | null>(null);
    const [sugerencia, setSugerencia] = useState<SugerenciaCompetencias | null>(null);

    const [activeTab, setActiveTab] = useState<'general' | 'competencias' | 'participantes' | 'correos'>('general');

    // Control de pestañas ya cargadas para evitar peticiones repetitivas (Lazy Loading cacheado)
    const [fetchedTabs, setFetchedTabs] = useState<Record<string, boolean>>({});

    // Caché local de detalles de personas participantes
    const [personasDetalle, setPersonasDetalle] = useState<Record<string, PersonRow>>({});

    const registrarPersonas = useCallback((rows: PersonRow[]) => {
        if (rows.length === 0) return;
        setPersonasDetalle((prev) => {
            const next = { ...prev };
            rows.forEach((r) => {
                next[r.id] = r;
            });
            return next;
        });
    }, []);

    // Snapshot de IDs de participantes cargados del servidor (para calcular diff incremental en PATCH)
    const serverParticipantIdsRef = useRef<string[]>([]);

    const setServerParticipantIds = useCallback((ids: string[]) => {
        serverParticipantIdsRef.current = ids;
    }, []);

    // Snapshot de IDs de competencias cargadas del servidor (para calcular diff incremental en PATCH)
    const originalCompetencyIdsRef = useRef<string[]>([]);

    // ── 1. Carga inicial básica (metadata del proceso) ────────────────────────
    useEffect(() => {
        const loadBase = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const evalRes = await getCompetencyEvaluationDetail(id);
                if (evalRes?.success && evalRes.data?.evaluacion) {
                    const ev = evalRes.data.evaluacion as CompetencyEvaluationDetail;
                    setEvaluation(ev);
                    setFormData((prev) => ({
                        ...prev,
                        nombre: ev.nombre ?? '',
                        descripcion: ev.descripcion ?? '',
                        estado: ev.estado ?? 'BORRADOR',
                    }));
                }
            } catch {
                openAlert('Error al cargar la evaluación', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadBase();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ── 2. Carga modular por pestaña activa (Lazy Loading con caché) ───────────
    useEffect(() => {
        if (!id || fetchedTabs[activeTab]) return;
        let cancelled = false;

        const loadTabData = async () => {
            if (activeTab === 'general') {
                const res = await getConfig(id);
                if (!cancelled && res?.success && res.data) {
                    const cfg = res.data.configuracion ?? res.data.config;
                    if (cfg) setConfig(cfg);
                }
            } else if (activeTab === 'competencias') {
                const res = await getProcessCompetencies(id);
                if (!cancelled && res?.success && res.data) {
                    const d = res.data;
                    const comps = d.datos ?? d.competencias ?? [];
                    const assignedIds = comps.map((c: any) => c.competencia_id || c.id);

                    const items: CompetencyAssignmentItem[] = comps.map((c: any) => ({
                        competencia_id: c.competencia_id || c.id,
                        nombre: c.nombre,
                        descripcion: c.descripcion,
                        escala: c.escala,
                        categoria: c.categoria,
                        orden: c.orden ?? 0,
                        seccion: c.seccion ?? (typeof c.categoria === 'object' ? c.categoria?.nombre : c.categoria) ?? 'General',
                        peso_ponderacion: c.peso_ponderacion ?? c.peso ?? 0,
                    }));

                    const weightsMap: Record<string, number> = {};
                    items.forEach((c) => { weightsMap[c.competencia_id] = c.peso_ponderacion; });

                    setFormData((prev) => ({
                        ...prev,
                        competencias_asignadas: assignedIds,
                        competencias_items: items,
                        weights: weightsMap,
                    }));
                    originalCompetencyIdsRef.current = assignedIds;
                    if (d.origen_competencias) setOrigen(d.origen_competencias);
                }
            } else if (activeTab === 'correos') {
                const res = await getProcessEmails(id);
                if (!cancelled && res?.success && res.data) {
                    const tids = res.data.plantillas_correo_ids ?? res.data.templates_asociadas ?? [];
                    setFormData((prev) => ({
                        ...prev,
                        templates_asociadas: tids,
                    }));
                }
            }
            if (!cancelled) {
                setFetchedTabs((prev) => ({ ...prev, [activeTab]: true }));
            }
        };

        loadTabData();
        return () => {
            cancelled = true;
        };
    }, [id, activeTab, fetchedTabs]);

    // ── Derivación de competencias desde cargos (POST backend) ────────────────

    useEffect(() => {
        if (origen !== 'desde_cargos' || !id) {
            setSugerencia(null);
            return;
        }
        let cancelled = false;
        (async () => {
            const res = await getCompetenciasSugeridas(id);
            if (!cancelled && res?.success && res.data) {
                const raw = res.data;
                const sug: SugerenciaCompetencias = {
                    ids: raw.ids ?? [],
                    pesos: raw.pesos ?? {},
                    expectedLevels: raw.expectedLevels ?? raw.niveles_esperados ?? {},
                    niveles_esperados: raw.niveles_esperados ?? raw.expectedLevels ?? {},
                    nCargos: raw.total_cargos ?? raw.nCargos ?? 0,
                    total_cargos: raw.total_cargos ?? raw.nCargos ?? 0,
                    nPersonas: raw.total_personas ?? raw.nPersonas ?? 0,
                    total_personas: raw.total_personas ?? raw.nPersonas ?? 0,
                    total_competencias: raw.total_competencias ?? raw.ids?.length ?? 0,
                    avisos: raw.avisos ?? [],
                };
                setSugerencia(sug);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, origen]);

    const derivedDirty =
        origen === 'desde_cargos' &&
        !appliedSugerenciaKey &&
        sugerencia !== null;

    // ── Origen ────────────────────────────────────────────────────────────────

    const handleOrigenChange = useCallback((nuevoOrigen: OrigenCompetencias) => {
        setOrigen(nuevoOrigen);
        setDirtyCompetencias(true);
        if (nuevoOrigen === 'desde_cargos') setAppliedSugerenciaKey(null);
    }, []);

    const applySugerencias = useCallback((mode: 'reemplazar' | 'fusionar') => {
        if (!sugerencia || sugerencia.ids.length === 0) return;
        setFormData((prev) => {
            const ids: string[] = mode === 'reemplazar'
                ? sugerencia.ids
                : Array.from(new Set([...prev.competencias_asignadas, ...sugerencia.ids]));

            let weights: Record<string, number>;
            if (mode === 'reemplazar') {
                weights = { ...sugerencia.pesos };
            } else {
                const raw: Record<string, number> = {};
                ids.forEach((compId) => { raw[compId] = sugerencia.pesos[compId] ?? prev.weights[compId] ?? 0; });
                const total = Object.values(raw).reduce((s, v) => s + v, 0);
                weights = {};
                if (total === 0) {
                    const base = Math.floor(100 / ids.length);
                    ids.forEach((compId, i) => { weights[compId] = base + (i === 0 ? 100 - base * ids.length : 0); });
                } else {
                    const factor = 100 / total;
                    let acc = 0;
                    ids.forEach((compId, i) => {
                        const w = i === ids.length - 1 ? 100 - acc : raw[compId] * factor;
                        weights[compId] = Math.round(w * 100) / 100;
                        acc += weights[compId];
                    });
                }
            }

            const sugCompetencias = (sugerencia as any).competencias ?? [];
            const newItems: CompetencyAssignmentItem[] = mode === 'reemplazar'
                ? sugCompetencias.map((c: any, idx: number) => ({
                    competencia_id: c.competencia_id || c.id,
                    nombre: c.nombre,
                    descripcion: c.descripcion,
                    escala: c.escala,
                    categoria: c.categoria,
                    orden: idx,
                    seccion: c.seccion ?? (typeof c.categoria === 'object' ? c.categoria?.nombre : c.categoria) ?? 'General',
                    peso_ponderacion: c.peso_calculado ?? weights[c.competencia_id || c.id] ?? 0,
                }))
                : ids.map((compId, idx) => {
                    const existing = prev.competencias_items.find((i) => i.competencia_id === compId);
                    if (existing) return { ...existing, orden: idx, peso_ponderacion: weights[compId] ?? 0 };
                    const sug = sugCompetencias.find((c: any) => (c.competencia_id || c.id) === compId);
                    return {
                        competencia_id: compId,
                        nombre: sug?.nombre,
                        descripcion: sug?.descripcion,
                        escala: sug?.escala,
                        categoria: sug?.categoria,
                        orden: idx,
                        seccion: sug?.seccion ?? 'General',
                        peso_ponderacion: weights[compId] ?? 0,
                    };
                });

            return { ...prev, competencias_asignadas: ids, competencias_items: newItems, weights };
        });
        setAppliedSugerenciaKey(origen);
        setDirtyCompetencias(true);
    }, [sugerencia, origen]);

    // ── Handlers básicos ──────────────────────────────────────────────────────

    const handleChange = useCallback((
        field: string,
        value: string | string[] | CompetencyEvaluationStatus | EvaluadoresPorPersona,
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
        if (field === 'nombre' || field === 'descripcion' || field === 'estado') {
            setDirtyGeneral(true);
        } else if (field === 'personas_a_evaluar' || field === 'evaluadores_por_persona') {
            setDirtyParticipantes(true);
        } else if (field === 'templates_asociadas') {
            setDirtyCorreos(true);
        }
    }, []);

    const handleToggleCompetency = useCallback((compId: string, nombre?: string, descripcion?: string, escala?: number, categoria?: { id: string; nombre: string } | string, seccion?: string) => {
        setFormData((prev) => {
            const isSelected = prev.competencias_asignadas.includes(compId);
            const newIds = isSelected
                ? prev.competencias_asignadas.filter((c) => c !== compId)
                : [...prev.competencias_asignadas, compId];
            const newWeights = { ...prev.weights };
            let newItems = [...prev.competencias_items];

            if (isSelected) {
                delete newWeights[compId];
                newItems = newItems.filter((i) => i.competencia_id !== compId);
            } else {
                newWeights[compId] = 0;
                const fallbackSection = seccion ?? (typeof categoria === 'object' ? categoria?.nombre : categoria) ?? 'General';
                newItems.push({
                    competencia_id: compId,
                    nombre,
                    descripcion,
                    escala,
                    categoria,
                    orden: newItems.filter((i) => i.seccion === fallbackSection).length,
                    seccion: fallbackSection,
                    peso_ponderacion: 0,
                });
            }

            return { ...prev, competencias_asignadas: newIds, competencias_items: newItems, weights: newWeights };
        });
        setDirtyCompetencias(true);
    }, []);

    const handleUpdateCompetencyItems = useCallback((items: CompetencyAssignmentItem[]) => {
        setFormData((prev) => {
            const newIds = items.map((i) => i.competencia_id);
            const newWeights: Record<string, number> = {};
            items.forEach((i) => { newWeights[i.competencia_id] = i.peso_ponderacion; });
            return { ...prev, competencias_asignadas: newIds, competencias_items: items, weights: newWeights };
        });
        setDirtyCompetencias(true);
    }, []);

    const handleWeightChange = useCallback((compId: string, w: number) => {
        setFormData((prev) => ({
            ...prev,
            weights: { ...prev.weights, [compId]: w },
            competencias_items: prev.competencias_items.map((item) =>
                item.competencia_id === compId ? { ...item, peso_ponderacion: w } : item
            ),
        }));
        setDirtyCompetencias(true);
    }, []);

    const handleClearCompetencies = useCallback(() => {
        setFormData((prev) => ({ ...prev, competencias_asignadas: [], weights: {} }));
        setDirtyCompetencias(true);
    }, []);

    // ── Handlers de configuración ─────────────────────────────────────────────

    const handleToggleTipoEvaluacion = useCallback((tipo: TipoEvaluacion, activo: boolean) => {
        setConfig((prev) => {
            const tipos = prev.tipos_evaluacion.map((t) =>
                t.tipo === tipo ? { ...t, activo } : t
            );
            const activos = tipos.filter((t) => t.activo);
            const peso = activos.length > 0 ? Math.floor(100 / activos.length) : 0;
            const resto = activos.length > 0 ? 100 - peso * activos.length : 0;
            tipos.forEach((t) => { if (t.activo) t.peso = peso; });
            if (resto > 0 && activos[0]) {
                const primero = tipos.find((t) => t === activos[0]);
                if (primero) primero.peso += resto;
            }
            return { ...prev, tipos_evaluacion: tipos };
        });
        setDirtyGeneral(true);
    }, []);

    const handleTipoPesoChange = useCallback((tipo: TipoEvaluacion, peso: number) => {
        setConfig((prev) => ({
            ...prev,
            tipos_evaluacion: prev.tipos_evaluacion.map((t) =>
                t.tipo === tipo ? { ...t, peso: Math.min(100, Math.max(0, peso)) } : t
            ),
        }));
        setDirtyGeneral(true);
    }, []);

    const handleCalibracionChange = useCallback((campo: 'activo' | 'modo', value: boolean | string) => {
        setConfig((prev) => ({
            ...prev,
            calibracion_rrhh: { ...prev.calibracion_rrhh, [campo]: value },
        }));
        setDirtyGeneral(true);
    }, []);

    const handleCorreccionChange = useCallback((campo: keyof CorreccionConfig, value: boolean | number) => {
        setConfig((prev) => {
            const nuevaCorreccion: CorreccionConfig = { ...prev.correccion, [campo]: value };
            if (campo === 'permitir' && value === false) {
                nuevaCorreccion.permitir_voluntaria = false;
                nuevaCorreccion.permitir_cuando_devuelto = false;
                nuevaCorreccion.maximo_por_asignacion = 0;
            }
            return { ...prev, correccion: nuevaCorreccion };
        });
        setDirtyGeneral(true);
    }, []);

    const handleToggleRevisionObligatoria = useCallback((value: boolean) => {
        setConfig((prev) => ({ ...prev, revision_obligatoria: value }));
        setDirtyGeneral(true);
    }, []);

    // ── Validación y guardado por pestaña ─────────────────────────────────────

    const totalWeight = useMemo(
        () => formData.competencias_asignadas.reduce((s, cId) => s + (formData.weights[cId] ?? 0), 0),
        [formData.competencias_asignadas, formData.weights]
    );

    const validateGeneral = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (formData.nombre.length > 255) newErrors.nombre = 'Máximo 255 caracteres';
        if (formData.descripcion.length > 1000) newErrors.descripcion = 'Máximo 1000 caracteres';

        if (formData.personas_a_evaluar.length > 0) {
            const tiposActivos = config.tipos_evaluacion.filter((t) => t.activo);
            if (tiposActivos.length === 0) {
                newErrors.config = 'Debe activar al menos un tipo de evaluación cuando hay participantes asignados.';
            } else {
                const sumaPesosTipos = tiposActivos.reduce((s, t) => s + t.peso, 0);
                if (sumaPesosTipos !== 100) {
                    newErrors.config = `Los pesos de los tipos de evaluación deben sumar 100% (actual: ${sumaPesosTipos}%).`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData.nombre, formData.descripcion, formData.personas_a_evaluar, config]);

    const validateCompetencias = useCallback((): boolean => {
        if (formData.competencias_asignadas.length > 0 && Math.round(totalWeight * 100) / 100 !== 100) {
            openAlert('Los pesos de las competencias deben sumar exactamente 100%.', 'error');
            return false;
        }
        return true;
    }, [formData.competencias_asignadas, totalWeight, openAlert]);

    const saveGeneral = useCallback(async () => {
        if (!id || !validateGeneral()) return;
        setSavingGeneral(true);
        try {
            const resGeneral = await updateCompetencyEvaluation(id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                estado: formData.estado,
            });
            if (!resGeneral?.success) return;

            const resConfig = await saveConfig(id, config);
            if (!resConfig?.success) return;

            openAlert('Información general guardada correctamente', 'success');
            setDirtyGeneral(false);
        } finally {
            setSavingGeneral(false);
        }
    }, [id, validateGeneral, formData.nombre, formData.descripcion, formData.estado, config, updateCompetencyEvaluation, saveConfig, openAlert]);

    const saveCompetenciasTab = useCallback(async () => {
        if (!id || !validateCompetencias()) return;
        setSavingCompetencias(true);
        try {
            const items = formData.competencias_items;

            if (origen === 'desde_cargos') {
                const res = await saveCompetencies(id, {
                    origen: 'desde_cargos',
                });
                if (!res?.success) return;
            } else {
                const originalIds = new Set(originalCompetencyIdsRef.current);
                const currentIds = new Set(items.map((i) => i.competencia_id));

                const agregar = items
                    .filter((i) => !originalIds.has(i.competencia_id))
                    .map((i) => ({
                        competencia_id: i.competencia_id,
                        orden: i.orden,
                        seccion: i.seccion,
                        peso_ponderacion: i.peso_ponderacion,
                    }));

                const eliminar = [...originalIds].filter((id) => !currentIds.has(id));

                const actualizar = items
                    .filter((i) => originalIds.has(i.competencia_id))
                    .map((i) => ({
                        competencia_id: i.competencia_id,
                        orden: i.orden,
                        seccion: i.seccion,
                        peso_ponderacion: i.peso_ponderacion,
                    }));

                const pesos: Record<string, number> = {};
                items.forEach((i) => { pesos[i.competencia_id] = i.peso_ponderacion; });

                const res = await saveCompetencies(id, {
                    origen: 'manual',
                    agregar,
                    eliminar,
                    actualizar,
                    pesos,
                });
                if (!res?.success) return;
            }

            originalCompetencyIdsRef.current = items.map((i) => i.competencia_id);
            openAlert('Competencias guardadas correctamente', 'success');
            setDirtyCompetencias(false);
            setAppliedSugerenciaKey(origen);
        } finally {
            setSavingCompetencias(false);
        }
    }, [id, validateCompetencias, formData.competencias_items, origen, saveCompetencies, openAlert]);

    const saveParticipantsTab = useCallback(async (
        incrementalPayload?: { agregar: { colaborador_id: string; evaluadores?: string[] }[]; retirar: string[] },
    ) => {
        if (!id) return;
        setSavingParticipantes(true);
        try {
            const payload = incrementalPayload ?? {
                agregar: formData.personas_a_evaluar.map((cid) => ({ colaborador_id: cid })),
                retirar: [],
            };
            const res = await saveParticipants(id, {
                agregar: payload.agregar,
                retirar: payload.retirar,
                evaluadores_por_colaborador: formData.evaluadores_por_persona,
            });
            if (!res?.success) return;

            openAlert('Participantes guardados correctamente', 'success');
            setDirtyParticipantes(false);
        } finally {
            setSavingParticipantes(false);
        }
    }, [id, formData.personas_a_evaluar, formData.evaluadores_por_persona, saveParticipants, openAlert]);

    const saveEmailsTab = useCallback(async () => {
        if (!id) return;
        setSavingCorreos(true);
        try {
            const res = await saveProcessEmails(id, {
                plantillas_correo_ids: formData.templates_asociadas,
            });
            if (!res?.success) return;

            openAlert('Configuración de correos guardada correctamente', 'success');
            setDirtyCorreos(false);
        } finally {
            setSavingCorreos(false);
        }
    }, [id, formData.templates_asociadas, saveProcessEmails, openAlert]);

    return {
        evaluation,
        loading,
        dirtyGeneral,
        dirtyCompetencias,
        dirtyParticipantes,
        dirtyCorreos,
        savingGeneral,
        savingCompetencias,
        savingParticipantes,
        savingCorreos,
        formData,
        config,
        errors,
        origen,
        sugerencia,
        derivedDirty,
        activeTab,
        setActiveTab,
        totalWeight,
        personasDetalle,
        registrarPersonas,
        setServerParticipantIds,
        handleChange,
        handleToggleCompetency,
        handleUpdateCompetencyItems,
        handleWeightChange,
        handleClearCompetencies,
        handleOrigenChange,
        applySugerencias,
        handleToggleTipoEvaluacion,
        handleTipoPesoChange,
        handleCalibracionChange,
        handleCorreccionChange,
        handleToggleRevisionObligatoria,
        saveGeneral,
        saveCompetenciasTab,
        saveParticipantsTab,
        saveEmailsTab,
    };
};

export default useCompetencyEvaluationDetail;
