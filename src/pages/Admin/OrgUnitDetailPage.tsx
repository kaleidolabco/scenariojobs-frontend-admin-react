import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import { usePositionService, Position } from '../../services/positionService';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import Avatar from '../../components/Common/Avatar';
import OrgUnitForm from '../../components/OrgUnits/OrgUnitForm';
import OrgUnitNode from '../../components/OrgUnits/OrgUnitNode';
import PositionForm from '../../components/Positions/PositionForm';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import { Pagination } from '../../services/responseType';
import Tabs from '../../components/Common/Tabs';
import { motion, AnimatePresence } from 'framer-motion';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';

const ITEMS_PER_PAGE = 10;

const OrgUnitDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getUnitById, updateUnit, deleteUnit, createUnit, loading: unitLoading } = useOrgUnitService();
    const { getPositions, createPosition, updatePosition, deletePosition, loading: positionLoading } = usePositionService();

    const [unit, setUnit] = useState<OrgUnit | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'subunits' | 'positions'>('positions');
    const isFirstRender = useRef(true);

    // Filters for positions table
    const [searchInput, setSearchInput] = useState('');
    const [queryParams, setQueryParams] = useState<any>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        filtro: '',
        estado: undefined,
    });

    // Modals
    const [editUnitModalOpen, setEditUnitModalOpen] = useState(false);
    const [deleteUnitModalOpen, setDeleteUnitModalOpen] = useState(false);
    const [positionModalOpen, setPositionModalOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [deletePositionModalOpen, setDeletePositionModalOpen] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
    const [addSubunitModalOpen, setAddSubunitModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadUnitData();
            loadPositions();
        }
    }, [id, queryParams.pagina, queryParams.items_por_pagina, queryParams.filtro, queryParams.estado]);

    // Debounce search input and refetch positions
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            setQueryParams((prev: any) => ({ ...prev, filtro: searchInput, pagina: 1 }));
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    // Reset pagination when id changes
    useEffect(() => {
        if (id) {
            setQueryParams((prev: any) => ({ ...prev, pagina: 1 }));
        }
    }, [id]);

    const loadUnitData = async () => {
        if (!id) return;
        const response = await getUnitById(id);
        if (response && response.success) {
            setUnit(response.data.unidad);
        }
    };

    const loadPositions = async () => {
        if (!id) return;
        const response = await getPositions({ ...queryParams, unidad_id: id });
        if (response && response.success) {
            setPositions(response.data.puestos);
            setPagination(response.data.paginacion);
        }
    };

    const handleUpdateUnit = async (data: any) => {
        if (!unit) return;
        const response = await updateUnit(unit.id, data);
        if (response) {
            setEditUnitModalOpen(false);
            loadUnitData();
        }
    };

    const handleDeleteUnit = async () => {
        if (!unit) return;
        const success = await deleteUnit(unit.id);
        if (success) {
            navigate(ROUTES.ORG_CHART);
        }
    };

    const handleCreatePosition = async (data: Omit<Position, 'id' | 'estado'>) => {
        const response = await createPosition(data);
        if (response) {
            setPositionModalOpen(false);
            loadPositions();
        }
    };

    const handleUpdatePosition = async (data: Omit<Position, 'id' | 'estado'>) => {
        if (!editingPosition) return;
        const response = await updatePosition(editingPosition.id, data);
        if (response) {
            setPositionModalOpen(false);
            setEditingPosition(null);
            loadPositions();
        }
    };

    const handleDeletePosition = async () => {
        if (!positionToDelete) return;
        const success = await deletePosition(positionToDelete.id);
        if (success) {
            setDeletePositionModalOpen(false);
            setPositionToDelete(null);
            loadPositions();
        }
    };

    const handleAddSubunit = async (data: any) => {
        if (!unit) return;
        const payload = { ...data, padre_id: unit.id };
        const response = await createUnit(payload);
        if (response) {
            setAddSubunitModalOpen(false);
            loadUnitData();
        }
    };

    const updateQueryParam = (key: string, value: any) => {
        setQueryParams((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleFilterChange = (key: string, value: string | number) => {
        setQueryParams((prev: any) => ({ ...prev, [key]: value, pagina: 1 }));
    };

    const handleSearch = (term: string) => {
        setSearchInput(term);
    };

    const clearFilters = () => {
        setQueryParams((prev: any) => ({
            ...prev,
            filtro: '',
            estado: undefined,
            pagina: 1
        }));
        setSearchInput('');
    };

    const positionFilterDefinitions: FilterDefinition[] = [
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: 'Ocupado', value: 'OCUPADO' },
                { label: 'Vacante', value: 'VACANTE' }
            ]
        }
    ];

    const activePositionFilters = {
        ...(queryParams.estado && { estado: queryParams.estado })
    };

    const positionsColumns: TableColumn<Position>[] = [
        {
            key: 'nombre',
            label: 'Puesto',
            render: (pos) => (
                <div className="flex flex-col">
                    <span className="font-bold text-base-content hover:underline cursor-pointer" onClick={() => navigate(ROUTES.ORG_POSITION_DETAIL(pos.id))}>
                        {pos.nombre}
                    </span>
                    <span className="text-xs text-base-content/50">ID: {pos.id}</span>
                </div>
            )
        },
        {
            key: 'cargo_nombre',
            label: 'Cargo (Perfil)',
            render: (pos) => (
                pos.cargo_nombre || <span className="text-base-content/40 italic text-sm">Sin asignar</span>
            )
        },
        {
            key: 'persona_nombre',
            label: 'Persona Asignada',
            render: (pos) => pos.persona_nombre ? (
                <div className="flex items-center gap-2">
                    <Avatar
                        src={pos.colaborador_foto}
                        name={pos.persona_nombre}
                        size="sm"
                    />
                    <span>{pos.persona_nombre}</span>
                </div>
            ) : (
                <span className="text-base-content/40 italic text-sm">Vacante</span>
            )
        },
        {
            key: 'jefe_puesto_nombre',
            label: 'Reporta a',
            render: (pos) => pos.jefe_puesto_nombre ? (
                <span>{pos.jefe_puesto_nombre}</span>
            ) : (
                <span className="text-base-content/40 italic text-sm">Nadie (Jefe General)</span>
            )
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (pos) => {
                let color = 'badge-warning';
                if (pos.estado === 'OCUPADO') color = 'badge-success';
                return <div className={`badge ${color} badge-sm`}>{pos.estado}</div>;
            }
        },
    ];

    const positionsActions: TableAction<Position>[] = [
        {
            label: 'Ver Detalle',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
            onClick: (pos) => navigate(ROUTES.ORG_POSITION_DETAIL(pos.id)),
            variant: 'ghost'
        },
        {
            label: 'Editar',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
            onClick: (pos) => {
                setEditingPosition(pos);
                setPositionModalOpen(true);
            },
            variant: 'ghost'
        },
        {
            label: 'Eliminar',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
            onClick: (pos) => {
                setPositionToDelete(pos);
                setDeletePositionModalOpen(true);
            },
            variant: 'ghost'
        },
    ];


    if (!unit) {
        return (
            <PageContainer title="Cargando..." subtitle="">
                <LoadingIndicator />
            </PageContainer>
        );
    }

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Organigrama', to: ROUTES.ORG_CHART },
        { label: unit.nombre || 'Cargando...', to: undefined }
    ];

    return (
        <PageContainer
            title={unit.nombre}
            subtitle={unit.descripcion || 'Unidad organizacional'}
            breadcrumbs={breadcrumbs}
            actions={(
                <div className="flex flex-wrap items-center gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditUnitModalOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Editar Unidad
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => setDeleteUnitModalOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Eliminar Unidad
                    </button>
                </div>
            )}
        >
            <Tabs
                tabs={[
                    {
                        id: 'info',
                        label: 'Información General',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ),
                    },
                    {
                        id: 'subunits',
                        label: 'Sub-unidades',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        ),
                    },
                    {
                        id: 'positions',
                        label: `Puestos de Trabajo (${pagination?.total || 0})`,
                        icon: (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        ),
                    },
                ]}
                activeTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId as 'info' | 'subunits' | 'positions')}
                variant="bordered"
            />

            <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                    <motion.div
                        key="info"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="card bg-base-100 shadow mt-6">
                            <div className="card-body">
                                <h3 className="card-title">Detalles de la Unidad</h3>
                                <p><strong>Nombre:</strong> {unit.nombre}</p>
                                <p><strong>Descripción:</strong> {unit.descripcion || 'N/A'}</p>
                                <p><strong>Tipo:</strong> {unit.tipo || 'N/A'}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'subunits' && (
                    <motion.div
                        key="subunits"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="flex justify-end mb-4 mt-6">
                            <button className="btn btn-primary shrink-0 w-full sm:w-auto" onClick={() => setAddSubunitModalOpen(true)}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Añadir Sub-unidad
                            </button>
                        </div>
                        <div className="bg-base-100/50 p-6 rounded-xl border border-base-200 min-h-[150px] overflow-auto">
                            {unitLoading && !unit.subnodos?.length ? (
                                <LoadingIndicator />
                            ) : (
                                <>
                                    {unit.subnodos && unit.subnodos.length === 0 ? (
                                        <div className="text-center py-6 opacity-60">
                                            <p>No hay sub-unidades definidas.</p>
                                            <button className="btn btn-link" onClick={() => setAddSubunitModalOpen(true)}>Añadir primera sub-unidad</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {unit.subnodos?.map(node => (
                                                <OrgUnitNode
                                                    key={node.id}
                                                    unit={node}
                                                    onEdit={() => { /* Not implemented yet for direct edit from here */ }}
                                                    onAddChild={() => { /* Not implemented yet for direct add child from here */ }}
                                                    onDelete={() => { /* Not implemented yet for direct delete from here */ }}
                                                    onViewDetails={() => navigate(ROUTES.ORG_UNIT_DETAIL(node.id))}
                                                // hideActions={true} // Removed as prop does not exist
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'positions' && (
                    <motion.div
                        key="positions"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-start">
                            <FilterBar
                                onSearch={handleSearch}
                                searchTerm={searchInput}
                                searchPlaceholder="Buscar puestos..."
                                filters={positionFilterDefinitions}
                                activeFilters={activePositionFilters}
                                onFilterChange={handleFilterChange}
                                onClearFilters={clearFilters}
                            />
                            
                            <button className="btn btn-primary shrink-0 w-full sm:w-auto" onClick={() => { setEditingPosition(null); setPositionModalOpen(true); }}>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Añadir Puesto
                            </button>
                        </div>
                        
                        <GenericTable
                            data={positions}
                            columns={positionsColumns}
                            actions={positionsActions}
                            keyExtractor={(pos) => pos.id}
                            pagination={pagination}
                            onPageChange={(page) => updateQueryParam('pagina', page)}
                            onPageSizeChange={(size) => updateQueryParam('items_por_pagina', size)}
                            emptyMessage="No se encontraron puestos de trabajo en esta unidad."
                            isLoading={positionLoading}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Unit Modal */}
            <GenericModal
                isOpen={editUnitModalOpen}
                onClose={() => setEditUnitModalOpen(false)}
                title="Editar Unidad Organizacional"
                size="lg"
            >
                <OrgUnitForm
                    initialData={unit}
                    isLoading={unitLoading}
                    onSubmit={handleUpdateUnit}
                    onCancel={() => setEditUnitModalOpen(false)}
                />
            </GenericModal>

            {/* Add Subunit Modal */}
            <GenericModal
                isOpen={addSubunitModalOpen}
                onClose={() => setAddSubunitModalOpen(false)}
                title={`Crear Sub-unidad en ${unit.nombre}`}
                size="lg"
            >
                <OrgUnitForm
                    parentUnit={unit}
                    isLoading={unitLoading}
                    onSubmit={handleAddSubunit}
                    onCancel={() => setAddSubunitModalOpen(false)}
                    initialData={null} // Provide initialData to satisfy type requirement
                />
            </GenericModal>

            {/* Create/Edit Position Modal */}
            <GenericModal
                isOpen={positionModalOpen}
                onClose={() => setPositionModalOpen(false)}
                title={editingPosition ? 'Editar Puesto' : `Crear Puesto en ${unit.nombre}`}
                size="lg"
            >
                <PositionForm
                    initialData={editingPosition}
                    unitId={unit.id}
                    unitName={unit.nombre}
                    // availablePositions={positions} // No longer needed, will fetch dynamically
                    isLoading={positionLoading}
                    onSubmit={editingPosition ? handleUpdatePosition : handleCreatePosition}
                    onCancel={() => setPositionModalOpen(false)}
                />
            </GenericModal>

            {/* Delete Unit Confirmation */}
            <ConfirmationModal
                isOpen={deleteUnitModalOpen}
                onClose={() => setDeleteUnitModalOpen(false)}
                onConfirm={handleDeleteUnit}
                title="Eliminar Unidad Organizacional"
                message={unit.subnodos && unit.subnodos.length > 0
                    ? `⚠️ Esta unidad tiene ${unit.subnodos.length} sub-unidades y/o ${positions.length} puestos. No se puede eliminar hasta que mueva o elimine sus dependientes.`
                    : `¿Está seguro de eliminar la unidad "${unit.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />

            {/* Delete Position Confirmation */}
            <ConfirmationModal
                isOpen={deletePositionModalOpen}
                onClose={() => setDeletePositionModalOpen(false)}
                onConfirm={handleDeletePosition}
                title="Eliminar Puesto"
                message={`¿Está seguro de eliminar el puesto "${positionToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </PageContainer>
    );
};

export default OrgUnitDetailPage;
