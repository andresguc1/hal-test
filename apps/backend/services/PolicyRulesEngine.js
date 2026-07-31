/**
 * PolicyRulesEngine.js
 * Central repository for Security & Compliance policy rules mapped to international standards:
 * - OWASP ASVS 4.0
 * - PCI-DSS v4.0
 * - ISO 27001:2022
 * - GDPR
 */

export const FRAMEWORKS = {
    OWASP_ASVS_L2: {
        id: 'OWASP_ASVS_L2',
        name: 'OWASP ASVS Level 2 (Standard Applications)',
        description: 'Verification standard for applications handling sensitive business data.',
    },
    PCI_DSS_V4: {
        id: 'PCI_DSS_V4',
        name: 'PCI-DSS v4.0 (Payment Card Industry)',
        description: 'Security requirements for entities processing payment card data.',
    },
    ISO_27001: {
        id: 'ISO_27001',
        name: 'ISO/IEC 27001:2022 Controls',
        description: 'Information security management system control requirements.',
    },
    GDPR_PRIVACY: {
        id: 'GDPR_PRIVACY',
        name: 'GDPR Privacy Controls',
        description:
            'EU General Data Protection Regulation requirements for data privacy and protection.',
    },
};

export const POLICY_RULES = [
    // --- Application Configuration & Headers ---
    {
        id: 'SEC-HDR-CSP',
        category: 'Application Configuration',
        title: 'Content Security Policy (CSP)',
        description:
            'Enforce strong Content Security Policy header to prevent XSS and data injection.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 14.4.1',
            pci: 'PCI-DSS 6.4.3',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation:
            "Configure a strict Content Security Policy header (e.g., default-src 'self').",
    },
    {
        id: 'SEC-HDR-HSTS',
        category: 'Application Configuration',
        title: 'HTTP Strict Transport Security (HSTS)',
        description: 'Enforce HSTS to guarantee encrypted connections over HTTPS.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 14.4.2',
            pci: 'PCI-DSS 4.2.1',
            iso: 'ISO 27001 A.8.24',
        },
        recommendation:
            'Add Strict-Transport-Security: max-age=31536000; includeSubDomains header.',
    },
    {
        id: 'SEC-HDR-XFO',
        category: 'Application Configuration',
        title: 'Clickjacking Protection (X-Frame-Options)',
        description: 'Prevent framing of the web application to avoid clickjacking attacks.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 14.4.3',
            pci: 'PCI-DSS 6.4.1',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation: 'Set X-Frame-Options: DENY or SAMEORIGIN.',
    },
    {
        id: 'SEC-HDR-XCTO',
        category: 'Application Configuration',
        title: 'MIME-Sniffing Protection (X-Content-Type-Options)',
        description:
            'Prevent browsers from MIME-sniffing responses away from declared content-type.',
        severity: 'LOW',
        mappings: {
            asvs: 'ASVS 14.4.4',
            pci: 'PCI-DSS 6.4.1',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation: 'Set X-Content-Type-Options: nosniff.',
    },
    {
        id: 'SEC-HDR-CORS',
        category: 'Application Configuration',
        title: 'CORS Security Policy',
        description: 'Avoid wildcard Access-Control-Allow-Origin combined with credentials.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 14.4.5',
            pci: 'PCI-DSS 6.4.1',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation:
            'Specify exact trusted domains in Access-Control-Allow-Origin header instead of wildcard (*).',
    },

    // --- Session & Cookie Security ---
    {
        id: 'SEC-CK-HTTPONLY',
        category: 'Authentication Compliance',
        title: 'Session Cookie HttpOnly Flag',
        description:
            'Session cookies must include the HttpOnly flag to prevent client-side script access.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 3.4.1',
            pci: 'PCI-DSS 6.4.2',
            iso: 'ISO 27001 A.8.24',
        },
        recommendation:
            'Append ; HttpOnly to set-cookie response headers for sensitive session cookies.',
    },
    {
        id: 'SEC-CK-SECURE',
        category: 'Authentication Compliance',
        title: 'Session Cookie Secure Flag',
        description:
            'Session cookies must be marked Secure to ensure transmission over HTTPS only.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 3.4.2',
            pci: 'PCI-DSS 4.2.1',
            iso: 'ISO 27001 A.8.24',
        },
        recommendation: 'Append ; Secure to set-cookie response headers for session cookies.',
    },
    {
        id: 'SEC-CK-SAMESITE',
        category: 'Authentication Compliance',
        title: 'Session Cookie SameSite Attribute',
        description:
            'Session cookies should enforce SameSite (Strict/Lax) to mitigate CSRF attacks.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 3.4.3',
            pci: 'PCI-DSS 6.4.1',
            iso: 'ISO 27001 A.8.24',
        },
        recommendation: 'Set SameSite=Lax or SameSite=Strict on session cookies.',
    },

    // --- Cryptography & Transport ---
    {
        id: 'SEC-CRY-TLS-VERSION',
        category: 'Cryptography Compliance',
        title: 'Modern TLS Version Enforcement',
        description: 'Web applications must enforce modern TLS 1.2 or TLS 1.3 protocol versions.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 9.1.1',
            pci: 'PCI-DSS 4.1',
            iso: 'ISO 27001 A.8.24',
        },
        recommendation: 'Disable TLS 1.0/1.1 and SSL 3.0 on web servers and reverse proxies.',
    },

    // --- Data Protection & Privacy ---
    {
        id: 'SEC-DAT-TOKEN-STORAGE',
        category: 'Data Protection Compliance',
        title: 'Secure Session Token Storage',
        description:
            'Sensitive authentication tokens must not be exposed unencrypted in LocalStorage.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 3.5.1',
            pci: 'PCI-DSS 6.4.3',
            gdpr: 'GDPR Art. 32',
        },
        recommendation:
            'Store sensitive session JWTs in HttpOnly SameSite cookies rather than LocalStorage.',
    },
    // --- Data Leak Protection ---
    {
        id: 'SEC-LEAK-APIKEY',
        category: 'Data Leak Protection',
        title: 'Exposed API Keys or Secrets',
        description:
            'Sensitive credentials (such as API keys, passwords, private keys, or session tokens) must not be exposed in network responses or client storage.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 3.1.1',
            pci: 'PCI-DSS 6.3.2',
            iso: 'ISO 27001 A.8.12',
        },
        recommendation:
            'Remove hardcoded credentials and prevent returning raw API keys or private keys in public response bodies.',
    },
    {
        id: 'SEC-LEAK-PII',
        category: 'Data Leak Protection',
        title: 'Exposed Personally Identifiable Information (PII)',
        description:
            'Personally Identifiable Information (such as credit cards, emails, phone numbers, or national IDs) must not be exposed in public API responses or unencrypted client storage.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 12.3.1',
            pci: 'PCI-DSS 3.2.1',
            gdpr: 'GDPR Art. 32',
        },
        recommendation:
            'Sanitize or mask PII in response payloads, and store sensitive user data securely on the server side.',
    },
    {
        id: 'SEC-LEAK-SYSTEM',
        category: 'Data Leak Protection',
        title: 'Exposed System Metadata or Debug Logs',
        description:
            'Internal system details, stack traces, environment variables, or debug logs must not be returned in production API responses.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 13.2.3',
            pci: 'PCI-DSS 6.5.5',
            iso: 'ISO 27001 A.8.15',
        },
        recommendation:
            'Disable debug outputs in production configurations and implement generic error messages for end users.',
    },
    // --- DOM Protection ---
    {
        id: 'SEC-DOM-XSS',
        category: 'DOM Protection',
        title: 'Client-Side DOM XSS Vulnerability',
        description:
            'Input data must not be dynamically executed or written into dangerous DOM sinks without sanitization.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 5.3.5',
            pci: 'PCI-DSS 6.5.7',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation:
            'Use Element.textContent, or sanitize dynamically generated HTML before rendering using DOMPurify or Trusted Types.',
    },
    {
        id: 'SEC-DOM-PROTOPOL',
        category: 'DOM Protection',
        title: 'Prototype Pollution Vulnerability',
        description:
            'Application prototypes must be protected from mutable injections via unsafe query strings or recursive merges.',
        severity: 'HIGH',
        mappings: {
            asvs: 'ASVS 5.1.3',
            pci: 'PCI-DSS 6.2.1',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation:
            'Use Object.create(null) for dynamic dictionary mappings, freeze Object.prototype, or validate merge schemas.',
    },
    {
        id: 'SEC-DOM-CLOBBER',
        category: 'DOM Protection',
        title: 'DOM Clobbering Vulnerability',
        description:
            'Protect global window object attributes from being overwritten by injected HTML elements with matching id or name attributes.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 5.1.4',
            pci: 'PCI-DSS 6.2.1',
        },
        recommendation:
            'Sanitize element id/name attributes, and use strict variable references (let/const) rather than implicit window properties.',
    },
    {
        id: 'SEC-DOM-SRI',
        category: 'DOM Protection',
        title: 'Missing Subresource Integrity (SRI)',
        description:
            'External assets loaded from third-party CDNs must include integrity hashes to prevent tampering.',
        severity: 'MEDIUM',
        mappings: {
            asvs: 'ASVS 14.2.4',
            pci: 'PCI-DSS 6.4.3',
            iso: 'ISO 27001 A.8.28',
        },
        recommendation:
            'Add the integrity attribute (e.g. integrity="sha384-...") to link and script tags pointing to external CDNs.',
    },
    {
        id: 'SEC-DOM-TRUSTED',
        category: 'DOM Protection',
        title: 'Trusted Types Security Policy',
        description:
            'Verify if the application implements and enforces a Trusted Types policy for sanitizing HTML injections.',
        severity: 'LOW',
        mappings: {
            asvs: 'ASVS 14.4.1',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation:
            "Configure a Content-Security-Policy header enforcing require-trusted-types-for 'script'.",
    },
    {
        id: 'SEC-DOM-COOP',
        category: 'DOM Protection',
        title: 'Missing Cross-Origin Opener Policy (COOP)',
        description:
            'Cross-Origin-Opener-Policy (COOP) header is missing, failing to isolate browsing contexts from untrusted domains.',
        severity: 'LOW',
        mappings: {
            asvs: 'ASVS 14.4.1',
            iso: 'ISO 27001 A.8.26',
        },
        recommendation:
            "Configure a Cross-Origin-Opener-Policy header with value 'same-origin' or 'same-origin-allow-popups' to isolate the window context.",
    },
];

export class PolicyRulesEngine {
    static getRulesForFramework(frameworkId) {
        if (!frameworkId || frameworkId === 'ALL') return POLICY_RULES;
        return POLICY_RULES;
    }

    static getRuleById(ruleId) {
        return POLICY_RULES.find((r) => r.id === ruleId);
    }
}
