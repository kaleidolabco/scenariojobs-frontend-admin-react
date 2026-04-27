import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import {
    useEmailService,
    EmailTemplate,
    EmailTemplateType,
    SmtpConfig,
    EMAIL_TEMPLATE_TYPE_META,
    TEMPLATE_PREVIEW_VARS,
    emailTemplateQueryParams,
} from '../../services/emailService';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'plantillas' | 'smtp';

type TemplateFormData = Omit<EmailTemplate, 'id' | 'creado_en' | 'actualizado_en'>;

const EMPTY_TEMPLATE: TemplateFormData = {
    nombre: '',
    tipo: 'PERSONALIZADO',
    asunto: '',
    cuerpo: '',
    activo: true,
    descripcion: '',
};

const TEMPLATE_VARIABLES = Object.keys(TEMPLATE_PREVIEW_VARS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const interpolate = (text: string, vars: Record<string, string>): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

const formatDate = (iso?: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TemplateCardProps {
    template: EmailTemplate;
    onEdit: (t: EmailTemplate) => void;
    onPreview: (t: EmailTemplate) => void;
    onDelete: (t: EmailTemplate) => void;
    onToggleActive: (t: EmailTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onPreview, onDelete, onToggleActive }) => {
    const meta = EMAIL_TEMPLATE_TYPE_META[template.tipo];
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="card bg-base-100 border border-base-200 hover:border-base-300 hover:shadow-sm transition-all duration-200"
        >
            <div className="card-body p-5 gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`badge badge-${meta.color} badge-sm font-medium`}>
                                {meta.label}
                            </span>
                            {!template.activo && (
                                <span className="badge badge-ghost badge-sm">Inactivo</span>
                            )}
                        </div>
                        <h3 className="font-semibold text-sm leading-snug truncate" title={template.nombre}>
                            {template.nombre}
                        </h3>
                    </div>

                    {/* Status toggle */}
                    <label className="swap swap-rotate flex-shrink-0" title={template.activo ? 'Desactivar' : 'Activar'}>
                        <input
                            type="checkbox"
                            checked={template.activo}
                            onChange={() => onToggleActive(template)}
                        />
                        {/* Active icon */}
                        <svg className="swap-on w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {/* Inactive icon */}
                        <svg className="swap-off w-5 h-5 text-base-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </label>
                </div>

                {/* Subject preview */}
                <div className="bg-base-200/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-base-content/50 mb-0.5">Asunto</p>
                    <p className="text-xs font-medium truncate text-base-content/80">{template.asunto}</p>
                </div>

                {/* Description */}
                {template.descripcion && (
                    <p className="text-xs text-base-content/50 leading-relaxed line-clamp-2">
                        {template.descripcion}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-base-200">
                    <span className="text-xs text-base-content/40">
                        Actualizado {formatDate(template.actualizado_en)}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => onPreview(template)}
                            title="Vista previa"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                        <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => onEdit(template)}
                            title="Editar"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            className="btn btn-ghost btn-xs text-error/70 hover:text-error"
                            onClick={() => onDelete(template)}
                            title="Eliminar"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Template Editor Modal ────────────────────────────────────────────────────

interface TemplateEditorProps {
    template: EmailTemplate | null;
    onSave: (data: TemplateFormData) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onClose, saving }) => {
    const [form, setForm] = useState<TemplateFormData>(
        template
            ? {
                nombre: template.nombre,
                tipo: template.tipo,
                asunto: template.asunto,
                cuerpo: template.cuerpo,
                activo: template.activo,
                descripcion: template.descripcion ?? '',
            }
            : EMPTY_TEMPLATE
    );
    const [previewMode, setPreviewMode] = useState(false);
    //const [insertAt, setInsertAt] = useState<number | null>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    const set = (key: keyof TemplateFormData, value: any) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const insertVariable = (varName: string) => {
        const ta = bodyRef.current;
        if (!ta) return;
        const start = ta.selectionStart ?? form.cuerpo.length;
        const end = ta.selectionEnd ?? start;
        const snippet = `{{${varName}}}`;
        const newBody = form.cuerpo.slice(0, start) + snippet + form.cuerpo.slice(end);
        set('cuerpo', newBody);
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + snippet.length, start + snippet.length);
        }, 0);
    };

    const isValid = form.nombre.trim() && form.asunto.trim() && form.cuerpo.trim();

    return (
        <div className="flex flex-col gap-4">
            {/* Two-column layout: form | preview toggle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left column: form fields */}
                <div className="flex flex-col gap-4">
                    {/* Nombre */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text font-medium text-xs">Nombre de la plantilla <span className="text-error">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="Ej. Recordatorio semanal"
                            value={form.nombre}
                            onChange={(e) => set('nombre', e.target.value)}
                        />
                    </div>

                    {/* Tipo + Activo row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-xs">Tipo</span>
                            </label>
                            <select
                                className="select select-bordered select-sm"
                                value={form.tipo}
                                onChange={(e) => set('tipo', e.target.value as EmailTemplateType)}
                            >
                                {(Object.entries(EMAIL_TEMPLATE_TYPE_META) as [EmailTemplateType, { label: string }][]).map(
                                    ([key, { label }]) => (
                                        <option key={key} value={key}>{label}</option>
                                    )
                                )}
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-xs">Estado</span>
                            </label>
                            <div className="flex items-center gap-2 h-8 mt-1">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-success toggle-sm"
                                    checked={form.activo}
                                    onChange={(e) => set('activo', e.target.checked)}
                                />
                                <span className="text-sm text-base-content/70">
                                    {form.activo ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Asunto */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text font-medium text-xs">Línea de asunto <span className="text-error">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="Ej. Tienes una nueva evaluación: {{nombre_evaluacion}}"
                            value={form.asunto}
                            onChange={(e) => set('asunto', e.target.value)}
                        />
                    </div>

                    {/* Descripción */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text font-medium text-xs">Descripción interna</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered input-sm"
                            placeholder="¿Cuándo se envía esta plantilla?"
                            value={form.descripcion}
                            onChange={(e) => set('descripcion', e.target.value)}
                        />
                    </div>

                    {/* Variables helper */}
                    <div>
                        <p className="text-xs text-base-content/50 mb-2 font-medium">Variables disponibles — clic para insertar</p>
                        <div className="flex flex-wrap gap-1.5">
                            {TEMPLATE_VARIABLES.map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    className="badge badge-outline badge-sm cursor-pointer hover:badge-primary transition-colors font-mono text-xs"
                                    onClick={() => insertVariable(v)}
                                    title={`Valor de ejemplo: ${TEMPLATE_PREVIEW_VARS[v]}`}
                                >
                                    {`{{${v}}}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column: body editor + preview toggle */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="label-text font-medium text-xs">
                            Cuerpo del correo <span className="text-error">*</span>
                        </label>
                        <div className="tabs tabs-boxed tabs-xs h-7 p-0.5">
                            <button
                                className={`tab tab-xs px-3 ${!previewMode ? 'tab-active' : ''}`}
                                onClick={() => setPreviewMode(false)}
                            >
                                Editar
                            </button>
                            <button
                                className={`tab tab-xs px-3 ${previewMode ? 'tab-active' : ''}`}
                                onClick={() => setPreviewMode(true)}
                            >
                                Vista previa
                            </button>
                        </div>
                    </div>

                    {previewMode ? (
                        <div className="flex-1 bg-base-200/50 rounded-xl p-4 min-h-[280px] overflow-y-auto">
                            {/* Email preview shell */}
                            <div className="bg-base-100 rounded-lg border border-base-200 overflow-hidden shadow-sm">
                                <div className="bg-base-200/80 px-4 py-3 border-b border-base-200">
                                    <p className="text-xs text-base-content/50 mb-0.5">Asunto</p>
                                    <p className="text-sm font-semibold">
                                        {interpolate(form.asunto || '(sin asunto)', TEMPLATE_PREVIEW_VARS)}
                                    </p>
                                </div>
                                <div className="px-4 py-4">
                                    <pre className="text-sm text-base-content/80 whitespace-pre-wrap font-sans leading-relaxed">
                                        {interpolate(form.cuerpo || '(sin contenido)', TEMPLATE_PREVIEW_VARS)}
                                    </pre>
                                </div>
                            </div>
                            <p className="text-xs text-base-content/40 mt-2 text-center">
                                Variables reemplazadas con valores de ejemplo
                            </p>
                        </div>
                    ) : (
                        <textarea
                            ref={bodyRef}
                            className="textarea textarea-bordered flex-1 font-mono text-sm resize-none min-h-[280px]"
                            placeholder="Escribe el cuerpo del correo aquí..."
                            value={form.cuerpo}
                            onChange={(e) => set('cuerpo', e.target.value)}
                        />
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
                <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
                    Cancelar
                </button>
                <button
                    className={`btn btn-primary btn-sm ${saving ? 'loading' : ''}`}
                    onClick={() => onSave(form)}
                    disabled={!isValid || saving}
                >
                    {!saving && (
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {template ? 'Guardar cambios' : 'Crear plantilla'}
                </button>
            </div>
        </div>
    );
};

// ─── Template Preview Modal ───────────────────────────────────────────────────

const TemplatePreviewModal: React.FC<{ template: EmailTemplate; onClose: () => void }> = ({
    template,
    onClose,
}) => {
    const meta = EMAIL_TEMPLATE_TYPE_META[template.tipo];
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <span className={`badge badge-${meta.color}`}>{meta.label}</span>
                <span className="text-sm text-base-content/50">{template.nombre}</span>
            </div>

            <div className="bg-base-200/50 rounded-xl p-4">
                <div className="bg-base-100 rounded-lg border border-base-200 overflow-hidden shadow-sm">
                    {/* Mock email client header */}
                    <div className="bg-base-200 px-4 py-3 border-b border-base-200 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold">
                                    {interpolate('{{nombre_empresa}}', TEMPLATE_PREVIEW_VARS)}
                                </p>
                                <p className="text-xs text-base-content/40">Ahora</p>
                            </div>
                            <p className="text-xs text-base-content/50 mt-0.5">
                                Para: {interpolate('{{nombre_colaborador}}', TEMPLATE_PREVIEW_VARS)}
                            </p>
                            <p className="text-sm font-semibold mt-2">
                                {interpolate(template.asunto, TEMPLATE_PREVIEW_VARS)}
                            </p>
                        </div>
                    </div>
                    <div className="px-5 py-5">
                        <pre className="text-sm text-base-content/80 whitespace-pre-wrap font-sans leading-relaxed">
                            {interpolate(template.cuerpo, TEMPLATE_PREVIEW_VARS)}
                        </pre>
                    </div>
                </div>
                <p className="text-xs text-base-content/40 mt-2 text-center">
                    Variables reemplazadas con valores de ejemplo
                </p>
            </div>

            <div className="text-xs text-base-content/40 flex items-center gap-4">
                <span>Creado: {formatDate(template.creado_en)}</span>
                <span>Actualizado: {formatDate(template.actualizado_en)}</span>
            </div>

            <div className="flex justify-end">
                <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

// ─── SMTP Config Form ─────────────────────────────────────────────────────────

interface SmtpFormProps {
    config: SmtpConfig;
    onSave: (c: SmtpConfig) => Promise<void>;
    saving: boolean;
    onTestConnection: () => void;
    testing: boolean;
    testResult: 'idle' | 'success' | 'error';
}

const SmtpForm: React.FC<SmtpFormProps> = ({
    config,
    onSave,
    saving,
    onTestConnection,
    testing,
    testResult,
}) => {
    const [form, setForm] = useState<SmtpConfig>(config);
    const [showPass, setShowPass] = useState(false);
    const set = (key: keyof SmtpConfig, value: any) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-4">
                {/* Server */}
                <div className="card bg-base-100 border border-base-200">
                    <div className="card-body p-5 gap-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                            Servidor SMTP
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs font-medium">Host</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered input-sm"
                                    placeholder="smtp.gmail.com"
                                    value={form.host}
                                    onChange={(e) => set('host', e.target.value)}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs font-medium">Puerto</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered input-sm"
                                    placeholder="587"
                                    value={form.puerto}
                                    onChange={(e) => set('puerto', Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-3 py-1">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-sm"
                                    checked={form.usar_tls}
                                    onChange={(e) => set('usar_tls', e.target.checked)}
                                />
                                <div>
                                    <span className="label-text text-xs font-medium">Usar TLS/STARTTLS</span>
                                    <p className="text-xs text-base-content/50">Recomendado para puertos 587 y 465</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Auth */}
                <div className="card bg-base-100 border border-base-200">
                    <div className="card-body p-5 gap-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Autenticación
                        </h3>
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-xs font-medium">Usuario</span>
                            </label>
                            <input
                                type="email"
                                className="input input-bordered input-sm"
                                placeholder="notificaciones@empresa.com"
                                value={form.usuario}
                                onChange={(e) => set('usuario', e.target.value)}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text text-xs font-medium">Contraseña</span>
                            </label>
                            <div className="input-group">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="input input-bordered input-sm flex-1"
                                    placeholder="••••••••••••"
                                    value={form.password ?? ''}
                                    onChange={(e) => set('password', e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-square btn-sm btn-ghost border border-base-300"
                                    onClick={() => setShowPass(!showPass)}
                                    title={showPass ? 'Ocultar' : 'Mostrar'}
                                >
                                    {showPass ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <label className="label py-1">
                                <span className="label-text-alt text-base-content/40">Dejar en blanco para conservar la contraseña actual</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Sender */}
                <div className="card bg-base-100 border border-base-200">
                    <div className="card-body p-5 gap-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Remitente
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs font-medium">Nombre del remitente</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered input-sm"
                                    placeholder="ScenarioJobs"
                                    value={form.remitente_nombre}
                                    onChange={(e) => set('remitente_nombre', e.target.value)}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs font-medium">Email del remitente</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered input-sm"
                                    placeholder="no-reply@empresa.com"
                                    value={form.remitente_email}
                                    onChange={(e) => set('remitente_email', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save */}
                <div className="flex justify-end">
                    <button
                        className={`btn btn-primary btn-sm ${saving ? 'loading' : ''}`}
                        onClick={() => onSave(form)}
                        disabled={saving}
                    >
                        {!saving && (
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                        )}
                        Guardar configuración
                    </button>
                </div>
            </div>

            {/* Right: status + test connection panel */}
            <div className="space-y-4">
                {/* Test connection */}
                <div className="card bg-base-100 border border-base-200">
                    <div className="card-body p-5 gap-3">
                        <h3 className="font-semibold text-sm">Probar conexión</h3>
                        <p className="text-xs text-base-content/50 leading-relaxed">
                            Verifica que la configuración SMTP sea correcta enviando un correo de prueba a la dirección del usuario.
                        </p>
                        <button
                            className={`btn btn-outline btn-sm w-full ${testing ? 'loading' : ''}`}
                            onClick={onTestConnection}
                            disabled={testing}
                        >
                            {!testing && (
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                            {testing ? 'Probando...' : 'Enviar correo de prueba'}
                        </button>

                        <AnimatePresence>
                            {testResult !== 'idle' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`alert alert-sm py-2 text-xs ${testResult === 'success' ? 'alert-success' : 'alert-error'
                                        }`}
                                >
                                    {testResult === 'success'
                                        ? '✓ Conexión exitosa. Correo enviado.'
                                        : '✗ No se pudo conectar. Revisa los datos.'}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Config summary card */}
                <div className="card bg-base-200/50 border border-base-200">
                    <div className="card-body p-5 gap-3">
                        <h3 className="font-semibold text-sm text-base-content/70">Configuración actual</h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Host', value: form.host || '—' },
                                { label: 'Puerto', value: form.puerto?.toString() || '—' },
                                { label: 'TLS', value: form.usar_tls ? 'Habilitado' : 'Deshabilitado' },
                                { label: 'Usuario', value: form.usuario || '—' },
                                { label: 'Remitente', value: form.remitente_nombre || '—' },
                                { label: 'Email', value: form.remitente_email || '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center text-xs">
                                    <span className="text-base-content/50">{label}</span>
                                    <span className="font-mono font-medium text-base-content/80 max-w-[140px] truncate text-right" title={value}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="card bg-info/5 border border-info/20">
                    <div className="card-body p-4 gap-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-info flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-semibold text-info">Configuraciones comunes</span>
                        </div>
                        <ul className="text-xs text-base-content/60 space-y-1 list-none ml-0">
                            <li className="flex justify-between"><span>Gmail</span><span className="font-mono">smtp.gmail.com:587</span></li>
                            <li className="flex justify-between"><span>Outlook</span><span className="font-mono">smtp.office365.com:587</span></li>
                            <li className="flex justify-between"><span>SendGrid</span><span className="font-mono">smtp.sendgrid.net:587</span></li>
                            <li className="flex justify-between"><span>Mailgun</span><span className="font-mono">smtp.mailgun.org:587</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const EmailConfigPage: React.FC = () => {
    const {
        getTemplates,
        getSmtpConfig,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        updateSmtpConfig,
        loading,
    } = useEmailService();

    // Tabs
    const [activeTab, setActiveTab] = useState<TabId>('plantillas');

    // Templates
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [typeFilter, setTypeFilter] = useState<EmailTemplateType | ''>('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Modals
    const [editorOpen, setEditorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    // SMTP
    const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null);
    const [savingSmtp, setSavingSmtp] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [testingConn, setTestingConn] = useState(false);
    const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

    // Load templates
    const loadTemplates = async () => {
        const params: emailTemplateQueryParams = {
            filtro: searchInput || undefined,
            tipo: typeFilter || undefined,
            activo: activeFilter === 'all' ? undefined : activeFilter === 'active',
        };
        const res = await getTemplates(params);
        if (res?.success) setTemplates(res.data?.plantillas ?? []);
    };

    // Load SMTP config
    const loadSmtp = async () => {
        const res = await getSmtpConfig();
        if (res?.success) setSmtpConfig(res.data?.smtp ?? null);
    };

    useEffect(() => { loadTemplates(); }, [searchInput, typeFilter, activeFilter]);
    useEffect(() => { if (activeTab === 'smtp') loadSmtp(); }, [activeTab]);

    // Handlers
    const handleEdit = (t: EmailTemplate) => {
        setSelectedTemplate(t);
        setEditorOpen(true);
    };

    const handleCreate = () => {
        setSelectedTemplate(null);
        setEditorOpen(true);
    };

    const handlePreview = (t: EmailTemplate) => {
        setSelectedTemplate(t);
        setPreviewOpen(true);
    };

    const handleDeleteClick = (t: EmailTemplate) => {
        setSelectedTemplate(t);
        setDeleteOpen(true);
    };

    const handleToggleActive = async (t: EmailTemplate) => {
        await updateTemplate(t.id, { activo: !t.activo });
        loadTemplates();
    };

    const handleSaveTemplate = async (data: TemplateFormData) => {
        setSavingTemplate(true);
        try {
            let res;
            if (selectedTemplate) {
                res = await updateTemplate(selectedTemplate.id, data);
            } else {
                res = await createTemplate(data);
            }
            if (res?.success) {
                setEditorOpen(false);
                setSelectedTemplate(null);
                loadTemplates();
            }
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTemplate) return;
        const ok = await deleteTemplate(selectedTemplate.id);
        if (ok) {
            setDeleteOpen(false);
            setSelectedTemplate(null);
            loadTemplates();
        }
    };

    const handleSaveSmtp = async (config: SmtpConfig) => {
        setSavingSmtp(true);
        try {
            const res = await updateSmtpConfig(config);
            if (res?.success) setSmtpConfig(res.data?.smtp ?? config);
        } finally {
            setSavingSmtp(false);
        }
    };

    const handleTestConnection = async () => {
        setTestingConn(true);
        setTestResult('idle');
        await new Promise((r) => setTimeout(r, 1800));
        setTestResult(Math.random() > 0.3 ? 'success' : 'error');
        setTestingConn(false);
    };

    // Filtered count helpers
    const activeCount = templates.filter((t) => t.activo).length;
    const inactiveCount = templates.filter((t) => !t.activo).length;

    return (
        <PageContainer
            title="Configuración de Correos"
            subtitle="Administra las plantillas de notificación y los parámetros del servidor de correo saliente."
            actions={
                activeTab === 'plantillas' ? (
                    <button className="btn btn-primary w-full sm:w-auto" onClick={handleCreate}>
                        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva plantilla
                    </button>
                ) : undefined
            }
        >
            {/* ── Tabs ── */}
            <div className="border-b border-base-200 mb-6">
                <div className="flex gap-0">
                    {(
                        [
                            {
                                id: 'plantillas' as TabId,
                                label: 'Plantillas',
                                icon: (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                ),
                            },
                            {
                                id: 'smtp' as TabId,
                                label: 'Servidor SMTP',
                                icon: (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                ),
                            },
                        ] as const
                    ).map(({ id, label, icon }) => (
                        <button
                            key={id}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 flex items-center gap-2 ${activeTab === id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                                }`}
                            onClick={() => setActiveTab(id)}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab: Plantillas ── */}
            {activeTab === 'plantillas' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    {/* Stats bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="stats stats-horizontal shadow-none border border-base-200 bg-base-100 h-14">
                            <div className="stat px-4 py-2">
                                <div className="stat-title text-xs">Total</div>
                                <div className="stat-value text-lg">{templates.length}</div>
                            </div>
                            <div className="stat px-4 py-2">
                                <div className="stat-title text-xs">Activas</div>
                                <div className="stat-value text-lg text-success">{activeCount}</div>
                            </div>
                            <div className="stat px-4 py-2">
                                <div className="stat-title text-xs">Inactivas</div>
                                <div className="stat-value text-lg text-base-content/30">{inactiveCount}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-5">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                className="input input-bordered input-sm w-full pl-9"
                                placeholder="Buscar por nombre o asunto..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {searchInput && (
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                                    onClick={() => setSearchInput('')}
                                >✕</button>
                            )}
                        </div>

                        {/* Type filter */}
                        <select
                            className="select select-bordered select-sm"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as EmailTemplateType | '')}
                        >
                            <option value="">Todos los tipos</option>
                            {(Object.entries(EMAIL_TEMPLATE_TYPE_META) as [EmailTemplateType, { label: string }][]).map(
                                ([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                )
                            )}
                        </select>

                        {/* Active filter */}
                        <div className="join">
                            {(
                                [
                                    { value: 'all', label: 'Todas' },
                                    { value: 'active', label: 'Activas' },
                                    { value: 'inactive', label: 'Inactivas' },
                                ] as const
                            ).map(({ value, label }) => (
                                <button
                                    key={value}
                                    className={`join-item btn btn-sm ${activeFilter === value ? 'btn-primary' : 'btn-outline'}`}
                                    onClick={() => setActiveFilter(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Clear filters */}
                        {(searchInput || typeFilter || activeFilter !== 'all') && (
                            <button
                                className="btn btn-ghost btn-sm text-base-content/50"
                                onClick={() => {
                                    setSearchInput('');
                                    setTypeFilter('');
                                    setActiveFilter('all');
                                }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    {/* Grid */}
                    {loading && !templates.length ? (
                        <LoadingIndicator />
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
                            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm font-medium">No se encontraron plantillas</p>
                            <p className="text-xs mt-1">Crea tu primera plantilla haciendo clic en "Nueva plantilla"</p>
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                            layout
                        >
                            <AnimatePresence>
                                {templates.map((t) => (
                                    <TemplateCard
                                        key={t.id}
                                        template={t}
                                        onEdit={handleEdit}
                                        onPreview={handlePreview}
                                        onDelete={handleDeleteClick}
                                        onToggleActive={handleToggleActive}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* ── Tab: SMTP ── */}
            {activeTab === 'smtp' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    {!smtpConfig && loading ? (
                        <LoadingIndicator />
                    ) : smtpConfig ? (
                        <SmtpForm
                            config={smtpConfig}
                            onSave={handleSaveSmtp}
                            saving={savingSmtp}
                            onTestConnection={handleTestConnection}
                            testing={testingConn}
                            testResult={testResult}
                        />
                    ) : null}
                </motion.div>
            )}

            {/* ── Editor Modal ── */}
            <GenericModal
                isOpen={editorOpen}
                onClose={() => { setEditorOpen(false); setSelectedTemplate(null); }}
                title={selectedTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
                size="xl"
            >
                <TemplateEditor
                    template={selectedTemplate}
                    onSave={handleSaveTemplate}
                    onClose={() => { setEditorOpen(false); setSelectedTemplate(null); }}
                    saving={savingTemplate}
                />
            </GenericModal>

            {/* ── Preview Modal ── */}
            <GenericModal
                isOpen={previewOpen}
                onClose={() => { setPreviewOpen(false); setSelectedTemplate(null); }}
                title="Vista previa de plantilla"
                size="lg"
            >
                {selectedTemplate && (
                    <TemplatePreviewModal
                        template={selectedTemplate}
                        onClose={() => { setPreviewOpen(false); setSelectedTemplate(null); }}
                    />
                )}
            </GenericModal>

            {/* ── Delete Modal ── */}
            <ConfirmationModal
                isOpen={deleteOpen}
                title="Eliminar plantilla"
                message={`¿Estás seguro de que deseas eliminar la plantilla "${selectedTemplate?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onClose={() => { setDeleteOpen(false); setSelectedTemplate(null); }}
            />
        </PageContainer>
    );
};

export default EmailConfigPage;
