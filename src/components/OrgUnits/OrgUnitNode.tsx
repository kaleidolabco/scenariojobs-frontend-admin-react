import React, { useState } from 'react';
import { OrgUnit } from '../../services/orgUnitService';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Pencil, Plus, Trash2, Building2, Briefcase } from '../Common/Icon';
import Button from '../Common/Button';
import { Minus } from '../Common/Icon';

interface OrgUnitNodeProps {
    unit: OrgUnit;
    level?: number;
    onEdit: (unit: OrgUnit) => void;
    onAddChild: (parent: OrgUnit) => void;
    onDelete: (unit: OrgUnit) => void;
    onViewDetails?: (unit: OrgUnit) => void; // New: Navigate to detail page
}

const OrgUnitNode: React.FC<OrgUnitNodeProps> = ({ unit, level = 0, onEdit, onAddChild, onDelete, onViewDetails }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = unit.subunidades && unit.subunidades.length > 0;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    // Color/Style logic based on Type or Level
    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'DIVISION': return 'badge-primary';
            case 'AREA': return 'badge-secondary';
            case 'DEPARTAMENTO': return 'badge-accent';
            default: return 'badge-ghost';
        }
    };

    return (
        <div className="flex flex-col relative">
            {/* Connection Line Vertical (Top) - Only if not root */}
            {/* {level > 0 && (
                <div className="absolute top-0 left-10 -mt-4 h-4 w-px bg-base-300"></div>
            )} */}

            <div className="flex items-center group mb-4 relative">
                {/* Expander / Dot */}
                <div className="mr-2 z-10">
                    {hasChildren ? (
                        <Button
                            onClick={toggleExpand}
                            shape="circle"
                            size="xs"
                            variant="outline"
                            className="bg-base-100 border-base-300 hover:bg-base-200"
                        >
                            {isExpanded ?
                                <Minus size={12} />
                                :
                                <Plus size={12} />
                            }
                        </Button>
                    ) : (
                        <div className="w-6 h-6 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-base-300"></div>
                        </div>
                    )}
                </div>

                {/* Card */}
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card compact bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-all min-w-[300px] max-w-lg"
                >
                    <div className="card-body p-3 gap-2">
                        <div className="flex items-start gap-3">
                            {/* Icon based on Type */}
                            <div className={`p-2 rounded-lg bg-base-200/50 text-base-content/70 shrink-0`}>
                                <Building2 size={20} />
                            </div>

                            <div className="grow min-w-0">
                                <h3 className="font-bold text-base-content leading-tight">{unit.nombre}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`badge badge-xs ${getTypeBadgeClass(unit.tipo)}`}>{unit.tipo}</span>

                                    {/* Position Count Badge */}
                                    {unit.total_puestos !== undefined && (
                                        <span className="badge badge-xs badge-outline gap-1">
                                            <Briefcase size={12} />
                                            {unit.total_puestos} {unit.total_puestos === 1 ? 'puesto' : 'puestos'}
                                        </span>
                                    )}

                                    {/* Sub-units Count */}
                                    {unit.subunidades && unit.subunidades.length > 0 && (
                                        <span className="text-xs text-base-content/50">
                                            {unit.subunidades.length} sub-unidad{unit.subunidades.length !== 1 ? 'es' : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Description Preview */}
                                {unit.descripcion && (
                                    <p className="text-xs text-base-content/60 mt-1 line-clamp-1">{unit.descripcion}</p>
                                )}
                            </div>

                            {/* Actions (Visible on Hover or always on mobile) */}
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                {onViewDetails && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        shape="square"
                                        className="tooltip text-info"
                                        data-tip="Ver Detalles"
                                        onClick={() => onViewDetails(unit)}
                                        leftIcon={Eye}
                                    />
                                )}
                                <Button variant="ghost" size="xs" shape="square" className="tooltip" data-tip="Editar" onClick={() => onEdit(unit)} leftIcon={Pencil} />
                                <Button variant="ghost" size="xs" shape="square" className="tooltip text-primary" data-tip="Agregar Sub-unidad" onClick={() => onAddChild(unit)} leftIcon={Plus} />
                                <Button variant="ghost" size="xs" shape="square" className="tooltip text-error" data-tip="Eliminar" onClick={() => onDelete(unit)} leftIcon={Trash2} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Children Container */}
            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-8 ml-3 border-l border-base-300 relative mb-2"
                    >
                        {unit.subunidades!.map((child) => (
                            <OrgUnitNode
                                key={child.id}
                                unit={child}
                                level={level + 1}
                                onEdit={onEdit}
                                onAddChild={onAddChild}
                                onDelete={onDelete}
                                onViewDetails={onViewDetails}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrgUnitNode;
