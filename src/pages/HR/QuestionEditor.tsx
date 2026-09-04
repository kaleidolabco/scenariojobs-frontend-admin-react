import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X, Info } from '../../components/Common/Icon';
import type { Question, QuestionType, AnswerOption } from '../../services/assessmentService';
import Button from '../../components/Common/Button';
import InputField from '../../components/Common/Forms/InputField';
import TextAreaField from '../../components/Common/Forms/TextAreaField';
import SelectField from '../../components/Common/Forms/SelectField';
import NumberInputField from '../../components/Common/Forms/NumberInputField';
import RangeField from '../../components/Common/Forms/RangeField';

interface Competencia {
    id: string;
    nombre: string;
}

interface QuestionEditorProps {
    question: Question;
    competencias: Competencia[];
    onChange: (updates: Partial<Question>) => void;
}

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: string; description: string }> = {
    MULTIPLE_CHOICE_SINGLE: { label: 'Opción Múltiple (única)', icon: '◉', description: 'El evaluado elige una sola respuesta correcta.' },
    MULTIPLE_CHOICE_MULTI:  { label: 'Opción Múltiple (varias)', icon: '☑', description: 'El evaluado puede seleccionar múltiples respuestas.' },
    OPEN_TEXT:              { label: 'Respuesta Abierta', icon: '✏️', description: 'Respuesta escrita libre. Puede calificarse manualmente o con IA.' },
    VIDEO_RESPONSE:         { label: 'Video Respuesta', icon: '🎥', description: 'El evaluado graba un video. La IA puede transcribir y analizar.' },
    FILE_UPLOAD:            { label: 'Carga de Archivo', icon: '📎', description: 'El evaluado sube un documento entregable.' },
};

type EditorTab = 'contenido' | 'competencia' | 'calificacion' | 'ia';

const TABS: { id: EditorTab; label: string; icon: string }[] = [
    { id: 'contenido',    label: 'Contenido',   icon: '📝' },
    { id: 'competencia',  label: 'Competencia',  icon: '🎯' },
    { id: 'calificacion', label: 'Calificación', icon: '⚖️' },
    { id: 'ia',           label: 'Config. IA',   icon: '🤖' },
];

// ─── Tab: Contenido ───────────────────────────────────────────────────────────

