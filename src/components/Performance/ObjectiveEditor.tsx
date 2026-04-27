import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Objective,
    ObjectiveCategory,
    ObjectiveTrend,
    ObjectiveFrequency,
    EvidenciaItem,
    OBJECTIVE_CATEGORY_LABELS,
    OBJECTIVE_FREQUENCY_LABELS,
    NOTA_LABELS,
    calcLogro,
    calcValorLogroNumerico,
    logroBadgeColor,
} from '../../services/performanceService';
import InputField    from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import SelectField   from '../Common/Forms/SelectField';
import EvidenciasTab from './EvidenciasTab';
import VideoRecorder, { RecordedVideo } from '../Common/VideoRecorder';
import VideoAnalysis from './VideoAnalysis';

// ─── Tab type ─────────────────────────────────────────────────────────────────

type EditorTab = 'definicion' | 'metricas' | 'resultado' | 'evidencias';

// ─── Options ──────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS  = Object.entries(OBJECTIVE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const FREQUENCY_OPTIONS = Object.entries(OBJECTIVE_FREQUENCY_LABELS).map(([value, label]) => ({ value, label }));
const TREND_OPTIONS = [
    { value: 'POSITIVA', label: 'Positiva (más es mejor)' },
    { value: 'NEGATIVA', label: 'Negativa (menos es mejor)' },
];
const NOTA_OPTIONS = [1, 2, 3, 4, 5].map(n => ({ value: String(n), label: `${n} — ${NOTA_LABELS[n]}` }));

// ─── Weight indicator ─────────────────────────────────────────────────────────

