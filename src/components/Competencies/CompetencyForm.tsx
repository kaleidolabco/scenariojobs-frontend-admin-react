import React, { useEffect, useState } from 'react';
import { Competency, CompetencyLevel } from '../../services/competencyService';
import { Category } from '../../services/categoryService';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import SelectField from '../Common/Forms/SelectField';
import NumberInputField from '../Common/Forms/NumberInputField';
import FormSection from '../Common/Forms/FormSection';
import LevelDefinitionItem from '../Common/Forms/LevelDefinitionItem';

interface CompetencyFormProps {
    initialData?: Competency | null;
    /** Categorías cargadas dinámicamente desde categoryService */
    categories: Category[];
    onSubmit: (data: Omit<Competency, 'id'>) => void;
    onCancel: () => void;
    isLoading: boolean;
}

const CompetencyForm: React.FC<CompetencyFormProps> = ({
    initialData,
    categories,
    onSubmit,
    onCancel,
    isLoading,
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [scale, setScale] = useState(5);
    const [levelDefs, setLevelDefs] = useState<CompetencyLevel[]>([]);
    const [showLevels, setShowLevels] = useState(false);

    // Inicializa el select con la primera categoría disponible cuando no hay initialData
    useEffect(() => {
        if (!initialData && categories.length > 0 && !category) {
            setCategory(categories[0].slug);
        }
    }, [categories, initialData]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.nombre);
            setDescription(initialData.descripcion);
            setCategory(initialData.categoria);
            setScale(initialData.escala);
            if (initialData.definiciones_niveles) {
                setLevelDefs(initialData.definiciones_niveles);
            } else {
                generateLevelDefs(initialData.escala);
            }
        } else {
            setName('');
            setDescription('');
            setCategory(categories[0]?.slug ?? '');
            setScale(5);
            generateLevelDefs(5);
        }
    }, [initialData]);

    const generateLevelDefs = (targetScale: number) => {
        const newDefs: CompetencyLevel[] = [];
        for (let i = 1; i <= targetScale; i++) {
            newDefs.push({ nivel: i, descripcion: '', nombre: `Nivel ${i}` });
        }
        setLevelDefs(newDefs);
    };

    const handleScaleChange = (newScale: number) => {
        setScale(newScale);
        const current = [...levelDefs];
        if (newScale > current.length) {
            for (let i = current.length + 1; i <= newScale; i++) {
                current.push({ nivel: i, descripcion: '', nombre: `Nivel ${i}` });
            }
        } else {
            current.splice(newScale);
        }
        setLevelDefs(current);
    };

    const handleLevelChange = (index: number, field: keyof CompetencyLevel, value: string) => {
        const updated = [...levelDefs];
        updated[index] = { ...updated[index], [field]: value };
        setLevelDefs(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            nombre: name,
            descripcion: description,
            categoria: category,
            escala: scale,
            definiciones_niveles: levelDefs,
        });
    };

    // Construir opciones desde las categorías dinámicas
    const categoryOptions = categories.map((c) => ({
        value: c.slug,
        label: c.nombre,
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Información básica */}
            <FormSection
                title="Información Básica"
                description="Información fundamental para identificar la competencia"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField
                        label="Nombre de la Competencia"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Liderazgo, Python..."
                        required
                        helpText="Ingrese un nombre descriptivo para la competencia"
                    />

                    <SelectField
                        label="Categoría"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        options={
                            categoryOptions.length
                                ? categoryOptions
                                : [{ value: '', label: 'Sin categorías disponibles' }]
                        }
                        helpText="Seleccione el tipo de competencia"
                    />
                </div>

                <div className="mt-4 md:mt-6">
                    <TextAreaField
                        label="Descripción General"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describa brevemente la competencia, su importancia y contexto de aplicación..."
                        rows={3}
                        required
                        helpText="Proporcione una descripción clara de lo que representa esta competencia"
                    />
                </div>
            </FormSection>

            {/* Escala */}
            <FormSection
                title="Configuración de Escala"
                description="Define los niveles de evaluación para esta competencia"
            >
                <div className="space-y-3 md:space-y-4">
                    <div className="space-y-2">
                        <label className="block">
                            <span className="label-text font-medium">Escala de Niveles</span>
                        </label>

                        {/* Mobile */}
                        <div className="md:hidden space-y-3">
                            <div className="flex items-center justify-start gap-2">
                                <span className="text-sm font-medium">Niveles:</span>
                                <NumberInputField
                                    label=""
                                    value={scale}
                                    onChange={handleScaleChange}
                                    min={1}
                                    max={10}
                                    className="w-20 text-center"
                                    helpText=""
                                />
                            </div>
                            <div className="flex flex-wrap gap-1 justify-center">
                                {Array.from({ length: scale }, (_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                                        {i + 1}
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-sm text-base-content/60">(1 - {scale})</p>
                        </div>

                        {/* Desktop */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Niveles:</span>
                                <NumberInputField
                                    label=""
                                    value={scale}
                                    onChange={handleScaleChange}
                                    min={1}
                                    max={10}
                                    className="w-20 text-center input-sm"
                                    helpText=""
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    {Array.from({ length: scale }, (_, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm text-base-content/60">(1 - {scale})</span>
                            </div>
                        </div>

                        <p className="text-xs text-base-content/60 mt-2">
                            Define el número máximo de niveles para esta competencia
                        </p>
                    </div>
                </div>
            </FormSection>

            {/* Definición de niveles */}
            <div className="bg-base-100 rounded-lg border border-base-300 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-base-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-base-content">Definición de Niveles</h3>
                            <p className="text-sm text-base-content/60 mt-1">
                                Especifica los comportamientos y habilidades para cada nivel (Recomendado)
                            </p>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost self-start md:self-auto"
                            onClick={() => setShowLevels(!showLevels)}
                        >
                            {showLevels ? (
                                <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Ocultar
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Mostrar
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {showLevels && (
                    <div className="p-4 md:p-6 space-y-3 md:space-y-4 bg-base-50">
                        {levelDefs.map((level, index) => (
                            <LevelDefinitionItem
                                key={level.nivel}
                                level={level.nivel}
                                name={level.nombre || ''}
                                description={level.descripcion || ''}
                                onNameChange={(value) => handleLevelChange(index, 'nombre', value)}
                                onDescriptionChange={(value) => handleLevelChange(index, 'descripcion', value)}
                            />
                        ))}
                        <div className="md:hidden bg-info/10 border border-info/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-info mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-info">
                                    Desliza horizontalmente para ver más detalles en cada nivel.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 md:relative md:border-t-0 md:p-0 md:pt-4">
                <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
                    <button
                        type="button"
                        className="btn btn-ghost hover:bg-base-200 mt-2 md:mt-0 order-2 md:order-1"
                        onClick={onCancel}
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
                                <span className="loading loading-spinner loading-sm" />
                                <span className="ml-2">Procesando...</span>
                            </>
                        ) : initialData ? (
                            <>
                                <svg className="w-4 h-4 mr-2 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Guardar Cambios
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Crear Competencia
                            </>
                        )}
                    </button>
                </div>
                <div className="md:hidden mt-3 pt-3 border-t border-base-300">
                    <p className="text-xs text-base-content/60">
                        <span className="text-error">*</span> Campos requeridos
                    </p>
                </div>
            </div>
        </form>
    );
};

export default CompetencyForm;