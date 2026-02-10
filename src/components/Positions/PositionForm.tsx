import React, { useState, useEffect } from 'react';
import { Position } from '../../services/positionService';
import { Job, useJobService } from '../../services/jobService';
import InputField from '../Common/Forms/InputField';
import SelectField from '../Common/Forms/SelectField';
import FormSection from '../Common/Forms/FormSection';

interface PositionFormProps {
    initialData?: Position | null;
    unitId?: string; // Pre-filled if creating from unit detail
    unitName?: string;
    availablePositions?: Position[]; // For boss selection
    isLoading: boolean;
    onSubmit: (data: Omit<Position, 'id' | 'estado'>) => void;
    onCancel: () => void;
}

const PositionForm: React.FC<PositionFormProps> = ({
    initialData,
    unitId,
    unitName,
    availablePositions = [],
    isLoading,
    onSubmit,
    onCancel
}) => {
    const { getJobs } = useJobService();
    const [nombre, setNombre] = useState('');
    const [cargoId, setCargoId] = useState('');
    const [jefePuestoId, setJefePuestoId] = useState<string>('');
    const [jobs, setJobs] = useState<Job[]>([]);

    useEffect(() => {
        loadJobs();
    }, []);

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre);
            setCargoId(initialData.cargo_id);
            setJefePuestoId(initialData.jefe_puesto_id || '');
        } else {
            setNombre('');
            setCargoId('');
            setJefePuestoId('');
        }
    }, [initialData]);

    const loadJobs = async () => {
        const response = await getJobs();
        if (response && response.success) {
            setJobs(response.data.cargos);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedJob = jobs.find(j => j.id === cargoId);
        const selectedBoss = availablePositions.find(p => p.id === jefePuestoId);

        onSubmit({
            nombre,
            unidad_id: unitId || initialData?.unidad_id || '',
            unidad_nombre: unitName || initialData?.unidad_nombre,
            cargo_id: cargoId,
            cargo_nombre: selectedJob?.nombre,
            jefe_puesto_id: jefePuestoId || null,
            jefe_puesto_nombre: selectedBoss?.nombre,
            persona_id: initialData?.persona_id || null,
            persona_nombre: initialData?.persona_nombre
        });
    };

    const jobOptions = jobs.map(job => ({
        value: job.id,
        label: `${job.nombre} (${job.nivel_jerarquico})`
    }));

    const bossOptions = [
        { value: '', label: 'Sin jefe directo (Posición de liderazgo)' },
        ...availablePositions
            .filter(p => p.id !== initialData?.id) // Exclude self
            .map(p => ({
                value: p.id,
                label: `${p.nombre} - ${p.cargo_nombre || 'Sin cargo'}`
            }))
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {unitName && (
                <div className="alert alert-info shadow-sm text-sm py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Creando puesto en: <strong>{unitName}</strong></span>
                </div>
            )}

            <FormSection
                title="Información del Puesto"
                description="Defina el puesto dentro de la estructura organizacional."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <InputField
                        label="Nombre del Puesto"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Desarrollador Senior A"
                        required
                        helpText="Identificador único del puesto en la unidad"
                    />

                    <SelectField
                        label="Cargo (Perfil Funcional)"
                        value={cargoId}
                        onChange={(e) => setCargoId(e.target.value)}
                        options={jobOptions}
                        required
                        helpText="Perfil que define competencias y funciones"
                    />
                </div>

                <div className="mt-4 md:mt-6">
                    <SelectField
                        label="Jefe Directo (Puesto Supervisor)"
                        value={jefePuestoId}
                        onChange={(e) => setJefePuestoId(e.target.value)}
                        options={bossOptions}
                        helpText="Puesto al que reporta directamente"
                    />
                </div>
            </FormSection>

            {/* Actions */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 md:relative md:border-t-0 md:p-0 md:pt-4">
                <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
                    <button
                        type="button"
                        className="btn btn-ghost hover:bg-base-200 mt-2 md:mt-0 order-2 md:order-1"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary w-full md:w-auto order-1 md:order-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span className="ml-2">Procesando...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{initialData ? 'Guardar Cambios' : 'Crear Puesto'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PositionForm;
