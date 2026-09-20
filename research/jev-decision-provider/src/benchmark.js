/**
 * Benchmark — compara baseline (determinístico) vs Jev (mock o real) en
 * auto-healing de selectores.
 *
 * Uso:
 *   node src/benchmark.js                     # con mock Jev (offline)
 *   TYPESAFE_API_KEY=... node src/benchmark.js --real
 *
 * Métricas:
 *   - accuracy (acierto vs ground truth)
 *   - false repair rate (eligió un candidato INCORRECTO con confianza alta)
 *   - miss rate (no acertó)
 *   - confidence promedio de aciertos / errores
 *   - latencia media
 *   - error de calibración (MCE, Brier)
 *   - reproducibilidad (desviación entre runs)
 */
import { healingCases } from '../fixtures/healing_cases.js';
import { DeterministicDecisionProvider } from './deterministicProvider.js';
import { MockJevProvider } from './mockJevProvider.js';
import { JevDecisionProvider } from './jevProvider.js';
import { DecisionGateway } from './decisionGateway.js';
import { applyPolicy, calibrationError } from './policy.js';
import { buildHealingContext, auditNoSensitiveData } from './sanitizer.js';

const USE_REAL = process.argv.includes('--real');

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function runScenario(provider, cases, { jitterMs = 0 } = {}) {
    return Promise.all(
        cases.map(async (c) => {
            if (jitterMs) await sleep(Math.random() * jitterMs);
            const ctxState = buildHealingContext({
                originalSelector: c.originalSelector,
                candidates: c.candidates,
                domSnippet: c.domSnippet,
                intent: c.intent,
            });

            const question = {
                id: 'best_selector',
                type: 'choice',
                instructions: 'Which candidate best represents the intended element?',
                criteria: Object.fromEntries(c.candidates.map((x) => [x, null])),
            };

            const started = Date.now();
            const decision = await provider.decide({ state: ctxState }, question);
            const latencyMs = Date.now() - started;

            const correct = decision.value === c.correct;
            const healSuccess = (c.acceptable || []).includes(decision.value);
            const falseRepair = !healSuccess && decision.confidence >= 0.9;
            return {
                caseId: c.id,
                mutation: c.mutation,
                correct,
                healSuccess,
                value: decision.value,
                expected: c.correct,
                confidence: decision.confidence,
                providerId: decision.providerId,
                latencyMs,
                falseRepair,
            };
        }),
    );
}

function summarize(label, records) {
    const n = records.length;
    const acc = records.filter((r) => r.correct).length / n;
    const heal = records.filter((r) => r.healSuccess).length / n;
    const falseRepair = records.filter((r) => r.falseRepair).length / n;
    const avgLatency = records.reduce((a, r) => a + r.latencyMs, 0) / n;
    const confCorrect = records
        .filter((r) => r.healSuccess)
        .reduce((a, r) => a + r.confidence, 0) / Math.max(1, records.filter((r) => r.healSuccess).length);
    const confWrong = records
        .filter((r) => !r.healSuccess)
        .reduce((a, r) => a + r.confidence, 0) / Math.max(1, records.filter((r) => !r.healSuccess).length);
    const cal = calibrationError(records.map((r) => ({ confidence: r.confidence, correct: r.healSuccess })));

    const policyDist = {};
    for (const r of records) {
        const action = applyPolicy(r).action;
        policyDist[action] = (policyDist[action] || 0) + 1;
    }

    return {
        label,
        n,
        healSuccessRate: Number(heal.toFixed(3)),
        labeledAccuracy: Number(acc.toFixed(3)),
        falseRepairRate: Number(falseRepair.toFixed(3)),
        avgLatencyMs: Number(avgLatency.toFixed(1)),
        meanConfHeal: Number(confCorrect.toFixed(3)),
        meanConfMiss: Number(confWrong.toFixed(3)),
        calibration: cal,
        policyDistribution: policyDist,
    };
}

