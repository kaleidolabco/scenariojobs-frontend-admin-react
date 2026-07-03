import React, { useState } from 'react';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import GenericModal from '../Common/GenericModal';
import ConfirmationModal from '../Common/ConfirmationModal';
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
    const { createUnit, updateUnit, deleteUnit, loading: unitLoading } = useOrgUnitService();
    
    // Modals for Create/Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false); // True = Edit, False = Create
    const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null); // For Edit
    const [parentForNewUnit, setParentForNewUnit] = useState<OrgUnit | null>(null); // For Create Child

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<OrgUnit | null>(null);

    // --- Actions ---

    // 1. Open Create Modal (Child of root of this tab, i.e., current detail unit)
    const handleAddRoot = () => {
        setEditMode(false);
        setSelectedUnit(null);
        setParentForNewUnit(unit);
        setModalOpen(true);
    };

    // 2. Open Create Modal (Child of a subunit)
    const handleAddChild = (parent: OrgUnit) => {
        setEditMode(false);
        setSelectedUnit(null);
        setParentForNewUnit(parent);
        setModalOpen(true);
    };

    // 3. Open Edit Modal for a subunit
    const handleEdit = (subUnit: OrgUnit) => {
        setEditMode(true);
        setSelectedUnit(subUnit);
        setParentForNewUnit(null);
        setModalOpen(true);
    };

    // 4. Open Delete Modal for a subunit
    const handleDeleteClick = (subUnit: OrgUnit) => {
        setUnitToDelete(subUnit);
        setDeleteModalOpen(true);
    };

    // 5. Navigate to Unit Detail
    const handleViewDetails = (subUnit: OrgUnit) => {
        navigate(ROUTES.ORG_UNIT_DETAIL(subUnit.id));
    };

    // --- Submits ---

    const handleFormSubmit = async (formData: any) => {
        let success = false;

        if (editMode && selectedUnit) {
            // Update
            const res = await updateUnit(selectedUnit.id, formData);
            if (res) success = true;
        } else {
            // Create
            const payload = { ...formData, padre_id: parentForNewUnit ? parentForNewUnit.id : null };
            const res = await createUnit(payload);
            if (res) success = true;
        }

        if (success) {
            setModalOpen(false);
            onUnitUpdated();
        }
    };

    const handleConfirmDelete = async () => {
        if (unitToDelete) {
            const success = await deleteUnit(unitToDelete.id);
            if (success) {
                setDeleteModalOpen(false);
                setUnitToDelete(null);
                onUnitUpdated();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-4 mt-6">
                <button className="btn btn-primary shrink-0 w-full sm:w-auto" onClick={handleAddRoot}>
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
                                <button className="btn btn-link" onClick={handleAddRoot}>Añadir primera sub-unidad</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {unit.subunidades?.map(node => (
                                    <OrgUnitNode
                                        key={node.id}
                                        unit={node}
                                        onEdit={handleEdit}
                                        onAddChild={handleAddChild}
                                        onDelete={handleDeleteClick}
                                        onViewDetails={handleViewDetails}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create/Edit Modal */}
            <GenericModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editMode ? 'Editar Unidad' : (parentForNewUnit ? `Nueva Sub-unidad en ${parentForNewUnit.nombre}` : 'Nueva Unidad Principal')}
                size="lg"
            >
                <OrgUnitForm
                    initialData={selectedUnit}
                    parentUnit={parentForNewUnit}
                    isLoading={unitLoading}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModalOpen(false)}
                />
            </GenericModal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Unidad"
                message={unitToDelete?.subunidades && unitToDelete.subunidades.length > 0
                    ? `⚠️ Esta unidad tiene ${unitToDelete.subunidades.length} sub-unidades. No se puede eliminar hasta que mueva o elimine sus dependientes.`
                    : `¿Está seguro de eliminar "${unitToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
};

export default OrgUnitSubunitsTab;
