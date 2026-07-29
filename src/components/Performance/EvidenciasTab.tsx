import React, { useState } from 'react';
import Button from '../Common/Button';
import { Pencil, Trash2, X, Plus, Link, Paperclip, FileText, Calendar, ExternalLink, ChevronDown, FilePlus } from '../Common/Icon';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EvidenciaTipo = 'LINK' | 'ARCHIVO' | 'REFERENCIA' | 'HITO';

export interface EvidenciaItem {
    id:             string;
    tipo:           EvidenciaTipo;
    titulo:         string;
    descripcion?:   string;
    url?:           string;
    fecha?:         string;
    fecha_creacion: string;
}

interface EvidenciasTabProps {
    /** Evidencias propias (editables) */
    evidencias: EvidenciaItem[];
    /** Evidencias de la contraparte (solo lectura, puede ser undefined si no aplica) */
    evidenciasContraparte?: EvidenciaItem[];
    /** Etiqueta de la sección propia — ej. "Mis evidencias" o "Evidencias del evaluador" */
    labelPropias?: string;
    /** Etiqueta de la contraparte — ej. "Evidencias del evaluado" */
    labelContraparte?: string;
    /** Si true, no se puede agregar/editar/eliminar */
    readonly?: boolean;
    onChange: (items: EvidenciaItem[]) => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<EvidenciaTipo, { label: string; icon: React.ReactNode; color: string; hint: string }> = {
    LINK: {
        label: 'Enlace',
        color: 'text-info',
        hint: 'URL a un recurso web externo',
        icon: <Link size={16} />,
    },
    ARCHIVO: {
        label: 'Archivo',
        color: 'text-warning',
        hint: 'Documento, imagen o cualquier archivo de soporte',
        icon: <Paperclip size={16} />,
    },
    REFERENCIA: {
        label: 'Referencia',
        color: 'text-secondary',
        hint: 'Descripción textual de un soporte o contexto',
        icon: <FileText size={16} />,
    },
    HITO: {
        label: 'Hito',
        color: 'text-success',
        hint: 'Evento o logro específico con fecha',
        icon: <Calendar size={16} />,
    },
};

const TIPOS: EvidenciaTipo[] = ['LINK', 'ARCHIVO', 'REFERENCIA', 'HITO'];

const newId = () => `ev-${Math.random().toString(36).slice(2, 9)}`;
const today = () => new Date().toISOString().split('T')[0];

// ─── Formulario de nueva / editar evidencia ───────────────────────────────────

interface EvidenciaFormData {
    tipo:        EvidenciaTipo;
    titulo:      string;
    descripcion: string;
    url:         string;
    fecha:       string;
    fileName:    string; // nombre del archivo seleccionado (solo UI)
}

const BLANK_FORM: EvidenciaFormData = {
    tipo: 'LINK', titulo: '', descripcion: '', url: '', fecha: '', fileName: '',
};

interface FormProps {
    initial?: EvidenciaFormData;
    onSubmit: (data: EvidenciaFormData) => void;
    onCancel: () => void;
    submitLabel: string;
}

const EvidenciaForm: React.FC<FormProps> = ({ initial = BLANK_FORM, onSubmit, onCancel, submitLabel }) => {
    const [form, setForm] = useState<EvidenciaFormData>(initial);
    const set = (fields: Partial<EvidenciaFormData>) => setForm(f => ({ ...f, ...fields }));

    const needsUrl   = form.tipo === 'LINK';
    const needsFile  = form.tipo === 'ARCHIVO';
    const needsFecha = form.tipo === 'HITO' || form.tipo === 'ARCHIVO';
    const canSubmit  = form.titulo.trim().length > 0 &&
        (form.tipo !== 'LINK' || form.url.trim().length > 0);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // En producción: upload a S3/CDN y guardar la URL resultante.
        // Por ahora guardamos el nombre del archivo como referencia.
        set({ fileName: file.name, url: `uploads/${file.name}` });
    };

