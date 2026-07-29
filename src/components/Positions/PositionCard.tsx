import React from 'react';
import { Position } from '../../services/positionService';
import Button from '../Common/Button';
import { Pencil, Trash2, User, AlertTriangle, TrendingUp } from '../Common/Icon';

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
                            <User size={16} />
                            <span>{position.persona_nombre}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-warning">
                            <AlertTriangle size={16} />
                            <span>Puesto vacante</span>
                        </div>
                    )}

                    {position.jefe_puesto_nombre && (
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} />
                            <span>Reporta a: {position.jefe_puesto_nombre}</span>
                        </div>
                    )}
                </div>

                {showActions && (onEdit || onDelete) && (
                    <div className="card-actions justify-end mt-3 pt-3 border-t border-base-200">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="xs"
                                leftIcon={Pencil}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                            >
                                Editar
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="xs"
                                leftIcon={Trash2}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="text-error"
                            >
                                Eliminar
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PositionCard;
