/**
 * SelectorRanker — motor determinístico de candidatos para auto-healing.
 *
 * Sustituye la delegación ciega al LLM por un ranking local de candidatos:
 *   1. Genera candidatos desde el DOM comprimido (si no se proveen).
 *   2. Puntúa cada candidato por la fuerza de su MEJOR señal semántica
 *      (data-testid > aria-label > id > role > placeholder > href > texto > clase > tag).
 *   3. Detecta ambigüedad (la señal gana match en >1 aparición del DOM).
 *
 * Toda la lógica es pura y determinista: mismos inputs -> mismos outputs. Sin red,
 * sin LLM. La confidence producida aquí es el insumo de DecisionPolicy (F2).
 */
const SIGNAL_MAX = 10;

/**
 * Normaliza el DOM comprimido de HalTest (formato pipe, producido por
 * getCompressionScript: `ref:0|tag:button|id:login|testId:login-btn|aria:Login|role:button|text:Login`)
 * a pseudo-HTML para que las regex de señales funcionen de forma unificada.
 * Si el DOM ya parece HTML (contiene '=' y '<'), se devuelve tal cual.
 * @param {string} dom
 * @returns {string}
 */
export function normalizeDom(dom) {
    const raw = typeof dom === 'string' ? dom : String(dom || '');
    const hasPipeFields = /\|(?:id|testId|aria|role|tag):/.test(raw);
    if (!hasPipeFields) return raw;

    let html = raw;
    html = html.replace(/\|testId:([^|\n]*)\|?/g, ' data-testid="$1"');
    html = html.replace(/\|id:([^|\n]*)\|?/g, ' id="$1"');
    html = html.replace(/\|aria:([^|\n]*)\|?/g, ' aria-label="$1"');
    html = html.replace(/\|role:([^|\n]*)\|?/g, ' role="$1"');
    html = html.replace(/\|tag:([^|\n]*)\|?/g, ' <$1 ');
    const textSegments = [...html.matchAll(/\|text:([^|\n]*)\|?/g)].map((m) => m[1]);
    html = html.replace(/\|text:[^|\n]*\|?/g, '');
    for (const t of textSegments) {
        html += `<span>${t}</span>`;
    }
    return html;
}

/**
 * Extrae las señales de un candidato contra el snippet de DOM comprimido.
 * Cada señal lleva `name` (etiqueta) y `count` (número de matches en el DOM).
 * Acepta tanto HTML como formato pipe de HalTest (normalizado internamente).
 * @param {string} candidate
 * @param {string} originalSelector
 * @param {string} dom
 * @returns {Array<{ name: string, s: number, count: number }>}
 */
