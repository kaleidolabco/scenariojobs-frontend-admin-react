import React from 'react';
import { motion } from 'framer-motion';
import { EvaluacionIntegral } from '../../services/integralEvaluationService';
import { DEFAULT_LEVELS_CONFIG, PerformanceLevelsConfig, getColorForScore } from '../../constants/performanceLevels';

interface SummaryQuadrantChartProps {
    evaluaciones: EvaluacionIntegral[];
    desempenoLabel?: string;
    competenciasLabel?: string;
    levelsConfig?: PerformanceLevelsConfig;  // Configuración de niveles (DEFAULT: 5 niveles)
}

interface EvaluationPoint {
    desempenoScore: number;
    competenciasScore: number;
    personaName: string;
}

const SummaryQuadrantChart: React.FC<SummaryQuadrantChartProps> = ({
    evaluaciones,
    desempenoLabel = 'Desempeño',
    competenciasLabel = 'Competencias',
    levelsConfig = DEFAULT_LEVELS_CONFIG,
}) => {
    const cellSize = 70;
    const labelWidth = 140;
    const bottomLabelHeight = 100;
    const gridSize = levelsConfig.gridSize;
    const performanceLevels = levelsConfig.levels;
    const borderPx = 1;
    const dotRadius = 6;

    // Extraer puntos válidos de evaluaciones
    const evaluationPoints: EvaluationPoint[] = evaluaciones
        .filter(e => e.componente_desempeno?.puntaje_numerico !== undefined && e.componente_competencias?.puntaje_numerico !== undefined)
        .map(e => ({
            desempenoScore: Math.min(Math.max(e.componente_desempeno?.puntaje_numerico || 1, 1), gridSize),
            competenciasScore: Math.min(Math.max(e.componente_competencias?.puntaje_numerico || 1, 1), gridSize),
            personaName: e.persona_nombre,
        }));

    // Agrupar puntos por celda para posicionamiento visual
    const getPointsInCell = (rowIdx: number, colIdx: number): EvaluationPoint[] => {
        return evaluationPoints.filter(point => {
            const cellRow = gridSize - Math.ceil(point.competenciasScore);
            const cellCol = Math.ceil(point.desempenoScore) - 1;
            return cellRow === rowIdx && cellCol === colIdx;
        });
    };

    // Generar posiciones dentro de una celda para múltiples puntos
    const getPointPositionInCell = (pointIndex: number, totalInCell: number, cellRow: number, cellCol: number) => {
        const baseX = labelWidth + cellCol * cellSize + cellSize / 2;
        const baseY = cellRow * cellSize + cellSize / 2;

        // Distribuir puntos en patrón circular
        if (totalInCell === 1) {
            return { x: baseX, y: baseY };
        }

        const angle = (pointIndex / totalInCell) * Math.PI * 2;
        const radius = cellSize * 0.25; // Radio de distribución
        return {
            x: baseX + Math.cos(angle) * radius,
            y: baseY + Math.sin(angle) * radius,
        };
    };

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
                    <h3 className="font-bold text-sm">Matriz Consolidada de Desempeño y Competencias</h3>
                    <p className="text-xs text-base-content/50 mt-0.5">
                        Distribución de {evaluationPoints.length} evaluaciones en la matriz
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto">
                    <div className="flex-shrink-0">
                        <svg
                            width={totalWidth}
                            height={totalHeight}
                            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                            className="border border-base-200 rounded-lg bg-base-50"
                        >
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
                                            const pointsInCell = getPointsInCell(rowIdx, colIdx);
                                            const hasCellPoints = pointsInCell.length > 0;

                                            return (
                                                <g key={`cell-${rowIdx}-${colIdx}`}>
                                                    <rect
                                                        x={labelWidth + colIdx * cellSize}
                                                        y={rowIdx * cellSize}
                                                        width={cellSize}
                                                        height={cellSize}
                                                        fill={hasCellPoints ? 'rgba(59, 130, 246, 0.08)' : 'white'}
                                                        stroke="currentColor"
                                                        strokeWidth={borderPx}
                                                        className="text-base-300"
                                                    />

                                                    {/* Puntos en la celda */}
                                                    {pointsInCell.map((point, idx) => {
                                                        const position = getPointPositionInCell(
                                                            idx,
                                                            pointsInCell.length,
                                                            rowIdx,
                                                            colIdx
                                                        );
                                                        const avgScore = (point.desempenoScore + point.competenciasScore) / 2;

                                                        return (
                                                            <motion.circle
                                                                key={`point-${rowIdx}-${colIdx}-${idx}`}
                                                                cx={position.x}
                                                                cy={position.y}
                                                                r={dotRadius}
                                                                fill="currentColor"
                                                                className={getColorForScore(avgScore, gridSize)}
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 0.8 }}
                                                                transition={{
                                                                    delay: (rowIdx * gridSize + colIdx) * 0.02 + idx * 0.05,
                                                                    duration: 0.4,
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        );
                                                    })}
                                                </g>
                                            );
                                        })}
                                    </g>
                                );
                            })}

                            {/* Bottom labels (Desempeño) */}
                            <text
                                x={labelWidth + (gridSize * cellSize) / 2}
                                y={gridSize * cellSize + bottomLabelHeight - 15}
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
                                    <text
                                        x={labelWidth + idx * cellSize + cellSize / 2}
                                        y={gridSize * cellSize + 25}
                                        fontSize="10"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        className="fill-base-content"
                                    >
                                        {level.label}
                                    </text>
                                    <text
                                        x={labelWidth + idx * cellSize + cellSize / 2}
                                        y={gridSize * cellSize + 40}
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

                    {/* Panel lateral con estadísticas */}
                    <div className="lg:w-80 flex flex-col justify-start gap-4">
                        <div className="rounded-lg border border-base-200 bg-base-50 p-4 space-y-3">
                            <div className="font-semibold text-sm">Distribución de Puntos</div>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">Total evaluaciones:</span>
                                    <span className="font-semibold">{evaluationPoints.length}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">Desempeño promedio:</span>
                                    <span className="font-semibold">
                                        {evaluationPoints.length > 0
                                            ? (evaluationPoints.reduce((sum, p) => sum + p.desempenoScore, 0) / evaluationPoints.length).toFixed(1)
                                            : '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">Competencias promedio:</span>
                                    <span className="font-semibold">
                                        {evaluationPoints.length > 0
                                            ? (evaluationPoints.reduce((sum, p) => sum + p.competenciasScore, 0) / evaluationPoints.length).toFixed(1)
                                            : '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-base-200">
                                <div className="text-xs text-base-content/50">
                                    Cada círculo representa una evaluación. Los colores indican el desempeño promedio.
                                </div>
                            </div>
                        </div>

                        {/* Leyenda de colores */}
                        <div className="rounded-lg border border-base-200 bg-base-50 p-4 space-y-3">
                            <div className="font-semibold text-sm">Leyenda</div>
                            <div className="space-y-2">
                                {[
                                    { score: 1, label: 'Insuficiente', color: 'error' },
                                    { score: 2, label: 'Parcial', color: 'warning' },
                                    { score: 3, label: 'Satisfactorio', color: 'info' },
                                    { score: 4, label: 'Destacado', color: 'success' },
                                    { score: 5, label: 'Excepcional', color: 'success' },
                                ].map(({ score, label, color }) => (
                                    <div key={score} className="flex items-center gap-2 text-sm">
                                        <div className={`w-3 h-3 rounded-full bg-${color}`} />
                                        <span className="text-base-content/70">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SummaryQuadrantChart;
