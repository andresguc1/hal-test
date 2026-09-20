/**
 * JevDecisionProvider — provider externo (TypeSafe System One).
 *
 * Usa la API REST directa (https://api.typesafe.ai/v1/systemone).
 *   - No depende de @typesafe-ai/sdk para el PoC (fetch nativo).
 *   - Requiere TYPESAFE_API_KEY en environment.
 *   - Nunca se usa sin sanitización (el gateway exige pasar ctx.state ya sanitizado).
 */

const DEFAULT_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const DEFAULT_MODEL = 'jev-latest';

export class JevDecisionProvider {
    constructor({ apiKey, endpoint = DEFAULT_ENDPOINT, model = DEFAULT_MODEL, timeoutMs = 2500, fetchImpl = fetch } = {}) {
        this.id = 'jev';
        this.requiresNetwork = true;
        this.endpoint = endpoint;
        this.model = model;
        this.timeoutMs = timeoutMs;
        this.apiKey = apiKey || process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_AI_API_KEY;
        this.fetchImpl = fetchImpl;
    }

    isAvailable() {
        return Boolean(this.apiKey);
    }

    _buildQuestion(question) {
        if (question.type === 'choice') {
            return {
                type: 'choice',
                instructions: question.instructions,
                criteria: Object.fromEntries(
                    Object.entries(question.criteria || {}).map(([k, v]) => [k, v ?? '']),
                ),
            };
        }
        if (question.type === 'score') {
            return {
                type: 'score',
                instructions: question.instructions,
                criteria: question.levels || ['1', '2', '3', '4', '5'],
            };
        }
        return {
            type: 'noul',
            instructions: question.instructions,
            criteria: {
                true: question.yesDesc || undefined,
                false: question.noDesc || undefined,
            },
        };
    }

    async decide(ctx, question) {
        if (!this.isAvailable()) {
            throw new Error('Jev provider: TYPESAFE_API_KEY not set');
        }

        const started = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const payload = {
                state: ctx.state,
                model: this.model,
                questions: {
                    [question.id]: this._buildQuestion(question),
                },
            };

            const res = await this.fetchImpl(this.endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            if (!res.ok) {
                throw new Error(`Jev API responded ${res.status} ${res.statusText}`);
            }

            const json = await res.json();
            const answer = json.answers?.[question.id];

            if (!answer) {
                throw new Error('Jev: no answer for question id');
            }

            return decisionFromResponse(this.id, question, answer, {
                latencyMs: Date.now() - started,
                metadata: { model: json.model || this.model, endToEndMs: Date.now() - started },
            });
        } finally {
            clearTimeout(timer);
        }
    }
}

function decisionFromResponse(providerId, question, answer, { latencyMs, metadata } = {}) {
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
    return {
        value: answer.noul,
        confidence: answer.noul ?? 0,
        providerId,
        latencyMs,
        metadata,
    };
}