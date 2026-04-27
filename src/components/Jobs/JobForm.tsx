import React, { useState, useEffect } from 'react';
import { Job, SeniorityLevel, CompetencyRequirement, convertLegacyFunctionsToHierarchical } from '../../services/jobService';
import { JobFunction } from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import TextAreaField from '../Common/Forms/TextAreaField';
import NumberInputField from '../Common/Forms/NumberInputField';
import FormSection from '../Common/Forms/FormSection';
import JobCompetencySelector from './JobCompetencySelector';
import { FunctionManagerModal } from '../Functions';

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
    const [funciones, setFunciones] = useState<JobFunction[]>([]);
    const [competencias, setCompetencias] = useState<CompetencyRequirement[]>([]);
    const [funcionesModalOpen, setFuncionesModalOpen] = useState(false);

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre);
            setDescripcion(initialData.descripcion);
            setNivelJerarquico(initialData.nivel_jerarquico);
            setBandaSalarialMin(initialData.banda_salarial_min);
            setBandaSalarialMax(initialData.banda_salarial_max);
            
            // Validar y convertir funciones si es necesario
            let processedFunciones: JobFunction[] = [];
            if (Array.isArray(initialData.funciones)) {
                // Verificar si son strings (legacy) o JobFunctions
                if (initialData.funciones.length > 0) {
                    const firstItem = initialData.funciones[0];
                    if (typeof firstItem === 'string') {
                        // Es legacy format (strings), convertir
                        processedFunciones = convertLegacyFunctionsToHierarchical(
                            initialData.funciones as unknown as string[],
                            `Funciones de ${initialData.nombre}`
                        );
                    } else if (firstItem && typeof firstItem === 'object' && 'capacidades' in firstItem) {
                        // Ya es JobFunction format
                        processedFunciones = initialData.funciones as JobFunction[];
                    }
                }
            }
            
            setFunciones(processedFunciones);
            setCompetencias(initialData.competencias_requeridas || []);
        } else {
            setNombre('');
            setDescripcion('');
            setNivelJerarquico('SEMI_SENIOR');
            setBandaSalarialMin(undefined);
            setBandaSalarialMax(undefined);
            setFunciones([]);
            setCompetencias([]);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            nombre,
            descripcion,
            nivel_jerarquico: nivelJerarquico,
            competencias_requeridas: competencias,
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
                description="Configure las funciones jerárquicas del cargo con capacidades, conocimientos, módulos y detalles."
            >
                <div className="space-y-4">
                    <div className="bg-base-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-base-content">Funciones Configuradas</h4>
                            <span className="badge badge-primary">{funciones.length}</span>
                        </div>

                        {funciones.length > 0 ? (
                            <div className="space-y-2">
                                {funciones.map((func, index) => (
                                    <div key={func.id} className="bg-base-100 rounded p-3">
                                        <div className="font-semibold text-sm text-base-content">{index + 1}. {func.titulo}</div>
                                        {func.descripcion && (
                                            <div className="text-xs opacity-70 mt-1">{func.descripcion}</div>
                                        )}
                                        <div className="text-xs opacity-60 mt-2">
                                            {func.capacidades.length} capacidades
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-base-content/60">
                                <svg className="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No hay funciones configuradas</p>
                                <p className="text-xs opacity-70">Haz clic en el botón de abajo para añadir</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setFuncionesModalOpen(true)}
                        className="btn btn-outline w-full"
                        disabled={isLoading}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Gestionar Funciones
                    </button>
                </div>
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

            <FormSection
                title="Competencias Requeridas"
                description="Asigne las competencias y niveles esperados para este cargo."
            >
                <JobCompetencySelector
                    value={competencias}
                    onChange={setCompetencias}
                />
            </FormSection>

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

            {/* Function Manager Modal */}
            <FunctionManagerModal
                isOpen={funcionesModalOpen}
                onClose={() => setFuncionesModalOpen(false)}
                onSave={(updatedFunciones) => {
                    setFunciones(updatedFunciones);
                    setFuncionesModalOpen(false);
                }}
                initialFunctions={funciones}
                isLoading={isLoading}
            />
        </form>
    );
};

export default JobForm;
