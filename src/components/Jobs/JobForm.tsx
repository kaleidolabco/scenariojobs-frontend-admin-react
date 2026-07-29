import React, { useState, useEffect } from 'react';
import { Job, SeniorityLevel, SalaryPeriod, CompetencyRequirement, convertLegacyFunctionsToHierarchical } from '../../services/jobService';
import { JobFunction } from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import TextAreaField from '../Common/Forms/TextAreaField';
import NumberInputField from '../Common/Forms/NumberInputField';
import FormSection from '../Common/Forms/FormSection';
import JobCompetencySelector from './JobCompetencySelector';
import { FunctionManagerModal } from '../Functions';
import CurrencySelectField from '../Common/Forms/CurrencySelectField';
import Button from '../Common/Button';
import { Check, FileText, Pencil } from '../Common/Icon';

interface JobFormProps {
    initialData?: Job | null;
    isLoading: boolean;
    onSubmit: (data: Omit<Job, 'id'>) => void;
    onCancel: () => void;
    isSimplified?: boolean;
}

const SENIORITY_LEVELS: { value: SeniorityLevel; label: string }[] = [
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'SEMI_SENIOR', label: 'Semi Senior' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'LIDER', label: 'Líder' },
    { value: 'GERENTE', label: 'Gerente' },
    { value: 'DIRECTOR', label: 'Director' }
];

const SALARY_PERIODS: { value: SalaryPeriod; label: string }[] = [
    { value: 'MENSUAL', label: 'Mensual' },
    { value: 'ANUAL', label: 'Anual' },
    { value: 'HORARIO', label: 'Horario' }
];

const JobForm: React.FC<JobFormProps> = ({ initialData, isLoading, onSubmit, onCancel, isSimplified = false }) => {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [nivelJerarquico, setNivelJerarquico] = useState<SeniorityLevel>('SEMI_SENIOR');
    const [bandaSalarialMin, setBandaSalarialMin] = useState<number | undefined>();
    const [bandaSalarialMax, setBandaSalarialMax] = useState<number | undefined>();
    const [moneda, setMoneda] = useState<string>('USD');
    const [periodoSalarial, setPeriodoSalarial] = useState<SalaryPeriod>('MENSUAL');
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
            setMoneda(initialData.moneda || 'USD');
            setPeriodoSalarial(initialData.periodo_salarial || 'MENSUAL');
            
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
            banda_salarial_max: bandaSalarialMax,
            moneda,
            periodo_salarial: periodoSalarial
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

            {!isSimplified && (
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
                                        <div key={func?.id || index} className="bg-base-100 rounded p-3">
                                            <div className="font-semibold text-sm text-base-content">{index + 1}. {func?.titulo || 'Sin título'}</div>
                                            {func?.descripcion && (
                                                <div className="text-xs opacity-70 mt-1">{func.descripcion}</div>
                                            )}
                                            <div className="text-xs opacity-60 mt-2">
                                                {func?.capacidades?.length || 0} capacidades
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-base-content/60">
                                    <FileText size={48} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">No hay funciones configuradas</p>
                                    <p className="text-xs opacity-70">Haz clic en el botón de abajo para añadir</p>
                                </div>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            leftIcon={Pencil}
                            onClick={() => setFuncionesModalOpen(true)}
                            fullWidth
                            disabled={isLoading}
                        >
                            Gestionar Funciones
                        </Button>
                    </div>
                </FormSection>
            )}

            <FormSection
                title="Banda Salarial (Opcional)"
                description="Defina el rango salarial esperado para este cargo."
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                    <CurrencySelectField
                        label="Moneda"
                        value={moneda}
                        onChange={setMoneda}
                        helpText="Tipo de moneda"
                    />
                    
                    <SelectField
                        label="Periodo"
                        value={periodoSalarial}
                        onChange={(e) => setPeriodoSalarial(e.target.value as SalaryPeriod)}
                        options={SALARY_PERIODS}
                        helpText="Frecuencia del salario"
                    />

                    <NumberInputField
                        label="Salario Mínimo"
                        value={bandaSalarialMin || 0}
                        onChange={(value) => setBandaSalarialMin(value || undefined)}
                        min={0}
                        helpText="Valor mínimo"
                    />

                    <NumberInputField
                        label="Salario Máximo"
                        value={bandaSalarialMax || 0}
                        onChange={(value) => setBandaSalarialMax(value || undefined)}
                        min={0}
                        helpText="Valor máximo"
                    />
                </div>
            </FormSection>

            {!isSimplified && (
                <FormSection
                    title="Competencias Requeridas"
                    description="Asigne las competencias y niveles esperados para este cargo."
                >
                    <JobCompetencySelector
                        value={competencias}
                        onChange={setCompetencias}
                    />
                </FormSection>
            )}

            {/* Actions */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 md:relative md:border-t-0 md:p-0 md:pt-4">
                <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="mt-2 md:mt-0 order-2 md:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                        leftIcon={isLoading ? undefined : Check}
                        className="w-full md:w-auto order-1 md:order-2"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Procesando...' : (initialData ? 'Guardar Cambios' : 'Crear Cargo')}
                    </Button>
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
