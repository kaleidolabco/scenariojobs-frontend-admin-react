import React, { useState } from 'react';
import {
    Module,
    Topic,
    FileResource,
    KnowledgeType,
    KnowledgeSource,
    DevelopmentLevel,
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
import OrgChartPersonSelector from '../Competencies/OrgChartPersonSelector';

interface ModuleEditorProps {
    module: Module;
    onUpdate: (module: Module) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

const KNOWLEDGE_TYPE_BADGE: Record<KnowledgeType, string> = {
    ESTANDAR: 'badge-info',
    INTERNO:  'badge-warning',
    CRITICO:  'badge-error',
};

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

                    {/* Module properties — compact 3-column grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                                Tipo
                            </label>
                            <select
                                className="select select-sm select-bordered w-full"
                                value={module.tipoConocimiento}
                                onChange={e => onUpdate({ ...module, tipoConocimiento: e.target.value as KnowledgeType })}
                            >
                                <option value="ESTANDAR">Estándar</option>
                                <option value="INTERNO">Interno</option>
                                <option value="CRITICO">Crítico</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                                Fuente
                            </label>
                            <select
                                className="select select-sm select-bordered w-full"
                                value={module.fuentes[0] || 'INTERNA'}
                                onChange={e => onUpdate({ ...module, fuentes: [e.target.value as KnowledgeSource] })}
                            >
                                <option value="INTERNA">Interna</option>
                                <option value="EXTERNA">Externa</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                                Nivel requerido
                            </label>
                            <select
                                className="select select-sm select-bordered w-full"
                                value={module.nivelDesarrollo.toString()}
                                onChange={e => onUpdate({ ...module, nivelDesarrollo: parseInt(e.target.value) as DevelopmentLevel })}
                            >
                                <option value="0">0 — Desconocimiento</option>
                                <option value="1">1 — Básico</option>
                                <option value="2">2 — Intermedio</option>
                                <option value="3">3 — Avanzado</option>
                            </select>
                        </div>
                    </div>

                    {/* Origen/Referencia condicional según fuente */}
                    {module.fuentes[0] === 'INTERNA' ? (
                        <div>
                            <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                                Empleado responsable
                            </label>
                            <div className="bg-base-200/50 rounded-lg p-2">
                                <OrgChartPersonSelector
                                    selectedPersonIds={module.origenEmpleadoId ? [module.origenEmpleadoId] : []}
                                    onPersonsChange={(ids) => onUpdate({ 
                                        ...module, 
                                        origenEmpleadoId: ids[0] || undefined 
                                    })}
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                                Referencia externa
                            </label>
                            <input
                                type="text"
                                className="input input-sm input-bordered w-full"
                                value={module.origenExternoReferencia || ''}
                                onChange={e => onUpdate({ 
                                    ...module, 
                                    origenExternoReferencia: e.target.value || undefined 
                                })}
                                placeholder="Ej. Instituto XYZ, Proveedor ABC, etc."
                            />
                        </div>
                    )}

                    {/* Knowledge type badge */}
                    <div className="flex items-center gap-1.5">
                        <span className={`badge badge-xs ${KNOWLEDGE_TYPE_BADGE[module.tipoConocimiento]}`} />
                        <span className="text-xs text-base-content/50">
                            {module.tipoConocimiento === 'ESTANDAR' && 'Conocimiento estándar del sector'}
                            {module.tipoConocimiento === 'INTERNO'  && 'Conocimiento específico interno'}
                            {module.tipoConocimiento === 'CRITICO'  && 'Conocimiento crítico para el cargo'}
                        </span>
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
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 3v10M3 8h10" />
                        </svg>
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

export default ModuleEditor;
