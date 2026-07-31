/* global window, document, HTMLElement */
/**
 * DomProtectionEngine.js
 * Scans client-side browser context for DOM XSS sinks/sources, Prototype Pollution,
 * DOM Clobbering, missing Subresource Integrity (SRI), and cross-origin security headers.
 */

export class DomProtectionEngine {
    /**
     * Returns the JavaScript instrumentation string to be injected before page scripts load.
     * @returns {string} Client-side JavaScript code
     */
    static getInstrumentationScript() {
        return `
            (function() {
                if (window.__haltestDOMInstrumented) return;
                window.__haltestDOMInstrumented = true;
                window.__haltestDOMAlerts = [];

                // Helper to push DOM alerts safely
                function addDOMAlert(type, sink, value, stack) {
                    const alert = {
                        ruleId: type === 'prototype_pollution' ? 'SEC-DOM-PROTOPOL' : 'SEC-DOM-XSS',
                        type,
                        sink,
                        value: String(value).substring(0, 200),
                        stack: stack ? stack.split('\\n').slice(1, 6).join('\\n') : 'N/A',
                        timestamp: Date.now()
                    };
                    if (typeof window.onDOMAlert === 'function') {
                        window.onDOMAlert(alert);
                    } else {
                        window.__haltestDOMAlerts.push(alert);
                    }
                }

                // 1. Instrument DOM XSS Sinks (innerHTML, outerHTML, insertAdjacentHTML)
                try {
                    const elProto = Element.prototype;
                    
                    // innerHTML wrapper
                    const innerHTMLDesc = Object.getOwnPropertyDescriptor(elProto, 'innerHTML');
                    if (innerHTMLDesc && innerHTMLDesc.set) {
                        const originalInnerHTMLSet = innerHTMLDesc.set;
                        Object.defineProperty(elProto, 'innerHTML', {
                            set: function(val) {
                                const lowerVal = String(val).toLowerCase();
                                if (lowerVal.includes('<script') || lowerVal.includes('onerror=') || lowerVal.includes('onload=')) {
                                    addDOMAlert('dom_xss_sink', 'Element.innerHTML', val, new Error().stack);
                                }
                                return originalInnerHTMLSet.call(this, val);
                            },
                            configurable: true,
                            enumerable: true
                        });
                    }

                    // outerHTML wrapper
                    const outerHTMLDesc = Object.getOwnPropertyDescriptor(elProto, 'outerHTML');
                    if (outerHTMLDesc && outerHTMLDesc.set) {
                        const originalOuterHTMLSet = outerHTMLDesc.set;
                        Object.defineProperty(elProto, 'outerHTML', {
                            set: function(val) {
                                const lowerVal = String(val).toLowerCase();
                                if (lowerVal.includes('<script') || lowerVal.includes('onerror=') || lowerVal.includes('onload=')) {
                                    addDOMAlert('dom_xss_sink', 'Element.outerHTML', val, new Error().stack);
                                }
                                return originalOuterHTMLSet.call(this, val);
                            },
                            configurable: true,
                            enumerable: true
                        });
                    }

                    // insertAdjacentHTML wrapper
                    const originalInsertAdjacentHTML = elProto.insertAdjacentHTML;
                    elProto.insertAdjacentHTML = function(position, text) {
                        const lowerVal = String(text).toLowerCase();
                        if (lowerVal.includes('<script') || lowerVal.includes('onerror=') || lowerVal.includes('onload=')) {
                            addDOMAlert('dom_xss_sink', 'Element.insertAdjacentHTML', text, new Error().stack);
                        }
                        return originalInsertAdjacentHTML.apply(this, arguments);
                    };
                } catch (e) {
                    console.warn('[HaltestDOM] Failed to wrap DOM setters:', e.message);
                }

                // 2. Instrument document.write / document.writeln
                try {
                    const originalWrite = document.write;
                    document.write = function(str) {
                        const lowerVal = String(str).toLowerCase();
                        if (lowerVal.includes('<script') || lowerVal.includes('onerror=') || lowerVal.includes('onload=')) {
                            addDOMAlert('dom_xss_sink', 'document.write', str, new Error().stack);
                        }
                        return originalWrite.apply(document, arguments);
                    };

                    const originalWriteln = document.writeln;
                    document.writeln = function(str) {
                        const lowerVal = String(str).toLowerCase();
                        if (lowerVal.includes('<script') || lowerVal.includes('onerror=') || lowerVal.includes('onload=')) {
                            addDOMAlert('dom_xss_sink', 'document.writeln', str, new Error().stack);
                        }
                        return originalWriteln.apply(document, arguments);
                    };
                } catch (e) {
                    console.warn('[HaltestDOM] Failed to wrap document.write:', e.message);
                }

                // 3. Instrument execution sinks (eval, setTimeout/setInterval with string args, Function)
                try {
                    const originalEval = window.eval;
                    window.eval = function(code) {
                        addDOMAlert('dom_xss_sink', 'eval()', code, new Error().stack);
                        return originalEval.apply(window, arguments);
                    };

                    const originalSetTimeout = window.setTimeout;
                    window.setTimeout = function(handler, timeout, ...args) {
                        if (typeof handler === 'string') {
                            addDOMAlert('dom_xss_sink', 'setTimeout(string)', handler, new Error().stack);
                        }
                        return originalSetTimeout.apply(window, arguments);
                    };

                    const originalSetInterval = window.setInterval;
                    window.setInterval = function(handler, timeout, ...args) {
                        if (typeof handler === 'string') {
                            addDOMAlert('dom_xss_sink', 'setInterval(string)', handler, new Error().stack);
                        }
                        return originalSetInterval.apply(window, arguments);
                    };

                    const originalFunction = window.Function;
                    window.Function = function(...args) {
                        addDOMAlert('dom_xss_sink', 'new Function()', args.join(', '), new Error().stack);
                        return originalFunction.apply(this, args);
                    };
                    window.Function.prototype = originalFunction.prototype;
                } catch (e) {
                    console.warn('[HaltestDOM] Failed to wrap execution sinks:', e.message);
                }

                // 4. Instrument Prototype Pollution Mutation Observer
                try {
                    const protoDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__');
                    if (protoDescriptor && protoDescriptor.set) {
                        const originalProtoSet = protoDescriptor.set;
                        Object.defineProperty(Object.prototype, '__proto__', {
                            set: function(val) {
                                addDOMAlert('prototype_pollution', 'Object.prototype.__proto__', val, new Error().stack);
                                return originalProtoSet.call(this, val);
                            },
                            configurable: true
                        });
                    }
                } catch (e) {
                    console.warn('[HaltestDOM] Failed to instrument prototype pollution observer:', e.message);
                }
            })();
        `;
    }

