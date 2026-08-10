import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from '../Common/Icon';
import Button from '../Common/Button';
import { EvaluatorUser, fmtEval } from './types';

interface EvaluatorPickerProps {
    allEvaluators: EvaluatorUser[];
    assignedIds: string[];
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
    label?: string;
}

const EvaluatorPicker: React.FC<EvaluatorPickerProps> = ({
    allEvaluators,
    assignedIds,
    onAdd,
    onRemove,
    onClose,
    label,
}) => {
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const available = allEvaluators.filter(
        (u) => !assignedIds.includes(u.id) &&
            fmtEval(u).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="border border-primary/30 rounded-lg bg-base-100 p-3 space-y-2 shadow-sm">
            {label && (
                <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">{label}</p>
            )}

            {/* Assigned chips */}
            {assignedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {assignedIds.map((uid) => {
                        const u = allEvaluators.find((x) => x.id === uid);
                        if (!u) return null;
                        return (
                            <span
                                key={uid}
                                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20"
                            >
                                {fmtEval(u)}
                                <button
                                    type="button"
                                    onClick={() => onRemove(uid)}
                                    className="w-3.5 h-3.5 rounded-full hover:bg-secondary/20 flex items-center justify-center"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                    <Search size={16} />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar evaluador..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-bordered input-xs w-full pl-8"
                />
            </div>

            {/* Results */}
            {search && (
                <div className="max-h-36 overflow-y-auto divide-y divide-base-200 border border-base-200 rounded-lg">
                    {available.length === 0 ? (
                        <p className="text-xs text-center text-base-content/40 py-3">Sin resultados</p>
                    ) : (
                        available.slice(0, 6).map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => { onAdd(u.id); setSearch(''); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/5 transition-colors text-left"
                            >
                                <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 text-xs font-bold">
                                    {(u.persona?.nombres?.[0] ?? u.email[0]).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-medium">{fmtEval(u)}</p>
                                    <p className="text-[10px] text-base-content/40">{u.email}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}

            <div className="flex justify-end">
                <Button variant="ghost" size="xs" onClick={onClose}>
                    Cerrar
                </Button>
            </div>
        </div>
    );
};

export default EvaluatorPicker;
