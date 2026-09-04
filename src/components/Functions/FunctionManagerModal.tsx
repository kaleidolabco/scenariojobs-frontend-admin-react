import React, { useState, useEffect } from 'react';
import { JobFunction, createEmptyJobFunction, validateFunctions } from '../../services/functionService';
import GenericModal from '../Common/GenericModal';
import FunctionEditor from './FunctionEditor';
import { exportFunctionsToExcel, exportFunctionsSummaryToExcel } from '../../utils/excelExportHelper';
import useUIStore from '../../store/uiStore';
import Button from '../Common/Button';
import { Plus, Trash2, Check, FolderOpen, Download } from '../Common/Icon';

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
    const { openAlert } = useUIStore();

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
        const error = validateFunctions(functions);
        if (error) {
            openAlert(error, 'error');
            return;
        }
        setIsSaving(true);
        try {
            onSave(functions);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportDetailed = () => {
        if (functions.length === 0) return;
        exportFunctionsToExcel(functions, `Funciones_Detallado_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportSummary = () => {
        if (functions.length === 0) return;
        exportFunctionsSummaryToExcel(functions, `Funciones_Resumen_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                        <Button
                            variant="primary"
                            fullWidth
                            size="sm"
                            onClick={handleAddFunction}
                            disabled={isSaving || isLoading}
                            leftIcon={Plus}
                        >
                            Nueva Función
                        </Button>

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
                                            <Trash2 size={16} />
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
                                <FolderOpen size={64} className="mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-semibold">Selecciona o crea una función</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse md:flex-row justify-between gap-2 md:gap-3 mt-6 pt-4 border-t border-base-300">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportSummary}
                        disabled={isSaving || isLoading || functions.length === 0}
                        title="Descargar resumen en Excel"
                        leftIcon={Download}
                    >
                        Resumen
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportDetailed}
                        disabled={isSaving || isLoading || functions.length === 0}
                        title="Descargar funciones detalladas en Excel"
                        leftIcon={Download}
                    >
                        Detallado
                    </Button>
                </div>
                <div className="flex gap-2 md:gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving || isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving || isLoading || functions.length === 0}
                        loading={isSaving}
                        leftIcon={isSaving ? undefined : Check}
                    >
                        {isSaving ? 'Guardando...' : `Guardar ${functions.length} Función${functions.length !== 1 ? 'es' : ''}`}
                    </Button>
                </div>
            </div>
        </GenericModal>
    );
};

export default FunctionManagerModal;
