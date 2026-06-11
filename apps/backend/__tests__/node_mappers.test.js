import { describe, it, expect } from 'vitest';
import { NodeMapperRegistry } from '../services/exporter/core/GeneratorRegistry.js';

describe('HalTest Node Mappers Code Generation', () => {
    it('should register all new mappers in NodeMapperRegistry', () => {
        const registered = NodeMapperRegistry.getRegisteredTypes();
        expect(registered).toContain('go_back');
        expect(registered).toContain('select_option');
        expect(registered).toContain('validate_semantic');
        expect(registered).toContain('intercept_request');
        expect(registered).toContain('find_element');
        expect(registered).toContain('upload_file');
        expect(registered).toContain('manage_session');
        expect(registered).toContain('variable');
        expect(registered).toContain('input');
    });

    describe('NavigationMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('go_back');

        it('generates correct code for go_back', () => {
            const jsCode = mapper.getCode({ actionType: 'go_back' }, 'javascript');
            expect(jsCode).toBe('await page.goBack();');

            const pyCode = mapper.getCode({ actionType: 'go_back' }, 'python');
            expect(pyCode).toBe('await page.go_back()');
        });

        it('generates correct code for manage_tabs switch', () => {
            const params = { actionType: 'manage_tabs', tabAction: 'switch', tabIndex: 2 };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toContain('await pages[2].bringToFront();');
        });
    });

    describe('FormMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('select_option');

        it('generates correct code for select_option', () => {
            const params = { actionType: 'select_option', selector: '#dropdown', value: 'opt1' };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toBe('await page.selectOption(`#dropdown`, `opt1`);');
        });
    });

    describe('AssertionMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('validate_semantic');

        it('generates correct code for validate_semantic', () => {
            const params = {
                actionType: 'validate_semantic',
                selector: '.title',
                expected: 'Welcome',
                assertType: 'text_equals',
            };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toContain('await expect(page.locator(`.title`)).toHaveText(`Welcome`);');
        });
    });

    describe('NetworkMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('intercept_request');

        it('generates correct code for mock_response', () => {
            const params = {
                actionType: 'mock_response',
                urlPattern: '/api/v1',
                status: 201,
                body: { success: true },
            };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toContain('await page.route');
            expect(jsCode).toContain('status: 201');
            expect(jsCode).toContain('success');
        });
    });

    describe('DOMMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('find_element');

        it('generates correct code for find_element', () => {
            const params = { actionType: 'find_element', selector: 'button.submit' };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toContain('page.locator(`button.submit`).count()');
        });
    });

    describe('FileMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('upload_file');

        it('generates correct code for upload_file', () => {
            const params = {
                actionType: 'upload_file',
                selector: 'input[type=file]',
                filePath: 'cv.pdf',
            };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toBe('await page.setInputFiles(`input[type=file]`, `cv.pdf`);');
        });
    });

    describe('SessionMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('manage_session');

        it('generates correct code for cleanup_state', () => {
            const params = { actionType: 'cleanup_state' };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toContain('localStorage.clear()');
        });
    });

    describe('FlowControlMapper', () => {
        const mapper = NodeMapperRegistry.getMapper('variable');

        it('generates correct code for variable', () => {
            const params = { actionType: 'variable', name: 'userCount', value: 42 };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toBe('const userCount = 42;');
        });

        it('generates correct code for pause', () => {
            const params = { actionType: 'pause', ms: 5000 };
            const jsCode = mapper.getCode(params, 'javascript');
            expect(jsCode).toBe('await page.waitForTimeout(5000);');
        });
    });
});
