import { SensitiveDataScanner } from './SensitiveDataScanner.js';

export class DataLeakEngine {
    /**
     * Audits the page's LocalStorage and SessionStorage.
     * @param {import('playwright').Page} page
     * @returns {Promise<Array<object>>} List of storage findings
     */
    static async auditStorage(page) {
        if (!page || page.isClosed()) return [];
        try {
            const storageDump = await page.evaluate(() => {
                const ls = {};
                const ss = {};
                try {
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        ls[k] = localStorage.getItem(k);
                    }
                } catch (e) {
                    /* ignore */
                }
                try {
                    for (let i = 0; i < sessionStorage.length; i++) {
                        const k = sessionStorage.key(i);
                        ss[k] = sessionStorage.getItem(k);
                    }
                } catch (e) {
                    /* ignore */
                }
                return { localStorage: ls, sessionStorage: ss };
            });

            const findings = [];

            // Scan LocalStorage
            for (const [key, value] of Object.entries(storageDump.localStorage)) {
                const subFindings = SensitiveDataScanner.scan(value, `LocalStorage Key: ${key}`);
                findings.push(...subFindings);
            }

            // Scan SessionStorage
            for (const [key, value] of Object.entries(storageDump.sessionStorage)) {
                const subFindings = SensitiveDataScanner.scan(value, `SessionStorage Key: ${key}`);
                findings.push(...subFindings);
            }

            return findings;
        } catch (err) {
            console.warn('[DataLeakEngine] Storage audit failed:', err.message);
            return [];
        }
    }

    /**
     * Audits response headers and bodies.
     * @param {import('playwright').Response} response
     * @returns {Promise<Array<object>>} List of response findings
     */
    static async auditResponse(response) {
        const findings = [];
        try {
            const url = response.url();
            const headers = response.headers();
            const status = response.status();

            // 1. Audit Headers for system information exposure
            for (const [k, v] of Object.entries(headers)) {
                const headerText = `${k}: ${v}`;
                const headerFindings = SensitiveDataScanner.scan(
                    headerText,
                    `Response Header: ${k} (${url})`,
                );
                findings.push(...headerFindings);
            }

            // 2. Audit Response Body if it is textual and successful
            const contentType = headers['content-type'] || '';
            const isTextual = /\b(html|json|xml|javascript|text|plain)\b/i.test(contentType);

            if (isTextual && status >= 200 && status < 300) {
                const bodyText = await response.text();
                // Avoid scanning massive files to save memory/performance
                if (bodyText && bodyText.length < 500000) {
                    const bodyFindings = SensitiveDataScanner.scan(
                        bodyText,
                        `Response Body (${url})`,
                    );
                    findings.push(...bodyFindings);
                }
            }
        } catch (err) {
            // response.text() can fail for redirects or aborted requests, ignore
        }
        return findings;
    }

    /**
     * Audits request headers and request payloads.
     * @param {import('playwright').Request} request
     * @returns {Promise<Array<object>>} List of request findings
     */
    static async auditRequest(request) {
        const findings = [];
        try {
            const url = request.url();
            const headers = request.headers();
            const postData = request.postData() || '';

            // 1. Audit Request Headers (like Bearer tokens in Authorization header)
            for (const [k, v] of Object.entries(headers)) {
                const headerText = `${k}: ${v}`;
                const headerFindings = SensitiveDataScanner.scan(
                    headerText,
                    `Request Header: ${k} (${url})`,
                );
                findings.push(...headerFindings);
            }

            // 2. Audit Request Payloads (XHR/Fetch/GraphQL payloads)
            if (postData) {
                const payloadFindings = SensitiveDataScanner.scan(
                    postData,
                    `Request Payload (${url})`,
                );
                findings.push(...payloadFindings);
            }

            // 3. Form submissions over insecure protocol check
            const method = request.method();
            if (method === 'POST' && url.startsWith('http://')) {
                findings.push({
                    ruleId: 'SEC-LEAK-SYSTEM',
                    status: 'FAIL',
                    title: 'Form Submission Over Insecure HTTP Protocol',
                    severity: 'HIGH',
                    confidence: 'HIGH',
                    description: `Sensitive parameters or payloads are transmitted over unencrypted HTTP: ${url}`,
                    evidence: { url, method },
                    affected_resource: url,
                });
            }
        } catch (err) {
            // Ignore
        }
        return findings;
    }

    /**
     * Audits target cookies.
     * @param {Array<object>} cookies
     * @param {string} targetUrl
     * @returns {Array<object>} List of cookie findings
     */
    static auditCookies(cookies = [], targetUrl = 'unknown') {
        const findings = [];
        for (const cookie of cookies) {
            const cookieString = `${cookie.name}=${cookie.value}`;
            const cookieFindings = SensitiveDataScanner.scan(
                cookieString,
                `Cookie: ${cookie.name} (${targetUrl})`,
            );
            findings.push(...cookieFindings);
        }
        return findings;
    }
}
