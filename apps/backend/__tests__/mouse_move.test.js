import { describe, it, expect, vi, beforeEach } from 'vitest';

import mouseMoveBodySchema from '../schemas/mouse_move/body.js';
import mouseMovePluginSchema from '../plugins/core-interaction/schemas/mouse_move.js';

// The handler talks to the page only through executePlaywrightAction, so the
// whole node is testable by replacing that single seam.
const executePlaywrightAction = vi.fn();

vi.mock('../core/ActionExecutor.js', () => ({
    executePlaywrightAction: (...args) => executePlaywrightAction(...args),
}));

const resolveTarget = vi.fn();

vi.mock('../core/selector-utils.js', () => ({
    resolveTarget: (...args) => resolveTarget(...args),
}));

const {
    default: mouseMove,
    centreOfBox,
    escapePoint,
} = await import('../plugins/core-interaction/handlers/mouse_move.js');

/** Builds a mock page whose mouse/hover/evaluate calls are observable. */
const createPage = ({ box = null, viewport = { width: 1000, height: 800 } } = {}) => {
    const locator = {
        boundingBox: vi.fn().mockResolvedValue(box),
        hover: vi.fn().mockResolvedValue(undefined),
    };
    return {
        locator: vi.fn(() => locator),
        mouse: { move: vi.fn().mockResolvedValue(undefined) },
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        viewportSize: vi.fn(() => viewport),
        evaluate: vi.fn().mockResolvedValue(null),
        __locator: locator,
    };
};

/**
 * Runs the node and returns { page, req, result }.
 * executePlaywrightAction is invoked with (req, res, actionName, executor);
 * this invokes that executor against `page`, exactly like the real one does.
 */
