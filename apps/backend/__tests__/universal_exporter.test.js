import { describe, it, expect } from 'vitest';
import { exportService } from '../services/exporter/index.js';
import { NodeMapperRegistry } from '../services/exporter/core/GeneratorRegistry.js';

describe('Universal QA Exporter Tests', () => {
    const sampleSteps = [
        {
            id: 'node-1',
            type: 'open_url',
            data: { configuration: { url: 'https://example.com' } },
        },
        {
            id: 'node-2',
            type: 'click',
            data: { label: 'Click Button', configuration: { selector: '#submit-btn' } },
        },
        {
            id: 'node-3',
            type: 'type_text',
            data: {
                label: 'Enter Text',
                configuration: { selector: '#username', text: 'testuser' },
            },
        },
        {
            id: 'node-4',
            type: 'assertion',
            data: {
                label: 'Verify Title',
                configuration: {
                    assertType: 'title_contains',
                    expected: 'Dashboard',
                },
            },
        },
        {
            id: 'node-5',
            type: 'wait_fixed',
            data: { label: 'Wait 3s', configuration: { ms: 3000 } },
        },
        {
            id: 'node-6',
            type: 'non_existent_node_type',
            data: { label: 'Unsupported Node' },
        },
    ];

    describe('Mappers Multi-Framework translations', () => {
        it('OpenUrlMapper translating to Cypress and Selenium', () => {
            const mapper = NodeMapperRegistry.getMapper('open_url');
            const cypressCode = mapper.getCode(
                { url: 'https://test.com' },
                'javascript',
                0,
                'cypress',
            );
            expect(cypressCode).toBe('cy.visit(`https://test.com`);');

            const seleniumCode = mapper.getCode(
                { url: 'https://test.com' },
                'python',
                0,
                'selenium',
            );
            expect(seleniumCode).toBe('driver.get("https://test.com")');
        });

        it('InteractionMapper translating to Cypress and Selenium', () => {
            const mapper = NodeMapperRegistry.getMapper('click');
            const cypressCode = mapper.getCode(
                { selector: '#btn', actionType: 'click' },
                'javascript',
                0,
                'cypress',
            );
            expect(cypressCode).toBe('cy.get(`#btn`).click();');

            const seleniumCode = mapper.getCode(
                { selector: '#btn', actionType: 'click' },
                'python',
                0,
                'selenium',
            );
            expect(seleniumCode).toBe('driver.find_element(By.CSS_SELECTOR, "#btn").click()');
        });

        it('AssertionMapper translating to Cypress and Selenium', () => {
            const mapper = NodeMapperRegistry.getMapper('assertion');
            const cypressCode = mapper.getCode(
                { selector: '#alert', expected: 'Success', assertionType: 'text_contains' },
                'javascript',
                0,
                'cypress',
            );
            expect(cypressCode).toBe("cy.get(`#alert`).should('contain', `Success`);");

            const seleniumCode = mapper.getCode(
                { selector: '#alert', expected: 'Success', assertionType: 'text_contains' },
                'python',
                0,
                'selenium',
            );
            expect(seleniumCode).toBe(
                'self.assertIn("Success", driver.find_element(By.CSS_SELECTOR, "#alert").text)',
            );
        });
    });

    describe('CypressGenerator Integration', () => {
        it('should generate valid Cypress Javascript code structure', () => {
            const result = exportService.generateCode(sampleSteps, 'cypress', 'javascript');
            expect(result.success).toBe(true);
            expect(result.code).toContain("describe('Flujo Generado Hal-Test', () =>");
            expect(result.code).toContain(
                "cy.log('🚀 Iniciando ejecución del flujo en Cypress...');",
            );
            expect(result.code).toContain('cy.visit(`https://example.com`);');
            expect(result.code).toContain('cy.get(`#submit-btn`).click();');
            expect(result.code).toContain('cy.get(`#username`).type(`testuser`);');
            expect(result.code).toContain("cy.title().should('include', `Dashboard`);");
            expect(result.code).toContain('cy.wait(3000);');
            expect(result.code).toContain(
                "cy.log('⚠️ Acción no implementada: non_existent_node_type');",
            );
            expect(result.warnings.length).toBe(1);
            expect(result.warnings[0].nodeType).toBe('non_existent_node_type');
            expect(result.warnings[0].message).toContain('Cypress');
        });
    });

    describe('SeleniumGenerator Integration', () => {
        it('should generate valid Selenium Python code structure', () => {
            const result = exportService.generateCode(sampleSteps, 'selenium', 'python');
            expect(result.success).toBe(true);
            expect(result.code).toContain('import unittest');
            expect(result.code).toContain('class GeneratedFlow(unittest.TestCase):');
            expect(result.code).toContain('driver.get("https://example.com")');
            expect(result.code).toContain(
                'driver.find_element(By.CSS_SELECTOR, "#submit-btn").click()',
            );
            expect(result.code).toContain(
                'driver.find_element(By.CSS_SELECTOR, "#username").send_keys("testuser")',
            );
            expect(result.code).toContain('self.assertIn("Dashboard", driver.title)');
            expect(result.code).toContain('time.sleep(3)');
            expect(result.code).toContain(
                'print("⚠️ Acción no implementada: non_existent_node_type")',
            );
            expect(result.warnings.length).toBe(1);
            expect(result.warnings[0].nodeType).toBe('non_existent_node_type');
            expect(result.warnings[0].message).toContain('Selenium');
        });

        it('should generate valid Selenium Java code structure', () => {
            const result = exportService.generateCode(sampleSteps, 'selenium', 'java');
            expect(result.success).toBe(true);
            expect(result.code).toContain('public class GeneratedFlowTest {');
            expect(result.code).toContain('driver = new ChromeDriver();');
            expect(result.code).toContain('driver.get("https://example.com");');
            expect(result.code).toContain(
                'driver.findElement(By.cssSelector("#submit-btn")).click();',
            );
            expect(result.code).toContain(
                'driver.findElement(By.cssSelector("#username")).sendKeys("testuser");',
            );
            expect(result.code).toContain(
                'org.junit.jupiter.api.Assertions.assertTrue(driver.getTitle().contains("Dashboard"));',
            );
            expect(result.code).toContain('Thread.sleep(3000);');
            expect(result.code).toContain(
                'System.out.println("⚠️ Acción no implementada: non_existent_node_type");',
            );
            expect(result.warnings.length).toBe(1);
            expect(result.warnings[0].nodeType).toBe('non_existent_node_type');
            expect(result.warnings[0].message).toContain('Selenium');
        });
    });
});
