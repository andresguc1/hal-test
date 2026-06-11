/**
 * Mapper for flow control nodes.
 * Covers: variable, conditional, loop, for_each, switch, branch,
 *         pause, fail_flow, transform, backend_js, wait_conditional, flow_control
 */
export const FlowControlMapper = {
    type: [
        'variable',
        'conditional',
        'loop',
        'for_each',
        'switch',
        'branch',
        'pause',
        'fail_flow',
        'transform',
        'backend_js',
        'wait_conditional',
        'flow_control',
    ],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const l = lang.toLowerCase();
        const isJsLike = l === 'javascript' || l === 'typescript';
        const cc = l === 'python' ? '#' : '//';

        switch (action) {
            case 'variable': {
                const name = params.name || params.variableName || 'myVar';
                const value = params.value !== undefined ? JSON.stringify(params.value) : "''";
                if (isJsLike) return `const ${name} = ${value};`;
                if (l === 'python') return `${name} = ${value}`;
                if (l === 'java') return `var ${name} = ${value};`;
                if (l === 'csharp') return `var ${name} = ${value};`;
                return `${cc} variable: ${name} = ${value}`;
            }

            case 'conditional': {
                const cond = params.condition || params.expression || 'true';
                if (isJsLike) return `if (${cond}) {\n        ${cc} Then branch\n    }`;
                if (l === 'python') return `if ${cond}:\n        # Then branch\n        pass`;
                if (l === 'java') return `if (${cond}) {\n            // Then branch\n        }`;
                if (l === 'csharp') return `if (${cond}) {\n            // Then branch\n        }`;
                return `${cc} conditional: ${cond}`;
            }

            case 'loop': {
                const count = params.iterations || params.count || 3;
                if (isJsLike)
                    return `for (let i = 0; i < ${count}; i++) {\n        ${cc} Loop body\n    }`;
                if (l === 'python')
                    return `for i in range(${count}):\n        # Loop body\n        pass`;
                if (l === 'java')
                    return `for (int i = 0; i < ${count}; i++) {\n            // Loop body\n        }`;
                if (l === 'csharp')
                    return `for (int i = 0; i < ${count}; i++) {\n            // Loop body\n        }`;
                return `${cc} loop: ${count} iterations`;
            }

            case 'for_each': {
                const collection =
                    params.collection || params.items || params.dataSource || 'items';
                const itemVar = params.itemVariable || params.iteratorName || 'item';
                if (isJsLike)
                    return `for (const ${itemVar} of ${collection}) {\n        ${cc} ForEach body\n    }`;
                if (l === 'python')
                    return `for ${itemVar} in ${collection}:\n        # ForEach body\n        pass`;
                if (l === 'java')
                    return `for (var ${itemVar} : ${collection}) {\n            // ForEach body\n        }`;
                if (l === 'csharp')
                    return `foreach (var ${itemVar} in ${collection}) {\n            // ForEach body\n        }`;
                return `${cc} for_each: ${collection}`;
            }

            case 'switch': {
                const expr = params.expression || params.variable || 'value';
                if (isJsLike)
                    return `switch (${expr}) {\n        case 'option1':\n            ${cc} Case body\n            break;\n        default:\n            ${cc} Default case\n            break;\n    }`;
                if (l === 'python')
                    return `match ${expr}:\n        case "option1":\n            # Case body\n            pass\n        case _:\n            # Default case\n            pass`;
                if (l === 'java')
                    return `switch (${expr}) {\n            case "option1":\n                // Case body\n                break;\n            default:\n                // Default case\n                break;\n        }`;
                if (l === 'csharp')
                    return `switch (${expr}) {\n            case "option1":\n                // Case body\n                break;\n            default:\n                // Default case\n                break;\n        }`;
                return `${cc} switch: ${expr}`;
            }

            case 'branch':
                return `${cc} Branch: parallel execution path`;

            case 'pause': {
                const ms = params.ms || params.duration || params.timeout || 1000;
                if (isJsLike) return `await page.waitForTimeout(${ms});`;
                if (l === 'python') return `await page.wait_for_timeout(${ms})`;
                if (l === 'java') return `page.waitForTimeout(${ms});`;
                if (l === 'csharp') return `await page.WaitForTimeoutAsync(${ms});`;
                return `${cc} pause: ${ms}ms`;
            }

            case 'fail_flow': {
                const reason = params.reason || params.message || 'Flow intentionally failed';
                if (isJsLike) return `throw new Error(\`${reason}\`);`;
                if (l === 'python') return `raise Exception("${reason}")`;
                if (l === 'java') return `throw new RuntimeException("${reason}");`;
                if (l === 'csharp') return `throw new Exception("${reason}");`;
                return `${cc} fail: ${reason}`;
            }

            case 'transform': {
                const expr = params.expression || params.script || '';
                if (isJsLike) return `const result = ${expr || 'null'};`;
                if (l === 'python') return `result = ${expr || 'None'}`;
                if (l === 'java') return `var result = ${expr || 'null'};`;
                if (l === 'csharp') return `var result = ${expr || 'null'};`;
                return `${cc} transform: ${expr}`;
            }

            case 'backend_js': {
                const script = params.script || params.code || '// Custom logic';
                if (isJsLike) return script;
                return `${cc} Backend JS (translated manually):\n${cc} ${script.replace(/\n/g, `\n${cc} `)}`;
            }

            case 'wait_conditional': {
                const cond = params.condition || params.expression || 'true';
                const timeout = params.timeout || 30000;
                if (isJsLike)
                    return `await page.waitForFunction(() => ${cond}, { timeout: ${timeout} });`;
                if (l === 'python')
                    return `await page.wait_for_function("() => ${cond}", timeout=${timeout})`;
                if (l === 'java')
                    return `page.waitForFunction("() => ${cond}", new Page.WaitForFunctionOptions().setTimeout(${timeout}));`;
                if (l === 'csharp')
                    return `await page.WaitForFunctionAsync("() => ${cond}", new() { Timeout = ${timeout} });`;
                return `${cc} wait_conditional: ${cond}`;
            }

            case 'flow_control': {
                const flowAction = params.flowAction || params.action || 'continue';
                if (flowAction === 'break') {
                    return isJsLike || l === 'java' || l === 'csharp' ? 'break;' : 'break';
                }
                if (flowAction === 'continue') {
                    return isJsLike || l === 'java' || l === 'csharp' ? 'continue;' : 'continue';
                }
                return `${cc} flow_control: ${flowAction}`;
            }

            default:
                return `${cc} Flow control action: ${action}`;
        }
    },
};
