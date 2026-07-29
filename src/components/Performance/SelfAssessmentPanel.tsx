import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, Clock, MessageCircle, Video } from '../Common/Icon';
import {
    Objective,
    EvidenciaItem,
    OBJECTIVE_CATEGORY_LABELS,
    OBJECTIVE_FREQUENCY_LABELS,
    NOTA_LABELS,
    logroBadgeColor,
} from '../../services/performanceService';
import EvidenciasTab from './EvidenciasTab';
import VideoRecorder, { RecordedVideo } from '../Common/VideoRecorder';
import VideoAnalysis from './VideoAnalysis';

// ─── Tipo extendido para objetivos del evaluado ───────────────────────────────

export interface ObjectiveWithSelf extends Objective {
    autoevaluacion_comentarios?: string;
    evidencias_evaluado?:        EvidenciaItem[];
    autocalificacion_evaluado?:  number;
    autoevaluacion_enviada?:     boolean;
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'definicion' | 'metricas' | 'autoevaluacion' | 'evidencias' | 'resultado';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SelfAssessmentPanelProps {
    objective: ObjectiveWithSelf;
    submitted: boolean;
    onUpdate:  (updated: ObjectiveWithSelf) => void;
}

// ─── Read-only field ──────────────────────────────────────────────────────────

const ROField: React.FC<{ label: string; value?: string | number; mono?: boolean; className?: string }> = ({
    label, value, mono, className,
}) => (
    <div className={`space-y-1 ${className ?? ''}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/40">{label}</p>
        <p className={`text-sm text-base-content/80 ${mono ? 'font-mono' : ''} ${!value ? 'italic text-base-content/30' : ''}`}>
            {value ?? '—'}
        </p>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const SelfAssessmentPanel: React.FC<SelfAssessmentPanelProps> = ({
    objective,
    submitted,
    onUpdate,
}) => {
    const [tab, setTab]     = useState<Tab>('autoevaluacion');
    const [draft, setDraft] = useState<ObjectiveWithSelf>(objective);
    const [activeCommentTab, setActiveCommentTab] = useState<'text' | 'video'>('text');
    const [recordedVideo, setRecordedVideo] = useState<RecordedVideo | null>(null);
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);

    useEffect(() => {
        setDraft({
            ...objective,
            evidencias_evaluado: objective.evidencias_evaluado ?? [],
        });
        setTab('autoevaluacion');
        setRecordedVideo(null);
    }, [objective.id]);

    const update = (fields: Partial<ObjectiveWithSelf>) => {
        const next = { ...draft, ...fields };
        setDraft(next);
        onUpdate(next);
    };

    const disabled   = submitted;
    const logroEval  = objective.calificacion_logro;
    const logroSelf  = draft.autocalificacion_evaluado;

    const countEvidenciasEvaluado = draft.evidencias_evaluado?.length ?? 0;
    const hasAutoComentario       = !!draft.autoevaluacion_comentarios;

    const tabs: { id: Tab; label: string; badge?: string }[] = [
        { id: 'definicion',    label: 'Definición' },
        { id: 'metricas',      label: 'Métricas' },
        {
            id: 'autoevaluacion',
            label: 'Autoevaluación',
            badge: hasAutoComentario ? '✓' : undefined,
        },
        {
            id: 'evidencias',
            label: 'Evidencias',
            badge: countEvidenciasEvaluado > 0 ? String(countEvidenciasEvaluado) : undefined,
        },
        ...(logroEval !== undefined ? [{ id: 'resultado' as Tab, label: 'Resultado' }] : []),
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate">
                        {objective.nombre || <span className="text-base-content/30 italic">Objetivo sin nombre</span>}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-outline badge-sm">{OBJECTIVE_CATEGORY_LABELS[objective.categoria]}</span>
                        <span className="text-xs text-base-content/40">Peso: {objective.peso}%</span>
                    </div>
                </div>
                {submitted ? (
                    <div className="badge badge-success gap-1 shrink-0">
                        <Check size={12} />
                        Enviada
                    </div>
                ) : hasAutoComentario ? (
                    <div className="badge badge-warning badge-outline shrink-0">En progreso</div>
                ) : (
                    <div className="badge badge-ghost badge-outline shrink-0">Pendiente</div>
                )}
            </div>

            {/* Tab bar */}
            <div className="border-b border-base-200 mb-5">
                <div className="flex gap-0 overflow-x-auto">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                                tab === t.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                            }`}
                        >
                            {t.label}
                            {t.badge && (
                                <span className={`badge badge-xs ${t.badge === '✓' ? 'badge-success' : 'badge-primary'}`}>
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">

                {/* ── Definición (read-only) ── */}
                {tab === 'definicion' && (
                    <div className="space-y-5">
                        <div className="rounded-xl bg-base-200/50 border border-base-200 p-4 space-y-4">
                            <ROField label="Nombre" value={objective.nombre} />
                            <ROField label="Descripción" value={objective.descripcion} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ROField label="Categoría"  value={OBJECTIVE_CATEGORY_LABELS[objective.categoria]} />
                                <ROField label="Frecuencia" value={OBJECTIVE_FREQUENCY_LABELS[objective.frecuencia]} />
                            </div>
                        </div>
                            <div className="alert alert-info py-2 text-sm">
                                <Info size={16} className="shrink-0" />
                                Esta información fue configurada por tu evaluador y es de solo lectura.
                            </div>
                    </div>
                )}

                {/* ── Métricas (read-only) ── */}
                {tab === 'metricas' && (
                    <div className="rounded-xl bg-base-200/50 border border-base-200 p-4 space-y-4">
                        <ROField label="Indicador" value={objective.indicador} />
                        <ROField label="Fórmula de cálculo" value={objective.formula} mono />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ROField
                                label="Tendencia"
                                value={objective.tendencia === 'POSITIVA' ? '↑ Positiva (más es mejor)' : '↓ Negativa (menos es mejor)'}
                            />
                            <ROField label="Unidad" value={objective.unidad_medida} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-base-content/40">Meta</p>
                                <p className="text-2xl font-bold">
                                    {objective.meta}
                                    <span className="text-sm font-normal text-base-content/50 ml-1">{objective.unidad_medida}</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-base-content/40">Peso</p>
                                <p className="text-2xl font-bold">
                                    {objective.peso}<span className="text-sm font-normal text-base-content/50">%</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Autoevaluación (editable) ── */}
                {tab === 'autoevaluacion' && (
                    <div className="space-y-5">
                        {submitted && (
                            <div className="alert alert-success py-2 text-sm">
                                <Check size={16} className="shrink-0" />
                                Tu autoevaluación fue enviada y ya no puede editarse.
                            </div>
                        )}

                        {/* Autocalificación opcional */}
                        <div className="rounded-xl border border-base-200 p-4 space-y-3 bg-base-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">
                                        Mi autocalificación
                                        <span className="text-xs text-base-content/40 font-normal ml-1">(opcional)</span>
                                    </p>
                                    <p className="text-xs text-base-content/50 mt-0.5">
                                        Estima tu propio % de logro para este objetivo
                                    </p>
                                </div>
                                {logroSelf !== undefined && (
                                    <div className={`badge badge-${logroBadgeColor(logroSelf)} font-bold text-sm px-3`}>
                                        {logroSelf.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <input
                                type="number" min={0} max={999} step={0.1}
                                className="input input-bordered input-sm w-full"
                                value={draft.autocalificacion_evaluado ?? ''}
                                onChange={e => update({ autocalificacion_evaluado: parseFloat(e.target.value) || undefined })}
                                placeholder="Ej: 85.5"
                                disabled={disabled}
                            />
                            {objective.meta > 0 && objective.resultado !== undefined && (
                                <p className="text-xs text-base-content/40">
                                    Resultado registrado: {objective.resultado} {objective.unidad_medida}
                                    {logroEval !== undefined && ` → ${logroEval.toFixed(1)}%`}
                                </p>
                            )}
                        </div>

                        {/* Comentarios en texto o video */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <label className="label-text font-medium block flex-1">
                                    Mi autoevaluación
                                    <span className="text-xs text-base-content/40 font-normal ml-1">(requerida)</span>
                                </label>
                            </div>

                            {/* Tabs de Texto/Video */}
                            {!disabled && (
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
                                        <MessageCircle size={16} />
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
                                        <Video size={16} />
                                        Video
                                    </button>
                                </div>
                            )}

                            {/* Contenido de tabs */}
                            <AnimatePresence mode="wait">
                                {activeCommentTab === 'text' ? (
                                    <motion.div
                                        key="text-comment"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="space-y-2"
                                    >
                                        <textarea
                                            className="textarea textarea-bordered w-full text-sm leading-relaxed resize-none"
                                            rows={5}
                                            placeholder="Describe cómo trabajaste este objetivo, qué lograste, qué aprendiste y qué mejorarías..."
                                            value={draft.autoevaluacion_comentarios ?? ''}
                                            onChange={e => update({ autoevaluacion_comentarios: e.target.value })}
                                            disabled={disabled}
                                        />
                                        <p className="text-xs text-base-content/40">
                                            Sé específico: menciona acciones concretas, situaciones y resultados medibles.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="video-comment"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.15 }}
                                        className="space-y-4 rounded-xl border border-base-200 p-4 bg-base-50/50"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <Video size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-base-content">Graba tu autoevaluación en video</h4>
                                                <p className="text-xs text-base-content/60 mt-0.5">
                                                    Opcionalmente, puedes grabar un video para comunicar tu autoevaluación de forma más natural.
                                                </p>
                                            </div>
                                        </div>

                                        <VideoRecorder
                                            onVideoRecorded={(video) => {
                                                setRecordedVideo(video);
                                            }}
                                            onAnalyzeVideo={(_video) => {
                                                setIsAnalyzingVideo(true);
                                            }}
                                            isAnalyzing={isAnalyzingVideo}
                                        />

                                        {recordedVideo && (
                                            <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
                                                <Check size={16} className="text-success shrink-0" />
                                                <span className="text-xs text-success font-medium">
                                                    Video grabado ({recordedVideo.duration}s) - se incluirá con tu autoevaluación
                                                </span>
                                            </div>
                                        )}

                                        {/* Video Analysis Section */}
                                        {recordedVideo && (
                                            <div className="mt-2">
                                                <VideoAnalysis 
                                                    videoBlob={recordedVideo.blob}
                                                    videoTitle="Tu autoevaluación en video" 
                                                />
                                            </div>
                                        )}

                                        <p className="text-xs text-base-content/40">
                                            💡 Tip: Complementa el video con comentarios de texto en la pestaña "Texto" para proporcionar contexto adicional.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {/* ── Evidencias ── */}
                {tab === 'evidencias' && (
                    <EvidenciasTab
                        evidencias={draft.evidencias_evaluado ?? []}
                        evidenciasContraparte={objective.evidencias_evaluador}
                        labelPropias="Mis evidencias"
                        labelContraparte="Evidencias del evaluador"
                        readonly={disabled}
                        onChange={(items: EvidenciaItem[]) => update({ evidencias_evaluado: items })}
                    />
                )}

                {/* ── Resultado (solo si el evaluador calificó) ── */}
                {tab === 'resultado' && (
                    <div className="space-y-5">
                        {logroEval !== undefined ? (
                            <>
                                <div className={`rounded-xl p-5 border bg-${logroBadgeColor(logroEval)}/10 border-${logroBadgeColor(logroEval)}/20 text-center`}>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-1">Logro evaluado</p>
                                    <p className={`text-5xl font-black text-${logroBadgeColor(logroEval)}`}>
                                        {logroEval.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-base-content/50 mt-1">
                                        Meta: {objective.meta} · Resultado: {objective.resultado ?? '—'} {objective.unidad_medida}
                                    </p>
                                </div>

                                {logroSelf !== undefined && (
                                    <div className="rounded-xl border border-base-200 p-4 space-y-3 bg-base-50">
                                        <p className="text-sm font-medium">Comparativo</p>
                                        <div className="flex gap-4">
                                            <div className="flex-1 text-center">
                                                <p className="text-xs text-base-content/40 mb-1">Mi autocalificación</p>
                                                <p className={`text-2xl font-bold text-${logroBadgeColor(logroSelf)}`}>
                                                    {logroSelf.toFixed(1)}%
                                                </p>
                                            </div>
                                            <div className="w-px bg-base-200"/>
                                            <div className="flex-1 text-center">
                                                <p className="text-xs text-base-content/40 mb-1">Calificación del evaluador</p>
                                                <p className={`text-2xl font-bold text-${logroBadgeColor(logroEval)}`}>
                                                    {logroEval.toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`text-xs font-medium text-center ${
                                            Math.abs(logroSelf - logroEval) <= 10 ? 'text-success' : 'text-warning'
                                        }`}>
                                            {Math.abs(logroSelf - logroEval) <= 10
                                                ? `Diferencia de ${Math.abs(logroSelf - logroEval).toFixed(1)}% — alineados`
                                                : `Diferencia de ${Math.abs(logroSelf - logroEval).toFixed(1)}% — hay brecha`}
                                        </p>
                                    </div>
                                )}

                                {objective.nota && (
                                    <div className="rounded-xl border border-base-200 p-4 bg-base-50">
                                        <p className="text-xs text-base-content/40 mb-1 font-semibold uppercase tracking-wider">Nota cualitativa</p>
                                        <p className="text-sm font-semibold">{objective.nota} — {NOTA_LABELS[objective.nota]}</p>
                                    </div>
                                )}

                                {objective.comentarios_evaluador && (
                                    <div className="rounded-xl border border-base-200 p-4 bg-base-50">
                                        <p className="text-xs text-base-content/40 mb-2 font-semibold uppercase tracking-wider">
                                            Comentarios del evaluador
                                        </p>
                                        <p className="text-sm text-base-content/80 leading-relaxed">
                                            {objective.comentarios_evaluador}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 text-base-content/40">
                                <Clock size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Resultado aún no disponible</p>
                                <p className="text-sm mt-1">El evaluador aún no ha completado la calificación.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelfAssessmentPanel;
export type { SelfAssessmentPanelProps };