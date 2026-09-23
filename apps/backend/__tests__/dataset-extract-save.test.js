import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock socket.js to prevent real socket emissions
vi.mock('../socket.js', () => ({
    emitExecutionStatus: vi.fn(),
    emitLog: vi.fn(),
    emitScreenshotReady: vi.fn(),
    emitVariableChange: vi.fn(),
    emitEdgeStatus: vi.fn(),
    emitFlowFinished: vi.fn(),
}));

// Mock i18n
vi.mock('../config/i18n.js', () => ({
    default: { t: (key) => key },
}));

// Point run storage at an isolated temp directory
const { STORAGE_RUNS_DIR } = vi.hoisted(() => ({
    STORAGE_RUNS_DIR: `/tmp/haltest-test-${Date.now()}`,
}));
vi.mock('../config/paths.js', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, STORAGE_RUNS_DIR };
});

// Shared browser fixture injected through the browser-utils mock.
const { browserFixtures } = vi.hoisted(() => ({ browserFixtures: { page: null } }));

// Fake browser: a chainable Playwright-like locator built from plain data.
function makeElement({ text = '', html = '', attrs = {}, children = {} } = {}) {
    return { text, html, attrs, children };
}

function makeLocator(elements) {
    return {
        count: async () => elements.length,
        nth: (i) => makeLocator(elements.slice(i, i + 1)),
        first: () => makeLocator(elements.slice(0, 1)),
        locator: (sel) =>
            makeLocator(
                elements
                    .map((el) => el.children[sel])
                    .filter(Boolean)
                    .map((child) => (child.resolve ? child : makeElement(child))),
            ),
        textContent: async () => (elements[0] ? elements[0].text : null),
        innerHTML: async () => (elements[0] ? elements[0].html : null),
        getAttribute: async (name) =>
            elements[0] && name in elements[0].attrs ? elements[0].attrs[name] : null,
    };
}

vi.mock('../core/browser-utils.js', () => ({
    validateBrowser: (req, browserId) => ({
        error: null,
        browserId: browserId || 'test-browser',
        entry: { browser: {} },
    }),
    getOrCreateContext: async () => {
        const page = {
            locator: (sel) => (browserFixtures.page ? browserFixtures.page(sel) : makeLocator([])),
        };
        return { pages: () => [page] };
    },
}));

let variableManager;
let extractAction;
let saveDatasetAction;
let normalizeFieldDefs;

beforeEach(async () => {
    browserFixtures.page = null;

    const vmMod = await import('../services/VariableManager.js');
    variableManager = vmMod.variableManager;
    variableManager.clearAll();

    const actionMod = await import('../controllers/action.controller.js');
    extractAction = actionMod.extractAction;
    saveDatasetAction = actionMod.saveDatasetAction;
    const extractMod = await import('../plugins/core-data/handlers/extract.js');
    normalizeFieldDefs = extractMod.normalizeFieldDefs;
}, 30000);

function createMockReqRes(body = {}) {
    const req = { body, t: (key) => key, headers: {}, params: {} };
    let responseData = null;
    let responseStatus = 200;
    const res = {
        statusCode: 200,
        status: (code) => {
            responseStatus = code;
            res.statusCode = code;
            return res;
        },
        json: (data) => {
            responseData = data;
            return res;
        },
        getResponse: () => ({ status: responseStatus, data: responseData }),
    };
    return { req, res };
}

describe('normalizeFieldDefs', () => {
    it('normalizes an array of field definitions', () => {
        const defs = normalizeFieldDefs([
            { name: 'title', source: 'text', selector: 'h2 a' },
            { name: 'href', source: 'attribute', selector: 'a', attribute: 'href' },
            { name: 'body', source: 'html', selector: '.body', optional: true },
        ]);
        expect(defs).toEqual([
            { name: 'title', source: 'text', selector: 'h2 a', attribute: '', optional: false },
            {
                name: 'href',
                source: 'attribute',
                selector: 'a',
                attribute: 'href',
                optional: false,
            },
            { name: 'body', source: 'html', selector: '.body', attribute: '', optional: true },
        ]);
    });

    it('supports record syntax and string shorthand', () => {
        const defs = normalizeFieldDefs({
            title: '.item-title',
            href: { source: 'attribute', selector: 'a', attribute: 'href' },
            plain: 'p',
        });
        expect(defs).toEqual([
            {
                name: 'title',
                source: 'text',
                selector: '.item-title',
                attribute: '',
                optional: false,
            },
            {
                name: 'href',
                source: 'attribute',
                selector: 'a',
                attribute: 'href',
                optional: false,
            },
            { name: 'plain', source: 'text', selector: 'p', attribute: '', optional: false },
        ]);
    });

    it('rejects invalid sources and empty names', () => {
        expect(normalizeFieldDefs([{ name: '', source: 'text' }])).toEqual([]);
        expect(normalizeFieldDefs([{ name: 'x', source: 'javascript', selector: '.x' }])).toEqual([
            { name: 'x', source: 'text', selector: '.x', attribute: '', optional: false },
        ]);
    });
});

