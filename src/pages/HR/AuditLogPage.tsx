import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import {
    useBitacoraService,
    BitacoraEntry,
    BitacoraTipo,
    BitacoraVisibilidad,
    BitacoraQueryParams,
    CreateBitacoraDto,
    BITACORA_TIPO_META,
    BITACORA_VISIBILIDAD_META,
    TIPOS_POR_ROL,
    VISIBILIDADES_POR_ROL,
    canEditEntry,
    canDeleteEntry,
} from '../../services/bitacoraService';
import { UserRole } from '../../constants/roles';
import { Pagination } from '../../services/responseType';
import { Pencil, Trash2, User, FileText, Calendar, Check, Plus, AlertTriangle, Search, BookOpen, X, ArrowDown, ArrowUp, ExternalLink } from '../../components/Common/Icon';
import Button from '../../components/Common/Button';

// ─── Simulación de sesión activa ──────────────────────────────────────────────
// En producción esto vendría de tu AuthContext / useSession hook.

interface CurrentUser {
    id: string;
    nombre: string;
    rol: UserRole;
    puesto?: string;
}

const MOCK_USERS: CurrentUser[] = [
    { id: 'usr-rrhh-01',  nombre: 'María López',      rol: UserRole.HR_MANAGER,  puesto: 'Gestora de RRHH'      },
    { id: 'usr-eval-01',  nombre: 'Roberto Mendoza',   rol: UserRole.EVALUATOR,   puesto: 'Evaluador Senior'     },
    { id: 'usr-col-01',   nombre: 'Ana García',        rol: UserRole.EMPLOYEE,    puesto: 'Desarrollador Senior' },
    { id: 'usr-admin-01', nombre: 'Super Admin',       rol: UserRole.ADMIN,       puesto: 'Administrador'        },
];

// Colaboradores disponibles para asociar entradas (simplificado)
const MOCK_COLABORADORES = [
    { id: 'usr-col-01', nombre: 'Ana García',        puesto: 'Desarrollador Senior' },
    { id: 'usr-col-02', nombre: 'Carlos Rodríguez',  puesto: 'Arquitecto de Software' },
    { id: 'usr-col-03', nombre: 'Laura Sánchez',     puesto: 'QA Engineer' },
    { id: 'usr-col-04', nombre: 'Pedro Vega',        puesto: 'Product Manager' },
];

