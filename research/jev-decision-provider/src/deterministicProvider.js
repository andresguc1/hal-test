/**
 * DeterministicDecisionProvider — baseline de HalTest (heurísticas).
 *
 * Aporta una decisión SIN red, SIN IA y determinista: mismos inputs -> mismos outputs.
 * Representa el comportamiento actual de auto-healing basado en reglas + ExperienceVault.
 *
 * Scoring por señales: cada candidato es evaluado y la FUERZA de su mejor señal
 * única (no la suma de todas) gobierna la confidence. Así, un match exacto e
 * inequívoco (id, data-testid, role, aria-label, texto visible) produce
 * confidence alta y decisión AUTO — igual que el comportamiento real de HalTest
 * cuando una heurística encuentra UN match claro.
 */

const SIGNAL_MAX = 10;

function signalsFor(candidate, original, dom) {
    const signals = [];
    const domStr = typeof dom === 'string' ? dom : '';

    // data-testid presente en el DOM
    const candTestId = candidate.match(/data-testid=["']([^"']+)["']/)?.[1];
    const domTestIds = [...domStr.matchAll(/data-testid=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candTestId && domTestIds.includes(candTestId)) signals.push({ s: 10, name: 'testIdExact' });

    // id (#foo) presente en el DOM
    const candId = candidate.match(/^#([\w-]+)/)?.[1];
    if (candId && (domStr.includes(`id="${candId}"`) || domStr.includes(`id='${candId}'`))) {
        signals.push({ s: 10, name: 'idExact' });
    }

    // aria-label exacto
    const candLabel = candidate.match(/\[aria-label=["']([^"']+)["']\]/)?.[1];
    const domLabel = domStr.match(/aria-label=["']([^"']+)["']/)?.[1];
    if (candLabel && domLabel && candLabel === domLabel) signals.push({ s: 9, name: 'labelExact' });

    // role
    const candRole = candidate.match(/\[role=["']([^"']+)["']\]/)?.[1];
    const domRole = domStr.match(/role=["']([^"']+)["']/)?.[1];
    if (candRole && domRole && candRole === domRole) signals.push({ s: 8, name: 'roleExact' });

    // placeholder
    const candPlaceholder = candidate.match(/\[placeholder=["']([^"']+)["']\]/)?.[1];
    const domPlaceholder = domStr.match(/placeholder=["']([^"']+)["']/)?.[1];
    if (candPlaceholder && domPlaceholder && candPlaceholder === domPlaceholder) {
        signals.push({ s: 8, name: 'placeholderExact' });
    }

    // href
    const candHref = candidate.match(/\[href=["']([^"']+)["']\]/)?.[1];
    const domHrefs = [...domStr.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candHref && domHrefs.some((h) => h === candHref)) signals.push({ s: 9, name: 'hrefExact' });

    // texto visible (has-text / text=)
    const candText = candidate.match(/has-text\(["']([^"']+)["']\)|text=([^"']+)/)?.[1]?.[0]
        || candidate.match(/has-text\(["']([^"']+)["']\)/)?.[1]
        || candidate.match(/text=([^"']+)/)?.[1];
    const domTexts = [...domStr.matchAll(/>([^<>]{1,60})</g)].map((m) => m[1].trim()).filter(Boolean);
    if (candText && domTexts.some((t) => t.includes(candText))) signals.push({ s: 7, name: 'textExact' });

    // clase css
    const candClasses = (candidate.match(/\.([\w-]+)/g) || []).map((c) => c.slice(1));
    const domClasses = (domStr.match(/class=["'][^"']*["']/g) || []).join(' ');
    if (candClasses.some((c) => domClasses.includes(c))) signals.push({ s: 5, name: 'cssClass' });

    // tag base presente (button/a/input/…)
    const candTag = candidate.match(/^([a-z][a-z0-9]*)/)?.[1];
    if (candTag && domStr.includes(`<${candTag}`)) signals.push({ s: 3, name: 'tagPresent' });

    return signals;
}

export class DeterministicDecisionProvider {
    constructor({ logger = console } = {}) {
        this.id = 'deterministic';
        this.requiresNetwork = false;
        this.logger = logger;
    }

    isAvailable() {
        return true;
    }

    async decide(ctx, question) {
        const started = Date.now();

        if (
            question.type === 'choice' &&
            (ctx.state?.task === 'selector-healing' ||
                question.instructions?.toLowerCase().includes('selector'))
        ) {
            const { candidates = [], originalSelector = '', domSnippet = '' } = ctx.state || {};

            const scored = candidates.map((candidate) => {
                const signals = signalsFor(candidate, originalSelector, domSnippet);
                const strongest = signals.reduce((m, s) => Math.max(m, s.s), 0);
                const total = signals.reduce((a, s) => a + s.s, 0);
                return { candidate, strongest, total, signals };
            });

            scored.sort((a, b) => b.strongest - a.strongest || b.total - a.total);
            const best = scored[0];

            if (!best || best.strongest === 0) {
                return {
                    value: null,
                    confidence: 0,
                    probabilities: {},
                    providerId: this.id,
                    latencyMs: Date.now() - started,
                    metadata: { reason: 'no-signal', scores: scored.map((s) => s.strongest) },
                };
            }

            // Confidence según la fuerza de la mejor señal única, escalada a 0..1.
            const confidence = Math.min(1, best.strongest / SIGNAL_MAX);
            const probabilities = Object.fromEntries(
                scored.map((s) => [
                    s.candidate,
                    s.strongest > 0 ? Math.min(0.99, s.strongest / (best.strongest + 0.5)) : 0,
                ]),
            );

            return {
                value: best.candidate,
                confidence,
                probabilities,
                providerId: this.id,
                latencyMs: Date.now() - started,
                metadata: {
                    topSignals: best.signals.map((s) => s.name),
                    all: scored.map((s) => ({ c: s.candidate, strongest: s.strongest })),
                },
            };
        }

        const stateStr = JSON.stringify(ctx.state || {}).toLowerCase();
        const gotValue = stateStr.includes('value') || stateStr.includes('input');
        return {
            value: gotValue ? 1 : 0,
            confidence: gotValue ? 0.8 : 0.2,
            providerId: this.id,
            latencyMs: Date.now() - started,
            metadata: { heuristic: 'value-presence' },
        };
    }
}