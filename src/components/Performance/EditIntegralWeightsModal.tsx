import React, { useState, useEffect } from 'react';
import { AlertTriangle } from '../Common/Icon';
import { motion } from 'framer-motion';
import NumberInputField from '../Common/Forms/NumberInputField';
import FormSection from '../Common/Forms/FormSection';
import Button from '../Common/Button';
import { IntegralComponente } from '../../services/integralEvaluationService';

interface EditIntegralWeightsModalProps {
    componente_desempeno?: IntegralComponente;
    componente_competencias?: IntegralComponente;
    onSave: (pesoDesempeno: number, pesoCompetencias: number) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const EditIntegralWeightsModal: React.FC<EditIntegralWeightsModalProps> = ({
    componente_desempeno,
    componente_competencias,
    onSave,
    onCancel,
    isLoading = false,
}) => {
    const [pesoDesempeno, setPesoDesempeno] = useState(componente_desempeno?.peso ?? 50);
    const [pesoCompetencias, setPesoCompetencias] = useState(componente_competencias?.peso ?? 50);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validation effect
    useEffect(() => {
        const newErrors: Record<string, string> = {};
        const totalWeight = pesoDesempeno + pesoCompetencias;

        if (totalWeight !== 100) {
            newErrors.pesos = `Los pesos deben sumar 100% (actualmente ${totalWeight}%)`;
        }

        setErrors(newErrors);
    }, [pesoDesempeno, pesoCompetencias]);

    const handleWeightChange = (component: 'desempeno' | 'competencias', value: number) => {
        const newValue = Math.max(0, Math.min(100, value));

        if (component === 'desempeno') {
            setPesoDesempeno(newValue);
            // Auto-adjust the other if both components exist
            if (componente_competencias) {
                setPesoCompetencias(100 - newValue);
            }
        } else {
            setPesoCompetencias(newValue);
            // Auto-adjust the other if both components exist
            if (componente_desempeno) {
                setPesoDesempeno(100 - newValue);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (Object.keys(errors).length > 0) {
            return;
        }

        await onSave(pesoDesempeno, pesoCompetencias);
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <FormSection title="Editar Ponderación" description="Ajusta los pesos de cada componente">
                <div className="space-y-4">
                    {componente_desempeno && (
                        <div>
                            <NumberInputField
                                label="Peso de Desempeño (%)"
                                required
                                min={0}
                                max={100}
                                value={pesoDesempeno.toString()}
                                onChange={(value) => handleWeightChange('desempeno', value)}
                                disabled={isLoading}
                                helpText="Porcentaje asignado a la evaluación de desempeño"
                            />
                        </div>
                    )}

                    {componente_competencias && (
                        <div>
                            <NumberInputField
                                label="Peso de Competencias (%)"
                                required
                                min={0}
                                max={100}
                                value={pesoCompetencias.toString()}
                                onChange={(value) => handleWeightChange('competencias', value)}
                                disabled={isLoading}
                                helpText="Porcentaje asignado a la evaluación de competencias"
                            />
                        </div>
                    )}

                    {/* Weight indicator */}
                    {componente_desempeno && componente_competencias && (
                        <motion.div
                            className={`p-3 rounded-lg border-2 ${
                                pesoDesempeno + pesoCompetencias === 100
                                    ? 'border-success bg-success/5'
                                    : 'border-warning bg-warning/5'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <span>Ponderación total:</span>
                                <span
                                    className={
                                        pesoDesempeno + pesoCompetencias === 100 ? 'text-success' : 'text-warning'
                                    }
                                >
                                    {pesoDesempeno + pesoCompetencias}%
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {errors.pesos && (
                        <motion.div
                            className="alert alert-warning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <AlertTriangle size={24} className="shrink-0 stroke-current" />
                            <span>{errors.pesos}</span>
                        </motion.div>
                    )}
                </div>
            </FormSection>

            {/* Actions */}
            <motion.div className="flex gap-3 pt-4" layout>
                <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isLoading || Object.keys(errors).length > 0}
                    loading={isLoading}
                >
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancelar
                </Button>
            </motion.div>
        </motion.form>
    );
};

export default EditIntegralWeightsModal;
