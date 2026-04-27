import React from 'react';
import {
    Module,
    Topic,
    KnowledgeType,
    KnowledgeSource,
    DevelopmentLevel,
    updateTopicInModule,
    addTopicToModule,
    removeTopicFromModule
} from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import TopicEditor from './TopicEditor';

interface ModuleEditorProps {
    module: Module;
    onUpdate: (module: Module) => void;
    onDelete: () => void;
    isLast?: boolean;
    onAddNew?: () => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({
    module,
    onUpdate,
    onDelete,
    isLast,
    onAddNew
}) => {
    const handleTopicUpdate = (topicId: string, updatedTopic: Topic) => {
        const updatedModule = updateTopicInModule(module, topicId, updatedTopic);
        onUpdate(updatedModule);
    };

    const handleAddTopic = () => {
        const updatedModule = addTopicToModule(module);
        onUpdate(updatedModule);
    };

    const handleRemoveTopic = (topicId: string) => {
        const updatedModule = removeTopicFromModule(module, topicId);
        onUpdate(updatedModule);
    };

    const knowledgeTypeOptions = [
        { label: 'Estándar', value: 'ESTANDAR' },
        { label: 'Interno', value: 'INTERNO' },
        { label: 'Crítico', value: 'CRITICO' }
    ];

    const sourceOptions = [
        { label: 'Interna', value: 'INTERNA' },
        { label: 'Externa', value: 'EXTERNA' }
    ];

    const developmentLevelOptions = [
        { label: 'Nivel 0 - Desconocimiento', value: '0' },
        { label: 'Nivel 1 - Básico', value: '1' },
        { label: 'Nivel 2 - Intermedio', value: '2' },
        { label: 'Nivel 3 - Avanzado', value: '3' }
    ];

    return (
        <div className="bg-base-300 border-2 border-base-content/10 rounded-lg p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-base-content">Módulo</h4>
                <div className="flex gap-2">
                    {isLast && onAddNew && (
                        <button
                            type="button"
                            onClick={onAddNew}
                            className="btn btn-sm btn-primary"
                            title="Añadir módulo"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Módulo
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                        title="Eliminar módulo"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="bg-base-100 rounded-lg p-4">
                <InputField
                    label="Título del Módulo"
                    value={module.titulo}
                    onChange={(e) => onUpdate({ ...module, titulo: e.target.value })}
                    placeholder="Ej. Programación en Python"
                    required
                />
            </div>

            {/* Module Properties */}
            <div className="bg-base-100 rounded-lg p-4 space-y-4">
                <h5 className="font-semibold text-sm text-base-content mb-4">Propiedades del Módulo</h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField
                        label="Tipo de Conocimiento"
                        value={module.tipoConocimiento}
                        onChange={(e) => onUpdate({ ...module, tipoConocimiento: e.target.value as KnowledgeType })}
                        options={knowledgeTypeOptions}
                        helpText="Clasificación del conocimiento"
                    />

                    <SelectField
                        label="Fuentes"
                        value={module.fuentes[0] || 'INTERNA'}
                        onChange={(e) => onUpdate({ ...module, fuentes: [e.target.value as KnowledgeSource] })}
                        options={sourceOptions}
                        helpText="Origen del conocimiento"
                    />

                    <SelectField
                        label="Nivel de Desarrollo Requerido"
                        value={module.nivelDesarrollo.toString()}
                        onChange={(e) => onUpdate({ ...module, nivelDesarrollo: parseInt(e.target.value) as DevelopmentLevel })}
                        options={developmentLevelOptions}
                        helpText="Para el cargo"
                    />
                </div>

                {/* Color indicators for knowledge type */}
                <div className="pt-2 border-t border-base-300">
                    <div className="flex items-center gap-2 text-xs opacity-70">
                        <div className={`w-3 h-3 rounded ${
                            module.tipoConocimiento === 'ESTANDAR' ? 'bg-info' :
                            module.tipoConocimiento === 'INTERNO' ? 'bg-warning' :
                            'bg-error'
                        }`}></div>
                        <span>
                            {module.tipoConocimiento === 'ESTANDAR' ? 'Conocimiento estándar del sector' :
                             module.tipoConocimiento === 'INTERNO' ? 'Conocimiento específico interno' :
                             'Conocimiento crítico para el cargo'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Temas */}
            <div className="bg-base-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-sm text-base-content">Temas ({module.temas.length})</h5>
                </div>
                <div className="space-y-4">
                    {module.temas.map((tema, index) => (
                        <TopicEditor
                            key={tema.id}
                            topic={tema}
                            onUpdate={(updated) => handleTopicUpdate(tema.id, updated)}
                            onDelete={() => handleRemoveTopic(tema.id)}
                            isLast={index === module.temas.length - 1}
                            onAddNew={handleAddTopic}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModuleEditor;
