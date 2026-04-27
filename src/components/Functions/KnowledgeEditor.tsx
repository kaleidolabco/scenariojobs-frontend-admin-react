import React from 'react';
import {
    Knowledge,
    Module,
    updateModuleInKnowledge,
    addModuleToKnowledge,
    removeModuleFromKnowledge
} from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import ModuleEditor from './ModuleEditor';

interface KnowledgeEditorProps {
    knowledge: Knowledge;
    onUpdate: (knowledge: Knowledge) => void;
    onDelete: () => void;
    isLast?: boolean;
    onAddNew?: () => void;
}

const KnowledgeEditor: React.FC<KnowledgeEditorProps> = ({
    knowledge,
    onUpdate,
    onDelete,
    isLast,
    onAddNew
}) => {
    const handleModuleUpdate = (moduleId: string, updatedModule: Module) => {
        const updatedKnowledge = updateModuleInKnowledge(knowledge, moduleId, updatedModule);
        onUpdate(updatedKnowledge);
    };

    const handleAddModule = () => {
        const updatedKnowledge = addModuleToKnowledge(knowledge);
        onUpdate(updatedKnowledge);
    };

    const handleRemoveModule = (moduleId: string) => {
        const updatedKnowledge = removeModuleFromKnowledge(knowledge, moduleId);
        onUpdate(updatedKnowledge);
    };

    return (
        <div className="border-l-4 border-l-secondary pl-6 py-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <label className="label pb-2">
                        <span className="label-text font-semibold text-secondary">Conocimiento</span>
                    </label>
                    <InputField
                        label=""
                        value={knowledge.titulo}
                        onChange={(e) => onUpdate({ ...knowledge, titulo: e.target.value })}
                        placeholder="Ej. Análisis Estadístico"
                        required
                    />
                </div>

                <div className="flex gap-2 ml-4">
                    {isLast && onAddNew && (
                        <button
                            type="button"
                            onClick={onAddNew}
                            className="btn btn-sm btn-secondary"
                            title="Añadir conocimiento"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Conocimiento
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                        title="Eliminar conocimiento"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Módulos */}
            <div className="space-y-4 bg-base-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-sm text-base-content">
                        Módulos ({knowledge.modulos.length})
                    </h5>
                </div>
                <div className="space-y-5">
                    {knowledge.modulos.map((modulo, index) => (
                        <ModuleEditor
                            key={modulo.id}
                            module={modulo}
                            onUpdate={(updated) => handleModuleUpdate(modulo.id, updated)}
                            onDelete={() => handleRemoveModule(modulo.id)}
                            isLast={index === knowledge.modulos.length - 1}
                            onAddNew={handleAddModule}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeEditor;
