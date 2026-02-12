import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { usePositionService, Position } from '../../services/positionService';
import { useJobService, Job } from '../../services/jobService';
import PositionForm from '../../components/Positions/PositionForm';
import Avatar from '../../components/Common/Avatar';
import { ROUTES } from '../../constants/routes';

const OrgPositionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getPositionById, updatePosition, deletePosition, assignPerson, loading } = usePositionService();
    const { getJobs } = useJobService();

    const [position, setPosition] = useState<Position | null>(null);
    const [job, setJob] = useState<Job | null>(null);

    // Modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [personName, setPersonName] = useState('');

    useEffect(() => {
        if (id) {
            loadPositionData();
        }
    }, [id]);

    const loadPositionData = async () => {
        if (!id) return;
        const response = await getPositionById(id);
        if (response && response.success) {
            const pos = response.data.puesto;
            setPosition(pos);

            // Load job details
            if (pos.cargo_id) {
                const jobsResponse = await getJobs();
                if (jobsResponse && jobsResponse.success) {
                    const foundJob = jobsResponse.data.cargos.find((j: Job) => j.id === pos.cargo_id);
                    if (foundJob) setJob(foundJob);
                }
            }
        }
    };

    const handleUpdate = async (data: Omit<Position, 'id' | 'estado'>) => {
        if (!position) return;
        const response = await updatePosition(position.id, data);
        if (response) {
            setEditModalOpen(false);
            loadPositionData();
        }
    };

    const handleDelete = async () => {
        if (!position) return;
        const success = await deletePosition(position.id);
        if (success) {
            navigate(ROUTES.ORG_UNIT_DETAIL(position.unidad_id));
        }
    };

    const handleAssignPerson = async () => {
        if (!position || !personName.trim()) return;

        // Mock person ID (in real app, would select from directory)
        const mockPersonId = 'per_' + Math.random().toString(36).substr(2, 9);
        const response = await assignPerson(position.id, mockPersonId, new Date().toISOString());

        if (response) {
            setAssignModalOpen(false);
            setPersonName('');
            loadPositionData();
        }
    };

    if (!position) {
        return (
            <PageContainer title="Cargando..." subtitle="">
                <LoadingIndicator />
            </PageContainer>
        );
    }

    const isVacant = position.estado === 'VACANTE';

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Organigrama', to: ROUTES.ORG_CHART },
        {
            label: position?.unidad_nombre || 'Unidad',
            to: position ? ROUTES.ORG_UNIT_DETAIL(position.unidad_id) : undefined
        },
        { label: position?.nombre || 'Cargando...', to: undefined }
    ];

    return (
        <PageContainer
            title={position.nombre}
            subtitle={`Puesto en ${position.unidad_nombre || 'Unidad desconocida'}`}
            breadcrumbs={breadcrumbs}
            actions={
                <div className="flex gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModalOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => setDeleteModalOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Card */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Position Info */}
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h3 className="card-title">Información del Puesto</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-semibold text-base-content/70">Cargo (Perfil)</span>
                                    <p className="text-base">{position.cargo_nombre || 'Sin asignar'}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-base-content/70">Estado</span>
                                    <div className="mt-1">
                                        <div className={`badge ${isVacant ? 'badge-warning' : 'badge-success'}`}>
                                            {position.estado}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-base-content/70">Unidad</span>
                                    <p className="text-base">{position.unidad_nombre}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-base-content/70">Jefe Directo</span>
                                    <p className="text-base">{position.jefe_puesto_nombre || 'Sin jefe asignado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Card */}
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <div className="flex justify-between items-center">
                                <h3 className="card-title">Asignación de Persona</h3>
                                {isVacant && (
                                    <button className="btn btn-primary btn-sm" onClick={() => setAssignModalOpen(true)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Asignar Persona
                                    </button>
                                )}
                            </div>

                            {isVacant ? (
                                <div className="alert alert-warning mt-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Este puesto está vacante</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 mt-4 p-4 bg-base-200 rounded-lg">
                                    <Avatar
                                        name={position.persona_nombre}
                                        size="lg"
                                        placeholderClass="bg-primary text-primary-content"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg">{position.persona_nombre}</h4>
                                        <p className="text-sm text-base-content/70">Asignado al puesto</p>
                                    </div>
                                    <button className="btn btn-outline btn-sm">
                                        Cambiar Asignación
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Competencies */}
                <div className="space-y-6">
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h3 className="card-title text-base">Competencias Requeridas</h3>
                            <p className="text-sm text-base-content/70 mb-3">Heredadas del cargo</p>

                            {job && job.competencias_requeridas.length > 0 ? (
                                <div className="space-y-2">
                                    {job.competencias_requeridas.map((comp, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-base-200 rounded">
                                            <span className="text-sm">{comp.competencia_nombre}</span>
                                            <div className="badge badge-primary badge-sm">
                                                Nivel {comp.nivel_esperado}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-base-content/50">Sin competencias definidas</p>
                            )}
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h3 className="card-title text-base">Funciones</h3>
                            <p className="text-sm text-base-content/70 mb-3">Heredadas del cargo</p>

                            {job && job.funciones.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {job.funciones.map((func, idx) => (
                                        <li key={idx} className="text-base-content/80">{func}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-base-content/50">Sin funciones definidas</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <GenericModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Editar Puesto"
                size="lg"
            >
                <PositionForm
                    initialData={position}
                    isLoading={loading}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditModalOpen(false)}
                />
            </GenericModal>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Puesto"
                message={`¿Está seguro de eliminar el puesto "${position.nombre}" ? ${!isVacant ? 'La persona asignada quedará sin puesto.' : ''} `}
                confirmText="Eliminar"
                variant="danger"
            />

            {/* Simple Assignment Modal (will be replaced with PersonAssignmentModal) */}
            <GenericModal
                isOpen={assignModalOpen}
                onClose={() => {
                    setAssignModalOpen(false);
                    setPersonName('');
                }}
                title="Asignar Persona al Puesto"
                size="md"
            >
                <div className="space-y-4">
                    <div className="alert alert-info text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Versión simplificada. En el futuro se integrará con el Directorio de Personal.</span>
                    </div>

                    <div className="form-control flex flex-col">
                        <label className="label">
                            <span className="label-text font-medium">Nombre de la Persona</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Juan Pérez"
                            className="input input-bordered"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setAssignModalOpen(false);
                                setPersonName('');
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleAssignPerson}
                            disabled={!personName.trim()}
                        >
                            Asignar
                        </button>
                    </div>
                </div>
            </GenericModal>
        </PageContainer>
    );
};

export default OrgPositionDetailPage;
