/**
 * run-benchmark — evalúa el auto-healing determinístico REAL de HalTest (F5).
 *
 * Corre el SelectorRanker + DecisionPolicy end-to-end contra los fixtures de
 * test-harness/healing-fixtures.js y reporta las métricas del PoC:
 * healSuccessRate (¿elegido localiza el elemento real?), labeledAccuracy (¿elegido
 * es el ideal?), falseRepairRate (¿no funcional con confianza alta?), calibración MCE/Brier.
 *
 * Uso: node test-harness/run-benchmark.js [--json]
 */
import { bestSelector } from '../core/decisions/SelectorRanker.js';
import { applyPolicy, DEFAULT_POLICY, ACTIONS } from '../core/decisions/DecisionPolicy.js';
import { summarizeCases } from './MetricsService.js';
import { healingFixtures } from './healing-fixtures.js';

const TO_JSON = process.argv.includes('--json');

export async function runBenchmark() {
    const cases = [];
    const lines = [];

    for (const fx of healingFixtures) {
        const domSnippet = fx.domFragments.join('\n');
        const decision = bestSelector({ domSnippet, originalSelector: fx.originalSelector });
        const policy = applyPolicy(decision, DEFAULT_POLICY);

        const chosen = decision.selector;
        const ambiguityOk = fx.expectAmbiguity ? decision.ambiguity === true : true;
        const functional =
            chosen && !fx.expectAmbiguity ? (fx.functional || []).includes(chosen) : null;
        const ideal = chosen ? chosen === fx.ideal : null;

        decision.source = 'deterministic';

        cases.push({ decision, functional, ideal });

        lines.push({
            id: fx.id,
            mutation: fx.mutation,
            chosen,
            confidence: decision.confidence,
            action: policy.action,
            ambiguity: decision.ambiguity,
            functional,
            ideal,
            ambiguityOk,
            note:
                fx.expectAmbiguity && ambiguityOk && policy.action !== 'AUTO'
                    ? 'deferred OK'
                    : functional === true
                      ? 'healed'
                      : functional === false
                        ? 'FALSE REPAIR'
                        : 'no decision',
        });
    }

    const summary = summarizeCases(cases);

    if (!TO_JSON) {
        for (const r of lines) {
            const flag =
                r.note === 'healed'
                    ? '\x1b[32mHEAL OK\x1b[0m'
                    : r.note === 'deferred OK'
                      ? '\x1b[34mDEFER OK\x1b[0m'
                      : r.note === 'FALSE REPAIR'
                        ? '\x1b[31mFALSE\x1b[0m'
                        : '\x1b[33m—\x1b[0m';
            console.log(
                [
                    r.id.padEnd(16),
                    r.mutation.padEnd(20),
                    String(r.chosen || '∅')
                        .padEnd(38)
                        .slice(0, 38),
                    ('conf ' + r.confidence.toFixed(2)).padEnd(9),
                    r.action.padEnd(12),
                    flag,
                ].join(' | '),
            );
        }
        console.log('\n=== Resumen (ranker real + política default) ===');
        console.log(
            `healSuccessRate   : ${summary.healSuccessRate.toFixed(3)} (${summary.n} casos)`,
        );
        console.log(`labeledAccuracy   : ${summary.labeledAccuracy.toFixed(3)}`);
        console.log(`falseRepairRate   : ${summary.falseRepairRate.toFixed(3)}`);
        const cal = summary.calibration;
        console.log(
            `MCE               : ${cal.mce.toFixed(3)} | Brier: ${cal.brier.toFixed(3)} | n: ${cal.n}`,
        );
        console.log(
            `distribución por source:`,
            Object.entries(summary.bySource)
                .map(([k, v]) => `${k}:${v.n}`)
                .join(', ') || '(vacío)',
        );
        console.log(
            `\nNota: política default umbrales AUTO/SUGGEST ${DEFAULT_POLICY.minConfidenceAuto}/${DEFAULT_POLICY.minConfidenceSuggest}.`,
        );
        return { summary, lines };
    }

    return { summary, lines };
}

const main = async () => {
    const result = await runBenchmark();
    if (TO_JSON) console.log(JSON.stringify(result, null, 2));
};

if (import.meta.url === `file://${process.argv[1]}`) {
    await main().catch((e) => {
        console.error('ERR', e.message);
        process.exit(1);
    });
}
