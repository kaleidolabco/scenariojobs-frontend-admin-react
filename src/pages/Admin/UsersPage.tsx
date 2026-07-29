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
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import { UserStatus, USER_STATUS_LABELS } from '../../constants/userStatus';
import useUIStore from '../../store/uiStore';
import { Pagination } from '../../services/responseType';
import Button from '../../components/Common/Button';
import { Pencil, Lock, Trash2, Plus } from '../../components/Common/Icon';

const ITEMS_PER_PAGE = 10;

const UsersPage: React.FC = () => {
    const { getUsers, createUser, updateUser, deleteUser, resetPassword, loading } = useUserService();
    const { openAlert } = useUIStore();

    // State
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    
    // Local search term to enable debouncing
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    // State for FilterBar
    const [queryParams, setQueryParams] = useState<any>({
        search: '',
        rol: undefined,
        estado: undefined,
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE
    });

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<SystemUser | null>(null);

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
        loadUsers();
    }, [queryParams]);

    const loadUsers = async () => {
        const response = await getUsers(queryParams);
        if (response && response.success) {
            setUsers(response.data.datos || []);
            setPagination(response.data.paginacion);
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
                { label: ROLE_LABELS[UserRole.ADMIN], value: UserRole.ADMIN },
                { label: ROLE_LABELS[UserRole.HR_MANAGER], value: UserRole.HR_MANAGER },
                { label: ROLE_LABELS[UserRole.EVALUATOR], value: UserRole.EVALUATOR },
                { label: ROLE_LABELS[UserRole.EMPLOYEE], value: UserRole.EMPLOYEE }
            ]
        },
        {
            key: 'estado',
            label: 'Estado',
            options: [
                { label: USER_STATUS_LABELS[UserStatus.ACTIVO], value: UserStatus.ACTIVO },
                { label: USER_STATUS_LABELS[UserStatus.INACTIVO], value: UserStatus.INACTIVO },
                { label: USER_STATUS_LABELS[UserStatus.PENDIENTE], value: UserStatus.PENDIENTE }
            ]
        }
    ];

    const activeFilters = {
        ...(queryParams.rol && { rol: queryParams.rol }),
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
            rol: undefined,
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

        // Map frontend column keys to backend expected sort fields
        const sortMap: Record<string, string> = {
            'email': 'correo',
            'ultimo_acceso': 'ultimo_acceso'
        };

        const ordenar_por = sortMap[key] || key;

        updateQueryParams({
            ordenar_por,
            orden: direction,
            pagina: 1
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
            key: 'colaborador',
            label: 'Colaborador Asociado',
            render: (user) => user.colaborador ? (
                <div className="flex items-center gap-2">
                    <Avatar
                        src={user.colaborador.foto}
                        name={`${user.colaborador.nombres} ${user.colaborador.apellidos}`}
                        size="sm"
                    />
                    <span className="text-primary font-medium hover:underline cursor-pointer">
                        {user.colaborador.nombres} {user.colaborador.apellidos}
                    </span>
                    <span className="badge badge-xs badge-primary ml-1">Link</span>
                </div>
            ) : (
                <span className="text-base-content/40 italic text-sm">Sin vincular</span>
            )
        },
        {
            key: 'rol',
            label: 'Rol',
            sortable: false,
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
                let color = 'badge-warning';
                if (user.estado === UserStatus.ACTIVO) color = 'badge-success';
                if (user.estado === UserStatus.PENDIENTE) color = 'badge-info';
                return <div className={`badge ${color} badge-sm`}>{USER_STATUS_LABELS[user.estado] || user.estado}</div>;
            }
        },
        {
            key: 'ultimo_acceso',
            label: 'Último Acceso',
            sortable: true,
            render: (user) => user.ultimo_acceso ? new Date(user.ultimo_acceso).toLocaleDateString() : '-'
        }
    ];

    const actions: TableAction<SystemUser>[] = [
        {
            label: 'Editar',
            icon: <Pencil size={20} />,
            onClick: (user) => {
                setEditingUser(user);
                setModalOpen(true);
            },
            variant: 'ghost'
        },
        {
            label: 'Reset Password',
            icon: <Lock size={20} />,
            onClick: handleResetPassword,
            variant: 'ghost',
            tooltip: 'Resetear Contraseña'
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={20} />,
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
                <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingUser(null); setModalOpen(true); }}>
                    Nuevo Usuario
                </Button>
            }
        >
            <FilterBar
                onSearch={handleSearch}
                searchTerm={localSearchTerm}
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
                    pagination={pagination}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onPageChange={(page) => updateQueryParam('pagina', page)}
                    onPageSizeChange={(size) => updateQueryParams({ items_por_pagina: size, pagina: 1 })}
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