const runNode = async (body, { page = createPage(), resolvesTo = true } = {}) => {
    const req = { body, t: (key, vars) => `${key}${vars ? JSON.stringify(vars) : ''}` };
    const res = {};
    executePlaywrightAction.mockImplementation(async (_req, _res, _action, executor) =>
        executor(page, body),
    );
    if (resolvesTo) {
        resolveTarget.mockResolvedValue({
            locator: page.__locator,
            resolution: { strategy: 'css' },
        });
    } else {
        resolveTarget.mockResolvedValue({ locator: null, resolution: null });
    }
    const result = await mouseMove(req, res);
    return { page, req, result };
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('mouse_move body schema', () => {
    // Mirrors middlewares/validator.js exactly. `stripUnknown: true` is supplied
    // by the middleware at call time, not baked into the schema, so a bare
    // validate() would hard-error on unknown keys instead of dropping them.
    const options = { abortEarly: false, stripUnknown: true };
    const ok = (value) => {
        const { error, value: out } = mouseMoveBodySchema.validate(value, options);
        return { error, out };
    };

    it('defaults to viewport_absolute and supplies movement defaults', () => {
        const { error, out } = ok({ x: 10, y: 20 });
        expect(error).toBeUndefined();
        expect(out.targetMode).toBe('viewport_absolute');
        expect(out.steps).toBe(12);
        expect(out.exitDirection).toBe('any');
        expect(out.verifyTarget).toBe(false);
    });

    it('requires BOTH x and y for viewport_absolute', () => {
        expect(ok({ x: 10 }).error).toBeDefined();
        expect(ok({ y: 20 }).error).toBeDefined();
        expect(ok({ x: 10, y: 20 }).error).toBeUndefined();
    });

    it('rejects negative and non-integer coordinates', () => {
        expect(ok({ x: -1, y: 5 }).error).toBeDefined();
        expect(ok({ x: 1.5, y: 5 }).error).toBeDefined();
    });

    it('requires a selector for every element-scoped mode', () => {
        for (const mode of ['element_center', 'element_offset', 'away_from_element']) {
            expect(ok({ targetMode: mode }).error).toBeDefined();
        }
        expect(ok({ targetMode: 'element_center', selector: '#a' }).error).toBeUndefined();
        expect(
            ok({ targetMode: 'element_offset', selector: '#a', offsetX: 0 }).error,
        ).toBeUndefined();
        expect(ok({ targetMode: 'away_from_element', selector: '#a' }).error).toBeUndefined();
    });

    it('rejects an unknown targetMode', () => {
        expect(ok({ targetMode: 'element_bottom', selector: '#a' }).error).toBeDefined();
    });

    it('rejects an unknown exitDirection', () => {
        expect(
            ok({ targetMode: 'away_from_element', selector: '#a', exitDirection: 'diagonal' })
                .error,
        ).toBeDefined();
    });

    // cleanNodeConfiguration whitelists by key, not by mode, so a node switched
    // from viewport_absolute to an element mode keeps a stale x/y. Rejecting it
    // would fail a node the UI legitimately allows.
    it('accepts a stale x/y when the mode no longer uses coordinates', () => {
        const { error, out } = ok({ targetMode: 'element_center', selector: '#a', x: 5, y: 9 });
        expect(error).toBeUndefined();
        expect(out.x).toBe(5);
    });

    it('requires at least one offset for element_offset', () => {
        expect(ok({ targetMode: 'element_offset', selector: '#a' }).error).toBeDefined();
        expect(
            ok({ targetMode: 'element_offset', selector: '#a', offsetX: 4 }).error,
        ).toBeUndefined();
    });

    it('bounds steps and settleMs', () => {
        expect(ok({ x: 1, y: 1, steps: 0 }).error).toBeDefined();
        expect(ok({ x: 1, y: 1, steps: 1001 }).error).toBeDefined();
        expect(ok({ x: 1, y: 1, settleMs: -1 }).error).toBeDefined();
        expect(ok({ x: 1, y: 1, settleMs: 99999 }).error).toBeDefined();
    });

    // ActionExecutor captures a screenshot whenever takeScreenshot !== false, so
    // the schema must not default it to false or it would suppress captures for
    // callers that omit the field.
    it('leaves takeScreenshot undefined so the executor default wins', () => {
        const { out } = ok({ x: 1, y: 1 });
        expect(out.takeScreenshot).toBeUndefined();
    });

    // stripUnknown: true in middlewares/validator.js means undeclared fields are
    // dropped, and the validator re-adds pipeline metadata afterwards.
    it('strips undeclared fields instead of erroring', () => {
        const { error, out } = ok({ x: 1, y: 1, somethingElse: 'x' });
        expect(error).toBeUndefined();
        expect(out.somethingElse).toBeUndefined();
    });
});

describe('mouse_move plugin schema', () => {
    it('accepts an empty configuration so the node can be created before setup', () => {
        const { error } = mouseMovePluginSchema.validate({});
        expect(error).toBeUndefined();
    });

    it('tolerates unknown keys rather than failing registration', () => {
        const { error } = mouseMovePluginSchema.validate({ targetMode: 'element_center' });
        expect(error).toBeUndefined();
    });
});

describe('centreOfBox', () => {
    it('returns the rounded centre', () => {
        expect(centreOfBox({ x: 10, y: 20, width: 100, height: 50 })).toEqual({ x: 60, y: 45 });
    });

    it('rounds fractional layouts', () => {
        expect(centreOfBox({ x: 0, y: 0, width: 5, height: 5 })).toEqual({ x: 3, y: 3 });
    });

    it('returns null when the element has no box', () => {
        expect(centreOfBox(null)).toBeNull();
    });
});

describe('escapePoint', () => {
    const box = { x: 400, y: 300, width: 200, height: 100 };
    const viewport = { width: 1000, height: 800 };

    it('lands strictly outside the box on the requested side', () => {
        const p = escapePoint(box, 'up', viewport);
        expect(p).toEqual({ x: 500, y: 292, direction: 'up', inViewport: true });
    });

    it('honours each explicit direction', () => {
        expect(escapePoint(box, 'down', viewport)).toMatchObject({ x: 500, y: 408 });
        expect(escapePoint(box, 'left', viewport)).toMatchObject({ x: 392, y: 350 });
        expect(escapePoint(box, 'right', viewport)).toMatchObject({ x: 608, y: 350 });
    });

    it('prefers up when direction is any', () => {
        expect(escapePoint(box, 'any', viewport).direction).toBe('up');
    });

    // An element flush against the top edge has no room above, so the node must
    // still produce a usable destination rather than a negative coordinate.
    it('falls back to another side when the requested one has no room', () => {
        const flushTop = { x: 400, y: 0, width: 200, height: 100 };
        const p = escapePoint(flushTop, 'up', viewport);
        expect(p.inViewport).toBe(true);
        expect(p.direction).toBe('down');
        expect(p.y).toBeGreaterThan(0);
    });

    it('reports inViewport false for a full-bleed element but still returns a point', () => {
        const full = { x: 0, y: 0, width: 1000, height: 800 };
        const p = escapePoint(full, 'up', viewport);
        expect(p.inViewport).toBe(false);
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
    });

    it('does not crash on an unrecognised direction', () => {
        const p = escapePoint(box, 'diagonal', viewport);
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
    });
});

describe('mouse_move execution', () => {
    it('moves to an absolute viewport point, rounding and passing steps', async () => {
        const { page, result } = await runNode({
            targetMode: 'viewport_absolute',
            x: 1200.6,
            y: 340.2,
            steps: 20,
        });
        expect(page.mouse.move).toHaveBeenCalledWith(1201, 340, { steps: 20 });
        expect(result.traceDetails.destination).toEqual({ x: 1201, y: 340 });
    });

    it('moves to the centre of the resolved element', async () => {
        const page = createPage({ box: { x: 10, y: 20, width: 100, height: 50 } });
        const { result } = await runNode(
            { targetMode: 'element_center', selector: '#btn' },
            { page },
        );
        expect(page.mouse.move).toHaveBeenCalledWith(60, 45, { steps: 12 });
        expect(result.traceDetails.enteredElement).toBe(false);
    });

    it('applies offsets relative to the element top-left', async () => {
        const page = createPage({ box: { x: 100, y: 200, width: 300, height: 150 } });
        await runNode(
            { targetMode: 'element_offset', selector: '#t', offsetX: 10, offsetY: 5 },
            { page },
        );
        expect(page.mouse.move).toHaveBeenCalledWith(110, 205, { steps: 12 });
    });

    it('clamps steps to at least 1', async () => {
        const { page } = await runNode({ x: 5, y: 5, steps: 0 });
        expect(page.mouse.move).toHaveBeenCalledWith(5, 5, { steps: 1 });
    });

    it('waits for settleMs when configured', async () => {
        const { page } = await runNode({ x: 5, y: 5, settleMs: 50 });
        expect(page.waitForTimeout).toHaveBeenCalledWith(50);
    });

    it('does not wait at all when settleMs is absent', async () => {
        const { page } = await runNode({ x: 5, y: 5 });
        expect(page.waitForTimeout).not.toHaveBeenCalled();
    });

    it('does not hover for the non-away element modes', async () => {
        const page = createPage({ box: { x: 0, y: 0, width: 10, height: 10 } });
        await runNode({ targetMode: 'element_center', selector: '#a' }, { page });
        expect(page.__locator.hover).not.toHaveBeenCalled();
    });
});

describe('mouse_move away_from_element two-phase contract', () => {
    // A lone mouse.move only emits mousemove. The engine fires mouseleave when
    // hit-testing moves off the element, so the cursor must enter first.
    it('hovers into the element BEFORE moving out of it', async () => {
        const page = createPage({ box: { x: 400, y: 300, width: 200, height: 100 } });
        const { result } = await runNode(
            { targetMode: 'away_from_element', selector: '#panel' },
            { page },
        );
        expect(page.__locator.hover).toHaveBeenCalledTimes(1);

        const hoverOrder = page.__locator.hover.mock.invocationCallOrder[0];
        const moveOrder = page.mouse.move.mock.invocationCallOrder[0];
        expect(hoverOrder).toBeLessThan(moveOrder);

        expect(result.traceDetails.enteredElement).toBe(true);
        expect(result.traceDetails.exitDirection).toBe('up');
    });

    it('leaves through the requested side, outside the box', async () => {
        const page = createPage({ box: { x: 400, y: 300, width: 200, height: 100 } });
        await runNode(
            { targetMode: 'away_from_element', selector: '#p', exitDirection: 'right' },
            { page },
        );
        const [x, y] = page.mouse.move.mock.calls[0];
        expect(x).toBeGreaterThan(600);
        // Still vertically inside the element's row, so this is a side exit
        // rather than a diagonal hop.
        expect(y).toBeGreaterThanOrEqual(300);
        expect(y).toBeLessThanOrEqual(400);
    });

    it('flags inViewport false when the element fills the viewport', async () => {
        const page = createPage({ box: { x: 0, y: 0, width: 1000, height: 800 } });
        const { result } = await runNode(
            { targetMode: 'away_from_element', selector: '#full' },
            { page },
        );
        expect(result.traceDetails.inViewport).toBe(false);
    });

    it('passes force through to the hover call', async () => {
        const page = createPage({ box: { x: 0, y: 0, width: 10, height: 10 } });
        await runNode({ targetMode: 'away_from_element', selector: '#a', force: true }, { page });
        expect(page.__locator.hover).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
    });
});

describe('mouse_move failure modes', () => {
    it('rejects an unknown targetMode instead of silently escaping an element', async () => {
        const page = createPage({ box: { x: 0, y: 0, width: 10, height: 10 } });
        await expect(
            runNode({ targetMode: 'element_bottom', selector: '#a' }, { page }),
        ).rejects.toThrow(/mouse_move_unknown_mode/);
        // The bug this guards: a typo used to fall through to away_from_element
        // and yank the pointer out of an element the author never left.
        expect(page.__locator.hover).not.toHaveBeenCalled();
        expect(page.mouse.move).not.toHaveBeenCalled();
    });

    it('rejects a missing selector for an element mode', async () => {
        await expect(runNode({ targetMode: 'element_center' })).rejects.toThrow(
            /selector_required/,
        );
    });

    it('reports a selector that cannot be resolved', async () => {
        await expect(
            runNode({ targetMode: 'element_center', selector: '#nope' }, { resolvesTo: false }),
        ).rejects.toThrow(/mouse_move_unresolved_selector/);
    });

    it('reports a resolved element with no bounding box (e.g. display:none)', async () => {
        const page = createPage({ box: null });
        await expect(
            runNode({ targetMode: 'element_center', selector: '#hidden' }, { page }),
        ).rejects.toThrow(/mouse_move_no_bounding_box/);
    });
});

describe('mouse_move verifyTarget', () => {
    it('reports the element under the destination when asked', async () => {
        const page = createPage();
        page.evaluate.mockResolvedValue({
            tag: 'button',
            id: 'next',
            className: 'btn',
            role: null,
            text: 'Next',
        });
        const { result } = await runNode({ x: 100, y: 200, verifyTarget: true }, { page });
        expect(result.traceDetails.verification.elementAtPoint).toMatchObject({
            tag: 'button',
            id: 'next',
        });
    });

    it('stays null when verification is not requested', async () => {
        const { page, result } = await runNode({ x: 1, y: 1 });
        expect(page.evaluate).not.toHaveBeenCalled();
        expect(result.traceDetails.verification).toBeNull();
    });

    // A broken evaluate must not fail a move that already happened.
    it('degrades to null if the in-page probe throws', async () => {
        const page = createPage();
        page.evaluate.mockRejectedValue(new Error('detached'));
        const { result } = await runNode({ x: 1, y: 1, verifyTarget: true }, { page });
        expect(result.traceDetails.verification).toEqual({ elementAtPoint: null });
    });
});
