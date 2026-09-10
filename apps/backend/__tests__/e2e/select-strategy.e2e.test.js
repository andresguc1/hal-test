/**
 * E2E Validation – NativeSelectStrategy / NativeMultiSelectStrategy
 *
 * Launches real Chromium against a local fixture and drives OptionWriter →
 * NativeSelectStrategy (single) and NativeMultiSelectStrategy (multi) with
 * REAL locator interactions — no mocks.
 *
 * Tests two scenarios:
 *  1. Genuine `<select>` → must use Playwright's selectOption().
 *  2. Custom (div/button) dropdown → must fall back to click-to-open + click-by-label.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { writeOptions } from '../../services/OptionWriter.js';

const NATIVE_FIXTURE = `data:text/html,
<html>
<body>
  <h1>Select Fixture</h1>
  <select id="choices">
    <option value="a">Option A</option>
    <option value="b">Option B</option>
    <option value="c">Option C</option>
  </select>
</body>
</html>`;

const MULTI_SELECT_FIXTURE = `data:text/html,
<html>
<body>
  <h1>Multi-Select Fixture</h1>
  <select id="multi" multiple>
    <option value="a">Option A</option>
    <option value="b">Option B</option>
    <option value="c">Option C</option>
  </select>
</body>
</html>`;

const CUSTOM_FIXTURE = `data:text/html,
<html>
<body>
  <div id="my-dropdown" class="trigger" aria-expanded="false">
    Choose
    <ul class="menu" hidden>
      <li role="option" class="option-item" data-value="x">Option X</li>
      <li role="option" class="option-item" data-value="y">Option Y</li>
      <li role="option" class="option-item" data-value="z">Option Z</li>
    </ul>
  </div>
  <script>
    const root = document.getElementById('my-dropdown');
    root.addEventListener('click', (e) => {
      if (e.target.closest('li[role="option"]')) return;
      const menu = root.querySelector('.menu');
      const expanded = root.getAttribute('aria-expanded') === 'true';
      root.setAttribute('aria-expanded', String(!expanded));
      menu.hidden = expanded;
    });
    root.querySelectorAll('li[role="option"]').forEach((li) => {
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        root.querySelectorAll('li[role="option"]').forEach((o) =>
          o.setAttribute('aria-selected', String(o === li)),
        );
      });
    });
  </script>
</body>
</html>`;

const CUSTOM_MULTI_FIXTURE = `data:text/html,
<html>
<body>
  <div id="my-multi" class="trigger" aria-expanded="false">
    Pick
    <ul class="menu" hidden>
      <li role="option" class="option-item" data-value="x">Option X</li>
      <li role="option" class="option-item" data-value="y">Option Y</li>
      <li role="option" class="option-item" data-value="z">Option Z</li>
    </ul>
  </div>
  <script>
    const root = document.getElementById('my-multi');
    root.addEventListener('click', (e) => {
      if (e.target.closest('li[role="option"]')) return;
      const menu = root.querySelector('.menu');
      const expanded = root.getAttribute('aria-expanded') === 'true';
      root.setAttribute('aria-expanded', String(!expanded));
      menu.hidden = expanded;
    });
    root.querySelectorAll('li[role="option"]').forEach((li) => {
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        li.setAttribute('aria-selected', 'true');
      });
    });
  </script>
</body>
</html>`;

describe('E2E OptionWriter — real browser', () => {
    /** @type {import('playwright').Browser} */
    let browser;

    beforeAll(async () => {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
        });
    });

    afterAll(async () => {
        await browser?.close();
    });

    /* ------------------------------------------------------------------ */
    /*  1. Native <select>                                                */
    /* ------------------------------------------------------------------ */
    it('selects "Option B" in a real <select> element', async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(NATIVE_FIXTURE);

        const allOptions = [
            {
                id: 'a',
                label: 'Option A',
                value: 'a',
                type: 'native_select',
                index: 0,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'b',
                label: 'Option B',
                value: 'b',
                type: 'native_select',
                index: 1,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'c',
                label: 'Option C',
                value: 'c',
                type: 'native_select',
                index: 2,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
        ];

        const result = await writeOptions(page, {
            containerSelector: '#choices',
            selectedOptions: [{ label: 'Option B', value: 'b', action: 'SELECT' }],
            options: allOptions,
            timeout: 10000,
            verify: false,
        });

        expect(result.applied).toHaveLength(1);
        expect(result.applied[0].label).toBe('Option B');

        // Confirm the DOM reflects the selection.
        const selectedValue = await page.locator('#choices').inputValue();
        expect(selectedValue).toBe('b');

        await context.close();
    }, 30000);

    /* ------------------------------------------------------------------ */
    /*  1b. Native <select> — multi-select (NativeMultiSelectStrategy)   */
    /* ------------------------------------------------------------------ */
    it('selects "Option C" in a real <select multiple>', async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(MULTI_SELECT_FIXTURE);

        const allOptions = [
            {
                id: 'a',
                label: 'Option A',
                value: 'a',
                type: 'native_select_multi',
                index: 0,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'b',
                label: 'Option B',
                value: 'b',
                type: 'native_select_multi',
                index: 1,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'c',
                label: 'Option C',
                value: 'c',
                type: 'native_select_multi',
                index: 2,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
        ];

        const result = await writeOptions(page, {
            containerSelector: '#multi',
            selectedOptions: [{ label: 'Option C', value: 'c', action: 'SELECT' }],
            options: allOptions,
            timeout: 10000,
            verify: false,
        });

        expect(result.applied).toHaveLength(1);
        expect(result.applied[0].label).toBe('Option C');

        // Playwright selectOption() replaces the selection; a single target is expected.
        const selectedValues = await page
            .locator('#multi')
            .evaluate((sel) => Array.from(sel.selectedOptions).map((o) => o.value));
        expect(selectedValues).toEqual(['c']);

        await context.close();
    }, 30000);

    /* ------------------------------------------------------------------ */
    /*  2. Custom (non-native) dropdown                                   */
    /* ------------------------------------------------------------------ */
    it('selects "Option Y" in a custom dropdown via click-to-open + click-by-label', async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(CUSTOM_FIXTURE);

        const allOptions = [
            {
                id: 'x',
                label: 'Option X',
                value: 'x',
                type: 'native_select',
                index: 0,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'y',
                label: 'Option Y',
                value: 'y',
                type: 'native_select',
                index: 1,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'z',
                label: 'Option Z',
                value: 'z',
                type: 'native_select',
                index: 2,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
        ];

        const result = await writeOptions(page, {
            containerSelector: '#my-dropdown',
            selectedOptions: [{ label: 'Option Y', value: 'y', action: 'SELECT' }],
            options: allOptions,
            timeout: 10000,
            verify: false,
        });

        expect(result.applied).toHaveLength(1);
        expect(result.applied[0].label).toBe('Option Y');

        // Menu should have been opened by the strategy.
        const menuVisible = await page.locator('#my-dropdown .menu').isVisible();
        expect(menuVisible).toBe(true);

        // The clicked item should be marked as selected.
        const selectedY = await page
            .locator('#my-dropdown li[role="option"]')
            .evaluateAll((items) =>
                items
                    .find((i) => i.textContent.trim() === 'Option Y')
                    .getAttribute('aria-selected'),
            );
        expect(selectedY).toBe('true');

        await context.close();
    }, 30000);

    /* ------------------------------------------------------------------ */
    /*  2b. Custom multi-select dropdown (NativeMultiSelectStrategy)       */
    /* ------------------------------------------------------------------ */
    it('selects two options in a custom multi dropdown via click-to-open + click-by-label', async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(CUSTOM_MULTI_FIXTURE);

        const allOptions = [
            {
                id: 'x',
                label: 'Option X',
                value: 'x',
                type: 'native_select_multi',
                index: 0,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'y',
                label: 'Option Y',
                value: 'y',
                type: 'native_select_multi',
                index: 1,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
            {
                id: 'z',
                label: 'Option Z',
                value: 'z',
                type: 'native_select_multi',
                index: 2,
                selected: false,
                checked: false,
                enabled: true,
                visible: true,
            },
        ];

        const result = await writeOptions(page, {
            containerSelector: '#my-multi',
            selectedOptions: [
                { label: 'Option X', value: 'x', action: 'SELECT' },
                { label: 'Option Z', value: 'z', action: 'SELECT' },
            ],
            options: allOptions,
            timeout: 10000,
            verify: false,
        });

        expect(result.applied).toHaveLength(2);
        expect(result.applied.map((a) => a.label).sort()).toEqual(['Option X', 'Option Z']);
        expect(result.evidence.every((e) => e.result === 'PASS')).toBe(true);

        const selectedVals = await page
            .locator('#my-multi li[role="option"]')
            .evaluateAll((items) =>
                items
                    .filter((i) => i.getAttribute('aria-selected') === 'true')
                    .map((i) => i.textContent.trim()),
            );
        expect(selectedVals.sort()).toEqual(['Option X', 'Option Z']);

        await context.close();
    }, 30000);

    /* ------------------------------------------------------------------ */
    /*  3. the-internet regression (native <select>)                      */
    /* ------------------------------------------------------------------ */
    it('selects "2" on the-internet.herokuapp.com/dropdown', async () => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('https://the-internet.herokuapp.com/dropdown', { timeout: 15000 });

        // discover options from the real page DOM
        const rawOptions = await page.locator('#dropdown option').evaluateAll((opts) =>
            opts.map((o, i) => ({
                id: o.value,
                label: o.textContent.trim(),
                value: o.value,
                type: 'native_select',
                index: i,
                selected: o.selected,
                checked: o.selected,
                enabled: !o.disabled,
                visible: true,
            })),
        );
        const allOptions = rawOptions.filter((o) => o.value !== '');

        const result = await writeOptions(page, {
            containerSelector: '#dropdown',
            selectedOptions: [{ label: '2', value: '2', action: 'SELECT' }],
            options: allOptions,
            timeout: 10000,
            verify: false,
        });

        expect(result.applied).toHaveLength(1);
        expect(result.applied[0].label).toBe('Option 2');

        const selectedValue = await page.locator('#dropdown').inputValue();
        expect(selectedValue).toBe('2');

        await context.close();
    }, 30000);
});
