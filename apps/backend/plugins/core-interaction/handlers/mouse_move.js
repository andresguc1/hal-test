import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { resolveTarget } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
// The verifyTarget probe calls document.elementFromPoint, which runs in the
// browser page rather than in this Node process.
/* eslint-disable no-undef */

// How far outside the bounding box the cursor must land, in CSS pixels. Any
// positive value is enough to make the engine's hit-test drop the element; 8px
// leaves room for sub-pixel rounding on fractional layouts.
const ESCAPE_MARGIN = 8;

/**
 * Viewport point at the centre of a bounding box. Rounded to integers because
 * sub-pixel coordinates buy nothing for pointer positioning.
 */
export function centreOfBox(box) {
    if (!box) return null;
    return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
}

/**
 * Finds a point strictly outside `box`, so that moving the cursor there makes
 * the browser's hit-testing fire mouseleave on the element.
 *
 * When `direction` is 'any' (or the requested side has no room) the first side
 * with an in-viewport destination wins, preferring 'up' because exit-intent
 * patterns overwhelmingly fire on upward exits.
 *
 * If the element is full-bleed and no side has in-viewport room, the requested
 * direction is still returned but flagged `inViewport: false`. The move is
 * attempted and `verifyTarget` reports what actually happened, rather than
 * throwing: an off-viewport coordinate is undocumented behaviour, not a
 * guaranteed failure, and the node should not claim success it cannot prove.
 */
export function escapePoint(box, direction = 'any', viewport = null, margin = ESCAPE_MARGIN) {
    const vw = viewport?.width ?? Number.POSITIVE_INFINITY;
    const vh = viewport?.height ?? Number.POSITIVE_INFINITY;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    const candidates = {
        up: { x: Math.round(cx), y: Math.round(box.y - margin) },
        down: { x: Math.round(cx), y: Math.round(box.y + box.height + margin) },
        left: { x: Math.round(box.x - margin), y: Math.round(cy) },
        right: { x: Math.round(box.x + box.width + margin), y: Math.round(cy) },
    };

    const fallbackOrder = ['up', 'down', 'left', 'right'];
    // An unrecognised direction is treated as 'any' rather than trusted: the
    // plugin path does not run the HTTP body schema, so a typo must not turn
    // into `candidates[typo].x` being undefined.
    const requested = Object.hasOwn(candidates, direction) ? direction : 'any';
    const order =
        requested === 'any'
            ? fallbackOrder
            : [requested, ...fallbackOrder.filter((d) => d !== requested)];

    for (const d of order) {
        const p = candidates[d];
        if (p.x >= 0 && p.x <= vw && p.y >= 0 && p.y <= vh) {
            return { x: p.x, y: p.y, direction: d, inViewport: true };
        }
    }

    return {
        x: candidates[order[0]].x,
        y: candidates[order[0]].y,
        direction: order[0],
        inViewport: false,
    };
}

/**
 * Computes a destination point outside the viewport.
 *
 * @param {string} direction - 'up' | 'down' | 'left' | 'right' | 'any'
 * @param {number} distance - pixels from the viewport edge
 * @param {{width: number, height: number} | null} viewport - viewport size
 * @returns {{x: number, y: number, direction: string, inViewport: boolean}}
 */
export function outsideViewportPoint(direction = 'any', distance = 10, viewport = null) {
    const vw = viewport?.width ?? Number.POSITIVE_INFINITY;
    const vh = viewport?.height ?? Number.POSITIVE_INFINITY;

    const candidates = {
        up: { x: Math.round(vw / 2), y: -Math.round(distance) },
        down: { x: Math.round(vw / 2), y: Math.round(vh + distance) },
        left: { x: -Math.round(distance), y: Math.round(vh / 2) },
        right: { x: Math.round(vw + distance), y: Math.round(vh / 2) },
    };

    const fallbackOrder = ['up', 'down', 'left', 'right'];
    const requested = Object.hasOwn(candidates, direction) ? direction : 'any';
    const order =
        requested === 'any'
            ? fallbackOrder
            : [requested, ...fallbackOrder.filter((d) => d !== requested)];

    // For outside_viewport, the destination is intentionally out-of-viewport.
    const d = order[0];
    return { x: candidates[d].x, y: candidates[d].y, direction: d, inViewport: false };
}

/**
 * Moves the pointer to a viewport- or element-relative destination.
 *
 * Playwright's `mouse.move` dispatches only `mousemove`; `mouseleave` is
 * produced by the rendering engine's hit-testing when the element under the
 * cursor changes. Because Playwright's virtual cursor starts at (0,0) and is
 * never implicitly reset between nodes, a lone `mouse.move` cannot make an
 * element observe `mouseleave`. The `away_from_element` mode owns that
 * two-phase contract: enter the element first, then leave its bounding box.
 */