    return (
        <div className="rounded-xl border border-base-200 bg-base-50/60 p-4 space-y-4">
            {/* Selector de tipo */}
            <div className="space-y-2">
                <label className="label-text font-medium block text-sm">Tipo de evidencia</label>
                <div className="flex flex-wrap gap-2">
                    {TIPOS.map(t => {
                        const cfg = TIPO_CONFIG[t];
                        const active = form.tipo === t;
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => set({ tipo: t, url: '', fileName: '', fecha: '' })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                    active
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-base-200 text-base-content/60 hover:border-base-300 hover:text-base-content'
                                }`}
                            >
                                <span className={active ? 'text-primary' : cfg.color}>{cfg.icon}</span>
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-base-content/40">{TIPO_CONFIG[form.tipo].hint}</p>
            </div>

            {/* Título */}
            <div className="space-y-1">
                <label className="label-text font-medium block text-sm">
                    Título <span className="text-error">*</span>
                </label>
                <input
                    className="input input-bordered input-sm w-full"
                    placeholder={
                        form.tipo === 'LINK'       ? 'Ej: Reporte de sprint Q3' :
                        form.tipo === 'ARCHIVO'    ? 'Ej: Acta de reunión — julio' :
                        form.tipo === 'REFERENCIA' ? 'Ej: Correo de confirmación del cliente' :
                                                    'Ej: Primera entrega completada'
                    }
                    value={form.titulo}
                    onChange={e => set({ titulo: e.target.value })}
                />
            </div>

            {/* URL — solo LINK */}
            {needsUrl && (
                <div className="space-y-1">
                    <label className="label-text font-medium block text-sm">
                        URL <span className="text-error">*</span>
                    </label>
                    <input
                        type="url"
                        className="input input-bordered input-sm w-full font-mono text-xs"
                        placeholder="https://..."
                        value={form.url}
                        onChange={e => set({ url: e.target.value })}
                    />
                </div>
            )}

            {/* Archivo — solo ARCHIVO */}
            {needsFile && (
                <div className="space-y-1">
                    <label className="label-text font-medium block text-sm">Archivo</label>
                    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                        form.fileName ? 'border-success/40 bg-success/5' : 'border-base-300 hover:border-primary/40 hover:bg-primary/5'
                    }`}>
                        <span className={form.fileName ? 'text-success' : 'text-base-content/40'}>
                            {TIPO_CONFIG.ARCHIVO.icon}
                        </span>
                        <span className="text-sm flex-1 truncate">
                            {form.fileName
                                ? <span className="text-success font-medium">{form.fileName}</span>
                                : <span className="text-base-content/50">Seleccionar archivo…</span>
                            }
                        </span>
                        {form.fileName && (
                            <Button
                                variant="ghost"
                                size="xs"
                                className="text-error"
                                shape="square"
                                onClick={e => { e.preventDefault(); set({ fileName: '', url: '' }); }}
                            >
                                <X size={16} />
                            </Button>
                        )}
                        <input type="file" className="hidden" onChange={handleFile}/>
                    </label>
                </div>
            )}

            {/* Fecha */}
            {needsFecha && (
                <div className="space-y-1">
                    <label className="label-text font-medium block text-sm">
                        Fecha {form.tipo === 'HITO' && <span className="text-base-content/40 font-normal">(del hito)</span>}
                        {form.tipo === 'ARCHIVO' && <span className="text-base-content/40 font-normal">(del documento)</span>}
                    </label>
                    <input
                        type="date"
                        className="input input-bordered input-sm w-full"
                        value={form.fecha}
                        onChange={e => set({ fecha: e.target.value })}
                        max={today()}
                    />
                </div>
            )}

            {/* Descripción */}
            <div className="space-y-1">
                <label className="label-text font-medium block text-sm">
                    Descripción <span className="text-base-content/40 font-normal text-xs">(opcional)</span>
                </label>
                <textarea
                    className="textarea textarea-bordered textarea-sm w-full text-sm resize-none"
                    rows={2}
                    placeholder="Contexto adicional sobre esta evidencia..."
                    value={form.descripcion}
                    onChange={e => set({ descripcion: e.target.value })}
                />
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
                <Button
                    variant="primary"
                    size="sm"
                    disabled={!canSubmit}
                    onClick={() => onSubmit(form)}
                >
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
};

// ─── Tarjeta de evidencia ─────────────────────────────────────────────────────

interface EvidenciaCardProps {
    item: EvidenciaItem;
    readonly?: boolean;
    onEdit:   () => void;
    onDelete: () => void;
}