const WeightBar: React.FC<{ peso: number; pesoTotal: number }> = ({ pesoTotal }) => {
    const over  = pesoTotal > 100;
    const exact = pesoTotal === 100;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-base-content/60">Peso de este objetivo</span>
                <span className={`font-bold ${over ? 'text-error' : exact ? 'text-success' : 'text-warning'}`}>
                    Total: {pesoTotal}%
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-base-200 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-error' : exact ? 'bg-success' : 'bg-warning'}`}
                    style={{ width: `${Math.min(pesoTotal, 100)}%` }}
                />
            </div>
            {over && (
                <p className="text-xs text-error">El peso total supera 100%. Ajusta los pesos para continuar.</p>
            )}
        </div>
    );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ObjectiveEditorProps {
    objective:           Objective;
    pesoTotal:           number;
    evaluationCompleted: boolean;
    onUpdate:            (updated: Objective) => void;
    onDelete:            () => void;
    onLoadTemplate:      () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

const ObjectiveEditor: React.FC<ObjectiveEditorProps> = ({
    objective,
    pesoTotal,
    evaluationCompleted,
    onUpdate,
    onDelete,
    onLoadTemplate,
}) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('definicion');
    const [draft, setDraft]         = useState<Objective>(objective);
    const [logroManual, setLogroManual] = useState(false);
    const [activeCommentTab, setActiveCommentTab] = useState<'text' | 'video'>('text');
    const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);

    useEffect(() => {
        setDraft(objective);
        setLogroManual(false);
    }, [objective.id]);

    const update = (fields: Partial<Objective>) => {
        const next = { ...draft, ...fields };
        if (!logroManual && (fields.resultado !== undefined || fields.meta !== undefined || fields.tendencia !== undefined)) {
            const logro = calcLogro({ meta: next.meta, resultado: next.resultado, tendencia: next.tendencia });
            next.calificacion_logro = logro !== undefined ? Math.round(logro * 10) / 10 : undefined;
        }
        setDraft(next);
        onUpdate(next);
    };

    const handleLogroChange = (val: number) => {
        setLogroManual(true);
        const next = { ...draft, calificacion_logro: val };
        setDraft(next);
        onUpdate(next);
    };

    const resetLogro = () => {
        setLogroManual(false);
        const logro = calcLogro({ meta: draft.meta, resultado: draft.resultado, tendencia: draft.tendencia });
        const next  = { ...draft, calificacion_logro: logro !== undefined ? Math.round(logro * 10) / 10 : undefined };
        setDraft(next);
        onUpdate(next);
    };

    const disabled = evaluationCompleted;

    const countEvidencias = (draft.evidencias_evaluador?.length ?? 0) + (draft.evidencias_evaluado?.length ?? 0);

    const tabs: { id: EditorTab; label: string; badge?: string }[] = [
        { id: 'definicion',  label: 'Definición' },
        { id: 'metricas',    label: 'Métricas' },
        { id: 'resultado',   label: 'Resultado' },
        {
            id: 'evidencias',
            label: 'Evidencias',
            badge: countEvidencias > 0 ? String(countEvidencias) : undefined,
        },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <h3 className="font-bold text-base-content truncate text-lg leading-tight">
                        {draft.nombre || <span className="text-base-content/30 italic">Objetivo sin nombre</span>}
                    </h3>
                    {draft.categoria && (
                        <span className="badge badge-outline badge-sm mt-1">
                            {OBJECTIVE_CATEGORY_LABELS[draft.categoria]}
                        </span>
                    )}
                </div>
                <div className="flex gap-2 shrink-0">
                    {!disabled && (
                        <>
                            <button className="btn btn-ghost btn-sm gap-1" onClick={onLoadTemplate} title="Cargar desde plantilla">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"/>
                                </svg>
                                Plantilla
                            </button>
                            <button className="btn btn-ghost btn-sm btn-square text-error" onClick={onDelete} title="Eliminar objetivo">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-base-200 mb-5 overflow-x-auto">
                <div className="flex gap-0 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            {tab.badge && (
                                <span className="badge badge-primary badge-xs">{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">

                {/* ── Definición ── */}
                {activeTab === 'definicion' && (
                    <>
                        <InputField
                            label="Nombre del objetivo" required
                            value={draft.nombre}
                            onChange={e => update({ nombre: e.target.value })}
                            placeholder="Ej: Incrementar ventas en zona norte"
                            disabled={disabled}
                        />
                        <TextAreaField
                            label="Descripción" rows={3}
                            value={draft.descripcion ?? ''}
                            onChange={e => update({ descripcion: e.target.value })}
                            placeholder="Contexto, alcance y relevancia del objetivo..."
                            disabled={disabled}
                        />
                        <SelectField
                            label="Categoría" required
                            value={draft.categoria}
                            onChange={e => update({ categoria: e.target.value as ObjectiveCategory })}
                            options={CATEGORY_OPTIONS}
                            disabled={disabled}
                        />
                    </>
                )}

                {/* ── Métricas ── */}
                {activeTab === 'metricas' && (
                    <>
                        <InputField
                            label="Indicador" required
                            value={draft.indicador}
                            onChange={e => update({ indicador: e.target.value })}
                            placeholder="Ej: Ventas reales / Meta de ventas"
                            helpText="Qué se mide"
                            disabled={disabled}
                        />
                        <TextAreaField
                            label="Fórmula de cálculo" required rows={2}
                            value={draft.formula}
                            onChange={e => update({ formula: e.target.value })}
                            placeholder="Ej: (Ventas reales / Meta de ventas) × 100"
                            helpText="Cómo se calcula el resultado"
                            disabled={disabled}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SelectField
                                label="Tendencia" required
                                value={draft.tendencia}
                                onChange={e => update({ tendencia: e.target.value as ObjectiveTrend })}
                                options={TREND_OPTIONS}
                                helpText="Positiva = más es mejor"
                                disabled={disabled}
                            />
                            <SelectField
                                label="Frecuencia" required
                                value={draft.frecuencia}
                                onChange={e => update({ frecuencia: e.target.value as ObjectiveFrequency })}
                                options={FREQUENCY_OPTIONS}
                                disabled={disabled}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Unidad de medida" required
                                value={draft.unidad_medida}
                                onChange={e => update({ unidad_medida: e.target.value })}
                                placeholder="%, horas, $, unidades..."
                                disabled={disabled}
                            />
                            <div className="space-y-1">
                                <label className="label-text font-medium block">
                                    Meta <span className="text-error">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full focus:border-primary"
                                    value={draft.meta === 0 ? '' : draft.meta}
                                    onChange={e => update({ meta: parseFloat(e.target.value) || 0 })}
                                    placeholder="100"
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                        <div className="space-y-3 rounded-lg bg-base-200/50 p-4">
                            <div className="space-y-1">
                                <label className="label-text font-medium block">
                                    Peso (%) <span className="text-error">*</span>
                                </label>
                                <input
                                    type="number" min={1} max={100}
                                    className="input input-bordered w-full focus:border-primary"
                                    value={draft.peso === 0 ? '' : draft.peso}
                                    onChange={e => update({ peso: parseFloat(e.target.value) || 0 })}
                                    placeholder="25"
                                    disabled={disabled}
                                />
                                <p className="text-xs text-base-content/50">La suma de todos los objetivos debe ser 100%.</p>
                            </div>
                            <WeightBar peso={draft.peso} pesoTotal={pesoTotal} />
                        </div>
                    </>
                )}

                {/* ── Resultado ── */}
                {activeTab === 'resultado' && (
                    <>
                        <div className="space-y-1">
                            <label className="label-text font-medium block">
                                Resultado real <span className="text-base-content/40 font-normal text-xs">({draft.unidad_medida || 'unidad'})</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered w-full focus:border-primary"
                                value={draft.resultado ?? ''}
                                onChange={e => {
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    update({ resultado: val });
                                }}
                                placeholder={`Meta: ${draft.meta} ${draft.unidad_medida}`}
                                disabled={disabled}
                            />
                        </div>

                        <div className="rounded-xl border border-base-200 p-4 space-y-3 bg-base-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">Logro del objetivo</p>
                                    <p className="text-xs text-base-content/50">
                                        {logroManual ? 'Override manual activo' : `Auto: tendencia ${draft.tendencia?.toLowerCase()}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {draft.calificacion_logro !== undefined && (
                                        <>
                                            <div className={`badge badge-${logroBadgeColor(draft.calificacion_logro)} text-sm font-bold px-3`}>
                                                {draft.calificacion_logro.toFixed(1)}%
                                            </div>
                                            {calcValorLogroNumerico(draft.calificacion_logro) !== undefined && (
                                                <div className={`badge badge-${logroBadgeColor(draft.calificacion_logro)} text-sm font-bold px-3`}>
                                                    {calcValorLogroNumerico(draft.calificacion_logro)}/5
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {logroManual && !disabled && (
                                        <button className="btn btn-ghost btn-xs" onClick={resetLogro} title="Restablecer cálculo automático">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <input
                                type="number" min={0} max={999} step={0.1}
                                className="input input-bordered input-sm w-full"
                                value={draft.calificacion_logro ?? ''}
                                onChange={e => handleLogroChange(parseFloat(e.target.value) || 0)}
                                placeholder="Auto-calculado desde resultado y meta"
                                disabled={disabled}
                            />
                            {draft.resultado !== undefined && draft.meta > 0 && (
                                <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            (draft.calificacion_logro ?? 0) >= 100 ? 'bg-success' :
                                            (draft.calificacion_logro ?? 0) >= 80  ? 'bg-info'    :
                                            (draft.calificacion_logro ?? 0) >= 60  ? 'bg-warning'  : 'bg-error'
                                        }`}
                                        style={{ width: `${Math.min(draft.calificacion_logro ?? 0, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        <SelectField
                            label="Nota cualitativa"
                            value={String(draft.nota ?? '')}
                            onChange={e => update({ nota: e.target.value ? (parseInt(e.target.value) as 1|2|3|4|5) : undefined })}
                            options={[{ value: '', label: 'Sin calificar' }, ...NOTA_OPTIONS]}
                            helpText="Evaluación cualitativa del evaluador"
                            disabled={disabled}
                        />

                        <TextAreaField
                            label="Comentarios del evaluador" rows={3}
                            value={draft.comentarios_evaluador ?? ''}
                            onChange={e => update({ comentarios_evaluador: e.target.value })}
                            placeholder="Observaciones, contexto, logros destacados o áreas de mejora..."
                            disabled={disabled}
                        />

                        {/* Comentarios en video del evaluador */}
                        {!disabled && (
                            <div className="rounded-xl border border-base-200 p-5 space-y-4 bg-base-50/50">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-base-content">Comentario en video</h4>
                                        <p className="text-xs text-base-content/60 mt-0.5">
                                            Opcionalmente, graba un video para enriquecer tu evaluación.
                                        </p>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-1 p-1 bg-base-200 rounded-lg w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCommentTab('text')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            activeCommentTab === 'text'
                                                ? 'bg-base-100 text-base-content shadow-sm'
                                                : 'text-base-content/60 hover:text-base-content'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                        </svg>
                                        Texto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveCommentTab('video')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            activeCommentTab === 'video'
                                                ? 'bg-base-100 text-base-content shadow-sm'
                                                : 'text-base-content/60 hover:text-base-content'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Video
                                    </button>
                                </div>

                                {/* Content */}
                                <AnimatePresence mode="wait">
                                    {activeCommentTab === 'text' ? (
                                        <motion.div
                                            key="text-info"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-xs text-base-content/50"
                                        >
                                            Puedes agregar comentarios de texto en el campo anterior.
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="video"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.15 }}
                                            className="space-y-4"
                                        >
                                            <VideoRecorder
                                                onVideoRecorded={(video) => {
                                                    setRecordedVideo(video);
                                                    update({ comentarios_evaluador: `[VIDEO: ${video.duration}s]` });
                                                }}
                                                onAnalyzeVideo={(_video) => {
                                                    setIsAnalyzingVideo(true);
                                                }}
                                                isAnalyzing={isAnalyzingVideo}
                                            />
                                            {recordedVideo && (
                                                <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-xs text-success font-medium">Video grabado - se incluirá con tu evaluación</span>
                                                </div>
                                            )}
                                            
                                            {/* Video Analysis Section */}
                                            {recordedVideo && (
                                                <div className="mt-2">
                                                    <VideoAnalysis 
                                                        videoBlob={recordedVideo.blob}
                                                        videoTitle="Comentario en video" 
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Autoevaluación del evaluado — visible aquí como referencia */}
                        {(draft.autoevaluacion_comentarios || draft.autocalificacion_evaluado !== undefined) && (
                            <div className="rounded-xl border border-info/20 bg-info/5 p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-info/70">
                                    Autoevaluación del evaluado
                                </p>
                                {draft.autocalificacion_evaluado !== undefined && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-base-content/50">Autocalificación:</span>
                                        <span className={`badge badge-${logroBadgeColor(draft.autocalificacion_evaluado)} badge-sm font-bold`}>
                                            {draft.autocalificacion_evaluado.toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                                {draft.autoevaluacion_comentarios && (
                                    <p className="text-sm text-base-content/70 leading-relaxed">
                                        {draft.autoevaluacion_comentarios}
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── Evidencias ── */}
                {activeTab === 'evidencias' && (
                    <EvidenciasTab
                        evidencias={draft.evidencias_evaluador ?? []}
                        evidenciasContraparte={draft.evidencias_evaluado}
                        labelPropias="Evidencias del evaluador"
                        labelContraparte="Evidencias del evaluado"
                        readonly={disabled}
                        onChange={(items: EvidenciaItem[]) => update({ evidencias_evaluador: items })}
                    />
                )}
            </div>
        </div>
    );
};

export default ObjectiveEditor;
export type { ObjectiveEditorProps };