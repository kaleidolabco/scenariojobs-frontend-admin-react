import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GenericModal from '../Common/GenericModal';
import ConfirmationModal from '../Common/ConfirmationModal';
import Button from '../Common/Button';
import StatusBadge from '../Common/StatusBadge';
import LoadingIndicator from '../Common/LoadingIndicator';
import { CheckCircle, RotateCcw, FileClock } from '../Common/Icon';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    AssignmentDetailItem,
    AccionCalibracion,
} from '../../services/competencyEvaluationService';
import {
    CompetencyEvaluationConfig,
    DEFAULT_CONFIG,
    EstadoAsignacion,
    ESTADO_ASIGNACION_LABELS,
    ESTADO_ASIGNACION_BADGE,
    TIPO_EVALUACION_LABELS,
} from '../../services/evaluationAssignmentService';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AssignmentReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** ID de la asignación a revisar (se auto-carga con getAssignmentDetail, §9.7). */
    asignacionId: string;
    procesoId: string;
    /** Tras una acción exitosa; recibe el estado destino devuelto por el backend. */
    onDone: (nuevoEstado: string) => void;
}

const ESTADO_BADGE_MAP = Object.fromEntries(
    Object.entries(ESTADO_ASIGNACION_BADGE).map(([k, color]) => [
        k,
        { color, label: ESTADO_ASIGNACION_LABELS[k as EstadoAsignacion] },
    ])
) as Record<EstadoAsignacion, { color: string; label: string }>;

/** Estados en los que la asignación puede recibir una acción de calibración (§2.3). */
const REVIEWABLE_ESTADOS: EstadoAsignacion[] = ['COMPLETADO', 'EN_REVISION'];

