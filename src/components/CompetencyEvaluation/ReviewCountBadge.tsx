import React, { useCallback, useEffect, useState } from 'react';
import { useCompetencyEvaluationService } from '../../services/competencyEvaluationService';

interface ReviewCountBadgeProps {
    procesoId: string;
}

/**
 * Badge con el conteo de asignaciones en `EN_REVISION` del proceso.
 * Usa una petición mínima (`limite=1`) y lee `paginacion.total`.
 */
const ReviewCountBadge: React.FC<ReviewCountBadgeProps> = ({ procesoId }) => {
    const { getReviewSummary } = useCompetencyEvaluationService();
    const [count, setCount] = useState(0);

    const loadCount = useCallback(async () => {
        const res = await getReviewSummary(procesoId, { agrupar_por: 'colaborador', limite: 1 });
        if (res?.success) {
            setCount(res.data?.resumen?.en_revision ?? 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [procesoId]);

    useEffect(() => {
        loadCount();
    }, [loadCount]);

    if (count === 0) return null;

    return <span className="badge badge-sm badge-warning ml-1">{count}</span>;
};

export default ReviewCountBadge;
