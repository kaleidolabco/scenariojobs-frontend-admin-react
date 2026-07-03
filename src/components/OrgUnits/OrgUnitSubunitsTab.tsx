import React, { useState } from 'react';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import GenericModal from '../Common/GenericModal';
import LoadingIndicator from '../Common/LoadingIndicator';
import OrgUnitForm from './OrgUnitForm';
import OrgUnitNode from './OrgUnitNode';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

interface OrgUnitSubunitsTabProps {
    unit: OrgUnit;
    onUnitUpdated: () => void;
}

const OrgUnitSubunitsTab: React.FC<OrgUnitSubunitsTabProps> = ({ unit, onUnitUpdated }) => {
    const navigate = useNavigate();
    const { createUnit, loading: unitLoading } = useOrgUnitService();
    const [addSubunitModalOpen, setAddSubunitModalOpen] = useState(false);

    const handleAddSubunit = async (data: any) => {
        const payload = { ...data, padre_id: unit.id };
        const response = await createUnit(payload);
        if (response) {
            setAddSubunitModalOpen(false);
            onUnitUpdated();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-4 mt-6">
                <button className="btn btn-primary shrink-0 w-full sm:w-auto" onClick={() => setAddSubunitModalOpen(true)}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir Sub-unidad
                </button>
            </div>
            
            <div className="bg-base-100/50 p-6 rounded-xl border border-base-200 min-h-[150px] overflow-auto">
                {unitLoading && !unit.subunidades?.length ? (
                    <LoadingIndicator />
                ) : (
                    <>
                        {unit.subunidades && unit.subunidades.length === 0 ? (
                            <div className="text-center py-6 opacity-60">
                                <p>No hay sub-unidades definidas.</p>
                                <button className="btn btn-link" onClick={() => setAddSubunitModalOpen(true)}>Añadir primera sub-unidad</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {unit.subunidades?.map(node => (
                                    <OrgUnitNode
                                        key={node.id}
                                        unit={node}
                                        onEdit={() => {}}
                                        onAddChild={() => {}}
                                        onDelete={() => {}}
                                        onViewDetails={() => navigate(ROUTES.ORG_UNIT_DETAIL(node.id))}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <GenericModal
                isOpen={addSubunitModalOpen}
                onClose={() => setAddSubunitModalOpen(false)}
                title={`Crear Sub-unidad en ${unit.nombre}`}
                size="lg"
            >
                <OrgUnitForm
                    parentUnit={unit}
                    isLoading={unitLoading}
                    onSubmit={handleAddSubunit}
                    onCancel={() => setAddSubunitModalOpen(false)}
                    initialData={null}
                />
            </GenericModal>
        </div>
    );
};

export default OrgUnitSubunitsTab;
