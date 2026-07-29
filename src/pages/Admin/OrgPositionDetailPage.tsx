import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { usePositionService, Position } from '../../services/positionService';
import { useJobService, Job } from '../../services/jobService';
import { usePersonService } from '../../services/personService';
import PositionForm from '../../components/Positions/PositionForm';
import Avatar from '../../components/Common/Avatar';
import { ROUTES } from '../../constants/routes';
import AutocompleteField from '../../components/Common/Forms/AutocompleteField';
import InputField from '../../components/Common/Forms/InputField';
import useUIStore from '../../store/uiStore';
import Button from '../../components/Common/Button';
import { Pencil, Trash2, UserPlus, AlertTriangle, Info } from '../../components/Common/Icon';

const OrgPositionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { openAlert } = useUIStore();
    const { getPositionById, updatePosition, deletePosition, assignPerson, unassignPerson, loading } = usePositionService();
    const { getJobById } = useJobService();
    const { getPeople } = usePersonService();

    const [position, setPosition] = useState<Position | null>(null);
    const [job, setJob] = useState<Job | null>(null);

    // Modals
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [unassignModalOpen, setUnassignModalOpen] = useState(false);

    // Collaborator assignment state
    const [personSearchQuery, setPersonSearchQuery] = useState('');
    const [personOptions, setPersonOptions] = useState<any[]>([]);
    const [isSearchingPerson, setIsSearchingPerson] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

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

            // Load job details with competencies and functions
            if (pos.cargo_id) {
                const jobResponse = await getJobById(pos.cargo_id);
                if (jobResponse && jobResponse.success) {
                    setJob(jobResponse.data);
                }
            }
        }
    };

    // Debounce Person Search Query
    useEffect(() => {
        if (personSearchQuery.trim().length === 0) {
            setPersonOptions([]);
            return;
        }

        if (selectedPerson && personSearchQuery === selectedPerson.name) {
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingPerson(true);
            const response = await getPeople({ search: personSearchQuery, items_por_pagina: 10 });
            if (response && response.success) {
                const peopleList = response.data.datos || [];
                const newOptions = peopleList.map((p: any) => ({
                    id: p.id,
                    name: `${p.nombres} ${p.apellidos}`,
                    detail: p.email_personal || p.departamento || 'Sin departamento'
                }));
                setPersonOptions(newOptions);
            }
            setIsSearchingPerson(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [personSearchQuery, selectedPerson]);

    const handleUpdate = async (data: Omit<Position, 'id' | 'estado'>) => {
        if (!position) return;
        const response = await updatePosition(position.id, data);
        if (response && response.success) {
            setEditModalOpen(false);
            openAlert('Puesto actualizado exitosamente', 'success');
            loadPositionData();
        }
    };

    const handleDelete = async () => {
        if (!position) return;
        const success = await deletePosition(position.id);
        if (success) {
            openAlert('Puesto eliminado exitosamente', 'success');
            navigate(ROUTES.ORG_UNIT_DETAIL(position.unidad_id));
        }
    };

    const handleAssignPerson = async () => {
        if (!position || !selectedPerson) return;

        const response = await assignPerson(position.id, selectedPerson.id, startDate);

        if (response && response.success) {
            setAssignModalOpen(false);
            setSelectedPerson(null);
            setPersonSearchQuery('');
            openAlert('Persona asignada exitosamente al puesto', 'success');
            loadPositionData();
        }
    };

    const handleUnassignPerson = async () => {
        if (!position) return;

        const response = await unassignPerson(position.id);

        if (response && response.success) {
            setUnassignModalOpen(false);
            openAlert('Persona desasignada exitosamente (puesto vacante)', 'success');
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
                    <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setEditModalOpen(true)}>
                        Editar
                    </Button>
                    <Button variant="error" size="sm" leftIcon={Trash2} onClick={() => setDeleteModalOpen(true)}>
                        Eliminar
                    </Button>
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
                                    <Button variant="primary" size="sm" leftIcon={UserPlus} onClick={() => setAssignModalOpen(true)}>
                                        Asignar Persona
                                    </Button>
                                )}
                            </div>

                            {isVacant ? (
                                <div className="alert alert-warning mt-4">
                                    <AlertTriangle className="stroke-current shrink-0 h-6 w-6" />
                                    <span>Este puesto está vacante</span>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 p-4 bg-base-200 rounded-lg">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar
                                            name={position.persona_nombre || 'Persona'}
                                            size="lg"
                                            src={position.colaborador_foto}
                                            placeholderClass="bg-primary text-primary-content"
                                        />
                                        <div>
                                            <h4 className="font-semibold text-lg">{position.persona_nombre}</h4>
                                            <p className="text-sm text-base-content/70">Asignado al puesto</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                        <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(true)} className="flex-1 md:flex-initial">
                                            Cambiar Asignación
                                        </Button>
                                        <Button variant="error" outline size="sm" onClick={() => setUnassignModalOpen(true)} className="flex-1 md:flex-initial">
                                            Vaciar Puesto
                                        </Button>
                                    </div>
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

                            {job && job.competencias_requeridas && job.competencias_requeridas.length > 0 ? (
                                <div className="space-y-2">
                                    {job.competencias_requeridas.map((comp, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-base-200 rounded">
                                            <span className="text-sm font-medium">{comp.competencia_nombre}</span>
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

                            {job && job.funciones && job.funciones.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    {job.funciones.map((func: any, idx: number) => (
                                        <li key={idx} className="text-base-content/80">
                                            {typeof func === 'string' ? func : (func.titulo || func.description)}
                                        </li>
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
                message={`¿Está seguro de eliminar el puesto "${position.nombre}"? ${!isVacant ? 'La persona asignada quedará sin puesto.' : ''}`}
                confirmText="Eliminar"
                variant="danger"
            />

            {/* Unassign Confirmation Modal */}
            <ConfirmationModal
                isOpen={unassignModalOpen}
                onClose={() => setUnassignModalOpen(false)}
                onConfirm={handleUnassignPerson}
                title="Vaciar Puesto (Desasignar Persona)"
                message={`¿Está seguro de que desea desasignar a ${position.persona_nombre} de este puesto? El puesto quedará VACANTE.`}
                confirmText="Desasignar"
                variant="warning"
            />

            {/* Autocomplete-based Assignment Modal */}
            <GenericModal
                isOpen={assignModalOpen}
                onClose={() => {
                    setAssignModalOpen(false);
                    setSelectedPerson(null);
                    setPersonSearchQuery('');
                }}
                title="Asignar Persona al Puesto"
                size="md"
            >
                <div className="space-y-4">
                    <div className="alert alert-info text-sm">
                        <Info className="stroke-current shrink-0 w-6 h-6" />
                        <span>Busque un colaborador de la empresa para asignarlo a este puesto de trabajo.</span>
                    </div>

                    <AutocompleteField
                        label="Colaborador"
                        placeholder="Buscar por nombres, apellidos o correo..."
                        searchQuery={personSearchQuery}
                        onSearchQueryChange={setPersonSearchQuery}
                        options={personOptions}
                        onSelect={(opt) => {
                            setSelectedPerson(opt);
                            setPersonSearchQuery(opt.name);
                        }}
                        onClear={() => {
                            setSelectedPerson(null);
                            setPersonSearchQuery('');
                        }}
                        selectedItem={selectedPerson}
                        isLoading={isSearchingPerson}
                        required
                        helpText="Seleccione el colaborador que ocupará la vacante"
                    />

                    <InputField
                        label="Fecha de Inicio"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        helpText="Fecha en formato ISO de inicio de la labor"
                    />

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => {
                            setAssignModalOpen(false);
                            setSelectedPerson(null);
                            setPersonSearchQuery('');
                        }}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleAssignPerson} disabled={!selectedPerson || !startDate}>
                            Asignar
                        </Button>
                    </div>
                </div>
            </GenericModal>
        </PageContainer>
    );
};

export default OrgPositionDetailPage;
