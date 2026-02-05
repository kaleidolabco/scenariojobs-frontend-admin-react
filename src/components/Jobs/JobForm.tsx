import React, { useState, useEffect } from 'react';
import { Job, SeniorityLevel } from '../../services/jobService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import TextAreaField from '../Common/Forms/TextAreaField';
import NumberInputField from '../Common/Forms/NumberInputField';
import FormSection from '../Common/Forms/FormSection';

interface JobFormProps {
    initialData?: Job | null;
    isLoading: boolean;
    onSubmit: (data: Omit<Job, 'id'>) => void;
    onCancel: () => void;
}

const SENIORITY_LEVELS: { value: SeniorityLevel; label: string }[] = [
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'SEMI_SENIOR', label: 'Semi Senior' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'LIDER', label: 'Líder' },
    { value: 'GERENTE', label: 'Gerente' },
    { value: 'DIRECTOR', label: 'Director' }
];

const JobForm: React.FC<JobFormProps> = ({ initialData, isLoading, onSubmit, onCancel }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [nivelJerarquico, setNivelJerarquico] = useState<SeniorityLevel>('SEMI_SENIOR');
    const [bandaSalarialMin, setBandaSalarialMin] = useState<number | undefined>();
    const [bandaSalarialMax, setBandaSalarialMax] = useState<number | undefined>();
    const [funcionesText, setFuncionesText] = useState('');

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre);
            setDescripcion(initialData.descripcion);
            setNivelJerarquico(initialData.nivel_jerarquico);
            setBandaSalarialMin(initialData.banda_salarial_min);
            setBandaSalarialMax(initialData.banda_salarial_max);
            setFuncionesText(initialData.funciones.join('\n'));
        } else {
            setNombre('');
            setDescripcion('');
            setNivelJerarquico('SEMI_SENIOR');
            setBandaSalarialMin(undefined);
            setBandaSalarialMax(undefined);
            setFuncionesText('');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const funciones = funcionesText
            .split('\n')
            .map(f => f.trim())
            .filter(f => f.length > 0);

        onSubmit({
            nombre,
            descripcion,
            nivel_jerarquico: nivelJerarquico,
            competencias_requeridas: initialData?.competencias_requeridas || [],
            funciones,
            banda_salarial_min: bandaSalarialMin,
            banda_salarial_max: bandaSalarialMax
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <FormSection
                title="Información Básica"
                description="Defina los datos fundamentales del cargo o perfil funcional."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField
                        label="Nombre del Cargo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Desarrollador Full Stack Senior"
                        required
                        helpText="Nombre oficial del cargo o perfil"
                    />

                    <SelectField
                        label="Nivel Jerárquico"
                        value={nivelJerarquico}
                        onChange={(e) => setNivelJerarquico(e.target.value as SeniorityLevel)}
                        options={SENIORITY_LEVELS}
                        helpText="Clasificación de seniority"
                    />
                </div>

                <div className="mt-4 md:mt-6">
                    <TextAreaField
                        label="Descripción del Cargo"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Describa el propósito y alcance del cargo..."
                        rows={3}
                        required
                        helpText="Resumen de las responsabilidades principales"
                    />
                </div>
            </FormSection>

            <FormSection
                title="Funciones y Responsabilidades"
                description="Detalle las funciones específicas del cargo (una por línea)."
            >
                <TextAreaField
                    label="Funciones"
                    value={funcionesText}
                    onChange={(e) => setFuncionesText(e.target.value)}
                    placeholder="Diseñar y desarrollar aplicaciones web&#10;Mentoría a desarrolladores junior&#10;Participar en revisiones de código"
                    rows={5}
                    helpText="Ingrese cada función en una línea separada"
                />
            </FormSection>

            <FormSection
                title="Banda Salarial (Opcional)"
                description="Defina el rango salarial esperado para este cargo."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <NumberInputField
                        label="Salario Mínimo"
                        value={bandaSalarialMin || 0}
                        onChange={(value) => setBandaSalarialMin(value || undefined)}
                        min={0}
                        helpText="Valor mínimo de la banda salarial"
                    />

                    <NumberInputField
                        label="Salario Máximo"
                        value={bandaSalarialMax || 0}
                        onChange={(value) => setBandaSalarialMax(value || undefined)}
                        min={0}
                        helpText="Valor máximo de la banda salarial"
                    />
                </div>
            </FormSection>

            {/* Note about competencies */}
            <div className="alert alert-info text-sm py-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>La asignación de competencias requeridas se habilitará en una versión futura.</span>
            </div>

            {/* Actions */}
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
                                <span>{initialData ? 'Guardar Cambios' : 'Crear Cargo'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default JobForm;
