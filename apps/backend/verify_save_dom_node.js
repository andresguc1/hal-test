import * as path from 'path';

// Mock Global State Manager
const globalStateManager = {
    state: {},
    setVariable: (name, value) => {
        console.log(`💾 [State] Setting variable '${name}' to length ${value.length}`);
        globalStateManager.state[name] = value;
    },
    getVariable: (name) => globalStateManager.state[name],
};

// Mock File System Promises
const fsp = {
    writeFile: async (filePath) => {
        console.log(`📁 [FS] Writing file to: ${filePath}`);
        return Promise.resolve();
    },
};

// Mock Playwright Page
const mockPage = () => {
    return {
        evaluate: async (fn) => {
            // Simulate returning outerHTML for page.content() or element.evaluate()
            if (typeof fn === 'function') {
                // This branch is for element.evaluate((el) => el.outerHTML)
                return '<div id="exists">Element Content</div>';
            }
            // This branch is for page.content()
            return '<html><body><div id="exists">Element Content</div><div id="other">Other Content</div></body></html>';
        },
        content: async () => {
            return '<html><body><div id="exists">Element Content</div><div id="other">Other Content</div></body></html>';
        },
        waitForSelector: async (selector, options) => {
            if (selector === '#missing' && options?.timeout === 100) {
                throw new Error('Timeout 100ms exceeded.');
            }
            // Simulate finding the selector immediately
            return Promise.resolve();
        },
        $: async (selector) => {
            if (selector === '#exists') {
                return {
                    evaluate: async () => {
                        // Simulate element.evaluate((el) => el.outerHTML)
                        return '<div id="exists">Element Content</div>';
                    },
                };
            }
            return null; // Element not found
        },
        $eval: async () => {
            // Generic $eval mock if needed
            return null;
        },
    };
};

// The Logic to Test (Simulating saveDomAction from action.controller.js)
const runSaveDomLogic = async (page, opts) => {
    const { path: savePath, variableName, selector, timeout = 30000 } = opts;

    // 1. Validation: At least one destination required
    if (!savePath && !variableName) {
        throw new Error(
            'Debe proporcionar "path" (archivo) o "variableName" (variable) para guardar el DOM.',
        );
    }

    // 2. Security Validation for Path
    let resolvedPath = null;
    if (savePath) {
        if (savePath.includes('..')) {
            throw new Error('Ruta de archivo no segura: se detectó uso de ".."');
        }
        resolvedPath = path.resolve(savePath);
    }

    // 3. Obtain Content
    let content = '';
    if (selector) {
        // Capture specific element
        await page.waitForSelector(selector, { state: 'attached', timeout });
        const element = await page.$(selector);
        if (!element) {
            throw new Error(`Elemento no encontrado: ${selector}`);
        }
        // Extract outerHTML
        content = await element.evaluate((el) => el.outerHTML);
    } else {
        // Capture full page
        content = await page.content();
    }

    // 4. Persist Content
    const results = {};

    // Save to File
    if (resolvedPath) {
        await fsp.writeFile(resolvedPath, content);
        results.path = resolvedPath;
    }

    // Save to Variable
    if (variableName) {
        globalStateManager.setVariable(variableName, content);
        results.variableStored = variableName;
    }

    return {
        message: 'DOM guardado exitosamente',
        data: results,
        traceDetails: {
            path: resolvedPath,
            variableName,
            selector,
            contentLength: content.length,
        },
    };
};

async function runTests() {
    console.log('🚀 Iniciando pruebas de save_dom logic...\n');
    const page = mockPage();

    // TEST 1: Save Full Page to File
    console.log('🧪 TEST 1: Save Full Page to File');
    try {
        const res = await runSaveDomLogic(page, { path: './snapshot.html' });
        console.log('✅ Success:', res.message);
        if (res.traceDetails.contentLength < 10) throw new Error('Content too short');
    } catch (e) {
        console.error('❌ Failed:', e);
    }
    console.log('---------------------------------------------------');

    // TEST 2: Save Element to Variable
    console.log('🧪 TEST 2: Save Element to Variable');
    try {
        const res = await runSaveDomLogic(page, { variableName: 'myHtml', selector: '#exists' });
        console.log('✅ Success:', res.message);
        if (globalStateManager.getVariable('myHtml') !== '<div id="exists">Element Content</div>') {
            throw new Error('Variable content mismatch');
        }
    } catch (e) {
        console.error('❌ Failed:', e);
    }
    console.log('---------------------------------------------------');

    // TEST 3: Validation Error (No inputs)
    console.log('🧪 TEST 3: Validation Error (No inputs)');
    try {
        await runSaveDomLogic(page, {});
        console.error('❌ Failed: Should have thrown error');
    } catch (e) {
        console.log('✅ Error caught:', e.message);
    }
    console.log('---------------------------------------------------');

    // TEST 4: Security Error (Path Traversal)
    console.log('🧪 TEST 4: Security Error (Path Traversal)');
    try {
        await runSaveDomLogic(page, { path: '../hack.html' });
        console.error('❌ Failed: Should have thrown error');
    } catch (e) {
        console.log('✅ Error caught:', e.message);
    }
    console.log('---------------------------------------------------');

    // TEST 5: Element Not Found
    console.log('🧪 TEST 5: Element Not Found');
    try {
        await runSaveDomLogic(page, { variableName: 'fail', selector: '#missing', timeout: 100 });
        console.error('❌ Failed: Should have thrown timeout');
    } catch (e) {
        console.log('✅ Error caught:', e.message);
    }
    console.log('---------------------------------------------------');

    // TEST 6: Save Both (File + Variable)
    console.log('🧪 TEST 6: Save Both (File + Variable)');
    try {
        const res = await runSaveDomLogic(page, { path: './both.html', variableName: 'bothVar' });
        console.log('✅ Success:', res.message);
        if (!res.data.path || !res.data.variableStored) throw new Error('Missing data in response');
    } catch (e) {
        console.error('❌ Failed:', e);
    }
    console.log('---------------------------------------------------');
}

runTests();
