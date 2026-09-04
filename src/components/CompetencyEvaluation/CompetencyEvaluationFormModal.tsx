import React, { useState } from 'react';
import GenericModal from '../Common/GenericModal';
import Button from '../Common/Button';
import FormSection from '../Common/Forms/FormSection';
import InputField from '../Common/Forms/InputField';
import TextAreaField from '../Common/Forms/TextAreaField';
import SelectField from '../Common/Forms/SelectField';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyEvaluationSummary,
    CompetencyEvaluationStatus,
} from '../../services/competencyEvaluationService';

// ─── Form Values ──────────────────────────────────────────────────────────────

interface CompetencyEvaluationFormValues {
    nombre: string;
    descripcion: string;
    estado: CompetencyEvaluationStatus;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface CompetencyEvaluationFormProps {
    evaluation?: CompetencyEvaluationSummary;
    onSubmit: (data: CompetencyEvaluationFormValues) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

const CompetencyEvaluationForm: React.FC<CompetencyEvaluationFormProps> = ({
    evaluation,
    onSubmit,
    isLoading = false,
    onCancel,
}) => {
    const [formData, setFormData] = useState<CompetencyEvaluationFormValues>({
        nombre: evaluation?.nombre ?? '',
        descripcion: evaluation?.descripcion ?? '',
        estado: evaluation?.estado ?? 'BORRADOR',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: keyof CompetencyEvaluationFormValues, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (formData.nombre.length > 255) newErrors.nombre = 'El nombre no puede exceder 255 caracteres';
        if (formData.descripcion.length > 1000) newErrors.descripcion = 'La descripción no puede exceder 1000 caracteres';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="Información General" description="Datos básicos del proceso de evaluación">
                <div className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Nombre del Proceso"
                            name="nombre"
                            value={formData.nombre}
                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                            placeholder="Ej: Evaluación de Competencias – Líderes 2025"
                            required
                            error={errors.nombre}
                            maxLength={255}
                        />

                        <SelectField
                            label="Estado"
                            name="estado"
                            value={formData.estado}
                            onChange={(e) =>
                                handleInputChange('estado', e.target.value as CompetencyEvaluationStatus)
                            }
                            options={[
                                { value: 'BORRADOR', label: 'Borrador' },
                                { value: 'PUBLICADO', label: 'Publicado' },
                                { value: 'ARCHIVADO', label: 'Archivado' },
                            ]}
                        />
                    </div>

                    <TextAreaField
                        label="Descripción"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => handleInputChange('descripcion', e.target.value)}
                        placeholder="Descripción detallada del proceso evaluativo..."
                        rows={3}
                        maxLength={1000}
                        error={errors.descripcion}
                        helpText={`${formData.descripcion.length}/1000`}
                    />

                </div>
            </FormSection>

            <div className="flex gap-3 justify-end pt-4">
                <Button variant="ghost" disabled={isLoading} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={isLoading} loading={isLoading}>
                    {isLoading ? 'Guardando...' : evaluation ? 'Actualizar' : 'Crear Proceso'}
                </Button>
            </div>
        </form>
    );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface CompetencyEvaluationFormModalProps {
    isOpen: boolean;
    evaluation?: CompetencyEvaluationSummary | null;
    onClose: () => void;
    onSaved: () => void;
}

const CompetencyEvaluationFormModal: React.FC<CompetencyEvaluationFormModalProps> = ({
    isOpen,
    evaluation,
    onClose,
    onSaved,
}) => {
    const { openAlert } = useUIStore();
    const { createCompetencyEvaluation, updateCompetencyEvaluation } = useCompetencyEvaluationService();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: CompetencyEvaluationFormValues) => {
        setLoading(true);
        try {
            const response = evaluation
                ? await updateCompetencyEvaluation(evaluation.id, data)
                : await createCompetencyEvaluation(data);

            if (response?.success) {
                openAlert(
                    evaluation
                        ? `"${data.nombre}" actualizado correctamente.`
                        : `Proceso "${data.nombre}" creado correctamente.`,
                    'success'
                );
                onSaved();
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title={evaluation ? 'Editar Proceso' : 'Crear Nuevo Proceso'}
            size="lg"
        >
            <CompetencyEvaluationForm
                evaluation={evaluation ?? undefined}
                onSubmit={handleSubmit}
                isLoading={loading}
                onCancel={onClose}
            />
        </GenericModal>
    );
};

export default CompetencyEvaluationFormModal;