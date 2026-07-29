import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
} from '../../services/competencyEvaluationService';
import { usePersonService, Person } from '../../services/personService';
import { useEvaluationResponseService } from '../../services/evaluationResponseService';
import { Eye, Check, Clock } from '../../components/Common/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationRow {
    id: string;
    processId: string;
    personId: string;
    processName: string;
    personName: string;
    personPosition: string;
    competenciesCount: number;
    status: 'completed' | 'pending';
}

// ─── Main Component ───────────────────────────────────────────────────────────

const CalificationListPage: React.FC = () => {
    const navigate = useNavigate();
    const { openAlert } = useUIStore();

    const { getCompetencyEvaluations } = useCompetencyEvaluationService();
    const { getPeople } = usePersonService();
    const { getEvaluationResponses } = useEvaluationResponseService();

    // State
    const [loading, setLoading] = useState(true);
    const [processes, setProcesses] = useState<CompetencyEvaluationDetail[]>([]);
    const [personsData, setPersonsData] = useState<Record<string, Person>>({});
    const [evaluationResponses, setEvaluationResponses] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Build evaluation rows from processes and persons
    const evaluationRows: EvaluationRow[] = useMemo(() => {
        const rows: EvaluationRow[] = [];
        
        processes.forEach((process) => {
            const personsToEvaluate = (process.personas_a_evaluar || [])
                .map((personId) => personsData[personId])
                .filter(Boolean);
            
            const competenciesCount = (process.competencias_asignadas || []).length;
            
            personsToEvaluate.forEach((person) => {
                // Determine if evaluation is completed or pending
                const processResponses = evaluationResponses[process.id];
                const personResponse = processResponses?.[person.id];
                const isCompleted = personResponse?.estado === 'COMPLETADO';
                
                rows.push({
                    id: `${process.id}_${person.id}`,
                    processId: process.id,
                    personId: person.id,
                    processName: process.nombre,
                    personName: `${person.nombres} ${person.apellidos}`,
                    personPosition: person.puesto_nombre || '-',
                    competenciesCount,
                    status: isCompleted ? 'completed' : 'pending',
                });
            });
        });
        
        return rows;
    }, [processes, personsData, evaluationResponses]);

    // Pagination object for GenericTable
    const pagination = useMemo(() => ({
        pagina: currentPage,
        limite: pageSize,
        total_paginas: Math.ceil(evaluationRows.length / pageSize),
        total: evaluationRows.length,
    }), [currentPage, pageSize, evaluationRows.length]);

    // Load initial data
    const loadData = useCallback(async () => {
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

            // Get all persons
            const personsRes = await getPeople({ items_por_pagina: 500 });
            if (personsRes?.success) {
                const personsMap = (personsRes.data.personas || []).reduce(
                    (acc: any, p: Person) => ({ ...acc, [p.id]: p }),
                    {}
                );
                setPersonsData(personsMap);
            }

            // Load evaluation responses for this evaluator
            const responsesRes = await getEvaluationResponses({
                evaluador_id: MOCK_EVALUATOR_ID,
                items_por_pagina: 500,
            });
            //console.log('CalificationListPage - Loaded responses:', responsesRes);
            
            if (responsesRes?.success) {
                const responsesMap: any = {};
                (responsesRes.data.respuestas || []).forEach((resp: any) => {
                    if (!responsesMap[resp.proceso_id]) {
                        responsesMap[resp.proceso_id] = {};
                    }
                    responsesMap[resp.proceso_id][resp.persona_id] = resp;
                });
                //console.log('CalificationListPage - Responses map:', responsesMap);
                setEvaluationResponses(responsesMap);
            }
        } catch (error) {
            openAlert('Error al cargar los datos', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data on component mount and navigation back
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sort rows
    const sortedRows = useMemo(() => {
        let sorted = [...evaluationRows];
        
        if (sortConfig) {
            sorted.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof EvaluationRow] ?? '';
                const bValue = b[sortConfig.key as keyof EvaluationRow] ?? '';
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return sorted;
    }, [evaluationRows, sortConfig]);

    // Paginate rows
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedRows.slice(startIndex, startIndex + pageSize);
    }, [sortedRows, currentPage, pageSize]);

    // Table columns
    const columns: TableColumn<EvaluationRow>[] = [
        {
            key: 'processName',
            label: 'Proceso de Evaluación',
            sortable: true,
        },
        {
            key: 'personName',
            label: 'Persona a Evaluar',
            sortable: true,
        },
        {
            key: 'personPosition',
            label: 'Puesto',
            sortable: true,
        },
        {
            key: 'competenciesCount',
            label: 'Competencias',
            sortable: true,
            render: (row) => (
                <span className="badge badge-sm badge-primary">{row.competenciesCount}</span>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-2">
                    {row.status === 'completed' ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-success"></div>
                            <span className="badge badge-sm badge-success gap-1">
                                <Check size={16} />
                                Completado
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-warning"></div>
                            <span className="badge badge-sm badge-warning gap-1">
                                <Clock size={16} />
                                Pendiente
                            </span>
                        </>
                    )}
                </div>
            ),
        },
    ];

    // Table actions
    const actions: TableAction<EvaluationRow>[] = [
        {
            label: 'Evaluar',
            icon: <Eye size={16} />,
            onClick: (row) => {
                navigate(`${ROUTES.GRADING_DETAIL(row.processId)}?personId=${row.personId}`);
            },
            variant: 'primary',
            tooltip: 'Ir a evaluar esta persona',
        },
    ];

    // Handlers
    const handleSort = (key: string) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                return {
                    key,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    // Guards
    if (loading) {
        return <LoadingIndicator />;
    }

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: ROLE_LABELS[UserRole.EVALUATOR], to: undefined },
        { label: 'Mis Evaluaciones', to: undefined },
    ];

    return (
        <PageContainer
            title="Mis Evaluaciones de Competencias"
            subtitle="Lista de procesos de evaluación asignados y personas a evaluar"
            breadcrumbs={breadcrumbs}
        >
            {/* Empty state */}
            {evaluationRows.length === 0 ? (
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
                <GenericTable<EvaluationRow>
                    data={paginatedRows}
                    columns={columns}
                    actions={actions}
                    keyExtractor={(row) => row.id}
                    pagination={pagination}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    isLoading={loading}
                    emptyMessage="No hay evaluaciones para mostrar"
                />
            )}
        </PageContainer>
    );
};

export default CalificationListPage;
