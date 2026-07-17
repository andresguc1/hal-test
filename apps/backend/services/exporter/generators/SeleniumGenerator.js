import { BaseGenerator } from '../core/BaseGenerator.js';
import { NodeMapperRegistry } from '../core/GeneratorRegistry.js';
import { variableManager } from '../../VariableManager.js';

export class SeleniumGenerator extends BaseGenerator {
    constructor(language, locale) {
        super(language, locale);
        this.framework = 'selenium';

        this.messages = {
            es: {
                start: '🚀 Iniciando ejecución del flujo en Selenium...',
                completed: '✅ Flujo completado con éxito.',
                not_implemented: 'Acción no implementada:',
            },
            en: {
                start: '🚀 Starting flow execution in Selenium...',
                completed: '✅ Flow completed successfully.',
                not_implemented: 'Action not implemented:',
            },
        };

        this.msg = this.isEn ? this.messages.en : this.messages.es;
    }

    generateHeader(_steps) {
        const lang = this.language.toLowerCase();
        if (lang === 'python') {
            return `import unittest\nimport time\nfrom selenium import webdriver\nfrom selenium.webdriver.common.by import By\nfrom selenium.webdriver.common.keys import Keys\nfrom selenium.webdriver.support.ui import WebDriverWait\nfrom selenium.webdriver.support import expected_conditions as EC\n\nclass GeneratedFlow(unittest.TestCase):\n    def setUp(self):\n        self.driver = webdriver.Chrome()\n        self.driver.implicitly_wait(10)\n        self.driver.maximize_window()\n\n    def test_flow(self):\n        driver = self.driver\n        print("${this.msg.start}")\n`;
        }
        if (lang === 'java') {
            return `import org.junit.jupiter.api.AfterEach;\nimport org.junit.jupiter.api.BeforeEach;\nimport org.junit.jupiter.api.Test;\nimport org.openqa.selenium.By;\nimport org.openqa.selenium.WebDriver;\nimport org.openqa.selenium.WebElement;\nimport org.openqa.selenium.chrome.ChromeDriver;\nimport org.openqa.selenium.interactions.Actions;\nimport org.openqa.selenium.support.ui.ExpectedConditions;\nimport org.openqa.selenium.support.ui.WebDriverWait;\nimport org.openqa.selenium.Keys;\nimport java.time.Duration;\n\npublic class GeneratedFlowTest {\n    private WebDriver driver;\n\n    @BeforeEach\n    public void setUp() {\n        driver = new ChromeDriver();\n        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));\n        driver.manage().window().maximize();\n    }\n\n    @Test\n    public void testFlow() {\n        System.out.println("${this.msg.start}");\n`;
        }
        // Fallback comment
        return `# Selenium generator for ${this.language} not fully supported. Falling back to Python template.\n`;
    }

    generateNodeCode(step, index, depth) {
        const type = step.type || step.action;
        const ignoredTypes = [
            'guide',
            'note',
            'comment',
            'annotation',
            'label',
            'sticky',
            'sticky_note',
            'discussion',
        ];
        if (ignoredTypes.includes(type)) {
            return '';
        }

        const rawConfig = step.data?.configuration || step.data || step || {};
        const config = variableManager.resolveRecursive(
            rawConfig,
            variableManager.getActiveRunId?.(),
        );

        const mapper = NodeMapperRegistry.getMapper(type);
        const indent = '    '.repeat(depth + 2); // Inside test_flow class method
        const label = step.data?.label || step.data?.customLabel || step.label || type;
        const nodeId = step.id || step.nodeId || '';
        const isJava = this.language.toLowerCase() === 'java';
        const nodeIdComment = nodeId
            ? isJava
                ? `// [node_id: ${nodeId}]`
                : `# [node_id: ${nodeId}]`
            : '';

        let nodeCode = '';

        if (mapper) {
            const mapperParams = { ...config, type, actionType: type };
            nodeCode = mapper.getCode(mapperParams, this.language, index, this.framework);
        } else {
            this.addWarning(type, label, index);
            nodeCode = isJava
                ? `System.out.println("⚠️ ${this.msg.not_implemented} ${type}");`
                : `print("⚠️ ${this.msg.not_implemented} ${type}")`;
        }

        const printStatement = isJava
            ? `System.out.println("👉 Step: ${label}");`
            : `print("👉 Step: ${label}")`;

        return `${indent}${nodeIdComment ? nodeIdComment + '\n' + indent : ''}${printStatement}\n${indent}${nodeCode}`;
    }

    generateFooter() {
        const lang = this.language.toLowerCase();
        if (lang === 'python') {
            return `\n        print("${this.msg.completed}")\n\n    def tearDown(self):\n        self.driver.quit()\n\nif __name__ == "__main__":\n    unittest.main()\n`;
        }
        if (lang === 'java') {
            return `\n        System.out.println("${this.msg.completed}");\n    }\n\n    @AfterEach\n    public void tearDown() {\n        if (driver != null) {\n            driver.quit();\n        }\n    }\n}\n`;
        }
        return ``;
    }
}
