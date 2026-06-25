import React, { useState, useEffect } from 'react';
import { Person } from '../../services/personService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import FormSection from '../Common/Forms/FormSection';
import AutocompleteField from '../Common/Forms/AutocompleteField';
import { useUserService, SystemUser } from '../../services/userService';

interface PersonFormProps {
    initialData?: Person | null;
    isLoading?: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const PersonForm: React.FC<PersonFormProps> = ({ initialData, isLoading = false, onSubmit, onCancel }) => {
    const { getUsers, getUserById } = useUserService();
    const [usuarios, setUsuarios] = useState<SystemUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        email_personal: '',
        telefono: '',
        fecha_ingreso: '',
        estado: 'ACTIVO'
    });

    // Load initial user details if editing a collaborator that has a linked user
    useEffect(() => {
        const loadInitialUser = async () => {
            if (initialData && initialData.usuario_id) {
                const response = await getUserById(initialData.usuario_id);
                if (response && response.success && response.data) {
                    setSelectedUser(response.data);
                    setSearchQuery(response.data.email);
                }
            } else {
                setSelectedUser(null);
                setSearchQuery('');
            }
        };
        loadInitialUser();
    }, [initialData]);

    // Handle typing in search input (with debounced API call)
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setUsuarios([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const response = await getUsers({ search: searchQuery, items_por_pagina: 10 });
            if (response && response.success) {
                const list: SystemUser[] = response.data.datos || [];
                // Only show users without collaborator, OR the currently selected one
                const filtered = list.filter(u => 
                    !u.colaborador || (selectedUser && u.id === selectedUser.id)
                );
                setUsuarios(filtered);
            }
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombres: initialData.nombres,
                apellidos: initialData.apellidos,
                email_personal: initialData.email_personal || '',
                telefono: initialData.telefono || '',
                fecha_ingreso: initialData.fecha_ingreso || '',
                estado: initialData.estado
            });
        } else {
            setFormData({
                nombres: '',
                apellidos: '',
                email_personal: '',
                telefono: '',
                fecha_ingreso: '',
                estado: 'ACTIVO'
            });
            setSelectedUser(null);
            setSearchQuery('');
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectUser = (opt: any) => {
        const matched = usuarios.find(u => u.id === opt.id);
        if (matched) {
            setSelectedUser(matched);
            setSearchQuery(matched.email);
        }
    };

    const handleClearUser = () => {
        setSelectedUser(null);
        setSearchQuery('');
        setUsuarios([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            usuario_id: selectedUser ? selectedUser.id : undefined
        });
    };

    // Map SystemUser objects to AutocompleteOption format
    const autocompleteOptions = usuarios.map(u => ({
        id: u.id,
        name: u.email
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormSection title="Datos Personales">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Nombres"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        required
                    />
                    <InputField
                        label="Apellidos"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        required
                    />
                    <InputField
                        label="Email Personal"
                        name="email_personal"
                        type="email"
                        value={formData.email_personal}
                        onChange={handleChange}
                    />
                    <InputField
                        label="Teléfono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                    />
                </div>
            </FormSection>

            <FormSection title="Información Laboral & Acceso">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <InputField
                        label="Fecha de Ingreso"
                        name="fecha_ingreso"
                        type="date"
                        value={formData.fecha_ingreso}
                        onChange={handleChange}
                    />
                    <SelectField
                        label="Estado Laboral"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        options={[
                            { value: 'ACTIVO', label: 'Activo' },
                            { value: 'INACTIVO', label: 'Inactivo' },
                            { value: 'LICENCIA', label: 'Licencia' }
                        ]}
                    />
                </div>

                <AutocompleteField
                    label="Usuario de Acceso Asociado"
                    placeholder="Escriba para buscar cuenta de usuario por correo..."
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    options={autocompleteOptions}
                    onSelect={handleSelectUser}
                    onClear={handleClearUser}
                    selectedItem={selectedUser ? { id: selectedUser.id, name: selectedUser.email } : null}
                    isLoading={isSearching}
                    helpText={selectedUser 
                        ? `Vinculado actualmente a la cuenta: ${selectedUser.email}`
                        : "Asocie una cuenta de acceso del sistema para este colaborador"}
                />
            </FormSection>

            <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? <span className="loading loading-spinner"></span> : initialData ? 'Guardar Cambios' : 'Crear Colaborador'}
                </button>
            </div>
        </form>
    );
};

export default PersonForm;
