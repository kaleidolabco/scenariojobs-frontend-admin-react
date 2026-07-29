import React from 'react';
import { EmailTemplate, EMAIL_TEMPLATE_TYPE_META, TEMPLATE_PREVIEW_VARS } from '../../services/emailService';
import { Mail } from '../Common/Icon';
import Button from '../Common/Button';

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
                            <Mail size={16} className="text-primary" />
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
                <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};

export default TemplatePreviewModal;
