import React, { useState, useEffect } from 'react';
import { JobFunction, createEmptyJobFunction } from '../../services/functionService';
import GenericModal from '../Common/GenericModal';
import FunctionEditor from './FunctionEditor';

interface FunctionManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (functions: JobFunction[]) => void;
    initialFunctions?: JobFunction[];
    isLoading?: boolean;
}

const FunctionManagerModal: React.FC<FunctionManagerModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialFunctions = [],
    isLoading = false
}) => {
    const [functions, setFunctions] = useState<JobFunction[]>([]);
    const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialFunctions.length > 0) {
            setFunctions(initialFunctions);
            setSelectedFunctionId(initialFunctions[0].id);
        } else {
            setFunctions([]);
            setSelectedFunctionId(null);
        }
    }, [initialFunctions, isOpen]);

    const selectedFunction = functions.find(f => f.id === selectedFunctionId) || null;

    const handleAddFunction = () => {
        const newFunction = createEmptyJobFunction();
        setFunctions([...functions, newFunction]);
        setSelectedFunctionId(newFunction.id);
    };

    const handleRemoveFunction = (functionId: string) => {
        const updated = functions.filter(f => f.id !== functionId);
        setFunctions(updated);
        if (selectedFunctionId === functionId) {
            setSelectedFunctionId(updated[0]?.id || null);
        }
    };

    const handleUpdateFunction = (updatedFunction: JobFunction) => {
        setFunctions(functions.map(f =>
            f.id === updatedFunction.id ? updatedFunction : f
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            onSave(functions);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title="Gestionar Funciones"
            size="xl"
        >
            <div className="flex gap-6 h-[80vh] overflow-hidden">
                {/* Sidebar - Function List */}
                <div className="w-64 border-r border-base-300 overflow-y-auto">
                    <div className="space-y-2 p-4">
                        <button
                            onClick={handleAddFunction}
                            className="btn btn-primary w-full btn-sm"
                            disabled={isSaving || isLoading}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva Función
                        </button>

                        <div className="divider my-2"></div>

                        {functions.length === 0 ? (
                            <div className="text-center py-8 text-base-content/60">
                                <p className="text-sm">No hay funciones</p>
                                <p className="text-xs opacity-70">Crea una nueva función para empezar</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {functions.map((func) => (
                                    <div
                                        key={func.id}
                                        className="flex items-stretch group"
                                    >
                                        <button
                                            onClick={() => setSelectedFunctionId(func.id)}
                                            className={`flex-1 text-left px-3 py-2 rounded text-sm transition ${
                                                selectedFunctionId === func.id
                                                    ? 'bg-primary text-primary-content'
                                                    : 'bg-base-200 hover:bg-base-300'
                                            }`}
                                        >
                                            <div className="font-semibold truncate">
                                                {func.titulo || 'Sin título'}
                                            </div>
                                            <div className="text-xs opacity-70">
                                                {func.capacidades.length} capacidades
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleRemoveFunction(func.id)}
                                            className="px-2 opacity-0 group-hover:opacity-100 transition text-error hover:bg-error/10 rounded"
                                            title="Eliminar función"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Editor */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedFunction ? (
                        <FunctionEditor
                            jobFunction={selectedFunction}
                            onUpdate={handleUpdateFunction}
                            isLoading={isSaving || isLoading}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-base-content/60">
                            <div className="text-center">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-lg font-semibold">Selecciona o crea una función</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 mt-6 pt-4 border-t border-base-300">
                <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onClose}
                    disabled={isSaving || isLoading}
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={isSaving || isLoading || functions.length === 0}
                >
                    {isSaving ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Guardar {functions.length} Función{functions.length !== 1 ? 'es' : ''}
                        </>
                    )}
                </button>
            </div>
        </GenericModal>
    );
};

export default FunctionManagerModal;
