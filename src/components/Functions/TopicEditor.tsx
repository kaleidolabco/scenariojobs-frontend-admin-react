import React, { useState } from 'react';
import {
    Topic,
    Detail,
    FileResource,
    updateDetailInTopic,
    addDetailToTopic,
    removeDetailFromTopic,
    addFileToTopic,
    removeFileFromTopic,
    updateFileInTopic,
} from '../../services/functionService';
import TreeNodeRow from './TreeNodeRow';
import DetailEditor from './DetailEditor';
import FileEditor from './FileEditor';

interface TopicEditorProps {
    topic: Topic;
    onUpdate: (topic: Topic) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

const TopicEditor: React.FC<TopicEditorProps> = ({
    topic,
    onUpdate,
    onDelete,
    defaultOpen = false,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleDetailUpdate = (detailId: string, updated: Detail) => {
        onUpdate(updateDetailInTopic(topic, detailId, updated));
    };

    const handleAddDetail = () => {
        const updated = addDetailToTopic(topic);
        onUpdate(updated);
        if (!isOpen) setIsOpen(true);
    };

    const handleRemoveDetail = (detailId: string) => {
        onUpdate(removeDetailFromTopic(topic, detailId));
    };

    const handleFileUpdate = (fileId: string, updated: FileResource) => {
        onUpdate(updateFileInTopic(topic, fileId, updated));
    };

    const handleAddFile = () => {
        const updated = addFileToTopic(topic);
        onUpdate(updated);
        if (!isOpen) setIsOpen(true);
    };

    const handleRemoveFile = (fileId: string) => {
        onUpdate(removeFileFromTopic(topic, fileId));
    };

    return (
        <div>
            <TreeNodeRow
                isOpen={isOpen}
                onToggle={() => setIsOpen(v => !v)}
                dotColorClass="bg-accent"
                label={topic.titulo}
                childCount={topic.detalles.length}
                onAdd={handleAddDetail}
                addLabel="detalle"
                onDelete={onDelete}
            />

            {isOpen && (
                <div className="ml-4 pl-4 border-l border-base-300 py-2 space-y-3">
                    {/* Title field */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Título del tema
                        </label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full"
                            value={topic.titulo}
                            onChange={e => onUpdate({ ...topic, titulo: e.target.value })}
                            placeholder="Ej. Técnicas de análisis predictivo"
                        />
                    </div>

                    {/* Detail children */}
                    {topic.detalles.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-base-content/40 uppercase tracking-wide mb-1">
                                Detalles ({topic.detalles.length})
                            </p>
                            {topic.detalles.map((detail, i) => (
                                <DetailEditor
                                    key={detail.id}
                                    detail={detail}
                                    onUpdate={updated => handleDetailUpdate(detail.id, updated)}
                                    onDelete={() => handleRemoveDetail(detail.id)}
                                    defaultOpen={i === topic.detalles.length - 1 && !detail.titulo}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddDetail}
                        className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content border border-dashed border-base-300 hover:border-base-content/30 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 3v10M3 8h10" />
                        </svg>
                        Añadir detalle
                    </button>

                    {/* File resources section */}
                    {topic.archivos.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-base-content/40 uppercase tracking-wide mb-1">
                                📎 Archivos ({topic.archivos.length})
                            </p>
                            {topic.archivos.map((archivo, i) => (
                                <FileEditor
                                    key={archivo.id}
                                    file={archivo}
                                    onUpdate={updated => handleFileUpdate(archivo.id, updated)}
                                    onDelete={() => handleRemoveFile(archivo.id)}
                                    defaultOpen={i === topic.archivos.length - 1 && !archivo.nombre}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleAddFile}
                        className="flex items-center gap-1.5 text-xs text-base-content/50 hover:text-base-content border border-dashed border-base-300 hover:border-base-content/30 rounded-lg px-3 py-1.5 w-full justify-center transition-colors"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 3v10M3 8h10" />
                        </svg>
                        Añadir archivo
                    </button>
                </div>
            )}
        </div>
    );
};

export default TopicEditor;
