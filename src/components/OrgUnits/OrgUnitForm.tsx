import React, { useState, useEffect } from 'react';
import { OrgUnit, OrgUnitType } from '../../services/orgUnitService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import TextAreaField from '../Common/Forms/TextAreaField';
import FormSection from '../Common/Forms/FormSection';

interface OrgUnitFormProps {
    initialData: Partial<OrgUnit> | null;
    parentUnit?: OrgUnit | null;
    isLoading: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const UNIT_TYPES: { value: OrgUnitType; label: string }[] = [
    { value: 'DIVISION', label: 'División' },
    { value: 'AREA', label: 'Área' },
    { value: 'DEPARTAMENTO', label: 'Departamento' },
    { value: 'EQUIPO', label: 'Equipo' },
    { value: 'CELULA', label: 'Célula' },
    { value: 'OTRO', label: 'Otro' },
];

const OrgUnitForm: React.FC<OrgUnitFormProps> = ({ initialData, parentUnit, isLoading, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'DEPARTAMENTO' as OrgUnitType,
        descripcion: '',
        padre_id: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                tipo: initialData.tipo || 'DEPARTAMENTO',
                descripcion: initialData.descripcion || '',
                padre_id: initialData.padre_id || ''
            });
        } else if (parentUnit) {
            setFormData(prev => ({ ...prev, padre_id: parentUnit.id }));
        } else {
            setFormData({
                nombre: '',
                tipo: 'DIVISION',
                descripcion: '',
                padre_id: ''
            });
        }
    }, [initialData, parentUnit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Context Message */}
            {parentUnit && !initialData && (
                <div className="alert alert-info shadow-sm text-sm py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Agregando unidad dentro de: <strong>{parentUnit.nombre}</strong></span>
                </div>
            )}

            <FormSection
                title="Información de la Unidad"
                description="Defina los detalles básicos de la unidad organizacional."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField
                        label="Nombre de la Unidad"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej. Gerencia de TI"
                        required
                        helpText="Nombre oficial de la división, área o departamento"
                    />

                    <SelectField
                        label="Tipo de Unidad"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as OrgUnitType })}
                        options={UNIT_TYPES}
                        helpText="Clasificación jerárquica"
                    />
                </div>

                <div className="mt-4 md:mt-6">
                    <TextAreaField
                        label="Descripción / Responsabilidades"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Describa el propósito y responsabilidades principales de esta unidad..."
                        rows={3}
                        helpText="Breve resumen del alcance de esta unidad"
                    />
                </div>
            </FormSection>

            {/* Acciones (Sticky footer styled like CompetencyForm) */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 md:relative md:border-t-0 md:p-0 md:pt-4">
                <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
                    <button
                        type="button"
                        className="btn btn-ghost hover:bg-base-200 mt-2 md:mt-0 order-2 md:order-1"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary w-full md:w-auto order-1 md:order-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span className="ml-2">Procesando...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{initialData ? 'Guardar Cambios' : 'Crear Unidad'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default OrgUnitForm;
