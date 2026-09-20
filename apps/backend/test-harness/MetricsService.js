/**
 * MetricsService — métricas de calibración/rendimiento del auto-healing (F5).
 * Portado de research/jev-decision-provider (benchmark) sin dependencia de Jev.
 * Fuente de verdad para decidir si las heurísticas mejoran o empeoran.
 *
 * Distingue DOS métricas (lección del PoC Jev):
 *   - healSuccessRate: ¿el selector elegido localiza el elemento REAL? (método honesto)
 *   - labeledAccuracy: ¿el selector elegido es el "ideal" del ground truth?
 *   - falseRepairRate: ¿eligió algo NO funcional con alta confidence?
 */

/**
 * Agrega metadatos de calibración a un set de decisiones.
 * @param {Array<{ confidence: number, correct: boolean }>} records
 * @returns {{ mce: number, brier: number, n: number }}
 */
export function calibration(records) {
    const valid = records.filter((r) => r.correct != null);
    if (!valid.length) return { mce: 0, brier: 0, n: 0 };

    let brier = 0;
    const buckets = {};
    for (const r of valid) {
        const label = r.correct ? 1 : 0;
        const c = Math.max(0, Math.min(1, r.confidence || 0));
        brier += (c - label) ** 2;
        const bucket = Math.floor(c * 5) / 5;
        (buckets[bucket] = buckets[bucket] || []).push(label);
    }
    brier /= valid.length;

    let mce = 0;
    for (const [bucket, outcomes] of Object.entries(buckets)) {
        const acc = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
        const conf = Number(bucket) + 0.1;
        mce = Math.max(mce, Math.abs(acc - conf));
    }
    return { mce, brier, n: valid.length };
}

/**
 * Resumen de un dataset de auto-healing.
 * Cada case debe tener:
 *   - decision: { selector, confidence, ambiguity, source }
 *   - functional: boolean|null  — el selector elegido localiza el elemento real (NULL si no se decidió)
 *   - ideal: boolean|null       — el selector elegido es el ground truth "ideal"
 * @param {Array} cases
 * @returns {Object}
 */
export function summarizeCases(cases) {
    const n = cases.length;
    const decided = cases.filter((c) => c.decision?.selector);
    const functional = cases.filter((c) => c.functional != null);
    const ideal = cases.filter((c) => c.ideal != null);

    const healSuccessRate = functional.length
        ? functional.filter((c) => c.functional).length / functional.length
        : 0;
    const labeledAccuracy = ideal.length ? ideal.filter((c) => c.ideal).length / ideal.length : 0;
    const falseRepairRate = functional.length
        ? functional.filter((c) => !c.functional && c.decision?.confidence >= 0.9).length /
          functional.length
        : 0;

    const cal = calibration(
        functional.map((c) => ({ confidence: c.decision?.confidence, correct: c.functional })),
    );

    const bySource = {};
    for (const c of functional) {
        const src = c.decision?.source || 'none';
        bySource[src] = bySource[src] || { n: 0, healed: 0 };
        bySource[src].n += 1;
        if (c.functional) bySource[src].healed += 1;
    }

    return {
        n,
        decided: decided.length,
        healSuccessRate,
        labeledAccuracy,
        falseRepairRate,
        calibration: cal,
        bySource,
    };
}

export default { calibration, summarizeCases };
