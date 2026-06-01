import React, { useState, useEffect } from 'react';
import { UserRole, ROLE_LABELS } from '../../constants/roles';
import { UserStatus, USER_STATUS_LABELS } from '../../constants/userStatus';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import CheckboxGroup from '../Common/Forms/CheckboxGroup';
import AutocompleteField from '../Common/Forms/AutocompleteField';
import { usePersonService, Person } from '../../services/personService';

interface UserFormProps {
    initialData?: any; // Will be updated to proper type
    isLoading?: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, isLoading = false, onSubmit, onCancel }) => {
    const { getPeople } = usePersonService();
    const [email, setEmail] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [estado, setEstado] = useState<UserStatus>(UserStatus.ACTIVO);

    // States for autocomplete / search collaborator
    const [colaboradores, setColaboradores] = useState<Person[]>([]);
    const [selectedColaborador, setSelectedColaborador] = useState<Person | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Load initial collaborator if editing
    useEffect(() => {
        if (initialData) {
            setEmail(initialData.email);
            setSelectedRoles(initialData.roles || []);
            setEstado(initialData.estado);
            
            if (initialData.colaborador) {
                setSelectedColaborador(initialData.colaborador);
                setSearchQuery(`${initialData.colaborador.nombres} ${initialData.colaborador.apellidos}`);
            } else {
                setSelectedColaborador(null);
                setSearchQuery('');
            }
        } else {
            setEmail('');
            setSelectedRoles([UserRole.EMPLOYEE]); // Default role
            setEstado(UserStatus.ACTIVO);
            setSelectedColaborador(null);
            setSearchQuery('');
        }
    }, [initialData]);

    // Handle typing in search input (with debounced API call)
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setColaboradores([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const response = await getPeople({ search: searchQuery, items_por_pagina: 10 });
            if (response && response.success) {
                const list: Person[] = response.data.datos || response.data.personas || [];
                // Only show collaborators without user, OR the currently selected one
                const filtered = list.filter(c => 
                    !c.usuario_id || (selectedColaborador && c.id === selectedColaborador.id)
                );
                setColaboradores(filtered);
            }
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectCollaborator = (opt: any) => {
        // Find the matched collaborator object
        const matched = colaboradores.find(c => c.id === opt.id);
        if (matched) {
            setSelectedColaborador(matched);
            setSearchQuery(`${matched.nombres} ${matched.apellidos}`);
        }
    };

    const handleClearCollaborator = () => {
        setSelectedColaborador(null);
        setSearchQuery('');
        setColaboradores([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            correo: email,
            roles: selectedRoles,
            estado,
            colaborador_id: selectedColaborador ? selectedColaborador.id : undefined
        });
    };

    const roleOptions = [
        { value: UserRole.ADMIN, label: ROLE_LABELS[UserRole.ADMIN] },
        { value: UserRole.HR_MANAGER, label: ROLE_LABELS[UserRole.HR_MANAGER] },
        { value: UserRole.EVALUATOR, label: ROLE_LABELS[UserRole.EVALUATOR] },
        { value: UserRole.EMPLOYEE, label: ROLE_LABELS[UserRole.EMPLOYEE] },
    ];

    const statusOptions = [
        { value: UserStatus.ACTIVO, label: USER_STATUS_LABELS[UserStatus.ACTIVO] },
        { value: UserStatus.INACTIVO, label: USER_STATUS_LABELS[UserStatus.INACTIVO] },
        { value: UserStatus.PENDIENTE, label: USER_STATUS_LABELS[UserStatus.PENDIENTE] }
    ];

    // Map Person objects to AutocompleteOption format
    const autocompleteOptions = colaboradores.map(c => ({
        id: c.id,
        name: `${c.nombres} ${c.apellidos}`,
        detail: c.email_personal
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
                label="Correo Corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                required
                type="email"
                helpText="Será utilizado como usuario de acceso"
            />

            <AutocompleteField
                label="Colaborador Asociado (Ficha de Personal)"
                placeholder="Escriba para buscar colaborador por nombre o correo..."
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                options={autocompleteOptions}
                onSelect={handleSelectCollaborator}
                onClear={handleClearCollaborator}
                selectedItem={selectedColaborador ? {
                    id: selectedColaborador.id,
                    name: `${selectedColaborador.nombres} ${selectedColaborador.apellidos}`
                } : null}
                isLoading={isSearching}
                helpText={selectedColaborador 
                    ? `Vinculado actualmente a: ${selectedColaborador.nombres} ${selectedColaborador.apellidos}`
                    : "Vincule este usuario de acceso con su ficha personal en el directorio"}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CheckboxGroup
                    label="Roles del Sistema"
                    options={roleOptions}
                    selectedValues={selectedRoles}
                    onChange={setSelectedRoles}
                    helpText="Permisos y funciones disponibles."
                />

                <SelectField
                    label="Estado de Cuenta"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as UserStatus)}
                    options={statusOptions}
                    required
                    helpText="Estado actual de la cuenta"
                />
            </div>

            <div className="alert alert-info text-sm shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                    <h3 className="font-bold">Nota de Seguridad</h3>
                    <div className="text-xs">Se enviará un correo de invitación para configurar la contraseña.</div>
                </div>
            </div>

            <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || selectedRoles.length === 0}
                >
                    {isLoading && <span className="loading loading-spinner"></span>}
                    {initialData ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;
