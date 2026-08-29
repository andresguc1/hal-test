import { AbstractMapper } from '../core/AbstractMapper.js';

/**
 * Mapper para convertir código Playwright (AST de Babel) a acciones Hal_Test.
 *
 * Emite únicamente acciones nativas registradas en el runtime Hal_Test
 * (ver core/pluginBootstrap.js). Cualquier método Playwright sin equivalente
 * nativo cae a un `execute_js` placeholder explícito para que el usuario tenga
 * control humano sobre el mapeo restante.
 */
export class PlaywrightMapper extends AbstractMapper {
    constructor() {
        super();
        this.pageMethodMap = this.buildPageMethodMap();
    }

    buildPageMethodMap() {
        return {
            goto: 'open_url',
            click: 'click',
            dblclick: 'click',
            fill: 'type_text',
            type: 'type_text',
            hover: 'hover',
            check: 'click',
            uncheck: 'click',
            selectOption: 'select_option',
            setInputFiles: 'upload_file',
            dragAndDrop: 'drag_drop',
            waitForTimeout: 'pause',
            waitForSelector: 'wait_visible',
            waitForLoadState: 'wait_navigation',
            waitForNavigation: 'wait_navigation',
            goBack: 'go_back',
            goForward: 'go_forward',
            reload: 'reload_page',
            setViewportSize: 'resize_viewport',
            screenshot: 'take_screenshot',
            waitForFunction: 'wait_conditional',
        };
    }

    map(testBodyNode) {
        const actions = [];
        if (testBodyNode.type !== 'BlockStatement') {
            return actions;
        }
        for (const statement of testBodyNode.body) {
            const mapped = this.mapStatement(statement);
            if (mapped && mapped.length > 0) {
                actions.push(...mapped);
            }
        }
        return actions;
    }

    mapStatement(statement) {
        // Declaraciones de nivel superior no ejecutables: skip
        if (statement.type === 'ImportDeclaration' || statement.type === 'FunctionDeclaration') {
            return [];
        }

        // await page.action(...) o ejecución directa
        if (statement.type === 'ExpressionStatement') {
            const expr = statement.expression;
            if (expr.type === 'AwaitExpression') {
                return this.mapCallExpression(expr.argument);
            }
            if (expr.type === 'CallExpression' || expr.type === 'MemberExpression') {
                return this.mapCallExpression(expr);
            }
        }

        // Promise.all([page.waitForNavigation(), locator.click()])
        if (statement.type === 'VariableDeclaration') {
            return this.mapVariableDeclaration(statement);
        }

        return [];
    }

    mapVariableDeclaration(statement) {
        const actions = [];
        for (const decl of statement.declarations) {
            if (!decl.init) continue;
            const inner = decl.init.type === 'AwaitExpression' ? decl.init.argument : decl.init;
            const mapped = this.mapCallExpression(inner);
            if (mapped && mapped.length > 0) actions.push(...mapped);
        }
        return actions;
    }

    mapCallExpression(callExpr) {
        if (!callExpr) return [];
        if (callExpr.type === 'MemberExpression') {
            return this.mapMemberCall(callExpr, []);
        }
        if (callExpr.type !== 'CallExpression') return [];

        const callee = callExpr.callee;
        const args = callExpr.arguments || [];

        // expect(...).toBeX()
        if (
            callee.type === 'MemberExpression' &&
            callee.property.type === 'Identifier' &&
            callee.object.type === 'CallExpression'
        ) {
            const innerExpr = callee.object;
            const innerCallee = innerExpr.callee;
            const matcher = callee.property.name;

            if (innerCallee && innerCallee.type === 'Identifier' && innerCallee.name === 'expect') {
                return this.mapExpectAssertion(innerExpr.arguments, matcher, args);
            }

            // page.locator('...').action() | page.getByRole(...).action()
            return this.mapChainedLocatorCall(innerExpr, matcher, args);
        }

        // page.action(...) | page.locator(...).action(...) | test.step(...)
        if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
            return this.mapMemberCall(callee, args);
        }

