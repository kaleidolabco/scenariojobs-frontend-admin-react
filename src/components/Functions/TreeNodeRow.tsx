import React from 'react';
import { ChevronDown, Plus, Trash2 } from '../Common/Icon';

interface TreeNodeRowProps {
    isOpen: boolean;
    onToggle: () => void;
    dotColorClass: string;
    label: string;
    childCount?: number;
    onAdd?: () => void;
    addLabel?: string;
    onDelete: () => void;
    disabled?: boolean;
}

const TreeNodeRow: React.FC<TreeNodeRowProps> = ({
    isOpen,
    onToggle,
    dotColorClass,
    label,
    childCount,
    onAdd,
    addLabel,
    onDelete,
    disabled = false,
}) => {
    return (
        <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer select-none group transition-colors ${
                isOpen ? 'bg-base-200' : 'hover:bg-base-200/60'
            }`}
            onClick={onToggle}
        >
            <ChevronDown size={14} className={`flex-shrink-0 text-base-content/30 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} />

            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColorClass}`} />

            <span className={`flex-1 text-sm font-medium truncate ${
                label ? 'text-base-content' : 'text-base-content/40 italic font-normal'
            }`}>
                {label || 'Sin título...'}
            </span>

            {childCount !== undefined && !isOpen && (
                <span className="text-xs text-base-content/40 bg-base-200 rounded-full px-1.5 py-0.5 leading-none">
                    {childCount}
                </span>
            )}

            <div
                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
            >
                {onAdd && (
                    <button
                        type="button"
                        onClick={onAdd}
                        className="flex items-center gap-1 px-1.5 py-1 text-xs text-base-content/60 hover:text-base-content hover:bg-base-300 rounded transition-colors"
                        title={addLabel}
                        disabled={disabled}
                    >
                        <Plus size={12} />
                        <span className="hidden sm:inline">{addLabel}</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1 text-base-content/40 hover:text-error hover:bg-error/10 rounded transition-colors"
                    title="Eliminar"
                    disabled={disabled}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

export default TreeNodeRow;
