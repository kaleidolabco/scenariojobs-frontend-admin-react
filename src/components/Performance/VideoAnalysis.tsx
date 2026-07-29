import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, FileText, Menu, CircleCheck } from '../../components/Common/Icon';
import { useVideoAnalysis } from '../../hooks/useVideoAnalysis';
import type { VideoAnalysisResult } from '../../hooks/useVideoAnalysis';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoAnalysisProps {
    /** Blob del video grabado. Cuando cambia, dispara el análisis automáticamente. */
    videoBlob: Blob | null;
    /** Título opcional del panel */
    videoTitle?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: string }) {
    const steps = [
        { id: 'transcribing', label: 'Transcribiendo' },
        { id: 'analyzing', label: 'Analizando' },
        { id: 'done', label: 'Listo' },
    ];

    return (
        <div className="flex items-center gap-2">
            {steps.map((s, i) => {
                const currentIdx = steps.findIndex(x => x.id === step);
                const isDone = i < currentIdx || step === 'done';
                const isActive = s.id === step;

                return (
                    <React.Fragment key={s.id}>
                        <div className="flex items-center gap-1.5">
                            <div
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    isDone
                                        ? 'bg-success'
                                        : isActive
                                        ? 'bg-primary animate-pulse'
                                        : 'bg-base-300'
                                }`}
                            />
                            <span
                                className={`text-xs transition-colors ${
                                    isActive ? 'text-base-content font-medium' : 'text-base-content/40'
                                }`}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`h-px w-6 transition-colors ${isDone ? 'bg-success' : 'bg-base-300'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function SentimentBadge({ label }: { label: 'positive' | 'neutral' | 'negative' }) {
    const config = {
        positive: { color: 'success', emoji: '😊', text: 'Positivo' },
        neutral: { color: 'warning', emoji: '😐', text: 'Neutral' },
        negative: { color: 'error', emoji: '😟', text: 'Negativo' },
    }[label];

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${config.color}/10 border border-${config.color}/20`}>
            <span className="text-base">{config.emoji}</span>
            <div>
                <p className={`text-xs font-semibold text-${config.color}`}>
                    Sentimiento: {config.text}
                </p>
            </div>
        </div>
    );
}

function CompetencyTag({ name, level }: { name: string; level: 'alta' | 'media' | 'baja' }) {
    const color = { alta: 'success', media: 'warning', baja: 'error' }[level];
    return (
        <span className={`badge badge-${color} badge-outline badge-sm gap-1`}>
            {name}
            <span className="opacity-60 text-[10px]">{level}</span>
        </span>
    );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function AnalysisSkeleton() {
    return (
        <div className="space-y-3 py-2">
            {[100, 85, 92, 70].map((w, i) => (
                <div key={i} className="h-3 bg-base-200 rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

const VideoAnalysis: React.FC<VideoAnalysisProps> = ({ videoBlob, videoTitle = 'Análisis de video' }) => {
    const { result, step, error, progress, analyze, reset } = useVideoAnalysis();
    const [activeTab, setActiveTab] = useState<'summary' | 'transcription' | 'competencies'>('summary');
    const [isExpanded, setIsExpanded] = useState(false);

    // Disparar análisis automáticamente cuando llega un blob nuevo
    React.useEffect(() => {
        if (videoBlob) {
            setIsExpanded(true);
            reset();
            analyze(videoBlob);
        }
    }, [videoBlob]);

    const isLoading = step === 'transcribing' || step === 'analyzing';

    const renderContent = (data: VideoAnalysisResult) => (
        <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
                <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                >
                    {/* Resumen */}
                    <div className="rounded-lg bg-base-100 border border-base-200 p-4">
                        <p className="text-sm text-base-content/80 leading-relaxed">
                            {data.analysis.summary}
                        </p>
                    </div>

                    {/* Puntos clave */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                            Puntos clave
                        </p>
                        <div className="space-y-2">
                            {data.analysis.keyPoints.map((point, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-base-100 border border-base-200"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                    <p className="text-sm text-base-content/70">{point}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Acciones sugeridas */}
                    {data.analysis.suggestedActions?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                                Acciones sugeridas
                            </p>
                            <div className="space-y-1">
                                {data.analysis.suggestedActions.map((action, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-base-content/70 py-1">
                                        <span className="text-primary mt-0.5">→</span>
                                        <span>{action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Alertas */}
                    {data.analysis.alertSignals?.length > 0 && (
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 space-y-1">
                            <p className="text-xs font-semibold text-warning">⚠ Señales de atención</p>
                            {data.analysis.alertSignals.map((signal, idx) => (
                                <p key={idx} className="text-xs text-warning/80">• {signal}</p>
                            ))}
                        </div>
                    )}

                    {/* Metadata */}
                    <p className="text-xs text-base-content/30">
                        ⚡ Análisis completado en {(data.durationMs / 1000).toFixed(1)}s
                        {data.transcription.duration && ` · Video: ${Math.round(data.transcription.duration)}s`}
                    </p>
                </motion.div>
            )}

            {activeTab === 'transcription' && (
                <motion.div
                    key="transcription"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                >
                    <div className="rounded-lg bg-base-100 border border-base-200 p-4 max-h-80 overflow-y-auto">
                        <p className="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">
                            {data.transcription.text}
                        </p>
                    </div>
                    <p className="text-xs text-base-content/40">
                        📝 Idioma detectado: <span className="uppercase font-medium">{data.transcription.language}</span>
                        {' · '}Transcripción generada automáticamente. Puede contener errores.
                    </p>
                </motion.div>
            )}

            {activeTab === 'competencies' && (
                <motion.div
                    key="competencies"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                >
                    {data.analysis.competencies.length === 0 ? (
                        <p className="text-sm text-base-content/50 py-4 text-center">
                            No se detectaron competencias con evidencia suficiente.
                        </p>
                    ) : (
                        data.analysis.competencies.map((comp, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                className="p-3 rounded-lg bg-base-100 border border-base-200 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <CompetencyTag name={comp.name} level={comp.level} />
                                </div>
                                <p className="text-xs text-base-content/50 italic">"{comp.evidence}"</p>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap size={20} className="text-primary" />
                    <h4 className="text-sm font-semibold">{videoTitle}</h4>
                </div>
                <div className="flex items-center gap-3">
                    {isLoading && <StepIndicator step={step} />}
                    {(step === 'done' || step === 'error') && (
                        <button
                            type="button"
                            onClick={() => { reset(); setIsExpanded(false); }}
                            className="text-xs text-base-content/40 hover:text-base-content transition-colors"
                        >
                            Limpiar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-base-content/40 hover:text-base-content transition-colors"
                        title={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                        <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Progress bar (visible durante loading) */}
            {isLoading && (
                <motion.div className="h-1 bg-base-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                </motion.div>
            )}

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        {/* Error state */}
                        {step === 'error' && (
                            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                                <p className="text-sm text-error font-medium">Error en el análisis</p>
                                <p className="text-xs text-error/70 mt-1">{error}</p>
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {isLoading && <AnalysisSkeleton />}

                        {/* Results */}
                        {result && (
                            <>
                                {/* Sentiment badge */}
                                <SentimentBadge label={result.sentiment.label} />

                                {/* Tabs */}
                                <div className="flex gap-1 p-1 bg-base-200 rounded-lg w-fit">
                                    {[
                                        { id: 'summary' as const, label: 'Resumen', icon: FileText },
                                        { id: 'competencies' as const, label: 'Competencias', icon: CircleCheck },
                                        { id: 'transcription' as const, label: 'Transcripción', icon: Menu },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                                activeTab === tab.id
                                                    ? 'bg-base-100 text-base-content shadow-sm'
                                                    : 'text-base-content/60 hover:text-base-content'
                                            }`}
                                        >
                                            <tab.icon size={14} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {renderContent(result)}
                            </>
                        )}

                        {/* Idle + no blob */}
                        {step === 'idle' && !videoBlob && (
                            <p className="text-xs text-base-content/40 py-2">
                                Graba un video para activar el análisis automático.
                            </p>
                        )}

                        {/* Footer note */}
                        {result && (
                            <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                                <p className="text-xs text-info/70">
                                    💡 Análisis generado por IA (Groq + Cerebras). Se recomienda revisar la transcripción para asegurar precisión.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default VideoAnalysis;