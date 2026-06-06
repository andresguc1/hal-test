import { FrameworkDetector } from './detectors/FrameworkDetector.js';
import { PlaywrightParser } from './playwright/PlaywrightParser.js';
import { PlaywrightMapper } from './playwright/PlaywrightMapper.js';
import { CypressParser } from './cypress/CypressParser.js';
import { CypressMapper } from './cypress/CypressMapper.js';
import { TestCafeParser } from './testcafe/TestCafeParser.js';
import { TestCafeMapper } from './testcafe/TestCafeMapper.js';
import { PuppeteerParser } from './puppeteer/PuppeteerParser.js';
import { PuppeteerMapper } from './puppeteer/PuppeteerMapper.js';
import { WebdriverIOParser } from './webdriverio/WebdriverIOParser.js';
import { WebdriverIOMapper } from './webdriverio/WebdriverIOMapper.js';
import { NightwatchParser } from './nightwatch/NightwatchParser.js';
import { NightwatchMapper } from './nightwatch/NightwatchMapper.js';
import { SeleniumParser } from './selenium/SeleniumParser.js';
import { SeleniumMapper } from './selenium/SeleniumMapper.js';
import { PythonSeleniumParser } from './selenium/python/PythonSeleniumParser.js';
import { PythonSeleniumMapper } from './selenium/python/PythonSeleniumMapper.js';
import { JavaSeleniumParser } from './selenium/java/JavaSeleniumParser.js';
import { JavaSeleniumMapper } from './selenium/java/JavaSeleniumMapper.js';
import { CSharpSeleniumParser } from './selenium/csharp/CSharpSeleniumParser.js';
import { CSharpSeleniumMapper } from './selenium/csharp/CSharpSeleniumMapper.js';
import { KatalonParser } from './katalon/KatalonParser.js';
import { KatalonMapper } from './katalon/KatalonMapper.js';
import { TestRigorParser } from './testrigor/TestRigorParser.js';
import { TestRigorMapper } from './testrigor/TestRigorMapper.js';
import { ProjectScanner } from './project/ProjectScanner.js';
import { ProjectIndexer } from './project/ProjectIndexer.js';
import fs from 'fs';
/**
 * Main import service.
 * Orchestrates detection, parsing, and mapping of test files.
 */
export class ImportService {
    constructor() {
        this.parsers = {
            playwright: new PlaywrightParser(),
            cypress: new CypressParser(),
            testcafe: new TestCafeParser(),
            puppeteer: new PuppeteerParser(),
            webdriverio: new WebdriverIOParser(),
            nightwatch: new NightwatchParser(),
            selenium: new SeleniumParser(),
            selenium_python: new PythonSeleniumParser(),
            selenium_java: new JavaSeleniumParser(),
            selenium_csharp: new CSharpSeleniumParser(),
            katalon: new KatalonParser(),
            testrigor: new TestRigorParser(),
        };
        this.mappers = {
            playwright: new PlaywrightMapper(),
            cypress: new CypressMapper(),
            testcafe: new TestCafeMapper(),
            puppeteer: new PuppeteerMapper(),
            webdriverio: new WebdriverIOMapper(),
            nightwatch: new NightwatchMapper(),
            selenium: new SeleniumMapper(),
            selenium_python: new PythonSeleniumMapper(),
            selenium_java: new JavaSeleniumMapper(),
            selenium_csharp: new CSharpSeleniumMapper(),
            katalon: new KatalonMapper(),
            testrigor: new TestRigorMapper(),
        };
    }

    /**
     * Analyzes a file to detect the framework.
     */
    analyze(fileContent) {
        const framework = FrameworkDetector.detect(fileContent);
        return {
            framework,
            detected: framework !== 'unknown',
            supported: !!this.parsers[framework],
        };
    }