const MOCK_EVALUACIONES = [
    { id: 'eval-comp-007', nombre: 'Evaluación de Competencias Q1 2025' },
    { id: 'eval-desemp-003', nombre: 'Evaluación de Desempeño Q1 2025' },
    { id: 'eval-int-002', nombre: 'Evaluación Integral Q1 2025' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeDate = (iso: string): string => {
    const now = new Date();
    const date = new Date(iso);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatFullDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

/** Agrupa entradas por fecha relativa (Hoy, Ayer, etc.) */
const groupByDate = (entries: BitacoraEntry[]): { label: string; entries: BitacoraEntry[] }[] => {
    const groups: Record<string, BitacoraEntry[]> = {};
    for (const e of entries) {
        const key = formatRelativeDate(e.creado_en);
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
    }
    return Object.entries(groups).map(([label, entries]) => ({ label, entries }));
};

const getRolBadgeColor = (rol: UserRole) => ({
    [UserRole.ADMIN]: 'badge-error',
    [UserRole.HR_MANAGER]: 'badge-primary',
    [UserRole.EVALUATOR]: 'badge-secondary',
    [UserRole.EMPLOYEE]: 'badge-ghost'
}[rol]);

// ─── Ícono SVG inline ─────────────────────────────────────────────────────────

const Icon: React.FC<{ path: string; className?: string }> = ({ path, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
);

// ─── Entry Card ───────────────────────────────────────────────────────────────

interface EntryCardProps {
    entry: BitacoraEntry;
    currentUser: CurrentUser;
    onEdit: (e: BitacoraEntry) => void;
    onDelete: (e: BitacoraEntry) => void;
    onExpand: (e: BitacoraEntry) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, currentUser, onEdit, onDelete, onExpand }) => {
    const tipoMeta = BITACORA_TIPO_META[entry.tipo];
    const visibilidadMeta = BITACORA_VISIBILIDAD_META[entry.visibilidad];
    const canEdit = canEditEntry(entry, currentUser.id, currentUser.rol);
    const canDelete = canDeleteEntry(entry, currentUser.id, currentUser.rol);
    const isOwn = entry.autor_id === currentUser.id;
    const PREVIEW_CHARS = 220;
    const needsTruncate = entry.contenido.length > PREVIEW_CHARS;
    const preview = needsTruncate
        ? entry.contenido.slice(0, PREVIEW_CHARS).trimEnd() + '…'
        : entry.contenido;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="group card bg-base-100 border border-base-200 hover:border-base-300 hover:shadow-sm transition-all duration-200"
        >
            <div className="card-body p-5 gap-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        {/* Tipo */}
                        <span className={`badge badge-${tipoMeta.color} badge-sm font-medium gap-1`}>
                            <Icon path={tipoMeta.icon} className="w-3 h-3" />
                            {tipoMeta.label}
                        </span>
                        {/* Visibilidad */}
                        <span
                            className={`badge badge-outline badge-sm gap-1 text-base-content/50`}
                            title={visibilidadMeta.descripcion}
                        >
                            <Icon path={visibilidadMeta.icon} className="w-3 h-3" />
                            {visibilidadMeta.label}
                        </span>
                        {/* Editado */}
                        {entry.editado && (
                            <span className="text-xs text-base-content/30 italic">editado</span>
                        )}
                    </div>
                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onExpand(entry)}
                            title="Ver completo"
                        >
                            <ExternalLink size={16} />
                        </Button>
                        {canEdit && (
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => onEdit(entry)}
                                title="Editar"
                            >
                                <Pencil size={16} />
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="xs"
                                className="text-error/60 hover:text-error"
                                onClick={() => onDelete(entry)}
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm leading-snug cursor-pointer hover:text-primary transition-colors" onClick={() => onExpand(entry)}>
                    {entry.titulo}
                </h3>

                {/* Content preview — render naive markdown bold */}
                <p className="text-sm text-base-content/70 leading-relaxed whitespace-pre-line">
                    {preview.replace(/\*\*(.+?)\*\*/g, '$1')}
                </p>

                {needsTruncate && (
                    <button
                        className="text-xs text-primary hover:underline self-start -mt-1"
                        onClick={() => onExpand(entry)}
                    >
                        Leer más
                    </button>
                )}

                {/* Context chips */}
                {(entry.colaborador_nombre || entry.evaluacion_nombre || entry.ciclo_nombre) && (
                    <div className="flex flex-wrap gap-1.5">
                        {entry.colaborador_nombre && (
                            <span className="inline-flex items-center gap-1 text-xs bg-base-200 text-base-content/60 px-2 py-0.5 rounded-full">
                                <User size={12} />
                                {entry.colaborador_nombre}
                                {entry.colaborador_puesto && ` — ${entry.colaborador_puesto}`}
                            </span>
                        )}
                        {entry.evaluacion_nombre && (
                            <span className="inline-flex items-center gap-1 text-xs bg-base-200 text-base-content/60 px-2 py-0.5 rounded-full">
                                <FileText size={12} />
                                {entry.evaluacion_nombre}
                            </span>
                        )}
                        {entry.ciclo_nombre && (
                            <span className="inline-flex items-center gap-1 text-xs bg-base-200 text-base-content/60 px-2 py-0.5 rounded-full">
                                <Calendar size={12} />
                                {entry.ciclo_nombre}
                            </span>
                        )}
                    </div>
                )}

                {/* Tags */}
                {entry.etiquetas && entry.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {entry.etiquetas.map((tag) => (
                            <span key={tag} className="text-xs text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full font-mono">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-base-200">
                    <div className="flex items-center gap-2">
                        {/* Avatar */}
                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                            {entry.autor_nombre.charAt(0)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-base-content/60">
                                {isOwn ? 'Tú' : entry.autor_nombre}
                            </span>
                            <span className={`badge badge-xs ${getRolBadgeColor(entry.autor_rol)}`}>
                                {entry.autor_rol}
                            </span>
                        </div>
                    </div>
                    <time className="text-xs text-base-content/40" title={formatFullDate(entry.creado_en)}>
                        {new Date(entry.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Entry Viewer Modal ───────────────────────────────────────────────────────

const EntryViewer: React.FC<{ entry: BitacoraEntry; onClose: () => void; currentUser: CurrentUser; onEdit: (e: BitacoraEntry) => void }> = ({
    entry, onClose, currentUser, onEdit,
}) => {
    const tipoMeta = BITACORA_TIPO_META[entry.tipo];
    const visibilidadMeta = BITACORA_VISIBILIDAD_META[entry.visibilidad];
    const isOwn = entry.autor_id === currentUser.id;
    const canEdit = canEditEntry(entry, currentUser.id, currentUser.rol);

    // Naive markdown bold renderer
    const renderContent = (text: string) =>
        text.split(/(\*\*.+?\*\*)/).map((part, i) =>
            part.startsWith('**') ? (
                <strong key={i} className="font-semibold text-base-content">
                    {part.slice(2, -2)}
                </strong>
            ) : (
                <React.Fragment key={i}>{part}</React.Fragment>
            )
        );

    return (
        <div className="flex flex-col gap-4">
            {/* Meta badges */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge badge-${tipoMeta.color} gap-1`}>
                    <Icon path={tipoMeta.icon} className="w-3.5 h-3.5" />
                    {tipoMeta.label}
                </span>
                <span className="badge badge-outline gap-1 text-base-content/50">
                    <Icon path={visibilidadMeta.icon} className="w-3.5 h-3.5" />
                    {visibilidadMeta.label}
                </span>
                {entry.editado && <span className="text-xs text-base-content/30 italic">editado</span>}
            </div>

            {/* Title */}
            <h2 className="text-lg font-semibold leading-snug">{entry.titulo}</h2>

            {/* Context */}
            {(entry.colaborador_nombre || entry.evaluacion_nombre || entry.ciclo_nombre) && (
                <div className="bg-base-200/50 rounded-xl p-3 flex flex-wrap gap-3">
                    {entry.colaborador_nombre && (
                        <div>
                            <p className="text-xs text-base-content/40 mb-0.5">Colaborador</p>
                            <p className="text-sm font-medium">{entry.colaborador_nombre}</p>
                            {entry.colaborador_puesto && <p className="text-xs text-base-content/50">{entry.colaborador_puesto}</p>}
                        </div>
                    )}
                    {entry.evaluacion_nombre && (
                        <div>
                            <p className="text-xs text-base-content/40 mb-0.5">Evaluación</p>
                            <p className="text-sm font-medium">{entry.evaluacion_nombre}</p>
                        </div>
                    )}
                    {entry.ciclo_nombre && (
                        <div>
                            <p className="text-xs text-base-content/40 mb-0.5">Ciclo</p>
                            <p className="text-sm font-medium">{entry.ciclo_nombre}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="prose prose-sm max-w-none text-base-content/80 leading-relaxed whitespace-pre-line">
                {renderContent(entry.contenido)}
            </div>

            {/* Tags */}
            {entry.etiquetas && entry.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {entry.etiquetas.map((tag) => (
                        <span key={tag} className="text-xs text-primary/70 bg-primary/8 px-2 py-1 rounded-full font-mono">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Author + dates */}
            <div className="border-t border-base-200 pt-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-semibold">
                        {entry.autor_nombre.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-medium">{isOwn ? 'Tú' : entry.autor_nombre}</p>
                        <p className="text-xs text-base-content/40">{entry.autor_rol}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-base-content/40">
                        Creado: {formatFullDate(entry.creado_en)}
                    </p>
                    {entry.editado && (
                        <p className="text-xs text-base-content/30">
                            Editado: {formatFullDate(entry.actualizado_en)}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(entry); }}>
                        <Pencil size={16} />
                        Editar
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};

// ─── Entry Editor Modal ───────────────────────────────────────────────────────

interface EditorProps {
    entry: BitacoraEntry | null;
    currentUser: CurrentUser;
    onSave: (dto: CreateBitacoraDto) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}

const EMPTY_FORM = (rol: UserRole): CreateBitacoraDto => ({
    tipo: rol === UserRole.EMPLOYEE ? 'NOTA_PERSONAL' : 'NOTA_PERSONAL',
    titulo: '',
    contenido: '',
    visibilidad: 'PRIVADA',
    colaborador_id: undefined,
    evaluacion_id: undefined,
    etiquetas: [],
});

const EntryEditor: React.FC<EditorProps> = ({ entry, currentUser, onSave, onClose, saving }) => {
    const [form, setForm] = useState<CreateBitacoraDto>(
        entry
            ? {
                  tipo: entry.tipo,
                  titulo: entry.titulo,
                  contenido: entry.contenido,
                  visibilidad: entry.visibilidad,
                  colaborador_id: entry.colaborador_id,
                  evaluacion_id: entry.evaluacion_id,
                  etiquetas: entry.etiquetas ?? [],
              }
            : EMPTY_FORM(currentUser.rol)
    );
    const [tagInput, setTagInput] = useState('');

    const set = <K extends keyof CreateBitacoraDto>(key: K, value: CreateBitacoraDto[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
        if (tag && !form.etiquetas?.includes(tag)) {
            set('etiquetas', [...(form.etiquetas ?? []), tag]);
        }
        setTagInput('');
    };

    const removeTag = (tag: string) =>
        set('etiquetas', (form.etiquetas ?? []).filter((t) => t !== tag));

    const tiposDisponibles = TIPOS_POR_ROL[currentUser.rol];
    const visibilidadesDisponibles = VISIBILIDADES_POR_ROL[currentUser.rol];
    const isValid = form.titulo.trim() && form.contenido.trim();

    // Mostrar campo de colaborador solo si el tipo lo requiere y el rol puede
    const showColaborador =
        currentUser.rol !== UserRole.EMPLOYEE &&
        ['REUNION', 'OBSERVACION_EVALUACION', 'SEGUIMIENTO'].includes(form.tipo);

    const showEvaluacion =
        form.tipo === 'OBSERVACION_EVALUACION' || form.tipo === 'SEGUIMIENTO';

    const visibilidadActual = BITACORA_VISIBILIDAD_META[form.visibilidad];

    return (
        <div className="flex flex-col gap-4">
            {/* Tipo + Visibilidad */}
            <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text text-xs font-medium">Tipo de entrada</span>
                    </label>
                    <select
                        className="select select-bordered select-sm"
                        value={form.tipo}
                        onChange={(e) => set('tipo', e.target.value as BitacoraTipo)}
                    >
                        {tiposDisponibles.map((tipo) => (
                            <option key={tipo} value={tipo}>
                                {BITACORA_TIPO_META[tipo].label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-control">
                    <label className="label py-1">
                        <span className="label-text text-xs font-medium">Visibilidad</span>
                    </label>
                    <select
                        className="select select-bordered select-sm"
                        value={form.visibilidad}
                        onChange={(e) => set('visibilidad', e.target.value as BitacoraVisibilidad)}
                    >
                        {visibilidadesDisponibles.map((v) => (
                            <option key={v} value={v}>{BITACORA_VISIBILIDAD_META[v].label}</option>
                        ))}
                    </select>
                    {/* Hint de visibilidad */}
                    <label className="label py-0.5">
                        <span className="label-text-alt text-base-content/40 flex items-center gap-1">
                            <Icon path={visibilidadActual.icon} className="w-3 h-3" />
                            {visibilidadActual.descripcion}
                        </span>
                    </label>
                </div>
            </div>

            {/* Contexto: colaborador + evaluación */}
            {showColaborador && (
                <div className={`grid gap-3 ${showEvaluacion ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text text-xs font-medium">Colaborador</span>
                            <span className="label-text-alt text-xs text-base-content/40">Opcional</span>
                        </label>
                        <select
                            className="select select-bordered select-sm"
                            value={form.colaborador_id ?? ''}
                            onChange={(e) => set('colaborador_id', e.target.value || undefined)}
                        >
                            <option value="">— Sin colaborador —</option>
                            {MOCK_COLABORADORES.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre} — {c.puesto}
                                </option>
                            ))}
                        </select>
                    </div>
                    {showEvaluacion && (
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-xs font-medium">Evaluación</span>
                                <span className="label-text-alt text-xs text-base-content/40">Opcional</span>
                            </label>
                            <select
                                className="select select-bordered select-sm"
                                value={form.evaluacion_id ?? ''}
                                onChange={(e) => set('evaluacion_id', e.target.value || undefined)}
                            >
                                <option value="">— Sin evaluación —</option>
                                {MOCK_EVALUACIONES.map((ev) => (
                                    <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Título */}
            <div className="form-control">
                <label className="label py-1">
                    <span className="label-text text-xs font-medium">Título <span className="text-error">*</span></span>
                </label>
                <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="Título descriptivo de la entrada"
                    value={form.titulo}
                    onChange={(e) => set('titulo', e.target.value)}
                    maxLength={120}
                />
            </div>

            {/* Contenido */}
            <div className="form-control">
                <label className="label py-1">
                    <span className="label-text text-xs font-medium">Contenido <span className="text-error">*</span></span>
                    <span className="label-text-alt text-xs text-base-content/40">Soporta **negrita**</span>
                </label>
                <textarea
                    className="textarea textarea-bordered font-sans text-sm leading-relaxed resize-none"
                    rows={8}
                    placeholder={`Escribe tu nota aquí...\n\nPuedes usar **texto en negrita** para destacar partes importantes.`}
                    value={form.contenido}
                    onChange={(e) => set('contenido', e.target.value)}
                />
            </div>

            {/* Etiquetas */}
            <div className="form-control">
                <label className="label py-1">
                    <span className="label-text text-xs font-medium">Etiquetas</span>
                    <span className="label-text-alt text-xs text-base-content/40">Presiona Enter para agregar</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        placeholder="ej. seguimiento, Q2, plan-desarrollo"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                    >
                        Agregar
                    </Button>
                </div>
                {form.etiquetas && form.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.etiquetas.map((tag) => (
                            <span key={tag} className="badge badge-outline badge-sm gap-1 font-mono">
                                #{tag}
                                <button
                                    type="button"
                                    className="text-base-content/40 hover:text-error ml-0.5"
                                    onClick={() => removeTag(tag)}
                                ><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onSave(form)}
                    disabled={!isValid || saving}
                    loading={saving}
                >
                    {!saving && <Check size={16} />}
                    {entry ? 'Guardar cambios' : 'Crear entrada'}
                </Button>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 20;

const AuditLogPage: React.FC = () => {
    const { getEntries, createEntry, updateEntry, deleteEntry, loading } = useBitacoraService();

    // Sesión simulada — en producción viene del auth context
    const [currentUser, setCurrentUser] = useState<CurrentUser>(MOCK_USERS[0]);

    // Data
    const [entries, setEntries] = useState<BitacoraEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [tipoFilter, setTipoFilter] = useState<BitacoraTipo | ''>('');
    const [visibilidadFilter, setVisibilidadFilter] = useState<BitacoraVisibilidad | ''>('');
   /*  const [showFilters, setShowFilters] = useState(false); */
    const [queryParams, setQueryParams] = useState<BitacoraQueryParams>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        orden: 'desc',
    });

    // Modals
    const [editorOpen, setEditorOpen] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<BitacoraEntry | null>(null);
    const [saving, setSaving] = useState(false);

    const updateQueryParams = (updates: Partial<BitacoraQueryParams>) =>
        setQueryParams((prev) => ({ ...prev, ...updates, pagina: 1 }));

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => updateQueryParams({ filtro: searchInput || undefined }), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Sync tipo/visibilidad filter changes
    useEffect(() => {
        updateQueryParams({
            tipo: tipoFilter || undefined,
            visibilidad: visibilidadFilter || undefined,
        });
    }, [tipoFilter, visibilidadFilter]);

    const loadEntries = useCallback(async () => {
        const res = await getEntries(currentUser.id, currentUser.rol, queryParams);
        if (res?.success) {
            setEntries(res.data?.entradas ?? []);
            setPagination(res.data?.paginacion ?? null);
        }
    }, [currentUser, queryParams]);

    useEffect(() => { loadEntries(); }, [loadEntries]);

    // Reset on user switch
    useEffect(() => {
        setSearchInput('');
        setTipoFilter('');
        setVisibilidadFilter('');
        setQueryParams({ pagina: 1, items_por_pagina: ITEMS_PER_PAGE, orden: 'desc' });
    }, [currentUser]);

    // Handlers
    const handleCreate = () => { setSelectedEntry(null); setEditorOpen(true); };
    const handleEdit = (e: BitacoraEntry) => { setSelectedEntry(e); setEditorOpen(true); };
    const handleExpand = (e: BitacoraEntry) => { setSelectedEntry(e); setViewerOpen(true); };
    const handleDeleteClick = (e: BitacoraEntry) => { setSelectedEntry(e); setDeleteOpen(true); };

    const handleSave = async (dto: CreateBitacoraDto) => {
        setSaving(true);
        try {
            const colaborador = MOCK_COLABORADORES.find((c) => c.id === dto.colaborador_id);
            const evaluacion = MOCK_EVALUACIONES.find((e) => e.id === dto.evaluacion_id);
            let res;
            if (selectedEntry) {
                res = await updateEntry(selectedEntry.id, dto);
            } else {
                res = await createEntry(
                    dto,
                    currentUser.id,
                    currentUser.nombre,
                    currentUser.rol,
                    colaborador?.nombre,
                    colaborador?.puesto,
                    evaluacion?.nombre,
                );
            }
            if (res?.success) { setEditorOpen(false); setSelectedEntry(null); loadEntries(); }
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedEntry) return;
        const ok = await deleteEntry(selectedEntry.id);
        if (ok) { setDeleteOpen(false); setSelectedEntry(null); loadEntries(); }
    };

    const clearFilters = () => {
        setSearchInput('');
        setTipoFilter('');
        setVisibilidadFilter('');
    };

    const hasActiveFilters = !!(searchInput || tipoFilter || visibilidadFilter);
    const groups = groupByDate(entries);

    const visibilidadesDisponibles = VISIBILIDADES_POR_ROL[currentUser.rol];

    return (
        <PageContainer
            title="Bitácora"
            subtitle="Registro de reuniones, observaciones y notas de seguimiento del proceso de evaluación."
            actions={
                <Button variant="primary" className="w-full sm:w-auto" onClick={handleCreate}>
                    <Plus size={20} className="mr-1" />
                    Nueva entrada
                </Button>
            }
        >
            {/* ── DEV: Role switcher — remover en producción ── */}
            <div className="alert alert-warning py-2 mb-4 flex-wrap gap-2 items-center">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span className="text-xs font-medium">Vista como:</span>
                <div className="join">
                    {MOCK_USERS.map((u) => (
                        <button
                            key={u.id}
                            className={`join-item btn btn-xs ${currentUser.id === u.id ? 'btn-warning' : 'btn-outline'}`}
                            onClick={() => setCurrentUser(u)}
                        >
                            {u.rol} — {u.nombre.split(' ')[0]}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-base-content/50 ml-auto">Solo para desarrollo</span>
            </div>

            {/* ── Filters bar ── */}
            <div className="flex flex-wrap gap-3 mb-5 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                    <input
                        type="text"
                        className="input input-bordered input-sm w-full pl-9 pr-8"
                        placeholder="Buscar en la bitácora..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle text-xs" onClick={() => setSearchInput('')}><X size={12} /></button>
                    )}
                </div>

                {/* Tipo filter */}
                <select
                    className="select select-bordered select-sm"
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value as BitacoraTipo | '')}
                >
                    <option value="">Todos los tipos</option>
                    {(Object.entries(BITACORA_TIPO_META) as [BitacoraTipo, typeof BITACORA_TIPO_META[BitacoraTipo]][])
                        .filter(([key]) => TIPOS_POR_ROL[currentUser.rol].includes(key))
                        .map(([key, meta]) => (
                            <option key={key} value={key}>{meta.label}</option>
                        ))}
                </select>

                {/* Visibilidad filter */}
                <select
                    className="select select-bordered select-sm"
                    value={visibilidadFilter}
                    onChange={(e) => setVisibilidadFilter(e.target.value as BitacoraVisibilidad | '')}
                >
                    <option value="">Toda visibilidad</option>
                    {visibilidadesDisponibles.map((v) => (
                        <option key={v} value={v}>{BITACORA_VISIBILIDAD_META[v].label}</option>
                    ))}
                </select>

                {/* Orden */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    title={queryParams.orden === 'desc' ? 'Más reciente primero' : 'Más antiguo primero'}
                    onClick={() => updateQueryParams({ orden: queryParams.orden === 'desc' ? 'asc' : 'desc' })}
                >
                    {queryParams.orden === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                    {queryParams.orden === 'desc' ? 'Recientes' : 'Antiguos'}
                </Button>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="text-base-content/50" onClick={clearFilters}>
                        Limpiar filtros
                    </Button>
                )}

                {/* Count badge */}
                {pagination && (
                    <span className="text-xs text-base-content/40 ml-auto">
                        {pagination.total} {pagination.total === 1 ? 'entrada' : 'entradas'}
                    </span>
                )}
            </div>

            {/* ── Feed ── */}
            {loading && !entries.length ? (
                <LoadingIndicator />
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-base-content/30">
                    <BookOpen size={56} className="mb-3" />
                    <p className="text-sm font-medium">No hay entradas en la bitácora</p>
                    <p className="text-xs mt-1">
                        {hasActiveFilters
                            ? 'Ninguna entrada coincide con los filtros aplicados.'
                            : 'Empieza creando tu primera entrada.'}
                    </p>
                    {!hasActiveFilters && (
                        <Button variant="primary" size="sm" className="mt-4" onClick={handleCreate}>
                            Crear primera entrada
                        </Button>
                    )}
                </div>
            ) : (
                <motion.div className="space-y-6" layout>
                    <AnimatePresence>
                        {groups.map(({ label, entries: groupEntries }) => (
                            <div key={label}>
                                {/* Date group header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                                        {label}
                                    </span>
                                    <div className="flex-1 border-t border-base-200" />
                                </div>

                                {/* Cards grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <AnimatePresence>
                                        {groupEntries.map((entry) => (
                                            <EntryCard
                                                key={entry.id}
                                                entry={entry}
                                                currentUser={currentUser}
                                                onEdit={handleEdit}
                                                onDelete={handleDeleteClick}
                                                onExpand={handleExpand}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Editor Modal ── */}
            <GenericModal
                isOpen={editorOpen}
                onClose={() => { setEditorOpen(false); setSelectedEntry(null); }}
                title={selectedEntry ? 'Editar entrada' : 'Nueva entrada en bitácora'}
                size="lg"
            >
                <EntryEditor
                    entry={selectedEntry}
                    currentUser={currentUser}
                    onSave={handleSave}
                    onClose={() => { setEditorOpen(false); setSelectedEntry(null); }}
                    saving={saving}
                />
            </GenericModal>

            {/* ── Viewer Modal ── */}
            <GenericModal
                isOpen={viewerOpen}
                onClose={() => { setViewerOpen(false); setSelectedEntry(null); }}
                title="Entrada de bitácora"
                size="lg"
            >
                {selectedEntry && (
                    <EntryViewer
                        entry={selectedEntry}
                        currentUser={currentUser}
                        onClose={() => { setViewerOpen(false); setSelectedEntry(null); }}
                        onEdit={handleEdit}
                    />
                )}
            </GenericModal>

            {/* ── Delete Modal ── */}
            <ConfirmationModal
                isOpen={deleteOpen}
                title="Eliminar entrada"
                message={`¿Estás seguro de que deseas eliminar "${selectedEntry?.titulo}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onClose={() => { setDeleteOpen(false); setSelectedEntry(null); }}
            />
        </PageContainer>
    );
};

export default AuditLogPage;
