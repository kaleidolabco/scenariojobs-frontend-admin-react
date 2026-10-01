import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import FilterBar from '../../components/Common/FilterBar';
import { StatsGrid } from '../../components/Common/StatsCard';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import { Pagination } from '../../services/responseType';
import {
    useCompetencyEvaluationService,
    CompetencyAssignment,
    CompetencyEvaluationSummary,
    MyAssignmentsResumen,
} from '../../services/competencyEvaluationService';
import {
    EstadoAsignacion,
    ESTADO_ASIGNACION_LABELS,
    ESTADO_ASIGNACION_BADGE,
    ESTADO_PROCESO_LABELS,
    TipoEvaluacion,
    TIPO_EVALUACION_LABELS,
} from '../../services/evaluationAssignmentService';
import StatusBadge from '../../components/Common/StatusBadge';
import { Eye, RotateCcw, Activity, Clock, CheckCircle, Users, ClipboardList } from '../../components/Common/Icon';

const ITEMS_PER_PAGE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoFiltro = 'TODAS' | 'AUTOEVALUACION' | 'COMO_EVALUADOR';

interface EvaluationRow {
    id: string;
    processId: string;
    personId: string;
    processName: string;
    processEstado: string;
    personName: string;
    personPosition: string;
    competenciesCount: number;
    estado: EstadoAsignacion;
    tipo: TipoEvaluacion;
    asignacionId: string;
    correccionDisponible: boolean;
    correccionVoluntaria: boolean;
}

const ESTADO_BADGE_MAP = Object.fromEntries(
    Object.entries(ESTADO_ASIGNACION_BADGE).map(([k, color]) => [
        k,
        { color, label: ESTADO_ASIGNACION_LABELS[k as EstadoAsignacion] },
    ])
) as Record<EstadoAsignacion, { color: string; label: string }>;