    /**
     * Converts a test file to Hal_Test format.
     */
    convert(fileContent, framework) {
        if (!framework) {
            framework = FrameworkDetector.detect(fileContent);
        }

        const parser = this.parsers[framework];
        const mapper = this.mappers[framework];

        if (!parser || !mapper) {
            throw new Error(`Unsupported framework: ${framework}`);
        }

        try {
            console.log(`[DEBUG] Parsing content with ${framework} parser...`);
            // 1. Parse the file to AST/Intermediate structure
            const tests = parser.parse(fileContent);
            console.log(`[DEBUG] Found ${tests.length} tests.`);
            console.log('[DEBUG] tests content:', tests);

            // 2. Map each test to a Hal_Test flow
            const flows = tests.map((test) => {
                const mappedActions = mapper.map(test.body);

                // Rule: Every flow must start with launch_browser
                if (mappedActions.length === 0 || mappedActions[0].action !== 'launch_browser') {
                    mappedActions.unshift({
                        action: 'launch_browser',
                        headless: false, // Default visible for debugging
                        args: ['--start-maximized'],
                    });
                }

                // Rule: Every flow must end with close_browser
                if (
                    mappedActions.length === 0 ||
                    mappedActions[mappedActions.length - 1].action !== 'close_browser'
                ) {
                    mappedActions.push({
                        action: 'close_browser',
                    });
                }

                return {
                    meta: {
                        name: test.name,
                        sourceFramework: framework,
                        createdAt: new Date().toISOString(),
                    },
                    flow: mappedActions,
                };
            });

            return {
                success: true,
                flows,
            };
        } catch (error) {
            console.error('Error during conversion:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * Recursively imports a directory.
     */
    importDirectory(dirPath) {
        const scanner = new ProjectScanner();
        const files = scanner.scan(dirPath);

        const results = {
            total: files.length,
            success: 0,
            failed: 0,
            flows: [],
            errors: [],
        };

        for (const file of files) {
            try {
                const content = fs.readFileSync(file.path, 'utf-8');
                const conversion = this.convert(content, file.framework);

                if (conversion.success) {
                    results.success++;
                    results.flows.push(
                        ...conversion.flows.map((f) => ({
                            ...f,
                            meta: { ...f.meta, filePath: file.path },
                        })),
                    );
                } else {
                    results.failed++;
                    results.errors.push({ file: file.path, error: conversion.error });
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ file: file.path, error: err.message });
            }
        }

        return results;
    }

    /**
     * Imports a directory with POM support (multi-pass).
     */
    importDirectoryWithPOM(dirPath) {
        const scanner = new ProjectScanner();

        // Pass 1: Scan ALL files (including Page Objects)
        const allFiles = scanner.scan(dirPath, true);
        console.log(`[POM] Pass 1: Found ${allFiles.length} files total`);

        // Pass 2: Index project
        const indexer = new ProjectIndexer();
        const projectIndex = indexer.indexFiles(allFiles);
        console.log(`[POM] Pass 2: Indexed ${Object.keys(projectIndex.classes).length} classes`);

        // Pass 3: Scan for test files only
        const testFiles = scanner.scan(dirPath, false);
        console.log(`[POM] Pass 3: Found ${testFiles.length} test files`);

        // Pass 4: Convert with POM resolution
        const results = {
            total: testFiles.length,
            success: 0,
            failed: 0,
            flows: [],
            errors: [],
            indexed: {
                classes: Object.keys(projectIndex.classes).length,
                functions: Object.keys(projectIndex.functions).length,
            },
        };

        for (const file of testFiles) {
            try {
                const content = fs.readFileSync(file.path, 'utf-8');
                // TODO: Pass projectIndex to convert method for POM resolution
                const conversion = this.convert(content, file.framework);

                if (conversion.success) {
                    results.success++;
                    results.flows.push(
                        ...conversion.flows.map((f) => ({
                            ...f,
                            meta: { ...f.meta, filePath: file.path },
                        })),
                    );
                } else {
                    results.failed++;
                    results.errors.push({ file: file.path, error: conversion.error });
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ file: file.path, error: err.message });
            }
        }

        return results;
    }
}

export const importService = new ImportService();
