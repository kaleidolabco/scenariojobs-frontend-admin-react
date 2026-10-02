import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GenericModal from '../Common/GenericModal';
import GenericTable, { TableColumn } from '../Common/GenericTable';
import StatsCard from '../Common/StatsCard';
import LoadingIndicator from '../Common/LoadingIndicator';
import useUIStore from '../../store/uiStore';
import {
    useCompetencyEvaluationService,
    CompetencyLevelItem,
} from '../../services/competencyEvaluationService';
import { TrendingUp, Target, BarChart3 } from '../Common/Icon';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    procesoId: string;
    colaboradorId: string;
    colaboradorNombre: string;
}

interface BrechaStats {
    promedio_obtenido: number;
    promedio_esperado: number | null;
    promedio_brecha: number | null;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const ResultsModal: React.FC<ResultsModalProps> = ({
    isOpen,
    onClose,
    procesoId,
    colaboradorId,
    colaboradorNombre,
}) => {
    const { openAlert } = useUIStore();
    const { getCompetencyLevels } = useCompetencyEvaluationService();

    const [levels, setLevels] = useState<CompetencyLevelItem[]>([]);
    const [loading, setLoading] = useState(false);

    // ── Carga de niveles consolidados (§10) ───────────────────────────────────
    const loadLevels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCompetencyLevels(procesoId, colaboradorId);
            if (res?.success) {
                setLevels(res.data?.niveles_competencia ?? []);
            }
        } catch (error) {
            openAlert('Error al cargar los niveles consolidados', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [procesoId, colaboradorId]);

    useEffect(() => {
        if (isOpen) loadLevels();
    }, [isOpen, loadLevels]);

    // ── Estadísticas derivadas ────────────────────────────────────────────────
    const stats: BrechaStats = useMemo(() => {
        if (levels.length === 0) {
            return { promedio_obtenido: 0, promedio_esperado: null, promedio_brecha: null };
        }
        const n = levels.length;
        const avgObt = levels.reduce((s, l) => s + l.nivel_obtenido, 0) / n;

        const conEsperado = levels.filter((l) => l.nivel_esperado !== null);
        const avgExp =
            conEsperado.length > 0
                ? conEsperado.reduce((s, l) => s + (l.nivel_esperado ?? 0), 0) / conEsperado.length
                : null;

        const conBrecha = levels.filter((l) => l.brecha !== null && l.brecha !== undefined);
        const avgBrecha =
            conBrecha.length > 0
                ? conBrecha.reduce((s, l) => s + (l.brecha ?? 0), 0) / conBrecha.length
                : null;

        return { promedio_obtenido: avgObt, promedio_esperado: avgExp, promedio_brecha: avgBrecha };
    }, [levels]);

    // ── Columnas ──────────────────────────────────────────────────────────────
    const columns: TableColumn<CompetencyLevelItem>[] = [
        {
            key: 'competencia_nombre',
            label: 'Competencia',
            render: (l) => (
                <span className="font-medium text-sm text-base-content">
                    {l.competencia_nombre}
                </span>
            ),
        },
        {
            key: 'nivel_obtenido',
            label: 'Nivel obtenido',
            render: (l) => (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-base-content tabular-nums">
                        {l.nivel_obtenido.toFixed(2)}
                        <span className="text-xs text-base-content/50 font-normal">
                            {' '}/ {l.escala_maxima}
                        </span>
                    </span>
                    {l.nivel_nombre && (
                        <span
                            className="text-[10px] text-base-content/50"
                            title={l.nivel_descripcion ?? undefined}
                        >
                            {l.nivel_nombre}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'nivel_esperado',
            label: 'Nivel esperado',
            render: (l) =>
                l.nivel_esperado !== null ? (
                    <span className="text-sm text-base-content tabular-nums">
                        {l.nivel_esperado.toFixed(2)}
                    </span>
                ) : (
                    <span className="text-xs text-base-content/40">—</span>
                ),
        },
        {
            key: 'brecha',
            label: 'Brecha',
            render: (l) => {
                if (l.brecha === null || l.brecha === undefined) {
                    return <span className="text-xs text-base-content/40">—</span>;
                }
                const ok = l.brecha >= 0;
                return (
                    <span className={`badge badge-sm font-semibold ${ok ? 'badge-success' : 'badge-error'}`}>
                        {ok ? '+' : ''}
                        {l.brecha.toFixed(2)}
                    </span>
                );
            },
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Resultados consolidados — ${colaboradorNombre}`}
            size="xl"
        >
            <div className="space-y-4">
                <div className="alert alert-warning">
                    <span>
                        El consolidado sólo incluye asignaciones en <strong>COMPLETADO</strong> o{' '}
                        <strong>APROBADO</strong>. Las que estén en{' '}
                        <strong>EN_REVISION, EN_PROGRESO o DEVUELTO</strong> aún no cuentan.
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <LoadingIndicator />
                    </div>
                ) : levels.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <p className="text-sm text-base-content/60">
                            Este participante aún no tiene resultados consolidables. Recuerda que
                            sólo cuentan las asignaciones en COMPLETADO o APROBADO.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Resumen */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatsCard
                                label="Nivel promedio obtenido"
                                value={stats.promedio_obtenido.toFixed(2)}
                                variant="primary"
                                icon={<TrendingUp size={24} />}
                            />
                            <StatsCard
                                label="Nivel promedio esperado"
                                value={
                                    stats.promedio_esperado !== null
                                        ? stats.promedio_esperado.toFixed(2)
                                        : '—'
                                }
                                variant="info"
                                icon={<Target size={24} />}
                            />
                            <StatsCard
                                label="Brecha promedio"
                                value={
                                    stats.promedio_brecha !== null
                                        ? `${stats.promedio_brecha >= 0 ? '+' : ''}${stats.promedio_brecha.toFixed(2)}`
                                        : '—'
                                }
                                variant={
                                    stats.promedio_brecha !== null && stats.promedio_brecha < 0
                                        ? 'error'
                                        : 'success'
                                }
                                icon={<BarChart3 size={24} />}
                            />
                        </div>

                        {/* Tabla de niveles */}
                        <GenericTable<CompetencyLevelItem>
                            data={levels}
                            columns={columns}
                            keyExtractor={(l) => l.competencia_id}
                            onPageChange={() => {}}
                            onPageSizeChange={() => {}}
                            emptyMessage="No hay niveles consolidados disponibles."
                        />
                    </>
                )}
            </div>
        </GenericModal>
    );
};

export default ResultsModal;
