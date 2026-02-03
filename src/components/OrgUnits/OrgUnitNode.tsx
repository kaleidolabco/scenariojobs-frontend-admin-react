import React, { useState } from 'react';
import { OrgUnit } from '../../services/orgUnitService';
import { motion, AnimatePresence } from 'framer-motion';

interface OrgUnitNodeProps {
    unit: OrgUnit;
    level?: number;
    onEdit: (unit: OrgUnit) => void;
    onAddChild: (parent: OrgUnit) => void;
    onDelete: (unit: OrgUnit) => void;
}

const OrgUnitNode: React.FC<OrgUnitNodeProps> = ({ unit, level = 0, onEdit, onAddChild, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = unit.subnodos && unit.subnodos.length > 0;

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
                        <button
                            onClick={toggleExpand}
                            className="btn btn-circle btn-xs btn-outline bg-base-100 border-base-300 hover:bg-base-200"
                        >
                            {isExpanded ?
                                // Icono de contracción
                                <svg xmlns="http://www.w3.org/2000/svg" className='h-3 w-3' viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14z" /></svg>
                                :
                                // Icono de expansión
                                <svg xmlns="http://www.w3.org/2000/svg" className='h-3 w-3' viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg>
                            }
                        </button>
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
                    <div className="card-body flex-row items-center p-3 gap-3">
                        {/* Icon based on Type */}
                        <div className={`p-2 rounded-lg bg-base-200/50 text-base-content/70`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>

                        <div className="grow">
                            <h3 className="font-bold text-base-content leading-tight">{unit.nombre}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`badge badge-xs ${getTypeBadgeClass(unit.tipo)}`}>{unit.tipo}</span>
                                {unit.subnodos && unit.subnodos.length > 0 && (
                                    <span className="text-xs text-base-content/50">{unit.subnodos.length} sub-unidades</span>
                                )}
                            </div>
                        </div>

                        {/* Actions (Visible on Hover or always on mobile) */}
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button className="btn btn-square btn-ghost btn-xs tooltip" data-tip="Editar" onClick={() => onEdit(unit)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button className="btn btn-square btn-ghost btn-xs text-primary tooltip" data-tip="Agregar Sub-unidad" onClick={() => onAddChild(unit)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button className="btn btn-square btn-ghost btn-xs text-error tooltip" data-tip="Eliminar" onClick={() => onDelete(unit)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
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
                        {unit.subnodos!.map((child) => (
                            <OrgUnitNode
                                key={child.id}
                                unit={child}
                                level={level + 1}
                                onEdit={onEdit}
                                onAddChild={onAddChild}
                                onDelete={onDelete}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrgUnitNode;
