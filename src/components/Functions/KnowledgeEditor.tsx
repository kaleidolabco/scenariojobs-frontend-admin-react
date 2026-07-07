import React, { useState } from 'react';
import {
    Knowledge,
    Module,
    KnowledgeType,
    KnowledgeSource,
    DevelopmentLevel,
    updateModuleInKnowledge,
    addModuleToKnowledge,
    removeModuleFromKnowledge,
} from '../../services/functionService';
import TreeNodeRow from './TreeNodeRow';
import ModuleEditor from './ModuleEditor';
import OrgChartPersonSelector from '../Competencies/OrgChartPersonSelector';

interface KnowledgeEditorProps {
    knowledge: Knowledge;
    onUpdate: (knowledge: Knowledge) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

const KNOWLEDGE_TYPE_BADGE: Record<KnowledgeType, string> = {
    ESTANDAR: 'badge-info',
    INTERNO:  'badge-warning',
    CRITICO:  'badge-error',
};

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

                    {/* Knowledge properties — compact 3-column grid */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                                Tipo
                            </label>
                            <select
                                className="select select-sm select-bordered w-full"
                                value={knowledge.tipoConocimiento}
                                onChange={e => onUpdate({ ...knowledge, tipoConocimiento: e.target.value as KnowledgeType })}
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
                                value={knowledge.fuentes[0] || 'INTERNA'}
                                onChange={e => onUpdate({ ...knowledge, fuentes: [e.target.value as KnowledgeSource] })}
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
                                value={knowledge.nivelDesarrollo.toString()}
                                onChange={e => onUpdate({ ...knowledge, nivelDesarrollo: parseInt(e.target.value) as DevelopmentLevel })}
                            >
                                <option value="0">0 — Desconocimiento</option>
                                <option value="1">1 — Básico</option>
                                <option value="2">2 — Intermedio</option>
                                <option value="3">3 — Avanzado</option>
                            </select>
                        </div>
                    </div>

                    {/* Origen/Referencia condicional según fuente */}
                    {knowledge.fuentes[0] === 'INTERNA' ? (
                        <div>
                            <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                                Cargos portadores del conocimiento
                            </label>
                            <div className="bg-base-200/50 rounded-lg p-2">
                                <OrgChartPersonSelector
                                    selectedPersonIds={knowledge.origenEmpleadoId ? [knowledge.origenEmpleadoId] : []}
                                    onPersonsChange={(ids) => onUpdate({ 
                                        ...knowledge, 
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
                                value={knowledge.origenExternoReferencia || ''}
                                onChange={e => onUpdate({ 
                                    ...knowledge, 
                                    origenExternoReferencia: e.target.value || undefined 
                                })}
                                placeholder="Ej. Instituto XYZ, Proveedor ABC, etc."
                            />
                        </div>
                    )}

                    {/* Knowledge type badge */}
                    <div className="flex items-center gap-1.5 pb-2 border-b border-base-200">
                        <span className={`badge badge-xs ${KNOWLEDGE_TYPE_BADGE[knowledge.tipoConocimiento]}`} />
                        <span className="text-xs text-base-content/50">
                            {knowledge.tipoConocimiento === 'ESTANDAR' && 'Conocimiento estándar del sector'}
                            {knowledge.tipoConocimiento === 'INTERNO'  && 'Conocimiento específico interno'}
                            {knowledge.tipoConocimiento === 'CRITICO'  && 'Conocimiento crítico para el cargo'}
                        </span>
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
