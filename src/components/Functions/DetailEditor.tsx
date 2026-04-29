import React, { useState } from 'react';
import { Detail } from '../../services/functionService';
import TreeNodeRow from './TreeNodeRow';

interface DetailEditorProps {
    detail: Detail;
    onUpdate: (detail: Detail) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

const DetailEditor: React.FC<DetailEditorProps> = ({
    detail,
    onUpdate,
    onDelete,
    defaultOpen = false,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div>
            <TreeNodeRow
                isOpen={isOpen}
                onToggle={() => setIsOpen(v => !v)}
                dotColorClass="bg-base-content/30"
                label={detail.titulo}
                onDelete={onDelete}
            />

            {isOpen && (
                <div className="ml-4 pl-4 border-l border-base-300 py-2 space-y-3">
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Título
                        </label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full"
                            value={detail.titulo}
                            onChange={e => onUpdate({ ...detail, titulo: e.target.value })}
                            placeholder="Ej. Análisis de datos complejos"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Descripción <span className="normal-case">(opcional)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full resize-none"
                            rows={2}
                            value={detail.descripcion || ''}
                            onChange={e => onUpdate({ ...detail, descripcion: e.target.value })}
                            placeholder="Detalles específicos sobre este tema..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailEditor;
