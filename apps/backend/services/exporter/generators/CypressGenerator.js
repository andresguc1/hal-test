import { BaseGenerator } from '../core/BaseGenerator.js';
import { NodeMapperRegistry } from '../core/GeneratorRegistry.js';
import { variableManager } from '../../VariableManager.js';

const CONTAINER_TYPES = ['component', 'loop', 'for_each'];

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

        const indent = '    '.repeat(depth + 2);
        const label = step.data?.label || step.data?.customLabel || step.label || type;
        const nodeId = step.id || step.nodeId || '';
        const nodeIdComment = nodeId ? `// [node_id: ${nodeId}]` : '';

        // Handle compound/container nodes (component, loop, for_each)
        const subNodes = step.data?.subNodes || step.subNodes || [];
        if (CONTAINER_TYPES.includes(type) || subNodes.length > 0) {
            const subCode = this.generateSteps(subNodes, depth + 1);

            if (type === 'component') {
                // Component: group as a nested describe
                return `${indent}${nodeIdComment ? nodeIdComment + '\n' + indent : ''}describe('${label}', () => {\n${subCode}\n${indent}});`;
            }

            if (type === 'for_each') {
                const items = config.items || config.source || 'items';
                const itemAlias = config.itemAlias || 'item';
                return `${indent}${nodeIdComment ? nodeIdComment + '\n' + indent : ''}cy.get('${items}).each(($el) => {\n${indent}    const ${itemAlias} = $el.text();\n${subCode}\n${indent}});`;
            }

            if (type === 'loop') {
                const count = config.count || config.iterations || 3;
                const counterVar = config.counterVariable || 'i';
                return `${indent}${nodeIdComment ? nodeIdComment + '\n' + indent : ''}Cypress._.times(${count}, (${counterVar}) => {\n${subCode}\n${indent}});`;
            }
        }

        const mapper = NodeMapperRegistry.getMapper(type);
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
