import React from 'react';
import {
    Capability,
    Knowledge,
    updateKnowledgeInCapability,
    addKnowledgeToCapability,
    removeKnowledgeFromCapability
} from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import KnowledgeEditor from './KnowledgeEditor';

interface CapabilityEditorProps {
    capability: Capability;
    onUpdate: (capability: Capability) => void;
    onDelete: () => void;
    isLast?: boolean;
    onAddNew?: () => void;
}

const CapabilityEditor: React.FC<CapabilityEditorProps> = ({
    capability,
    onUpdate,
    onDelete,
    isLast,
    onAddNew
}) => {
    const handleKnowledgeUpdate = (knowledgeId: string, updatedKnowledge: Knowledge) => {
        const updatedCapability = updateKnowledgeInCapability(capability, knowledgeId, updatedKnowledge);
        onUpdate(updatedCapability);
    };

    const handleAddKnowledge = () => {
        const updatedCapability = addKnowledgeToCapability(capability);
        onUpdate(updatedCapability);
    };

    const handleRemoveKnowledge = (knowledgeId: string) => {
        const updatedCapability = removeKnowledgeFromCapability(capability, knowledgeId);
        onUpdate(updatedCapability);
    };

    return (
        <div className="border-l-4 border-l-primary pl-6 py-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                    <label className="label pb-0">
                        <span className="label-text font-semibold text-primary">Capacidad a Desarrollar</span>
                    </label>
                    <InputField
                        label=""
                        value={capability.titulo}
                        onChange={(e) => onUpdate({ ...capability, titulo: e.target.value })}
                        placeholder="Ej. Análisis de Datos Avanzado"
                        required
                    />
                </div>

                <div className="flex gap-2 ml-4">
                    {isLast && onAddNew && (
                        <button
                            type="button"
                            onClick={onAddNew}
                            className="btn btn-sm btn-primary"
                            title="Añadir capacidad"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Capacidad
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                        title="Eliminar capacidad"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Description */}
            <div>
                <TextAreaField
                    label="Descripción (Opcional)"
                    value={capability.descripcion || ''}
                    onChange={(e) => onUpdate({ ...capability, descripcion: e.target.value })}
                    placeholder="Breve descripción de esta capacidad..."
                    rows={2}
                />
            </div>

            {/* Conocimientos */}
            <div className="space-y-4 bg-base-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base-content">
                        Conocimientos ({capability.conocimientos.length})
                    </h4>
                </div>
                <div className="space-y-4">
                    {capability.conocimientos.map((conocimiento, index) => (
                        <KnowledgeEditor
                            key={conocimiento.id}
                            knowledge={conocimiento}
                            onUpdate={(updated) => handleKnowledgeUpdate(conocimiento.id, updated)}
                            onDelete={() => handleRemoveKnowledge(conocimiento.id)}
                            isLast={index === capability.conocimientos.length - 1}
                            onAddNew={handleAddKnowledge}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CapabilityEditor;