const mouseMove = (req, res) =>
    executePlaywrightAction(req, res, 'mouse_move', async (page, opts) => {
        const {
            targetMode = 'viewport_absolute',
            x,
            y,
            selector,
            offsetX = 0,
            offsetY = 0,
            exitDirection = 'any',
            outsideDirection = 'any',
            outsideDistance = 10,
            steps = 12,
            settleMs = 0,
            verifyTarget = false,
            force = false,
        } = opts;

        const timeout = normalizeTimeout(req.body._timeoutResolution?.effectiveMs ?? opts.timeout);
        const viewport = page.viewportSize();

        let dest = null;
        let resolution;
        let enteredElement = false;
        let escape = null;

        if (targetMode === 'viewport_absolute') {
            dest = { x: Math.round(Number(x) || 0), y: Math.round(Number(y) || 0) };
        } else if (
            targetMode === 'element_center' ||
            targetMode === 'element_offset' ||
            targetMode === 'away_from_element'
        ) {
            if (!selector) throw new Error(req.t('errors.selector_required'));

            // Reuse HalTest's selector resolution so candidates, ambiguity
            // handling and self-healing behave exactly as they do for click.
            const resolved = await resolveTarget({
                page,
                target: { selector, candidates: opts.candidates },
                scope: 'element',
                timeout: timeout || undefined,
                signal: req.signal,
            });
            const locator = resolved.locator;
            resolution = resolved.resolution;

            if (!locator) {
                const error = new Error(
                    req.t('errors.mouse_move_unresolved_selector', { selector }),
                );
                error.status = 400;
                throw error;
            }

            const box = await locator.boundingBox();
            if (!box) {
                const error = new Error(req.t('errors.mouse_move_no_bounding_box', { selector }));
                error.status = 400;
                throw error;
            }

            if (targetMode === 'element_center') {
                dest = centreOfBox(box);
            } else if (targetMode === 'element_offset') {
                dest = {
                    x: Math.round(box.x + Number(offsetX || 0)),
                    y: Math.round(box.y + Number(offsetY || 0)),
                };
            } else {
                // away_from_element — TWO PHASES.
                // 1. Put the cursor inside the element so the engine has
                //    something to leave. hover() also runs Playwright's
                //    actionability checks, so a hidden or pointer-events:none
                //    element fails loudly here instead of silently producing a
                //    move that triggers no mouseleave at all.
                await locator.hover({ ...playTimeout(timeout), force });
                enteredElement = true;

                // 2. Travel to a point strictly outside the bounding box.
                escape = escapePoint(box, exitDirection, viewport);
                dest = { x: escape.x, y: escape.y };
            }
        } else if (targetMode === 'outside_viewport') {
            // outside_viewport — move pointer outside the viewport bounds.
            // This is a single-phase move to a coordinate intentionally outside
            // the visible area, used for exit-intent testing. No selector needed.
            const outside = outsideViewportPoint(outsideDirection, outsideDistance, viewport);
            dest = { x: outside.x, y: outside.y };
            escape = outside; // reuse for traceDetails
        } else {
            // The HTTP body schema already rejects unknown modes, but the
            // plugin/ActionRouter path does not validate. Failing loudly beats
            // silently treating a typo as away_from_element and yanking the
            // pointer out of an element the author never asked to leave.
            const error = new Error(req.t('errors.mouse_move_unknown_mode', { targetMode }));
            error.status = 400;
            throw error;
        }

        // `steps` is relative to the cursor's CURRENT position, so it inherits
        // ambient state from whatever previous node ran — realistic, but worth
        // surfacing in the trace rather than pretending the path is anchored.
        const interpolation = Math.max(1, Number(steps) || 1);

        await page.mouse.move(dest.x, dest.y, { steps: interpolation });

        if (settleMs > 0) await page.waitForTimeout(settleMs);

        // Reports what is actually at the destination instead of asserting the
        // move "worked". This is the only way to tell whether an out-of-viewport
        // coordinate was honoured, since Playwright documents it either way.
        let verification = null;
        if (verifyTarget) {
            const hit = await page
                .evaluate(
                    ({ px, py }) => {
                        const el = document.elementFromPoint(px, py);
                        if (!el) return null;
                        return {
                            tag: el.tagName.toLowerCase(),
                            id: el.id || null,
                            className: typeof el.className === 'string' ? el.className : null,
                            role: el.getAttribute('role'),
                            text: (el.textContent || '').trim().slice(0, 80) || null,
                        };
                    },
                    { px: dest.x, py: dest.y },
                )
                .catch(() => null);
            verification = { elementAtPoint: hit };
        }

        return {
            message: req.t('actions.mouse_move.success', { x: dest.x, y: dest.y }),
            traceDetails: {
                targetMode,
                selector: selector ?? null,
                resolution: resolution ?? null,
                destination: dest,
                steps: interpolation,
                settleMs,
                enteredElement,
                exitDirection: escape?.direction ?? null,
                inViewport: escape ? escape.inViewport : null,
                viewport,
                outsideDistance: targetMode === 'outside_viewport' ? outsideDistance : null,
                verification,
            },
        };
    });

export default mouseMove;
