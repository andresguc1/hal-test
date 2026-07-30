import * as cheerio from 'cheerio';

export class AppConfigValidator {
    /**
     * Audit HTTP response headers and cookies captured during execution.
     * @param {object} params
     * @param {string} params.targetUrl
     * @param {object} params.headers - Map of response headers (lowercase keys)
     * @param {Array} params.cookies - Array of cookie objects from Playwright context
     * @param {string} [params.htmlBody] - Raw HTML body for fast passive DOM inspection
     * @returns {Array} List of audit results for App Config rules
     */
    static validate({ targetUrl, headers = {}, cookies = [], htmlBody = null }) {
        const results = [];
        const h = headers || {};

        // 1. CSP Header
        const csp = h['content-security-policy'];
        if (!csp) {
            results.push({
                ruleId: 'SEC-HDR-CSP',
                status: 'FAIL',
                title: 'Content Security Policy (CSP) Missing',
                description: `Target ${targetUrl} did not provide a Content-Security-Policy header.`,
                evidence: { headerFound: false },
                recommendation:
                    "Configure a strict Content Security Policy header (e.g., default-src 'self').",
            });
        } else {
            const isUnsafe = csp.includes('unsafe-inline') || csp.includes('unsafe-eval');
            results.push({
                ruleId: 'SEC-HDR-CSP',
                status: isUnsafe ? 'WARNING' : 'PASS',
                title: isUnsafe
                    ? 'CSP Contains Unsafe Directives'
                    : 'Content Security Policy (CSP) Present',
                description: isUnsafe
                    ? `CSP header contains unsafe directives (unsafe-inline / unsafe-eval).`
                    : `CSP header verified: ${csp.substring(0, 100)}...`,
                evidence: { headerFound: true, value: csp },
                recommendation: 'Avoid unsafe-inline and unsafe-eval directives in CSP.',
            });
        }

        // 2. HSTS Header
        const hsts = h['strict-transport-security'];
        if (!hsts) {
            results.push({
                ruleId: 'SEC-HDR-HSTS',
                status: 'FAIL',
                title: 'Strict-Transport-Security (HSTS) Missing',
                description: `Target ${targetUrl} does not enforce HSTS.`,
                evidence: { headerFound: false },
                recommendation:
                    'Add Strict-Transport-Security: max-age=31536000; includeSubDomains header.',
            });
        } else {
            results.push({
                ruleId: 'SEC-HDR-HSTS',
                status: 'PASS',
                title: 'Strict-Transport-Security (HSTS) Configured',
                description: `HSTS header verified: ${hsts}`,
                evidence: { headerFound: true, value: hsts },
                recommendation: 'Maintain long max-age values (e.g., 31536000).',
            });
        }

        // 3. X-Frame-Options
        const xfo = h['x-frame-options'];
        if (
            !xfo ||
            (!xfo.toLowerCase().includes('deny') && !xfo.toLowerCase().includes('sameorigin'))
        ) {
            results.push({
                ruleId: 'SEC-HDR-XFO',
                status: 'FAIL',
                title: 'Clickjacking Protection Missing or Weak',
                description: `X-Frame-Options is missing or set to insecure value: ${xfo || 'N/A'}.`,
                evidence: { value: xfo || null },
                recommendation: 'Set X-Frame-Options: DENY or SAMEORIGIN.',
            });
        } else {
            results.push({
                ruleId: 'SEC-HDR-XFO',
                status: 'PASS',
                title: 'X-Frame-Options Correctly Configured',
                description: `X-Frame-Options header verified: ${xfo}`,
                evidence: { value: xfo },
                recommendation: 'Keep clickjacking protection enabled.',
            });
        }

        // 4. X-Content-Type-Options
        const xcto = h['x-content-type-options'];
        if (!xcto || xcto.toLowerCase() !== 'nosniff') {
            results.push({
                ruleId: 'SEC-HDR-XCTO',
                status: 'FAIL',
                title: 'MIME Sniffing Protection (nosniff) Missing',
                description: `X-Content-Type-Options is missing or not set to 'nosniff'.`,
                evidence: { value: xcto || null },
                recommendation: 'Set X-Content-Type-Options: nosniff header.',
            });
        } else {
            results.push({
                ruleId: 'SEC-HDR-XCTO',
                status: 'PASS',
                title: 'X-Content-Type-Options Verified',
                description: `MIME-sniffing protection enabled (nosniff).`,
                evidence: { value: xcto },
                recommendation: 'Maintain nosniff header.',
            });
        }

        // 5. CORS Check
        const corsOrigin = h['access-control-allow-origin'];
        const corsCreds = h['access-control-allow-credentials'];
        if (corsOrigin === '*' && corsCreds === 'true') {
            results.push({
                ruleId: 'SEC-HDR-CORS',
                status: 'FAIL',
                title: 'Insecure CORS Wildcard with Credentials',
                description:
                    'Access-Control-Allow-Origin is set to * while allow-credentials is true.',
                evidence: { origin: corsOrigin, credentials: corsCreds },
                recommendation: 'Restrict Access-Control-Allow-Origin to specific trusted domains.',
            });
        } else {
            results.push({
                ruleId: 'SEC-HDR-CORS',
                status: 'PASS',
                title: 'CORS Policy Check Passed',
                description: 'CORS policy does not expose wildcard credentials.',
                evidence: { origin: corsOrigin || 'default', credentials: corsCreds || 'false' },
                recommendation: 'Ensure strict origin validation.',
            });
        }

        // 6. Cookie Flags
        if (cookies && cookies.length > 0) {
            let missingHttpOnly = false;
            let missingSecure = false;

            cookies.forEach((c) => {
                if (!c.httpOnly) missingHttpOnly = true;
                if (!c.secure) missingSecure = true;
            });

            if (missingHttpOnly) {
                results.push({
                    ruleId: 'SEC-CK-HTTPONLY',
                    status: 'FAIL',
                    title: 'Session Cookie Missing HttpOnly Flag',
                    description:
                        'One or more active cookies lack the HttpOnly flag, making them accessible to JS.',
                    evidence: {
                        cookies: cookies.map((c) => ({ name: c.name, httpOnly: c.httpOnly })),
                    },
                    recommendation: 'Mark sensitive session cookies as HttpOnly.',
                });
            } else {
                results.push({
                    ruleId: 'SEC-CK-HTTPONLY',
                    status: 'PASS',
                    title: 'Cookie HttpOnly Flag Verified',
                    description: 'All session cookies enforce HttpOnly protection.',
                    evidence: { totalCookies: cookies.length },
                    recommendation: 'Maintain HttpOnly flag enforcement.',
                });
            }

            if (missingSecure) {
                results.push({
                    ruleId: 'SEC-CK-SECURE',
                    status: 'FAIL',
                    title: 'Session Cookie Missing Secure Flag',
                    description:
                        'One or more cookies lack the Secure flag and can be transmitted over HTTP.',
                    evidence: { cookies: cookies.map((c) => ({ name: c.name, secure: c.secure })) },
                    recommendation: 'Mark all cookies as Secure.',
                });
            } else {
                results.push({
                    ruleId: 'SEC-CK-SECURE',
                    status: 'PASS',
                    title: 'Cookie Secure Flag Verified',
                    description: 'All cookies enforce Secure transport.',
                    evidence: { totalCookies: cookies.length },
                    recommendation: 'Keep Secure flag active.',
                });
            }
        }

        // 7. Fast Passive Cheerio HTML Inspection
        if (htmlBody && typeof htmlBody === 'string') {
            try {
                const $ = cheerio.load(htmlBody);

                // Check for javascript: links or inline event handlers
                const inlineScriptEvents = [];
                $('[onload], [onerror], [onclick], a[href^="javascript:"]').each((_, elem) => {
                    const tag = elem.tagName;
                    const href = $(elem).attr('href');
                    const onclick = $(elem).attr('onclick');
                    inlineScriptEvents.push({ tag, href, onclick });
                });

                if (inlineScriptEvents.length > 0) {
                    results.push({
                        ruleId: 'SEC-DOM-INLINE-EVENTS',
                        status: 'WARNING',
                        title: 'Inline Event Handlers / Pseudo-Protocols Detected',
                        description: `Found ${inlineScriptEvents.length} HTML element(s) with inline JS event handlers or javascript: hrefs.`,
                        evidence: {
                            count: inlineScriptEvents.length,
                            sample: inlineScriptEvents.slice(0, 3),
                        },
                        recommendation: 'Refactor inline DOM events into external event listeners.',
                    });
                }
            } catch (err) {
                console.warn('[AppConfigValidator] Cheerio parsing notice:', err.message);
            }
        }

        return results;
    }
}