export function signalsFor(candidate, original, dom) {
    const signals = [];
    const domStr = normalizeDom(dom);

    // data-testid presente en el DOM
    const candTestId = candidate.match(/data-testid=["']([^"']+)["']/)?.[1];
    const domTestIds = [...domStr.matchAll(/data-testid=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candTestId && domTestIds.includes(candTestId)) {
        signals.push({
            name: 'testIdExact',
            s: 10,
            count: domTestIds.filter((t) => t === candTestId).length,
        });
    }

    // id (#foo) presente en el DOM
    const candId = candidate.match(/^#([\w-]+)/)?.[1];
    const domIds = [...domStr.matchAll(/id=["']([\w-]+)["']/g)].map((m) => m[1]);
    if (candId && domIds.includes(candId)) {
        signals.push({ name: 'idExact', s: 10, count: domIds.filter((i) => i === candId).length });
    }

    // aria-label exacto
    const candLabel = candidate.match(/\[aria-label=["']([^"']+)["']\]/)?.[1];
    const domLabels = [...domStr.matchAll(/aria-label=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candLabel && domLabels.includes(candLabel)) {
        signals.push({
            name: 'labelExact',
            s: 9,
            count: domLabels.filter((l) => l === candLabel).length,
        });
    }

    // role
    const candRole = candidate.match(/\[role=["']([^"']+)["']\]/)?.[1];
    const domRoles = [...domStr.matchAll(/role=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candRole && domRoles.includes(candRole)) {
        signals.push({
            name: 'roleExact',
            s: 8,
            count: domRoles.filter((r) => r === candRole).length,
        });
    }

    // name
    const candName = candidate.match(/\[name=["']([^"']+)["']\]/)?.[1];
    const domNames = [...domStr.matchAll(/name=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candName && domNames.includes(candName)) {
        signals.push({
            name: 'nameExact',
            s: 8,
            count: domNames.filter((n) => n === candName).length,
        });
    }

    // placeholder
    const candPlaceholder = candidate.match(/\[placeholder=["']([^"']+)["']\]/)?.[1];
    const domPlaceholders = [...domStr.matchAll(/placeholder=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candPlaceholder && domPlaceholders.includes(candPlaceholder)) {
        signals.push({
            name: 'placeholderExact',
            s: 8,
            count: domPlaceholders.filter((p) => p === candPlaceholder).length,
        });
    }

    // href
    const candHref = candidate.match(/\[href=["']([^"']+)["']\]/)?.[1];
    const domHrefs = [...domStr.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]);
    if (candHref && domHrefs.includes(candHref)) {
        signals.push({
            name: 'hrefExact',
            s: 9,
            count: domHrefs.filter((h) => h === candHref).length,
        });
    }

    // texto visible (has-text / text=)
    const candText =
        candidate.match(/has-text\(["']([^"']+)["']\)/)?.[1] ||
        candidate.match(/text=([^"']+)/)?.[1];
    const domTexts = [...domStr.matchAll(/>([^<>]{1,80})</g)]
        .map((m) => m[1].trim())
        .filter(Boolean);
    if (candText && domTexts.some((t) => t.includes(candText))) {
        signals.push({
            name: 'textExact',
            s: 7,
            count: domTexts.filter((t) => t.includes(candText)).length,
        });
    }

    // clase css
    const candClasses = (candidate.match(/\.([\w-]+)/g) || []).map((c) => c.slice(1));
    if (candClasses.length > 0) {
        signals.push({ name: 'cssClass', s: 5, count: 1 });
    }

    // tag base presente (button/a/input/…)
    const candTag = candidate.match(/^([a-z][a-z0-9]*)/)?.[1];
    if (candTag && domStr.includes(`<${candTag}`)) {
        const tagCount = (domStr.match(new RegExp(`<${candTag}[\\s>]`, 'g')) || []).length;
        signals.push({ name: 'tagPresent', s: 3, count: Math.max(1, tagCount) });
    }

    return signals;
}

/**
 * Genera candidatos a partir del snippet de DOM comprimido.
 * Orden de prioridad semántica: data-testid > aria-label > id > role > name > placeh holder.
 * @param {string} dom
 * @returns {string[]}
 */
export function generateCandidates(dom) {
    const candidates = [];
    const seen = new Set();
    const push = (sel) => {
        if (sel && !seen.has(sel)) {
            seen.add(sel);
            candidates.push(sel);
        }
    };

    const domStr = normalizeDom(dom);

    const testIds = [...domStr.matchAll(/data-testid=["']([^"']+)["']/g)].map((m) => m[1]);
    for (const t of testIds) push(`[data-testid="${t}"]`);

    const labels = [...domStr.matchAll(/aria-label=["']([^"']+)["']/g)].map((m) => m[1]);
    for (const l of labels) push(`[aria-label="${l}"]`);

    const ids = [...domStr.matchAll(/id=["']([\w-]+)["']/g)].map((m) => m[1]);
    for (const i of ids) push(`#${i}`);

    const roles = [...domStr.matchAll(/role=["']([^"']+)["']/g)].map((m) => m[1]);
    for (const r of roles) push(`[role="${r}"]`);

    const names = [...domStr.matchAll(/name=["']([^"']+)["']/g)].map((m) => m[1]);
    for (const n of names) push(`[name="${n}"]`);

    const placeholders = [...domStr.matchAll(/placeholder=["']([^"']+)["']/g)].map((m) => m[1]);
    for (const p of placeholders) push(`[placeholder="${p}"]`);

    const texts = [...domStr.matchAll(/>([^<>]{1,50})</g)]
        .map((m) => m[1].trim())
        .filter((t) => t.length > 0);
    for (const t of texts) push(`text=${t}`);

    return candidates;
}

/**
 * Computa la confidence de un set de señales antes de aplicar ambigüedad.
 * Base: señal más fuerte escalada a 0..1 (portado del PoC determinístico).
 * @param {Array<{name:string,s:number,count:number}>} signals
 * @returns {number}
 */
export function baseConfidence(signals) {
    const strongest = signals.reduce((m, s) => Math.max(m, s.s), 0);
    return Math.min(1, strongest / SIGNAL_MAX);
}

/**
 * Penaliza la confidence si la señal ganadora hace match múltiple en el DOM.
 * La ambigüedad se refleja también en el resultado final.
 * @param {number} base
 * @param {Array<{name:string,s:number,count:number}>} signals
 * @returns {{ confidence: number, ambiguity: boolean }}
 */
export function applyAmbiguity(base, signals) {
    const top = signals.reduce((a, b) => (b.s > a.s ? b : a), signals[0] || { s: 0, count: 0 });
    if (!top) return { confidence: 0, ambiguity: false };
    if (top.count > 1) {
        return { confidence: Math.max(0.2, base - 0.3), ambiguity: true };
    }
    return { confidence: base, ambiguity: false };
}

/**
 * Pesos de proximidad semántica entre el candidato y el selector original fallido.
 * Refleja "¿el candidato sigue buscando el MISMO elemento?" sin red ni DOM completo:
 * señales textuales/id/testId compartidas con el original aumentan la confidence
 * (bounded a 0..1).
 * @param {string} candidate
 * @param {string} originalSelector
 * @returns {number} factor multiplicativo (0.9 = castigo por no relación, 1.0 = neutro, 1.15 = relación fuerte)
 */
export function proximityWeight(candidate, originalSelector = '') {
    if (!originalSelector) return 1.0;
    const cand = String(candidate || '');
    const orig = String(originalSelector);

    const idOf = (sel) => sel.match(/^#([\w-]+)/)?.[1];
    const textOf = (sel) =>
        sel.match(/has-text\(["']([^"']+)["']\)/)?.[1] || sel.match(/text=([^"']+)/)?.[1];
    const testIdOf = (sel) => sel.match(/data-testid=["']([^"']+)["']/)?.[1];
    const attrOf = (sel, attr) => sel.match(new RegExp(`${attr}=["']([^"']+)["']`))?.[1];

    let shared = 0;
    if (idOf(cand) && idOf(cand) === idOf(orig)) shared += 3;
    if (testIdOf(cand) && testIdOf(cand) === testIdOf(orig)) shared += 3;
    if (textOf(cand) && textOf(cand) === textOf(orig)) shared += 2;
    for (const attr of ['name', 'aria-label', 'placeholder', 'role']) {
        if (attrOf(cand, attr) && attrOf(cand, attr) === attrOf(orig, attr)) shared += 1;
    }

    if (shared >= 3) return 1.15;
    if (shared >= 1) return 1.05;
    return 0.9;
}

/**
 * Rankea candidatos para auto-healing.
 * @param {Object} opts
 * @param {string} opts.domSnippet - DOM comprimido.
 * @param {string} [opts.originalSelector] - selector que falló (solo contexto).
 * @param {string[]} [opts.candidates] - candidatos; si no se pasan, se generan del DOM.
 * @returns {Array<{ selector: string, confidence: number, ambiguity: boolean, signals: string[], reason: string }>}
 */
export function rankCandidates({ domSnippet = '', originalSelector = '', candidates = null } = {}) {
    const dom = typeof domSnippet === 'string' ? domSnippet : String(domSnippet || '');
    const pool =
        Array.isArray(candidates) && candidates.length > 0 ? candidates : generateCandidates(dom);

    const ranked = pool
        .map((selector) => {
            const cand = String(selector).trim();
            const signals = signalsFor(cand, originalSelector, dom);
            const strongest = signals.reduce((m, s) => Math.max(m, s.s), 0);
            const { confidence: base, ambiguity } = applyAmbiguity(
                baseConfidence(signals),
                signals,
            );

            // F1: confidence calibrada = señal × unicidad × proximidad al selector original.
            const confidence =
                Math.round(Math.min(1, base * proximityWeight(cand, originalSelector)) * 100) / 100;

            let reason = 'no-signal';
            if (strongest > 0) reason = ambiguity ? 'weak-multi-match' : 'strong-single-match';

            return {
                selector: cand,
                confidence,
                ambiguity,
                signals: signals.map((s) => s.name),
                reason,
                _strongest: strongest,
            };
        })
        .sort(
            (a, b) =>
                b.confidence - a.confidence ||
                b._strongest - a._strongest ||
                a.selector.localeCompare(b.selector),
        )
        .map(({ _strongest, ...rest }) => rest);

    return ranked;
}

/**
 * Elige el mejor candidato (o null) según ranking y política de base.
 * @param {Object} opts - mismos fields que rankCandidates.
 * @returns {{ selector: string|null, confidence: number, ambiguity: boolean, reason: string, ranked: Array }}
 */
export function bestSelector(opts = {}) {
    const ranked = rankCandidates(opts);
    const best = ranked[0];
    if (!best || best.reason === 'no-signal') {
        return { selector: null, confidence: 0, ambiguity: false, reason: 'no-signal', ranked };
    }
    return {
        selector: best.selector,
        confidence: best.confidence,
        ambiguity: best.ambiguity,
        reason: best.reason,
        ranked,
    };
}

const SelectorRanker = {
    rankCandidates,
    bestSelector,
    generateCandidates,
    signalsFor,
    baseConfidence,
    applyAmbiguity,
    proximityWeight,
};

export default SelectorRanker;
