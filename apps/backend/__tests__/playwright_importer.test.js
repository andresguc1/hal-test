import { describe, it, expect } from 'vitest';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { PlaywrightMapper } from '../services/importer/playwright/PlaywrightMapper.js';

function extractBody(code) {
    const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
    });
    const traverseFn = typeof traverse === 'function' ? traverse : traverse.default || traverse;
    let body = null;
    traverseFn(ast, {
        CallExpression(path) {
            const { node } = path;
            if (node.callee.type === 'Identifier' && node.callee.name === 'test') {
                const testBody = node.arguments[1];
                if (
                    testBody &&
                    (testBody.type === 'ArrowFunctionExpression' ||
                        testBody.type === 'FunctionExpression')
                ) {
                    body = testBody.body;
                    path.stop();
                }
            }
        },
    });
    return body;
}

function mapPlaywright(code) {
    const mapper = new PlaywrightMapper();
    return mapper.map(extractBody(code));
}

describe('PlaywrightMapper (importer → acciones nativas)', () => {
    it('mapea navegación e interacciones básicas', () => {
        const actions = mapPlaywright(`
            import { test } from '@playwright/test';
            test('t', async ({ page }) => {
                await page.goto('https://example.com');
                await page.click('#login');
                await page.fill('#user', 'alice');
                await page.hover('#menu');
            });
        `);

        expect(actions).toEqual([
            { action: 'open_url', url: 'https://example.com' },
            { action: 'click', selector: '#login' },
            { action: 'type_text', selector: '#user', text: 'alice' },
            { action: 'hover', selector: '#menu' },
        ]);
    });

    it('preserva locators accesibles getByRole/getByLabel con name', () => {
        const actions = mapPlaywright(`
            import { test } from '@playwright/test';
            test('t', async ({ page }) => {
                await page.getByRole('button', { name: 'Submit' }).click();
                await page.getByLabel('Email').fill('a@b.com');
            });
        `);

        expect(actions).toEqual([
            {
                action: 'click',
                selector: "getByRole('button', { name: 'Submit' })",
            },
            {
                action: 'type_text',
                selector: "getByLabel('Email')",
                text: 'a@b.com',
            },
        ]);
    });

    it('mapea wait/navigation, screenshot, select y resize', () => {
        const actions = mapPlaywright(`
            import { test } from '@playwright/test';
            test('t', async ({ page }) => {
                await page.waitForSelector('.spinner');
                await page.selectOption('#country', 'ES');
                await page.setViewportSize({ width: 1280, height: 720 });
                await page.waitForTimeout(500);
                await page.screenshot({ path: 'shot.png' });
                await page.goBack();
                await page.reload();
            });
        `);

        expect(actions).toContainEqual({ action: 'wait_visible', selector: '.spinner' });
        expect(actions).toContainEqual({
            action: 'select_option',
            selector: '#country',
            value: 'ES',
        });
        expect(actions).toContainEqual({
            action: 'resize_viewport',
            width: 1280,
            height: 720,
        });
        expect(actions).toContainEqual({ action: 'pause', duration: 500 });
        expect(actions).toContainEqual({ action: 'take_screenshot', name: 'shot.png' });
        expect(actions).toContainEqual({ action: 'go_back' });
        expect(actions).toContainEqual({ action: 'reload_page' });
    });

    it('mapea drag_and_drop con source/target', () => {
        const actions = mapPlaywright(`
            import { test } from '@playwright/test';
            test('t', async ({ page }) => {
                await page.dragAndDrop('#src', '#dst');
            });
        `);

        expect(actions).toEqual([{ action: 'drag_drop', source: '#src', target: '#dst' }]);
    });

    it('mapea aserciones expect -> validate_semantic', () => {
        const actions = mapPlaywright(`
            import { test, expect } from '@playwright/test';
            test('t', async ({ page }) => {
                await expect(page.locator('.welcome')).toBeVisible();
                await expect(page.locator('#title')).toHaveText('Hello');
                await expect(page).toHaveURL(/example/);
            });
        `);

        expect(actions).toContainEqual({
            action: 'validate_semantic',
            selector: "locator('.welcome')",
            assertionType: 'visible',
            description: 'Playwright assertion: toBeVisible',
        });
        expect(actions).toContainEqual({
            action: 'validate_semantic',
            selector: "locator('#title')",
            assertionType: 'text_equals',
            expected: 'Hello',
            description: 'Playwright assertion: toHaveText',
        });
        expect(actions).toContainEqual({
            action: 'validate_semantic',
            assertionType: 'url_contains',
            expected: '/example/',
            description: 'Playwright assertion: toHaveURL',
        });
    });

    it('mapea test.step como componente y destapa sub-nodos', () => {
        const actions = mapPlaywright(`
            import { test } from '@playwright/test';
            test('t', async ({ page }) => {
                await test.step('Login', async () => {
                    await page.goto('/login');
                    await page.fill('#user', 'u');
                });
            });
        `);

        expect(actions[0]).toMatchObject({
            action: 'component',
            label: 'Login',
            subNodes: [
                { action: 'open_url', url: '/login' },
                { action: 'type_text', selector: '#user', text: 'u' },
            ],
        });
    });

    it('emite placeholder execute_js para page.press de teclas no nativas', () => {
        const actions = mapPlaywright(`
            import { test } from '@playwright/test';
            test('t', async ({ page }) => {
                await page.press('#input', 'Tab');
            });
        `);

        expect(actions[0].action).toBe('execute_js');
        expect(actions[0].description).toContain('page.press');
    });

    it('mapea page.press Enter a type_text + pressEnter', () => {
        const actions = mapPlaywright(`
            import { test } from '@playwright/test';
            test('t', async ({ page }) => {
                await page.press('#input', 'Enter');
            });
        `);

        expect(actions).toEqual([
            { action: 'type_text', selector: '#input', text: '', pressEnter: true },
        ]);
    });
});
