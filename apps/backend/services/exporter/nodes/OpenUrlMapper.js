/**
 * Mapper for the 'Open URL' node.
 * Maps 'open_url' and 'navigate' actions to Playwright code.
 */
export const OpenUrlMapper = {
    type: ['open_url', 'navigate'],

    /**
     * @param {object} params - Node configuration
     * @param {string} lang - Programming language
     * @returns {string}
     */
    getCode: (params, lang) => {
        const url = params.url || '';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return `await page.goto('${url}');`;
            case 'python':
                return `await page.goto("${url}")`;
            case 'java':
                return `page.navigate("${url}");`;
            case 'csharp':
                return `await page.GotoAsync("${url}");`;
            default:
                return `// open_url not implemented for ${lang}`;
        }
    },
};
