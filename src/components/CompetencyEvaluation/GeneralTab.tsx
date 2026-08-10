import React from 'react';
import FormSection from '../Common/Forms/FormSection';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import SelectField from '../Common/Forms/SelectField';
import CheckboxField from '../Common/Forms/CheckboxField';
import { CompetencyEvaluationStatus } from '../../services/competencyEvaluationService';
import {
    CompetencyEvaluationConfig,
    CorreccionConfig,
    TipoEvaluacion,
    TIPO_EVALUACION_LABELS,
} from '../../services/evaluationAssignmentService';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: CompetencyEvaluationStatus; label: string }[] = [
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'PUBLICADO', label: 'Publicado' },
    { value: 'ARCHIVADO', label: 'Archivado' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GeneralTabProps {
    formData: {
        nombre: string;
        descripcion: string;
        estado: CompetencyEvaluationStatus;
    };
    config: CompetencyEvaluationConfig;
    errors: Record<string, string>;
    onFieldChange: (field: string, value: any) => void;
    onTipoToggle: (tipo: TipoEvaluacion, activo: boolean) => void;
    onTipoPesoChange: (tipo: TipoEvaluacion, peso: number) => void;
    onCalibracionChange: (campo: 'activo' | 'modo', value: any) => void;
    onCorreccionChange: (campo: keyof CorreccionConfig, value: any) => void;
    onRevisionObligatoriaToggle: (value: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const GeneralTab: React.FC<GeneralTabProps> = ({
    formData,
    config,
    errors,
    onFieldChange,
    onTipoToggle,
    onTipoPesoChange,
    onCalibracionChange,
    onCorreccionChange,
    onRevisionObligatoriaToggle,
}) => {
    const tiposActivos = config.tipos_evaluacion.filter((t) => t.activo);
    const sumaPesosTipos = tiposActivos.reduce((s, t) => s + t.peso, 0);

    return (
        <div className="space-y-6">
            <FormSection
                title="Información del proceso"
                description="Configura los datos básicos y el estado de esta evaluación"
            >
                <div className="space-y-4 max-w-2xl">
                    <InputField
                        label="Nombre del proceso"
                        name="nombre"
                        value={formData.nombre}
                        onChange={(e) => onFieldChange('nombre', e.target.value)}
                        placeholder="Ej: Evaluación de Competencias – Líderes 2025"
                        required
                        error={errors.nombre}
                        maxLength={255}
                    />
                    <TextAreaField
                        label="Descripción"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => onFieldChange('descripcion', e.target.value)}
                        placeholder="Descripción detallada del proceso evaluativo..."
                        rows={4}
                        maxLength={1000}
                        error={errors.descripcion}
                        helpText={`${formData.descripcion.length}/1000`}
                    />
                    <div className="max-w-xs">
                        <SelectField
                            label="Estado"
                            name="estado"
                            value={formData.estado}
                            onChange={(e) => onFieldChange('estado', e.target.value as CompetencyEvaluationStatus)}
                            options={STATUS_OPTIONS}
                        />
                    </div>
                </div>
            </FormSection>

            {/* Tipos de evaluación */}
            <FormSection
                title="Tipo de evaluación"
                description="Define qué tipos de evaluador participan y su peso en la nota final."
            >
                <div className="space-y-4 max-w-2xl">
                    <div className="overflow-x-auto border border-base-200 rounded-lg">
                        <table className="table table-sm w-full">
                            <thead className="bg-base-50 text-xs text-base-content/50 uppercase tracking-wide">
                                <tr>
                                    <th className="w-10" />
                                    <th>Tipo</th>
                                    <th className="w-32">Peso (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {config.tipos_evaluacion.map((t) => (
                                    <tr key={t.tipo} className="border-b border-base-100 last:border-0">
                                        <td>
                                            <CheckboxField
                                                checked={t.activo}
                                                onChange={(c) => onTipoToggle(t.tipo, c)}
                                            />
                                        </td>
                                        <td className="font-medium text-sm">{TIPO_EVALUACION_LABELS[t.tipo]}</td>
                                        <td>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={t.peso}
                                                disabled={!t.activo}
                                                onChange={(e) => onTipoPesoChange(t.tipo, Number(e.target.value))}
                                                className="input input-bordered input-xs w-20 tabular-nums"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-base-50">
                                    <td colSpan={2} className="text-xs font-semibold text-right">Suma:</td>
                                    <td className={`text-sm font-bold tabular-nums ${sumaPesosTipos === 100 ? 'text-success' : 'text-warning'}`}>
                                        {sumaPesosTipos}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {tiposActivos.length > 0 && sumaPesosTipos !== 100 && (
                        <p className="text-xs text-warning">
                            Los pesos de tipos deben sumar 100% (actual: {sumaPesosTipos}%).
                        </p>
                    )}

                    {/* Calibración RRHH */}
                    <div className="border-t border-base-200 pt-4 space-y-3">
                        <CheckboxField
                            label="Calibración RRHH"
                            description="RRHH revisará y podrá calibrar los puntajes antes de cerrar el proceso."
                            checked={config.calibracion_rrhh.activo}
                            onChange={(c) => onCalibracionChange('activo', c)}
                        />
                        {config.calibracion_rrhh.activo && (
                            <div className="pl-8">
                                <SelectField
                                    label="Modo de calibración"
                                    name="modo_calibracion"
                                    value={config.calibracion_rrhh.modo}
                                    onChange={(e) => onCalibracionChange('modo', e.target.value)}
                                    options={[
                                        { value: 'SOLO_REVISAR', label: 'Solo revisar' },
                                        { value: 'EDITAR', label: 'Editar puntajes' },
                                    ]}
                                />
                            </div>
                        )}
                        <CheckboxField
                            label="Revisión obligatoria"
                            description="Toda asignación debe pasar por EN_REVISION antes de aprobarse."
                            checked={config.revision_obligatoria}
                            onChange={onRevisionObligatoriaToggle}
                        />
                    </div>
                </div>
            </FormSection>

            {/* Política de corrección */}
            <FormSection
                title="Política de corrección"
                description="Controla si los evaluadores pueden corregir una evaluación ya completada."
            >
                <div className="space-y-4 max-w-2xl">
                    <CheckboxField
                        label="Permitir corrección tras completar"
                        checked={config.correccion.permitir}
                        onChange={(c) => onCorreccionChange('permitir', c)}
                    />

                    {config.correccion.permitir && (
                        <div className="pl-8 space-y-3">
                            <div>
                                <label className="text-sm font-medium block mb-1">
                                    Máximo de correcciones por asignación
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        value={config.correccion.maximo_por_asignacion ?? ''}
                                        placeholder="Vacío = ilimitado"
                                        onChange={(e) => {
                                            const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                                            onCorreccionChange('maximo_por_asignacion', v);
                                        }}
                                        className="input input-bordered input-xs w-40 tabular-nums"
                                    />
                                    <span className="text-xs text-base-content/50">
                                        {config.correccion.maximo_por_asignacion === null
                                            ? 'Sin límite'
                                            : config.correccion.maximo_por_asignacion === 0
                                            ? 'Bloqueado al completar'
                                            : `${config.correccion.maximo_por_asignacion} corrección(es)`}
                                    </span>
                                </div>
                            </div>

                            <CheckboxField
                                label="Requiere re-revisión al corregir"
                                description="Al corregir, la asignación vuelve automáticamente a EN_REVISION."
                                checked={config.correccion.requiere_revision}
                                onChange={(c) => onCorreccionChange('requiere_revision', c)}
                            />

                            <CheckboxField
                                label="Permitir corrección cuando RRHH devuelve"
                                description="Al devolver, el evaluador puede corregir la asignación."
                                checked={config.correccion.permitir_cuando_devuelto}
                                onChange={(c) => onCorreccionChange('permitir_cuando_devuelto', c)}
                            />

                            <CheckboxField
                                label="Permitir corrección voluntaria"
                                description="El evaluador puede corregir desde su panel de completadas sin que RRHH devuelva."
                                checked={config.correccion.permitir_voluntaria}
                                onChange={(c) => onCorreccionChange('permitir_voluntaria', c)}
                            />
                        </div>
                    )}

                    {errors.config && (
                        <p className="text-xs text-error">{errors.config}</p>
                    )}
                </div>
            </FormSection>
        </div>
    );
};

export default GeneralTab;
