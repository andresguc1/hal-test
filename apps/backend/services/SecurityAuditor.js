/* global document */
import { URL } from 'url';

export class SecurityAuditor {
    /**
     * Enriches a security alert with OWASP Top 10 category, CVSS score and CVSS vector.
     * @param {object} alert
     * @returns {object} enriched alert
     */
    static enrichAlert(alert) {
        if (!alert) return alert;

        const metadata = {
            'csp-missing-header': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 7.5,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
            },
            'csp-insecure-directive': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 5.4,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N',
            },
            'hsts-missing-header': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 5.3,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N',
            },
            'xfo-missing-header': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 5.0,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N',
            },
            'xfo-insecure-value': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 3.7,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:N/I:L/A:N',
            },
            'xcto-missing-header': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 3.7,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N',
            },
            'xcto-insecure-value': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 3.7,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N',
            },
            'cors-wildcard-credentials': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 8.1,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N',
            },
            'cookie-missing-secure': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 5.3,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N',
            },
            'cookie-missing-httponly': {
                owasp: 'A01:2021-Broken Access Control',
                cvss: 5.3,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N',
            },
            'cookie-missing-samesite': {
                owasp: 'A01:2021-Broken Access Control',
                cvss: 3.7,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:N/I:L/A:N',
            },
            'cookie-samesite-none-insecure': {
                owasp: 'A01:2021-Broken Access Control',
                cvss: 6.5,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N',
            },
            'csp-console-violation': {
                owasp: 'A03:2021-Injection',
                cvss: 8.2,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N',
            },
            'mixed-content-warning': {
                owasp: 'A05:2021-Security Misconfiguration',
                cvss: 4.3,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N',
            },
            'dom-inline-event': {
                owasp: 'A03:2021-Injection',
                cvss: 6.1,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
            },
            'dom-javascript-uri': {
                owasp: 'A03:2021-Injection',
                cvss: 6.1,
                cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
            },
            'dom-password-autocomplete': {
                owasp: 'A07:2021-Identification and Authentication Failures',
                cvss: 3.1,
                cvssVector: 'CVSS:3.1/AV:P/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N',
            },
            'dom-insecure-form-action': {
                owasp: 'A02:2021-Cryptographic Failures',
                cvss: 7.4,
                cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N',
            },
        };

        const meta = metadata[alert.ruleId] || {
            owasp: 'A05:2021-Security Misconfiguration',
            cvss:
                alert.severity === 'critical'
                    ? 9.0
                    : alert.severity === 'high'
                      ? 7.5
                      : alert.severity === 'medium'
                        ? 5.0
                        : 3.0,
            cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
        };

        return {
            ...alert,
            owasp: meta.owasp,
            cvss: meta.cvss,
            cvssVector: meta.cvssVector,
        };
    }

    /**
     * Audits response headers for security issues.
     * @param {string} urlStr
     * @param {Record<string, string>} headers
     * @returns {Array<object>} array of security alerts
     */
    static auditHeaders(urlStr, headers) {
        const alerts = [];
        if (!urlStr || !headers) return alerts;

        let parsedUrl;
        try {
            parsedUrl = new URL(urlStr);
        } catch (e) {
            return alerts;
        }

        const lowerHeaders = {};
        for (const [k, v] of Object.entries(headers)) {
            lowerHeaders[k.toLowerCase()] = String(v).toLowerCase();
        }

        const isHttps = parsedUrl.protocol === 'https:';

        // 1. Content-Security-Policy (CSP)
        const csp = lowerHeaders['content-security-policy'];
        if (!csp) {
            alerts.push({
                ruleId: 'csp-missing-header',
                severity: 'high',
                message: 'Content-Security-Policy (CSP) header is missing.',
                evidence: { url: urlStr },
            });
        } else {
            // Check for unsafe-inline or unsafe-eval in script-src
            if (
                csp.includes('script-src') &&
                (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'"))
            ) {
                alerts.push({
                    ruleId: 'csp-insecure-directive',
                    severity: 'medium',
                    message:
                        "Content-Security-Policy contains 'unsafe-inline' or 'unsafe-eval' in script-src.",
                    evidence: { csp },
                });
            }
        }

        // 2. Strict-Transport-Security (HSTS)
        if (isHttps) {
            const hsts = lowerHeaders['strict-transport-security'];
            if (!hsts) {
                alerts.push({
                    ruleId: 'hsts-missing-header',
                    severity: 'medium',
                    message:
                        'Strict-Transport-Security (HSTS) header is missing on HTTPS response.',
                    evidence: { url: urlStr },
                });
            }
        }

        // 3. X-Frame-Options
        const xfo = lowerHeaders['x-frame-options'];
        if (!xfo) {
            alerts.push({
                ruleId: 'xfo-missing-header',
                severity: 'medium',
                message: 'X-Frame-Options header is missing (clickjacking protection).',
                evidence: { url: urlStr },
            });
        } else if (xfo !== 'deny' && xfo !== 'sameorigin') {
            alerts.push({
                ruleId: 'xfo-insecure-value',
                severity: 'low',
                message: `X-Frame-Options has insecure value: "${xfo}".`,
                evidence: { 'x-frame-options': xfo },
            });
        }

        // 4. X-Content-Type-Options
        const xcto = lowerHeaders['x-content-type-options'];
        if (!xcto) {
            alerts.push({
                ruleId: 'xcto-missing-header',
                severity: 'low',
                message: 'X-Content-Type-Options header is missing.',
                evidence: { url: urlStr },
            });
        } else if (xcto !== 'nosniff') {
            alerts.push({
                ruleId: 'xcto-insecure-value',
                severity: 'low',
                message: `X-Content-Type-Options is set to "${xcto}" instead of "nosniff".`,
                evidence: { 'x-content-type-options': xcto },
            });
        }

        // 5. Access-Control-Allow-Origin (CORS wildcard with credentials)
        const acao = lowerHeaders['access-control-allow-origin'];
        const acac = lowerHeaders['access-control-allow-credentials'];
        if (acao === '*' && acac === 'true') {
            alerts.push({
                ruleId: 'cors-wildcard-credentials',
                severity: 'high',
                message:
                    'Access-Control-Allow-Origin is set to wildcard "*" while allowing credentials.',
                evidence: {
                    'access-control-allow-origin': acao,
                    'access-control-allow-credentials': acac,
                },
            });
        }

        return alerts.map(SecurityAuditor.enrichAlert);
    }

    /**
     * Audits cookies for missing security attributes.
     * @param {string} urlStr
     * @param {Array<string> | string} cookieHeaderOrArray
     * @returns {Array<object>} array of security alerts
     */
    static auditCookies(urlStr, cookieHeaderOrArray) {
        const alerts = [];
        if (!urlStr || !cookieHeaderOrArray) return alerts;

        let parsedUrl;
        try {
            parsedUrl = new URL(urlStr);
        } catch (e) {
            return alerts;
        }

        const isHttps = parsedUrl.protocol === 'https:';

        let cookieStrings = [];
        if (Array.isArray(cookieHeaderOrArray)) {
            cookieStrings = cookieHeaderOrArray;
        } else if (typeof cookieHeaderOrArray === 'string') {
            // Split by comma if Set-Cookie header is concatenated, or semicolon
            cookieStrings = cookieHeaderOrArray.split(/,(?=[^;]*=)/);
        }

        for (const cookieStr of cookieStrings) {
            const parts = cookieStr.split(';').map((p) => p.trim());
            if (parts.length === 0 || !parts[0]) continue;

            const nameValue = parts[0].split('=');
            const cookieName = nameValue[0];

            const attributes = {};
            for (let i = 1; i < parts.length; i++) {
                const attrParts = parts[i].split('=');
                const attrName = attrParts[0].toLowerCase();
                const attrValue = attrParts[1] ? attrParts[1].toLowerCase() : true;
                attributes[attrName] = attrValue;
            }

            // Check Secure attribute
            if (isHttps && !attributes.secure) {
                alerts.push({
                    ruleId: 'cookie-missing-secure',
                    severity: 'medium',
                    message: `Cookie "${cookieName}" is missing the "Secure" flag over HTTPS connection.`,
                    evidence: { cookie: cookieStr },
                });
            }

            // Check HttpOnly attribute
            if (!attributes.httponly) {
                alerts.push({
                    ruleId: 'cookie-missing-httponly',
                    severity: 'medium',
                    message: `Cookie "${cookieName}" is missing the "HttpOnly" flag.`,
                    evidence: { cookie: cookieStr },
                });
            }

            // Check SameSite attribute
            if (!attributes.samesite) {
                alerts.push({
                    ruleId: 'cookie-missing-samesite',
                    severity: 'low',
                    message: `Cookie "${cookieName}" is missing the "SameSite" attribute.`,
                    evidence: { cookie: cookieStr },
                });
            } else if (attributes.samesite === 'none' && !attributes.secure) {
                alerts.push({
                    ruleId: 'cookie-samesite-none-insecure',
                    severity: 'medium',
                    message: `Cookie "${cookieName}" has SameSite=None but is missing the "Secure" flag.`,
                    evidence: { cookie: cookieStr },
                });
            }
        }

        return alerts.map(SecurityAuditor.enrichAlert);
    }

    /**
     * Audits a console message for security warnings or violations.
     * @param {object} consoleMessage - Playwright ConsoleMessage object
     * @returns {object|null} security alert or null
     */
    static auditConsoleMessage(consoleMessage) {
        if (!consoleMessage) return null;
        const text = consoleMessage.text() || '';
        const type = consoleMessage.type() || '';

        // Match CSP violations
        if (
            text.includes('Content Security Policy') ||
            text.includes('CSP') ||
            text.includes('violates the following Content Security Policy directive') ||
            text.includes('Refused to load')
        ) {
            const alert = {
                ruleId: 'csp-console-violation',
                severity: 'high',
                message: `Content Security Policy Violation in console: ${text}`,
                evidence: {
                    type,
                    text,
                    location: consoleMessage.location(),
                },
            };
            return SecurityAuditor.enrichAlert(alert);
        }

        // Match mixed content warnings
        if (
            text.includes('Mixed Content') ||
            text.includes('was loaded over HTTPS, but requested an insecure')
        ) {
            const alert = {
                ruleId: 'mixed-content-warning',
                severity: 'medium',
                message: `Mixed Content warning detected in console: ${text}`,
                evidence: {
                    type,
                    text,
                    location: consoleMessage.location(),
                },
            };
            return SecurityAuditor.enrichAlert(alert);
        }

        return null;
    }

    /**
     * Audits the DOM of a page using standard evaluation.
     * @param {object} page - Playwright page instance
     * @returns {Promise<Array<object>>} array of security alerts
     */
    static async auditDOM(page) {
        if (!page || page.isClosed()) return [];
        try {
            const rawAlerts = await page.evaluate(() => {
                const domAlerts = [];

                // 1. Inline event handlers
                const elements = document.querySelectorAll('*');
                for (const el of elements) {
                    if (el.attributes) {
                        for (let i = 0; i < el.attributes.length; i++) {
                            const attr = el.attributes[i];
                            if (attr.name.startsWith('on')) {
                                domAlerts.push({
                                    ruleId: 'dom-inline-event',
                                    severity: 'medium',
                                    message: `Inline event handler "${attr.name}" found on element <${el.tagName.toLowerCase()}>.`,
                                    evidence: {
                                        tagName: el.tagName,
                                        outerHTML: el.outerHTML.substring(0, 150),
                                        attribute: attr.name,
                                        value: attr.value,
                                    },
                                });
                            }
                        }
                    }
                }

                // 2. Dangerous javascript: URIs
                const links = document.querySelectorAll('a[href^="javascript:"]');
                for (const link of links) {
                    domAlerts.push({
                        ruleId: 'dom-javascript-uri',
                        severity: 'medium',
                        message: `Dangerous javascript: URI found in link href: "${link.getAttribute('href')}".`,
                        evidence: {
                            outerHTML: link.outerHTML.substring(0, 150),
                            href: link.getAttribute('href'),
                        },
                    });
                }

                // 3. Password input autocomplete exposure
                const passwords = document.querySelectorAll('input[type="password"]');
                for (const pwd of passwords) {
                    if (!pwd.getAttribute('autocomplete')) {
                        domAlerts.push({
                            ruleId: 'dom-password-autocomplete',
                            severity: 'low',
                            message: 'Password input field is missing "autocomplete" attribute.',
                            evidence: {
                                outerHTML: pwd.outerHTML.substring(0, 150),
                            },
                        });
                    }
                }

                // 4. Forms transmitting over insecure protocol (HTTP)
                const forms = document.querySelectorAll('form');
                for (const form of forms) {
                    const action = form.getAttribute('action') || '';
                    if (action.startsWith('http://')) {
                        domAlerts.push({
                            ruleId: 'dom-insecure-form-action',
                            severity: 'high',
                            message: `Form submits sensitive data over insecure HTTP protocol: "${action}".`,
                            evidence: {
                                outerHTML: form.outerHTML.substring(0, 150),
                                action,
                            },
                        });
                    }
                }

                return domAlerts;
            });

            return rawAlerts.map(SecurityAuditor.enrichAlert);
        } catch (err) {
            console.warn('[SecurityAuditor] DOM Audit evaluation failed:', err.message);
            return [];
        }
    }
}
