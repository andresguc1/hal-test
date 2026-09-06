import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

// Granular mouse-driven drag that is visible to the user (leafs real movement
// across the screen). Uses bounding boxes + segmented mouse.move steps so the
// dragged element travels smoothly instead of being teleported by dragTo().
export async function visualDragTo(
    page,
    sourceLocator,
    targetLocator,
    { steps = 12, force = false } = {},
) {
    const timeoutFallback = () =>
        new Error(
            'Unable to resolve drag positions for visual animation (element bounds not found). ' +
                'Consider disabling visualAnimation for stability.',
        );

    const [sourceBox, targetBox] = await Promise.all([
        sourceLocator.boundingBox(),
        targetLocator.boundingBox(),
    ]);

    if (!sourceBox || !targetBox) {
        const error = timeoutFallback();
        error.status = 400;
        throw error;
    }

    const startX = sourceBox.x + sourceBox.width / 2;
    const startY = sourceBox.y + sourceBox.height / 2;
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + targetBox.height / 2;

    await sourceLocator.hover({ force });
    await page.mouse.move(startX, startY);
    await page.mouse.down();

    try {
        // Small pause so the user sees the grab happen naturally.
        await page.waitForTimeout(50);

        const segments = Math.max(2, Number(steps) || 12);
        for (let i = 1; i <= segments; i += 1) {
            const progress = i / segments;
            await page.mouse.move(
                startX + (endX - startX) * progress,
                startY + (endY - startY) * progress,
                { steps: 1 },
            );
            // Interleaved delay keeps the movement readable as an animation.
            await page.waitForTimeout(12);
        }

        await page.mouse.move(endX, endY, { steps: 1 });
        await page.waitForTimeout(40);
        await page.mouse.up();
    } catch (err) {
        // Never leave the mouse button stuck on a half-finished drag.
        await page.mouse.up().catch(() => {});
        throw err;
    }
}

const dragDrop = (req, res) =>
    executePlaywrightAction(req, res, 'drag_drop', async (page, opts) => {
        const { sourceSelector, targetSelector, steps = 10, force = false } = opts;
        // visualAnimation: true → smooth on-screen movement; false/omitted → fast
        // native dragTo (best for CI and high-volume suites). Backward
        // compatible: flows saved without the flag keep their old behavior.
        const visualAnimation = opts.visualAnimation === true;

        if (!sourceSelector || !targetSelector) {
            const error = new Error(req.t('errors.source_target_required'));
            error.status = 400;
            throw error;
        }

        const sourceTarget = await normalizeSelectorForDotId(page, sourceSelector);
        const targetTarget = await normalizeSelectorForDotId(page, targetSelector);
        const sourceLocator = buildPlaywrightLocator(page, sourceTarget);
        const targetLocator = buildPlaywrightLocator(page, targetTarget);

        if (visualAnimation) {
            await visualDragTo(page, sourceLocator, targetLocator, {
                steps: Number(steps),
                force,
            });
        } else {
            console.log(
                `[INFO] Dragging ${sourceTarget} to ${targetTarget} (native). Steps: ${steps}, Force: ${force}`,
            );

            await sourceLocator.dragTo(targetLocator, {
                steps: Number(steps),
                force,
            });
        }

        return {
            message: req.t('actions.drag_drop.success', {
                source: sourceTarget,
                target: targetTarget,
            }),
            traceDetails: {
                sourceSelector: sourceTarget,
                targetSelector: targetTarget,
                steps,
                force,
                visualAnimation,
            },
        };
    });

export default dragDrop;
