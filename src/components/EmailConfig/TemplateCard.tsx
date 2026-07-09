import React from 'react';
import { motion } from 'framer-motion';
import { EmailTemplate, EMAIL_TEMPLATE_TYPE_META } from '../../services/emailService';

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

export default TemplateCard;
