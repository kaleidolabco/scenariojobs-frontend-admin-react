import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
} from '../../services/competencyEvaluationService';
import { usePersonService, Person } from '../../services/personService';
import {
    useEvaluationAssignmentService,
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
    const { user } = useAuthStore();
    const currentUserId = user?.id || 'usr_9';

    const { getCompetencyEvaluations } = useCompetencyEvaluationService();
    const { getPeople } = usePersonService();
    const { getAsignacionesSync } = useEvaluationAssignmentService();

    const [loading, setLoading] = useState(true);
    const [processes, setProcesses] = useState<CompetencyEvaluationDetail[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [processesRes, personsRes] = await Promise.all([
                getCompetencyEvaluations({ items_por_pagina: 100 }),
                getPeople({ items_por_pagina: 500 }),
            ]);

            if (processesRes?.success) {
                setProcesses(processesRes.data.evaluaciones || []);
            }
            if (personsRes?.success) {
                setPersons(personsRes.data.personas || personsRes.data.datos || []);
            }
        } catch (error) {
            openAlert('Error al cargar los datos', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const currentPersonId = useMemo(() => {
        const p = persons.find((p) => p.usuario_id === currentUserId);
        return p?.id;
    }, [persons, currentUserId]);

    const asignaciones = useMemo(() => {
        if (!currentPersonId) return [];
        return getAsignacionesSync({ persona_id: currentPersonId, tipo: 'AUTOEVALUACION' });
    }, [currentPersonId, getAsignacionesSync]);

    const rows: EvalRow[] = useMemo(() => {
        return asignaciones.map((a) => {
            const proc = processes.find((p) => p.id === a.proceso_id);
            return {
                id: a.id,
                processId: a.proceso_id,
                processName: proc?.nombre || a.proceso_id,
                competenciesCount: proc?.competencias_asignadas?.length ?? 0,
                estado: a.estado,
                asignacionId: a.id,
            };
        });
    }, [asignaciones, processes]);

    const handleNavigate = (row: EvalRow) => {
        navigate(
            `${ROUTES.GRADING_DETAIL(row.processId)}?personId=${currentPersonId}&asignacionId=${row.asignacionId}&tipo=AUTOEVALUACION`
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
        if (row.estado === 'PENDIENTE' || row.estado === 'DEVUELTO') {
            return [{
                label: 'Autoevaluarse',
                icon: <Pencil size={16} />,
                onClick: () => handleNavigate(row),
                variant: 'primary',
                tooltip: 'Iniciar autoevaluación',
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
            {!currentPersonId ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                        <div className="text-6xl mb-4">👤</div>
                        <h3 className="text-lg font-semibold text-base-content mb-2">Perfil no encontrado</h3>
                        <p className="text-sm text-base-content/60">
                            No se encontró un perfil de persona asociado a tu usuario.
                        </p>
                    </div>
                </div>
            ) : rows.length === 0 ? (
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
