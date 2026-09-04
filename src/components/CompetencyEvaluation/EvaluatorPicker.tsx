import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from '../Common/Icon';
import Button from '../Common/Button';
import { EvaluatorUser, fmtEval } from './types';
import { useUserService, SystemUser } from '../../services/userService';

interface EvaluatorPickerProps {
    assignedIds: string[];
    onAdd: (id: string, user?: EvaluatorUser) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
    label?: string;
    /** Cache externo de usuarios ya conocidos (nombre, email) para resolver chips sin llamada API */
    usersCache?: Record<string, EvaluatorUser>;
}

const EvaluatorPicker: React.FC<EvaluatorPickerProps> = ({
    assignedIds,
    onAdd,
    onRemove,
    onClose,
    label,
    usersCache,
}) => {
    const { getUsers } = useUserService();
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<EvaluatorUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [assignedUsers, setAssignedUsers] = useState<EvaluatorUser[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Búsqueda server-side con debounce para evaluadores / usuarios
    useEffect(() => {
        const term = search.trim();
        if (term.length === 0) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        const handler = setTimeout(async () => {
            const res = await getUsers({ search: term, items_por_pagina: 10 });
            if (res?.success) {
                const usuarios: SystemUser[] = res.data.datos || [];
                const mapped: EvaluatorUser[] = usuarios.map((u) => ({
                    id: u.id,
                    email: u.email,
                    persona: u.colaborador
                        ? { nombres: u.colaborador.nombres, apellidos: u.colaborador.apellidos }
                        : undefined,
                }));
                setSearchResults(mapped);
            }
            setSearching(false);
        }, 300);
        return () => clearTimeout(handler);
    }, [search, getUsers]);

    // Carga detalles de usuarios ya asignados para mostrarlos correctamente en los chips
    useEffect(() => {
        if (assignedIds.length === 0) return;
        let cancelled = false;
        (async () => {
            const missing = assignedIds.filter((id) => !assignedUsers.some((u) => u.id === id));
            if (missing.length === 0) return;
            const fetched: EvaluatorUser[] = [...assignedUsers];
            for (const uid of missing) {
                const res = await getUsers({ search: uid, items_por_pagina: 5 });
                if (cancelled) return;
                if (res?.success) {
                    const usuarios: SystemUser[] = res.data.datos || [];
                    const found = usuarios.find((u) => u.id === uid);
                    if (found) {
                        fetched.push({
                            id: found.id,
                            email: found.email,
                            persona: found.colaborador
                                ? { nombres: found.colaborador.nombres, apellidos: found.colaborador.apellidos }
                                : undefined,
                        });
                    }
                }
            }
            if (!cancelled) setAssignedUsers(fetched);
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignedIds]);

    return (
        <div className="space-y-3 p-1">
            {label && (
                <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">{label}</p>
            )}

            {/* Chips de evaluadores asignados */}
            {assignedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {assignedIds.map((uid) => {
                        const u = usersCache?.[uid] || assignedUsers.find((x) => x.id === uid) || searchResults.find((x) => x.id === uid);
                        const name = u ? fmtEval(u) : '';
                        const displayName = name || u?.email || uid;
                        return (
                            <span
                                key={uid}
                                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20"
                            >
                                {displayName}
                                <button
                                    type="button"
                                    onClick={() => onRemove(uid)}
                                    className="w-4 h-4 rounded-full hover:bg-secondary/20 flex items-center justify-center text-secondary/70 hover:text-secondary"
                                    title="Quitar evaluador"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Barra de búsqueda con debounce */}
            <div className="relative">
                <div className="flex items-center gap-2 border border-base-200 rounded-lg bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary">
                    <Search size={16} className="text-base-content/40" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar evaluador por nombre, apellido o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 outline-none bg-transparent text-sm"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="p-1 rounded-md hover:bg-base-100 text-base-content/40"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Dropdown de resultados de búsqueda */}
                {search && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-base-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {searching ? (
                            <div className="px-4 py-3 text-center text-xs text-base-content/50">
                                Buscando evaluadores...
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((user) => {
                                const isAlreadyAssigned = assignedIds.includes(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        disabled={isAlreadyAssigned}
                                        onClick={() => {
                                            if (!isAlreadyAssigned) {
                                                onAdd(user.id, user);
                                                setAssignedUsers((prev) => [...prev, user]);
                                                setSearch('');
                                            }
                                        }}
                                        className={`w-full text-left px-3 py-2 border-b border-base-100 last:border-b-0 transition-colors flex items-center justify-between gap-2 ${
                                            isAlreadyAssigned ? 'opacity-50 cursor-not-allowed bg-base-50' : 'hover:bg-primary/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                {(user.persona?.nombres?.[0] ?? user.email[0]).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-xs text-base-content truncate">
                                                    {fmtEval(user)}
                                                </p>
                                                <p className="text-[10px] text-base-content/50 truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-primary shrink-0">
                                            {isAlreadyAssigned ? 'Asignado' : '+ Agregar'}
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-center text-xs text-base-content/50">
                                No se encontraron evaluadores
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-1">
                <Button variant="ghost" size="xs" onClick={onClose}>
                    Cerrar
                </Button>
            </div>
        </div>
    );
};

export default EvaluatorPicker;