const EvidenciaCard: React.FC<EvidenciaCardProps> = ({ item, readonly, onEdit, onDelete }) => {
    const cfg = TIPO_CONFIG[item.tipo];

    return (
        <div className="flex items-start gap-3 rounded-xl border border-base-200 bg-base-100 px-4 py-3 group hover:border-base-300 transition-colors">
            {/* Icono tipo */}
            <div className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{item.titulo}</p>
                    <span className={`badge badge-ghost badge-xs shrink-0 ${cfg.color} border-0`}>
                        {cfg.label}
                    </span>
                </div>
                {item.descripcion && (
                    <p className="text-xs text-base-content/60 mt-1 leading-relaxed">{item.descripcion}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                    {item.url && item.tipo === 'LINK' && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-info hover:underline truncate max-w-xs"
                            onClick={e => e.stopPropagation()}
                        >
                            <ExternalLink size={12} className="shrink-0" />
                            {item.url}
                        </a>
                    )}
                    {item.url && item.tipo === 'ARCHIVO' && (
                        <span className="flex items-center gap-1 text-xs text-base-content/50">
                            <Paperclip size={12} />
                            {item.url.replace('uploads/', '')}
                        </span>
                    )}
                    {item.fecha && (
                        <span className="flex items-center gap-1 text-xs text-base-content/40">
                            <Calendar size={12} />
                            {new Date(item.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                                day: '2-digit', month: 'short', year: 'numeric',
                            })}
                        </span>
                    )}
                    <span className="text-xs text-base-content/30 ml-auto">
                        Agregado {new Date(item.fecha_creacion + 'T12:00:00').toLocaleDateString('es-CO', {
                            day: '2-digit', month: 'short',
                        })}
                    </span>
                </div>
            </div>

            {/* Acciones */}
            {!readonly && (
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="xs"
                        shape="square"
                        onClick={onEdit}
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        shape="square"
                        className="text-error"
                        onClick={onDelete}
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            )}
        </div>
    );
};

// ─── Sección de lista (propias o contraparte) ─────────────────────────────────

interface EvidenciaSectionProps {
    label:     string;
    items:     EvidenciaItem[];
    readonly?: boolean;
    onEdit?:   (item: EvidenciaItem) => void;
    onDelete?: (id: string) => void;
    /** Si true, la sección empieza colapsada */
    collapsible?: boolean;
    defaultOpen?: boolean;
}

