import React from 'react';
import { motion } from 'framer-motion';

interface QuadrantChartProps {
    desempenoScore?: number;      // Score de desempeño (1-5) - Eje X
    competenciasScore?: number;   // Score de competencias (1-5) - Eje Y
    desempenoLabel?: string;      // Label personalizado para eje X
    competenciasLabel?: string;   // Label personalizado para eje Y
}

const PerformanceLevels = [
    { level: 1, label: 'Insuficiente', shortLabel: 'Insuf.' },
    { level: 2, label: 'Parcial', shortLabel: 'Parc.' },
    { level: 3, label: 'Satisfactorio', shortLabel: 'Satisf.' },
    { level: 4, label: 'Destacado', shortLabel: 'Dest.' },
    { level: 5, label: 'Excepcional', shortLabel: 'Excep.' },
];

const getColorForScore = (score: number | undefined): string => {
    if (score === undefined) return 'text-base-300';
    if (score <= 1.5) return 'text-error';
    if (score <= 2.5) return 'text-warning';
    if (score <= 3.5) return 'text-info';
    if (score <= 4.5) return 'text-success';
    return 'text-success';
};

const getBackgroundColorForScore = (score: number | undefined): string => {
    if (score === undefined) return 'bg-base-100';
    if (score <= 1.5) return 'bg-error/10';
    if (score <= 2.5) return 'bg-warning/10';
    if (score <= 3.5) return 'bg-info/10';
    if (score <= 4.5) return 'bg-success/10';
    return 'bg-success/10';
};

const QuadrantChart: React.FC<QuadrantChartProps> = ({
    desempenoScore,
    competenciasScore,
    desempenoLabel = 'Desempeño',
    competenciasLabel = 'Competencias',
}) => {
    const cellSize = 60;
    const labelWidth = 120;
    const bottomLabelHeight = 80; // Altura para labels inferiores
    const gridSize = 5;
    const borderPx = 1;

    const hasValidScore = desempenoScore !== undefined || competenciasScore !== undefined;
    const validDesempeno = desempenoScore ? Math.min(Math.max(desempenoScore, 1), 5) : undefined;
    const validCompetencias = competenciasScore ? Math.min(Math.max(competenciasScore, 1), 5) : undefined;

    const effectiveDesempeno = validDesempeno || 1;
    const effectiveCompetencias = validCompetencias || 1;

    /** * CORRECCIÓN DE LÓGICA DE POSICIONAMIENTO:
     * Para el Eje Y (Competencias): 5 es arriba (fila 0), 1 es abajo (fila 4).
     * Para el Eje X (Desempeño): 1 es izquierda (col 0), 5 es derecha (col 4).
     */
    const userRow = hasValidScore ? gridSize - Math.ceil(effectiveCompetencias) : undefined;
    const userCol = hasValidScore ? Math.ceil(effectiveDesempeno) - 1 : undefined;

    const totalWidth = labelWidth + gridSize * cellSize;
    const totalHeight = gridSize * cellSize + bottomLabelHeight;

    return (
        <motion.div
            className="bg-base-100 rounded-xl border border-base-200 p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-sm">Matriz de Desempeño y Competencias</h3>
                    <p className="text-xs text-base-content/50 mt-0.5">Posicionamiento del colaborador en la matriz de evaluación</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto">
                    <div className="flex-shrink-0">
                        <svg width={totalWidth} height={totalHeight} viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="border border-base-200 rounded-lg bg-base-50">

                            {/* Grid cells y Labels de Competencias (Izquierda) */}
                            {Array.from({ length: gridSize }).map((_, rowIdx) => {
                                const levelIdx = gridSize - 1 - rowIdx;
                                const level = PerformanceLevels[levelIdx];

                                return (
                                    <g key={`row-${rowIdx}`}>
                                        {/* Left labels (Competencias) */}
                                        <text
                                            x={labelWidth / 2}
                                            y={rowIdx * cellSize + cellSize / 2 - 8}
                                            fontSize="10"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            className="fill-base-content/40 uppercase"
                                        >
                                            {competenciasLabel}
                                        </text>
                                        <text
                                            x={labelWidth / 2}
                                            y={rowIdx * cellSize + cellSize / 2 + 8}
                                            fontSize="11"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            className="fill-base-content"
                                        >
                                            {level.label}
                                        </text>

                                        {/* Celdas */}
                                        {Array.from({ length: gridSize }).map((_, colIdx) => {
                                            const isUserCell = userRow === rowIdx && userCol === colIdx;
                                            const onlyOneComplete = (validDesempeno !== undefined || validCompetencias !== undefined) && (validDesempeno === undefined || validCompetencias === undefined);

                                            return (
                                                <g key={`cell-${rowIdx}-${colIdx}`}>
                                                    <rect
                                                        x={labelWidth + colIdx * cellSize}
                                                        y={rowIdx * cellSize}
                                                        width={cellSize}
                                                        height={cellSize}
                                                        fill={isUserCell ? 'rgba(59, 130, 246, 0.1)' : 'white'}
                                                        stroke="currentColor"
                                                        strokeWidth={borderPx}
                                                        className="text-base-300"
                                                    />

                                                    {isUserCell && (
                                                        <motion.circle
                                                            cx={labelWidth + colIdx * cellSize + cellSize / 2}
                                                            cy={rowIdx * cellSize + cellSize / 2}
                                                            r="16"
                                                            fill="currentColor"
                                                            className={getColorForScore(validDesempeno && validCompetencias ? (validDesempeno + validCompetencias) / 2 : (validDesempeno || validCompetencias))}
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            style={{ opacity: onlyOneComplete ? 0.6 : 1 }}
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </g>
                                );
                            })}

                            {/* Bottom labels (Desempeño) - MOVIDOS ABAJO */}
                            {/* Título único para el Eje X (Desempeño) */}
                            <text
                                x={labelWidth + (gridSize * cellSize) / 2}
                                y={gridSize * cellSize + bottomLabelHeight - 10}
                                fontSize="12"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="fill-base-content/60 uppercase tracking-widest"
                            >
                                — {desempenoLabel} —
                            </text>

                            {/* Labels de niveles para cada columna */}
                            {PerformanceLevels.map((level, idx) => (
                                <g key={`bottom-label-${idx}`}>
                                    {/* Línea divisoria sutil entre etiquetas opcional */}
                                    <text
                                        x={labelWidth + idx * cellSize + cellSize / 2}
                                        y={gridSize * cellSize + 20}
                                        fontSize="10"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        className="fill-base-content"
                                    >
                                        {level.label}
                                    </text>
                                    <text
                                        x={labelWidth + idx * cellSize + cellSize / 2}
                                        y={gridSize * cellSize + 34}
                                        fontSize="9"
                                        textAnchor="middle"
                                        className="fill-base-content/40"
                                    >
                                        (Nivel {level.level})
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* Panel lateral de info (Se mantiene igual) */}
                    <div className="lg:w-72 flex flex-col justify-between">
                        {hasValidScore ? (
                            <motion.div
                                className={`rounded-lg border-2 p-4 ${getBackgroundColorForScore(effectiveDesempeno && effectiveCompetencias ? (effectiveDesempeno + effectiveCompetencias) / 2 : effectiveDesempeno || effectiveCompetencias)} border-current`}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className={`font-bold text-sm mb-2 ${getColorForScore(effectiveDesempeno && effectiveCompetencias ? (effectiveDesempeno + effectiveCompetencias) / 2 : effectiveDesempeno || effectiveCompetencias)}`}>
                                    Posición Actual
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                                        <span className="text-xs opacity-70">{desempenoLabel}:</span>
                                        <span className="font-bold">{validDesempeno?.toFixed(1) || '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                                        <span className="text-xs opacity-70">{competenciasLabel}:</span>
                                        <span className="font-bold">{validCompetencias?.toFixed(1) || '—'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="rounded-lg border border-base-300 p-4 bg-base-50 text-center text-xs opacity-50">
                                No hay evaluaciones completas.
                            </div>
                        )}

                        <div className="mt-4 space-y-1">
                            {PerformanceLevels.slice().reverse().map((level) => (
                                <div key={level.level} className="flex items-center gap-2 text-[10px]">
                                    <div className={`w-2 h-2 rounded-full ${level.level >= 4 ? 'bg-success' : level.level === 3 ? 'bg-info' : level.level === 2 ? 'bg-warning' : 'bg-error'}`} />
                                    <span>{level.level}. {level.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QuadrantChart;