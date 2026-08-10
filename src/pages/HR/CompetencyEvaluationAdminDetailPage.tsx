import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Tabs from '../../components/Common/Tabs';
import EmailConfigTab from '../../components/EmailConfig/EmailConfigTab';
import Button from '../../components/Common/Button';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
    CompetencyEvaluationStatus,
} from '../../services/competencyEvaluationService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import { useCategoryService, Category } from '../../services/categoryService';
import { useUserService } from '../../services/userService';
import { usePersonService } from '../../services/personService';
import { usePositionService, Position } from '../../services/positionService';
import { useJobService, Job } from '../../services/jobService';
import {
    useEvaluationAssignmentService,
    CompetencyEvaluationConfig,
    CorreccionConfig,
    TipoEvaluacion,
    DEFAULT_CONFIG,
} from '../../services/evaluationAssignmentService';

import CompetenciesTab from '../../components/CompetencyEvaluation/CompetenciesTab';
import ParticipantsTab from '../../components/CompetencyEvaluation/ParticipantsTab';
import GeneralTab from '../../components/CompetencyEvaluation/GeneralTab';
import {
    PersonRow,
    EvaluatorUser,
    EvaluadoresPorPersona,
    OrigenCompetencias,
    SugerenciaCompetencias,
    AvisoDerivacion,
    fmtPerson,
} from '../../components/CompetencyEvaluation/types';
import type { WeightMap } from '../../components/CompetencyEvaluation/CategoryGroup';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'general' | 'competencias' | 'participantes' | 'correos';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<CompetencyEvaluationStatus, string> = {
    BORRADOR: 'badge-warning',
    PUBLICADO: 'badge-success',
    ARCHIVADO: 'badge-ghost',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CompetencyEvaluationAdminDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { openAlert } = useUIStore();

    const { getCompetencyEvaluationDetail, updateCompetencyEvaluation } = useCompetencyEvaluationService();
    const { getCompetencies } = useCompetencyService();
    const { getCategories } = useCategoryService();
    const { getUsers } = useUserService();
    const { getPeople } = usePersonService();
    const { getPositions } = usePositionService();
    const { getJobs } = useJobService();
    const {
        getConfig,
        updateConfig,
        generarAsignaciones,
    } = useEvaluationAssignmentService();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [evaluation, setEvaluation] = useState<CompetencyEvaluationDetail | null>(null);

    const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [allPersons, setAllPersons] = useState<PersonRow[]>([]);
    const [allEvaluators, setAllEvaluators] = useState<EvaluatorUser[]>([]);
    const [personById, setPersonById] = useState<Record<string, any>>({});
    const [positionById, setPositionById] = useState<Record<string, Position>>({});
    const [jobById, setJobById] = useState<Record<string, Job>>({});

    // Origen de competencias: manual | desde_cargos
    const [origen, setOrigen] = useState<OrigenCompetencias>('manual');
    const [appliedParticipantKey, setAppliedParticipantKey] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<ActiveTab>('general');

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        estado: 'BORRADOR' as CompetencyEvaluationStatus,
        competencias_asignadas: [] as string[],
        weights: {} as WeightMap,
        personas_a_evaluar: [] as string[],
        evaluadores_por_persona: {} as EvaluadoresPorPersona,
        templates_asociadas: [] as string[],
    });

    const [config, setConfig] = useState<CompetencyEvaluationConfig>(DEFAULT_CONFIG);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Carga inicial ──────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            if (!id) { navigate(ROUTES.COMPETENCIES_EVAL); return; }
            setLoading(true);
            try {
                const [evalRes, compRes, catRes, usersRes, personsRes, positionsRes, jobsRes] = await Promise.all([
                    getCompetencyEvaluationDetail(id),
                    getCompetencies({ items_por_pagina: 1000 }),
                    getCategories(),
                    getUsers(),
                    getPeople({ items_por_pagina: 500 }),
                    getPositions({ items_por_pagina: 500 }),
                    getJobs({ items_por_pagina: 1000 }),
                ]);

                if (evalRes?.success) {
                    const ev = evalRes.data.evaluacion as CompetencyEvaluationDetail & {
                        weights?: WeightMap;
                        templates_asociadas?: string[];
                        evaluadores_por_persona?: EvaluadoresPorPersona;
                    };
                    setEvaluation(ev);
                    setFormData({
                        nombre: ev.nombre,
                        descripcion: ev.descripcion || '',
                        estado: ev.estado,
                        competencias_asignadas: ev.competencias_asignadas || [],
                        weights: ev.weights ?? {},
                        personas_a_evaluar: ev.personas_a_evaluar || [],
                        evaluadores_por_persona: ev.evaluadores_por_persona ?? {},
                        templates_asociadas: ev.templates_asociadas ?? [],
                    });
                    setConfig(ev.config ?? getConfig(id));
                    if (ev.origen_competencias === 'desde_cargos') setOrigen('desde_cargos');
                }
                if (compRes?.success) {
                    const list = compRes.data.competencias || compRes.data.competencias || [];
                    setAllCompetencies(list);
                }
                if (catRes?.success) setAllCategories(catRes.data.categorias || []);
                if (usersRes?.success) {
                    const usuarios = usersRes.data.usuarios || usersRes.data.datos || [];
                    setAllEvaluators(
                        usuarios.filter((u: any) => u.roles?.includes('EVALUATOR') || u.roles?.includes('EVALUADOR'))
                    );
                }
                if (personsRes?.success) {
                    const personas = personsRes.data.personas || personsRes.data.datos || [];
                    setAllPersons(personas);
                    const map: Record<string, any> = {};
                    personas.forEach((p: any) => { map[p.id] = p; });
                    setPersonById(map);
                }
                if (positionsRes?.success) {
                    const puestos = positionsRes.data.puestos || positionsRes.data.datos || [];
                    const map: Record<string, Position> = {};
                    puestos.forEach((p: Position) => { map[p.id] = p; });
                    setPositionById(map);
                }
                if (jobsRes?.success) {
                    const cargos = jobsRes.data.cargos || jobsRes.data.datos || [];
                    const map: Record<string, Job> = {};
                    cargos.forEach((j: Job) => { map[j.id] = j; });
                    setJobById(map);
                }
            } catch {
                openAlert('Error al cargar los datos', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ── Derivación de competencias desde cargos de participantes ────────────────

    const buildSugerencia = useCallback((): SugerenciaCompetencias => {
        const avisos: AvisoDerivacion[] = [];
        const pesoPorComp: Record<string, number> = {};
        const countPorComp: Record<string, number> = {};
        const expectedPorComp: Record<string, number> = {};
        const cargos = new Set<string>();

        formData.personas_a_evaluar.forEach((personaId) => {
            const persona = personById[personaId];
            const nombre = persona ? fmtPerson(persona) || personaId : personaId;
            if (!persona?.puesto_id) {
                avisos.push({ type: 'SIN_PUESTO', personaId, personaNombre: nombre, mensaje: `${nombre} no tiene un puesto asignado.` });
                return;
            }
            const puesto = positionById[persona.puesto_id];
            if (!puesto?.cargo_id) {
                avisos.push({ type: 'SIN_CARGO', personaId, personaNombre: nombre, mensaje: `${nombre} no tiene un cargo vinculado a su puesto.` });
                return;
            }
            const cargo = jobById[puesto.cargo_id];
            if (!cargo?.competencias_requeridas || cargo.competencias_requeridas.length === 0) {
                avisos.push({ type: 'SIN_COMPETENCIAS', personaId, personaNombre: nombre, mensaje: `${nombre} (${cargo?.nombre || 'cargo'}) no tiene competencias requeridas definidas.` });
                return;
            }
            cargos.add(cargo.id);
            cargo.competencias_requeridas.forEach((r) => {
                pesoPorComp[r.competencia_id] = (pesoPorComp[r.competencia_id] ?? 0) + (r.peso_ponderacion ?? 1);
                countPorComp[r.competencia_id] = (countPorComp[r.competencia_id] ?? 0) + 1;
                expectedPorComp[r.competencia_id] = Math.max(expectedPorComp[r.competencia_id] ?? 0, r.nivel_esperado ?? 0);
            });
        });

        const ids = Object.keys(pesoPorComp);
        const pesos: Record<string, number> = {};
        if (ids.length > 0) {
            const raw: Record<string, number> = {};
            ids.forEach((compId) => { raw[compId] = pesoPorComp[compId] / countPorComp[compId]; });
            const total = ids.reduce((s, compId) => s + raw[compId], 0);
            if (total === 0) {
                const base = Math.floor(100 / ids.length);
                ids.forEach((compId, i) => { pesos[compId] = base + (i === 0 ? 100 - base * ids.length : 0); });
            } else {
                const factor = 100 / total;
                let acc = 0;
                ids.forEach((compId, i) => {
                    const w = i === ids.length - 1 ? 100 - acc : raw[compId] * factor;
                    pesos[compId] = Math.round(w * 100) / 100;
                    acc += pesos[compId];
                });
            }
        }

        return {
            ids,
            pesos,
            expectedLevels: expectedPorComp,
            nCargos: cargos.size,
            nPersonas: formData.personas_a_evaluar.length,
            avisos,
        };
    }, [formData.personas_a_evaluar, personById, positionById, jobById]);

    const sugerencia = useMemo<SugerenciaCompetencias | null>(() => {
        if (origen !== 'desde_cargos') return null;
        return buildSugerencia();
    }, [origen, buildSugerencia]);

    const currentParticipantKey = [...formData.personas_a_evaluar].sort().join(',');
    const derivedDirty =
        origen === 'desde_cargos' &&
        appliedParticipantKey !== null &&
        appliedParticipantKey !== currentParticipantKey;

    const handleOrigenChange = useCallback((nuevoOrigen: OrigenCompetencias) => {
        setOrigen(nuevoOrigen);
        setIsDirty(true);
        if (nuevoOrigen === 'desde_cargos') setAppliedParticipantKey(null);
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
            return { ...prev, competencias_asignadas: ids, weights };
        });
        setAppliedParticipantKey(currentParticipantKey);
        setIsDirty(true);
    }, [sugerencia, currentParticipantKey]);

    // ── Handlers básicos ────────────────────────────────────────────────────────

    const handleChange = useCallback((field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
        setIsDirty(true);
    }, []);

    const handleToggleCompetency = useCallback((compId: string) => {
        setFormData((prev) => {
            const isSelected = prev.competencias_asignadas.includes(compId);
            const newIds = isSelected
                ? prev.competencias_asignadas.filter((c) => c !== compId)
                : [...prev.competencias_asignadas, compId];
            const newWeights = { ...prev.weights };
            if (isSelected) delete newWeights[compId];
            else newWeights[compId] = 0;
            return { ...prev, competencias_asignadas: newIds, weights: newWeights };
        });
        setIsDirty(true);
    }, []);

    const handleWeightChange = useCallback((compId: string, w: number) => {
        setFormData((prev) => ({ ...prev, weights: { ...prev.weights, [compId]: w } }));
        setIsDirty(true);
    }, []);

    const handleClearCompetencies = () => {
        setFormData((prev) => ({ ...prev, competencias_asignadas: [], weights: {} }));
        setIsDirty(true);
    };

    // ── Handlers de configuración ──────────────────────────────────────────────

    const handleToggleTipoEvaluacion = (tipo: TipoEvaluacion, activo: boolean) => {
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
        setIsDirty(true);
    };

    const handleTipoPesoChange = (tipo: TipoEvaluacion, peso: number) => {
        setConfig((prev) => ({
            ...prev,
            tipos_evaluacion: prev.tipos_evaluacion.map((t) =>
                t.tipo === tipo ? { ...t, peso: Math.min(100, Math.max(0, peso)) } : t
            ),
        }));
        setIsDirty(true);
    };

    const handleCalibracionChange = (campo: 'activo' | 'modo', value: any) => {
        setConfig((prev) => ({
            ...prev,
            calibracion_rrhh: { ...prev.calibracion_rrhh, [campo]: value },
        }));
        setIsDirty(true);
    };

    const handleCorreccionChange = (campo: keyof CorreccionConfig, value: any) => {
        setConfig((prev) => {
            const nuevaCorreccion: CorreccionConfig = { ...prev.correccion, [campo]: value };
            if (campo === 'permitir' && value === false) {
                nuevaCorreccion.permitir_voluntaria = false;
                nuevaCorreccion.permitir_cuando_devuelto = false;
                nuevaCorreccion.maximo_por_asignacion = 0;
            }
            return { ...prev, correccion: nuevaCorreccion };
        });
        setIsDirty(true);
    };

    const handleToggleRevisionObligatoria = (value: boolean) => {
        setConfig((prev) => ({ ...prev, revision_obligatoria: value }));
        setIsDirty(true);
    };

    // ── Resolución de jefe directo ─────────────────────────────────────────────

    const resolverJefesPorPersona = useCallback((): Record<string, string | null> => {
        const result: Record<string, string | null> = {};
        formData.personas_a_evaluar.forEach((personaId) => {
            result[personaId] = null;
            const persona = personById[personaId];
            if (!persona?.puesto_id) return;
            const puesto = positionById[persona.puesto_id];
            if (!puesto?.jefe_puesto_id) return;
            const puestoJefe = positionById[puesto.jefe_puesto_id];
            if (!puestoJefe) return;
            const jefePersonaId = puestoJefe.colaborador_id || puestoJefe.persona_id;
            if (!jefePersonaId) return;
            const jefePersona = personById[jefePersonaId];
            if (!jefePersona?.usuario_id) return;
            result[personaId] = jefePersona.usuario_id;
        });
        return result;
    }, [formData.personas_a_evaluar, personById, positionById]);

    // ── Validación ─────────────────────────────────────────────────────────────

    const totalWeight = formData.competencias_asignadas.reduce(
        (s, cId) => s + (formData.weights[cId] ?? 0), 0
    );

    const validate = (): boolean => {
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
        if (Object.keys(newErrors).length > 0) {
            setActiveTab('general');
            return false;
        }
        if (formData.competencias_asignadas.length > 0 && totalWeight !== 100) {
            openAlert('Los pesos de las competencias deben sumar exactamente 100%.', 'error');
            setActiveTab('competencias');
            return false;
        }
        return true;
    };

    // ── Save ───────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!validate() || !id) return;
        setSaving(true);
        try {
            const res = await updateCompetencyEvaluation(id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                estado: formData.estado,
                competencias_asignadas: formData.competencias_asignadas,
                personas_a_evaluar: formData.personas_a_evaluar,
                total_competencias: formData.competencias_asignadas.length,
                config,
                // @ts-ignore extended fields
                weights: formData.weights,
                // @ts-ignore extended fields
                origen_competencias: origen,
                evaluadores_por_persona: formData.evaluadores_por_persona,
                templates_asociadas: formData.templates_asociadas,
            });

            await updateConfig(id, config);

            const jefePorPersona = resolverJefesPorPersona();
            generarAsignaciones(
                id,
                formData.personas_a_evaluar,
                config,
                formData.evaluadores_por_persona,
                jefePorPersona,
            );

            if (res?.success) {
                openAlert('Proceso actualizado correctamente', 'success');
                setIsDirty(false);
            }
        } finally {
            setSaving(false);
        }
    };

    // ── Tabs (con badges) ──────────────────────────────────────────────────────

    const weightOk = totalWeight === 100;
    const tabsDef = [
        { id: 'general', label: 'Información General' },
        {
            id: 'competencias',
            label: 'Competencias',
            badge: (
                <span className="flex items-center gap-1 ml-1">
                    {formData.competencias_asignadas.length > 0 && (
                        <span className="badge badge-sm badge-primary">{formData.competencias_asignadas.length}</span>
                    )}
                    {formData.competencias_asignadas.length > 0 && (
                        <span className={`badge badge-sm ${weightOk ? 'badge-success' : 'badge-warning'}`}>
                            {totalWeight}%
                        </span>
                    )}
                </span>
            ),
        },
        {
            id: 'participantes',
            label: 'Participantes',
            badge: formData.personas_a_evaluar.length > 0 && (
                <span className="badge badge-sm badge-primary ml-1">{formData.personas_a_evaluar.length}</span>
            ),
        },
        { id: 'correos', label: 'Correos' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: ROLE_LABELS[UserRole.HR_MANAGER], to: undefined },
        { label: 'Evaluación de Competencias', to: ROUTES.COMPETENCIES_EVAL },
        { label: evaluation?.nombre || '…', to: undefined },
    ];

    if (loading) return <LoadingIndicator />;

    if (!evaluation) return (
        <PageContainer title="No encontrado" breadcrumbs={breadcrumbs}>
            <div className="alert alert-error max-w-md">
                <span>No se encontró la evaluación</span>
                <Button size="sm" onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)}>Volver</Button>
            </div>
        </PageContainer>
    );

    const statusLabelMap: Record<CompetencyEvaluationStatus, string> = {
        BORRADOR: 'Borrador',
        PUBLICADO: 'Publicado',
        ARCHIVADO: 'Archivado',
    };

    return (
        <PageContainer
            title={formData.nombre || evaluation.nombre}
            subtitle="Edita el proceso de evaluación de competencias"
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[formData.estado]} badge-outline font-medium`}>
                        {statusLabelMap[formData.estado]}
                    </span>
                    {isDirty && (
                        <span className="badge badge-warning badge-sm gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning-content inline-block" />
                            Sin guardar
                        </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !isDirty} loading={saving}>
                        Guardar cambios
                    </Button>
                </div>
            }
        >
            <Tabs
                tabs={tabsDef}
                activeTab={activeTab}
                onChange={(t) => setActiveTab(t as ActiveTab)}
                variant="bordered"
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                >
                    {activeTab === 'general' && (
                        <GeneralTab
                            formData={{
                                nombre: formData.nombre,
                                descripcion: formData.descripcion,
                                estado: formData.estado,
                            }}
                            config={config}
                            errors={errors}
                            onFieldChange={handleChange}
                            onTipoToggle={handleToggleTipoEvaluacion}
                            onTipoPesoChange={handleTipoPesoChange}
                            onCalibracionChange={handleCalibracionChange}
                            onCorreccionChange={handleCorreccionChange}
                            onRevisionObligatoriaToggle={handleToggleRevisionObligatoria}
                        />
                    )}

                    {activeTab === 'competencias' && (
                        <CompetenciesTab
                            allCompetencies={allCompetencies}
                            allCategories={allCategories}
                            selectedIds={formData.competencias_asignadas}
                            weights={formData.weights}
                            origen={origen}
                            onOrigenChange={handleOrigenChange}
                            sugerencia={sugerencia}
                            derivedDirty={derivedDirty}
                            onAplicar={applySugerencias}
                            onToggle={handleToggleCompetency}
                            onWeightChange={handleWeightChange}
                            onClearAll={handleClearCompetencies}
                        />
                    )}

                    {activeTab === 'participantes' && (
                        <ParticipantsTab
                            allPersons={allPersons}
                            allEvaluators={allEvaluators}
                            selectedPersonIds={formData.personas_a_evaluar}
                            evaluadoresPorPersona={formData.evaluadores_por_persona}
                            onPersonsChange={(ids) => handleChange('personas_a_evaluar', ids)}
                            onEvaluadoresPorPersonaChange={(map) => handleChange('evaluadores_por_persona', map)}
                        />
                    )}

                    {activeTab === 'correos' && evaluation && (
                        <EmailConfigTab
                            evaluationId={evaluation.id}
                            evaluationType="competencia"
                            data={{ templates_asociadas: formData.templates_asociadas }}
                            onChange={(data) => handleChange('templates_asociadas', data.templates_asociadas)}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </PageContainer>
    );
};

export default CompetencyEvaluationAdminDetailPage;
