import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FilterBar from '../Common/FilterBar';
import StatusBadge from '../Common/StatusBadge';
import LoadingIndicator from '../Common/LoadingIndicator';
import StatsCard from '../Common/StatsCard';
import Button from '../Common/Button';
import { Pagination } from '../../services/responseType';
import {
    useCompetencyEvaluationService,
    CompetencyAssignment,
    ReviewSummaryGroup,
    ReviewSummaryResumen,
    AgruparPor,
} from '../../services/competencyEvaluationService';
import {
    EstadoAsignacion,
    ESTADO_ASIGNACION_LABELS,
    ESTADO_ASIGNACION_BADGE,
    TIPO_EVALUACION_LABELS,
} from '../../services/evaluationAssignmentService';
import {
    ChevronDown,
    ChevronUp,
    Eye,
    ClipboardList,
    Clock,
    Activity,
    CheckCircle,
    RotateCcw,
    BarChart3,
} from '../Common/Icon';
import AssignmentReviewModal from './AssignmentReviewModal';
import ResultsModal from './ResultsModal';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ReviewTabProps {
    procesoId: string;
}

interface ReviewQuery {
    agrupar_por: AgruparPor;
    busqueda?: string;
    estado?: EstadoAsignacion;
    pagina: number;
    limite: number;
}

/** Estado de paginación en cliente del contenido expandido de un grupo. */
type GroupDetailPageState = Record<string, number>; // grupo_id → página actual (1-based)

const ESTADO_BADGE_MAP = Object.fromEntries(
    Object.entries(ESTADO_ASIGNACION_BADGE).map(([k, color]) => [
        k,
        { color, label: ESTADO_ASIGNACION_LABELS[k as EstadoAsignacion] },
    ])
) as Record<EstadoAsignacion, { color: string; label: string }>;

const GROUP_ITEMS_PER_PAGE = 10;      // grupos por página
const DETAIL_ITEMS_PER_PAGE = 5;      // asignaciones por página dentro de un grupo

const TOGGLE_OPTIONS: { value: AgruparPor; label: string }[] = [
    { value: 'colaborador', label: 'Por colaborador' },
    { value: 'evaluador', label: 'Por evaluador' },
];

// ─── Componente principal ─────────────────────────────────────────────────────

