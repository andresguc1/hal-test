/**
 * Detects the test framework based on file content.
 */
export class FrameworkDetector {
    static detect(fileContent) {
        if (typeof fileContent !== 'string') {
            console.error(
                '[ERROR] FrameworkDetector received non-string content:',
                typeof fileContent,
            );
            return 'unknown';
        }

        // Simple patterns for quick detection
        const patterns = {
            playwright: [
                /import\s+.*\s+from\s+['"]@playwright\/test['"]/,
                /const\s+.*\s+=\s+require\(['"]@playwright\/test['"]\)/,
                /test\s*\(/,
                /expect\(.*\)\.toBe/,
            ],
            cypress: [
                /cy\.visit\(/,
                /cy\.get\(/,
                /describe\(['"].*['"],\s*\(\)\s*=>/,
                /it\(['"].*['"],\s*\(\)\s*=>/,
            ],
            puppeteer: [
                /require\(['"]puppeteer['"]\)/,
                /import\s+.*\s+from\s+['"]puppeteer['"]/,
                /puppeteer\.launch\(/,
                /page\.goto\(/, // Common, but together with puppeteer import it is strong
            ],
            testcafe: [
                /import\s+.*\s+from\s+['"]testcafe['"]/,
                /fixture\s*`/,
                /test\s*\(/, // May collide, but fixture is unique
                /\.page\s*\(/,
            ],
            nightwatch: [
                /module\.exports\s*=\s*{/,
                /browser\.url\(/,
                /browser\.waitForElementVisible\(/,
                /client\.url\(/, // Old versions
            ],
            selenium: [
                /import\s+.*\s+from\s+['"]selenium-webdriver['"]/,
                /require\(['"]selenium-webdriver['"]\)/,
                /driver\.findElement\(/,
                /By\.id\(/,
                /WebDriverWait/,
            ],
            selenium_python: [
                /from\s+selenium\s+import\s+webdriver/,
                /import\s+selenium/,
                /driver\.find_element/, // snake_case
                /def\s+test_/,
                /class\s+.*\(unittest\.TestCase\):/,
            ],
            selenium_java: [
                /import\s+org\.openqa\.selenium/,
                /WebDriver\s+driver/,
                /driver\.findElement/, // camelCase
                /public\s+void\s+test/,
                /@Test/,
            ],
            selenium_csharp: [
                /using\s+OpenQA\.Selenium/,
                /IWebDriver\s+driver/,
                /driver\.FindElement/, // PascalCase
                /\[Test\]/,
                /public\s+void\s+Test/,
            ],
            katalon: [
                /import\s+com\.kms\.katalon\.core/,
                /WebUI\.click\(/,
                /WebUI\.openBrowser/,
                /findTestObject\(/,
            ],
            testrigor: [
                /click\s+['"].*['"]/, // testRigor is almost natural language
                /type\s+['"].*['"]\s+into\s+['"].*['"]/,
                /check\s+that\s+page\s+contains/,
                /login\s+as/,
                /check\s+that\s+page\s+contains/,
                /login\s+as/,
            ],
            webdriverio: [
                /browser\.url\(/,
                /\$\(['"].*['"]\)\.click\(/,
                /\$\(['"].*['"]\)\.setValue\(/,
                /describe\(['"].*['"],\s*function\(\)\s*{/, // Mocha style common in WDIO
                /const\s+.*\s+=\s+require\(['"]webdriverio['"]\)/,
            ],
        };

        let scores = {
            playwright: 0,
            cypress: 0,
            puppeteer: 0,
            testcafe: 0,
            nightwatch: 0,
            selenium: 0,
            selenium_python: 0,
            selenium_java: 0,
            selenium_csharp: 0,
            katalon: 0,
            testrigor: 0,
            webdriverio: 0,
        };

        for (const [framework, regexes] of Object.entries(patterns)) {
            for (const regex of regexes) {
                if (regex.test(fileContent)) {
                    scores[framework]++;
                }
            }
        }

        // Return the framework with the highest score
        console.log('[DEBUG] Content preview:', fileContent.substring(0, 100));
        console.log('[DEBUG] Detection scores:', scores);
        const winner = Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b));

        if (scores[winner] === 0) {
            console.warn('[WARN] No framework detected.');
            return 'unknown';
        }

        return winner;
    }
}
