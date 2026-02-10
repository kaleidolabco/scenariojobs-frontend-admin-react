import React, { useState, useEffect } from 'react';
import { Person } from '../../services/personService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import FormSection from '../Common/Forms/FormSection';

interface PersonFormProps {
    initialData?: Person | null;
    isLoading?: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const PersonForm: React.FC<PersonFormProps> = ({ initialData, isLoading = false, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        email_personal: '',
        telefono: '',
        departamento: '',
        fecha_ingreso: '',
        estado: 'ACTIVO'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombres: initialData.nombres,
                apellidos: initialData.apellidos,
                email_personal: initialData.email_personal || '',
                telefono: initialData.telefono || '',
                departamento: initialData.departamento || '',
                fecha_ingreso: initialData.fecha_ingreso || '',
                estado: initialData.estado
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

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

            <FormSection title="Información Laboral">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Departamento / Área"
                        name="departamento"
                        value={formData.departamento}
                        onChange={handleChange}
                        placeholder="Ej. Ventas, Marketing"
                    />
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
            </FormSection>

            <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? <span className="loading loading-spinner"></span> : initialData ? 'Guardar Cambios' : 'Ingresar Persona'}
                </button>
            </div>
        </form>
    );
};

export default PersonForm;
