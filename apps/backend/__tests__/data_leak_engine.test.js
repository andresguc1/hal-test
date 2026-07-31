import { describe, it, expect, vi } from 'vitest';
import {
    SensitiveDataScanner,
    calculateShannonEntropy,
} from '../services/security/SensitiveDataScanner.js';
import { DataLeakEngine } from '../services/security/DataLeakEngine.js';
import { SecurityComplianceEngine } from '../services/SecurityComplianceEngine.js';

describe('SensitiveDataScanner', () => {
    it('should detect JWT tokens', () => {
        const text =
            'Here is a token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        const findings = SensitiveDataScanner.scan(text, 'test-resource');
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].ruleId).toBe('SEC-LEAK-APIKEY');
        expect(findings[0].title).toBe('Exposed JWT Token');
        expect(findings[0].confidence).toBe('HIGH');
    });

    it('should detect AWS Access Keys', () => {
        const text = 'AWS_KEY_ID = AKIAIOSFODNN7EXAMPLE';
        const findings = SensitiveDataScanner.scan(text, 'test-resource');
        expect(findings.length).toBe(1);
        expect(findings[0].title).toBe('Exposed AWS Access Key ID');
    });

    it('should detect Stripe API Keys', () => {
        const text = 'stripe.key = "sk_live_51MabcXYZ1234567890abcdef"';
        const findings = SensitiveDataScanner.scan(text, 'test-resource');
        expect(findings.length).toBe(1);
        expect(findings[0].title).toBe('Exposed Stripe API Key');
    });

    it('should validate credit card numbers using Luhn checksum', () => {
        // Valid Visa card
        const validCard = '4111-1111-1111-1111';
        const findingsValid = SensitiveDataScanner.scan(validCard, 'test-resource');
        expect(findingsValid.length).toBe(1);
        expect(findingsValid[0].title).toBe('Exposed Credit Card Number');

        // Invalid Visa card (fails Luhn)
        const invalidCard = '4111-1111-1111-1112';
        const findingsInvalid = SensitiveDataScanner.scan(invalidCard, 'test-resource');
        expect(findingsInvalid.length).toBe(0);
    });

    it('should calculate Shannon Entropy correctly', () => {
        expect(calculateShannonEntropy('aaaaaa')).toBe(0); // Only 1 unique char => 0 entropy
        const mediumEntropy = calculateShannonEntropy('abcdef');
        const highEntropy = calculateShannonEntropy('pw&d-98%#2$89aAbB!');
        expect(highEntropy).toBeGreaterThan(mediumEntropy);
    });

    it('should detect exposed email addresses and phone numbers', () => {
        const text = 'Contact support@example.com or call 555-867-5309';
        const findings = SensitiveDataScanner.scan(text, 'test-resource');
        expect(findings.length).toBe(2);

        const titles = findings.map((f) => f.title);
        expect(titles).toContain('Exposed Email Address Address');
        expect(titles).toContain('Exposed Phone Number');
    });

    it('should flag high-entropy generic password parameters with high confidence', () => {
        const textLow = 'user_password: "password123"';
        const findingsLow = SensitiveDataScanner.scan(textLow, 'test-resource');
        // low entropy "password123" (around 3.1) is excluded or low confidence
        expect(findingsLow.length).toBe(0);

        const textHigh = 'api_key: "K#9x_P@2$m_Zq!1a"'; // High entropy random secret string
        const findingsHigh = SensitiveDataScanner.scan(textHigh, 'test-resource');
        expect(findingsHigh.length).toBe(1);
        expect(findingsHigh[0].confidence).toBe('HIGH');
    });
});

describe('DataLeakEngine', () => {
    it('should scan cookies for secrets', () => {
        const cookies = [
            {
                name: 'session',
                value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
            },
            { name: 'token', value: 'sk-abcdefghijklmnopabcdefghijklmnopabcdefghijklmnop' }, // Simulated OpenAI key-like value
        ];
        const findings = DataLeakEngine.auditCookies(cookies, 'http://localhost');
        expect(findings.length).toBe(2);
    });
});

describe('SecurityComplianceEngine with Data Leak scans', () => {
    it('should calculate specific data leak scores and risk levels', async () => {
        // Mock DB models to prevent actual DB writes during unit tests
        vi.mock('../database/models/SecurityComplianceRun.js', () => ({
            default: {
                create: vi.fn().mockResolvedValue({ id: 'mock-run-id' }),
            },
        }));
        vi.mock('../database/models/SecurityComplianceResult.js', () => ({
            default: {
                bulkCreate: vi.fn().mockResolvedValue([]),
            },
        }));

        const result = await SecurityComplianceEngine.runComplianceAudit({
            targetUrl: 'https://vulnerable.target',
            localStorage: {
                'auth-token':
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
            },
            sessionStorage: {
                'user-email': 'admin@vulnerable.target',
            },
            cookies: [{ name: 'session_key', value: 'sk_live_51MabcXYZ1234567890abcdef' }],
        });

        expect(result.dataLeakScore).toBeLessThan(100);
        expect(result.results.length).toBeGreaterThan(2);
        expect(result.riskLevel).toBe('HIGH'); // AWS / JWT keys trigger HIGH severity
    });
});
