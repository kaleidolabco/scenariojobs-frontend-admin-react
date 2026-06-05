import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import {
    useIntegralEvaluationService,
    EvaluacionIntegral,
    IntegralQueryParams,
    IntegralEvaluationStatus,
    INTEGRAL_STATUS_LABELS,
    integralBadgeColor,
    calcPuntajeIntegralNumerico,
} from '../../services/integralEvaluationService';
import { useEvaluationResponseService } from '../../services/evaluationResponseService';
import { Pagination } from '../../services/responseType';
import { CreateIntegralModal, IntegralEvaluationSummary } from '../../components/Performance';

const ITEMS_PER_PAGE = 10;
type TabId = 'lista' | 'resumen';

const EvaluacionesIntegralPage: React.FC = () => {
    const navigate = useNavigate();
    const { getIntegrales, deleteIntegral, loading } = useIntegralEvaluationService();
    const { getEvaluationByProcessAndPerson } = useEvaluationResponseService();

    // Data state
    const [evaluaciones, setEvaluaciones] = useState<EvaluacionIntegral[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('lista');

    // Modal state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [evalToDelete, setEvalToDelete] = useState<EvaluacionIntegral | null>(null);

    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<IntegralEvaluationStatus | ''>('');
    const [queryParams, setQueryParams] = useState<IntegralQueryParams>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        search: undefined,
        estado: undefined,
    });

    // Update query params
    const updateQueryParams = (updates: Partial<IntegralQueryParams>) => {
        setQueryParams((prev) => ({ ...prev, ...updates }));
    };

    // Search debounce
    useEffect(() => {
        const timeout = setTimeout(() => {
            updateQueryParams({ search: searchInput || undefined, pagina: 1 });
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    // Fetch data
    const fetchData = async () => {
        const params = Object.fromEntries(
            Object.entries(queryParams).filter(
                ([_, value]) => value !== undefined && value !== '' && value !== null
            )
        );
        const response = await getIntegrales(params as IntegralQueryParams);
        if (response?.success) {
            let evaluacionesList = response.data?.evaluaciones || [];
            
            // Recalcular puntaje_final para cada evaluación si existe evaluación de competencias guardada
            evaluacionesList = evaluacionesList.map((integral:any) => {
                let updatedIntegral = { ...integral };
                
                // Si existe componente de competencias, busca evaluaciones guardadas
                if (integral.componente_competencias?.evaluacion_id) {
                    const evalResponse = getEvaluationByProcessAndPerson(
                        integral.componente_competencias.evaluacion_id,
                        integral.persona_id
                    );
                    
                    // Si encontró evaluación guardada y no tiene puntaje aún, usa los puntajes calculados
                    if (evalResponse && !integral.componente_competencias.puntaje) {
                        // Use both scores already calculated in evaluationResponseService
                        const puntajeProcentaje = evalResponse.puntaje_normalizado; // 0-100 for display
                        const puntajeNumerico = evalResponse.puntaje_numerico;     // Direct average for integral
                        const escalaMaxima = evalResponse.escala_maxima;           // Max scale (4, 5, etc)
                        
                        if (puntajeProcentaje !== undefined && puntajeNumerico !== undefined) {
                            // Actualiza el componente con los puntajes
                            const componenteActualizado = {
                                ...integral.componente_competencias,
                                puntaje: puntajeProcentaje,
                                puntaje_numerico: puntajeNumerico,
                                escala_maxima: escalaMaxima,
                                estado: 'COMPLETADA' as const
                            };
                            
                            updatedIntegral = {
                                ...integral,
                                componente_competencias: componenteActualizado,
                                // Recalcula el puntaje final basado en ambos componentes (usando escala numérica)
                                puntaje_final: calcPuntajeIntegralNumerico(
                                    integral.componente_desempeno,
                                    componenteActualizado,
                                    escalaMaxima
                                ),
                            };
                        }
                    }
                }
                
                return updatedIntegral;
            });
            
            setEvaluaciones(evaluacionesList);
            setPagination(response.data?.paginacion || null);
        }
    };

    useEffect(() => {
        setEvaluaciones([]);
        fetchData();
    }, [queryParams]);

    // Listen for integral evaluation updates from other pages
    useEffect(() => {
        const handleIntegralUpdate = () => {
            fetchData();
        };

        window.addEventListener('integralEvaluationUpdated', handleIntegralUpdate);
        return () => {
            window.removeEventListener('integralEvaluationUpdated', handleIntegralUpdate);
        };
    }, [queryParams]);

    // Handlers
    const handleDeleteClick = (evaluacion: EvaluacionIntegral) => {
        setEvalToDelete(evaluacion);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (evalToDelete) {
            const success = await deleteIntegral(evalToDelete.id);
            if (success) {
                setDeleteModalOpen(false);
                setEvalToDelete(null);
                fetchData();
            }
        }
    };

    const handleViewDetail = (evaluacion: EvaluacionIntegral) => {
        navigate(`${ROUTES.RRHH_EVALUACIONES_INTEGRAL}/${evaluacion.id}`);
    };

    const handleFilterChange = (key: string, value: string | number) => {
        if (key === 'estado') {
            const newValue = value ? (value as IntegralEvaluationStatus) : '';
            setStatusFilter(newValue);
            updateQueryParams({ estado: newValue || undefined, pagina: 1 });
        }
    };

    const handleSearch = (term: string) => {
        setSearchInput(term);
    };

    const clearFilters = () => {
        setSearchInput('');
        setStatusFilter('');
        setQueryParams({
            pagina: 1,
            items_por_pagina: ITEMS_PER_PAGE,
            search: undefined,
            estado: undefined,
        });
    };

    // Filter definitions
    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: 'Borrador', value: 'BORRADOR' },
                { label: 'En Progreso', value: 'EN_PROGRESO' },
                { label: 'Completada', value: 'COMPLETADA' },
            ],
        },
    ];

    const activeFilters = {
        ...(statusFilter && { estado: statusFilter }),
    };

    // Table configuration
    const columns: TableColumn<EvaluacionIntegral>[] = [
        {
            key: 'persona_nombre',
            label: 'Colaborador',
            sortable: false,
            render: (evaluacion) => (
                <div>
                    <div className="font-semibold text-sm">{evaluacion.persona_nombre}</div>
                    {evaluacion.persona_departamento && (
                        <div className="text-xs opacity-60">{evaluacion.persona_departamento}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'persona_puesto',
            label: 'Puesto',
            sortable: false,
            render: (evaluacion) => (
                <div className="text-sm">
                    {evaluacion.persona_puesto || <span className="opacity-50">Sin asignar</span>}
                </div>
            ),
        },
        {
            key: 'ciclo_nombre',
            label: 'Ciclo',
            sortable: false,
            render: (evaluacion) => <div className="text-sm font-medium">{evaluacion.ciclo_nombre}</div>,
        },
        {
            key: 'componentes',
            label: 'Componentes',
            sortable: false,
            render: (evaluacion) => {
                const componentes = [];
                if (evaluacion.componente_desempeno) componentes.push(`Desempeño (${evaluacion.componente_desempeno.peso}%)`);
                if (evaluacion.componente_competencias) componentes.push(`Competencias (${evaluacion.componente_competencias.peso}%)`);
                return (
                    <div className="text-xs space-y-1">
                        {componentes.map((c, i) => (
                            <div key={i} className="badge badge-sm badge-outline">
                                {c}
                            </div>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'puntaje_final',
            label: 'Puntaje',
            sortable: false,
            render: (evaluacion) => (
                <div className="text-sm font-bold">
                    {evaluacion.puntaje_final !== undefined ? (
                        <span className={`badge ${integralBadgeColor(evaluacion.puntaje_final)}`}>
                            {evaluacion.puntaje_final.toFixed(2)} / 5
                        </span>
                    ) : (
                        <span className="opacity-50">—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'estado',
            label: 'Estado',
            sortable: false,
            render: (evaluacion) => {
                const statusConfig = INTEGRAL_STATUS_LABELS[evaluacion.estado];
                return (
                    <div className={`badge badge-${statusConfig.color} text-xs`}>
                        {statusConfig.label}
                    </div>
                );
            },
        },
    ];

    const actions: TableAction<EvaluacionIntegral>[] = [
        {
            label: 'Ver Detalles',
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                </svg>
            ),
            onClick: handleViewDetail,
            variant: 'ghost',
            tooltip: 'Ver y editar evaluación',
        },
        {
            label: 'Eliminar',
            icon: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                </svg>
            ),
            onClick: handleDeleteClick,
            variant: 'ghost',
            tooltip: 'Eliminar evaluación',
        },
    ];

    return (
        <PageContainer
            title="Evaluaciones Integrales"
            subtitle="Gestione evaluaciones integrales que combinan desempeño y competencias con ponderaciones personalizadas."
            actions={
                <button
                    className="btn btn-primary w-full sm:w-auto"
                    onClick={() => setCreateModalOpen(true)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Nueva Evaluación Integral
                </button>
            }
        >
            {/* Tabs */}
            <div className="border-b border-base-200 mb-6">
                <div className="flex gap-0">
                    <button
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 flex items-center gap-2 ${
                            activeTab === 'lista'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                        }`}
                        onClick={() => setActiveTab('lista')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                        </svg>
                        Evaluaciones
                    </button>
                    <button
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 flex items-center gap-2 ${
                            activeTab === 'resumen'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                        }`}
                        onClick={() => setActiveTab('resumen')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Resumen
                    </button>
                </div>
            </div>

            {/* Content: Lista */}
            {activeTab === 'lista' && (
                <>
                    <FilterBar
                        onSearch={handleSearch}
                        searchTerm={searchInput}
                        searchPlaceholder="Buscar por colaborador o ciclo..."
                        filters={filterDefinitions}
                        activeFilters={activeFilters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                    />

                    {loading && !evaluaciones.length ? (
                        <LoadingIndicator />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GenericTable
                                data={evaluaciones}
                                columns={columns}
                                actions={actions}
                                keyExtractor={(evaluacion) => evaluacion.id}
                                pagination={pagination}
                                onPageChange={(page) =>
                                    updateQueryParams({ pagina: page })
                                }
                                onPageSizeChange={(size) =>
                                    updateQueryParams({
                                        items_por_pagina: size,
                                        pagina: 1,
                                    })
                                }
                                emptyMessage="No se encontraron evaluaciones integrales"
                            />
                        </motion.div>
                    )}
                </>
            )}

            {/* Content: Resumen */}
            {activeTab === 'resumen' && (
                <IntegralEvaluationSummary evaluaciones={evaluaciones} />
            )}

            {/* Create Integral Evaluation Modal */}
            <GenericModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Nueva Evaluación Integral"
                size="lg"
            >
                <CreateIntegralModal
                    onSuccess={() => {
                        setCreateModalOpen(false);
                        fetchData();
                    }}
                    onCancel={() => setCreateModalOpen(false)}
                />
            </GenericModal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                title="Confirmar eliminación"
                message={`¿Está seguro de que desea eliminar la evaluación integral de ${evalToDelete?.persona_nombre}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setEvalToDelete(null);
                }}
            />
        </PageContainer>
    );
};

export default EvaluacionesIntegralPage;
