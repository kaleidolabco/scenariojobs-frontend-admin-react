import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Filter, Zap, BarChart3, Clock } from '../Common/Icon';
import {
    EvaluacionIntegral,
    IntegralEvaluationStatus,
    INTEGRAL_STATUS_LABELS,
} from '../../services/integralEvaluationService';
import SummaryQuadrantChart from './SummaryQuadrantChart';

interface IntegralEvaluationSummaryProps {
    evaluaciones: EvaluacionIntegral[];
}

interface FilterState {
    ciclo: string;
    departamento: string;
}

const IntegralEvaluationSummary: React.FC<IntegralEvaluationSummaryProps> = ({
    evaluaciones,
}) => {
    const [filters, setFilters] = useState<FilterState>({
        ciclo: '',
        departamento: '',
    });

    // Obtener opciones únicas de ciclos y departamentos
    const ciclosOptions = useMemo(() => {
        const ciclos = [...new Set(evaluaciones.map(e => e.ciclo_nombre))].filter(Boolean);
        return ciclos.sort();
    }, [evaluaciones]);

    const departamentosOptions = useMemo(() => {
        const deptos = [...new Set(evaluaciones.map(e => e.persona_departamento))].filter(Boolean);
        return deptos.sort();
    }, [evaluaciones]);

    // Aplicar filtros a las evaluaciones
    const evaluacionesFiltradas = useMemo(() => {
        return evaluaciones.filter(e => {
            if (filters.ciclo && e.ciclo_nombre !== filters.ciclo) return false;
            if (filters.departamento && e.persona_departamento !== filters.departamento) return false;
            return true;
        });
    }, [evaluaciones, filters]);

    // Limpiar filtros
    const handleClearFilters = () => {
        setFilters({ ciclo: '', departamento: '' });
    };

    const hasActiveFilters = filters.ciclo !== '' || filters.departamento !== '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Filtros Section */}
            <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <Filter size={20} />
                        Filtros
                    </h3>
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={handleClearFilters}
                                className="btn btn-sm btn-ghost gap-1"
                            >
                                <X size={16} />
                                Limpiar
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ciclo Filter */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Ciclo</span>
                        </label>
                        <select
                            value={filters.ciclo}
                            onChange={(e) => setFilters(prev => ({ ...prev, ciclo: e.target.value }))}
                            className="select select-bordered select-sm"
                        >
                            <option value="">Todos los ciclos</option>
                            {ciclosOptions.map(ciclo => (
                                <option key={ciclo} value={ciclo}>
                                    {ciclo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Departamento Filter */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">Departamento</span>
                        </label>
                        <select
                            value={filters.departamento}
                            onChange={(e) => setFilters(prev => ({ ...prev, departamento: e.target.value }))}
                            className="select select-bordered select-sm"
                        >
                            <option value="">Todos los departamentos</option>
                            {departamentosOptions.map(depto => (
                                <option key={depto} value={depto}>
                                    {depto}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-base-content/70"
                    >
                        Mostrando {evaluacionesFiltradas.length} de {evaluaciones.length} evaluaciones
                    </motion.div>
                )}
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Evaluaciones */}
                <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                            Total de Evaluaciones
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <BarChart3 size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-base-content">
                        {evaluacionesFiltradas.length}
                    </div>
                    <div className="text-xs text-base-content/50">
                        evaluaciones registradas
                    </div>
                </div>

                {/* Promedio Puntaje */}
                <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                            Promedio de Puntaje
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center text-info">
                            <Zap size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-base-content">
                        {evaluacionesFiltradas.length > 0
                            ? (
                                (evaluacionesFiltradas.reduce((sum, e) => sum + (e.puntaje_final || 0), 0) /
                                    evaluacionesFiltradas.filter(e => e.puntaje_final).length) || 0
                            ).toFixed(2)
                            : '—'}
                    </div>
                    <div className="text-xs text-base-content/50">
                        sobre 5
                    </div>
                </div>

                {/* Completadas */}
                <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                            Completadas
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
                            <Check size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-base-content">
                        {evaluacionesFiltradas.filter(e => e.estado === 'COMPLETADA').length}
                    </div>
                    <div className="text-xs text-base-content/50">
                        {evaluacionesFiltradas.length > 0
                            ? `${Math.round((evaluacionesFiltradas.filter(e => e.estado === 'COMPLETADA').length / evaluacionesFiltradas.length) * 100)}% completadas`
                            : '—'
                        }
                    </div>
                </div>

                {/* En Progreso */}
                <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                            En Progreso
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-base-content">
                        {evaluacionesFiltradas.filter(e => e.estado === 'EN_PROGRESO').length}
                    </div>
                    <div className="text-xs text-base-content/50">
                        en progreso
                    </div>
                </div>
            </div>

            {/* Performance Matrix */}
            <SummaryQuadrantChart evaluaciones={evaluacionesFiltradas} />

            {/* Status Distribution */}
            <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-4">
                <h3 className="font-semibold text-base">Distribución por Estado</h3>
                <div className="space-y-3">
                    {['BORRADOR', 'EN_PROGRESO', 'COMPLETADA'].map((status) => {
                        const count = evaluacionesFiltradas.filter(e => e.estado === status).length;
                        const percentage = evaluacionesFiltradas.length > 0 ? (count / evaluacionesFiltradas.length) * 100 : 0;
                        const statusLabel = INTEGRAL_STATUS_LABELS[status as IntegralEvaluationStatus]?.label || status;
                        const statusColor = INTEGRAL_STATUS_LABELS[status as IntegralEvaluationStatus]?.color || 'base';
                        
                        return (
                            <div key={status} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-base-content/70">{statusLabel}</span>
                                    <span className={`font-semibold text-${statusColor}`}>{count}</span>
                                </div>
                                <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 bg-${statusColor}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Score Distribution */}
            <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-4">
                <h3 className="font-semibold text-base">Distribución de Puntajes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { range: 'Bajo (< 2.5)', min: 0, max: 2.5, color: 'error' },
                        { range: 'Medio (2.5-3.5)', min: 2.5, max: 3.5, color: 'warning' },
                        { range: 'Alto (> 3.5)', min: 3.5, max: 5, color: 'success' },
                    ].map((bracket) => {
                        const count = evaluacionesFiltradas.filter(
                            e => e.puntaje_final && e.puntaje_final >= bracket.min && e.puntaje_final <= bracket.max
                        ).length;
                        const percentage = evaluacionesFiltradas.filter(e => e.puntaje_final).length > 0
                            ? (count / evaluacionesFiltradas.filter(e => e.puntaje_final).length) * 100
                            : 0;
                        
                        return (
                            <div key={bracket.range} className="rounded-lg bg-base-50 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-base-content/70">{bracket.range}</span>
                                    <span className={`badge badge-${bracket.color}`}>{count}</span>
                                </div>
                                <div className="text-2xl font-bold text-base-content">
                                    {percentage.toFixed(0)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Performers */}
            {evaluacionesFiltradas.filter(e => e.puntaje_final).length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-4">
                        <h3 className="font-semibold text-base">Mejores Evaluaciones</h3>
                        <div className="space-y-2">
                            {[...evaluacionesFiltradas]
                                .filter(e => e.puntaje_final)
                                .sort((a, b) => (b.puntaje_final || 0) - (a.puntaje_final || 0))
                                .slice(0, 5)
                                .map((eval_item, idx) => (
                                    <div key={eval_item.id} className="flex items-center justify-between py-2 border-b border-base-200 last:border-b-0">
                                        <div>
                                            <div className="font-medium text-sm">{idx + 1}. {eval_item.persona_nombre}</div>
                                            <div className="text-xs text-base-content/50">{eval_item.persona_departamento}</div>
                                        </div>
                                        <span className="badge badge-success font-semibold">
                                            {eval_item.puntaje_final?.toFixed(2)} / 5
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-base-200 bg-base-100 p-6 space-y-4">
                        <h3 className="font-semibold text-base">Evaluaciones por Mejorar</h3>
                        <div className="space-y-2">
                            {[...evaluacionesFiltradas]
                                .filter(e => e.puntaje_final)
                                .sort((a, b) => (a.puntaje_final || 0) - (b.puntaje_final || 0))
                                .slice(0, 5)
                                .map((eval_item, idx) => (
                                    <div key={eval_item.id} className="flex items-center justify-between py-2 border-b border-base-200 last:border-b-0">
                                        <div>
                                            <div className="font-medium text-sm">{idx + 1}. {eval_item.persona_nombre}</div>
                                            <div className="text-xs text-base-content/50">{eval_item.persona_departamento}</div>
                                        </div>
                                        <span className="badge badge-warning font-semibold">
                                            {eval_item.puntaje_final?.toFixed(2)} / 5
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default IntegralEvaluationSummary;