const EvidenciaSection: React.FC<EvidenciaSectionProps> = ({
    label, items, readonly, onEdit, onDelete, collapsible = false, defaultOpen = true,
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="space-y-2">
            <button
                type="button"
                className="flex items-center gap-2 w-full text-left"
                onClick={() => collapsible && setOpen(o => !o)}
                style={{ cursor: collapsible ? 'pointer' : 'default' }}
            >
                <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50 flex-1">
                    {label}
                    <span className="ml-2 badge badge-ghost badge-xs font-normal normal-case">
                        {items.length}
                    </span>
                </p>
                {collapsible && (
                    <ChevronDown size={16} className={`text-base-content/40 transition-transform ${open ? 'rotate-180' : ''}`} />
                )}
            </button>

            {open && (
                <div className="space-y-2">
                    {items.length === 0 ? (
                        <p className="text-xs text-base-content/30 italic py-2 px-1">
                            Sin evidencias {readonly ? 'registradas' : 'aún'}.
                        </p>
                    ) : (
                        items.map(item => (
                            <EvidenciaCard
                                key={item.id}
                                item={item}
                                readonly={readonly}
                                onEdit={() => onEdit?.(item)}
                                onDelete={() => onDelete?.(item.id)}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const EvidenciasTab: React.FC<EvidenciasTabProps> = ({
    evidencias,
    evidenciasContraparte,
    labelPropias    = 'Mis evidencias',
    labelContraparte = 'Evidencias de la contraparte',
    readonly        = false,
    onChange,
}) => {
    const [showForm,   setShowForm]   = useState(false);
    const [editingItem, setEditingItem] = useState<EvidenciaItem | null>(null);

    const handleAdd = (data: EvidenciaFormData) => {
        const item: EvidenciaItem = {
            id:             newId(),
            tipo:           data.tipo,
            titulo:         data.titulo.trim(),
            descripcion:    data.descripcion.trim() || undefined,
            url:            data.url.trim() || undefined,
            fecha:          data.fecha || undefined,
            fecha_creacion: today(),
        };
        onChange([...evidencias, item]);
        setShowForm(false);
    };

    const handleEdit = (data: EvidenciaFormData) => {
        if (!editingItem) return;
        const updated: EvidenciaItem = {
            ...editingItem,
            tipo:        data.tipo,
            titulo:      data.titulo.trim(),
            descripcion: data.descripcion.trim() || undefined,
            url:         data.url.trim() || editingItem.url,
            fecha:       data.fecha || undefined,
        };
        onChange(evidencias.map(e => e.id === updated.id ? updated : e));
        setEditingItem(null);
    };

    const handleDelete = (id: string) => {
        onChange(evidencias.filter(e => e.id !== id));
    };

    const itemToForm = (item: EvidenciaItem): EvidenciaFormData => ({
        tipo:        item.tipo,
        titulo:      item.titulo,
        descripcion: item.descripcion ?? '',
        url:         item.tipo === 'LINK' ? (item.url ?? '') : '',
        fecha:       item.fecha ?? '',
        fileName:    item.tipo === 'ARCHIVO' ? (item.url?.replace('uploads/', '') ?? '') : '',
    });

    const totalPropias      = evidencias.length;
    const totalContraparte  = evidenciasContraparte?.length ?? 0;

    return (
        <div className="space-y-6">
            {/* ── Sección propia ── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                            {labelPropias}
                            <span className="ml-2 badge badge-ghost badge-xs font-normal normal-case">
                                {totalPropias}
                            </span>
                        </p>
                    </div>
                    {!readonly && !showForm && !editingItem && (
                        <Button
                            variant="primary"
                            size="xs"
                            className="gap-1"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus size={16} />
                            Agregar
                        </Button>
                    )}
                </div>

                {/* Formulario de nueva evidencia */}
                {!readonly && showForm && (
                    <EvidenciaForm
                        onSubmit={handleAdd}
                        onCancel={() => setShowForm(false)}
                        submitLabel="Agregar evidencia"
                    />
                )}

                {/* Lista propia */}
                {evidencias.length === 0 && !showForm ? (
                    <div className={`rounded-xl border-2 border-dashed border-base-200 py-8 text-center ${
                        readonly ? '' : 'cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors'
                    }`}
                    onClick={() => !readonly && setShowForm(true)}
                    >
                        <FilePlus size={32} className="mx-auto mb-2 text-base-content/20" />
                        <p className="text-sm text-base-content/40 font-medium">
                            {readonly ? 'Sin evidencias registradas' : 'Agrega tu primera evidencia'}
                        </p>
                        {!readonly && (
                            <p className="text-xs text-base-content/30 mt-1">
                                Enlace, archivo, referencia o hito
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {evidencias.map(item => (
                            editingItem?.id === item.id ? (
                                <EvidenciaForm
                                    key={item.id}
                                    initial={itemToForm(item)}
                                    onSubmit={handleEdit}
                                    onCancel={() => setEditingItem(null)}
                                    submitLabel="Guardar cambios"
                                />
                            ) : (
                                <EvidenciaCard
                                    key={item.id}
                                    item={item}
                                    readonly={readonly || !!editingItem}
                                    onEdit={() => { setShowForm(false); setEditingItem(item); }}
                                    onDelete={() => handleDelete(item.id)}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* ── Divisor ── */}
            {evidenciasContraparte !== undefined && (
                <>
                    <div className="divider my-1 text-xs text-base-content/30">Contraparte</div>

                    {/* ── Sección contraparte (solo lectura) ── */}
                    <EvidenciaSection
                        label={labelContraparte}
                        items={evidenciasContraparte}
                        readonly
                        collapsible={totalContraparte > 0}
                        defaultOpen={totalContraparte > 0 && totalContraparte <= 3}
                    />

                    {totalContraparte === 0 && (
                        <p className="text-xs text-base-content/30 italic px-1">
                            La contraparte aún no ha registrado evidencias para este objetivo.
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export default EvidenciasTab;
export type { EvidenciasTabProps };
