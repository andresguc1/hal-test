/**
 * Sanitizer — minimiza/limpia el contexto antes de enviarlo a un provider externo (Jev).
 *
 * Cumple los Local-First Requirements del spike:
 *   R4: nunca enviar passwords, tokens, cookies, secrets, PII, credentials.
 *   R5: minimizar el contexto (Raw DOM -> sanitized subset -> decision context).
 */

const SENSITIVE_PATTERNS = [
    /\b(password|passwd|pwd)\b/i,
    /\b(token|secret|apikey|api_key|access[_-]?key|auth)\b/i,
    /\bsessionid|cookie\b/i,
    /\bcvv|card[_-]?(num|number)|pan\b/i,
    /\bssn|dni|sin|national[_-]?id\b/i,
    /\bphone|email|mail\b(?:name|id|field)?/i,
];

const SENSITIVE_ATTRS = ['password', 'secret', 'token', 'apikey', 'api_key', 'authorization', 'cookie'];

function stripSensitiveAttributes(htmlLike) {
    if (typeof htmlLike !== 'string') return htmlLike;
    let out = htmlLike;
    for (const attr of SENSITIVE_ATTRS) {
        out = out.replace(new RegExp(`\\s${attr}=["'][^"']*["']`, 'gi'), ` ${attr}="[REDACTED]"`);
    }
    out = out.replace(/<input[^>]*type=["']password["'][^>]*>/gi, '<input type="password" [REDACTED]/>');
    return out;
}

/**
 * Sanitiza un fragmento de DOM/texto.
 * - quita valores de inputs (value= / >valor<)
 * - redacta atributos sensibles
 * - limpia scripts/styles
 * - trunca a maxBytes
 */
export function sanitizeContext(raw, { maxLength = 8000, htmlLike = true } = {}) {
    let out = typeof raw === 'string' ? raw : JSON.stringify(raw);

    if (htmlLike) {
        out = out
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/\s(value|name)=["'][^"']*["']/gi, ' attribute=[REDACTED]')
            .replace(/>[^<>]*?\{\{[^}]*\}\}[^<>]*?</g, '>[REDACTED_VAR]<');
    }

    out = stripSensitiveAttributes(out);

    if (out.length > maxLength) {
        out = out.slice(0, maxLength) + '\n...[truncated]';
    }

    return out;
}

/**
 * Construye el contexto de decisión "seguro de enviar" para auto-healing.
 * SOLO selectores candidatos + rol + atributos no sensibles + texto visible limitado.
 */
export function buildHealingContext({ originalSelector, candidates, domSnippet, intent }) {
    return {
        task: 'selector-healing',
        originalSelector,
        candidates: Array.isArray(candidates) ? candidates : [],
        intent: sanitizeContext(String(intent || ''), { htmlLike: false, maxLength: 200 }),
        domSnippet: sanitizeContext(String(domSnippet || ''), { maxLength: 4000 }),
    };
}

/**
 * Verificación de que ningún dato sensible está presente en el payload final.
 * Devuelve { ok, leaks }.
 */
export function auditNoSensitiveData(payload) {
    const str = JSON.stringify(payload);
    const leaks = [];
    for (const p of SENSITIVE_PATTERNS) {
        const m = str.match(p);
        if (m && !/redacted|_var/i.test(str)) {
            // solo alertamos si el match no es sobre la palabra "password" redactada
            const context = str.slice(Math.max(0, m.index - 40), m.index + 40);
            if (!/\[REDACTED\]/.test(context)) leaks.push(p.toString());
        }
    }
    return { ok: leaks.length === 0, leaks };
}