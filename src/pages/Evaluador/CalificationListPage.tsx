import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
} from '../../services/competencyEvaluationService';
import { useCompetencyService, Competency } from '../../services/competencyService';
import { usePersonService, Person } from '../../services/personService';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChevronDown = ({ open }: { open: boolean }) => (
    <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const IconUser = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const IconInfo = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompetencyEvaluationResponse {
    [personId: string]: {
        [competencyId: string]: number; // nivel seleccionado
    };
}

// ─── Evaluation Modal ──────────────────────────────────────────────────────────

const EvaluationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    process: CompetencyEvaluationDetail | null;
    person: Person | null;
    competencies: Competency[];
    onSave: (responses: CompetencyEvaluationResponse) => Promise<void>;
}> = ({ isOpen, onClose, process, person, competencies, onSave }) => {
    const [responses, setResponses] = useState<CompetencyEvaluationResponse>({});
    const [isSaving, setIsSaving] = useState(false);
    const { openAlert } = useUIStore();

    useEffect(() => {
        if (!person || !process) return;
        setResponses({ [person.id]: {} });
    }, [person, process]);

    const handleSelectLevel = (competencyId: string, level: number) => {
        if (!person) return;
        setResponses((prev) => ({
            ...prev,
            [person.id]: {
                ...prev[person.id],
                [competencyId]: level,
            },
        }));
    };

    const handleSave = async () => {
        if (!person || !process) return;

        // Validar que todas las competencias estén evaluadas
        const evaluatedCount = Object.keys(responses[person.id] || {}).length;
        if (evaluatedCount !== competencies.length) {
            openAlert(`Debes evaluar todas las ${competencies.length} competencias`, 'warning');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(responses);
            openAlert('Evaluación guardada correctamente', 'success');
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const evaluatedCount = Object.keys(responses[person?.id || ''] || {}).length;
    const allEvaluated = evaluatedCount === competencies.length;

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title={person && process ? `Evaluar: ${person.nombres} ${person.apellidos} - ${process.nombre}` : 'Evaluación'}
            size="lg"
        >
            <div className="space-y-6">
                {/* Progress */}
                {competencies.length > 0 && (
                    <div className="bg-base-100 border border-base-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-base-content">
                                Competencias evaluadas
                            </span>
                            <span className="text-sm font-bold text-primary">
                                {evaluatedCount}/{competencies.length}
                            </span>
                        </div>
                        <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(evaluatedCount / competencies.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                )}

                {/* Competencies */}
                <div className="space-y-4">
                    {competencies.map((comp) => {
                        const selectedLevel = responses[person?.id || '']?.[comp.id];
                        const selectedLevelObj = comp.definiciones_niveles?.find(
                            (l) => l.nivel === selectedLevel
                        );

                        return (
                            <div
                                key={comp.id}
                                className="border border-base-200 rounded-lg p-4 bg-base-50"
                            >
                                {/* Competency name */}
                                <div className="mb-3">
                                    <h4 className="font-semibold text-base-content">{comp.nombre}</h4>
                                    <p className="text-xs text-base-content/60 mt-1">
                                        {comp.descripcion}
                                    </p>
                                </div>

                                {/* Level options */}
                                <div className="space-y-2">
                                    {comp.definiciones_niveles?.map((level) => (
                                        <button
                                            key={level.nivel}
                                            type="button"
                                            onClick={() => handleSelectLevel(comp.id, level.nivel)}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                selectedLevel === level.nivel
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-base-200 hover:bg-base-100'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                                                        selectedLevel === level.nivel
                                                            ? 'bg-primary border-primary text-primary-content'
                                                            : 'border-base-300'
                                                    }`}
                                                >
                                                    {selectedLevel === level.nivel && <IconCheck />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {level.nombre}
                                                    </p>
                                                    <p className="text-xs text-base-content/60 mt-0.5">
                                                        {level.descripcion}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Selected info */}
                                {selectedLevelObj && (
                                    <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20 flex gap-2">
                                        <IconInfo />
                                        <p className="text-xs text-primary">
                                            Nivel seleccionado: <strong>{selectedLevelObj.nombre}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t border-base-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost btn-sm"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!allEvaluated || isSaving}
                        className="btn btn-primary btn-sm"
                    >
                        {isSaving ? (
                            <>
                                <span className="loading loading-spinner loading-xs" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Evaluación'
                        )}
                    </button>
                </div>
            </div>
        </GenericModal>
    );
};

// ─── Process Accordion ─────────────────────────────────────────────────────────

const ProcessAccordion: React.FC<{
    process: CompetencyEvaluationDetail;
    personsToEvaluate: Person[];
    competencies: Competency[];
    onEvaluateClick: (process: CompetencyEvaluationDetail, person: Person, competencies: Competency[]) => void;
}> = ({ process, personsToEvaluate, competencies, onEvaluateClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-base-200 rounded-xl overflow-hidden">
            {/* Header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-base-50 hover:bg-base-100 transition-colors"
            >
                <div className="text-left flex-1 min-w-0">
                    <h3 className="font-semibold text-base-content leading-tight">
                        {process.nombre}
                    </h3>
                    <p className="text-xs text-base-content/60 mt-1">
                        {competencies.length} competencias · {personsToEvaluate.length} personas por evaluar
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="badge badge-sm badge-primary">
                        {personsToEvaluate.length}
                    </span>
                    <IconChevronDown open={isOpen} />
                </div>
            </button>

            {/* Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-base-200 divide-y divide-base-100 bg-base-100">
                            {personsToEvaluate.length === 0 ? (
                                <div className="p-4 text-center text-base-content/40 text-sm">
                                    No hay personas asignadas a este proceso
                                </div>
                            ) : (
                                personsToEvaluate.map((person) => (
                                    <div
                                        key={person.id}
                                        className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <IconUser />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-base-content truncate">
                                                    {person.nombres} {person.apellidos}
                                                </p>
                                                {person.puesto_nombre && (
                                                    <p className="text-xs text-base-content/60 truncate">
                                                        {person.puesto_nombre}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onEvaluateClick(process, person, competencies)
                                            }
                                            className="btn btn-primary btn-sm shrink-0"
                                        >
                                            Evaluar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CalificationListPage: React.FC = () => {
    const { openAlert } = useUIStore();

    const { getCompetencyEvaluations } = useCompetencyEvaluationService();
    const { getCompetencies } = useCompetencyService();
    const { getPeople } = usePersonService();

    // State
    const [loading, setLoading] = useState(true);
    const [processes, setProcesses] = useState<CompetencyEvaluationDetail[]>([]);
    const [competenciesData, setCompetenciesData] = useState<Record<string, Competency>>({});
    const [personsData, setPersonsData] = useState<Record<string, Person>>({});

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<CompetencyEvaluationDetail | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedCompetencies, setSelectedCompetencies] = useState<Competency[]>([]);

    // Load initial data
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Mock evaluator for development - TODO: Replace with actual currentUser
                const MOCK_EVALUATOR_ID = 'usr_9';

                // Get processes where user is evaluator
                const processesRes = await getCompetencyEvaluations({
                    items_por_pagina: 100,
                });
                if (processesRes?.success) {
                    // Filter processes where evaluator is assigned
                    const userProcesses = (processesRes.data.evaluaciones || []).filter((p: any) =>
                        p.evaluadores_asignados?.includes(MOCK_EVALUATOR_ID)
                    );
                    setProcesses(userProcesses);
                }

                // Get all competencies
                const compRes = await getCompetencies({ items_por_pagina: 200 });
                if (compRes?.success) {
                    const compMap = (compRes.data.competencias || []).reduce(
                        (acc: any, c: Competency) => ({ ...acc, [c.id]: c }),
                        {}
                    );
                    setCompetenciesData(compMap);
                }

                // Get all persons
                const personsRes = await getPeople({ items_por_pagina: 500 });
                if (personsRes?.success) {
                    const personsMap = (personsRes.data.personas || []).reduce(
                        (acc: any, p: Person) => ({ ...acc, [p.id]: p }),
                        {}
                    );
                    setPersonsData(personsMap);
                }
            } catch (error) {
                openAlert('Error al cargar los datos', 'error');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handlers
    const handleEvaluateClick = useCallback(
        (process: CompetencyEvaluationDetail, person: Person, comps: Competency[]) => {
            setSelectedProcess(process);
            setSelectedPerson(person);
            setSelectedCompetencies(comps);
            setIsModalOpen(true);
        },
        []
    );

    const handleSaveEvaluation = async (responses: CompetencyEvaluationResponse): Promise<void> => {
        // TODO: Implement save to backend
        console.log('Saving evaluation:', responses);
        // Mock success
        return new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    };

    // Guards
    if (loading) {
        return <LoadingIndicator />;
    }

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Evaluador', to: undefined },
        { label: 'Mis Evaluaciones', to: undefined },
    ];

    return (
        <PageContainer
            title="Mis Evaluaciones de Competencias"
            subtitle="Lista de procesos de evaluación asignados y personas por evaluar"
            breadcrumbs={breadcrumbs}
        >
            {/* Empty state */}
            {processes.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-semibold text-base-content mb-2">
                            No hay evaluaciones pendientes
                        </h3>
                        <p className="text-sm text-base-content/60">
                            No tienes procesos de evaluación asignados en este momento.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {processes.map((process) => {
                        const personsToEvaluate = (process.personas_a_evaluar || [])
                            .map((personId) => personsData[personId])
                            .filter(Boolean);

                        const competencies = (process.competencias_asignadas || [])
                            .map((compId) => competenciesData[compId])
                            .filter(Boolean);

                        return (
                            <ProcessAccordion
                                key={process.id}
                                process={process}
                                personsToEvaluate={personsToEvaluate}
                                competencies={competencies}
                                onEvaluateClick={handleEvaluateClick}
                            />
                        );
                    })}
                </div>
            )}

            {/* Evaluation Modal */}
            <EvaluationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                process={selectedProcess}
                person={selectedPerson}
                competencies={selectedCompetencies}
                onSave={handleSaveEvaluation}
            />
        </PageContainer>
    );
};

export default CalificationListPage;
