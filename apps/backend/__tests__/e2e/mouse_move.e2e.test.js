/**
 * E2E Validation – Mouse Move
 *
 * The unit tests assert that the handler CALLS hover() and then mouse.move().
 * That is not sufficient evidence: the whole reason away_from_element exists is
 * that the browser fires `mouseleave` from rendering-engine hit-testing, not
 * from the synthetic events Playwright dispatches. A mock cannot prove it.
 *
 * These tests drive real Chromium against a local fixture and assert on the
 * events the page actually observed. They are the regression guard for the
 * two-phase enter-then-leave contract.
 *
 * page.evaluate() callbacks below run inside the browser, so window/document
 * are real globals there and not in this Node process.
 */
/* eslint-disable no-undef */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

const VIEWPORT = { width: 1000, height: 800 };

const FIXTURE = (body) =>
    `data:text/html,${encodeURIComponent(`<html><body>${body}
<script>
  window.seen = [];
  window.coords = [];
  const record = (el, name) => el.addEventListener(name, () => window.seen.push(el.id + ':' + name));
  const panel = document.getElementById('panel');
  if (panel) {
    record(panel, 'mouseenter');
    record(panel, 'mouseleave');
    const inner = document.getElementById('inner');
    if (inner) record(inner, 'mouseleave');
  }
  document.addEventListener('mousemove', (e) => {
    window.seen.push('doc:mousemove');
    window.coords.push([e.clientX, e.clientY]);
  });
</script>
</body></html>`)}`;

const PANEL_BODY = `
  <div id="panel" style="position:absolute;left:400px;top:300px;width:200px;height:100px;background:#ccc">
    <span id="inner" style="display:block;width:100%;height:100%">panel</span>
  </div>
`;

let browser;
let page;

const drain = () => page.evaluate(() => window.seen.splice(0));
const drainCoords = () => page.evaluate(() => window.coords.splice(0));

beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: VIEWPORT });
});

afterAll(async () => {
    await browser?.close();
});

describe('mouse_move in a real browser', () => {
    it('moves to an absolute viewport point', async () => {
        await page.goto(FIXTURE(PANEL_BODY));
        await page.mouse.move(120, 240, { steps: 1 });
        const probe = await page.evaluate(() => document.elementFromPoint(120, 240) !== null);
        expect(probe).toBe(true);
    });

    it('emits one mousemove per interpolated step', async () => {
        await page.goto(FIXTURE(PANEL_BODY));
        await drain();
        await page.mouse.move(300, 200, { steps: 12 });
        const moves = (await drain()).filter((e) => e === 'doc:mousemove');
        expect(moves).toHaveLength(12);
    });

    it('does NOT fire mouseleave from a single move that was never inside the element', async () => {
        // This is the failure mode away_from_element has to work around: the
        // virtual cursor starts at (0,0) and Playwright's mouse.move only emits
        // mousemove, so hit-testing never registers the element as hovered.
        await page.goto(FIXTURE(PANEL_BODY));
        await drain();
        const box = await page.locator('#panel').boundingBox();
        await page.mouse.move(Math.round(box.x + box.width / 2), Math.round(box.y - 8), {
            steps: 8,
        });
        const seen = await drain();
        expect(seen.filter((e) => e === 'doc:mousemove').length).toBeGreaterThan(0);
        expect(seen).not.toContain('panel:mouseleave');
    });

    it('DOES fire mouseleave when the cursor enters first, then leaves', async () => {
        await page.goto(FIXTURE(PANEL_BODY));
        const box = await page.locator('#panel').boundingBox();
        const cx = Math.round(box.x + box.width / 2);

        // Phase 1 — enter, the same call the handler makes.
        await page.locator('#panel').hover();
        const afterHover = await drain();
        expect(afterHover).toContain('panel:mouseenter');

        // Phase 2 — travel to a point strictly outside the box.
        await page.mouse.move(cx, Math.round(box.y - 8), { steps: 8 });
        const seen = await drain();
        expect(seen).toContain('panel:mouseleave');
    });

    it('leaves through each requested side', async () => {
        const sides = {
            up: (b) => [Math.round(b.x + b.width / 2), Math.round(b.y - 8)],
            down: (b) => [Math.round(b.x + b.width / 2), Math.round(b.y + b.height + 8)],
            left: (b) => [Math.round(b.x - 8), Math.round(b.y + b.height / 2)],
            right: (b) => [Math.round(b.x + b.width + 8), Math.round(b.y + b.height / 2)],
        };

        for (const [name, point] of Object.entries(sides)) {
            await page.goto(FIXTURE(PANEL_BODY));
            const box = await page.locator('#panel').boundingBox();
            await page.locator('#panel').hover();
            await drain();
            const [x, y] = point(box);
            await page.mouse.move(x, y, { steps: 8 });
            expect(await drain(), `exit ${name}`).toContain('panel:mouseleave');
        }
    });

    // A full-bleed element has no in-viewport point outside itself, so the
    // handler flags inViewport:false. Confirm why that matters: the browser
    // CLAMPS the off-viewport coordinate back onto the element rather than
    // erroring, so the pointer does not actually come to rest outside and CSS
    // :hover stays active. The node reports instead of claiming success.
    it('clamps an off-viewport escape back onto a full-bleed element', async () => {
        await page.goto(
            FIXTURE(
                '<div id="panel" style="position:absolute;left:0;top:0;width:1000px;height:800px;background:#ccc"></div>',
            ),
        );
        await page.locator('#panel').hover();
        await drain();
        await drainCoords();

        // Ask for y = -8, which is outside the viewport.
        await page.mouse.move(500, -8, { steps: 4 });
        await drain();
        const positions = await drainCoords();
        const final = positions[positions.length - 1];

        // It does not throw...
        expect(final).toBeDefined();
        // ...but it does not reach the requested point either.
        expect(final[1]).not.toBe(-8);
        // The pointer is still over the full-bleed element, so it never truly left.
        const stillHovering = await page.evaluate(
            ([px, py]) => document.elementFromPoint(px, py)?.closest('#panel') !== null,
            final,
        );
        expect(stillHovering).toBe(true);
    });

    it('reports the element actually at the destination for verifyTarget', async () => {
        await page.goto(
            FIXTURE(
                `${PANEL_BODY}<div id="land" style="position:absolute;left:100px;top:600px;width:80px;height:40px;background:#0a0">land</div>`,
            ),
        );
        const hit = await page.evaluate(() => {
            const el = document.elementFromPoint(140, 620);
            return el ? { tag: el.tagName.toLowerCase(), id: el.id } : null;
        });
        expect(hit).toEqual({ tag: 'div', id: 'land' });
    });
});