describe('extractAction', () => {
    it('returns 400 when the selector is missing', async () => {
        const { req, res } = createMockReqRes({ browserId: 'b1' });
        await extractAction(req, res);
        const { status, data } = res.getResponse();
        expect(status).toBe(400);
        expect(data.success).toBe(false);
    });

    it('extracts repeated records with sub-field selectors', async () => {
        const products = [
            makeElement({ children: { '.title': makeElement({ text: 'One' }) } }),
            makeElement({ children: { '.title': makeElement({ text: 'Two' }) } }),
        ];
        browserFixtures.page = (sel) =>
            sel === '.product' ? makeLocator(products) : makeLocator([]);

        variableManager.initRun('run-1');
        const { req, res } = createMockReqRes({
            runId: 'run-1',
            browserId: 'b1',
            selector: '.product',
            repeated: true,
            fields: [{ name: 'title', source: 'text', selector: '.title' }],
            outputVariable: 'products',
        });
        await extractAction(req, res);
        const { status, data } = res.getResponse();
        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.records).toEqual([{ title: 'One' }, { title: 'Two' }]);
        expect(variableManager.get('products', 'run-1')).toEqual([
            { title: 'One' },
            { title: 'Two' },
        ]);
    });

    it('extracts a single record with attribute and html sources', async () => {
        const item = makeElement({
            attrs: { 'data-id': '42' },
            html: '<p>Body</p>',
            children: { 'a.btn': makeElement({ attrs: { href: '/x' } }) },
        });
        browserFixtures.page = () => makeLocator([item]);

        variableManager.initRun('run-1');
        const { req, res } = createMockReqRes({
            runId: 'run-1',
            browserId: 'b1',
            selector: '.item',
            repeated: false,
            fields: [
                { name: 'id', source: 'attribute', attribute: 'data-id' },
                { name: 'body', source: 'html' },
                { name: 'href', source: 'attribute', selector: 'a.btn', attribute: 'href' },
            ],
        });
        await extractAction(req, res);
        const { status, data } = res.getResponse();
        expect(status).toBe(200);
        expect(data.data.records).toEqual([{ id: '42', body: '<p>Body</p>', href: '/x' }]);
    });

    it('accumulates and de-duplicates across executions via accumulateInto', async () => {
        browserFixtures.page = () =>
            makeLocator([makeElement({ children: { '.t': makeElement({ text: 'A' }) } })]);

        variableManager.initRun('run-1');
        for (let i = 0; i < 3; i++) {
            const { req, res } = createMockReqRes({
                runId: 'run-1',
                browserId: 'b1',
                selector: '.x',
                fields: [{ name: 't', source: 'text', selector: '.t' }],
                accumulateInto: 'accum',
                dedupeKey: 't',
            });
            await extractAction(req, res);
            const { data } = res.getResponse();
            expect(data.success).toBe(true);
        }
        expect(variableManager.get('accum', 'run-1')).toEqual([{ t: 'A' }]);
        expect(variableManager.get('extractedData', 'run-1')).toEqual([{ t: 'A' }]);
    });

    it('fails gracefully when ifEmpty=fail and nothing matched', async () => {
        browserFixtures.page = () => makeLocator([]);
        const { req, res } = createMockReqRes({
            runId: 'run-1',
            browserId: 'b1',
            selector: '.nothing',
            ifEmpty: 'fail',
        });
        await extractAction(req, res);
        const { status, data } = res.getResponse();
        expect(status).toBe(200);
        expect(data.success).toBe(false);
        expect(data.data.count).toBe(0);
    });
});

describe('saveDatasetAction', () => {
    it('persists a CSV dataset and exposes a download URL', async () => {
        variableManager.initRun('run-1');
        variableManager.set('products', [{ name: 'Shirt', price: 10 }], 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            source: 'products',
            format: 'csv',
            filename: 'products.csv',
            outputVariable: 'artifact',
        });
        await saveDatasetAction(req, res);
        const { status, data } = res.getResponse();

        expect(status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.format).toBe('csv');
        expect(data.data.fileName).toBe('products.csv');
        expect(data.data.records).toBe(1);
        expect(data.data.downloadUrl).toBe('storage/runs/run-1/datasets/products.csv');

        const fullPath = path.join(STORAGE_RUNS_DIR, 'run-1', 'datasets', 'products.csv');
        expect(fs.existsSync(fullPath)).toBe(true);
        expect(fs.readFileSync(fullPath, 'utf-8')).toContain('name,price');
        expect(variableManager.get('artifact', 'run-1').downloadUrl).toBe(data.data.downloadUrl);

        fs.rmSync(path.join(STORAGE_RUNS_DIR, 'run-1'), { recursive: true, force: true });
    });

    it('sanitizes unsafe filenames and blocks path traversal', async () => {
        variableManager.initRun('run-1');
        variableManager.set('products', [{ name: 'Shirt' }], 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            source: 'products',
            filename: '../../evil.js',
        });
        await saveDatasetAction(req, res);
        const { status, data } = res.getResponse();
        expect(status).toBe(200);
        expect(data.data.fileName).toBe('evil.js');
        expect(data.data.downloadUrl).not.toContain('..');
    });

    it('writes ndjson with pretty JSON', async () => {
        variableManager.initRun('run-1');
        variableManager.set('products', [{ name: 'Shirt' }], 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            source: 'products',
            format: 'ndjson',
            pretty: true,
            filename: 'out.ndjson',
        });
        await saveDatasetAction(req, res);
        const { status, data } = res.getResponse();
        expect(status).toBe(200);
        expect(data.data.format).toBe('ndjson');
        expect(data.data.records).toBe(1);
    });

    it('fails when the dataset variable does not exist', async () => {
        variableManager.initRun('run-1');
        const { req, res } = createMockReqRes({
            runId: 'run-1',
            source: 'missing',
        });
        await saveDatasetAction(req, res);
        const { status, data } = res.getResponse();
        expect(status).toBe(400);
        expect(data.success).toBe(false);
    });
});
