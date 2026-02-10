import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import { usePositionService, Position } from '../../services/positionService';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import OrgUnitForm from '../../components/OrgUnits/OrgUnitForm';
import OrgUnitNode from '../../components/OrgUnits/OrgUnitNode';
import PositionForm from '../../components/Positions/PositionForm';
import { ROUTES } from '../../constants/routes';

const OrgUnitDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getUnitById, updateUnit, deleteUnit, createUnit, loading: unitLoading } = useOrgUnitService();
    const { getPositions, createPosition, updatePosition, deletePosition, loading: positionLoading } = usePositionService();

    const [unit, setUnit] = useState<OrgUnit | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'subunits' | 'positions'>('positions');

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
        const response = await getPositions({ unidad_id: id });
        if (response && response.success) {
            setPositions(response.data.puestos);
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

    const handlePositionClick = (position: Position) => {
        navigate(ROUTES.ORG_POSITION_DETAIL(position.id));
    };

    const handleAddSubunit = async (data: any) => {
        const payload = { ...data, padre_id: unit?.id };
        const response = await createUnit(payload);
        if (response) {
            setAddSubunitModalOpen(false);
            loadUnitData();
        }
    };

    if (!unit) {
        return (
            <PageContainer title="Cargando..." subtitle="">
                <div className="flex justify-center p-10">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </PageContainer>
        );
    }

    // Table configuration for positions
    const positionColumns: TableColumn<Position>[] = [
        {
            key: 'nombre',
            label: 'Puesto',
            sortable: true,
            render: (pos) => (
                <div>
                    <div className="font-semibold">{pos.nombre}</div>
                    <div className="text-xs text-base-content/60">{pos.cargo_nombre}</div>
                </div>
            )
        },
        {
            key: 'persona_nombre',
            label: 'Persona Asignada',
            render: (pos) => pos.persona_nombre ? (
                <div className="flex items-center gap-2">
                    <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8 flex items-center justify-center">
                            <span className="text-xs">{pos.persona_nombre.charAt(0)}</span>
                        </div>
                    </div>
                    <span>{pos.persona_nombre}</span>
                </div>
            ) : (
                <span className="text-warning font-bold">Vacante</span>
            )
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (pos) => (
                <div className={`badge ${pos.estado === 'OCUPADO' ? 'badge-success' : 'badge-warning'}`}>
                    {pos.estado}
                </div>
            )
        }
    ];

    const positionActions: TableAction<Position>[] = [
        {
            label: 'Ver Detalle',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            onClick: handlePositionClick,
            variant: 'ghost',
            tooltip: 'Ver detalles del puesto'
        },
        {
            label: 'Editar',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            onClick: (pos) => {
                setEditingPosition(pos);
                setPositionModalOpen(true);
            },
            variant: 'ghost',
            tooltip: 'Editar puesto'
        },
        {
            label: 'Eliminar',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            onClick: (pos) => {
                setPositionToDelete(pos);
                setDeletePositionModalOpen(true);
            },
            variant: 'ghost',
            tooltip: 'Eliminar puesto'
        }
    ];

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Organigrama', to: ROUTES.ORG_CHART },
        { label: unit ? unit.nombre : 'Cargando...', to: undefined }
    ];

    return (
        <PageContainer
            title={unit.nombre}
            subtitle={`${unit.tipo} - ${unit.descripcion || 'Sin descripción'}`}
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditUnitModalOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => setDeleteUnitModalOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                    </button>
                </div>
            }
        >
            {/* Tabs */}
            <div className="tabs tabs-border mb-6">
                <a className={`tab ${activeTab === 'positions' ? 'tab-active' : ''}`} onClick={() => setActiveTab('positions')}>
                    Puestos ({positions.length})
                </a>
                <a className={`tab ${activeTab === 'subunits' ? 'tab-active' : ''}`} onClick={() => setActiveTab('subunits')}>
                    Sub-unidades ({unit.subnodos?.length || 0})
                </a>
                <a className={`tab ${activeTab === 'info' ? 'tab-active' : ''}`} onClick={() => setActiveTab('info')}>
                    Información
                </a>
            </div>

            {/* Tab Content */}
            {activeTab === 'positions' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Puestos en esta unidad</h3>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                setEditingPosition(null);
                                setPositionModalOpen(true);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo Puesto
                        </button>
                    </div>

                    <GenericTable
                        data={positions}
                        columns={positionColumns}
                        actions={positionActions}
                        keyExtractor={(pos) => pos.id}
                        currentPage={1}
                        totalPages={1}
                        pageSize={positions.length}
                        onPageChange={() => { }}
                        onPageSizeChange={() => { }}
                        emptyMessage="No hay puestos en esta unidad"
                    />
                </div>
            )}

            {activeTab === 'subunits' && (
                <div className="bg-base-100/50 p-6 rounded-xl border border-base-200 min-h-[200px] overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Sub-unidades</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setAddSubunitModalOpen(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Sub-unidad
                        </button>
                    </div>

                    {unit.subnodos && unit.subnodos.length > 0 ? (
                        <div className="space-y-4">
                            {unit.subnodos.map(subunit => (
                                <OrgUnitNode
                                    key={subunit.id}
                                    unit={subunit}
                                    onEdit={() => navigate(ROUTES.ORG_UNIT_DETAIL(subunit.id))}
                                    onAddChild={() => { }}
                                    onDelete={() => { }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-base-content/60">
                            No hay sub-unidades
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'info' && (
                <div className="card bg-base-100 rounded-xl border border-base-200 shadow">
                    <div className="card-body">
                        <h3 className="card-title">Información General</h3>
                        <div className="space-y-3">
                            <div>
                                <span className="font-semibold">Tipo:</span> {unit.tipo}
                            </div>
                            <div>
                                <span className="font-semibold">Descripción:</span> {unit.descripcion || 'Sin descripción'}
                            </div>
                            <div>
                                <span className="font-semibold">Puestos:</span> {positions.length}
                            </div>
                            <div>
                                <span className="font-semibold">Sub-unidades:</span> {unit.subnodos?.length || 0}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <GenericModal
                isOpen={editUnitModalOpen}
                onClose={() => setEditUnitModalOpen(false)}
                title="Editar Unidad"
                size="lg"
            >
                <OrgUnitForm
                    initialData={unit}
                    isLoading={unitLoading}
                    onSubmit={handleUpdateUnit}
                    onCancel={() => setEditUnitModalOpen(false)}
                />
            </GenericModal>

            <GenericModal
                isOpen={addSubunitModalOpen}
                onClose={() => setAddSubunitModalOpen(false)}
                title="Nueva Sub-unidad"
                size="lg"
            >
                <OrgUnitForm
                    initialData={null}
                    parentUnit={unit}
                    isLoading={unitLoading}
                    onSubmit={handleAddSubunit}
                    onCancel={() => setAddSubunitModalOpen(false)}
                />
            </GenericModal>

            <GenericModal
                isOpen={positionModalOpen}
                onClose={() => {
                    setPositionModalOpen(false);
                    setEditingPosition(null);
                }}
                title={editingPosition ? 'Editar Puesto' : 'Nuevo Puesto'}
                size="lg"
            >
                <PositionForm
                    initialData={editingPosition}
                    unitId={unit.id}
                    unitName={unit.nombre}
                    availablePositions={positions}
                    isLoading={positionLoading}
                    onSubmit={editingPosition ? handleUpdatePosition : handleCreatePosition}
                    onCancel={() => {
                        setPositionModalOpen(false);
                        setEditingPosition(null);
                    }}
                />
            </GenericModal>

            <ConfirmationModal
                isOpen={deleteUnitModalOpen}
                onClose={() => setDeleteUnitModalOpen(false)}
                onConfirm={handleDeleteUnit}
                title="Eliminar Unidad"
                message={`¿Está seguro de eliminar "${unit.nombre}"? Esta acción eliminará también todos los puestos y sub-unidades asociados.`}
                confirmText="Eliminar"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={deletePositionModalOpen}
                onClose={() => {
                    setDeletePositionModalOpen(false);
                    setPositionToDelete(null);
                }}
                onConfirm={handleDeletePosition}
                title="Eliminar Puesto"
                message={positionToDelete ? `¿Está seguro de eliminar el puesto "${positionToDelete.nombre}"?` : ''}
                confirmText="Eliminar"
                variant="danger"
            />
        </PageContainer>
    );
};

export default OrgUnitDetailPage;
