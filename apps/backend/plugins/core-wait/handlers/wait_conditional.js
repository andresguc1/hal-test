import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
import { variableManager } from '../../../services/VariableManager.js';

const waitConditional = async (req, res) => {
    const { waitType = 'browser', expression, polling = 100 } = req.body;
    const timeout = normalizeTimeout(req.body.timeout);

    if (waitType === 'browser') {
        return executePlaywrightAction(req, res, 'wait_conditional', async (page) => {
            await page.waitForFunction(expression, null, {
                polling,
                ...playTimeout(timeout),
            });
            return { message: req.t('actions.wait_conditional.success') };
        })(req, res);
    } else {
        const startTime = Date.now();
        const checkCondition = () => {
            try {
                const conditions =
                    typeof expression === 'string' ? JSON.parse(expression) : expression;
                const condArray = Array.isArray(conditions) ? conditions : [conditions];
                return variableManager.evaluateConditions(condArray, 'AND');
            } catch (e) {
                console.warn('[WaitVariable] Evaluation failed:', e.message);
                return false;
            }
        };

        while (true) {
            if (checkCondition()) {
                return res.status(200).json({
                    success: true,
                    message: 'Variable condition met',
                });
            }
            if (Date.now() - startTime >= timeout) break;
            await new Promise((resolve) => setTimeout(resolve, polling));
        }

        return res.status(408).json({
            success: false,
            message: `Timeout waiting for variable condition after ${timeout}ms`,
        });
    }
};

export default waitConditional;