    /**
     * Runs passive DOM, SRI, and Trusted Types scans on the page.
     * @param {import('playwright').Page} page
     * @returns {Promise<Array<object>>} List of DOM findings
     */
    static async auditDOM(page) {
        if (!page || page.isClosed()) return [];
        try {
            const rawDOMReport = await page.evaluate(() => {
                const alerts = window.__haltestDOMAlerts || [];
                window.__haltestDOMAlerts = []; // Flush active logs

                // 1. Scan for DOM Clobbering (implicit global overrides)
                const clobbered = [];
                const sensitiveGlobals = ['config', 'settings', 'auth', 'user', 'url'];
                for (const g of sensitiveGlobals) {
                    if (window[g] instanceof HTMLElement) {
                        clobbered.push({
                            ruleId: 'SEC-DOM-CLOBBER',
                            status: 'FAIL',
                            title: 'DOM Clobbering Alert',
                            severity: 'MEDIUM',
                            confidence: 'HIGH',
                            description: `Global variable window["${g}"] has been clobbered/overwritten by a DOM element <${window[g].tagName.toLowerCase()}>.`,
                            evidence: {
                                tagName: window[g].tagName,
                                outerHTML: window[g].outerHTML.substring(0, 150),
                            },
                            affected_resource: `window.${g}`,
                        });
                    }
                }

                // 2. Scan Subresource Integrity (SRI)
                const sriAlerts = [];
                const scripts = Array.from(document.querySelectorAll('script[src]'));

                // Helper to check if CDN resource
                const isExternal = (url) => {
                    if (!url) return false;
                    return (
                        url.startsWith('http://') ||
                        url.startsWith('https://') ||
                        url.startsWith('//')
                    );
                };

                for (const script of scripts) {
                    const src = script.getAttribute('src');
                    if (isExternal(src)) {
                        const integrity = script.getAttribute('integrity');
                        if (!integrity) {
                            sriAlerts.push({
                                ruleId: 'SEC-DOM-SRI',
                                status: 'FAIL',
                                title: 'Missing Subresource Integrity (SRI) on External Script',
                                severity: 'MEDIUM',
                                confidence: 'HIGH',
                                description: `External CDN script "${src}" is loaded without an integrity hash, exposing users to supply chain asset tempering.`,
                                evidence: { outerHTML: script.outerHTML.substring(0, 150) },
                                affected_resource: src,
                            });
                        }
                    }
                }

                // 3. Scan Trusted Types Adoptions
                const ttAlerts = [];
                const trustedTypesActive = typeof window.trustedTypes !== 'undefined';
                if (!trustedTypesActive) {
                    ttAlerts.push({
                        ruleId: 'SEC-DOM-TRUSTED',
                        status: 'FAIL',
                        title: 'Trusted Types Disabled',
                        severity: 'LOW',
                        confidence: 'HIGH',
                        description:
                            'Trusted Types policy is not enabled, exposing the application to potential DOM XSS.',
                        evidence: { trustedTypesSupport: false },
                        affected_resource: document.location.href,
                    });
                }

                return { alerts, clobbered, sriAlerts, ttAlerts };
            });

            const findings = [];

            // Add instrumented DOM XSS / Proto Pollution alerts
            for (const alert of rawDOMReport.alerts) {
                findings.push({
                    ruleId: alert.ruleId,
                    status: 'FAIL',
                    title:
                        alert.type === 'prototype_pollution'
                            ? 'Prototype Pollution Mutation Detected'
                            : 'Dangerous Call to DOM XSS Sink',
                    severity: alert.ruleId === 'SEC-DOM-PROTOPOL' ? 'HIGH' : 'HIGH',
                    confidence: 'HIGH',
                    description:
                        alert.type === 'prototype_pollution'
                            ? `A script attempted to modify the global object prototype using: "${alert.sink}"`
                            : `A script attempted to write un-sanitized script elements or event handlers into dangerous DOM sink "${alert.sink}".`,
                    evidence: { sink: alert.sink, value: alert.value, callStack: alert.stack },
                    affected_resource: page.url(),
                });
            }

            // Add Clobbered, SRI and Trusted Types alerts
            findings.push(...rawDOMReport.clobbered);
            findings.push(...rawDOMReport.sriAlerts);
            findings.push(...rawDOMReport.ttAlerts);

            return findings;
        } catch (err) {
            console.warn('[DomProtectionEngine] Passive DOM audit failed:', err.message);
            return [];
        }
    }