const TOGGLE_OPTIONS: { value: TipoFiltro; label: string }[] = [
    { value: 'TODAS', label: 'Todas' },
    { value: 'AUTOEVALUACION', label: 'Autoevaluaciones' },
    { value: 'COMO_EVALUADOR', label: 'Como evaluador' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const CalificationListPage: React.FC = () => {
    const navigate = useNavigate();
    const { openAlert } = useUIStore();

    const { getMyAssignments, getCompetencyEvaluations, startAssignment } =
        useCompetencyEvaluationService();

    // State
    const [rows, setRows] = useState<CompetencyAssignment[]>([]);
    const [resumen, setResumen] = useState<MyAssignmentsResumen | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false);
    const [procesos, setProcesos] = useState<CompetencyEvaluationSummary[]>([]);

    // Query params (servidor)
    const [queryParams, setQueryParams] = useState<{
        tipo?: TipoEvaluacion;
        estado?: EstadoAsignacion;
        proceso_id?: string;
        pagina: number;
        limite: number;
    }>({
        tipo: undefined,
        estado: undefined,
        proceso_id: undefined,
        pagina: 1,
        limite: ITEMS_PER_PAGE,
    });

    // Carga unilateral de procesos para el filtro de "Proceso"
    const loadProcesos = useCallback(async () => {
        const response = await getCompetencyEvaluations({ items_por_pagina: 100 });
        if (response?.success) {
            setProcesos(response.data.evaluaciones || []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadProcesos();
    }, [loadProcesos]);

    // Consulta server-side de asignaciones (self-scoped al evaluador autenticado)
    const loadAsignaciones = useCallback(async () => {
        setLoading(true);
        const response = await getMyAssignments({
            tipo: queryParams.tipo,
            estado: queryParams.estado,
            proceso_id: queryParams.proceso_id,
            pagina: queryParams.pagina,
            limite: queryParams.limite,
        });
        if (response?.success) {
            setRows(response.data.asignaciones || []);
            setResumen(response.data.resumen ?? null);
            setPagination(response.data.paginacion ?? null);
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    useEffect(() => {
        loadAsignaciones();
    }, [loadAsignaciones]);

    const handleToggle = (toggle: TipoFiltro) => {
        setQueryParams((p) => ({
            ...p,
            tipo:
                toggle === 'TODAS'
                    ? undefined
                    : toggle === 'AUTOEVALUACION'
                    ? 'AUTOEVALUACION'
                    : 'JEFE_DIRECTO',
            pagina: 1,
        }));
    };

    // Deriva el toggle activo desde el filtro `tipo` (ambos sincronizados)
    const activeToggle: TipoFiltro =
        queryParams.tipo === undefined
            ? 'TODAS'
            : queryParams.tipo === 'AUTOEVALUACION'
            ? 'AUTOEVALUACION'
            : 'COMO_EVALUADOR';

    const handleFilterChange = (key: string, value: string | number) => {
        setQueryParams((p) => {
            const clean = typeof value === 'string' && value !== '' ? value : undefined;
            if (key === 'tipo') return { ...p, tipo: clean as TipoEvaluacion | undefined, pagina: 1 };
            if (key === 'estado')
                return { ...p, estado: clean as EstadoAsignacion | undefined, pagina: 1 };
            if (key === 'proceso_id') return { ...p, proceso_id: clean, pagina: 1 };
            return p;
        });
    };

    const clearFilters = () =>
        setQueryParams({
            tipo: undefined,
            estado: undefined,
            proceso_id: undefined,
            pagina: 1,
            limite: ITEMS_PER_PAGE,
        });

    // ── Acciones ──────────────────────────────────────────────────────────────

    const handleCorregir = async (row: EvaluationRow) => {
        if (!row.correccionDisponible) {
            openAlert('No le quedan correcciones disponibles para esta asignación.', 'warning');
            return;
        }
        // PATCH /assignments/:id/start — desde COMPLETADO/EN_REVISION cuenta como corrección
        const res = await startAssignment(row.asignacionId);
        if (res?.success) {
            openAlert('Asignación reabierta para corrección.', 'success');
            navigate(
                `${ROUTES.GRADING_DETAIL(row.processId)}?personId=${row.personId}&asignacionId=${row.asignacionId}&tipo=${row.tipo}`
            );
        }
    };

    const actionsByEstado = (row: EvaluationRow): TableAction<EvaluationRow>[] => {
        const acciones: TableAction<EvaluationRow>[] = [];

        const isAprobadoOCerrado = row.estado === 'APROBADO';

        if (
            row.estado === 'PENDIENTE' ||
            row.estado === 'EN_PROGRESO' ||
            row.estado === 'DEVUELTO'
        ) {
            acciones.push({
                label: 'Evaluar',
                icon: <Eye size={16} />,
                onClick: () =>
                    navigate(
                        `${ROUTES.GRADING_DETAIL(row.processId)}?personId=${row.personId}&asignacionId=${row.asignacionId}&tipo=${row.tipo}`
                    ),
                variant: 'primary',
                tooltip: 'Ir a evaluar',
            });
        } else if (row.estado === 'COMPLETADO' || row.estado === 'EN_REVISION') {
            acciones.push({
                label: 'Ver',
                icon: <Eye size={16} />,
                onClick: () =>
                    navigate(
                        `${ROUTES.GRADING_DETAIL(row.processId)}?personId=${row.personId}&asignacionId=${row.asignacionId}&tipo=${row.tipo}`
                    ),
                variant: 'ghost',
                tooltip: 'Ver evaluación',
            });
        }

        if (!isAprobadoOCerrado && row.correccionVoluntaria && row.correccionDisponible) {
            acciones.push({
                label: 'Corregir',
                icon: <RotateCcw size={16} />,
                onClick: () => handleCorregir(row),
                variant: 'ghost',
                tooltip: 'Corregir respuesta',
            });
        }

        return acciones;
    };

    // ── Columnas / filtros ────────────────────────────────────────────────────

    const columns: TableColumn<EvaluationRow>[] = [
        {
            key: 'processName',
            label: 'Proceso',
            render: (r) => (
                <div className="flex flex-col gap-0.5 max-w-xs">
                    <span className="font-semibold text-base-content leading-snug">{r.processName}</span>
                    <span className="text-xs text-base-content/50">
                        {ESTADO_PROCESO_LABELS[r.processEstado as keyof typeof ESTADO_PROCESO_LABELS] ||
                            r.processEstado}
                    </span>
                </div>
            ),
        },
        { key: 'personName', label: 'Persona' },
        { key: 'personPosition', label: 'Cargo' },
        {
            key: 'competenciesCount',
            label: 'Competencias',
            render: (r) => <span className="badge badge-sm badge-primary">{r.competenciesCount}</span>,
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (r) => <StatusBadge estado={r.estado} map={ESTADO_BADGE_MAP} size="sm" />,
        },
    ];

    const estadoFilterOptions = (Object.keys(ESTADO_ASIGNACION_LABELS) as EstadoAsignacion[]).map(
        (e) => ({ label: ESTADO_ASIGNACION_LABELS[e], value: e })
    );
    const tipoFilterOptions = (Object.keys(TIPO_EVALUACION_LABELS) as TipoEvaluacion[]).map((t) => ({
        label: TIPO_EVALUACION_LABELS[t],
        value: t,
    }));
    const procesoFilterOptions = procesos.map((p) => ({ label: p.nombre, value: p.id }));

    const filterDefinitions = [
        { key: 'tipo', label: 'Tipo', options: tipoFilterOptions },
        { key: 'estado', label: 'Estado', options: estadoFilterOptions },
        { key: 'proceso_id', label: 'Proceso', options: procesoFilterOptions },
    ];

    const activeFilters = {
        ...(queryParams.tipo && { tipo: queryParams.tipo }),
        ...(queryParams.estado && { estado: queryParams.estado }),
        ...(queryParams.proceso_id && { proceso_id: queryParams.proceso_id }),
    };

    const statsCards = resumen
        ? [
              {
                  label: 'Total evaluaciones',
                  value: resumen.total ?? 0,
                  variant: 'info' as const,
                  icon: <ClipboardList size={20} />,
              },
              {
                  label: 'Pendientes',
                  value: resumen.pendientes ?? 0,
                  variant: 'warning' as const,
                  icon: <Clock size={20} />,
              },
              {
                  label: 'En progreso',
                  value: resumen.en_progreso ?? 0,
                  variant: 'primary' as const,
                  icon: <Activity size={20} />,
              },
              {
                  label: 'Por corregir',
                  value: resumen.por_corregir ?? 0,
                  variant: 'error' as const,
                  icon: <RotateCcw size={20} />,
              },
              {
                  label: 'En revisión',
                  value: resumen.en_revision ?? 0,
                  variant: 'warning' as const,
                  icon: <Eye size={20} />,
              },
              {
                  label: 'Completadas',
                  value: resumen.completadas ?? 0,
                  variant: 'success' as const,
                  icon: <CheckCircle size={20} />,
              },
              {
                  label: 'Autoevaluaciones pend.',
                  value: resumen.autoevaluaciones_pendientes ?? 0,
                  variant: 'success' as const,
                  icon: <Users size={20} />,
              },
          ]
        : [];

    const mapAssignment = (a: CompetencyAssignment): EvaluationRow => {
        const esAutoevaluacion = a.evaluador_id === a.colaborador_id;
        return {
            id: a.id,
            processId: a.proceso_id,
            personId: a.colaborador_id,
            processName: a.proceso_nombre,
            processEstado: a.proceso_estado,
            personName: esAutoevaluacion ? 'Yo' : a.colaborador_nombre,
            personPosition: a.colaborador_cargo,
            competenciesCount: a.total_competencias,
            estado: a.estado,
            tipo: a.tipo,
            asignacionId: a.id,
            correccionDisponible: a.correccion_disponible,
            correccionVoluntaria: a.correccion_voluntaria && a.correccion_disponible,
        };
    };

    const rowsTable: EvaluationRow[] = rows.map(mapAssignment);

    const emptyMessage =
        activeToggle === 'AUTOEVALUACION'
            ? 'No tienes autoevaluaciones asignadas en este momento.'
            : activeToggle === 'COMO_EVALUADOR'
            ? 'No tienes evaluaciones por calificar como evaluador.'
            : 'No hay evaluaciones que coincidan con los filtros.';

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: ROLE_LABELS[UserRole.EVALUATOR], to: undefined },
        { label: 'Mis Evaluaciones', to: undefined },
    ];

    // Render
    return (
        <PageContainer
            title="Mis Evaluaciones de Competencias"
            subtitle="Procesos de evaluación asignados y autoevaluaciones pendientes"
            breadcrumbs={breadcrumbs}
        >
            {/* Stats cards desde el resumen del endpoint */}
            {statsCards.length > 0 && <StatsGrid stats={statsCards} columns={4} className="mb-6" />}

            {/* Toggle segmentado: Todas / Autoevaluaciones / Como evaluador */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="join">
                    {TOGGLE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleToggle(opt.value)}
                            className={`join-item btn btn-sm no-animation ${
                                activeToggle === opt.value ? 'btn-primary' : 'btn-ghost'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filtros */}
            <FilterBar
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {/* Tabla única con paginación del servidor */}
            {loading && !rowsTable.length ? (
                <LoadingIndicator />
            ) : (
                <GenericTable
                    data={rowsTable}
                    columns={columns}
                    actions={(row) => actionsByEstado(row)}
                    keyExtractor={(row) => row.id}
                    pagination={pagination}
                    onPageChange={(page) => setQueryParams((p) => ({ ...p, pagina: page }))}
                    onPageSizeChange={(size) =>
                        setQueryParams((p) => ({ ...p, limite: size, pagina: 1 }))
                    }
                    isLoading={loading}
                    emptyMessage={emptyMessage}
                />
            )}
        </PageContainer>
    );
};

export default CalificationListPage;