        return [];
    }

    mapMemberCall(callee, args) {
        const methodName = callee.property.name;
        const object = callee.object;

        // Objeto raíz es la variable de página / test / expect
        if (object.type === 'Identifier') {
            if (object.name === 'page') {
                return this.mapPageMethod(methodName, args);
            }
            if (object.name === 'test' && methodName === 'step') {
                return this.mapTestStep(args);
            }
            if (object.name === 'expect') {
                return this.mapExpectAssertion(args, methodName, []);
            }
            return this.mapUnknownMethod(methodName);
        }

        // page.locator('...').action() o page.getByRole(...).action()
        if (object.type === 'CallExpression') {
            return this.mapChainedLocatorCall(object, methodName, args);
        }

        return [];
    }

    mapChainedLocatorCall(locatorCallExpr, methodName, args) {
        const locatorExpr = this.buildLocatorExpression(locatorCallExpr);
        if (!locatorExpr) return this.mapUnknownMethod(methodName);

        const action = this.pageMethodMap[methodName];
        if (!action) return this.mapUnknownMethod(methodName);

        // En llamadas encadenadas el selector ya vive en el objeto del locator,
        // así que los args se refieren al método (ej. locator.fill('text')).
        return [this.buildAction(action, locatorExpr, args, methodName, true)];
    }

    buildAction(action, selector, args, sourceMethod, isChained = false) {
        const entry = { action };
        if (selector) entry.selector = selector;

        switch (action) {
            case 'open_url':
                entry.url = this.extractString(args[0]);
                break;
            case 'type_text':
                entry.text = this.extractString(isChained ? args[0] : args[1]);
                break;
            case 'press_key':
                entry.key = this.extractString(args[1]) || this.extractString(args[0]);
                break;
            case 'select_option': {
                const optVal = this.extractOptionValue(isChained ? args[0] : args[1]);
                if (optVal !== undefined) entry.value = optVal;
                else entry.label = this.extractString(isChained ? args[0] : args[1]);
                break;
            }
            case 'upload_file':
                entry.filePath = this.extractString(isChained ? args[0] : args[1]);
                break;
            case 'drag_drop':
                entry.source = selector;
                entry.target = this.extractLocatorArg(args[1]) || this.extractString(args[1]);
                delete entry.selector;
                break;
            case 'resize_viewport': {
                const size = args[0] && args[0].type === 'ObjectExpression' ? args[0] : null;
                if (size) {
                    entry.width = this.extractNumber(
                        size.properties.find((p) => p.key.name === 'width')?.value,
                    );
                    entry.height = this.extractNumber(
                        size.properties.find((p) => p.key.name === 'height')?.value,
                    );
                } else {
                    entry.width = this.extractNumber(args[0]) || this.extractString(args[0]);
                    entry.height = this.extractNumber(args[1]) || this.extractString(args[1]);
                }
                break;
            }
            case 'take_screenshot':
                if (args[0] && args[0].type === 'ObjectExpression') {
                    const pathProp = args[0].properties.find((p) => p.key.name === 'path');
                    if (pathProp) entry.name = this.extractString(pathProp.value);
                    const fullPage = args[0].properties.find((p) => p.key.name === 'fullPage');
                    if (fullPage && fullPage.value.value === true) entry.fullPage = true;
                } else {
                    entry.name = this.extractString(args[0]);
                }
                break;
            case 'pause':
                entry.duration = this.extractNumber(args[0]);
                break;
            case 'wait_navigation': {
                const until = this.extractString(args[0]);
                if (until && /^(load|domcontentloaded|networkidle)$/.test(until)) {
                    entry.waitUntil = until;
                }
                break;
            }
            case 'wait_conditional': {
                const fn = args[0];
                if (
                    fn &&
                    fn.type === 'ArrowFunctionExpression' &&
                    fn.body.type === 'StringLiteral'
                ) {
                    entry.condition = fn.body.value;
                }
                break;
            }
            case 'click':
                if (sourceMethod === 'dblclick') entry.clickCount = 2;
                break;
            default:
                break;
        }
        return entry;
    }

    mapPageMethod(methodName, args) {
        const action = this.pageMethodMap[methodName];

        // press: solo Enter es nativo (type_text + pressEnter); el resto manual
        if (methodName === 'press') {
            const key = this.extractString(args[1]);
            const selector = this.extractLocatorArg(args[0]);
            if (key && key.trim().toLowerCase() === 'enter' && selector) {
                return [
                    {
                        action: 'type_text',
                        selector,
                        text: '',
                        pressEnter: true,
                    },
                ];
            }
            return this.mapUnknownMethod(`page.press(${key || '?'})`);
        }

        if (!action) {
            return this.mapUnknownMethod(`page.${methodName}`);
        }

        const noSelector = [
            'open_url',
            'wait_navigation',
            'resize_viewport',
            'go_back',
            'go_forward',
            'reload_page',
            'pause',
            'wait_conditional',
        ];

        if (noSelector.includes(action)) {
            return [this.buildAction(action, null, args, methodName)];
        }

        const selector = this.extractLocatorArg(args[0]);
        return [this.buildAction(action, selector, args, methodName)];
    }

    mapTestStep(args) {
        const stepLabel = this.extractString(args[0]) || 'Step';
        const callback = args[1];
        let subActions = [];

        if (
            callback &&
            (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')
        ) {
            subActions = this.map(callback.body);
        }

        return [
            {
                action: 'component',
                label: stepLabel,
                subNodes: subActions,
            },
        ];
    }

    mapExpectAssertion(targetArgs, matcher, matcherArgs) {
        const target = this.extractLocatorTarget(targetArgs && targetArgs[0]);

        if (matcher === 'not') {
            // Flujo not.toBeX() no se desambigua aquí; se deja a control humano.
            return this.mapUnknownMethod('expect().not');
        }

        const baseMap = {
            toBeVisible: { assertionType: 'visible' },
            toBeHidden: { assertionType: 'hidden' },
            toBeEnabled: { assertionType: 'enabled' },
            toBeDisabled: { assertionType: 'disabled' },
            toHaveText: {
                assertionType: 'text_equals',
                expected: this.extractString(matcherArgs[0]),
            },
            toContainText: {
                assertionType: 'text_contains',
                expected: this.extractString(matcherArgs[0]),
            },
            toHaveValue: {
                assertionType: 'has_value',
                expected: this.extractString(matcherArgs[0]),
            },
            toHaveAttribute: {
                assertionType: 'has_attribute',
                attribute: this.extractString(matcherArgs[0]),
                expected: this.extractString(matcherArgs[1]),
            },
            toHaveURL: {
                assertionType: 'url_contains',
                expected: this.extractString(matcherArgs[0]),
            },
            toHaveTitle: {
                assertionType: 'title_contains',
                expected: this.extractString(matcherArgs[0]),
            },
            toHaveClass: {
                assertionType: 'has_class',
                expected: this.extractString(matcherArgs[0]),
            },
            toBeChecked: { assertionType: 'checked' },
            toBeEmpty: { assertionType: 'empty' },
        };

        const cfg = baseMap[matcher];
        if (!cfg) {
            return this.mapUnknownMethod(`expect().${matcher}`);
        }

        const assertion = {
            action: 'validate_semantic',
            assertionType: cfg.assertionType,
            ...(typeof target === 'string' ? { selector: target } : {}),
            ...(cfg.expected !== undefined ? { expected: cfg.expected } : {}),
            ...(cfg.attribute ? { attribute: cfg.attribute } : {}),
            description: `Playwright assertion: ${matcher}`,
        };
        return [assertion];
    }

    mapUnknownMethod(reference) {
        return [
            {
                action: 'execute_js',
                description: `Unmapped Playwright: ${reference}`,
                script: `// TODO: Manual mapping for ${reference}`,
            },
        ];
    }

    // ---- Helpers de extracción de AST ----

    extractLocatorTarget(arg) {
        if (!arg) return null;
        switch (arg.type) {
            case 'StringLiteral':
            case 'TemplateLiteral':
                return this.extractString(arg);
            case 'CallExpression':
            case 'MemberExpression':
                return this.buildLocatorExpression(arg);
            default:
                return null;
        }
    }

    extractLocatorArg(arg) {
        if (!arg) return undefined;
        switch (arg.type) {
            case 'StringLiteral':
            case 'TemplateLiteral':
                return this.extractString(arg);
            case 'CallExpression':
            case 'MemberExpression':
                return this.buildLocatorExpression(arg);
            default:
                return undefined;
        }
    }

    buildLocatorExpression(node) {
        if (!node) return null;

        // page.locator('#x') / page.getByRole('button', { name })
        if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression') {
            const base = this.buildLocatorExpression(node.callee.object);
            const method = node.callee.property.name;
            if (
                !/^(locator|getByRole|getByLabel|getByText|getByTestId|getByPlaceholder|getByAltText|getByTitle|filter|frameLocator)$/.test(
                    method,
                )
            ) {
                return null;
            }
            const inner = this.serializeCall(method, node.arguments || []);
            return base ? `${base}.${inner}` : inner;
        }

        if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
            const method = node.callee.name;
            if (
                /^(locator|getByRole|getByLabel|getByText|getByTestId|getByPlaceholder|getByAltText|getByTitle|getByExactText)$/.test(
                    method,
                )
            ) {
                return this.serializeCall(method, node.arguments || []);
            }
            return null;
        }

        return null;
    }

    serializeCall(method, args) {
        if (method === 'locator') {
            return `locator('${this.escapeLiteral(this.extractString(args[0]))}')`;
        }
        if (method === 'getByRole') {
            const role = this.escapeLiteral(this.extractString(args[0]));
            const name = this.extractString(
                args[1]?.properties.find((p) => p.key.name === 'name')?.value,
            );
            return name
                ? `getByRole('${role}', { name: '${this.escapeLiteral(name)}' })`
                : `getByRole('${role}')`;
        }
        if (method === 'filter') {
            return `filter({ hasText: '${this.escapeLiteral(this.extractString(args[0]))}' })`;
        }
        if (method === 'frameLocator') {
            return `frameLocator('${this.escapeLiteral(this.extractString(args[0]))}')`;
        }
        if (
            /^(getByLabel|getByText|getByTestId|getByPlaceholder|getByAltText|getByTitle|getByExactText|getByNumber)$/.test(
                method,
            )
        ) {
            return `${method}('${this.escapeLiteral(this.extractString(args[0]))}')`;
        }
        return `${method}()`;
    }

    extractString(arg) {
        if (!arg) return undefined;
        switch (arg.type) {
            case 'StringLiteral':
                return arg.value;
            case 'TemplateLiteral':
                if (arg.expressions && arg.expressions.length > 0) {
                    return arg.quasis.map((q) => q.value.cooked ?? q.value.raw).join('${...}');
                }
                return arg.quasis[0]?.value.cooked ?? arg.quasis[0]?.value.raw;
            case 'NumericLiteral':
                return String(arg.value);
            case 'BooleanLiteral':
                return String(arg.value);
            case 'NullLiteral':
                return null;
            case 'RegExpLiteral':
                return `/${arg.pattern}/${arg.flags || ''}`;
            default:
                return undefined;
        }
    }

    extractNumber(arg) {
        if (!arg) return undefined;
        if (arg.type === 'NumericLiteral') return arg.value;
        if (arg.type === 'StringLiteral') {
            const n = parseInt(arg.value, 10);
            return Number.isNaN(n) ? undefined : n;
        }
        return undefined;
    }

    extractOptionValue(arg) {
        if (!arg) return undefined;
        if (arg.type === 'StringLiteral' || arg.type === 'TemplateLiteral') {
            return this.extractString(arg);
        }
        if (arg.type === 'ObjectExpression') {
            const valueProp = arg.properties.find((p) => p.key.name === 'value');
            if (valueProp) return this.extractString(valueProp.value);
            const labelProp = arg.properties.find((p) => p.key.name === 'label');
            if (labelProp) return this.extractString(labelProp.value);
        }
        return undefined;
    }

    escapeLiteral(value) {
        return value == null ? '' : String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }
}
