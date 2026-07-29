import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import QuestionEditor from './QuestionEditor';
import InputField from '../../components/Common/Forms/InputField';
import TextAreaField from '../../components/Common/Forms/TextAreaField';
import Button from '../../components/Common/Button';
import {
    ArrowLeft, X, Menu, Save, Check, Plus, ChevronDown, FileText
} from '../../components/Common/Icon';
import {
    useAssessmentService,
    type AssessmentDraft,
    type AssessmentStatus,
    type Section,
    type Question,
    type QuestionType,
} from '../../services/assessmentService';

// Re-export so QuestionEditor (and any other sibling) can still import from here
export type { QuestionType, AnswerOption, Question, Section, AssessmentDraft, AssessmentStatus } from '../../services/assessmentService';

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_DRAFT: AssessmentDraft = {
    nombre: 'Nueva Evaluación',
    descripcion: '',
    tipo: 'DESEMPENO',
    estado: 'BORRADOR',
    instrucciones: '',
    duracion_estimada_min: undefined,
    version: 1,
    secciones: [
        {
            id: 'sec-1',
            nombre: 'Sección 1',
            descripcion: '',
            orden: 1,
            preguntas: [],
        },
    ],
};

const MOCK_COMPETENCIAS = [
    { id: 'c1', nombre: 'Liderazgo' },
    { id: 'c2', nombre: 'Comunicación Efectiva' },
    { id: 'c3', nombre: 'Trabajo en Equipo' },
    { id: 'c4', nombre: 'Resolución de Problemas' },
    { id: 'c5', nombre: 'JavaScript' },
    { id: 'c6', nombre: 'SQL' },
    { id: 'c7', nombre: 'Inglés' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const QUESTION_TYPE_META: Record<QuestionType, { label: string; icon: string; color: string }> = {
    MULTIPLE_CHOICE_SINGLE: { label: 'Opción Múltiple (única)', icon: '◉', color: 'text-primary' },
    MULTIPLE_CHOICE_MULTI:  { label: 'Opción Múltiple (varias)', icon: '☑', color: 'text-secondary' },
    OPEN_TEXT:              { label: 'Respuesta Abierta', icon: '✏️', color: 'text-accent' },
    VIDEO_RESPONSE:         { label: 'Video Respuesta', icon: '🎥', color: 'text-error' },
    FILE_UPLOAD:            { label: 'Carga de Archivo', icon: '📎', color: 'text-warning' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Top bar del constructor
const BuilderTopBar: React.FC<{
    draft: AssessmentDraft;
    isSaving: boolean;
    onNameChange: (name: string) => void;
    onSave: () => void;
    onPublish: () => void;
    onBack: () => void;
    onTogglePanel: () => void;
    isPanelOpen: boolean;
}> = ({ draft, isSaving, onNameChange, onSave, onPublish, onBack, onTogglePanel, isPanelOpen }) => {
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(draft.nombre);

    const handleNameBlur = () => {
        setEditingName(false);
        onNameChange(nameValue || 'Sin título');
    };

    const statusColor: Record<AssessmentStatus, string> = {
        BORRADOR: 'badge-warning',
        PUBLICADO: 'badge-success',
        ARCHIVADO: 'badge-ghost',
    };

    return (
        <div className="flex items-center justify-between px-3 md:px-4 py-3 bg-base-100 border-b border-base-200 shadow-sm z-20 gap-2 md:gap-4">
            {/* Left: back + name */}
            <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
                <Button variant="ghost" size="sm" shape="square" onClick={onBack} title="Volver al listado">
                    <ArrowLeft size={20} />
                </Button>

                {/* Mobile panel toggle */}
                <Button variant="ghost" size="sm" shape="square" className="shrink-0 md:hidden" onClick={onTogglePanel} title={isPanelOpen ? 'Cerrar estructura' : 'Ver estructura'}>
                    {isPanelOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>

                <div className="flex items-center gap-1.5 min-w-0">
                    {editingName ? (
                        <input
                            autoFocus
                            className="input input-bordered input-sm font-semibold text-base-content w-36 sm:w-56 md:w-72"
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                        />
                    ) : (
                        <button
                            className="text-sm md:text-base font-semibold text-base-content hover:text-primary truncate max-w-[110px] sm:max-w-[180px] md:max-w-xs text-left"
                            onClick={() => setEditingName(true)}
                            title="Clic para editar el nombre"
                        >
                            {draft.nombre}
                        </button>
                    )}
                    <span className={`badge ${statusColor[draft.estado]} badge-sm shrink-0`}>{draft.estado}</span>
                    <span className="badge badge-ghost badge-sm font-mono hidden sm:flex shrink-0">v{draft.version}</span>
                </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                {isSaving && (
                    <span className="text-xs text-base-content/50 hidden sm:flex items-center gap-1">
                        <span className="loading loading-spinner loading-xs" />
                        Guardando...
                    </span>
                )}
                <Button variant="ghost" size="sm" onClick={onSave} disabled={isSaving} title="Guardar" leftIcon={Save}>
                    <span className="hidden sm:inline">Guardar</span>
                </Button>
                {draft.estado === 'BORRADOR' && (
                    <Button variant="primary" size="sm" onClick={onPublish} disabled={isSaving} leftIcon={Check}>
                        <span className="hidden sm:inline">Publicar</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

// Tarjeta de pregunta en el panel izquierdo
const QuestionCard: React.FC<{
    question: Question;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}> = ({ question, index, isSelected, onSelect, onDelete }) => {
    const meta = QUESTION_TYPE_META[question.tipo];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className={`group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer border transition-all duration-150 ${
                isSelected
                    ? 'bg-primary/10 border-primary/40 shadow-sm'
                    : 'bg-base-100 border-base-200 hover:border-primary/30 hover:bg-base-200/50'
            }`}
            onClick={onSelect}
        >
            {/* Number */}
            <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded shrink-0 mt-0.5 ${
                isSelected ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/60'
            }`}>
                {index + 1}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-base-content leading-snug line-clamp-2">
                    {question.enunciado || <span className="italic text-base-content/40">Sin enunciado</span>}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs ${meta.color}`}>{meta.icon}</span>
                    <span className="text-xs text-base-content/50 truncate">{meta.label}</span>
                    {question.competencia_nombre && (
                        <>
                            <span className="text-base-content/20">·</span>
                            <span className="text-xs text-base-content/50 truncate">{question.competencia_nombre}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Delete */}
            <Button
                variant="ghost" size="xs" shape="square"
                className="opacity-0 group-hover:opacity-100 shrink-0"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                title="Eliminar pregunta"
            >
                <X size={14} className="text-error" />
            </Button>
        </motion.div>
    );
};

// Panel izquierdo: árbol de secciones + preguntas
const LeftPanel: React.FC<{
    draft: AssessmentDraft;
    selectedSectionId: string | null;
    selectedQuestionId: string | null;
    onSelectQuestion: (sectionId: string, questionId: string) => void;
    onSelectSection: (sectionId: string) => void;
    onAddSection: () => void;
    onDeleteSection: (sectionId: string) => void;
    onAddQuestion: (sectionId: string, tipo: QuestionType) => void;
    onDeleteQuestion: (sectionId: string, questionId: string) => void;
    onRenameSectionInline: (sectionId: string, newName: string) => void;
    onItemSelected?: () => void;
}> = ({
    draft,
    selectedSectionId,
    selectedQuestionId,
    onSelectQuestion,
    onSelectSection,
    onAddSection,
    onDeleteSection,
    onAddQuestion,
    onDeleteQuestion,
    onRenameSectionInline,
    onItemSelected,
}) => {
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [addingQuestionTo, setAddingQuestionTo] = useState<string | null>(null);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [sectionNameInput, setSectionNameInput] = useState('');

    const toggleCollapse = (sectionId: string) => {
        setCollapsedSections((prev) => {
            const next = new Set(prev);
            next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
            return next;
        });
    };

    const totalPreguntas = draft.secciones.reduce((acc, s) => acc + s.preguntas.length, 0);

    return (
        <div className="flex flex-col h-full bg-base-200/40">
            {/* Panel header */}
            <div className="px-3 py-3 border-b border-base-200 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-base-content uppercase tracking-wider">Estructura</p>
                    <p className="text-xs text-base-content/50 mt-0.5">
                        {draft.secciones.length} secc. · {totalPreguntas} preg.
                    </p>
                </div>
                <Button variant="ghost" size="xs" className="gap-1" onClick={onAddSection} title="Agregar sección" leftIcon={Plus}>
                    Sección
                </Button>
            </div>

            {/* Sections list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <AnimatePresence>
                    {draft.secciones.map((section) => {
                        const isCollapsed = collapsedSections.has(section.id);
                        const isSectionSelected = selectedSectionId === section.id && !selectedQuestionId;

                        return (
                            <motion.div
                                key={section.id}
                                layout
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-sm"
                            >
                                {/* Section header */}
                                <div
                                    className={`flex items-center gap-1.5 px-2.5 py-2 cursor-pointer group transition-colors ${
                                        isSectionSelected ? 'bg-base-300' : 'hover:bg-base-200/70'
                                    }`}
                                    onClick={() => { onSelectSection(section.id); onItemSelected?.(); }}
                                >
                                    <Button variant="ghost" size="xs" shape="square" className="shrink-0" onClick={(e) => { e.stopPropagation(); toggleCollapse(section.id); }}>
                                        <ChevronDown size={12} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                                    </Button>

                                    {editingSectionId === section.id ? (
                                        <input
                                            autoFocus
                                            className="input input-xs input-bordered flex-1 font-medium"
                                            value={sectionNameInput}
                                            onChange={(e) => setSectionNameInput(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={() => {
                                                onRenameSectionInline(section.id, sectionNameInput || section.nombre);
                                                setEditingSectionId(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    onRenameSectionInline(section.id, sectionNameInput || section.nombre);
                                                    setEditingSectionId(null);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <span
                                            className="flex-1 text-xs font-semibold text-base-content truncate"
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                setSectionNameInput(section.nombre);
                                                setEditingSectionId(section.id);
                                            }}
                                        >
                                            {section.nombre}
                                        </span>
                                    )}

                                    <span className="text-xs text-base-content/40 shrink-0">
                                        {section.preguntas.length}
                                    </span>

                                    <Button variant="ghost" size="xs" shape="square" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => { e.stopPropagation(); onDeleteSection(section.id); }} title="Eliminar sección">
                                        <X size={12} className="text-error" />
                                    </Button>
                                </div>

                                {/* Questions */}
                                {!isCollapsed && (
                                    <div className="px-2 pb-2 space-y-1.5 pt-1">
                                        <AnimatePresence>
                                            {section.preguntas.map((q, idx) => (
                                                <QuestionCard
                                                    key={q.id}
                                                    question={q}
                                                    index={idx}
                                                    isSelected={selectedQuestionId === q.id}
                                                    onSelect={() => { onSelectQuestion(section.id, q.id); onItemSelected?.(); }}
                                                    onDelete={() => onDeleteQuestion(section.id, q.id)}
                                                />
                                            ))}
                                        </AnimatePresence>

                                        {/* Add question button / picker */}
                                        {addingQuestionTo === section.id ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="rounded-lg border border-primary/30 bg-primary/5 p-2 space-y-1"
                                            >
                                                <p className="text-xs font-semibold text-base-content/70 px-1 mb-1.5">
                                                    Tipo de pregunta:
                                                </p>
                                                {(Object.entries(QUESTION_TYPE_META) as [QuestionType, typeof QUESTION_TYPE_META[QuestionType]][]).map(
                                                    ([tipo, meta]) => (
                                                        <button
                                                            key={tipo}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/10 transition-colors text-left"
                                                            onClick={() => {
                                                                onAddQuestion(section.id, tipo);
                                                                setAddingQuestionTo(null);
                                                                onItemSelected?.();
                                                            }}
                                                        >
                                                            <span className={`text-sm ${meta.color}`}>{meta.icon}</span>
                                                            <span className="text-xs text-base-content">{meta.label}</span>
                                                        </button>
                                                    )
                                                )}
                                                <button
                                                    className="w-full text-xs text-base-content/40 hover:text-base-content mt-1 py-1"
                                                    onClick={() => setAddingQuestionTo(null)}
                                                >
                                                    Cancelar
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <button
                                                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-base-300 hover:border-primary/50 hover:bg-primary/5 text-xs text-base-content/50 hover:text-primary transition-all"
                                                onClick={() => setAddingQuestionTo(section.id)}
                                            >
                                                <Plus size={14} />
                                                Agregar pregunta
                                            </button>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {draft.secciones.length === 0 && (
                    <div className="text-center py-8 text-base-content/40">
                        <p className="text-sm">Sin secciones</p>
                        <p className="text-xs mt-1">Agrega una sección para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Panel central vacío
const EmptyEditorState: React.FC<{ onOpenPanel: () => void }> = ({ onOpenPanel }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-base-content/40">
        <div className="p-4 rounded-2xl bg-base-200 mb-4">
            <FileText size={40} className="mx-auto opacity-40" />
        </div>
        <p className="font-semibold text-base-content/60">Selecciona una pregunta</p>
        <p className="text-sm mt-1 max-w-xs">
            Elige una pregunta del panel izquierdo para editar su contenido, o agrega una nueva.
        </p>
        <Button variant="outline" size="sm" className="mt-5 md:hidden gap-2" onClick={onOpenPanel} leftIcon={Menu}>
            Ver estructura
        </Button>
    </div>
);

// Section config panel
const SectionConfigPanel: React.FC<{
    section: Section;
    onUpdate: (updates: Partial<Section>) => void;
}> = ({ section, onUpdate }) => (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        <div>
            <h2 className="text-lg font-bold text-base-content mb-1">Configurar Sección</h2>
            <p className="text-sm text-base-content/50">Define el nombre y descripción de esta sección.</p>
        </div>

        <InputField
            label="Nombre de la sección"
            required
            value={section.nombre}
            onChange={(e) => onUpdate({ nombre: e.target.value })}
            placeholder="Ej: Competencias Técnicas, Sección Psicotécnica..."
        />

        <TextAreaField
            label="Descripción"
            rows={3}
            value={section.descripcion || ''}
            onChange={(e) => onUpdate({ descripcion: e.target.value })}
            placeholder="Instrucciones o contexto para esta sección..."
            helpText="Instrucciones o contexto visible para el evaluado al comenzar esta sección."
        />

        <div className="rounded-xl bg-base-200 p-4">
            <p className="text-sm font-medium text-base-content/70">Resumen de sección</p>
            <div className="mt-2 flex gap-4 text-sm">
                <span><strong>{section.preguntas.length}</strong> preguntas</span>
                <span><strong>{section.preguntas.reduce((s, q) => s + q.peso, 0)}%</strong> de peso total</span>
            </div>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AssessmentBuilderPage: React.FC = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { openAlert } = useUIStore();
    const { getDraftById, saveDraft, publishDraft } = useAssessmentService();

    const [draft, setDraft] = useState<AssessmentDraft>(INITIAL_DRAFT);
    const [isLoading, setIsLoading] = useState(!!id);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>('sec-1');
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // ── Carga draft existente cuando hay :id en la ruta ───────────────────────

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        getDraftById(id).then((res) => {
            if (res?.success) {
                const loaded = res.data.draft as AssessmentDraft;
                setDraft(loaded);
                setSelectedSectionId(loaded.secciones[0]?.id ?? null);
                setSelectedQuestionId(null);
            } else {
                // Draft no encontrado: volver al listado
                navigate(ROUTES.ASSESSMENTS, { replace: true });
            }
            setIsLoading(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ── Draft mutation helpers ────────────────────────────────────────────────

    const updateDraft = useCallback((updater: (d: AssessmentDraft) => AssessmentDraft) => {
        setDraft((prev) => updater(prev));
    }, []);

    const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
        updateDraft((d) => ({
            ...d,
            secciones: d.secciones.map((s) => s.id === sectionId ? { ...s, ...updates } : s),
        }));
    }, [updateDraft]);

    const updateQuestion = useCallback((sectionId: string, questionId: string, updates: Partial<Question>) => {
        updateDraft((d) => ({
            ...d,
            secciones: d.secciones.map((s) =>
                s.id !== sectionId ? s : {
                    ...s,
                    preguntas: s.preguntas.map((q) => q.id === questionId ? { ...q, ...updates } : q),
                }
            ),
        }));
    }, [updateDraft]);

    // ── Section operations ────────────────────────────────────────────────────

    const handleAddSection = () => {
        const newSection: Section = {
            id: generateId(),
            nombre: `Sección ${draft.secciones.length + 1}`,
            descripcion: '',
            orden: draft.secciones.length + 1,
            preguntas: [],
        };
        updateDraft((d) => ({ ...d, secciones: [...d.secciones, newSection] }));
        setSelectedSectionId(newSection.id);
        setSelectedQuestionId(null);
    };

    const handleDeleteSection = (sectionId: string) => {
        if (draft.secciones.length === 1) {
            openAlert('Debe existir al menos una sección.', 'warning');
            return;
        }
        updateDraft((d) => ({ ...d, secciones: d.secciones.filter((s) => s.id !== sectionId) }));
        if (selectedSectionId === sectionId) {
            setSelectedSectionId(draft.secciones[0]?.id ?? null);
            setSelectedQuestionId(null);
        }
    };

    // ── Question operations ───────────────────────────────────────────────────

    const handleAddQuestion = (sectionId: string, tipo: QuestionType) => {
        const newQuestion: Question = {
            id: generateId(),
            tipo,
            enunciado: '',
            peso: 10,
            es_requerida: true,
            opciones: tipo.startsWith('MULTIPLE_CHOICE')
                ? [
                    { id: generateId(), texto: '', es_correcta: false },
                    { id: generateId(), texto: '', es_correcta: false },
                ]
                : undefined,
            calificacion_automatica: tipo.startsWith('MULTIPLE_CHOICE'),
        };
        updateDraft((d) => ({
            ...d,
            secciones: d.secciones.map((s) =>
                s.id !== sectionId ? s : { ...s, preguntas: [...s.preguntas, newQuestion] }
            ),
        }));
        setSelectedSectionId(sectionId);
        setSelectedQuestionId(newQuestion.id);
    };

    const handleDeleteQuestion = (sectionId: string, questionId: string) => {
        updateDraft((d) => ({
            ...d,
            secciones: d.secciones.map((s) =>
                s.id !== sectionId ? s : { ...s, preguntas: s.preguntas.filter((q) => q.id !== questionId) }
            ),
        }));
        if (selectedQuestionId === questionId) setSelectedQuestionId(null);
    };

    // ── Persistence ───────────────────────────────────────────────────────────

    const handleSave = async () => {
        setIsSaving(true);
        const response = await saveDraft(draft);
        if (response?.success) {
            const saved = response.data.draft as AssessmentDraft;
            // Si era nuevo, actualizar el estado local con el id asignado por el servicio
            if (!draft.id) setDraft(saved);
            openAlert('Evaluación guardada correctamente.', 'success');
        }
        setIsSaving(false);
    };

    const handlePublish = async () => {
        const totalPreguntas = draft.secciones.reduce((a, s) => a + s.preguntas.length, 0);
        if (totalPreguntas === 0) {
            openAlert('Agrega al menos una pregunta antes de publicar.', 'warning');
            return;
        }
        setIsSaving(true);
        // Si es nuevo, guardar primero para obtener un id
        let draftId = draft.id;
        if (!draftId) {
            const saveRes = await saveDraft(draft);
            if (!saveRes?.success) { setIsSaving(false); return; }
            const saved = saveRes.data.draft as AssessmentDraft;
            setDraft(saved);
            draftId = saved.id;
        }
        const res = await publishDraft(draftId!);
        if (res?.success) {
            updateDraft((d) => ({ ...d, estado: 'PUBLICADO' }));
            openAlert('Evaluación publicada exitosamente.', 'success');
        }
        setIsSaving(false);
    };

    const handleBack = () => {
        navigate(ROUTES.ASSESSMENTS);
    };

    // ── Loading screen ────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-base-200">
                <div className="flex flex-col items-center gap-3 text-base-content/50">
                    <span className="loading loading-spinner loading-lg text-primary" />
                    <p className="text-sm">Cargando evaluación...</p>
                </div>
            </div>
        );
    }

    // ── Derive selected objects ───────────────────────────────────────────────

    const selectedSection = draft.secciones.find((s) => s.id === selectedSectionId) ?? null;
    const selectedQuestion = selectedSection?.preguntas.find((q) => q.id === selectedQuestionId) ?? null;

    // Panel compartido entre drawer mobile y sidebar desktop
    const panelContent = (
        <LeftPanel
            draft={draft}
            selectedSectionId={selectedSectionId}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={(sId, qId) => { setSelectedSectionId(sId); setSelectedQuestionId(qId); }}
            onSelectSection={(sId) => { setSelectedSectionId(sId); setSelectedQuestionId(null); }}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onRenameSectionInline={(sId, name) => updateSection(sId, { nombre: name })}
            onItemSelected={() => setIsPanelOpen(false)}
        />
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-screen bg-base-200 overflow-hidden">
            {/* Top bar */}
            <BuilderTopBar
                draft={draft}
                isSaving={isSaving}
                onNameChange={(name) => updateDraft((d) => ({ ...d, nombre: name }))}
                onSave={handleSave}
                onPublish={handlePublish}
                onBack={handleBack}
                onTogglePanel={() => setIsPanelOpen((v) => !v)}
                isPanelOpen={isPanelOpen}
            />

            {/* Layout body */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* ── Mobile: drawer con overlay ── */}
                <AnimatePresence>
                    {isPanelOpen && (
                        <>
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 bg-black/40 z-30 md:hidden"
                                onClick={() => setIsPanelOpen(false)}
                            />
                            <motion.div
                                key="drawer"
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                                className="fixed left-0 bottom-0 w-72 z-40 shadow-2xl md:hidden"
                                style={{ top: '53px' }}
                            >
                                {panelContent}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* ── Desktop: sidebar fijo ── */}
                <div className="hidden md:flex w-72 shrink-0 border-r border-base-300 flex-col overflow-hidden">
                    {panelContent}
                </div>

                {/* ── Editor principal ── */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        {selectedQuestion && selectedSection ? (
                            <motion.div
                                key={selectedQuestion.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 overflow-hidden flex flex-col"
                            >
                                <QuestionEditor
                                    question={selectedQuestion}
                                    competencias={MOCK_COMPETENCIAS}
                                    onChange={(updates) =>
                                        updateQuestion(selectedSection.id, selectedQuestion.id, updates)
                                    }
                                />
                            </motion.div>
                        ) : selectedSection && !selectedQuestionId ? (
                            <motion.div
                                key={`section-${selectedSection.id}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 overflow-hidden"
                            >
                                <SectionConfigPanel
                                    section={selectedSection}
                                    onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex"
                            >
                                <EmptyEditorState onOpenPanel={() => setIsPanelOpen(true)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AssessmentBuilderPage;