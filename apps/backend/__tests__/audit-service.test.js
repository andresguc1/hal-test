import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import request from 'supertest';
import app from '../app.js';
import aiService from '../services/AIService.js';
import { auditService } from '../services/AuditService.js';
import { STORAGE_DIR } from '../config/paths.js';

describe('AuditService JSONL Logging', () => {
    const originalPath = auditService.logFilePath;
    const testLogFilePath = path.join(STORAGE_DIR, 'datasets', 'audit_fine_tuning_test.jsonl');

    beforeEach(async () => {
        // Point the logger to the test log file path
        auditService.logFilePath = testLogFilePath;
        auditService.initialized = false;
        // Clean up test file if it exists
        try {
            await fs.unlink(testLogFilePath);
        } catch (e) {
            // Ignore if file doesn't exist
        }
    });

    afterEach(async () => {
        // Restore original log path
        auditService.logFilePath = originalPath;
        try {
            await fs.unlink(testLogFilePath);
        } catch (e) {
            // Ignore if file doesn't exist
        }
    });

    it('should initialize and create the audit log directory and file', async () => {
        const testStep = {
            input: { selector: 'button#submit', text: 'Submit' },
            domBefore: '<div><button id="submit">Submit</button></div>',
            action: 'click',
            selector: 'button#submit',
            assertionResult: { success: true, status: 'success' },
            runId: 'run_123',
            nodeId: 'node_abc',
        };

        await auditService.logStep(testStep);

        const fileExists = await fs
            .access(testLogFilePath)
            .then(() => true)
            .catch(() => false);
        expect(fileExists).toBe(true);

        const fileContent = await fs.readFile(testLogFilePath, 'utf8');
        const lines = fileContent.trim().split('\n');
        expect(lines).toHaveLength(1);

        const parsed = JSON.parse(lines[0]);
        expect(parsed.action).toBe('click');
        expect(parsed.runId).toBe('run_123');
        expect(parsed.nodeId).toBe('node_abc');
        expect(parsed.selector).toBe('button#submit');
        expect(parsed.dom_state).toBe('<div><button id="submit">Submit</button></div>');
        expect(parsed.input).toEqual({ selector: 'button#submit', text: 'Submit' });
        expect(parsed.assertion_result).toEqual({ success: true, status: 'success' });
        expect(parsed.timestamp).toBeDefined();
    });

    it('should append multiple logs sequentially to the same file', async () => {
        await auditService.logStep({
            input: { selector: '.btn' },
            domBefore: '<button class="btn">Btn 1</button>',
            action: 'click',
            selector: '.btn',
            assertionResult: { success: true },
        });

        await auditService.logStep({
            input: { selector: 'input[name="username"]', text: 'test' },
            domBefore: '<input name="username" />',
            action: 'type_text',
            selector: 'input[name="username"]',
            assertionResult: { success: true },
        });

        const fileContent = await fs.readFile(testLogFilePath, 'utf8');
        const lines = fileContent.trim().split('\n');
        expect(lines).toHaveLength(2);

        const log1 = JSON.parse(lines[0]);
        const log2 = JSON.parse(lines[1]);

        expect(log1.action).toBe('click');
        expect(log1.dom_state).toBe('<button class="btn">Btn 1</button>');
        expect(log2.action).toBe('type_text');
        expect(log2.dom_state).toBe('<input name="username" />');
    });

    it('should capture audit log via validate_semantic express route', async () => {
        // Mock the AI validation service
        const aiMock = vi.spyOn(aiService, 'validate').mockResolvedValue({
            isValid: true,
            reasoning: 'AI validation passed successfully',
            confidence: 0.95,
        });

        const response = await request(app)
            .post('/api/actions/validate_semantic')
            .set('x-hal-fine-tuning', 'true')
            .send({
                content: '<html><body>Mock Body</body></html>',
                criteria: 'Is there mock body?',
                expectedAnswer: 'true',
                variableName: 'semanticValid',
                nodeId: 'node_semantic_test',
                runId: 'run_semantic_test',
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const fileExists = await fs
            .access(testLogFilePath)
            .then(() => true)
            .catch(() => false);
        expect(fileExists).toBe(true);

        const fileContent = await fs.readFile(testLogFilePath, 'utf8');
        const lines = fileContent.trim().split('\n');
        expect(lines).toHaveLength(1);

        const parsed = JSON.parse(lines[0]);
        expect(parsed.action).toBe('validate_semantic');
        expect(parsed.runId).toBe('run_semantic_test');
        expect(parsed.nodeId).toBe('node_semantic_test');
        expect(parsed.selector).toBeNull();
        expect(parsed.assertion_result).toEqual({
            success: true,
            status: 'success',
            isValid: true,
            isMatch: true,
            reasoning: 'AI validation passed successfully',
        });

        aiMock.mockRestore();
    });

    it('should fetch and clear audit logs via API', async () => {
        // Write mock logs
        await auditService.logStep({
            input: {},
            action: 'test_action',
            assertionResult: { success: true },
        });

        // Test GET logs
        const getRes = await request(app).get('/api/audit/logs');
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.success).toBe(true);
        expect(getRes.body.logs.length).toBe(1);
        expect(getRes.body.logs[0].action).toBe('test_action');

        // Test DELETE logs
        const deleteRes = await request(app).delete('/api/audit/logs');
        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body.success).toBe(true);

        // Verify cleared
        const getRes2 = await request(app).get('/api/audit/logs');
        expect(getRes2.body.logs.length).toBe(0);
    });

    it('should manage fine-tuning training request', async () => {
        // 1. Should fail when no logs exist
        const trainResFail = await request(app).post('/api/audit/train');
        expect(trainResFail.statusCode).toBe(400);
        expect(trainResFail.body.success).toBe(false);

        // 2. Should succeed when logs exist
        await auditService.logStep({
            input: {},
            action: 'test_action',
            assertionResult: { success: true },
        });

        const trainResSuccess = await request(app).post('/api/audit/train');
        expect(trainResSuccess.statusCode).toBe(200);
        expect(trainResSuccess.body.success).toBe(true);
        expect(trainResSuccess.body.totalSteps).toBe(1);
    });
});
