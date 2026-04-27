import React from 'react';
import { Topic, Detail, updateDetailInTopic, addDetailToTopic, removeDetailFromTopic } from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import DetailEditor from './DetailEditor';

interface TopicEditorProps {
    topic: Topic;
    onUpdate: (topic: Topic) => void;
    onDelete: () => void;
    isLast?: boolean;
    onAddNew?: () => void;
}

const TopicEditor: React.FC<TopicEditorProps> = ({
    topic,
    onUpdate,
    onDelete,
    isLast,
    onAddNew
}) => {
    const handleDetailUpdate = (detailId: string, updatedDetail: Detail) => {
        const updatedTopic = updateDetailInTopic(topic, detailId, updatedDetail);
        onUpdate(updatedTopic);
    };

    const handleAddDetail = () => {
        const updatedTopic = addDetailToTopic(topic);
        onUpdate(updatedTopic);
    };

    const handleRemoveDetail = (detailId: string) => {
        const updatedTopic = removeDetailFromTopic(topic, detailId);
        onUpdate(updatedTopic);
    };

    return (
        <div className="bg-base-200 border-2 border-base-300 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <label className="label pb-2">
                        <span className="label-text font-semibold">Tema</span>
                    </label>
                    <InputField
                        label=""
                        value={topic.titulo}
                        onChange={(e) => onUpdate({ ...topic, titulo: e.target.value })}
                        placeholder="Ej. Técnicas de análisis predictivo"
                        required
                    />
                </div>

                <div className="flex gap-2 ml-4">
                    {isLast && onAddNew && (
                        <button
                            type="button"
                            onClick={onAddNew}
                            className="btn btn-sm btn-outline"
                            title="Añadir tema"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Tema
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                        title="Eliminar tema"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Detalles */}
            <div className="bg-base-100 rounded-lg p-4">
                <h6 className="font-semibold text-sm mb-4 text-base-content">Detalles del Tema ({topic.detalles.length})</h6>
                <div className="space-y-3">
                    {topic.detalles.map((detail, index) => (
                        <DetailEditor
                            key={detail.id}
                            detail={detail}
                            onUpdate={(updated) => handleDetailUpdate(detail.id, updated)}
                            onDelete={() => handleRemoveDetail(detail.id)}
                            isLast={index === topic.detalles.length - 1}
                            onAddNew={handleAddDetail}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TopicEditor;
