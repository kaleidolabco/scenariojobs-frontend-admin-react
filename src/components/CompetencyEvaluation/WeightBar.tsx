import React from 'react';
import { motion } from 'framer-motion';

/**
 * Barra de distribución de pesos (suma de pesos de competencias vs 100%).
 * Colorea según si coincide, excede o falta.
 */
const WeightBar: React.FC<{ total: number }> = ({ total }) => {
    const ok = total === 100;
    const over = total > 100;
    const barCls = ok ? 'bg-success' : over ? 'bg-error' : 'bg-warning';
    const textCls = ok ? 'text-success' : over ? 'text-error' : 'text-warning';

    return (
        <div className="bg-base-100 border border-base-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-base-content">Distribución de pesos</span>
                <span className={`font-bold tabular-nums ${textCls}`}>{total}% / 100%</span>
            </div>
            <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                <motion.div
                    className={`h-full rounded-full transition-colors duration-300 ${barCls}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(total, 100)}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>
            <p className="text-xs text-base-content/50">
                {ok
                    ? '✓ Los pesos suman exactamente 100%'
                    : over
                    ? `Excede en ${total - 100}%. Reduce algunos pesos.`
                    : `Faltan ${100 - total}% por asignar.`}
            </p>
        </div>
    );
};

export default WeightBar;
