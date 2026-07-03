import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import GenericModal from '../Common/GenericModal';
import ConfirmationModal from '../Common/ConfirmationModal';
import OrgUnitForm from './OrgUnitForm';
import { ROUTES } from '../../constants/routes';

interface OrgUnitInfoTabProps {
    unit: OrgUnit;
    onUnitUpdated: () => void;
}

const OrgUnitInfoTab: React.FC<OrgUnitInfoTabProps> = ({ unit, onUnitUpdated }) => {
    const navigate = useNavigate();
    const { updateUnit, deleteUnit, loading: unitLoading } = useOrgUnitService();
    const [editUnitModalOpen, setEditUnitModalOpen] = useState(false);
    const [deleteUnitModalOpen, setDeleteUnitModalOpen] = useState(false);

    const handleUpdateUnit = async (data: any) => {
        const response = await updateUnit(unit.id, data);
        if (response) {
            setEditUnitModalOpen(false);
            onUnitUpdated();
        }
    };

    const handleDeleteUnit = async () => {
        const success = await deleteUnit(unit.id);
        if (success) {
            navigate(ROUTES.ORG_CHART);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditUnitModalOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Editar Unidad
                </button>
                <button className="btn btn-error btn-sm" onClick={() => setDeleteUnitModalOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Eliminar Unidad
                </button>
            </div>

            <div className="card bg-base-100 shadow mt-6">
                <div className="card-body">
                    <h3 className="card-title">Detalles de la Unidad</h3>
                    <p><strong>Nombre:</strong> {unit.nombre}</p>
                    <p><strong>Descripción:</strong> {unit.descripcion || 'N/A'}</p>
                    <p><strong>Tipo:</strong> {unit.tipo || 'N/A'}</p>
                </div>
            </div>

            {/* Edit Unit Modal */}
            <GenericModal
                isOpen={editUnitModalOpen}
                onClose={() => setEditUnitModalOpen(false)}
                title="Editar Unidad Organizacional"
                size="lg"
            >
                <OrgUnitForm
                    initialData={unit}
                    isLoading={unitLoading}
                    onSubmit={handleUpdateUnit}
                    onCancel={() => setEditUnitModalOpen(false)}
                />
            </GenericModal>

            {/* Delete Unit Confirmation */}
            <ConfirmationModal
                isOpen={deleteUnitModalOpen}
                onClose={() => setDeleteUnitModalOpen(false)}
                onConfirm={handleDeleteUnit}
                title="Eliminar Unidad Organizacional"
                message={unit.subnodos && unit.subnodos.length > 0
                    ? `⚠️ Esta unidad tiene ${unit.subnodos.length} sub-unidades. No se puede eliminar hasta que mueva o elimine sus dependientes.`
                    : `¿Está seguro de eliminar la unidad "${unit.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default OrgUnitInfoTab;