const ContenidoTab: React.FC<{ question: Question; onChange: (u: Partial<Question>) => void }> = ({ question, onChange }) => {
    const isMultiple = question.tipo.startsWith('MULTIPLE_CHOICE');

    const handleAddOption = () => {
        const newOpt: AnswerOption = { id: generateId(), texto: '', es_correcta: false };
        onChange({ opciones: [...(question.opciones ?? []), newOpt] });
    };

    const handleUpdateOption = (optId: string, updates: Partial<AnswerOption>) =>
        onChange({ opciones: question.opciones?.map((o) => (o.id === optId ? { ...o, ...updates } : o)) });

    const handleDeleteOption = (optId: string) =>
        onChange({ opciones: question.opciones?.filter((o) => o.id !== optId) });

    const handleToggleCorrect = (optId: string) => {
        if (question.tipo === 'MULTIPLE_CHOICE_SINGLE') {
            onChange({ opciones: question.opciones?.map((o) => ({ ...o, es_correcta: o.id === optId })) });
        } else {
            handleUpdateOption(optId, { es_correcta: !question.opciones?.find((o) => o.id === optId)?.es_correcta });
        }
    };

    return (
        <div className="space-y-5">
            <TextAreaField
                label="Enunciado de la pregunta"
                required
                rows={3}
                placeholder="Escribe aquí la pregunta que verá el evaluado..."
                value={question.enunciado}
                onChange={(e) => onChange({ enunciado: e.target.value })}
            />

            <TextAreaField
                label="Contexto adicional"
                rows={2}
                placeholder="Caso práctico, fragmento de texto, información de apoyo..."
                value={question.contexto_adicional || ''}
                onChange={(e) => onChange({ contexto_adicional: e.target.value })}
                helpText="Opcional. Texto de apoyo o caso práctico visible antes de la pregunta."
            />

            {isMultiple && (
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">
                            Opciones de respuesta
                            <span className="text-xs font-normal text-base-content/50 ml-2">
                                {question.tipo === 'MULTIPLE_CHOICE_SINGLE' ? '(marca la correcta)' : '(marca todas las correctas)'}
                            </span>
                        </span>
                    </label>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {question.opciones?.map((opt, idx) => (
                                <motion.div
                                    key={opt.id}
                                    layout
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${opt.es_correcta ? 'border-success/50 bg-success/5' : 'border-base-200 bg-base-100'}`}
                                >
                                    <button
                                        type="button"
                                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${opt.es_correcta ? 'border-success bg-success text-success-content' : 'border-base-300 hover:border-success/50'}`}
                                        onClick={() => handleToggleCorrect(opt.id)}
                                    >
                                        {opt.es_correcta && <Check size={12} />}
                                    </button>
                                    <span className="text-xs font-bold text-base-content/40 w-4 shrink-0">{String.fromCharCode(65 + idx)}</span>
                                    <input
                                        className="input input-sm input-ghost flex-1 focus:input-bordered px-1"
                                        placeholder={`Opción ${String.fromCharCode(65 + idx)}`}
                                        value={opt.texto}
                                        onChange={(e) => handleUpdateOption(opt.id, { texto: e.target.value })}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        shape="square"
                                        className="text-error opacity-50 hover:opacity-100"
                                        onClick={() => handleDeleteOption(opt.id)}
                                        disabled={(question.opciones?.length ?? 0) <= 2}
                                    >
                                        <X size={14} />
                                    </Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full border border-dashed border-base-300 hover:border-primary/40"
                            onClick={handleAddOption}
                            leftIcon={Plus}
                        >
                            Agregar opción
                        </Button>
                    </div>
                </div>
            )}

            {question.tipo === 'OPEN_TEXT' && (
                <div className="alert alert-info text-sm py-3">
                    <Info size={16} className="shrink-0" />
                    <span>Las respuestas abiertas se califican manualmente o con asistencia de IA. Configura los criterios en la pestaña <strong>Config. IA</strong>.</span>
                </div>
            )}
            {question.tipo === 'VIDEO_RESPONSE' && (
                <div className="alert alert-warning text-sm py-3">
                    <span>🎥</span>
                    <span>El evaluado grabará un video desde el navegador. La IA puede transcribir y analizar expresiones. Configura en <strong>Config. IA</strong>.</span>
                </div>
            )}
            {question.tipo === 'FILE_UPLOAD' && (
                <div className="rounded-xl bg-base-200 p-4 space-y-2">
                    <p className="text-sm font-medium">Tipos de archivo aceptados</p>
                    <div className="flex flex-wrap gap-2">
                        {['PDF', 'Word', 'Excel', 'Imagen', 'PowerPoint'].map((ext) => (
                            <span key={ext} className="badge badge-ghost badge-sm">{ext}</span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 py-1">
                <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-primary"
                    id="es_requerida"
                    checked={question.es_requerida}
                    onChange={(e) => onChange({ es_requerida: e.target.checked })}
                />
                <label htmlFor="es_requerida" className="text-sm cursor-pointer">Pregunta obligatoria</label>
            </div>
        </div>
    );
};

// ─── Tab: Competencia ─────────────────────────────────────────────────────────

const CompetenciaTab: React.FC<{ question: Question; competencias: Competencia[]; onChange: (u: Partial<Question>) => void }> = ({ question, competencias, onChange }) => (
    <div className="space-y-5">
        <p className="text-sm text-base-content/70 leading-relaxed">
            Cada pregunta debe medir una <strong>competencia específica</strong>.
            Esto permite al sistema calcular el nivel obtenido por competencia y hacer el análisis de brechas.
        </p>
        <SelectField
            label="Competencia que mide esta pregunta"
            required
            value={question.competencia_id || ''}
            onChange={(e) => {
                const comp = competencias.find((c) => c.id === e.target.value);
                onChange({ competencia_id: e.target.value || undefined, competencia_nombre: comp?.nombre });
            }}
            options={[
                { value: '', label: '— Seleccionar competencia —' },
                ...competencias.map((c) => ({ value: c.id, label: c.nombre })),
            ]}
        />
        {question.competencia_id && (
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3"
            >
                <div className="p-2 rounded-lg bg-primary/10">
                    <Check size={20} className="text-primary" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-primary">{question.competencia_nombre}</p>
                    <p className="text-xs text-base-content/50">Los resultados de esta pregunta contribuirán al nivel obtenido de esta competencia.</p>
                </div>
            </motion.div>
        )}
        <div className="alert text-sm py-3">
            <Info size={16} className="shrink-0" />
            <span>¿No encuentras la competencia? Ve a <strong>Configuración → Biblioteca de Competencias</strong>.</span>
        </div>
    </div>
);

// ─── Tab: Calificación ────────────────────────────────────────────────────────

const CalificacionTab: React.FC<{ question: Question; onChange: (u: Partial<Question>) => void }> = ({ question, onChange }) => {
    const isMultiple = question.tipo.startsWith('MULTIPLE_CHOICE');
    return (
        <div className="space-y-5">
            <RangeField
                label={`Peso en la evaluación — ${question.peso}%`}
                min={0}
                max={100}
                step={5}
                value={question.peso}
                onChange={(val) => onChange({ peso: val })}
                helpText="Define cuánto aporta esta pregunta al puntaje total de la evaluación."
            />

            <NumberInputField
                label="Umbral mínimo de aprobación"
                min={0}
                max={100}
                step={1}
                value={question.umbral ?? ''}
                onChange={(val) => onChange({ umbral: val || undefined })}
                placeholder="Ej: 60"
                helpText="Opcional. Puntaje mínimo (%) para considerar esta pregunta aprobada."
            />

            {isMultiple && (
                <div className="rounded-xl bg-base-200 p-4 space-y-3">
                    <p className="text-sm font-semibold">Modo de calificación</p>
                    {[
                        { value: true,  label: 'Automática',                          desc: 'El sistema asigna el puntaje según las respuestas correctas marcadas.' },
                        { value: false, label: 'Sugerida para validación manual',     desc: 'Se calcula automáticamente, pero queda pendiente para confirmación del evaluador.' },
                    ].map((opt) => (
                        <label
                            key={String(opt.value)}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${question.calificacion_automatica === opt.value ? 'border-primary/50 bg-primary/5' : 'border-base-300 hover:border-base-400'}`}
                        >
                            <input
                                type="radio" className="radio radio-primary radio-sm mt-0.5"
                                checked={question.calificacion_automatica === opt.value}
                                onChange={() => onChange({ calificacion_automatica: opt.value })}
                            />
                            <div>
                                <p className="text-sm font-medium">{opt.label}</p>
                                <p className="text-xs text-base-content/50">{opt.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            )}

            {!isMultiple && (
                <div className="rounded-xl bg-base-200 p-4">
                    <p className="text-sm font-medium mb-1">Calificación manual / asistida por IA</p>
                    <p className="text-xs text-base-content/60 leading-relaxed">
                        Este tipo de pregunta requiere revisión humana. Configura parámetros de IA en la pestaña <strong>Config. IA</strong> para que el sistema genere sugerencias que el evaluador puede aceptar, ajustar o rechazar.
                    </p>
                </div>
            )}
        </div>
    );
};

// ─── Tab: Config. IA ──────────────────────────────────────────────────────────

const IAConfigTab: React.FC<{ question: Question; onChange: (u: Partial<Question>) => void }> = ({ question, onChange }) => {
    const [keywordInput, setKeywordInput] = useState('');
    const isAutoGraded = question.tipo.startsWith('MULTIPLE_CHOICE') && question.calificacion_automatica;

    const handleAddKeyword = () => {
        const kw = keywordInput.trim();
        if (!kw) return;
        const current = question.ayuda_ia?.keywords ?? [];
        if (!current.includes(kw)) {
            onChange({ ayuda_ia: { criterios: question.ayuda_ia?.criterios ?? '', ...question.ayuda_ia, keywords: [...current, kw] } });
        }
        setKeywordInput('');
    };

    const handleRemoveKeyword = (kw: string) =>
        onChange({ ayuda_ia: { criterios: question.ayuda_ia?.criterios ?? '', ...question.ayuda_ia, keywords: question.ayuda_ia?.keywords?.filter((k) => k !== kw) ?? [] } });

    const updateAIField = (field: keyof NonNullable<Question['ayuda_ia']>, value: string) =>
        onChange({ ayuda_ia: { keywords: [], criterios: '', ...question.ayuda_ia, [field]: value } });

    if (isAutoGraded) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-base-content/50 gap-3">
                <span className="text-4xl">⚡</span>
                <p className="font-medium text-base-content/70">Calificación 100% automática</p>
                <p className="text-sm max-w-xs">Esta pregunta no requiere asistencia de IA. Si deseas habilitarla, cambia el modo de calificación en la pestaña <strong>Calificación</strong>.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-xl bg-info/10 border border-info/20 p-4 text-sm">
                <p className="font-semibold text-info mb-1">¿Cómo funciona la IA Copiloto?</p>
                <p className="text-xs leading-relaxed text-base-content/80">
                    La IA analiza la respuesta del evaluado y genera una <strong>sugerencia de calificación con justificación</strong>.
                    El evaluador puede aceptarla, ajustarla o ignorarla. La IA actúa como guía, no como juez final.
                </p>
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold">Keywords / Conceptos clave</span>
                    <span className="label-text-alt text-base-content/40">La IA buscará estas palabras en la respuesta</span>
                </label>
                <div className="flex gap-2">
                    <InputField
                        label=""
                        placeholder="Ej: liderazgo, equipo, decisión..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                        className="input-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleAddKeyword}>Agregar</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[2rem]">
                    <AnimatePresence>
                        {question.ayuda_ia?.keywords?.map((kw) => (
                            <motion.span
                                key={kw} layout
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                className="badge badge-primary gap-1 cursor-pointer"
                                onClick={() => handleRemoveKeyword(kw)}
                            >
                                {kw}
                                <X size={12} />
                            </motion.span>
                        ))}
                    </AnimatePresence>
                    {(!question.ayuda_ia?.keywords || question.ayuda_ia.keywords.length === 0) && (
                        <span className="text-xs text-base-content/30 italic">Sin keywords definidas</span>
                    )}
                </div>
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Criterios de evaluación</span></label>
                <TextAreaField
                    label=""
                    rows={4}
                    placeholder="Describe qué hace que una respuesta sea excelente, buena, regular o insuficiente..."
                    value={question.ayuda_ia?.criterios || ''}
                    onChange={(e) => updateAIField('criterios', e.target.value)}
                />
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold">Respuesta modelo / ideal</span>
                    <span className="label-text-alt text-base-content/40">Opcional</span>
                </label>
                <TextAreaField
                    label=""
                    rows={4}
                    placeholder="Escribe la respuesta ideal. La IA la usará como referencia principal para evaluar al evaluado..."
                    value={question.ayuda_ia?.respuesta_modelo || ''}
                    onChange={(e) => updateAIField('respuesta_modelo', e.target.value)}
                />
            </div>

            {question.tipo === 'VIDEO_RESPONSE' && (
                <div className="rounded-xl bg-base-200 p-4 space-y-2">
                    <p className="text-sm font-semibold">Capacidades IA para Video</p>
                    {[
                        { icon: '🎤', label: 'Transcripción automática (Speech-to-Text)' },
                        { icon: '😊', label: 'Análisis de emociones / lenguaje no verbal' },
                        { icon: '📊', label: 'Evaluación del contenido transcripto' },
                    ].map((cap) => (
                        <div key={cap.label} className="flex items-center gap-2 text-sm">
                            <span>{cap.icon}</span>
                            <span>{cap.label}</span>
                            <span className="badge badge-success badge-xs ml-auto">Activo</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, competencias, onChange }) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('contenido');
    const meta = QUESTION_TYPE_META[question.tipo];

    return (
        <div className="flex flex-col h-full bg-base-100">
            <div className="px-5 pt-5 pb-0 border-b border-base-200 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                        <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">{meta.label}</p>
                        <p className="text-xs text-base-content/40">{meta.description}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {question.competencia_nombre && (
                            <span className="badge badge-primary badge-outline badge-sm">🎯 {question.competencia_nombre}</span>
                        )}
                        <span className="badge badge-ghost badge-sm font-mono">{question.peso}%</span>
                    </div>
                </div>
                <div className="tabs tabs-bordered -mb-px">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab tab-sm gap-1.5 ${activeTab === tab.id ? 'tab-active font-semibold' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.12 }}
                    >
                        {activeTab === 'contenido'    && <ContenidoTab   question={question} onChange={onChange} />}
                        {activeTab === 'competencia'  && <CompetenciaTab question={question} competencias={competencias} onChange={onChange} />}
                        {activeTab === 'calificacion' && <CalificacionTab question={question} onChange={onChange} />}
                        {activeTab === 'ia'           && <IAConfigTab    question={question} onChange={onChange} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuestionEditor;