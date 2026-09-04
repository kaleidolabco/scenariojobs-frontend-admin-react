import React from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_LEVELS_CONFIG, PerformanceLevelsConfig, getColorForScore, getBackgroundColorForScore } from '../../constants/performanceLevels';

interface QuadrantChartProps {
    desempenoScore?: number;      // Score de desempeño (1-5, 1-4, etc, según config) - Eje X
    competenciasScore?: number;   // Score de competencias (1-5, 1-4, etc, según config) - Eje Y
    desempenoLabel?: string;      // Label personalizado para eje X
    competenciasLabel?: string;   // Label personalizado para eje Y
    levelsConfig?: PerformanceLevelsConfig;  // Configuración de niveles (DEFAULT: 5 niveles)
}

const QuadrantChart: React.FC<QuadrantChartProps> = ({
    desempenoScore,
    competenciasScore,
    desempenoLabel = 'Desempeño',
    competenciasLabel = 'Competencias',
    levelsConfig = DEFAULT_LEVELS_CONFIG,
}) => {
    const cellSize = 60;
    const labelWidth = 120;
    const bottomLabelHeight = 80;
    const gridSize = levelsConfig.gridSize;
    const performanceLevels = levelsConfig.levels;
    const borderPx = 1;

    const hasValidScore = desempenoScore !== undefined || competenciasScore !== undefined;
    const validDesempeno = desempenoScore ? Math.min(Math.max(desempenoScore, 1), gridSize) : undefined;
    const validCompetencias = competenciasScore ? Math.min(Math.max(competenciasScore, 1), gridSize) : undefined;

    const effectiveDesempeno = validDesempeno || 1;
    const effectiveCompetencias = validCompetencias || 1;

    /**
     * LÓGICA DE POSICIONAMIENTO CON RANGOS CENTRADOS:
     * Para el Eje Y (Competencias): gridSize es arriba (fila 0), 1 es abajo (fila gridSize-1).
     * Para el Eje X (Desempeño): 1 es izquierda (col 0), gridSize es derecha (col gridSize-1).
     * 
     * Math.round() agrupa en rangos centrados:
     * - 0-1.5 → nivel 1
     * - 1.5-2.5 → nivel 2
     * - 2.5-3.5 → nivel 3, etc.
     */
    const userRow = hasValidScore ? gridSize - Math.round(effectiveCompetencias) : undefined;
    const userCol = hasValidScore ? Math.round(effectiveDesempeno) - 1 : undefined;

    const totalWidth = labelWidth + gridSize * cellSize;
    const totalHeight = gridSize * cellSize + bottomLabelHeight;
    const avgScore = validDesempeno && validCompetencias ? (validDesempeno + validCompetencias) / 2 : (validDesempeno || validCompetencias);

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
                                const level = performanceLevels[levelIdx];

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
                                                            className={getColorForScore(avgScore, gridSize)}
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
                            {performanceLevels.map((level, idx) => (
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

                    {/* Panel lateral de info */}
                    <div className="lg:w-72 flex flex-col justify-between">
                        {hasValidScore ? (
                            <motion.div
                                className={`rounded-lg border-2 p-4 ${getBackgroundColorForScore(avgScore, gridSize)} border-current`}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className={`font-bold text-sm mb-2 ${getColorForScore(avgScore, gridSize)}`}>
                                    Posición Actual
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                                        <span className="text-xs opacity-70">{desempenoLabel}:</span>
                                        <span className="font-bold">{validDesempeno?.toFixed(2) || '—'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                                        <span className="text-xs opacity-70">{competenciasLabel}:</span>
                                        <span className="font-bold">{validCompetencias?.toFixed(2) || '—'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="rounded-lg border border-base-300 p-4 bg-base-50 text-center text-xs opacity-50">
                                No hay evaluaciones completas.
                            </div>
                        )}

                        <div className="mt-4 space-y-1">
                            {performanceLevels.slice().reverse().map((level) => (
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