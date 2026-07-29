import React, { useState } from 'react';
import { Plus } from '../Common/Icon';
import {
    Capability,
    Knowledge,
    updateKnowledgeInCapability,
    addKnowledgeToCapability,
    removeKnowledgeFromCapability,
} from '../../services/functionService';
import TreeNodeRow from './TreeNodeRow';
import KnowledgeEditor from './KnowledgeEditor';

interface CapabilityEditorProps {
    capability: Capability;
    onUpdate: (capability: Capability) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

const CapabilityEditor: React.FC<CapabilityEditorProps> = ({
    capability,
    onUpdate,
    onDelete,
    defaultOpen = false,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleKnowledgeUpdate = (knowledgeId: string, updated: Knowledge) => {
        onUpdate(updateKnowledgeInCapability(capability, knowledgeId, updated));
    };

    const handleAddKnowledge = () => {
        const updated = addKnowledgeToCapability(capability);
        onUpdate(updated);
        if (!isOpen) setIsOpen(true);
    };

    const handleRemoveKnowledge = (knowledgeId: string) => {
        onUpdate(removeKnowledgeFromCapability(capability, knowledgeId));
    };

    return (
        <div>
            <TreeNodeRow
                isOpen={isOpen}
                onToggle={() => setIsOpen(v => !v)}
                dotColorClass="bg-primary"
                label={capability.titulo}
                childCount={capability.conocimientos.length}
                onAdd={handleAddKnowledge}
                addLabel="conocimiento"
                onDelete={onDelete}
            />

            {isOpen && (
                <div className="ml-4 pl-4 border-l border-base-300 py-2 space-y-3">
                    {/* Title */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Título de la capacidad
                        </label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full"
                            value={capability.titulo}
                            onChange={e => onUpdate({ ...capability, titulo: e.target.value })}
                            placeholder="Ej. Análisis de Datos Avanzado"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Descripción <span className="normal-case">(opcional)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full resize-none"
                            rows={2}
                            value={capability.descripcion || ''}
                            onChange={e => onUpdate({ ...capability, descripcion: e.target.value })}
                            placeholder="Breve descripción de esta capacidad..."
                        />
                    </div>

                    {/* Knowledge children */}
                    {capability.conocimientos.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-base-content/40 uppercase tracking-wide mb-1">
                                Conocimientos ({capability.conocimientos.length})
                            </p>
                            {capability.conocimientos.map((conocimiento, i) => (
                                <KnowledgeEditor
                                    key={conocimiento.id}
                                    knowledge={conocimiento}
                                    onUpdate={updated => handleKnowledgeUpdate(conocimiento.id, updated)}
                                    onDelete={() => handleRemoveKnowledge(conocimiento.id)}
                                    defaultOpen={i === capability.conocimientos.length - 1 && !conocimiento.titulo}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddKnowledge}
                        className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content border border-dashed border-base-300 hover:border-base-content/30 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                    >
                        <Plus size={12} />
                        Añadir conocimiento
                    </button>
                </div>
            )}
        </div>
    );
};

export default CapabilityEditor;
