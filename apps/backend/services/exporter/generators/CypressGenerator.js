import { BaseGenerator } from '../core/BaseGenerator.js';
import { NodeMapperRegistry } from '../core/GeneratorRegistry.js';
import { variableManager } from '../../VariableManager.js';

export class CypressGenerator extends BaseGenerator {
    constructor(language, locale) {
        super(language, locale);
        this.framework = 'cypress';

        this.messages = {
            es: {
                start: '🚀 Iniciando ejecución del flujo en Cypress...',
                completed: '✅ Flujo completado con éxito.',
                not_implemented: 'Acción no implementada:',
            },
            en: {
                start: '🚀 Starting flow execution in Cypress...',
                completed: '✅ Flow completed successfully.',
                not_implemented: 'Action not implemented:',
            },
        };

        this.msg = this.isEn ? this.messages.en : this.messages.es;
    }

    generateHeader(_steps) {
        return `describe('Flujo Generado Hal-Test', () => {\n    it('Ejecución del flujo', () => {\n        cy.log('${this.msg.start}');\n`;
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
        const indent = '    '.repeat(depth + 2); // Inside describe -> it
        const label = step.data?.label || step.data?.customLabel || step.label || type;
        const nodeId = step.id || step.nodeId || '';
        const nodeIdComment = nodeId ? `// [node_id: ${nodeId}]` : '';

        let nodeCode = '';

        if (mapper) {
            const mapperParams = { ...config, type, actionType: type };
            nodeCode = mapper.getCode(mapperParams, this.language, index, this.framework);
        } else {
            this.addWarning(type, label, index);
            nodeCode = `cy.log('⚠️ ${this.msg.not_implemented} ${type}');`;
        }

        return `${indent}${nodeIdComment ? nodeIdComment + '\n' + indent : ''}cy.log(\`👉 Step: ${label}\`);\n${indent}${nodeCode}`;
    }

    generateFooter() {
        return `\n        cy.log('${this.msg.completed}');\n    });\n});\n`;
    }
}
