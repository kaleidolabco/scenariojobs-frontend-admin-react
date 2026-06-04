import React, { useState, useEffect } from 'react';
import {
    JobFunction,
    Capability,
    updateCapabilityInFunction,
    addCapabilityToFunction,
    removeCapabilityFromFunction,
    updateJobFunction,
    validateFunctions,
    calculateFunctionStats,
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
    onCancel,
}) => {
    const [localFunction, setLocalFunction] = useState<JobFunction>(jobFunction);
    const [isValid, setIsValid] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const stats = calculateFunctionStats(localFunction);

    useEffect(() => { setLocalFunction(jobFunction); }, [jobFunction]);
    useEffect(() => {
        const error = validateFunctions([localFunction]);
        setIsValid(error === null);
        setValidationError(error);
    }, [localFunction]);

    const update = (fn: JobFunction) => { setLocalFunction(fn); onUpdate(fn); };

    const handleCapabilityUpdate = (capabilityId: string, updated: Capability) => {
        update(updateCapabilityInFunction(localFunction, capabilityId, updated));
    };

    const handleAddCapability = () => {
        update(addCapabilityToFunction(localFunction));
    };

    const handleRemoveCapability = (capabilityId: string) => {
        update(removeCapabilityFromFunction(localFunction, capabilityId));
    };

    const handleFunctionUpdate = (updates: Partial<Omit<JobFunction, 'id'>>) => {
        update(updateJobFunction(localFunction, updates));
    };

    return (
        <div className="space-y-5">
            {/* Function header */}
            <div className="space-y-3">
                <InputField
                    label="Título de la Función"
                    value={localFunction.titulo}
                    onChange={e => handleFunctionUpdate({ titulo: e.target.value })}
                    placeholder="Ej. Gestión de Proyectos Complejos"
                    required
                />
                <TextAreaField
                    label="Descripción (Opcional)"
                    value={localFunction.descripcion || ''}
                    onChange={e => handleFunctionUpdate({ descripcion: e.target.value })}
                    placeholder="Descripción general de esta función y su alcance..."
                    rows={2}
                />
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-1.5">
                {[
                    { label: 'capacidades',  value: stats.capabilitiesCount, color: 'bg-primary/10 text-primary' },
                    { label: 'conocimientos', value: stats.knowledgesCount,   color: 'bg-secondary/10 text-secondary' },
                    { label: 'módulos',       value: stats.modulesCount,      color: 'bg-warning/10 text-warning' },
                    { label: 'temas',         value: stats.topicsCount,       color: 'bg-accent/10 text-accent' },
                    { label: 'detalles',      value: stats.detailsCount,      color: 'bg-base-content/10 text-base-content/60' },
                ].map(({ label, value, color }) => (
                    <span key={label} className={`text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>
                        {value} {label}
                    </span>
                ))}
            </div>

            {/* Validation alert */}
            {!isValid && validationError && (
                <div className="alert alert-warning py-2 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span>{validationError}</span>
                </div>
            )}

            <h1 className="text-lg font-bold text-base-content">
                Mapa de conocimiento
            </h1>

            {/* Capability tree */}
            <div className="border border-base-300 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-base-200/50 border-b border-base-300">
                    <span className="text-sm font-semibold text-base-content">
                        Capacidades a Desarrollar
                    </span>
                    <button
                        type="button"
                        onClick={handleAddCapability}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-focus transition-colors"
                        disabled={isLoading}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 3v10M3 8h10" />
                        </svg>
                        Nueva capacidad
                    </button>
                </div>

                <div className="p-2">
                    {localFunction.capacidades.length === 0 ? (
                        <div className="text-center py-10 text-base-content/40">
                            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium">Sin capacidades aún</p>
                            <button
                                type="button"
                                onClick={handleAddCapability}
                                className="btn btn-sm btn-primary mt-3"
                                disabled={isLoading}
                            >
                                Añadir primera capacidad
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {localFunction.capacidades.map((cap, i) => (
                                <CapabilityEditor
                                    key={cap.id}
                                    capability={cap}
                                    onUpdate={updated => handleCapabilityUpdate(cap.id, updated)}
                                    onDelete={() => handleRemoveCapability(cap.id)}
                                    defaultOpen={i === 0 && localFunction.capacidades.length === 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Optional inline save/cancel actions */}
            {(onSave || onCancel) && (
                <div className="flex justify-end gap-2 pt-2">
                    {onCancel && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={isLoading}>
                            Cancelar
                        </button>
                    )}
                    {onSave && (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={onSave}
                            disabled={isLoading || !isValid}
                        >
                            {isLoading ? (
                                <><span className="loading loading-spinner loading-xs" /> Guardando...</>
                            ) : (
                                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg> Guardar función</>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FunctionEditor;
