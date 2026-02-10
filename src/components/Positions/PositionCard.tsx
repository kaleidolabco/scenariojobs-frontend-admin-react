import React from 'react';
import { Position } from '../../services/positionService';

interface PositionCardProps {
    position: Position;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    showActions?: boolean;
}

const PositionCard: React.FC<PositionCardProps> = ({
    position,
    onClick,
    onEdit,
    onDelete,
    showActions = true
}) => {
    const isVacant = position.estado === 'VACANTE';

    return (
        <div
            className={`card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:border-primary' : ''}`}
            onClick={onClick}
        >
            <div className="card-body p-4">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                        <h3 className="font-semibold text-base">{position.nombre}</h3>
                        <p className="text-sm text-base-content/70 mt-1">
                            {position.cargo_nombre || 'Sin cargo asignado'}
                        </p>
                    </div>
                    <div className={`badge ${isVacant ? 'badge-warning' : 'badge-success'} badge-sm`}>
                        {position.estado}
                    </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-base-content/60">
                    {position.persona_nombre ? (
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{position.persona_nombre}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Puesto vacante</span>
                        </div>
                    )}

                    {position.jefe_puesto_nombre && (
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Reporta a: {position.jefe_puesto_nombre}</span>
                        </div>
                    )}
                </div>

                {showActions && (onEdit || onDelete) && (
                    <div className="card-actions justify-end mt-3 pt-3 border-t border-base-200">
                        {onEdit && (
                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="btn btn-ghost btn-xs text-error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PositionCard;
