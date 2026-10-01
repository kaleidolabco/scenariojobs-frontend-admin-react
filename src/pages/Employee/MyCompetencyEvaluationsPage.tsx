import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyAssignment,
} from '../../services/competencyEvaluationService';
import {
    EstadoAsignacion,
    ESTADO_ASIGNACION_LABELS,
    ESTADO_ASIGNACION_BADGE,
} from '../../services/evaluationAssignmentService';
import StatusBadge from '../../components/Common/StatusBadge';
import { Eye, Pencil } from '../../components/Common/Icon';

interface EvalRow {
    id: string;
    processId: string;
    processName: string;
    competenciesCount: number;
    estado: EstadoAsignacion;
    asignacionId: string;
    colaboradorId: string;
}

const ESTADO_BADGE_MAP = Object.fromEntries(
    Object.entries(ESTADO_ASIGNACION_BADGE).map(([k, color]) => [
        k,
        { color, label: ESTADO_ASIGNACION_LABELS[k as EstadoAsignacion] },
    ])
) as Record<EstadoAsignacion, { color: string; label: string }>;

const MyCompetencyEvaluationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { openAlert } = useUIStore();

    const { getMyAssignments } = useCompetencyEvaluationService();

    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<CompetencyAssignment[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Asignaciones self-scoped del usuario autenticado como evaluador (= autoevaluación)
            const res = await getMyAssignments({ tipo: 'AUTOEVALUACION', limite: 100 });
            if (res?.success) {
                setAssignments(res.data.asignaciones ?? []);
            }
        } catch (error) {
            openAlert('Error al cargar los datos', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const rows: EvalRow[] = assignments.map((a) => ({
        id: a.id,
        processId: a.proceso_id,
        processName: a.proceso_nombre,
        competenciesCount: a.total_competencias,
        estado: a.estado,
        asignacionId: a.id,
        colaboradorId: a.colaborador_id,
    }));

    const handleNavigate = (row: EvalRow) => {
        navigate(
            `${ROUTES.GRADING_DETAIL(row.processId)}?personId=${row.colaboradorId}&asignacionId=${row.asignacionId}&tipo=AUTOEVALUACION`
        );
    };

    const columns: TableColumn<EvalRow>[] = [
        { key: 'processName', label: 'Proceso', sortable: true },
        {
            key: 'competenciesCount',
            label: 'Competencias',
            sortable: true,
            render: (r) => <span className="badge badge-sm badge-primary">{r.competenciesCount}</span>,
        },
        {
            key: 'estado',
            label: 'Estado',
            sortable: true,
            render: (r) => (
                <StatusBadge estado={r.estado} map={ESTADO_BADGE_MAP} size="sm" />
            ),
        },
    ];

    const actionsByEstado = (row: EvalRow): TableAction<EvalRow>[] => {
        if (
            row.estado === 'PENDIENTE' ||
            row.estado === 'EN_PROGRESO' ||
            row.estado === 'DEVUELTO'
        ) {
            return [{
                label: 'Autoevaluarse',
                icon: <Pencil size={16} />,
                onClick: () => handleNavigate(row),
                variant: 'primary',
                tooltip: 'Completar autoevaluación',
            }];
        }
        return [{
            label: 'Ver',
            icon: <Eye size={16} />,
            onClick: () => handleNavigate(row),
            variant: 'ghost',
            tooltip: 'Ver evaluación',
        }];
    };

    if (loading) return <LoadingIndicator />;

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: ROLE_LABELS[UserRole.EMPLOYEE], to: undefined },
        { label: 'Autoevaluación de Competencias', to: undefined },
    ];

    return (
        <PageContainer
            title="Autoevaluación de Competencias"
            subtitle="Procesos de autoevaluación de competencias asignados"
            breadcrumbs={breadcrumbs}
        >
            {rows.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-lg font-semibold text-base-content mb-2">Sin autoevaluaciones</h3>
                        <p className="text-sm text-base-content/60">
                            No tienes procesos de autoevaluación de competencias asignados.
                        </p>
                    </div>
                </div>
            ) : (
                <GenericTable<EvalRow>
                    data={rows}
                    columns={columns}
                    actions={actionsByEstado}
                    keyExtractor={(r) => r.id}
                    onPageChange={() => {}}
                    onPageSizeChange={() => {}}
                />
            )}
        </PageContainer>
    );
};

export default MyCompetencyEvaluationsPage;
