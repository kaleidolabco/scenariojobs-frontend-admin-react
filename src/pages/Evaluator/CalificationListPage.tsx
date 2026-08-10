import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Button from '../../components/Common/Button';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationDetail,
} from '../../services/competencyEvaluationService';
import { usePersonService, Person } from '../../services/personService';
import { useEvaluationResponseService, EvaluationResponse } from '../../services/evaluationResponseService';
import {
    useEvaluationAssignmentService,
    EvaluatorAssignment,
    EstadoAsignacion,
    ESTADO_ASIGNACION_LABELS,
    ESTADO_ASIGNACION_BADGE,
    TipoEvaluacion,
} from '../../services/evaluationAssignmentService';
import StatusBadge from '../../components/Common/StatusBadge';
import { Eye, Check, Clock, RotateCcw, CheckCircle } from '../../components/Common/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationRow {
    id: string;
    processId: string;
    personId: string;
    processName: string;
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

const TIPO_LABELS: Record<TipoEvaluacion, string> = {
    AUTOEVALUACION: 'Autoevaluación',
    JEFE_DIRECTO: 'Jefe directo',
    OTRO: 'Otro',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CalificationListPage: React.FC = () => {
    const navigate = useNavigate();
    const { openAlert } = useUIStore();
    const { user } = useAuthStore();

    const currentUserId = user?.id || 'usr_9'; // fallback para entorno mock

    const { getCompetencyEvaluations } = useCompetencyEvaluationService();
    const { getPeople } = usePersonService();
    const { getEvaluationResponses } = useEvaluationResponseService();
    const {
        getAsignacionesSync,
        getConfig,
        iniciarEdicion,
    } = useEvaluationAssignmentService();

    const [loading, setLoading] = useState(true);
    const [processes, setProcesses] = useState<CompetencyEvaluationDetail[]>([]);
    const [personsData, setPersonsData] = useState<Record<string, Person>>({});
    const [responses, setResponses] = useState<EvaluationResponse[]>([]);
    const [asignaciones, setAsignaciones] = useState<EvaluatorAssignment[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filas: evaluador externo vs autoevaluación
    const buildRows = useCallback(
        (procesos: CompetencyEvaluationDetail[]): { evaluador: EvaluationRow[]; autoeval: EvaluationRow[] } => {
            const evaluador: EvaluationRow[] = [];
            const autoeval: EvaluationRow[] = [];

            const respByAsignacion = new Map<string, EvaluationResponse>();
            responses.forEach((r) => {
                if (r.asignacion_id) respByAsignacion.set(r.asignacion_id, r);
            });

            asignaciones.forEach((a) => {
                if (a.evaluador_id !== currentUserId) return;
                const proces = procesos.find((p) => p.id === a.proceso_id);
                if (!proces) return;
                const person = personsData[a.persona_id];
                if (!person && a.tipo !== 'AUTOEVALUACION') {
                    // Para autoevaluación, la persona es el propio evaluador (person_id = evaluador_id mapeado)
                }

                const resp = respByAsignacion.get(a.id);
                const estado: EstadoAsignacion = resp?.estado === 'COMPLETADO' ? a.estado : a.estado;
                const competenciesCount = proces.competencias_asignadas?.length ?? 0;

                const configProceso = getConfig(a.proceso_id);
                const correccionVoluntaria =
                    configProceso.correccion.permitir &&
                    configProceso.correccion.permitir_voluntaria &&
                    a.correccion_disponible;

                const personName = person
                    ? `${person.nombres} ${person.apellidos}`
                    : a.tipo === 'AUTOEVALUACION'
                    ? 'Yo'
                    : '—';

                const row: EvaluationRow = {
                    id: `${a.proceso_id}_${a.persona_id}_${a.id}`,
                    processId: a.proceso_id,
                    personId: a.persona_id,
                    processName: proces.nombre,
                    personName,
                    personPosition: person?.puesto_nombre || '-',
                    competenciesCount,
                    estado: a.estado,
                    tipo: a.tipo,
                    asignacionId: a.id,
                    correccionDisponible: a.correccion_disponible,
                    correccionVoluntaria,
                };

                if (a.tipo === 'AUTOEVALUACION') autoeval.push(row);
                else evaluador.push(row);
            });

            return { evaluador, autoeval };
        },
        [responses, asignaciones, personsData, currentUserId, getConfig]
    );

    const evaluadorRows = useMemo(() => buildRows(processes).evaluador, [buildRows, processes]);
    const autoevalRows = useMemo(() => buildRows(processes).autoeval, [buildRows, processes]);

    const pagination = useMemo(
        () => ({
            pagina: currentPage,
            limite: pageSize,
            total_paginas: Math.ceil(evaluadorRows.length / pageSize),
            total: evaluadorRows.length,
        }),
        [currentPage, pageSize, evaluadorRows.length]
    );

    const paginationAutoeval = useMemo(
        () => ({
            pagina: currentPage,
            limite: pageSize,
            total_paginas: Math.ceil(autoevalRows.length / pageSize),
            total: autoevalRows.length,
        }),
        [currentPage, pageSize, autoevalRows.length]
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const processesRes = await getCompetencyEvaluations({ items_por_pagina: 100 });
            const procList: CompetencyEvaluationDetail[] = processesRes?.success
                ? processesRes.data.evaluaciones || []
                : [];
            setProcesses(procList);

            const personsRes = await getPeople({ items_por_pagina: 500 });
            if (personsRes?.success) {
                const map: Record<string, Person> = {};
                (personsRes.data.personas || personsRes.data.datos || []).forEach(
                    (p: Person) => { map[p.id] = p; }
                );
                setPersonsData(map);
            }

            const responsesRes = await getEvaluationResponses({
                evaluador_id: currentUserId,
                items_por_pagina: 500,
            });
            if (responsesRes?.success) {
                setResponses(responsesRes.data.respuestas || []);
            }

            const asignacionesDelEvaluator = getAsignacionesSync({ evaluador_id: currentUserId });
            setAsignaciones(asignacionesDelEvaluator);
        } catch (error) {
            openAlert('Error al cargar los datos', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCorregir = async (row: EvaluationRow) => {
        if (!row.correccionDisponible) {
            openAlert('No le quedan correcciones disponibles para esta asignación.', 'warning');
            return;
        }
        const res = await iniciarEdicion(row.asignacionId);
        if (res?.success) {
            openAlert('Asignación reabierta para corrección.', 'success');
            navigate(
                `${ROUTES.GRADING_DETAIL(row.processId)}?personId=${row.personId}&asignacionId=${row.asignacionId}&tipo=${row.tipo}`
            );
        }
    };

    const columns: TableColumn<EvaluationRow>[] = [
        { key: 'processName', label: 'Proceso', sortable: true },
        { key: 'personName', label: 'Persona', sortable: true },
        { key: 'personPosition', label: 'Puesto', sortable: true },
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
                <StatusBadge
                    estado={r.estado}
                    map={ESTADO_BADGE_MAP}
                    size="sm"
                />
            ),
        },
    ];

    const actionsByEstado = (row: EvaluationRow): TableAction<EvaluationRow>[] => {
        const acciones: TableAction<EvaluationRow>[] = [];

        const isAprobadoOCerrado = row.estado === 'APROBADO';

        // Acción principal según estado
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

        // Botón "Corregir" si está COMPLETADO/EN_REVISION y hay corrección voluntaria disponible.
        if (
            !isAprobadoOCerrado &&
            row.correccionVoluntaria &&
            (row.estado === 'COMPLETADO' || row.estado === 'EN_REVISION')
        ) {
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

    const sortRows = (rows: EvaluationRow[]) => {
        let sorted = [...rows];
        if (sortConfig) {
            sorted.sort((a, b) => {
                const av = a[sortConfig.key as keyof EvaluationRow] ?? '';
                const bv = b[sortConfig.key as keyof EvaluationRow] ?? '';
                if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
                if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    };

    const handleSort = (key: string) => {
        setSortConfig((prev) =>
            prev?.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' }
        );
        setCurrentPage(1);
    };

    if (loading) return <LoadingIndicator />;

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: ROLE_LABELS[UserRole.EVALUATOR], to: undefined },
        { label: 'Mis Evaluaciones', to: undefined },
    ];

    const paginadas = sortRows(evaluadorRows).slice(
        (currentPage - 1) * pageSize,
        (currentPage - 1) * pageSize + pageSize
    );
    const paginadasAuto = sortRows(autoevalRows).slice(
        (currentPage - 1) * pageSize,
        (currentPage - 1) * pageSize + pageSize
    );

    const EmptyState = ({ emoji, title, msg }: { emoji: string; title: string; msg: string }) => (
        <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
                <div className="text-6xl mb-4">{emoji}</div>
                <h3 className="text-lg font-semibold text-base-content mb-2">{title}</h3>
                <p className="text-sm text-base-content/60 max-w-md">{msg}</p>
            </div>
        </div>
    );

    const renderTable = (
        rows: EvaluationRow[],
        pag: typeof pagination,
        emptyState: React.ReactNode
    ) =>
        rows.length === 0 ? (
            emptyState
        ) : (
            <GenericTable<EvaluationRow>
                data={paginadas}
                columns={columns}
                actions={(row) => actionsByEstado(row)}
                keyExtractor={(row) => row.id}
                pagination={pag}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                sortConfig={sortConfig}
                onSort={handleSort}
                isLoading={loading}
                emptyMessage="No hay evaluaciones para mostrar"
            />
        );

    return (
        <PageContainer
            title="Mis Evaluaciones de Competencias"
            subtitle="Procesos de evaluación asignados y autoevaluaciones pendientes"
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-8">
                {/* Sección Autoevaluación */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={18} className="text-primary" />
                        <h2 className="text-lg font-semibold text-base-content">Mi autoevaluación</h2>
                        <span className="badge badge-success badge-sm">{autoevalRows.length}</span>
                    </div>
                    {renderTable(
                        autoevalRows,
                        paginationAutoeval,
                        <EmptyState
                            emoji="🪞"
                            title="Sin autoevaluaciones pendientes"
                            msg="No tienes procesos de autoevaluación asignados en este momento."
                        />
                    )}
                </section>

                {/* Sección Como evaluador */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Eye size={18} className="text-secondary" />
                        <h2 className="text-lg font-semibold text-base-content">Como evaluador</h2>
                        <span className="badge badge-secondary badge-sm">{evaluadorRows.length}</span>
                    </div>
                    {renderTable(
                        evaluadorRows,
                        pagination,
                        <EmptyState
                            emoji="📋"
                            title="No hay evaluaciones pendientes"
                            msg="No tienes procesos de evaluación asignados en este momento."
                        />
                    )}
                </section>
            </div>
        </PageContainer>
    );
};

export default CalificationListPage;
