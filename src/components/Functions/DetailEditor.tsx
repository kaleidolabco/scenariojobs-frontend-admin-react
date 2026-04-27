import React, { useState } from 'react';
import { Detail, updateDetailInTopic, addDetailToTopic, removeDetailFromTopic, Topic } from '../../services/functionService';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';

interface DetailEditorProps {
    detail: Detail;
    onUpdate: (detail: Detail) => void;
    onDelete: () => void;
    isLast?: boolean;
    onAddNew?: () => void;
}

const DetailEditor: React.FC<DetailEditorProps> = ({
    detail,
    onUpdate,
    onDelete,
    isLast,
    onAddNew
}) => {
    return (
        <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-sm text-base-content">Detalle</h5>
                <div className="flex gap-2">
                    {isLast && onAddNew && (
                        <button
                            type="button"
                            onClick={onAddNew}
                            className="btn btn-xs btn-ghost"
                            title="Añadir detalle"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                        title="Eliminar detalle"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <InputField
                label="Título del Detalle"
                value={detail.titulo}
                onChange={(e) => onUpdate({ ...detail, titulo: e.target.value })}
                placeholder="Ej. Análisis de datos complejos"
                required
            />

            <TextAreaField
                label="Descripción (Opcional)"
                value={detail.descripcion || ''}
                onChange={(e) => onUpdate({ ...detail, descripcion: e.target.value })}
                placeholder="Detalles específicos sobre este tema..."
                rows={2}
            />
        </div>
    );
};

export default DetailEditor;
