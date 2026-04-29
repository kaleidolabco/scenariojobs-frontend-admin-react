import React, { useState } from 'react';
import {
    Knowledge,
    Module,
    updateModuleInKnowledge,
    addModuleToKnowledge,
    removeModuleFromKnowledge,
} from '../../services/functionService';
import TreeNodeRow from './TreeNodeRow';
import ModuleEditor from './ModuleEditor';

interface KnowledgeEditorProps {
    knowledge: Knowledge;
    onUpdate: (knowledge: Knowledge) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

const KnowledgeEditor: React.FC<KnowledgeEditorProps> = ({
    knowledge,
    onUpdate,
    onDelete,
    defaultOpen = false,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleModuleUpdate = (moduleId: string, updated: Module) => {
        onUpdate(updateModuleInKnowledge(knowledge, moduleId, updated));
    };

    const handleAddModule = () => {
        const updated = addModuleToKnowledge(knowledge);
        onUpdate(updated);
        if (!isOpen) setIsOpen(true);
    };

    const handleRemoveModule = (moduleId: string) => {
        onUpdate(removeModuleFromKnowledge(knowledge, moduleId));
    };

    return (
        <div>
            <TreeNodeRow
                isOpen={isOpen}
                onToggle={() => setIsOpen(v => !v)}
                dotColorClass="bg-secondary"
                label={knowledge.titulo}
                childCount={knowledge.modulos.length}
                onAdd={handleAddModule}
                addLabel="módulo"
                onDelete={onDelete}
            />

            {isOpen && (
                <div className="ml-4 pl-4 border-l border-base-300 py-2 space-y-3">
                    {/* Title */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Título del conocimiento
                        </label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full"
                            value={knowledge.titulo}
                            onChange={e => onUpdate({ ...knowledge, titulo: e.target.value })}
                            placeholder="Ej. Análisis Estadístico"
                        />
                    </div>

                    {/* Module children */}
                    {knowledge.modulos.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-base-content/40 uppercase tracking-wide mb-1">
                                Módulos ({knowledge.modulos.length})
                            </p>
                            {knowledge.modulos.map((modulo, i) => (
                                <ModuleEditor
                                    key={modulo.id}
                                    module={modulo}
                                    onUpdate={updated => handleModuleUpdate(modulo.id, updated)}
                                    onDelete={() => handleRemoveModule(modulo.id)}
                                    defaultOpen={i === knowledge.modulos.length - 1 && !modulo.titulo}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddModule}
                        className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content border border-dashed border-base-300 hover:border-base-content/30 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 3v10M3 8h10" />
                        </svg>
                        Añadir módulo
                    </button>
                </div>
            )}
        </div>
    );
};

export default KnowledgeEditor;
