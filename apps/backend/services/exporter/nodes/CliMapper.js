/**
 * Mapper for CLI/System testing node types.
 * Generates code for command-line execution and CI/CD integration.
 */

export const CliMapper = {
    type: ['run_tests', 'cli_params', 'return_code', 'integrate_ci'],

    getCode: (params, lang, index, _framework = 'playwright') => {
        const action = params.actionType || params.type;
        const commentChar = lang.toLowerCase() === 'python' ? '#' : '//';

        switch (action) {
            case 'run_tests': {
                const command = params.command || params.testCommand || 'npx playwright test';
                if (lang.toLowerCase() === 'python') {
                    return `import subprocess\nsubprocess.run(["${command}"], shell=True, check=True)`;
                }
                if (lang.toLowerCase() === 'java') {
                    return `Runtime.getRuntime().exec("${command}").waitFor();`;
                }
                if (lang.toLowerCase() === 'csharp') {
                    return `System.Diagnostics.Process.Start("${command}");`;
                }
                return `const { execSync } = require('child_process');\nexecSync('${command}', { stdio: 'inherit' });`;
            }

            case 'cli_params': {
                const args = params.args || params.parameters || '';
                return `${commentChar} CLI parameters: ${args}\n${commentChar} Access via process.argv or command-line argument parsing`;
            }

            case 'return_code': {
                const expectedCode = params.expectedCode || params.returnCode || '0';
                return `${commentChar} Expected return code: ${expectedCode}\n${commentChar} Validate exit code from previous command execution`;
            }

            case 'integrate_ci': {
                const platform = params.platform || 'github';
                const ciConfig = params.ciConfig || 'default';
                return `${commentChar} CI/CD Integration: ${platform}\n${commentChar} Configuration: ${ciConfig}\n${commentChar} This node configures CI/CD pipeline integration`;
            }

            default:
                return `${commentChar} CLI action: ${action}`;
        }
    },
};
