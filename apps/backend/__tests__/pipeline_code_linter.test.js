import { describe, it, expect } from 'vitest';
import pipelineCodeLinter from '../services/PipelineCodeLinter.js';

describe('PipelineCodeLinter Agent Unit Tests', () => {
    it('should detect static sleep waits (waitForTimeout)', () => {
        const code = `
      await page.goto('https://example.com');
      await page.waitForTimeout(5000);
      await page.click('#btn');
      expect(page).toBeDefined();
    `;

        const report = pipelineCodeLinter.lintCode(code, 'flaky_test.js');
        expect(report.passed).toBe(false);
        expect(report.summary.errors).toBeGreaterThanOrEqual(1);

        const sleepIssue = report.issues.find((i) => i.rule === 'STATIC_SLEEP_WAIT');
        expect(sleepIssue).toBeDefined();
        expect(sleepIssue.line).toBe(3);
    });

    it('should detect hardcoded passwords and secrets', () => {
        const code = `
      const password = "SuperSecretPassword123";
      await page.fill('#password', password);
      expect(page).toBeDefined();
    `;

        const report = pipelineCodeLinter.lintCode(code, 'secret_test.js');
        const secretIssue = report.issues.find((i) => i.rule === 'HARDCODED_SECRET');
        expect(secretIssue).toBeDefined();
    });

    it('should detect unhandled async operations (missing await)', () => {
        const code = `
      page.click('#submit-button');
      expect(page).toBeDefined();
    `;

        const report = pipelineCodeLinter.lintCode(code, 'async_test.js');
        const asyncIssue = report.issues.find((i) => i.rule === 'UNHANDLED_ASYNC_PROMISE');
        expect(asyncIssue).toBeDefined();
    });

    it('should pass audit for clean robust Playwright code', () => {
        const code = `
      import { test, expect } from '@playwright/test';

      test('login flow', async ({ page }) => {
        await page.goto('https://example.com/login');
        await page.fill('[data-testid="email"]', process.env.USER_EMAIL);
        await page.fill('[data-testid="password"]', process.env.USER_PASSWORD);
        await page.click('[data-testid="submit-btn"]');
        await expect(page.locator('.dashboard')).toBeVisible();
      });
    `;

        const report = pipelineCodeLinter.lintCode(code, 'clean_test.spec.js');
        expect(report.passed).toBe(true);
        expect(report.score).toBe(100);
        expect(report.issues).toHaveLength(0);
    });
});
