import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePositionService, Position } from '../../services/positionService';
import { OrgUnit } from '../../services/orgUnitService';
import { Pagination } from '../../services/responseType';
import GenericModal from '../Common/GenericModal';
import ConfirmationModal from '../Common/ConfirmationModal';
import GenericTable, { TableColumn, TableAction } from '../Common/GenericTable';
import Avatar from '../Common/Avatar';
import PositionForm from '../Positions/PositionForm';
import FilterBar, { FilterDefinition } from '../Common/FilterBar';
import { ROUTES } from '../../constants/routes';
import Button from '../Common/Button';
import { Plus, Eye, Pencil, Trash2 } from '../Common/Icon';

const ITEMS_PER_PAGE = 10;

interface OrgUnitPositionsTabProps {
    unit: OrgUnit;
}

const OrgUnitPositionsTab: React.FC<OrgUnitPositionsTabProps> = ({ unit }) => {
    const navigate = useNavigate();
    const { getPositions, createPosition, updatePosition, deletePosition, loading: positionLoading } = usePositionService();

    const [positions, setPositions] = useState<Position[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [queryParams, setQueryParams] = useState<any>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        filtro: '',
        estado: undefined,
    });
    
    const [positionModalOpen, setPositionModalOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [deletePositionModalOpen, setDeletePositionModalOpen] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);

    const isFirstRender = useRef(true);

    useEffect(() => {
        loadPositions();
    }, [unit.id, queryParams.pagina, queryParams.items_por_pagina, queryParams.filtro, queryParams.estado]);

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

    const loadPositions = async () => {
        const response = await getPositions({ ...queryParams, unidad_id: unit.id });
        if (response && response.success) {
            setPositions(response.data.puestos);
            setPagination(response.data.paginacion);
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
            icon: <Eye size={20} />,
            onClick: (pos) => navigate(ROUTES.ORG_POSITION_DETAIL(pos.id)),
            variant: 'ghost'
        },
        {
            label: 'Editar',
            icon: <Pencil size={20} />,
            onClick: (pos) => {
                setEditingPosition(pos);
                setPositionModalOpen(true);
            },
            variant: 'ghost'
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={20} />,
            onClick: (pos) => {
                setPositionToDelete(pos);
                setDeletePositionModalOpen(true);
            },
            variant: 'ghost'
        },
    ];

    return (
        <div className="space-y-4">
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
                
                <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingPosition(null); setPositionModalOpen(true); }} className="shrink-0 w-full sm:w-auto">
                    Añadir Puesto
                </Button>
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
                    isLoading={positionLoading}
                    onSubmit={editingPosition ? handleUpdatePosition : handleCreatePosition}
                    onCancel={() => setPositionModalOpen(false)}
                />
            </GenericModal>

            <ConfirmationModal
                isOpen={deletePositionModalOpen}
                onClose={() => setDeletePositionModalOpen(false)}
                onConfirm={handleDeletePosition}
                title="Eliminar Puesto"
                message={`¿Está seguro de eliminar el puesto "${positionToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default OrgUnitPositionsTab;