const ReviewTab: React.FC<ReviewTabProps> = ({ procesoId }) => {
    const { getReviewSummary } = useCompetencyEvaluationService();

    const [grupos, setGrupos] = useState<ReviewSummaryGroup[]>([]);
    const [resumen, setResumen] = useState<ReviewSummaryResumen | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false);

    // Grupos expandidos + paginación en cliente de sus asignaciones
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [detailPages, setDetailPages] = useState<GroupDetailPageState>({});

    const [queryParams, setQueryParams] = useState<ReviewQuery>({
        agrupar_por: 'colaborador',
        pagina: 1,
        limite: GROUP_ITEMS_PER_PAGE,
    });
    const [searchTerm, setSearchTerm] = useState('');

    // Modal de revisión (por asignación)
    const [reviewOpen, setReviewOpen] = useState(false);
    const [selectedAsignacionId, setSelectedAsignacionId] = useState<string | null>(null);

    // Modal de resultados (por colaborador)
    const [resultsTarget, setResultsTarget] = useState<{ id: string; nombre: string } | null>(null);

    const esPorColaborador = queryParams.agrupar_por === 'colaborador';
    const colContrariaLabel = esPorColaborador ? 'Evaluador' : 'Colaborador';

    // ── Debounce de búsqueda (patrón de la lista de procesos) ─────────────────
    useEffect(() => {
        const handler = setTimeout(() => {
            setQueryParams((prev) => {
                const term = searchTerm || undefined;
                if (prev.busqueda === term) return prev;
                return { ...prev, busqueda: term, pagina: 1 };
            });
        }, 400);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // ── Carga principal: resumen + grupos (§9.6) ──────────────────────────────
    const loadSummary = useCallback(async () => {
        setLoading(true);
        const response = await getReviewSummary(procesoId, {
            agrupar_por: queryParams.agrupar_por,
            busqueda: queryParams.busqueda,
            estado: queryParams.estado,
            pagina: queryParams.pagina,
            limite: queryParams.limite,
        });
        if (response?.success) {
            setGrupos(response.data.grupos ?? []);
            setResumen(response.data.resumen ?? null);
            setPagination(response.data.paginacion ?? null);
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [procesoId, queryParams]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    // ── Detalle de un grupo: paginación en cliente sobre §9.6 (sin llamadas extra) ─
    const toggleGroup = (group: ReviewSummaryGroup) => {
        const grupoId = group.grupo_id;
        const willOpen = !(expanded[grupoId] ?? false);
        setExpanded((prev) => ({ ...prev, [grupoId]: willOpen }));
        if (willOpen) {
            setDetailPages((prev) => ({ ...prev, [grupoId]: prev[grupoId] ?? 1 }));
        }
    };

    // Al cambiar filtros/toggle, colapsar todo
    useEffect(() => {
        setExpanded({});
        setDetailPages({});
    }, [queryParams.agrupar_por, queryParams.estado, queryParams.busqueda]);

    // ── Handlers de filtro/paginación de grupos ───────────────────────────────
    const handleToggle = (value: AgruparPor) =>
        setQueryParams((p) => ({ ...p, agrupar_por: value, pagina: 1 }));

    const handleFilterChange = (key: string, value: string | number) => {
        if (key !== 'estado') return;
        setQueryParams((p) => ({
            ...p,
            estado: typeof value === 'string' && value !== '' ? (value as EstadoAsignacion) : undefined,
            pagina: 1,
        }));
    };

    const clearFilters = () => {
        setSearchTerm('');
        setQueryParams((p) => ({ ...p, busqueda: undefined, estado: undefined, pagina: 1 }));
    };

    const handleGroupPage = (page: number) => {
        if (!pagination) return;
        if (page < 1 || page > pagination.total_paginas) return;
        setQueryParams((p) => ({ ...p, pagina: page }));
    };

    // ── Modales ───────────────────────────────────────────────────────────────
    const openReview = (a: CompetencyAssignment) => {
        setSelectedAsignacionId(a.id);
        setReviewOpen(true);
    };

    const closeReview = () => {
        setReviewOpen(false);
        setSelectedAsignacionId(null);
    };

    // Tras una acción de calibración: refresca el resumen (los datos anidados
    // vienen incluidos en §9.6, así que el contenido expandido se regenera solo)
    const handleReviewDone = useCallback(() => {
        loadSummary();
    }, [loadSummary]);

    // ── Derivados de UI ───────────────────────────────────────────────────────
    const estadoOptions = useMemo(
        () =>
            (Object.keys(ESTADO_ASIGNACION_LABELS) as EstadoAsignacion[]).map((e) => ({
                label: ESTADO_ASIGNACION_LABELS[e],
                value: e,
            })),
        []
    );

    const filterDefinitions = [{ key: 'estado', label: 'Estado', options: estadoOptions }];
    const activeFilters = {
        ...(queryParams.estado && { estado: queryParams.estado }),
    };

    const statsCards = resumen
        ? [
              { label: 'Total asignaciones', value: resumen.total ?? 0, variant: 'info' as const, icon: <ClipboardList size={20} /> },
              { label: 'Pendientes / En progreso', value: (resumen.pendientes ?? 0) + (resumen.en_progreso ?? 0), variant: 'warning' as const, icon: <Clock size={20} /> },
              { label: 'En revisión', value: resumen.en_revision ?? 0, variant: 'primary' as const, icon: <Activity size={20} /> },
              { label: 'Devueltas', value: resumen.devueltas ?? 0, variant: 'error' as const, icon: <RotateCcw size={20} /> },
              { label: 'Completadas / Aprobadas', value: (resumen.completadas ?? 0) + (resumen.aprobadas ?? 0), variant: 'success' as const, icon: <CheckCircle size={20} /> },
          ]
        : [];

    /** Ventana de páginas para la paginación numerada (estilo CompetenciesPage). */
    const pageWindow = useMemo(() => {
        if (!pagination) return [] as number[];
        const { pagina, total_paginas } = pagination;
        const delta = 2;
        const start = Math.max(1, Math.min(pagina - delta, total_paginas - delta * 2));
        const end = Math.min(total_paginas, start + delta * 2);
        const pages: number[] = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [pagination]);

    // ── Render helpers ────────────────────────────────────────────────────────
    const renderGroupRows = (g: ReviewSummaryGroup) => {
        // Paginación en cliente sobre las asignaciones ya anidadas en §9.6
        const currentPage = detailPages[g.grupo_id] ?? 1;
        const totalItems = g.asignaciones.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / DETAIL_ITEMS_PER_PAGE));
        const start = (currentPage - 1) * DETAIL_ITEMS_PER_PAGE;
        const pageItems = g.asignaciones.slice(start, start + DETAIL_ITEMS_PER_PAGE);

        if (totalItems === 0) {
            return (
                <p className="px-4 py-4 text-sm text-base-content/60 text-center">
                    No hay asignaciones que coincidan con el filtro activo.
                </p>
            );
        }

        return (
            <>
                {/* grid-cols-[1fr_120px_70px_70px_140px_90px_110px] */}
                <div className="hidden md:grid grid-cols-[1fr_120px_70px_70px_140px_90px] gap-2 px-4 py-2 bg-base-200/40 text-[10px] uppercase tracking-wide text-base-content/50 font-semibold border-t border-base-200">
                    <span>{colContrariaLabel}</span>
                    <span>Tipo</span>
                    <span>Peso</span>
                    <span>Corr.</span>
                    <span>Estado</span>
                    {/* <span>Puntaje</span> */}
                    <span className="text-center">Acción</span>
                </div>
                <div className="divide-y divide-base-200 border-t border-base-200 md:border-t-0">
                    {pageItems.map((a) => (
                        <div
                            key={a.id}
                            className="grid grid-cols-2 md:grid-cols-[1fr_120px_70px_70px_140px_90px] gap-2 px-4 py-3 items-center"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-base-content truncate">
                                    {esPorColaborador
                                        ? a.evaluador_nombre ?? '—'
                                        : a.colaborador_nombre}
                                </p>
                                <p className="text-xs text-base-content/50 truncate">
                                    {esPorColaborador
                                        ? a.evaluador_email ?? ''
                                        : a.colaborador_cargo ?? ''}
                                </p>
                            </div>
                            <span className="badge badge-ghost badge-sm w-fit">
                                {TIPO_EVALUACION_LABELS[a.tipo] ?? a.tipo}
                            </span>
                            <span className="badge badge-info badge-sm w-fit">{a.peso}%</span>
                            <span className="text-xs text-base-content/60">
                                {a.contador_correcciones > 0 ? (
                                    <span className="badge badge-warning badge-sm">
                                        {a.contador_correcciones}
                                    </span>
                                ) : (
                                    '0'
                                )}
                            </span>
                            <StatusBadge estado={a.estado} map={ESTADO_BADGE_MAP} size="sm" />
                            {/* <span className="text-sm text-base-content/80 tabular-nums">
                                {a.puntaje_numerico !== null && a.puntaje_numerico !== undefined
                                    ? a.puntaje_numerico.toFixed(2)
                                    : '—'}
                            </span> */}
                            <div className="flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={Eye}
                                    onClick={() => openReview(a)}
                                >
                                    Revisar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mini-paginación interna del grupo (cliente) */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-base-200 bg-base-200/30">
                        <span className="text-xs text-base-content/50">
                            {totalItems} asignaciones · página {currentPage} de {totalPages}
                        </span>
                        <div className="join">
                            <button
                                type="button"
                                className="join-item btn btn-xs"
                                disabled={currentPage <= 1}
                                onClick={() =>
                                    setDetailPages((prev) => ({
                                        ...prev,
                                        [g.grupo_id]: currentPage - 1,
                                    }))
                                }
                            >
                                «
                            </button>
                            <button
                                type="button"
                                className="join-item btn btn-xs"
                                disabled={currentPage >= totalPages}
                                onClick={() =>
                                    setDetailPages((prev) => ({
                                        ...prev,
                                        [g.grupo_id]: currentPage + 1,
                                    }))
                                }
                            >
                                »
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    // ── Render principal ──────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            <div className="alert alert-info">
                <span>
                    Monitorea y revisa las evaluaciones enviadas. Puedes aprobar, calibrar o devolver
                    cada asignación según la política configurada en{' '}
                    <strong>Información General</strong>.
                </span>
            </div>

            {/* Stats */}
            {statsCards.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {statsCards.map((s) => (
                        <StatsCard
                            key={s.label}
                            label={s.label}
                            value={s.value}
                            variant={s.variant}
                            icon={s.icon}
                        />
                    ))}
                </div>
            )}

            {/* Toggle de agrupación */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="join">
                    {TOGGLE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleToggle(opt.value)}
                            className={`join-item btn btn-sm no-animation ${
                                queryParams.agrupar_por === opt.value ? 'btn-primary' : 'btn-ghost'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <FilterBar
                onSearch={setSearchTerm}
                searchTerm={searchTerm}
                searchPlaceholder={
                    esPorColaborador ? 'Buscar colaborador...' : 'Buscar evaluador...'
                }
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {/* Grupos */}
            {loading && !grupos.length ? (
                <LoadingIndicator />
            ) : grupos.length === 0 ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <p className="text-sm text-base-content/60">
                        No hay asignaciones que coincidan con los filtros.
                    </p>
                </div>
            ) : (
                <div className={`space-y-3 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
                    {grupos.map((g) => {
                        const isOpen = expanded[g.grupo_id] ?? false;
                        return (
                            <div
                                key={g.grupo_id}
                                className="border border-base-200 rounded-lg bg-base-100 overflow-hidden"
                            >
                                {/* Header del grupo */}
                                <div className="w-full flex flex-wrap items-center gap-3 p-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(g)}
                                        className="flex flex-wrap items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                                    >
                                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        <div className="flex-1 min-w-[180px]">
                                            <p className="font-semibold text-base-content leading-snug">
                                                {g.nombre}
                                            </p>
                                            {g.subtitulo && (
                                                <p className="text-xs text-base-content/50">
                                                    {g.subtitulo}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {g.en_revision > 0 && (
                                                <span className="badge badge-sm badge-warning">
                                                    {g.en_revision} en revisión
                                                </span>
                                            )}
                                            {g.devueltas > 0 && (
                                                <span className="badge badge-sm badge-error">
                                                    {g.devueltas} devuelta{g.devueltas > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <span className="badge badge-sm badge-ghost">
                                                {g.completadas + g.aprobadas}/{g.total_asignaciones}{' '}
                                                listas
                                            </span>
                                        </div>

                                        <div className="w-24 shrink-0">
                                            <div className="h-4 bg-base-200 rounded-full overflow-hidden relative">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{
                                                        width: `${Math.round(g.progreso * 100)}%`,
                                                    }}
                                                />
                                                <p className="absolute text-base-content/50 text-xs font-bold text-center w-full top-0">
                                                    {Math.round(g.progreso * 100)}%
                                                </p>
                                            </div>
                                           
                                        </div>
                                    </button>

                                    {/* Resultados consolidados (solo agrupado por colaborador) */}
                                    {esPorColaborador && (
                                        <Button
                                            variant="info"
                                            size="sm"
                                            leftIcon={BarChart3}
                                            onClick={() =>
                                                setResultsTarget({ id: g.grupo_id, nombre: g.nombre })
                                            }
                                        >
                                            Resultados
                                        </Button>
                                    )}
                                </div>

                                {/* Contenido expandido: asignaciones del grupo (§9.7) */}
                                {isOpen && renderGroupRows(g)}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Paginación de grupos (estilo CompetenciesPage) */}
            {pagination && pagination.total > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60">Mostrar:</span>
                        <select
                            className="select select-bordered select-sm w-20"
                            value={queryParams.limite}
                            onChange={(e) =>
                                setQueryParams((p) => ({
                                    ...p,
                                    limite: Number(e.target.value),
                                    pagina: 1,
                                }))
                            }
                            disabled={loading}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-base-content/60">grupos por página</span>
                    </div>
                    {pagination.total_paginas > 1 && (
                        <div className="join">
                            <button
                                type="button"
                                className="join-item btn btn-sm"
                                onClick={() => handleGroupPage(pagination.pagina - 1)}
                                disabled={pagination.pagina === 1 || loading}
                            >
                                «
                            </button>
                            {pageWindow.map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    className={`join-item btn btn-sm ${
                                        page === pagination.pagina ? 'btn-active' : ''
                                    }`}
                                    onClick={
                                        page === pagination.pagina
                                            ? undefined
                                            : () => handleGroupPage(page)
                                    }
                                    disabled={loading}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="join-item btn btn-sm"
                                onClick={() => handleGroupPage(pagination.pagina + 1)}
                                disabled={
                                    pagination.pagina === pagination.total_paginas || loading
                                }
                            >
                                »
                            </button>
                        </div>
                    )}
                    <div className="text-sm text-base-content/60">
                        Mostrando {((pagination.pagina - 1) * pagination.limite) + 1}–
                        {Math.min(pagination.pagina * pagination.limite, pagination.total)} de{' '}
                        {pagination.total}
                    </div>
                </div>
            )}

            {/* Modal de revisión */}
            {selectedAsignacionId && (
                <AssignmentReviewModal
                    isOpen={reviewOpen}
                    onClose={closeReview}
                    asignacionId={selectedAsignacionId}
                    procesoId={procesoId}
                    onDone={handleReviewDone}
                />
            )}

            {/* Modal de resultados consolidados */}
            {resultsTarget && (
                <ResultsModal
                    isOpen={resultsTarget !== null}
                    onClose={() => setResultsTarget(null)}
                    procesoId={procesoId}
                    colaboradorId={resultsTarget.id}
                    colaboradorNombre={resultsTarget.nombre}
                />
            )}
        </div>
    );
};

export default ReviewTab;
