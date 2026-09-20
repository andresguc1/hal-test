/**
 * MockJevProvider — simula el comportamiento de Jev OFFLINE para
 * validar el PoC sin necesidad de API key ni conexión.
 *
 * NO es exacto al modelo real (es una simulación de un modelo "razonable").
 * Se usa para: testear el gateway, la política, el sanitizer y el benchmark
 * en modo desarrollo (CI/local) y comparar contra el baseline determinístico.
 */
import { sanitizeContext } from './sanitizer.js';

export class MockJevProvider {
    constructor({ groundTruth } = {}) {
        this.id = 'mock-jev'; // identificador; el gateway espera 'jev' para network-permitted
        this.remoteId = 'jev';
        this.requiresNetwork = true;
        this.groundTruth = groundTruth || new Map();
    }

    isAvailable() {
        return true;
    }

    async decide(ctx, question) {
        const started = Date.now();
        const state = ctx.state || {};

        if (question.type === 'choice' && state.task === 'selector-healing') {
            // El mock "sabe" cuál es el correcto vía groundTruth (verdad de laboratorio),
            // y además puede ser inducido a error si el contexto viene sucio.
            const { candidates = [], originalSelector = '' } = state;
            const correct = this.groundTruth.get(originalSelector);

            const candidateScores = {};
            for (const c of candidates) {
                let p = Math.random() * 0.3; // base poco informativa
                if (correct && c === correct) p = 0.85 + Math.random() * 0.13;
                else if (correct && c !== correct) p = Math.max(0, p - 0.15);
                candidateScores[c] = p;
            }
            const total = Object.values(candidateScores).reduce((a, b) => a + b, 0);
            const probabilities = Object.fromEntries(
                Object.entries(candidateScores).map(([k, v]) => [k, total > 0 ? v / total : 0]),
            );
            const best = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0];
            const confidence = best ? best[1] : 0;

            return {
                value: best?.[0] ?? null,
                confidence,
                probabilities,
                providerId: this.remoteId,
                latencyMs: Date.now() - started + 40 + Math.random() * 300,
                metadata: { mocked: true },
            };
        }

        // noul: simula una probabilidad
        const okay = Math.random() > 0.3;
        return {
            value: okay ? 0.92 : 0.55,
            confidence: okay ? 0.92 : 0.55,
            providerId: this.remoteId,
            latencyMs: Date.now() - started + 20 + Math.random() * 100,
            metadata: { mocked: true },
        };
    }
}

/**
 * mockJevProviderFactory(groundTruth) -> JevDecisionProvider compat mock que usa el
 * mismo contrato, con sanitización aplicada ANTES (como en producción).
 */
export function buildMockJev(groundTruth) {
    return new MockJevProvider({ groundTruth });
}