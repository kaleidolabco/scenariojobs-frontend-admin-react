/*
* Planear la opción de usar una librería para la visualización de gráficos en árbol
* https://bkrem.github.io/react-d3-tree/
* https://reactflow.dev/examples
*/

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import OrgUnitNode from '../../components/OrgUnits/OrgUnitNode';
import OrgUnitForm from '../../components/OrgUnits/OrgUnitForm';
import { ROUTES } from '../../constants/routes';

const OrgChartPage: React.FC = () => {
    const navigate = useNavigate();
    const { getOrgTree, createUnit, updateUnit, deleteUnit, loading } = useOrgUnitService();

    // State
    const [treeData, setTreeData] = useState<OrgUnit[]>([]);

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false); // True = Edit, False = Create
    const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null); // For Edit
    const [parentForNewUnit, setParentForNewUnit] = useState<OrgUnit | null>(null); // For Create Child

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<OrgUnit | null>(null);

    // Initial Load
    useEffect(() => {
        loadTree();
    }, []);

    const loadTree = async () => {
        const response = await getOrgTree();
        if (response && response.success) {
            setTreeData(response.data.unidades);
        }
    };

    // --- Actions ---

    // 1. Open Create Modal (Root)
    const handleAddRoot = () => {
        setEditMode(false);
        setSelectedUnit(null);
        setParentForNewUnit(null);
        setModalOpen(true);
    };

    // 2. Open Create Modal (Child)
    const handleAddChild = (parent: OrgUnit) => {
        setEditMode(false);
        setSelectedUnit(null);
        setParentForNewUnit(parent);
        setModalOpen(true);
    };

    // 3. Open Edit Modal
    const handleEdit = (unit: OrgUnit) => {
        setEditMode(true);
        setSelectedUnit(unit);
        setParentForNewUnit(null); // Not relevant for edit
        setModalOpen(true);
    };

    // 4. Open Delete Modal
    const handleDeleteClick = (unit: OrgUnit) => {
        setUnitToDelete(unit);
        setDeleteModalOpen(true);
    };

    // 5. Navigate to Unit Detail
    const handleViewDetails = (unit: OrgUnit) => {
        navigate(ROUTES.ORG_UNIT_DETAIL(unit.id));
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
            // If parentForNewUnit exists, we need to add the parent_id to formData (handled in Form, but double check)
            const payload = { ...formData, padre_id: parentForNewUnit ? parentForNewUnit.id : null };
            const res = await createUnit(payload);
            if (res) success = true;
        }

        if (success) {
            setModalOpen(false);
            loadTree(); // Refresh tree (Optimized update would be better for UX, but this ensures sync)
        }
    };

    const handleConfirmDelete = async () => {
        if (unitToDelete) {
            const success = await deleteUnit(unitToDelete.id);
            if (success) {
                setDeleteModalOpen(false);
                setUnitToDelete(null);
                loadTree();
            }
        }
    };

    return (
        <PageContainer
            title="Estructura Organizacional"
            subtitle="Visualice y gestione la jerarquía completa de la empresa. Haga clic en una unidad para ver sus detalles y puestos."
            actions={
                <button className="btn btn-primary w-full sm:w-auto" onClick={handleAddRoot}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Nueva Unidad Raíz
                </button>
            }
        >
            <div className="bg-base-100/50 p-6 rounded-xl border border-base-200 min-h-[200px] overflow-auto">
                {loading && !treeData.length ? (
                    <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg"></span></div>
                ) : (
                    <>
                        {treeData.length === 0 ? (
                            <div className="text-center py-10 opacity-60">
                                <p>No hay estructura definida.</p>
                                <button className="btn btn-link" onClick={handleAddRoot}>Crear la primera unidad</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {treeData.map(node => (
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
                title={editMode ? 'Editar Unidad' : (parentForNewUnit ? 'Nueva Sub-unidad' : 'Nueva Unidad Principal')}
                size="lg"
            >
                <OrgUnitForm
                    initialData={selectedUnit}
                    parentUnit={parentForNewUnit}
                    isLoading={loading}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setModalOpen(false)}
                />
            </GenericModal>

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Unidad"
                message={unitToDelete?.subnodos && unitToDelete.subnodos.length > 0
                    ? `⚠️ Esta unidad tiene ${unitToDelete.subnodos.length} sub-unidades. No se puede eliminar hasta que mueva o elimine sus dependientes.`
                    : `¿Está seguro de eliminar "${unitToDelete?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
            // Disable confirm if has children (Simple validation logic)
            // In a real app we might allow recursive delete with specific UI warning
            />
        </PageContainer>
    );
};

export default OrgChartPage;
