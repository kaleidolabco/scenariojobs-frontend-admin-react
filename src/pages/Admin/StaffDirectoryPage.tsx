
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

const StaffDirectoryPage: React.FC = () => {
    const { getPeople, createPerson, updatePerson, deletePerson, loading } = usePersonService();

    // State
    const [people, setPeople] = useState<Person[]>([]);
    // State for FilterBar
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        departamento: undefined,
        estado: undefined
    });

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

    useEffect(() => {
        loadPeople();
    }, [queryParams]);

    const loadPeople = async () => {
        const response = await getPeople(queryParams);
        if (response && response.success) {
            setPeople(response.data.personas);
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
        setQueryParams((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSearch = (term: string) => {
        setQueryParams((prev: any) => ({ ...prev, search: term }));
    };

    const clearFilters = () => {
        setQueryParams({
            search: '',
            departamento: undefined,
            estado: undefined
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
            render: (person) => person.fecha_ingreso || '-'
        }
    ];

    const actions: TableAction<Person>[] = [
        {
            label: 'Ver Perfil',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884.896 1.688 2 2.333V9a2 2 0 11-4 0V8.333c1.104-.645 2-1.449 2-2.333z" /></svg>,
            onClick: () => { }, // Future implementation: Go to details
            variant: 'ghost'
        },
        {
            label: 'Editar',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
            onClick: (person) => {
                setEditingPerson(person);
                setModalOpen(true);
            },
            variant: 'ghost'
        },
        {
            label: 'Eliminar',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
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
                <button className="btn btn-primary" onClick={() => { setEditingPerson(null); setModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    Nuevo Colaborador
                </button>
            }
        >
            <FilterBar
                onSearch={handleSearch}
                searchTerm={queryParams.search || ''}
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
                    currentPage={1}
                    totalPages={1}
                    pageSize={10}
                    onPageChange={() => { }}
                    onPageSizeChange={() => { }}
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
