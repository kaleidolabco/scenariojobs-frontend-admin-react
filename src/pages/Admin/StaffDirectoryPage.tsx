import React, { useState, useEffect } from 'react';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar from '../../components/Common/FilterBar';
import Avatar from '../../components/Common/Avatar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { usePersonService, Person } from '../../services/personService';
import PersonForm from '../../components/Staff/PersonForm';
import { ROUTES } from '../../constants/routes';
import { Pagination } from '../../services/responseType';
import Button from '../../components/Common/Button';
import { Pencil, Trash2, UserPlus, ClipboardList } from '../../components/Common/Icon';

const ITEMS_PER_PAGE = 10;

const StaffDirectoryPage: React.FC = () => {
    const { getPeople, createPerson, updatePerson, deletePerson, loading } = usePersonService();

    // State
    const [people, setPeople] = useState<Person[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    
    // Local search term to enable debouncing
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // State for FilterBar
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        departamento: undefined,
        estado: undefined,
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE
    });

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

    // Debounce the search input to avoid making too many API calls
    useEffect(() => {
        const handler = setTimeout(() => {
            setQueryParams((prev: any) => {
                if (prev.search === localSearchTerm) return prev;
                return { ...prev, search: localSearchTerm, pagina: 1 };
            });
        }, 400);

        return () => clearTimeout(handler);
    }, [localSearchTerm]);

    useEffect(() => {
        loadPeople();
    }, [queryParams]);

    const loadPeople = async () => {
        const response = await getPeople(queryParams);
        if (response && response.success) {
            setPeople(response.data.datos || response.data.personas || []);
            setPagination(response.data.paginacion);
        }
    };

    const handleCreate = async (data: any) => {
        const response = await createPerson(data);
        if (response && response.success) {
            setModalOpen(false);
            loadPeople();
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingPerson) return;
        const response = await updatePerson(editingPerson.id, data);
        if (response && response.success) {
            setModalOpen(false);
            setEditingPerson(null);
            loadPeople();
        }
    };

    const handleDelete = async () => {
        if (!personToDelete) return;
        const success = await deletePerson(personToDelete.id);
        if (success) {
            setDeleteModalOpen(false);
            setPersonToDelete(null);
            loadPeople();
        }
    };

    // Filter Definitions
    const filterDefinitions = [
        {
            key: 'departamento',
            label: 'Departamento',
            options: [
                { label: 'Gerencia', value: 'Gerencia' },
                { label: 'RRHH', value: 'RRHH' },
                { label: 'Tecnología', value: 'Tecnología' },
                { label: 'Operaciones', value: 'Operaciones' }
            ]
        },
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: 'Activo', value: 'ACTIVO' },
                { label: 'Inactivo', value: 'INACTIVO' },
                { label: 'Licencia', value: 'LICENCIA' }
            ]
        }
    ];

    const activeFilters = {
        ...(queryParams.departamento && { departamento: queryParams.departamento }),
        ...(queryParams.estado && { estado: queryParams.estado })
    };

    const handleFilterChange = (key: string, value: any) => {
        setQueryParams((prev: any) => ({ ...prev, [key]: value, pagina: 1 }));
    };

    const handleSearch = (term: string) => {
        setLocalSearchTerm(term);
    };

    const clearFilters = () => {
        setLocalSearchTerm('');
        setQueryParams({
            search: '',
            departamento: undefined,
            estado: undefined,
            pagina: 1,
            items_por_pagina: ITEMS_PER_PAGE
        });
    };

    const updateQueryParam = (key: string, value: any) => {
        setQueryParams((prev: any) => ({ ...prev, [key]: value }));
    };

    const updateQueryParams = (updates: any) => {
        setQueryParams((prev: any) => ({ ...prev, ...updates }));
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        setSortConfig({ key, direction });

        // Map column keys to backend expected fields
        const sortMap: Record<string, string> = {
            'nombres': 'nombres',
            'fecha_ingreso': 'fecha_ingreso'
        };

        const ordenar_por = sortMap[key] || key;

        updateQueryParams({
            ordenar_por,
            orden: direction,
            pagina: 1
        });
    };

    // Table Config
    const columns: TableColumn<Person>[] = [
        {
            key: 'nombres',
            label: 'Nombre Completo',
            sortable: true,
            render: (person) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={person.foto}
                        name={`${person.nombres} ${person.apellidos}`}
                        size="md"
                    />
                    <div>
                        <div className="font-bold">{person.nombres} {person.apellidos}</div>
                        <div className="text-xs text-base-content/50">{person.email_personal}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'puesto_nombre',
            label: 'Puesto & Dept',
            render: (person) => (
                <div>
                    <div className="font-semibold">{person.puesto_nombre || 'Sin Puesto Asignado'}</div>
                    <div className="text-xs opacity-70">{person.departamento || 'Sin departamento'}</div>
                </div>
            )
        },
        {
            key: 'usuario_id',
            label: 'Acceso Sistema',
            render: (person) => person.usuario_id ? (
                <div className="badge badge-success badge-outline gap-1">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    Conectado
                </div>
            ) : (
                <div className="badge badge-ghost badge-outline text-xs">Sin usuario</div>
            )
        },
        {
            key: 'fecha_ingreso',
            label: 'Ingreso',
            sortable: true,
            render: (person) => person.fecha_ingreso ? new Date(person.fecha_ingreso).toLocaleDateString() : '-'
        }
    ];

    const actions: TableAction<Person>[] = [
        {
            label: 'Ver Perfil',
            icon: <ClipboardList size={20} />,
            onClick: () => { }, // Future implementation: Go to details
            variant: 'ghost'
        },
        {
            label: 'Editar',
            icon: <Pencil size={20} />,
            onClick: (person) => {
                setEditingPerson(person);
                setModalOpen(true);
            },
            variant: 'ghost'
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={20} />,
            onClick: (person) => {
                setPersonToDelete(person);
                setDeleteModalOpen(true);
            },
            variant: 'ghost'
        }
    ];

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Talento', to: undefined },
        { label: 'Directorio', to: undefined }
    ];

    return (
        <PageContainer
            title="Directorio de Personal"
            subtitle="Gestione la información de sus colaboradores y su acceso al sistema."
            breadcrumbs={breadcrumbs}
            actions={
                <Button variant="primary" leftIcon={UserPlus} onClick={() => { setEditingPerson(null); setModalOpen(true); }}>
                    Nuevo Colaborador
                </Button>
            }
        >
            <FilterBar
                onSearch={handleSearch}
                searchTerm={localSearchTerm}
                searchPlaceholder="Buscar colaboradores..."
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {loading && !people.length ? (
                <LoadingIndicator />
            ) : (
                <GenericTable
                    data={people}
                    columns={columns}
                    actions={actions}
                    keyExtractor={(person) => person.id}
                    pagination={pagination}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onPageChange={(page) => updateQueryParam('pagina', page)}
                    onPageSizeChange={(size) => updateQueryParams({ items_por_pagina: size, pagina: 1 })}
                    emptyMessage="No se encontraron colaboradores"
                    isLoading={loading}
                />
            )}

            {/* Create/Edit Modal */}
            <GenericModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingPerson ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                size="lg"
            >
                <PersonForm
                    initialData={editingPerson}
                    isLoading={loading}
                    onSubmit={editingPerson ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </GenericModal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Colaborador"
                message={`¿Está seguro de eliminar a ${personToDelete?.nombres} ${personToDelete?.apellidos}? Esto también eliminará su historial laboral.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </PageContainer>
    );
};

export default StaffDirectoryPage;
