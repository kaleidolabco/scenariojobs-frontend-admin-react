import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar from '../../components/Common/FilterBar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';
import { Pagination } from '../../services/responseType';
import {
    useAssessmentService,
    AssessmentSummary,
    AssessmentStatus,
    AssessmentType,
} from '../../services/assessmentService';
import Button from '../../components/Common/Button';
import { Pencil, Copy, Eye, Trash2, Plus, Clipboard, Check, Users } from '../../components/Common/Icon';

const ITEMS_PER_PAGE = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ estado: AssessmentStatus }> = ({ estado }) => {
    const map: Record<AssessmentStatus, { cls: string; label: string; dot: string }> = {
        BORRADOR: { cls: 'badge-warning', label: 'Borrador', dot: 'bg-warning' },
        PUBLICADO: { cls: 'badge-success', label: 'Publicado', dot: 'bg-success' },
        ARCHIVADO: { cls: 'badge-ghost', label: 'Archivado', dot: 'bg-base-content/30' },
    };
    const { cls, label, dot } = map[estado];
    return (
        <div className={`badge ${cls} badge-sm gap-1.5 font-medium`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </div>
    );
};

const TypeBadge: React.FC<{ tipo: AssessmentType }> = ({ tipo }) => {
    const map: Record<AssessmentType, { cls: string; label: string; icon: string }> = {
        DESEMPENO: { cls: 'badge-primary', label: 'Desempeño', icon: '📊' },
        SELECCION: { cls: 'badge-secondary', label: 'Selección', icon: '🎯' },
        CLIMA: { cls: 'badge-accent', label: 'Clima', icon: '🌡️' },
        CONOCIMIENTO: { cls: 'badge-info', label: 'Conocimiento', icon: '📚' },
    };
    const { cls, label, icon } = map[tipo];
    return (
        <div className={`badge ${cls} badge-outline badge-sm gap-1`}>
            <span>{icon}</span>
            {label}
        </div>
    );
};

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, colorClass }) => (
    <div className={`card bg-base-100 shadow border border-base-200`}>
        <div className="card-body p-4 flex-row items-center gap-4">
            <div className={`p-3 rounded-xl ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-base-content">{value}</p>
                <p className="text-xs text-base-content/60 leading-tight">{label}</p>
            </div>
        </div>
    </div>
);

// ─── Icons ────────────────────────────────────────────────────────────────────

// ─── Detail Modal Content ─────────────────────────────────────────────────────

const AssessmentDetailView: React.FC<{ assessment: AssessmentSummary }> = ({ assessment }) => (
    <div className="space-y-5">
        {/* Header info */}
        <div className="flex flex-wrap gap-2 items-center">
            <TypeBadge tipo={assessment.tipo} />
            <StatusBadge estado={assessment.estado} />
            <span className="badge badge-ghost badge-sm">v{assessment.version}</span>
        </div>

        {assessment.descripcion && (
            <p className="text-base-content/70 text-sm leading-relaxed border-l-4 border-primary/30 pl-3">
                {assessment.descripcion}
            </p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
                { label: 'Secciones', value: assessment.total_secciones, icon: '📂' },
                { label: 'Preguntas', value: assessment.total_preguntas, icon: '❓' },
                { label: 'Duración est.', value: assessment.duracion_estimada_min ? `${assessment.duracion_estimada_min} min` : 'N/D', icon: '⏱️' },
                { label: 'Veces aplicada', value: assessment.veces_aplicada, icon: '🚀' },
            ].map(({ label, value, icon }) => (
                <div key={label} className="bg-base-200 rounded-lg p-3 text-center">
                    <div className="text-2xl">{icon}</div>
                    <div className="text-lg font-bold mt-1">{value}</div>
                    <div className="text-xs text-base-content/60">{label}</div>
                </div>
            ))}
        </div>

        {/* Meta */}
        <div className="divider my-1 text-xs">Información de creación</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
                <span className="text-base-content/50">Creado por:</span>
                <span className="font-medium">{assessment.creado_por}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-base-content/50">Fecha creación:</span>
                <span className="font-medium">{new Date(assessment.fecha_creacion).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-base-content/50">Última actualización:</span>
                <span className="font-medium">{new Date(assessment.fecha_actualizacion).toLocaleDateString('es-ES')}</span>
            </div>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AssessmentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { openAlert } = useUIStore();
    const {
        getAssessments,
        getAssessmentStats,
        deleteAssessment,
        cloneAssessment,
        // loading: serviceLoading,
    } = useAssessmentService();

    // State
    const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false); // local loading for initial render guard

    // Query params
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        tipo: undefined,
        estado: undefined,
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'asc',
        orden_por: 'nombre',
    });

    // Modals
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentSummary | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [assessmentToDelete, setAssessmentToDelete] = useState<AssessmentSummary | null>(null);
    const [cloneModalOpen, setCloneModalOpen] = useState(false);
    const [assessmentToClone, setAssessmentToClone] = useState<AssessmentSummary | null>(null);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const [stats, setStats] = useState({
        total: 0, publicadas: 0, borradores: 0, total_aplicaciones: 0,
    });

    // Extraída para poder llamarse explícitamente tras mutaciones
    // Sin deps de servicio: getAssessmentStats es estable pero se recrea en cada render del hook,
    // incluirla causaría un loop. Las funciones del servicio leen _db directamente.
    const loadStats = useCallback(async () => {
        const response = await getAssessmentStats();
        if (response?.success) setStats(response.data.stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { loadStats(); }, []);

    // ── Load data ─────────────────────────────────────────────────────────────

    // Solo queryParams como dep: garantiza que se recarga al cambiar filtros/página
    // sin entrar en loop por la referencia cambiante de getAssessments.
    const loadAssessments = useCallback(async () => {
        setLoading(true);
        const response = await getAssessments({
            search: queryParams.search || undefined,
            tipo: queryParams.tipo,
            estado: queryParams.estado,
            pagina: queryParams.pagina,
            items_por_pagina: queryParams.items_por_pagina,
            orden: queryParams.orden,
            orden_por: queryParams.orden_por,
        });
        if (response?.success) {
            setAssessments(response.data.evaluaciones);
            setPagination(response.data.paginacion as Pagination);
        }
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    useEffect(() => { loadAssessments(); }, [loadAssessments]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    // Refresca tabla + stats tras cualquier mutación
    const reloadAll = useCallback(() => {
        loadAssessments();
        loadStats();
    }, [loadAssessments, loadStats]);

    const handleDelete = async () => {
        if (!assessmentToDelete) return;
        const success = await deleteAssessment(assessmentToDelete.id);
        if (success) {
            openAlert(`Evaluación "${assessmentToDelete.nombre}" eliminada.`, 'success');
            setDeleteModalOpen(false);
            setAssessmentToDelete(null);
            reloadAll();
        }
    };

    const handleClone = async () => {
        if (!assessmentToClone) return;
        const response = await cloneAssessment(assessmentToClone.id);
        if (response?.success) {
            openAlert(`Se creó una copia de "${assessmentToClone.nombre}".`, 'success');
            setCloneModalOpen(false);
            setAssessmentToClone(null);
            reloadAll();
        }
    };

    const handleGoToBuilder = (assessment?: AssessmentSummary) => {
        if (assessment?.id) {
            navigate(ROUTES.ASSESSMENT_EDIT(assessment.id));
        } else {
            navigate(ROUTES.ASSESSMENT_CREATE);
        }
    };

    // ── Filter helpers ────────────────────────────────────────────────────────
    const filterDefinitions = [
        {
            key: 'tipo',
            label: 'Tipo',
            options: [
                { label: 'Desempeño', value: 'DESEMPENO' },
                { label: 'Selección', value: 'SELECCION' },
                { label: 'Clima Laboral', value: 'CLIMA' },
                { label: 'Conocimiento', value: 'CONOCIMIENTO' },
            ],
        },
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: 'Borrador', value: 'BORRADOR' },
                { label: 'Publicado', value: 'PUBLICADO' },
                { label: 'Archivado', value: 'ARCHIVADO' },
            ],
        },
    ];

    const activeFilters = {
        ...(queryParams.tipo && { tipo: queryParams.tipo }),
        ...(queryParams.estado && { estado: queryParams.estado }),
    };

    const handleFilterChange = (key: string, value: any) =>
        setQueryParams((p: any) => ({ ...p, [key]: value, pagina: 1 }));

    const handleSearch = (term: string) =>
        setQueryParams((p: any) => ({ ...p, search: term, pagina: 1 }));

    const clearFilters = () =>
        setQueryParams({ search: '', tipo: undefined, estado: undefined, pagina: 1, items_por_pagina: ITEMS_PER_PAGE, orden: 'asc', orden_por: 'nombre' });

    // ── Sorting ───────────────────────────────────────────────────────────────
    // const handleSort = (key: string) => {
    //     const newDirection = queryParams.orden_por === key && queryParams.orden === 'asc' ? 'desc' : 'asc';
    //     setQueryParams((p: any) => ({ ...p, orden_por: key, orden: newDirection, pagina: 1 }));
    // };

    // const sortConfig = queryParams.orden_por
    //     ? { key: queryParams.orden_por, direction: queryParams.orden as 'asc' | 'desc' }
    //     : null;

    // ── Table config ──────────────────────────────────────────────────────────
    const columns: TableColumn<AssessmentSummary>[] = [
        {
            key: 'nombre',
            label: 'Evaluación',
            sortable: true,
            render: (a) => (
                <div className="flex flex-col gap-0.5 max-w-xs">
                    <span className="font-semibold text-base-content leading-snug">{a.nombre}</span>
                    {a.descripcion && (
                        <span className="text-xs text-base-content/50 truncate">{a.descripcion}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'tipo',
            label: 'Tipo',
            render: (a) => <TypeBadge tipo={a.tipo} />,
        },
        {
            key: 'estado',
            label: 'Estado',
            sortable: true,
            render: (a) => <StatusBadge estado={a.estado} />,
        },
        {
            key: 'total_preguntas',
            label: 'Estructura',
            render: (a) => (
                <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-base-content/70">
                        <span className="font-bold text-base-content">{a.total_secciones}</span> secc.
                    </span>
                    <span className="text-base-content/30">|</span>
                    <span className="flex items-center gap-1 text-base-content/70">
                        <span className="font-bold text-base-content">{a.total_preguntas}</span> preg.
                    </span>
                </div>
            ),
        },
        {
            key: 'version',
            label: 'Versión',
            render: (a) => (
                <div className="flex flex-col items-start gap-0.5">
                    <span className="badge badge-ghost badge-sm font-mono">v{a.version}</span>
                    {a.veces_aplicada > 0 && (
                        <span className="text-xs text-base-content/50">{a.veces_aplicada}× aplicada</span>
                    )}
                </div>
            ),
        },
        {
            key: 'fecha_actualizacion',
            label: 'Actualización',
            sortable: true,
            render: (a) => (
                <span className="text-sm text-base-content/70">
                    {new Date(a.fecha_actualizacion).toLocaleDateString('es-ES')}
                </span>
            ),
        },
    ];

    const actions: TableAction<AssessmentSummary>[] = [
        {
            label: 'Ver detalle',
            icon: <Eye size={16} />,
            onClick: (a) => { setSelectedAssessment(a); setDetailModalOpen(true); },
            variant: 'ghost',
            tooltip: 'Ver detalle',
        },
        {
            label: 'Editar / Constructor',
            icon: <Pencil size={16} />,
            onClick: (a) => handleGoToBuilder(a),
            variant: 'ghost',
            tooltip: 'Abrir constructor',
        },
        {
            label: 'Clonar',
            icon: <Copy size={16} />,
            onClick: (a) => { setAssessmentToClone(a); setCloneModalOpen(true); },
            variant: 'ghost',
            tooltip: 'Clonar evaluación',
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={16} />,
            onClick: (a) => { setAssessmentToDelete(a); setDeleteModalOpen(true); },
            variant: 'ghost',
            tooltip: 'Eliminar',
        },
    ];

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Assessment Engine', to: undefined },
        { label: 'Evaluaciones', to: undefined },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <PageContainer
            title="Motor de Evaluaciones"
            subtitle="Crea, versiona y administra tus instrumentos de evaluación"
            breadcrumbs={breadcrumbs}
            actions={
                <Button
                    variant="primary"
                    onClick={() => handleGoToBuilder()}
                    leftIcon={Plus}
                >
                    Nueva Evaluación
                </Button>
            }
        >
            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    label="Total de evaluaciones"
                    value={stats.total}
                    colorClass="bg-primary/10 text-primary"
                    icon={<Clipboard size={24} />}
                />
                <StatsCard
                    label="Publicadas"
                    value={stats.publicadas}
                    colorClass="bg-success/10 text-success"
                    icon={<Check size={24} className="text-success" />}
                />
                <StatsCard
                    label="En borrador"
                    value={stats.borradores}
                    colorClass="bg-warning/10 text-warning"
                    icon={<Pencil size={24} className="text-warning" />}
                />
                <StatsCard
                    label="Total aplicaciones"
                    value={stats.total_aplicaciones}
                    colorClass="bg-info/10 text-info"
                    icon={<Users size={24} className="text-info" />}
                />
            </div>

            {/* ── Filter Bar ── */}
            <FilterBar
                onSearch={handleSearch}
                searchTerm={queryParams.search || ''}
                searchPlaceholder="Buscar evaluación por nombre o descripción..."
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {/* ── Table ── */}
            {loading && !assessments.length ? (
                <LoadingIndicator />
            ) : (
                    <GenericTable
                        data={assessments}
                        columns={columns}
                        actions={actions}
                        keyExtractor={(a) => a.id}
                        pagination={pagination}
                        onPageChange={(page) => setQueryParams((p: any) => ({ ...p, pagina: page }))}
                        onPageSizeChange={(size) => setQueryParams((p: any) => ({ ...p, items_por_pagina: size, pagina: 1 }))}
                        isLoading={loading}
                    />
            )}

            {/* ── Detail Modal ── */}
            <GenericModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={selectedAssessment?.nombre ?? ''}
                size="lg"
                actions={
                    <div className="flex gap-2 w-full justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailModalOpen(false)}
                        >
                            Cerrar
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                setDetailModalOpen(false);
                                handleGoToBuilder(selectedAssessment!);
                            }}
                            leftIcon={Pencil}
                        >
                            Abrir Constructor
                        </Button>
                    </div>
                }
            >
                {selectedAssessment && <AssessmentDetailView assessment={selectedAssessment} />}
            </GenericModal>

            {/* ── Clone Confirmation ── */}
            <ConfirmationModal
                isOpen={cloneModalOpen}
                onClose={() => setCloneModalOpen(false)}
                onConfirm={handleClone}
                title="Clonar Evaluación"
                message={`Se creará una copia exacta de "${assessmentToClone?.nombre}" en estado Borrador. ¿Deseas continuar?`}
                confirmText="Clonar"
                variant="info"
            />

            {/* ── Delete Confirmation ── */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Evaluación"
                message={
                    assessmentToDelete?.veces_aplicada && assessmentToDelete.veces_aplicada > 0
                        ? `"${assessmentToDelete.nombre}" ha sido aplicada ${assessmentToDelete.veces_aplicada} veces. Eliminarla podría afectar reportes históricos. ¿Está seguro?`
                        : `¿Está seguro de eliminar "${assessmentToDelete?.nombre}"? Esta acción no se puede deshacer.`
                }
                confirmText="Eliminar Definitivamente"
                variant="danger"
            />
        </PageContainer>
    );
};

export default AssessmentsPage;