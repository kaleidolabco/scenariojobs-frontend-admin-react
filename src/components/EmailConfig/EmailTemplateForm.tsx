import React, { useRef, useState } from 'react';
import { EmailTemplate, EmailTemplateType, EMAIL_TEMPLATE_TYPE_META, TEMPLATE_PREVIEW_VARS } from '../../services/emailService';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import SelectField from '../Common/Forms/SelectField';
import FormSection from '../Common/Forms/FormSection';

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

const interpolate = (text: string, vars: Record<string, string>): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

const interpolateHtml = (html: string, vars: Record<string, string>): string =>
    html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = vars[key];
        return value
            ? `<mark class="bg-amber-100 text-amber-800 px-0.5 rounded text-xs font-medium">${value}</mark>`
            : `<span class="text-red-500">{{${key}}}</span>`;
    });

interface EmailTemplateFormProps {
    template: EmailTemplate | null;
    onSave: (data: TemplateFormData) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({ template, onSave, onClose, saving }) => {
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

    const templateTypeOptions = (Object.entries(EMAIL_TEMPLATE_TYPE_META) as [EmailTemplateType, { label: string }][]).map(
        ([key, { label }]) => ({ value: key, label })
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column: ALL form fields */}
                <div className="flex flex-col gap-6">
                    <FormSection title="Información Básica" description="Define los datos generales de la plantilla">
                        <div className="grid grid-cols-1 gap-4">
                            <InputField
                                label="Nombre de la plantilla"
                                required
                                value={form.nombre}
                                placeholder="Ej. Recordatorio semanal"
                                onChange={(e) => set('nombre', e.target.value)}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField
                                    label="Tipo de plantilla"
                                    value={form.tipo}
                                    onChange={(e) => set('tipo', e.target.value as EmailTemplateType)}
                                    options={templateTypeOptions}
                                />
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-medium">Estado de activación</span>
                                    </label>
                                    <div className="flex items-center gap-3 h-10 mt-1">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-success toggle-sm"
                                            checked={form.activo}
                                            onChange={(e) => set('activo', e.target.checked)}
                                        />
                                        <span className="text-sm text-base-content/70 font-medium">
                                            {form.activo ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <InputField
                                label="Descripción interna"
                                value={form.descripcion}
                                placeholder="¿Cuándo se envía esta plantilla?"
                                onChange={(e) => set('descripcion', e.target.value)}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Contenido del Correo" description="Escribe el cuerpo del mensaje utilizando las variables disponibles">
                        <div className="flex flex-col gap-4">
                            <InputField
                                label="Línea de asunto"
                                required
                                value={form.asunto}
                                placeholder="Ej. Tienes una nueva evaluación: {{nombre_evaluacion}}"
                                onChange={(e) => set('asunto', e.target.value)}
                            />
                            <TextAreaField
                                label="Cuerpo del correo"
                                required
                                ref={bodyRef}
                                value={form.cuerpo}
                                onChange={(e) => set('cuerpo', e.target.value)}
                                placeholder="Escribe el cuerpo del correo aquí..."
                                rows={8}
                                className="font-mono text-sm"
                            />
                            
                            {/* Variables helper */}
                            <div className="bg-base-200/40 p-3 rounded-lg border border-base-200">
                                <p className="text-xs text-base-content/60 mb-2 font-semibold flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Variables disponibles — clic para insertar
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {TEMPLATE_VARIABLES.map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            className="badge badge-outline badge-sm cursor-pointer hover:badge-primary transition-colors font-mono text-xs px-2 py-3"
                                            onClick={() => insertVariable(v)}
                                            title={`Valor de ejemplo: ${TEMPLATE_PREVIEW_VARS[v]}`}
                                        >
                                            {`{{${v}}}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Right column: LIVE PREVIEW ONLY */}
                <div className="flex flex-col gap-2 sticky top-4 h-fit">
                    <div className="flex items-center justify-between mb-2">
                        <label className="label-text font-semibold text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Vista previa en tiempo real
                        </label>
                    </div>

                    <div className="bg-base-200/50 rounded-xl p-4 min-h-[400px] overflow-y-auto border border-base-300">
                        <div className="bg-base-100 rounded-lg border border-base-200 overflow-hidden shadow-sm">
                            <div className="bg-base-200/80 px-4 py-3 border-b border-base-200">
                                <p className="text-xs text-base-content/50 mb-0.5">Asunto</p>
                                <p className="text-sm font-semibold">
                                    {interpolate(form.asunto || '(sin asunto)', TEMPLATE_PREVIEW_VARS)}
                                </p>
                            </div>
                            <div className="px-4 py-4">
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: interpolateHtml(form.cuerpo || '<p class="text-base-content/40 italic">(sin contenido)</p>', TEMPLATE_PREVIEW_VARS),
                                    }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-base-content/40 mt-4 text-center italic">
                            Las variables se reemplazan automáticamente con valores de ejemplo
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-base-200">
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

export default EmailTemplateForm;
