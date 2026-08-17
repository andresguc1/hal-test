import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const dragDrop = (req, res) =>
    executePlaywrightAction(req, res, 'drag_drop', async (page, opts) => {
        const { sourceSelector, targetSelector, steps = 10, force = false } = opts;

        if (!sourceSelector || !targetSelector) {
            const error = new Error(req.t('errors.source_target_required'));
            error.status = 400;
            throw error;
        }

        const sourceTarget = await normalizeSelectorForDotId(page, sourceSelector);
        const targetTarget = await normalizeSelectorForDotId(page, targetSelector);
        const sourceLocator = buildPlaywrightLocator(page, sourceTarget);
        const targetLocator = buildPlaywrightLocator(page, targetTarget);

        console.log(
            `[INFO] Dragging ${sourceTarget} to ${targetTarget}. Steps: ${steps}, Force: ${force}`,
        );

        await sourceLocator.dragTo(targetLocator, {
            steps: Number(steps),
            force,
        });

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
            },
        };
    });

export default dragDrop;
