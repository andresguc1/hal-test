/**
 * ConfidencePolicy — la política PERTENECE A HALTEST, no al modelo.
 *
 * Hipótesis inicial (a validar en el benchmark):
 *   >= 0.90          automatic action
 *   0.75 .. 0.89     suggestion / user confirmation
 *   < 0.75           human review
 *
 * NO asumimos que estos umbrales son correctos. El benchmark calcula la
 * curva de calibración y sugiere thresholds por caso de uso.
 */

export const ACTIONS = {
    AUTO: 'AUTO',
    SUGGEST: 'SUGGEST',
    HUMAN_REVIEW: 'HUMAN_REVIEW',
};

export function applyPolicy(decision, policy = {}) {
    const minAuto = policy.minConfidenceAuto ?? 0.9;
    const minSuggest = policy.minConfidenceSuggest ?? 0.75;

    if (decision.confidence >= minAuto) return { ...decision, action: ACTIONS.AUTO, appliedBy: 'policy' };
    if (decision.confidence >= minSuggest) return { ...decision, action: ACTIONS.SUGGEST, appliedBy: 'policy' };
    return { ...decision, action: ACTIONS.HUMAN_REVIEW, appliedBy: 'policy' };
}

/**
 * Evalúa calibración: para decisiones con confidence ~= c, ¿qué fracción es correcta?
 * Idealmente confianza 0.9 -> ~90% de aciertos. Devuelve métricas de calibración.
 */
export function calibrationError(records) {
    if (records.length === 0) return { mce: 0, brier: 0, n: 0 };

    let brier = 0;
    const buckets = {};
    for (const r of records) {
        const c = r.confidence;
        const correct = r.correct ? 1 : 0;
        brier += (c - correct) ** 2;
        const bucket = Math.floor(c * 5) / 5; // 0,0.2,0.4,0.6,0.8,1
        (buckets[bucket] = buckets[bucket] || []).push(correct);
    }
    brier = brier / records.length;

    // MCE: máximo error de calibración por bucket
    let mce = 0;
    for (const [bucket, outcomes] of Object.entries(buckets)) {
        const acc = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
        const conf = Number(bucket) + 0.1;
        mce = Math.max(mce, Math.abs(acc - conf));
    }
    return { mce, brier, n: records.length };
}