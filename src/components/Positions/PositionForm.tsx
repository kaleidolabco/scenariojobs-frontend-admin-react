import React, { useState, useEffect } from 'react';
import { Position, usePositionService } from '../../services/positionService';
import { Job, useJobService } from '../../services/jobService';
import InputField from '../Common/Forms/InputField';
import FormSection from '../Common/Forms/FormSection';
import AutocompleteField from '../Common/Forms/AutocompleteField';
import Button from '../Common/Button';
import { Info, Check } from '../Common/Icon';

interface PositionFormProps {
    initialData?: Position | null;
    unitId?: string; // Pre-filled if creating from unit detail
    unitName?: string;
    // availablePositions?: Position[]; // No longer needed as we will fetch dynamically
    isLoading: boolean;
    onSubmit: (data: Omit<Position, 'id' | 'estado'>) => void;
    onCancel: () => void;
}

const PositionForm: React.FC<PositionFormProps> = ({
    initialData,
    unitId,
    unitName,
    // availablePositions = [],
    isLoading,
    onSubmit,
    onCancel
}) => {
    const { getJobs } = useJobService();
    const { getPositions } = usePositionService(); // To fetch positions for boss selection

    const [nombre, setNombre] = useState('');
    const [cargoId, setCargoId] = useState('');
    const [jefePuestoId, setJefePuestoId] = useState<string>('');

    // Autocomplete Cargo
    const [cargoSearchQuery, setCargoSearchQuery] = useState('');
    const [cargoOptions, setCargoOptions] = useState<any[]>([]);
    const [isSearchingCargo, setIsSearchingCargo] = useState(false);
    const [selectedCargoOption, setSelectedCargoOption] = useState<any | null>(null);

    // Autocomplete Jefe Directo
    const [bossSearchQuery, setBossSearchQuery] = useState('');
    const [bossOptions, setBossOptions] = useState<any[]>([]);
    const [isSearchingBoss, setIsSearchingBoss] = useState(false);
    const [selectedBossOption, setSelectedBossOption] = useState<any | null>(null);

    useEffect(() => {
        // No need to load all jobs at once, AutocompleteField will fetch dynamically
        // loadJobs();
    }, []);

    useEffect(() => {
        if (initialData) {
            setNombre(initialData.nombre);
            setCargoId(initialData.cargo_id);
            setJefePuestoId(initialData.jefe_puesto_id || '');
            if (initialData.cargo_id && initialData.cargo_nombre) {
                setSelectedCargoOption({
                    id: initialData.cargo_id,
                    name: initialData.cargo_nombre
                });
                setCargoSearchQuery(initialData.cargo_nombre);
            }
            if (initialData.jefe_puesto_id && initialData.jefe_puesto_nombre) {
                setSelectedBossOption({
                    id: initialData.jefe_puesto_id,
                    name: initialData.jefe_puesto_nombre,
                    detail: initialData.cargo_nombre // Display cargo name of boss for context
                });
                setBossSearchQuery(initialData.jefe_puesto_nombre);
            }
        } else {
            setNombre('');
            setCargoId('');
            setJefePuestoId('');
            setSelectedCargoOption(null);
            setCargoSearchQuery('');
            setSelectedBossOption(null);
            setBossSearchQuery('');
        }
    }, [initialData]);

    // Debounce Cargo Search Query
    useEffect(() => {
        if (cargoSearchQuery.trim().length === 0) {
            setCargoOptions([]);
            return;
        }

        // If the query is exactly the same as selected cargo, skip fetch to avoid endless loop/flicker
        if (selectedCargoOption && cargoSearchQuery === selectedCargoOption.name) {
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingCargo(true);
            const response = await getJobs({ filtro: cargoSearchQuery, items_por_pagina: 10 });
            if (response && response.success) {
                const cargosList: Job[] = response.data.cargos || [];
                const newOptions = cargosList.map(j => ({
                    id: j.id,
                    name: j.nombre,
                    detail: j.nivel_jerarquico
                }));
                setCargoOptions(newOptions);
            }
            setIsSearchingCargo(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [cargoSearchQuery, selectedCargoOption]);

    // Debounce Boss Search Query
    useEffect(() => {
        if (bossSearchQuery.trim().length === 0) {
            setBossOptions([]);
            return;
        }

        if (selectedBossOption && bossSearchQuery === selectedBossOption.name) {
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingBoss(true);
            // Fetch positions that can be bosses
            const response = await getPositions({ filtro: bossSearchQuery, items_por_pagina: 10 });
            if (response && response.success) {
                // Filter out the current position to avoid self-referencing hierarchy loops
                const filteredPositions = (response.data.puestos || []).filter((p: Position) => p.id !== initialData?.id);
                const newOptions = filteredPositions.map((p: Position) => ({
                    id: p.id,
                    name: p.nombre,
                    detail: p.cargo_nombre ? `${p.cargo_nombre} (${p.unidad_nombre})` : p.unidad_nombre
                }));
                setBossOptions(newOptions);
            }
            setIsSearchingBoss(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [bossSearchQuery, selectedBossOption, initialData?.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedJobName = selectedCargoOption ? selectedCargoOption.name : '';
        const selectedBossName = selectedBossOption ? selectedBossOption.name : '';

        onSubmit({
            nombre,
            unidad_id: unitId || initialData?.unidad_id || '',
            unidad_nombre: unitName || initialData?.unidad_nombre,
            cargo_id: cargoId,
            cargo_nombre: selectedJobName,
            jefe_puesto_id: jefePuestoId || null,
            jefe_puesto_nombre: selectedBossName || null,
            colaborador_id: initialData?.colaborador_id || null,
            colaborador_nombre: initialData?.colaborador_nombre || undefined,
            colaborador_foto: initialData?.colaborador_foto || undefined
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {unitName && (
                <div className="alert alert-info shadow-sm text-sm py-2">
                    <Info className="stroke-current shrink-0 w-6 h-6" />
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

                    <AutocompleteField
                        label="Cargo (Perfil Funcional)"
                        placeholder="Buscar cargo por nombre..."
                        searchQuery={cargoSearchQuery}
                        onSearchQueryChange={setCargoSearchQuery}
                        options={cargoOptions}
                        onSelect={(opt) => {
                            setCargoId(opt.id);
                            setSelectedCargoOption(opt);
                            setCargoSearchQuery(opt.name);
                        }}
                        onClear={() => {
                            setCargoId('');
                            setSelectedCargoOption(null);
                            setCargoSearchQuery('');
                        }}
                        selectedItem={selectedCargoOption}
                        isLoading={isSearchingCargo}
                        required
                        helpText="Perfil que define competencias y funciones"
                    />
                </div>

                <div className="mt-4 md:mt-6">
                    <AutocompleteField
                        label="Jefe Directo (Puesto Supervisor)"
                        placeholder="Buscar puesto de jefe..."
                        searchQuery={bossSearchQuery}
                        onSearchQueryChange={setBossSearchQuery}
                        options={bossOptions}
                        onSelect={(opt) => {
                            setJefePuestoId(opt.id);
                            setSelectedBossOption(opt);
                            setBossSearchQuery(opt.name);
                        }}
                        onClear={() => {
                            setJefePuestoId('');
                            setSelectedBossOption(null);
                            setBossSearchQuery('');
                        }}
                        selectedItem={selectedBossOption}
                        isLoading={isSearchingBoss}
                        helpText="Puesto al que reporta directamente. Puede ser vacío para posiciones de alto liderazgo."
                    />
                </div>
            </FormSection>

            {/* Actions */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 md:relative md:border-t-0 md:p-0 md:pt-4">
                <div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="mt-2 md:mt-0 order-2 md:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                        leftIcon={isLoading ? undefined : Check}
                        className="w-full md:w-auto order-1 md:order-2"
                        disabled={isLoading || !cargoId || !nombre.trim()}
                    >
                        {isLoading ? 'Procesando...' : (initialData ? 'Guardar Cambios' : 'Crear Puesto')}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default PositionForm;
