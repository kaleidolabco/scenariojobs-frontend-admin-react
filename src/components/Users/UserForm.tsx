import React, { useState, useEffect } from 'react';
import { SystemUser } from '../../services/userService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import CheckboxGroup from '../Common/Forms/CheckboxGroup';

interface UserFormProps {
    initialData?: SystemUser | null;
    isLoading?: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, isLoading = false, onSubmit, onCancel }) => {
    const [email, setEmail] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [estado, setEstado] = useState('ACTIVO');

    useEffect(() => {
        if (initialData) {
            setEmail(initialData.email);
            // Initialize roles, defaulting to empty array if undefined (though interface enforces it now)
            setSelectedRoles(initialData.roles || []);
            setEstado(initialData.estado);
        } else {
            setEmail('');
            setSelectedRoles(['EMPLOYEE']); // Default role
            setEstado('ACTIVO');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            email,
            roles: selectedRoles,
            estado
        });
    };

    const roleOptions = [
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'HR_MANAGER', label: 'Gerente RRHH' },
        { value: 'EVALUATOR', label: 'Evaluador' },
        { value: 'EMPLOYEE', label: 'Empleado' }
    ];

    const statusOptions = [
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'INACTIVO', label: 'Inactivo' },
        { value: 'BLOQUEADO', label: 'Bloqueado' }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
                label="Email Corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                required
                type="email"
                helpText="Será utilizado como usuario de acceso"
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
                    onChange={(e) => setEstado(e.target.value)}
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
