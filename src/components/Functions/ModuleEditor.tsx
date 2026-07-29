import React, { useState } from 'react';
import { Plus } from '../Common/Icon';
import {
    Module,
    Topic,
    FileResource,
    updateTopicInModule,
    addTopicToModule,
    removeTopicFromModule,
    addFileToModule,
    removeFileFromModule,
    updateFileInModule,
} from '../../services/functionService';
import TreeNodeRow from './TreeNodeRow';
import TopicEditor from './TopicEditor';
import FileEditor from './FileEditor';

interface ModuleEditorProps {
    module: Module;
    onUpdate: (module: Module) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

/* const KNOWLEDGE_TYPE_LABEL: Record<KnowledgeType, string> = {
    ESTANDAR: 'Estándar',
    INTERNO:  'Interno',
    CRITICO:  'Crítico',
}; */

const ModuleEditor: React.FC<ModuleEditorProps> = ({
    module,
    onUpdate,
    onDelete,
    defaultOpen = false,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleTopicUpdate = (topicId: string, updated: Topic) => {
        onUpdate(updateTopicInModule(module, topicId, updated));
    };

    const handleAddTopic = () => {
        const updated = addTopicToModule(module);
        onUpdate(updated);
        if (!isOpen) setIsOpen(true);
    };

    const handleRemoveTopic = (topicId: string) => {
        onUpdate(removeTopicFromModule(module, topicId));
    };

    const handleFileUpdate = (fileId: string, updated: FileResource) => {
        onUpdate(updateFileInModule(module, fileId, updated));
    };

    const handleAddFile = () => {
        const updated = addFileToModule(module);
        onUpdate(updated);
        if (!isOpen) setIsOpen(true);
    };

    const handleRemoveFile = (fileId: string) => {
        onUpdate(removeFileFromModule(module, fileId));
    };

    return (
        <div>
            <TreeNodeRow
                isOpen={isOpen}
                onToggle={() => setIsOpen(v => !v)}
                dotColorClass="bg-warning"
                label={module.titulo}
                childCount={module.temas.length}
                onAdd={handleAddTopic}
                addLabel="tema"
                onDelete={onDelete}
            />

            {isOpen && (
                <div className="ml-4 pl-4 border-l border-base-300 py-2 space-y-3">
                    {/* Title */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Título del módulo
                        </label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full"
                            value={module.titulo}
                            onChange={e => onUpdate({ ...module, titulo: e.target.value })}
                            placeholder="Ej. Programación en Python"
                        />
                    </div>

                    {/* Topic children */}
                    {module.temas.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-base-content/40 uppercase tracking-wide mb-1">
                                Temas ({module.temas.length})
                            </p>
                            {module.temas.map((tema, i) => (
                                <TopicEditor
                                    key={tema.id}
                                    topic={tema}
                                    onUpdate={updated => handleTopicUpdate(tema.id, updated)}
                                    onDelete={() => handleRemoveTopic(tema.id)}
                                    defaultOpen={i === module.temas.length - 1 && !tema.titulo}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddTopic}
                        className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content border border-dashed border-base-300 hover:border-base-content/30 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                    >
                        <Plus size={12} />
                        Añadir tema
                    </button>

                    {/* File resources section */}
                    {module.archivos.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-base-300">
                            <p className="text-xs text-base-content/40 uppercase tracking-wide mb-2">
                                📎 Archivos ({module.archivos.length})
                            </p>
                            {module.archivos.map((archivo) => (
                                <FileEditor
                                    key={archivo.id}
                                    file={archivo}
                                    onUpdate={updated => handleFileUpdate(archivo.id, updated)}
                                    onDelete={() => handleRemoveFile(archivo.id)}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddFile}
                        className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content border border-dashed border-base-300 hover:border-base-content/30 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                    >
                        <Plus size={12} />
                        Añadir archivo
                    </button>
                </div>
            )}
        </div>
    );
};

export default ModuleEditor;
