import React, { useState, useEffect } from 'react';
import {
    JobFunction,
    Capability,
    updateCapabilityInFunction,
    addCapabilityToFunction,
    removeCapabilityFromFunction,
    updateJobFunction,
    isJobFunctionValid,
    calculateFunctionStats
} from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import CapabilityEditor from './CapabilityEditor';

interface FunctionEditorProps {
    jobFunction: JobFunction;
    onUpdate: (jobFunction: JobFunction) => void;
    isLoading?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
}

const FunctionEditor: React.FC<FunctionEditorProps> = ({
    jobFunction,
    onUpdate,
    isLoading = false,
    onSave,
    onCancel
}) => {
    const [localFunction, setLocalFunction] = useState<JobFunction>(jobFunction);
    const [isValid, setIsValid] = useState(false);
    const stats = calculateFunctionStats(localFunction);

    useEffect(() => {
        setLocalFunction(jobFunction);
    }, [jobFunction]);

    useEffect(() => {
        setIsValid(isJobFunctionValid(localFunction));
    }, [localFunction]);

    const handleCapabilityUpdate = (capabilityId: string, updatedCapability: Capability) => {
        const updated = updateCapabilityInFunction(localFunction, capabilityId, updatedCapability);
        setLocalFunction(updated);
        onUpdate(updated);
    };

    const handleAddCapability = () => {
        const updated = addCapabilityToFunction(localFunction);
        setLocalFunction(updated);
        onUpdate(updated);
    };

    const handleRemoveCapability = (capabilityId: string) => {
        const updated = removeCapabilityFromFunction(localFunction, capabilityId);
        setLocalFunction(updated);
        onUpdate(updated);
    };

    const handleFunctionUpdate = (updates: Partial<Omit<JobFunction, 'id'>>) => {
        const updated = updateJobFunction(localFunction, updates);
        setLocalFunction(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-bold text-xl text-base-content mb-4">Función Principal</h3>
                        <InputField
                            label="Título de la Función"
                            value={localFunction.titulo}
                            onChange={(e) => handleFunctionUpdate({ titulo: e.target.value })}
                            placeholder="Ej. Gestión de Proyectos Complejos"
                            required
                        />
                    </div>
                </div>

                <TextAreaField
                    label="Descripción (Opcional)"
                    value={localFunction.descripcion || ''}
                    onChange={(e) => handleFunctionUpdate({ descripcion: e.target.value })}
                    placeholder="Descripción general de esta función y su alcance..."
                    rows={2}
                />

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-4 border-t border-base-300">
                    <div className="bg-base-200 rounded p-2 text-center">
                        <div className="text-2xl font-bold text-primary">{stats.capabilitiesCount}</div>
                        <div className="text-xs text-base-content/60">Capacidades</div>
                    </div>
                    <div className="bg-base-200 rounded p-2 text-center">
                        <div className="text-2xl font-bold text-secondary">{stats.knowledgesCount}</div>
                        <div className="text-xs text-base-content/60">Conocimientos</div>
                    </div>
                    <div className="bg-base-200 rounded p-2 text-center">
                        <div className="text-2xl font-bold text-accent">{stats.modulesCount}</div>
                        <div className="text-xs text-base-content/60">Módulos</div>
                    </div>
                    <div className="bg-base-200 rounded p-2 text-center">
                        <div className="text-2xl font-bold text-info">{stats.topicsCount}</div>
                        <div className="text-xs text-base-content/60">Temas</div>
                    </div>
                    <div className="bg-base-200 rounded p-2 text-center">
                        <div className="text-2xl font-bold text-warning">{stats.detailsCount}</div>
                        <div className="text-xs text-base-content/60">Detalles</div>
                    </div>
                </div>

                {/* Validation Status */}
                {!isValid && (
                    <div className="alert alert-warning">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4v2m0 0v2m0-6v-2" />
                        </svg>
                        <span>Completa todos los campos requeridos en cada nivel jerárquico</span>
                    </div>
                )}
            </div>

            {/* Capacidades */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-base-content">
                        Capacidades a Desarrollar ({localFunction.capacidades.length})
                    </h3>
                </div>

                <div className="space-y-6 bg-base-200 rounded-lg p-4">
                    {localFunction.capacidades.map((capacidad, index) => (
                        <CapabilityEditor
                            key={capacidad.id}
                            capability={capacidad}
                            onUpdate={(updated) => handleCapabilityUpdate(capacidad.id, updated)}
                            onDelete={() => handleRemoveCapability(capacidad.id)}
                            isLast={index === localFunction.capacidades.length - 1}
                            onAddNew={handleAddCapability}
                        />
                    ))}
                </div>

                {/* Add capability button */}
                <button
                    type="button"
                    onClick={handleAddCapability}
                    className="btn btn-primary w-full"
                    disabled={isLoading}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Capacidad
                </button>
            </div>

            {/* Actions */}
            {(onSave || onCancel) && (
                <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 md:relative md:border-t-0 md:p-0 md:pt-4 flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
                    {onCancel && (
                        <button
                            type="button"
                            className="btn btn-ghost hover:bg-base-200 mt-2 md:mt-0 order-2 md:order-1"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                    )}
                    {onSave && (
                        <button
                            type="button"
                            className="btn btn-primary w-full md:w-auto order-1 md:order-2"
                            onClick={onSave}
                            disabled={isLoading || !isValid}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    <span className="ml-2">Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Guardar Función</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FunctionEditor;
