/**
 * DecisionPolicy — la política pertenece a HalTest, no al provider.
 *
 * Umbrales por caso de uso, configurables. Valores por defecto (a calibrar con el
 * harness de F5, NO asumidos como correctos):
 *   >= 0.90        AUTO          -> aplicar sin intervención
 *   0.75 .. 0.89   SUGGEST       -> sugerir, requerir confirmación
 *   < 0.75         HUMAN_REVIEW  -> revisión humana
 *
 * También admite modos de operación: 'disabled' (sin healing) y 'apply-with-validation'
 * (default; toda decisión AUTO aún pasa por verificación DOM en el healer).
 */
export const ACTIONS = {
    AUTO: 'AUTO',
    SUGGEST: 'SUGGEST',
    HUMAN_REVIEW: 'HUMAN_REVIEW',
};

export const MODES = {
    DISABLED: 'disabled',
    LOCAL_ONLY: 'local-only',
    APPLY_WITH_VALIDATION: 'apply-with-validation',
};

export const DEFAULT_POLICY = {
    mode: MODES.APPLY_WITH_VALIDATION,
    minConfidenceAuto: 0.9,
    minConfidenceSuggest: 0.75,
};

/**
 * Aplica la política a un resultado de decisión.
 * @param {{ selector?: string|null, confidence: number }} decision
 * @param {{ mode?: string, minConfidenceAuto?: number, minConfidenceSuggest?: number }} [policy]
 * @returns {decision con action + appliedBy}
 */
export function applyPolicy(decision, policy = {}) {
    const merged = { ...DEFAULT_POLICY, ...policy };
    if (merged.mode === MODES.DISABLED) {
        return { ...decision, action: ACTIONS.HUMAN_REVIEW, appliedBy: 'policy:disabled' };
    }

    if (decision.confidence >= merged.minConfidenceAuto) {
        return { ...decision, action: ACTIONS.AUTO, appliedBy: 'policy' };
    }
    if (decision.confidence >= merged.minConfidenceSuggest) {
        return { ...decision, action: ACTIONS.SUGGEST, appliedBy: 'policy' };
    }
    return { ...decision, action: ACTIONS.HUMAN_REVIEW, appliedBy: 'policy' };
}

/**
 * Evalúa calibración de confianza: ¿la confidence ≈ fracción de aciertos?
 * @param {Array<{ confidence: number, correct: boolean }>} records
 * @returns {{ mce: number, brier: number, n: number }}
 */
export function calibrationError(records) {
    if (!records.length) return { mce: 0, brier: 0, n: 0 };

    let brier = 0;
    const buckets = {};
    for (const r of records) {
        const correct = r.correct ? 1 : 0;
        brier += (r.confidence - correct) ** 2;
        const bucket = Math.floor(r.confidence * 5) / 5; // 0,0.2,0.4,0.6,0.8,1
        (buckets[bucket] = buckets[bucket] || []).push(correct);
    }
    brier /= records.length;

    let mce = 0;
    for (const [bucket, outcomes] of Object.entries(buckets)) {
        const acc = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
        const conf = Number(bucket) + 0.1;
        mce = Math.max(mce, Math.abs(acc - conf));
    }
    return { mce, brier, n: records.length };
}

export default { applyPolicy, calibrationError, ACTIONS, MODES, DEFAULT_POLICY };
