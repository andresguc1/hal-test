import { describe, it, expect, vi } from 'vitest';
import { DomProtectionEngine } from '../services/security/DomProtectionEngine.js';

describe('DomProtectionEngine policies', () => {
    it('should generate a non-empty instrumentation script string', () => {
        const script = DomProtectionEngine.getInstrumentationScript();
        expect(typeof script).toBe('string');
        expect(script.length).toBeGreaterThan(100);
        expect(script).toContain('__haltestDOMAlerts');
        expect(script).toContain('Element.prototype');
        expect(script).toContain('innerHTML');
    });

    it('should flag insecure directives in CSP', () => {
        const headers = {
            'Content-Security-Policy':
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';",
        };
        const findings = DomProtectionEngine.auditPolicies('https://localhost', headers);
        expect(findings.length).toBeGreaterThan(0);

        const cspFindings = findings.filter((f) => f.ruleId === 'SEC-HDR-CSP');
        expect(cspFindings.length).toBe(2); // Flagged both unsafe-inline and unsafe-eval
        expect(cspFindings[0].severity).toBe('HIGH');
    });

    it('should flag missing clickjacking protections', () => {
        const headers = {
            Server: 'Express',
        };
        const findings = DomProtectionEngine.auditPolicies('https://localhost', headers);
        const clickjackingFinding = findings.find((f) => f.ruleId === 'SEC-HDR-XFO');
        expect(clickjackingFinding).toBeDefined();
        expect(clickjackingFinding.severity).toBe('MEDIUM');
    });

    it('should flag missing Cross-Origin Opener Policy (COOP)', () => {
        const headers = {
            'X-Frame-Options': 'DENY',
        };
        const findings = DomProtectionEngine.auditPolicies('https://localhost', headers);
        const coopFinding = findings.find(
            (f) => f.title === 'Missing Cross-Origin Opener Policy (COOP)',
        );
        expect(coopFinding).toBeDefined();
        expect(coopFinding.severity).toBe('LOW');
    });
});

describe('DomProtectionEngine active DOM checks', () => {
    it('should process DOM findings, clobbering, SRI, and Trusted Types findings from page evaluations', async () => {
        const mockReport = {
            alerts: [
                {
                    ruleId: 'SEC-DOM-XSS',
                    type: 'dom_xss_sink',
                    sink: 'Element.innerHTML',
                    value: '<script>alert(1)</script>',
                    stack: 'Error stack',
                },
                {
                    ruleId: 'SEC-DOM-PROTOPOL',
                    type: 'prototype_pollution',
                    sink: 'Object.prototype.__proto__',
                    value: 'polluted',
                    stack: 'Error stack',
                },
            ],
            clobbered: [
                {
                    ruleId: 'SEC-DOM-CLOBBER',
                    status: 'FAIL',
                    title: 'DOM Clobbering Alert',
                    severity: 'MEDIUM',
                    confidence: 'HIGH',
                    description: 'Overwritten window.config',
                    evidence: { tagName: 'DIV' },
                    affected_resource: 'window.config',
                },
            ],
            sriAlerts: [
                {
                    ruleId: 'SEC-DOM-SRI',
                    status: 'FAIL',
                    title: 'Missing SRI',
                    severity: 'MEDIUM',
                    confidence: 'HIGH',
                    description: 'Missing integrity on cdn.js',
                    affected_resource: 'http://cdn.js',
                },
            ],
            ttAlerts: [
                {
                    ruleId: 'SEC-DOM-TRUSTED',
                    status: 'FAIL',
                    title: 'Trusted Types Disabled',
                    severity: 'LOW',
                    confidence: 'HIGH',
                    description: 'No Trusted Types',
                    affected_resource: 'http://localhost',
                },
            ],
        };

        const mockPage = {
            url: () => 'http://localhost',
            isClosed: () => false,
            evaluate: vi.fn().mockResolvedValue(mockReport),
        };

        const findings = await DomProtectionEngine.auditDOM(mockPage);
        expect(findings.length).toBe(5);

        const ruleIds = findings.map((f) => f.ruleId);
        expect(ruleIds).toContain('SEC-DOM-XSS');
        expect(ruleIds).toContain('SEC-DOM-PROTOPOL');
        expect(ruleIds).toContain('SEC-DOM-CLOBBER');
        expect(ruleIds).toContain('SEC-DOM-SRI');
        expect(ruleIds).toContain('SEC-DOM-TRUSTED');
    });
});
