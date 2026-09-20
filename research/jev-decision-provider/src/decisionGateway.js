/**
 * DecisionGateway — abstracción candidata para HalTest.
 *
 * Este PoC es 100% independiente del backend de HalTest. SOLO valida
 * la viabilidad de la abstracción DecisionProvider + política de confidence.
 *
 * Definición de contrato (la que HalTest adoptaría si se implementa):
 *
 *   DecisionProvider.decide(ctx, question) -> Promise<Decision>
 */

export const DECISION_TYPES = ['choice', 'score', 'noul'];

export const PROVIDER_IDS = ['deterministic', 'local', 'jev'];

export const POLICY_MODES = ['disabled', 'local-only', 'local-first', 'remote-allowed'];

/**
 * Política sugerida (hipótesis, NO validada todavía).
 * El PoC la mide; no asumimos que 0.90/0.75 son correctos.
 */
export const DEFAULT_POLICY = {
    mode: 'remote-allowed',
    allowedProviders: ['deterministic', 'jev'],
    minConfidenceAuto: 0.9,
    minConfidenceSuggest: 0.75,
    timeoutMs: 2500,
    fallbackChain: ['jev', 'deterministic'],
};

/**
 * Gateway: orquesta providers según política.
 * - modo disabled       -> solo determinístico, sin red.
 * - local-only          -> solo determinístico + local (Ollama), sin red.
 * - local-first         -> local primero, Jev solo si el usuario lo habilitó.
 * - remote-allowed      -> Jev permitido (con sanitización obligatoria).
 *
 * Regla base: la decisión final la toma HalTest (policy), no el modelo.
 */
export class DecisionGateway {
    constructor({ providers, policy = DEFAULT_POLICY, logger = console } = {}) {
        this.providers = providers || [];
        this.policy = { ...DEFAULT_POLICY, ...policy };
        this.logger = logger;
        this.decisions = []; // auditoría local del PoC
    }

    _hasNetworkPermission() {
        return (
            this.policy.mode === 'remote-allowed' ||
            this.policy.mode === 'local-first'
        );
    }

    _resolveChain(primaryId) {
        // Construye el orden de fallback empezando por el provider primario solicitado.
        const chain = [];
        for (const id of this.policy.fallbackChain) {
            if (!chain.includes(id)) chain.push(id);
        }
        if (primaryId && !chain.includes(primaryId)) chain.unshift(primaryId);
        // El determinístico SIEMPRE es el último refugio si está permitido.
        if (this.policy.allowedProviders.includes('deterministic') && !chain.includes('deterministic')) {
            chain.push('deterministic');
        }
        return chain.filter((id) => this.policy.allowedProviders.includes(id));
    }

    async decide(ctx, question, { preferredProvider = 'deterministic' } = {}) {
        // Most common fields available.
        if (this.policy.mode === 'disabled') {
            const det = this.providers.find((p) => p.id === 'deterministic');
            if (!det) throw new Error('No deterministic provider configured');
            const decision = await det.decide(ctx, question);
            this._record(decision);
            return decision;
        }

        const chain = this._resolveChain(preferredProvider);
        let lastError = null;

        for (const providerId of chain) {
            const provider = this.providers.find((p) => p.id === providerId);
            if (!provider) continue;

            // Un provider externo requiere permiso de red.
            if (provider.requiresNetwork && !this._hasNetworkPermission()) continue;

            try {
                const decision = await provider.decide(ctx, question);
                this._record(decision);
                return decision;
            } catch (err) {
                lastError = err;
                this.logger.warn?.(`[DecisionGateway] provider=${providerId} falló: ${err.message}`);
            }
        }

        throw lastError || new Error('No decision provider available');
    }

    _record(decision) {
        this.decisions.push({
            ...decision,
            ts: Date.now(),
        });
        if (this.decisions.length > 1000) this.decisions.shift();
    }

    audit() {
        return this.decisions;
    }
}

export function decisionFromAnswer(providerId, question, answer, { latencyMs, metadata } = {}) {
    if (question.type === 'choice') {
        return {
            value: answer.choice,
            confidence: answer.confidence ?? answer.probabilities?.[answer.choice] ?? 0,
            probabilities: answer.probabilities,
            providerId,
            latencyMs,
            metadata,
        };
    }
    if (question.type === 'score') {
        return {
            value: answer.score,
            confidence: answer.confidence ?? 0,
            probabilities: answer.probabilities,
            providerId,
            latencyMs,
            metadata,
        };
    }
    // noul
    return {
        value: answer.noul,
        confidence: answer.noul ?? 0, // noul IS the probability
        providerId,
        latencyMs,
        metadata,
    };
}