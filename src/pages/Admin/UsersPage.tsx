
import React, { useState, useEffect } from 'react';
import PageContainer from '../../components/Common/PageContainer';
import GenericTable, { TableColumn, TableAction } from '../../components/Common/GenericTable';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import FilterBar from '../../components/Common/FilterBar';
import Avatar from '../../components/Common/Avatar';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { useUserService, SystemUser } from '../../services/userService';
import UserForm from '../../components/Users/UserForm';
import { ROUTES } from '../../constants/routes';
import useUIStore from '../../store/uiStore';

const UsersPage: React.FC = () => {
    const { getUsers, createUser, updateUser, deleteUser, resetPassword, loading } = useUserService();
    const { openAlert } = useUIStore();

    // State
    const [users, setUsers] = useState<SystemUser[]>([]);
    // State for FilterBar
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        rol: undefined,
        estado: undefined
    });

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<SystemUser | null>(null);

    useEffect(() => {
        loadUsers();
    }, [queryParams]);

    const loadUsers = async () => {
        const response = await getUsers(queryParams);
        if (response && response.success) {
            setUsers(response.data.usuarios);
        }
    };

    const handleCreate = async (data: any) => {
        const response = await createUser(data);
        if (response && response.success) {
            setModalOpen(false);
            loadUsers();
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingUser) return;
        const response = await updateUser(editingUser.id, data);
        if (response && response.success) {
            setModalOpen(false);
            setEditingUser(null);
            loadUsers();
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        const success = await deleteUser(userToDelete.id);
        if (success) {
            setDeleteModalOpen(false);
            setUserToDelete(null);
            loadUsers();
        }
    };

    const handleResetPassword = (user: SystemUser) => {
        setUserToReset(user);
        setResetPasswordModalOpen(true);
    };

    const confirmResetPassword = async () => {
        if (!userToReset) return;
        await resetPassword(userToReset.id);
        setResetPasswordModalOpen(false);
        openAlert(`Correo de restablecimiento enviado a ${userToReset.email}`, 'success');
        setUserToReset(null);
    };

    // Filter Definitions
    const filterDefinitions = [
        {
            key: 'rol',
            label: 'Rol',
            options: [
                { label: 'Administrador', value: 'ADMIN' },
                { label: 'Gerente RRHH', value: 'HR_MANAGER' },
                { label: 'Evaluador', value: 'EVALUATOR' },
                { label: 'Empleado', value: 'EMPLOYEE' }
            ]
        },
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: 'Activo', value: 'ACTIVO' },
                { label: 'Inactivo', value: 'INACTIVO' },
                { label: 'Bloqueado', value: 'BLOQUEADO' }
            ]
        }
    ];

    const activeFilters = {
        ...(queryParams.rol && { rol: queryParams.rol }),
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
            rol: undefined,
            estado: undefined
        });
    };

    // Table Config
    const columns: TableColumn<SystemUser>[] = [
        {
            key: 'email',
            label: 'Usuario (Email)',
            sortable: true,
            render: (user) => (
                <div className="flex flex-col">
                    <span className="font-bold">{user.email}</span>
                    <span className="text-xs text-base-content/50">ID: {user.id}</span>
                </div>
            )
        },
        {
            key: 'persona',
            label: 'Perfil Asociado',
            render: (user) => user.persona ? (
                <div className="flex items-center gap-2">
                    <Avatar
                        src={user.persona.foto}
                        name={`${user.persona.nombres} ${user.persona.apellidos}`}
                        size="sm"
                    />
                    <span className="text-primary font-medium hover:underline cursor-pointer">
                        {user.persona.nombres} {user.persona.apellidos}
                    </span>
                    <span className="badge badge-xs badge-ghost ml-1">Link</span>
                </div>
            ) : (
                <span className="text-base-content/40 italic text-sm">Sin vincular</span>
            )
        },
        {
            key: 'rol',
            label: 'Rol',
            sortable: true,
            render: (user) => (
                <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                            <div key={role} className="badge badge-outline badge-sm">{role}</div>
                        ))
                    ) : (
                        <span className="text-xs text-base-content/50 italic">Sin rol</span>
                    )}
                </div>
            )
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (user) => {
                let color = 'badge-ghost';
                if (user.estado === 'ACTIVO') color = 'badge-success';
                if (user.estado === 'BLOQUEADO') color = 'badge-error';
                return <div className={`badge ${color} badge-sm`}>{user.estado}</div>;
            }
        },
        {
            key: 'ultimo_acceso',
            label: 'Último Acceso',
            render: (user) => user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleDateString() : '-'
        }
    ];

    const actions: TableAction<SystemUser>[] = [
        {
            label: 'Editar',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
            onClick: (user) => {
                setEditingUser(user);
                setModalOpen(true);
            },
            variant: 'ghost'
        },
        {
            label: 'Reset Password',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
            onClick: handleResetPassword,
            variant: 'ghost',
            tooltip: 'Resetear Contraseña'
        },
        {
            label: 'Eliminar',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
            onClick: (user) => {
                setUserToDelete(user);
                setDeleteModalOpen(true);
            },
            variant: 'ghost' // Will be styled as error in table if configured
        }
    ];

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Configuración', to: undefined },
        { label: 'Usuarios y Roles', to: undefined }
    ];

    return (
        <PageContainer
            title="Gestión de Usuarios"
            subtitle="Administre el acceso al sistema y roles de seguridad"
            breadcrumbs={breadcrumbs}
            actions={
                <button className="btn btn-primary" onClick={() => { setEditingUser(null); setModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Nuevo Usuario
                </button>
            }
        >
            <FilterBar
                onSearch={handleSearch}
                searchTerm={queryParams.search || ''}
                searchPlaceholder="Buscar por email o nombre..."
                filters={filterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {loading && !users.length ? (
                <LoadingIndicator />
            ) : (
                <GenericTable
                    data={users}
                    columns={columns}
                    actions={actions}
                    keyExtractor={(user) => user.id}
                    currentPage={1}
                    totalPages={1}
                    pageSize={10}
                    onPageChange={() => { }}
                    onPageSizeChange={() => { }}
                    emptyMessage="No se encontraron usuarios"
                    isLoading={loading}
                />
            )}

            {/* Create/Edit Modal */}
            <GenericModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            >
                <UserForm
                    initialData={editingUser}
                    isLoading={loading}
                    onSubmit={editingUser ? handleUpdate : handleCreate}
                    onCancel={() => setModalOpen(false)}
                />
            </GenericModal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Usuario"
                message={`¿Está seguro de eliminar el acceso para ${userToDelete?.email}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar Definitivamente"
                variant="danger"
            />

            {/* Reset Password Confirmation */}
            <ConfirmationModal
                isOpen={resetPasswordModalOpen}
                onClose={() => {
                    setResetPasswordModalOpen(false);
                    setUserToReset(null);
                }}
                onConfirm={confirmResetPassword}
                title="Restablecer Contraseña"
                message={`¿Está seguro de enviar un correo para restablecer la contraseña de ${userToReset?.email}?`}
                confirmText="Enviar Correo"
                variant="info"
            />
        </PageContainer>
    );
};

export default UsersPage;
