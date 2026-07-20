import { describe, it, expect } from 'vitest';
import { SecurityAuditor } from '../services/SecurityAuditor.js';

describe('SecurityAuditor Service', () => {
    describe('auditHeaders', () => {
        it('should detect missing Content-Security-Policy', () => {
            const url = 'https://example.com/dashboard';
            const headers = {
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'Strict-Transport-Security': 'max-age=31536000',
            };
            const alerts = SecurityAuditor.auditHeaders(url, headers);

            const missingCsp = alerts.find((a) => a.ruleId === 'csp-missing-header');
            expect(missingCsp).toBeDefined();
            expect(missingCsp.severity).toBe('high');
        });

        it('should detect unsafe script-src in CSP', () => {
            const url = 'https://example.com/dashboard';
            const headers = {
                'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline';",
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'Strict-Transport-Security': 'max-age=31536000',
            };
            const alerts = SecurityAuditor.auditHeaders(url, headers);

            const insecureCsp = alerts.find((a) => a.ruleId === 'csp-insecure-directive');
            expect(insecureCsp).toBeDefined();
            expect(insecureCsp.severity).toBe('medium');
        });

        it('should detect missing HSTS over HTTPS', () => {
            const url = 'https://example.com/dashboard';
            const headers = {
                'Content-Security-Policy': "default-src 'self'",
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
            };
            const alerts = SecurityAuditor.auditHeaders(url, headers);

            const missingHsts = alerts.find((a) => a.ruleId === 'hsts-missing-header');
            expect(missingHsts).toBeDefined();
        });

        it('should not complain about HSTS over HTTP', () => {
            const url = 'http://example.com/dashboard';
            const headers = {
                'Content-Security-Policy': "default-src 'self'",
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
            };
            const alerts = SecurityAuditor.auditHeaders(url, headers);

            const missingHsts = alerts.find((a) => a.ruleId === 'hsts-missing-header');
            expect(missingHsts).toBeUndefined();
        });

        it('should detect wildcard CORS with credentials enabled', () => {
            const url = 'https://example.com/api/data';
            const headers = {
                'Content-Security-Policy': "default-src 'self'",
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
            };
            const alerts = SecurityAuditor.auditHeaders(url, headers);
            const corsAlert = alerts.find((a) => a.ruleId === 'cors-wildcard-credentials');
            expect(corsAlert).toBeDefined();
        });
    });

    describe('auditCookies', () => {
        it('should flag cookie missing HttpOnly and Secure flags', () => {
            const url = 'https://example.com/';
            const cookieHeader = 'sessionId=12345; Path=/; Domain=example.com';
            const alerts = SecurityAuditor.auditCookies(url, cookieHeader);

            const httpOnlyAlert = alerts.find((a) => a.ruleId === 'cookie-missing-httponly');
            const secureAlert = alerts.find((a) => a.ruleId === 'cookie-missing-secure');
            expect(httpOnlyAlert).toBeDefined();
            expect(secureAlert).toBeDefined();
        });

        it('should flag SameSite=None without Secure flag', () => {
            const url = 'http://example.com/';
            const cookieHeader = 'theme=dark; SameSite=None';
            const alerts = SecurityAuditor.auditCookies(url, cookieHeader);

            const samesiteAlert = alerts.find((a) => a.ruleId === 'cookie-samesite-none-insecure');
            expect(samesiteAlert).toBeDefined();
        });
    });

    describe('auditConsoleMessage', () => {
        it('should detect CSP console violations', () => {
            const mockMsg = {
                text: () =>
                    "Refused to load the script 'http://external.com/script.js' because it violates the following Content Security Policy directive...",
                type: () => 'error',
                location: () => ({ url: 'http://localhost:3000/', lineNumber: 10 }),
            };
            const alert = SecurityAuditor.auditConsoleMessage(mockMsg);
            expect(alert).not.toBeNull();
            expect(alert.ruleId).toBe('csp-console-violation');
            expect(alert.severity).toBe('high');
        });

        it('should return null for benign logs', () => {
            const mockMsg = {
                text: () => 'Hello world log message',
                type: () => 'log',
                location: () => ({ url: 'http://localhost:3000/', lineNumber: 12 }),
            };
            const alert = SecurityAuditor.auditConsoleMessage(mockMsg);
            expect(alert).toBeNull();
        });
    });
});
