import React from 'react';
import { motion } from 'framer-motion';
import { EmailTemplate, EMAIL_TEMPLATE_TYPE_META } from '../../services/emailService';
import Button from '../Common/Button';
import { CheckCircle, XCircle, Eye, Pencil, Trash2 } from '../Common/Icon';

interface TemplateCardProps {
    template: EmailTemplate;
    onEdit: (t: EmailTemplate) => void;
    onPreview: (t: EmailTemplate) => void;
    onDelete: (t: EmailTemplate) => void;
    onToggleActive: (t: EmailTemplate) => void;
}

const formatDate = (iso?: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

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
                        <CheckCircle size={20} className="swap-on text-success" />
                        {/* Inactive icon */}
                        <XCircle size={20} className="swap-off text-base-300" />
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
                        <Button variant="ghost" size="xs" onClick={() => onPreview(template)} title="Vista previa">
                            <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => onEdit(template)} title="Editar">
                            <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="xs" className="text-error/70 hover:text-error" onClick={() => onDelete(template)} title="Eliminar">
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TemplateCard;