    /**
     * Audits HTTP response headers for Clickjacking and Content Security Policies.
     * @param {string} urlStr
     * @param {Record<string, string>} headers
     * @returns {Array<object>} List of policy findings
     */
    static auditPolicies(urlStr, headers) {
        const findings = [];
        if (!headers) return findings;

        const lowerHeaders = {};
        for (const [k, v] of Object.entries(headers)) {
            lowerHeaders[k.toLowerCase()] = String(v).toLowerCase();
        }

        // 1. CSP Strict Checks
        const csp = lowerHeaders['content-security-policy'];
        if (csp) {
            const rulesToCheck = [
                {
                    keyword: "'unsafe-inline'",
                    desc: "Allows inline script execution ('unsafe-inline')",
                },
                {
                    keyword: "'unsafe-eval'",
                    desc: "Allows dynamic execution engines ('unsafe-eval')",
                },
            ];

            for (const rule of rulesToCheck) {
                if (csp.includes('script-src') && csp.includes(rule.keyword)) {
                    findings.push({
                        ruleId: 'SEC-HDR-CSP',
                        status: 'FAIL',
                        title: 'Insecure Directives in Content Security Policy (CSP)',
                        severity: 'HIGH',
                        confidence: 'HIGH',
                        description: `Content Security Policy script-src directive contains "${rule.keyword}", weakening browser XSS defenses.`,
                        evidence: { csp },
                        affected_resource: urlStr,
                    });
                }
            }
        }

        // 2. Clickjacking Frame-Ancestors Checks (CSP vs XFO)
        const xfo = lowerHeaders['x-frame-options'];
        const frameAncestorsPresent = csp && csp.includes('frame-ancestors');

        if (!xfo && !frameAncestorsPresent) {
            findings.push({
                ruleId: 'SEC-HDR-XFO',
                status: 'FAIL',
                title: 'Clickjacking Protection Missing',
                severity: 'MEDIUM',
                confidence: 'HIGH',
                description:
                    'Neither X-Frame-Options header nor Content-Security-Policy frame-ancestors directive is configured to prevent page framing.',
                evidence: { headers: Object.keys(headers) },
                affected_resource: urlStr,
            });
        }

        // 3. Cross-Origin Policies Audits (CORP, COOP, COEP)
        const coop = lowerHeaders['cross-origin-opener-policy'];

        if (!coop) {
            findings.push({
                ruleId: 'SEC-DOM-TRUSTED', // Map to policy rule category
                status: 'FAIL',
                title: 'Missing Cross-Origin Opener Policy (COOP)',
                severity: 'LOW',
                confidence: 'HIGH',
                description:
                    'Cross-Origin-Opener-Policy (COOP) header is missing, failing to isolate browsing contexts from untrusted domains.',
                evidence: { url: urlStr },
                affected_resource: urlStr,
            });
        }

        return findings;
    }
}
