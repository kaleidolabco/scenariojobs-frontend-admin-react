// ─── Shared evaluation helpers ────────────────────────────────────────────────
// Single source of truth for score calculations used across performance and
// integral evaluation services.

/**
 * Converts a percentage achievement score to a numeric value on a 1-5 scale.
 *
 * Scale:
 *   < 70%  → 1 (Insuficiente)
 *  70–99%  → 2 (Regular)
 *   100%   → 3 (Satisfactorio)
 * 101–109% → 4 (Destacado)
 *  ≥ 110%  → 5 (Sobresaliente)
 */
export const calcValorLogroNumerico = (
    porcentajeLogro: number | undefined | null,
): 1 | 2 | 3 | 4 | 5 | undefined => {
    if (porcentajeLogro === undefined || porcentajeLogro === null) return undefined;
    if (porcentajeLogro < 60) return 1;
    if (porcentajeLogro < 90) return 2;
    if (porcentajeLogro <= 100) return 3;
    if (porcentajeLogro < 110) return 4;
    return 5;
};
