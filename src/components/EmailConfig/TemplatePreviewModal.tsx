import React from 'react';
import { EmailTemplate, EMAIL_TEMPLATE_TYPE_META, TEMPLATE_PREVIEW_VARS } from '../../services/emailService';

const interpolate = (text: string, vars: Record<string, string>): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

const interpolateHtml = (html: string, vars: Record<string, string>): string =>
    html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = vars[key];
        return value
            ? `<mark class="bg-amber-100 text-amber-800 px-0.5 rounded text-xs font-medium">${value}</mark>`
            : `<span class="text-red-500">{{${key}}}</span>`;
    });

const formatDate = (iso?: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

interface TemplatePreviewModalProps {
    template: EmailTemplate;
    onClose: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({ template, onClose }) => {
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
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
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
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: interpolateHtml(template.cuerpo || '', TEMPLATE_PREVIEW_VARS),
                            }}
                        />
                    </div>
                </div>
                <p className="text-xs text-base-content/40 mt-2 text-center">
                    Las variables se reemplazan con valores de ejemplo y se resaltan en amarillo
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

export default TemplatePreviewModal;
