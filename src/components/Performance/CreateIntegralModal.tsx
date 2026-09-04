import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Info, X } from '../Common/Icon';
import { usePerformanceService, EvaluationCycle } from '../../services/performanceService';
import { usePersonService, Person } from '../../services/personService';
import { useIntegralEvaluationService } from '../../services/integralEvaluationService';
import { useCompetencyEvaluationService } from '../../services/competencyEvaluationService';
import { ROUTES } from '../../constants/routes';
import SelectField from '../Common/Forms/SelectField';
import Button from '../Common/Button';

interface Props {
    onSuccess: (integralId: string) => void;
    onCancel: () => void;
}

// ─── Weight row ───────────────────────────────────────────────────────────────

interface ComponentRowProps {
    title:        string;
    description:  string;
    color:        'primary' | 'secondary';
    checked:      boolean;
    peso:         number;
    onToggle:     (v: boolean) => void;
    onPesoChange: (v: number) => void;
    disabled?:    boolean;
}

const ComponentRow: React.FC<ComponentRowProps> = ({
    title, description, color, checked, peso, onToggle, onPesoChange, disabled,
}) => (
    <div className={`rounded-xl border-2 p-4 transition-all duration-150 ${
        checked
            ? color === 'primary'
                ? 'border-primary/40 bg-primary/5'
                : 'border-secondary/40 bg-secondary/5'
            : 'border-base-200 bg-base-50/50'
    }`}>
        <div className="flex items-start gap-3">
            <input
                type="checkbox"
                className={`checkbox checkbox-${color} checkbox-sm mt-0.5 shrink-0`}
                checked={checked}
                disabled={disabled}
                onChange={(e) => onToggle(e.target.checked)}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <p className={`font-semibold text-sm ${checked ? '' : 'text-base-content/50'}`}>{title}</p>
                        <p className="text-xs text-base-content/40 mt-0.5">{description}</p>
                    </div>
                    {checked && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={5}
                                value={peso}
                                onChange={(e) => onPesoChange(Math.min(100, Math.max(0, Number(e.target.value))))}
                                className={`input input-bordered input-sm w-20 text-right font-bold tabular-nums focus:border-${color}`}
                            />
                            <span className="text-sm font-semibold text-base-content/50">%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

// ─── Main modal ───────────────────────────────────────────────────────────────

const CreateIntegralModal: React.FC<Props> = ({ onSuccess, onCancel }) => {
    const { getCycles, createEvaluation, getEvaluations } = usePerformanceService();
    const { getPeople }                        = usePersonService();
    const { createIntegral }                   = useIntegralEvaluationService();
    const { getCompetencyEvaluationForPerson } = useCompetencyEvaluationService();
    const navigate = useNavigate();

    const [cycles, setCycles]       = useState<EvaluationCycle[]>([]);
    const [people, setPeople]       = useState<Person[]>([]);
    const [pSearch, setPSearch]     = useState('');
    const [selPerson, setSelPerson] = useState<Person | null>(null);
    const [selCycleId, setSelCycleId] = useState('');

    const [includeDesempeno,    setIncludeDesempeno]    = useState(true);
    const [includeCompetencias, setIncludeCompetencias] = useState(true);
    const [pesoDesempeno,    setPesoDesempeno]    = useState(60);
    const [pesoCompetencias, setPesoCompetencias] = useState(40);

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors]         = useState<Record<string, string>>({});
    const [competitionWarning, setCompetitionWarning] = useState<string | null>(null);

    // ── Data loading ──────────────────────────────────────────────────────────

    useEffect(() => {
        getCycles().then((r) => {
            if (r?.success) setCycles(r.data.ciclos.filter((c: EvaluationCycle) => c.estado !== 'CERRADO'));
        });
        getPeople({ estado: 'ACTIVO', items_por_pagina: 8 }).then((r) => {
            if (r?.success) setPeople(r.data.personas);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            getPeople({ search: pSearch || undefined, estado: 'ACTIVO', items_por_pagina: 8 }).then((r) => {
                if (r?.success) setPeople(r.data.personas);
            });
        }, 300);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pSearch]);

    // ── Weight logic ──────────────────────────────────────────────────────────

    const handleToggleDesempeno = (checked: boolean) => {
        setIncludeDesempeno(checked);
        if (checked && includeCompetencias) { setPesoDesempeno(60); setPesoCompetencias(40); }
        else if (checked)                   { setPesoDesempeno(100); setPesoCompetencias(0); }
        else if (includeCompetencias)       { setPesoDesempeno(0);   setPesoCompetencias(100); }
    };

    const handleToggleCompetencias = (checked: boolean) => {
        setIncludeCompetencias(checked);
        if (includeDesempeno && checked) { setPesoDesempeno(60); setPesoCompetencias(40); }
        else if (checked)                { setPesoDesempeno(0);  setPesoCompetencias(100); }
        else if (includeDesempeno)       { setPesoDesempeno(100); setPesoCompetencias(0); }
    };

    const handlePesoDesempenoChange = (val: number) => {
        setPesoDesempeno(val);
        if (includeCompetencias) setPesoCompetencias(100 - val);
    };

    const handlePesoCompetenciasChange = (val: number) => {
        setPesoCompetencias(val);
        if (includeDesempeno) setPesoDesempeno(100 - val);
    };

    const activePeso = (includeDesempeno ? pesoDesempeno : 0) + (includeCompetencias ? pesoCompetencias : 0);
    const pesoOk     = activePeso === 100;
    const bothActive = includeDesempeno && includeCompetencias;
    const selectedCycle = cycles.find((c) => c.id === selCycleId);

    // ── Validation ────────────────────────────────────────────────────────────

    const validate = () => {
        const e: Record<string, string> = {};
        if (!selCycleId) e.ciclo = 'Selecciona un ciclo de evaluación';
        if (!selPerson)  e.persona = 'Selecciona un colaborador';
        if (!includeDesempeno && !includeCompetencias)
            e.componentes = 'Incluye al menos un componente';
        if (!pesoOk)
            e.pesos = `Los pesos deben sumar 100%. Actualmente suman ${activePeso}%.`;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Polling for competency evaluation ─────────────────────────────────────

    useEffect(() => {
        if (!competitionWarning) return;
        
        // Poll every 2 seconds to check if competency evaluation was assigned
        const interval = setInterval(async () => {
            if (selPerson) {
                const r = await getCompetencyEvaluationForPerson(selPerson.id);
                if (r?.success && r.data.evaluacion) {
                    // Competency evaluation was found! Update state
                    setCompetitionWarning(null);
                    // Note: We don't close the modal here; user can create the integral now
                }
            }
        }, 2000);
        
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [competitionWarning, selPerson]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!validate() || !selPerson || !selectedCycle) return;

        setSubmitting(true);
        setErrors({});
        setCompetitionWarning(null);

        try {
            let desempenoEvalId:    string | undefined;
            let competenciasEvalId: string | undefined;

            // 1. Handle performance evaluation: search for existing or create new
            if (includeDesempeno) {
                // Try to find existing performance evaluation
                const existingEvals = await getEvaluations({
                    ciclo_id:  selectedCycle.id,
                    pagina:    1,
                    items_por_pagina: 100,
                });
                
                const existingDesempeno = existingEvals?.success
                    ? existingEvals.data.evaluaciones.find((e: any) => e.persona_id === selPerson.id)
                    : null;

                if (existingDesempeno) {
                    // Use existing evaluation
                    desempenoEvalId = existingDesempeno.id;
                } else {
                    // Create new evaluation
                    const r = await createEvaluation({
                        ciclo_id:             selectedCycle.id,
                        persona_id:           selPerson.id,
                        persona_nombre:       `${selPerson.nombres} ${selPerson.apellidos}`,
                        persona_departamento: selPerson.departamento,
                        persona_puesto:       selPerson.puesto_nombre,
                    });
                    if (!r?.success) throw new Error('Error al crear la evaluación de desempeño');
                    desempenoEvalId = r.data.evaluacion.id;
                }
            }

            // 2. Search for competency evaluation (don't create automatically)
            if (includeCompetencias) {
                const r = await getCompetencyEvaluationForPerson(selPerson.id);
                if (r?.success && r.data.evaluacion) {
                    // Use existing evaluation
                    competenciasEvalId = r.data.evaluacion.id;
                } else {
                    // No evaluation found - warn user but proceed
                    setCompetitionWarning(
                        `No hay evaluación de competencias asignada a ${selPerson.nombres} ${selPerson.apellidos}. ` +
                        'Puede ir a la sección de Evaluaciones de Competencias para crear o asignar una.'
                    );
                }
            }

            // 3. Create the integral record linking both
            const r = await createIntegral({
                ciclo_id:             selectedCycle.id,
                ciclo_nombre:         selectedCycle.nombre,
                persona_id:           selPerson.id,
                persona_nombre:       `${selPerson.nombres} ${selPerson.apellidos}`,
                persona_departamento: selPerson.departamento,
                persona_puesto:       selPerson.puesto_nombre,
                componentes: {
                    incluir_desempeno:    includeDesempeno,
                    peso_desempeno:       includeDesempeno    ? pesoDesempeno    : 0,
                    desempeno_eval_id:    desempenoEvalId,
                    incluir_competencias: includeCompetencias,
                    peso_competencias:    includeCompetencias ? pesoCompetencias : 0,
                    competencias_eval_id: competenciasEvalId,
                },
            });

            if (r?.success) {
                onSuccess(r.data.evaluacion.id);
            }
        } catch (err) {
            setErrors({ submit: err instanceof Error ? err.message : 'Error inesperado al crear la evaluación' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">

            {/* ── Cycle ── */}
            <SelectField
                label="Ciclo de evaluación"
                required
                value={selCycleId}
                onChange={(e) => { setSelCycleId(e.target.value); setErrors((p) => ({ ...p, ciclo: '' })); }}
                options={[
                    { value: '', label: 'Seleccionar ciclo...' },
                    ...cycles.map((c) => ({ value: c.id, label: c.nombre })),
                ]}
                error={errors.ciclo}
            />

            {/* ── Person ── */}
            <div className="space-y-2">
                <label className="label-text font-medium block">
                    Colaborador <span className="text-error">*</span>
                </label>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
                    <input
                        className="input input-bordered w-full pl-9 text-sm"
                        placeholder="Buscar colaborador..."
                        value={pSearch}
                        onChange={(e) => { setPSearch(e.target.value); setErrors((p) => ({ ...p, persona: '' })); }}
                        disabled={!!selPerson}
                    />
                </div>

                {selPerson && (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {selPerson.nombres[0]}{selPerson.apellidos[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight">{selPerson.nombres} {selPerson.apellidos}</p>
                            <p className="text-xs text-base-content/50">{selPerson.puesto_nombre} · {selPerson.departamento}</p>
                        </div>
                        <Button variant="ghost" size="xs" className="text-base-content/40 hover:text-error" onClick={() => { setSelPerson(null); setPSearch(''); }}><X size={16} /></Button>
                    </div>
                )}

                {!selPerson && people.length > 0 && (
                    <div className="border border-base-200 rounded-xl overflow-hidden divide-y divide-base-100 max-h-48 overflow-y-auto shadow-sm">
                        {people.map((p) => (
                            <button
                                key={p.id}
                                className="w-full text-left px-3 py-2.5 hover:bg-base-200/60 transition-colors flex items-center gap-2.5"
                                onClick={() => { setSelPerson(p); setPSearch(''); }}
                            >
                                <div className="w-7 h-7 rounded-full bg-base-200 text-base-content/50 flex items-center justify-center text-xs font-bold shrink-0">
                                    {p.nombres[0]}{p.apellidos[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium leading-tight">{p.nombres} {p.apellidos}</p>
                                    <p className="text-xs text-base-content/40">{p.departamento} · {p.puesto_nombre}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {errors.persona && <p className="text-error text-xs mt-1">{errors.persona}</p>}
            </div>

            {/* ── Components ── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="label-text font-medium">
                        Componentes <span className="text-error">*</span>
                    </label>
                    {bothActive && (
                        <span className="text-xs text-base-content/40">Los pesos se ajustan automáticamente</span>
                    )}
                </div>

                <ComponentRow
                    title="Evaluación de Desempeño"
                    description="Objetivos, KPIs y resultados cuantitativos"
                    color="primary"
                    checked={includeDesempeno}
                    peso={pesoDesempeno}
                    onToggle={handleToggleDesempeno}
                    onPesoChange={handlePesoDesempenoChange}
                    disabled={includeDesempeno && !includeCompetencias} // must keep at least one
                />

                <ComponentRow
                    title="Evaluación de Competencias"
                    description="Competencias técnicas y conductuales"
                    color="secondary"
                    checked={includeCompetencias}
                    peso={pesoCompetencias}
                    onToggle={handleToggleCompetencias}
                    onPesoChange={handlePesoCompetenciasChange}
                    disabled={includeCompetencias && !includeDesempeno}
                />

                {/* Peso summary bar */}
                {(includeDesempeno || includeCompetencias) && (
                    <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-base-content/50">Peso total</span>
                            <span className={pesoOk ? 'text-success' : 'text-error'}>{activePeso}% / 100%</span>
                        </div>
                        <div className="h-2 rounded-full bg-base-200 overflow-hidden flex">
                            {includeDesempeno && (
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${pesoDesempeno}%` }}
                                    title={`Desempeño: ${pesoDesempeno}%`}
                                />
                            )}
                            {includeCompetencias && (
                                <div
                                    className="h-full bg-secondary transition-all duration-300"
                                    style={{ width: `${pesoCompetencias}%` }}
                                    title={`Competencias: ${pesoCompetencias}%`}
                                />
                            )}
                        </div>
                        <p className={`text-xs ${pesoOk ? 'text-success' : 'text-error'}`}>
                            {pesoOk
                                ? '✓ Los pesos suman exactamente 100%'
                                : activePeso < 100
                                    ? `Falta ${100 - activePeso}% por asignar`
                                    : `Excede en ${activePeso - 100}%`}
                        </p>
                    </div>
                )}

                {errors.componentes && <p className="text-error text-xs">{errors.componentes}</p>}
                {errors.pesos       && <p className="text-error text-xs">{errors.pesos}</p>}
            </div>

            {/* Submit error */}
            {errors.submit && (
                <div className="alert alert-error py-2.5 text-sm">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{errors.submit}</span>
                </div>
            )}

            {/* Competency evaluation warning */}
            {competitionWarning && (
                <div className="alert alert-warning py-2.5 text-sm flex items-start gap-3">
                    <Info size={20} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium">{competitionWarning}</p>
                        <button
                            type="button"
                            className="link link-warning text-xs mt-1"
                            onClick={() => navigate(ROUTES.COMPETENCIES_EVAL)}
                        >
                            Ir a Evaluaciones de Competencias →
                        </button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-base-200">
                <Button variant="ghost" onClick={onCancel} disabled={submitting}>
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting || !pesoOk || (!includeDesempeno && !includeCompetencias)}
                    loading={submitting}
                >
                    Crear evaluación integral
                </Button>
            </div>
        </div>
    );
};

export default CreateIntegralModal;