interface CompetencyReviewRow {
    competencia_id: string;
    nombre: string;
    descripcion: string;
    escala_minima: number;
    escala_maxima: number;
    nivel_evaluador: number;
    nivel_calibrado: number | null;
    /** Etiqueta del nivel vigente (ej. "Medio"). */
    nivel_nombre: string | null;
    nivel_descripcion: string | null;
    fue_calibrada: boolean;
    /** Valor editable en el input (inicia en `nivel_actual` = valor vigente). */
    nivelCalibradoEdit: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AssignmentReviewModal: React.FC<AssignmentReviewModalProps> = ({
    isOpen,
    onClose,
    asignacionId,
    procesoId,
    onDone,
}) => {
    const { openAlert } = useUIStore();
    const { getAssignmentDetail, getConfig, executeCalibracion } =
        useCompetencyEvaluationService();

    const [config, setConfig] = useState<CompetencyEvaluationConfig>(DEFAULT_CONFIG);
    const [detalle, setDetalle] = useState<AssignmentDetailItem | null>(null);
    const [rows, setRows] = useState<CompetencyReviewRow[]>([]);
    const [comentario, setComentario] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'return' | null>(null);

    // ── Carga interna: detalle de la asignación (§9.7) + config del proceso ───
    const loadModalData = useCallback(async () => {
        setLoading(true);
        try {
            const [detalleRes, configRes] = await Promise.all([
                getAssignmentDetail(procesoId, asignacionId),
                getConfig(procesoId),
            ]);

            if (configRes?.success && configRes.data) {
                const cfg = configRes.data.configuracion ?? configRes.data.config;
                if (cfg) setConfig(cfg);
            }

            const detalleData: AssignmentDetailItem | null =
                detalleRes?.success && detalleRes.data?.detalle ? detalleRes.data.detalle : null;
            setDetalle(detalleData);

            setRows(
                (detalleData?.competencias ?? []).map((c) => ({
                    competencia_id: c.competencia_id,
                    nombre: c.nombre,
                    descripcion: c.descripcion ?? '',
                    escala_minima: c.escala_minima,
                    escala_maxima: c.escala_maxima,
                    nivel_evaluador: c.nivel_evaluador,
                    nivel_calibrado: c.nivel_calibrado,
                    nivel_nombre: c.nivel_nombre ?? null,
                    nivel_descripcion: c.nivel_descripcion ?? null,
                    fue_calibrada: c.fue_calibrada,
                    nivelCalibradoEdit: c.nivel_actual,
                }))
            );
        } catch (error) {
            openAlert('Error al cargar la revisión', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, asignacionId, procesoId]);

    useEffect(() => {
        if (isOpen) {
            setComentario('');
            loadModalData();
        }
    }, [isOpen, loadModalData]);

    // ── Reglas de negocio derivadas (§2.3, §2.6) ─────────────────────────────
    const estado: EstadoAsignacion | undefined = detalle?.estado;
    const hayRespuesta = detalle !== null && detalle.fecha_envio !== null;
    const esRevisable =
        detalle !== null && estado !== undefined && REVIEWABLE_ESTADOS.includes(estado) && hayRespuesta;
    const calibracionActiva = config.calibracion_rrhh?.activo === true;
    const modoEditar = config.calibracion_rrhh?.modo === 'EDITAR';
    const puedeDevolver = calibracionActiva && config.correccion?.permitir_cuando_devuelto === true;
    const puedeCalibrar = esRevisable && calibracionActiva && modoEditar;
    const puedeAprobar = esRevisable && calibracionActiva;
    const inputsHabilitados = puedeCalibrar;

    const hayCambios = useMemo(
        () => rows.some((r) => r.nivelCalibradoEdit !== (r.nivel_calibrado ?? r.nivel_evaluador)),
        [rows]
    );

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleNivelChange = (competenciaId: string, value: number, row: CompetencyReviewRow) => {
        if (Number.isNaN(value)) return;
        const clamped = Math.max(row.escala_minima, Math.min(row.escala_maxima, value));
        setRows((prev) =>
            prev.map((r) =>
                r.competencia_id === competenciaId ? { ...r, nivelCalibradoEdit: clamped } : r
            )
        );
    };

    const buildPayload = useCallback(() => {
        const competencias_calibradas: Record<string, number> = {};
        rows.forEach((r) => {
            competencias_calibradas[r.competencia_id] = r.nivelCalibradoEdit;
        });
        return {
            competencias_calibradas,
            comentario: comentario.trim() ? comentario.trim() : undefined,
        };
    }, [rows, comentario]);

    const executeAction = useCallback(
        async (accion: AccionCalibracion) => {
            setSaving(true);
            try {
                const res = await executeCalibracion(asignacionId, accion, buildPayload());
                if (res?.success) {
                    const nuevoEstado =
                        (res.data?.estado as string | undefined) ??
                        (accion === 'approve'
                            ? 'APROBADO'
                            : accion === 'return'
                              ? 'DEVUELTO'
                              : 'EN_REVISION');
                    const mensajes: Record<AccionCalibracion, string> = {
                        approve: 'Asignación aprobada correctamente',
                        calibrate: 'Calibración guardada correctamente',
                        return: 'Asignación devuelta al evaluador',
                    };
                    openAlert(mensajes[accion], 'success');
                    setConfirmAction(null);
                    onDone(nuevoEstado);
                    onClose();
                }
            } finally {
                setSaving(false);
            }
        },
        [asignacionId, executeCalibracion, buildPayload, openAlert, onDone, onClose]
    );

    const handleCalibrar = () => {
        if (!puedeCalibrar) return;
        if (!hayCambios) {
            openAlert('No has modificado ningún nivel calibrado.', 'warning');
            return;
        }
        executeAction('calibrate');
    };

    // ── Render: competencias ──────────────────────────────────────────────────
    const renderCompetencyRows = () => {
        if (!hayRespuesta) {
            return (
                <div className="flex items-center justify-center min-h-[120px]">
                    <p className="text-sm text-base-content/60">
                        Esta asignación aún no tiene respuesta del evaluador.
                    </p>
                </div>
            );
        }
        if (rows.length === 0) {
            return (
                <div className="flex items-center justify-center min-h-[120px]">
                    <p className="text-sm text-base-content/60">
                        No se encontraron competencias en la respuesta.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {rows.map((row) => (
                    <div
                        key={row.competencia_id}
                        className="p-3 bg-base-100 border border-base-200 rounded-lg"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm text-base-content">
                                        {row.nombre}
                                    </p>
                                    {row.fue_calibrada && (
                                        <span className="badge badge-warning badge-xs">
                                            Calibrada
                                        </span>
                                    )}
                                </div>
                                {row.descripcion && (
                                    <p className="text-xs text-base-content/60 mt-0.5">
                                        {row.descripcion}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-wide text-base-content/50">
                                        Evaluador
                                    </p>
                                    <span className="badge badge-primary badge-sm font-semibold">
                                        {row.nivel_evaluador}
                                    </span>
                                    {row.nivel_nombre && (
                                        <p
                                            className="text-[10px] text-base-content/50 mt-0.5"
                                            title={row.nivel_descripcion ?? undefined}
                                        >
                                            {row.nivel_nombre}
                                        </p>
                                    )}
                                </div>
                                {row.nivel_calibrado !== null && row.nivel_calibrado !== undefined && (
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-base-content/50">
                                            Calibrado
                                        </p>
                                        <span className="badge badge-warning badge-sm font-semibold">
                                            {row.nivel_calibrado}
                                        </span>
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-wide text-base-content/50">
                                        {puedeCalibrar ? 'Editar' : 'Vigente'}
                                    </p>
                                    <input
                                        type="number"
                                        min={row.escala_minima}
                                        max={row.escala_maxima}
                                        step={0.5}
                                        value={row.nivelCalibradoEdit}
                                        disabled={!inputsHabilitados}
                                        onChange={(e) =>
                                            handleNivelChange(
                                                row.competencia_id,
                                                parseFloat(e.target.value),
                                                row
                                            )
                                        }
                                        className={`input input-bordered input-xs w-20 text-center ${
                                            row.nivelCalibradoEdit !==
                                            (row.nivel_calibrado ?? row.nivel_evaluador)
                                                ? 'border-warning focus:border-warning'
                                                : ''
                                        }`}
                                    />
                                </div>
                                <div className="text-center w-14">
                                    <p className="text-[10px] uppercase tracking-wide text-base-content/50">
                                        Escala
                                    </p>
                                    <span className="text-xs text-base-content/60">
                                        / {row.escala_maxima}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ── Render: acciones ──────────────────────────────────────────────────────
    const renderActions = () => {
        if (!esRevisable) return null;

        return (
            <div className="flex gap-2 flex-wrap justify-end">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                    Cerrar
                </Button>
                {puedeDevolver && (
                    <Button
                        variant="error"
                        size="sm"
                        leftIcon={RotateCcw}
                        onClick={() => setConfirmAction('return')}
                        disabled={saving}
                    >
                        Devolver
                    </Button>
                )}
                {puedeCalibrar && (
                    <Button
                        variant="warning"
                        size="sm"
                        leftIcon={FileClock}
                        onClick={handleCalibrar}
                        disabled={saving || !hayCambios}
                        loading={saving}
                    >
                        Calibrar
                    </Button>
                )}
                {puedeAprobar && (
                    <Button
                        variant="success"
                        size="sm"
                        leftIcon={CheckCircle}
                        onClick={() => setConfirmAction('approve')}
                        disabled={saving}
                    >
                        Aprobar
                    </Button>
                )}
            </div>
        );
    };

    // ── Render principal ──────────────────────────────────────────────────────
    return (
        <>
            <GenericModal
                isOpen={isOpen}
                onClose={onClose}
                title="Revisión de evaluación"
                size="lg"
                actions={renderActions() ?? undefined}
            >
                {loading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <LoadingIndicator />
                    </div>
                ) : !detalle ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <p className="text-sm text-base-content/60">
                            No se encontró el detalle de la asignación.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Encabezado informativo */}
                        <div className="p-4 bg-base-200/60 border border-base-200 rounded-lg space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-base-content">
                                    {detalle.colaborador.nombre_completo}
                                </span>
                                {detalle.colaborador.cargo && (
                                    <span className="text-xs text-base-content/60">
                                        · {detalle.colaborador.cargo}
                                    </span>
                                )}
                                {estado && (
                                    <StatusBadge estado={estado} map={ESTADO_BADGE_MAP} size="sm" />
                                )}
                                {detalle.contador_correcciones > 0 && (
                                    <span className="badge badge-warning badge-sm">
                                        {detalle.contador_correcciones} corrección
                                        {detalle.contador_correcciones > 1 ? 'es' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-base-content/70">
                                <span>
                                    Tipo:{' '}
                                    <span className="font-medium">
                                        {TIPO_EVALUACION_LABELS[detalle.tipo] ?? detalle.tipo}
                                    </span>
                                </span>
                                <span>
                                    Evaluador:{' '}
                                    <span className="font-medium">
                                        {detalle.evaluador.nombre_completo}
                                    </span>
                                </span>
                                <span>
                                    Peso: <span className="font-medium">{detalle.peso}</span>
                                </span>
                                {detalle.jefe_directo && (
                                    <span>
                                        Jefe directo:{' '}
                                        <span className="font-medium">{detalle.jefe_directo}</span>
                                    </span>
                                )}
                                {detalle.total_calibraciones > 0 && (
                                    <span>
                                        Calibraciones:{' '}
                                        <span className="font-medium">
                                            {detalle.total_calibraciones}
                                        </span>
                                    </span>
                                )}
                                {detalle.puntaje_numerico !== null && (
                                    <span>
                                        Puntaje:{' '}
                                        <span className="font-medium">{detalle.puntaje_numerico}</span>
                                    </span>
                                )}
                                {detalle.fecha_envio && (
                                    <span>
                                        Enviada:{' '}
                                        <span className="font-medium">
                                            {new Date(detalle.fecha_envio).toLocaleString('es-ES')}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Nota según el estado / política */}
                        {!hayRespuesta && (
                            <div className="alert alert-ghost">
                                <span>
                                    Aún no hay respuesta enviada por el evaluador para esta
                                    asignación.
                                </span>
                            </div>
                        )}
                        {hayRespuesta && !esRevisable && (
                            <div className="alert alert-ghost">
                                <span>
                                    Esta asignación no admite acciones de revisión en su estado
                                    actual.{' '}
                                    {estado === 'APROBADO' && 'Ya está aprobada y es terminal.'}
                                    {estado === 'DEVUELTO' &&
                                        'Fue devuelta; el evaluador debe corregirla.'}
                                </span>
                            </div>
                        )}
                        {esRevisable && !calibracionActiva && (
                            <div className="alert alert-info">
                                <span>
                                    La calibración de RRHH está desactivada en la configuración del
                                    proceso. No se pueden ejecutar acciones sobre esta asignación.
                                </span>
                            </div>
                        )}

                        {/* Competencias */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-base-content">
                                    Competencias evaluadas
                                </h4>
                                {puedeCalibrar && (
                                    <span className="text-xs text-base-content/50">
                                        Edita la columna "Editar" para ajustar los puntajes
                                    </span>
                                )}
                            </div>
                            {renderCompetencyRows()}
                        </div>

                        {/* Comentario del evaluador */}
                        {detalle.comentarios_evaluador?.text && (
                            <div>
                                <h4 className="text-sm font-semibold text-base-content mb-1">
                                    Comentarios del evaluador
                                </h4>
                                <p className="text-sm text-base-content/70 p-3 bg-base-200/40 rounded-lg whitespace-pre-wrap">
                                    {detalle.comentarios_evaluador.text}
                                </p>
                            </div>
                        )}

                        {/* Comentario RRHH */}
                        {esRevisable && (
                            <div>
                                <h4 className="text-sm font-semibold text-base-content mb-1">
                                    Comentario de revisión (RRHH)
                                </h4>
                                <textarea
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    placeholder="Escribe aquí notas u observaciones sobre la decisión de revisión..."
                                    rows={3}
                                    className="textarea textarea-bordered w-full text-sm resize-none focus:outline-none focus:border-primary"
                                />
                            </div>
                        )}
                    </div>
                )}
            </GenericModal>

            {/* Confirmaciones */}
            {confirmAction === 'approve' && (
                <ConfirmationModal
                    isOpen
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => executeAction('approve')}
                    title="Aprobar evaluación"
                    message={
                        <p>
                            Esta acción es definitiva y no se puede deshacer. La asignación pasará a
                            estado <strong>APROBADO</strong> y quedará como resultado final.
                        </p>
                    }
                    confirmText="Aprobar definitivamente"
                    variant="info"
                />
            )}
            {confirmAction === 'return' && (
                <ConfirmationModal
                    isOpen
                    onClose={() => setConfirmAction(null)}
                    onConfirm={() => executeAction('return')}
                    title="Devolver evaluación"
                    message={
                        <p>
                            La asignación pasará a estado <strong>DEVUELTO</strong> y el evaluador
                            deberá corregir y reenviar su respuesta.
                        </p>
                    }
                    confirmText="Devolver al evaluador"
                    variant="danger"
                />
            )}
        </>
    );
};

export default AssignmentReviewModal;