async function main() {
    const rounds = Number(process.env.BENCH_ROUNDS || 3);
    const detProvider = new DeterministicDecisionProvider();

    let jevProvider;
    const groundTruth = new Map(healingCases.map((c) => [c.originalSelector, c.correct]));

    if (USE_REAL) {
        if (!process.env.TYPESAFE_API_KEY) {
            console.error('--real requiere TYPESAFE_API_KEY');
            process.exit(1);
        }
        jevProvider = new JevDecisionProvider();
        console.log('Modo: JEV REAL (online)\n');
    } else {
        console.log('Modo: MOCK JEV (offline, simulación de laboratorio)\n');
        await sleep(400);
    }

    console.log('='.repeat(70));
    console.log('BENCHMARK AUTO-HEALING — baseline determinístico vs Jev');
    console.log('='.repeat(70));

    // ---- Deterministic baseline (100% reproducible) ----
    const detRecordsAll = [];
    for (let i = 0; i < rounds; i++) {
        const recs = await runScenario(detProvider, healingCases, { jitterMs: 0 });
        detRecordsAll.push(...recs);
    }
    const detSummary = summarize('Det (baseline)', detRecordsAll);
    console.log('\n[Provider: deterministic]');
    console.table([detSummary]);

    // ---- Jev (mock o real) ----
    const jevRecordsAll = [];
    for (let i = 0; i < rounds; i++) {
        const provider = USE_REAL
            ? jevProvider
            : new MockJevProvider({ groundTruth });
        const recs = await runScenario(provider, healingCases, { jitterMs: USE_REAL ? 0 : 80 });
        jevRecordsAll.push(...recs);
    }
    const jevSummary = summarize(USE_REAL ? 'jev-real' : 'mock-jev', jevRecordsAll);
    console.log(`\n[Provider: ${USE_REAL ? 'jev-real' : 'mock-jev'}]`);
    console.table([jevSummary]);

    // ---- Gateway con fallback (Jev caído -> determinístico) ----
    console.log('\n[Gateway + fallback]');
    const failingJev = {
        ...(USE_REAL ? jevProvider : new MockJevProvider({ groundTruth })),
        decide: async () => {
            throw new Error('network timeout');
        },
    };
    const gateway = new DecisionGateway({
        providers: [detProvider, failingJev],
        policy: {
            mode: 'remote-allowed',
            allowedProviders: ['deterministic', 'jev'],
            fallbackChain: ['jev', 'deterministic'],
        },
    });
    const gwRecords = await runScenario(
        { decide: (ctx, q) => gateway.decide(ctx, q, { preferredProvider: 'jev' }) },
        healingCases,
    );
    const gwSummary = summarize('gateway+fallback', gwRecords);
    console.table([gwSummary]);
    console.log(`[Gateway] decisiones registradas (audit): ${gateway.audit().length}`);

    // ---- Privacidad: auditoría del payload sanitizado ----
    console.log('\n[Sanitizer / privacy audit]');
    const sensitivePayload = {
        task: 'selector-healing',
        domSnippet:
            '<input type="password" value="supersecret"><div>user@example.com</div><input name="token" value="abc123">',
    };
    const sanitized = buildHealingContext({
        originalSelector: 'input[name="token"]',
        candidates: ['input'],
        domSnippet: sensitivePayload.domSnippet,
        intent: 'unauth',
    });
    const audit = auditNoSensitiveData(sanitized);
    console.log(`Payload sanitizado: ${JSON.stringify(sanitized)}`);
    console.log(`Fugas detectadas: ${audit.leaks.length ? audit.leaks.join(', ') : 'NONE'}`);

    console.log('\n[Resumen comparativo]');
    console.table([detSummary, jevSummary, gwSummary]);

    console.log('\n[Calibración (confidence vs correctness)]');
    for (const s of [detSummary, jevSummary, gwSummary]) {
        console.log(
            `  ${s.label.padEnd(18)} MCE=${s.calibration.mce.toFixed(3)} Brier=${s.calibration.brier.toFixed(3)} n=${s.calibration.n}`,
        );
    }

    console.log('\n[Reporte JSON reproducible]');
    console.log(JSON.stringify({ mode: USE_REAL ? 'real' : 'mock', generatedAt: new Date().toISOString(), det: detSummary, jev: jevSummary, gateway: gwSummary, privacyAudit: { leaks: audit.leaks.length } }, null, 2));
}

main().catch((e) => {
    console.error('Benchmark falló:', e);
    process.exit(1);
});