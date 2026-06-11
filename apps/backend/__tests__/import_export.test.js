import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const API_PREFIX = '/api';

describe('HalTest Import / Export API Endpoints', () => {
    describe('Framework Detection (/import/analyze)', () => {
        it('should detect playwright framework correctly', async () => {
            const playwrightCode = `
                import { test, expect } from '@playwright/test';
                test('basic test', async ({ page }) => {
                    await page.goto('https://playwright.dev/');
                });
            `;
            const response = await request(app)
                .post(`${API_PREFIX}/import/analyze`)
                .send({ content: playwrightCode, filename: 'test.spec.js' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('framework', 'playwright');
            expect(response.body).toHaveProperty('detected', true);
        });

        it('should return detected false for unknown content', async () => {
            const response = await request(app)
                .post(`${API_PREFIX}/import/analyze`)
                .send({ content: 'random gibberish script', filename: 'random.js' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('detected', false);
        });
    });

    describe('File Conversion (/import/convert)', () => {
        it('should convert a simple Playwright script to internal flow actions', async () => {
            const playwrightCode = `
                import { test } from '@playwright/test';
                test('my test name', async ({ page }) => {
                    await page.goto('https://google.com');
                    await page.click('input[type="submit"]');
                    await page.fill('#username', 'my-user');
                });
            `;
            const response = await request(app)
                .post(`${API_PREFIX}/import/convert`)
                .send({ content: playwrightCode, framework: 'playwright' });

            if (response.statusCode !== 200) {
                console.error('[TEST DEBUG] /convert failed:', response.body);
            }

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.flows).toBeTypeOf('object');
            expect(response.body.flows.length).toBe(1);

            const testFlow = response.body.flows[0];
            expect(testFlow.meta.name).toBe('my test name');
            expect(testFlow.meta.sourceFramework).toBe('playwright');

            // Check mapped actions
            const actions = testFlow.flow;
            expect(actions[0].action).toBe('launch_browser');
            expect(actions[1]).toEqual({ action: 'open_url', url: 'https://google.com' });
            expect(actions[2]).toEqual({ action: 'click', selector: 'input[type="submit"]' });
            expect(actions[3]).toEqual({
                action: 'type_text',
                selector: '#username',
                text: 'my-user',
            });
            expect(actions[actions.length - 1].action).toBe('close_browser');
        });

        it('should convert a simple Cypress script to internal flow actions', async () => {
            const cypressCode = `
                it('my cypress test', () => {
                    cy.visit('https://example.com');
                    cy.get('#username').type('user123');
                    cy.get('#submit').click();
                });
            `;
            const response = await request(app)
                .post(`${API_PREFIX}/import/convert`)
                .send({ content: cypressCode, framework: 'cypress' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body.flows.length).toBe(1);

            const testFlow = response.body.flows[0];
            expect(testFlow.meta.name).toBe('my cypress test');
            expect(testFlow.meta.sourceFramework).toBe('cypress');

            const actions = testFlow.flow;
            expect(actions[0].action).toBe('launch_browser');
            expect(actions[1]).toEqual({ action: 'open_url', url: 'https://example.com' });
            expect(actions[2]).toEqual({
                action: 'type_text',
                selector: '#username',
                text: 'user123',
            });
            expect(actions[3]).toEqual({ action: 'click', selector: '#submit' });
            expect(actions[actions.length - 1].action).toBe('close_browser');
        });

        it('should recursively convert a Playwright script with test.step blocks', async () => {
            const playwrightCode = `
                import { test } from '@playwright/test';
                test('group test', async ({ page }) => {
                    await test.step('📦 Login Steps', async () => {
                        await page.goto('https://example.com/login');
                        await page.fill('#username', 'user1');
                    });
                });
            `;
            const response = await request(app)
                .post(`${API_PREFIX}/import/convert`)
                .send({ content: playwrightCode, framework: 'playwright' });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            const flow = response.body.flows[0].flow;

            expect(flow[0].action).toBe('launch_browser');

            const stepAction = flow[1];
            expect(stepAction.action).toBe('component');
            expect(stepAction.label).toBe('📦 Login Steps');
            expect(stepAction.subNodes.length).toBe(2);
            expect(stepAction.subNodes[0]).toEqual({
                action: 'open_url',
                url: 'https://example.com/login',
            });
            expect(stepAction.subNodes[1]).toEqual({
                action: 'type_text',
                selector: '#username',
                text: 'user1',
            });

            expect(flow[flow.length - 1].action).toBe('close_browser');
        });

        it('should return 400 if content is missing', async () => {
            const response = await request(app)
                .post(`${API_PREFIX}/import/convert`)
                .send({ framework: 'playwright' });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Code Generation Export (/export/code)', () => {
        it('should generate Playwright javascript code from flow actions', async () => {
            const flow = [
                { action: 'open_url', url: 'https://example.com' },
                { action: 'click', selector: '#submit' },
            ];

            const response = await request(app).post(`${API_PREFIX}/export/code`).send({
                flow,
                framework: 'playwright',
                language: 'javascript',
            });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.code).toContain("import { test } from '@playwright/test'");
            expect(response.body.code).toContain('await page.goto(`https://example.com`);');
            expect(response.body.code).toContain('await page.click(`#submit`);');
        });

        it('should return 400 if flow is missing or not an array', async () => {
            const response = await request(app)
                .post(`${API_PREFIX}/export/code`)
                .send({ framework: 'playwright' });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Backup Export (/export/json)', () => {
        it('should return a JSON file download of the flow', async () => {
            const flow = {
                nodes: [{ id: 'n1', type: 'click' }],
                edges: [],
            };

            const response = await request(app).post(`${API_PREFIX}/export/json`).send({ flow });

            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toContain('application/json');
            expect(response.headers['content-disposition']).toContain('attachment');

            const bodyJson = JSON.parse(response.text);
            expect(bodyJson).toEqual(flow);
        });
    });

    describe('Directory POM Upload and Resolution (/import/directory-pom)', () => {
        it('should successfully handle multipart directory uploads with nested folders', async () => {
            const testFileContent = `
                import { test } from '@playwright/test';
                test('login flow', async ({ page }) => {
                    await page.goto('https://example.com/login');
                });
            `;
            const pomFileContent = `
                export class LoginPage {
                    constructor(page) {
                        this.page = page;
                    }
                }
            `;

            const response = await request(app)
                .post(`${API_PREFIX}/import/directory-pom`)
                .attach('files', Buffer.from(testFileContent), 'tests/login.spec.js')
                .attach('files', Buffer.from(pomFileContent), 'pages/LoginPage.js');

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.total).toBe(1); // 1 test file found
            expect(response.body.flows.length).toBe(1);
            expect(response.body.flows[0].meta.name).toBe('login flow');
        });
    });
});
