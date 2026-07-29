import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingIndicator from './LoadingIndicator';
import Button from './Button';
import { Mail, Check, Info, Eye, X } from '../Common/Icon';
import { useEmailService, EmailTemplate } from '../../services/emailService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailConfigData {
    templates_asociadas: string[]; // IDs of associated email templates
}

interface EmailConfigTabProps {
    evaluationId: string;
    evaluationType: 'competencia' | 'desempeno' | 'integral'; // Tipo de evaluación
    data: EmailConfigData;
    onChange: (data: EmailConfigData) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso?: string): string => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EmailConfigTab: React.FC<EmailConfigTabProps> = ({
    /* evaluationId,
    evaluationType, */
    data,
    onChange,
}) => {
    const { getTemplates, getSmtpConfig } = useEmailService();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [smtpConfigured, setSmtpConfigured] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Load templates and SMTP config on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Obtener plantillas activas
                const templatesRes = await getTemplates({ activo: true });
                if (templatesRes?.success) {
                    setTemplates(templatesRes.data?.plantillas || []);
                }

                // Verificar si SMTP está configurado
                const smtpRes = await getSmtpConfig();
                setSmtpConfigured(!!(smtpRes?.success && !!smtpRes.data?.smtp));
            } catch (error) {
                console.error('Error loading email config:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleToggleTemplate = (templateId: string) => {
        const updated = data.templates_asociadas.includes(templateId)
            ? data.templates_asociadas.filter((id) => id !== templateId)
            : [...data.templates_asociadas, templateId];

        onChange({ ...data, templates_asociadas: updated });
    };

    if (loading) return <LoadingIndicator />;

    // Check if SMTP is not configured
    if (!smtpConfigured) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
            >
                <div className="alert alert-warning max-w-2xl">
                    <Info size={16} />
                    <span>
                        La configuración SMTP no está disponible. Contacta al administrador para configurar el servidor de correos.
                    </span>
                </div>
            </motion.div>
        );
    }

    // No templates available
    if (templates.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
            >
                <div className="alert alert-info max-w-2xl">
                    <Mail size={16} />
                    <span>
                        No hay plantillas de correo disponibles. Contacta al administrador para crear plantillas.
                    </span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-base-content mb-2">
                    Configuración de Correos Electrónicos
                </h3>
                <p className="text-sm text-base-content/60">
                    Selecciona las plantillas de correo que deseas utilizar para esta evaluación. Se enviarán
                    automáticamente a los participantes en los momentos configurados.
                </p>
            </div>

            {/* Info box */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-3">
                <Info size={16} />
                <div className="text-sm text-primary">
                    <p className="font-medium mb-1">Plantillas disponibles</p>
                    <p className="text-xs opacity-90">
                        {data.templates_asociadas.length} de {templates.length} plantilla{templates.length !== 1 ? 's' : ''} seleccionada{data.templates_asociadas.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                    {templates.map((template) => {
                        const isSelected = data.templates_asociadas.includes(template.id);
                        return (
                            <motion.div
                                key={template.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleToggleTemplate(template.id)}
                                    className={`w-full text-left transition-all duration-200 rounded-lg border-2 p-4 ${
                                        isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-base-200 bg-base-50 hover:border-base-300 hover:bg-base-100'
                                    }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <Mail size={16} />
                                                <h4 className="font-semibold text-base-content truncate">
                                                    {template.nombre}
                                                </h4>
                                            </div>
                                            {template.descripcion && (
                                                <p className="text-xs text-base-content/60 mt-1">
                                                    {template.descripcion}
                                                </p>
                                            )}
                                        </div>

                                        {/* Checkbox */}
                                        <div
                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                isSelected
                                                    ? 'bg-primary border-primary'
                                                    : 'border-base-300'
                                            }`}
                                        >
                                            {isSelected && <Check size={14} />}
                                        </div>
                                    </div>

                                    {/* Subject preview */}
                                    <div className="bg-base-200/50 rounded px-2 py-1.5 mt-2 mb-2">
                                        <p className="text-xs text-base-content/50 font-medium">Asunto:</p>
                                        <p className="text-xs text-base-content/80 truncate font-mono">
                                            {template.asunto}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between text-xs text-base-content/40 mt-2 pt-2 border-t border-base-200/50">
                                        <span>Actualizado {formatDate(template.actualizado_en)}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTemplate(template);
                                                setShowPreview(true);
                                            }}
                                            className="text-primary hover:text-primary-focus flex items-center gap-1"
                                            title="Ver vista previa"
                                        >
                                            <Eye size={16} />
                                            <span>Vista previa</span>
                                        </button>
                                    </div>
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && selectedTemplate && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-base-100 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-base-100 border-b border-base-200 px-6 py-4 flex items-center justify-between">
                                <h3 className="font-semibold text-base-content">
                                    {selectedTemplate.nombre}
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    shape="circle"
                                    onClick={() => setShowPreview(false)}
                                    aria-label="Cerrar"
                                >
                                    <X size={16} />
                                </Button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Subject */}
                                <div>
                                    <p className="text-xs font-medium text-base-content/60 mb-1">Asunto</p>
                                    <div className="bg-base-200/60 rounded px-3 py-2 font-mono text-sm">
                                        {selectedTemplate.asunto}
                                    </div>
                                </div>

                                {/* Body */}
                                <div>
                                    <p className="text-xs font-medium text-base-content/60 mb-1">Cuerpo del correo</p>
                                    <div className="bg-base-200/30 border border-base-200 rounded px-4 py-3">
                                        <pre className="text-sm text-base-content/80 whitespace-pre-wrap font-sans leading-relaxed">
                                            {selectedTemplate.cuerpo}
                                        </pre>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="text-xs text-base-content/40 flex items-center gap-4 pt-2 border-t border-base-200">
                                    <span>Tipo: {selectedTemplate.tipo}</span>
                                    <span>Creado: {formatDate(selectedTemplate.creado_en)}</span>
                                </div>
                            </div>

                            <div className="border-t border-base-200 px-6 py-3 flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowPreview(false)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default EmailConfigTab;
