import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import GenericModal from '../Common/GenericModal';
import ConfirmationModal from '../Common/ConfirmationModal';
import OrgUnitForm from './OrgUnitForm';
import { ROUTES } from '../../constants/routes';
import Button from '../Common/Button';
import { Pencil, Trash2 } from '../Common/Icon';

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
                <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setEditUnitModalOpen(true)}>
                    Editar Unidad
                </Button>
                <Button variant="error" size="sm" leftIcon={Trash2} onClick={() => setDeleteUnitModalOpen(true)}>
                    Eliminar Unidad
                </Button>
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
                message={unit.subunidades && unit.subunidades.length > 0
                    ? `⚠️ Esta unidad tiene ${unit.subunidades.length} sub-unidades. No se puede eliminar hasta que mueva o elimine sus dependientes.`
                    : `¿Está seguro de eliminar la unidad "${unit.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default OrgUnitInfoTab;
