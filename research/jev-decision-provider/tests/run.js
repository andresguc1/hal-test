/**
 * Tests del PoC — validan el gateway, policy, sanitizer y fallback sin red.
 * Uso: node tests/run.js
 */
import assert from 'node:assert';
import { healingCases } from '../fixtures/healing_cases.js';
import { DeterministicDecisionProvider } from '../src/deterministicProvider.js';
import { MockJevProvider } from '../src/mockJevProvider.js';
import { DecisionGateway } from '../src/decisionGateway.js';
import { applyPolicy } from '../src/policy.js';
import { buildHealingContext, auditNoSensitiveData } from '../src/sanitizer.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.error(`  ✗ ${name}: ${e.message}`);
    }
}

// 1. Deterministic provider elige el candidato correcto usando DOM signals
test('det provider acerta al menos 3/5 casos en fixtures', async function () {
    const p = new DeterministicDecisionProvider();
    let ok = 0;
    for (const c of healingCases) {
        const ctx = buildHealingContext(c);
        const d = await p.decide({ state: ctx }, {
            id: 'best_selector',
            type: 'choice',
            instructions: 'Which candidate best represents the intended element?',
            criteria: Object.fromEntries(c.candidates.map((x) => [x, null])),
        });
        if (d.value === c.correct) ok++;
    }
    assert.ok(ok >= 3, `det acertó solo ${ok}/5`);
});

// 2. Mock Jev acerta usando ground truth
test('mock jev acerta los 5 casos con ground truth', async function () {
    const gt = new Map(healingCases.map((c) => [c.originalSelector, c.correct]));
    const p = new MockJevProvider({ groundTruth: gt });
    let ok = 0;
    for (const c of healingCases) {
        const ctx = buildHealingContext(c);
        const d = await p.decide({ state: ctx }, {
            id: 'best_selector',
            type: 'choice',
            instructions: 'Which candidate best represents the intended element?',
            criteria: Object.fromEntries(c.candidates.map((x) => [x, null])),
        });
        if (d.value === c.correct) ok++;
    }
    assert.ok(ok === 5, `mock jev acertó solo ${ok}/5`);
});

// 3. Gateway en modo disabled -> solo determinístico, jamás red
test('modo disabled usa solo determinístico', async function () {
    const det = new DeterministicDecisionProvider();
    const mock = new MockJevProvider();
    const gw = new DecisionGateway({
        providers: [det, mock],
        policy: { mode: 'disabled', allowedProviders: ['deterministic', 'jev'] },
    });
    const ctx = { state: { task: 'selector-healing', candidates: ['#a', '#b'] } };
    const d = await gw.decide(ctx, { id: 'q', type: 'choice', instructions: '??', criteria: { '#a': null, '#b': null } }, { preferredProvider: 'jev' });
    assert.strictEqual(d.providerId, 'deterministic');
});

// 4. Fallback: Jev caído -> determinístico
test('gateway cae a determinístico cuando Jev falla', async function () {
    const det = new DeterministicDecisionProvider();
    const broken = { id: 'jev', requiresNetwork: true, decide: async () => { throw new Error('timeout'); } };
    const gw = new DecisionGateway({
        providers: [det, broken],
        policy: { mode: 'remote-allowed', allowedProviders: ['deterministic', 'jev'], fallbackChain: ['jev', 'deterministic'] },
    });
    const ctx = { state: { task: 'selector-healing', candidates: ['#a'], domSnippet: '<a id="a">x</a>' } };
    const d = await gw.decide(ctx, { id: 'q', type: 'choice', instructions: 'cual?', criteria: { '#a': null } });
    assert.strictEqual(d.providerId, 'deterministic');
});

// 5. Confidence policy por umbrales
test('policy: >=0.9 AUTO, 0.75-0.89 SUGGEST, <0.75 REVIEW', function () {
    assert.strictEqual(applyPolicy({ confidence: 0.95 }).action, 'AUTO');
    assert.strictEqual(applyPolicy({ confidence: 0.80 }).action, 'SUGGEST');
    assert.strictEqual(applyPolicy({ confidence: 0.60 }).action, 'HUMAN_REVIEW');
});

// 6. Sanitizer nunca deja fugas de datos sensibles
test('sanitizer redacta credenciales/cookies/tokens', function () {
    const dirty =
        '<form><input type="password" value="hunter2"><input name="token" value="abc"><input name="email" value="a@b.com"></form>';
    const clean = buildHealingContext({
        originalSelector: 'input',
        candidates: ['input'],
        domSnippet: dirty,
        intent: 'form',
    });
    const audit = auditNoSensitiveData(clean);
    assert.ok(audit.ok, `fugas: ${audit.leaks.join(', ')}`);
});

// 7. Provider determinístico es reproducible (misma salida dos veces)
test('det es reproducible', async function () {
    const p = new DeterministicDecisionProvider();
    const c = healingCases[0];
    const ctx = buildHealingContext(c);
    const q = { id: 'q', type: 'choice', instructions: 'cual?', criteria: Object.fromEntries(c.candidates.map((x) => [x, null])) };
    const d1 = await p.decide({ state: ctx }, q);
    const d2 = await p.decide({ state: ctx }, q);
    assert.strictEqual(d1.value, d2.value);
    assert.strictEqual(d1.confidence, d2.confidence);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);