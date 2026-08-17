import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';

const readDataAction = (req, res) =>
    executePlaywrightAction(req, res, 'read_data', async (page, opts) => {
        const { selector, type = 'text', variableName } = opts; // type: 'text', 'html', 'attributes'

        let data;
        if (type === 'text') {
            data = await page.textContent(selector);
        } else if (type === 'html') {
            data = await page.innerHTML(selector);
        } else {
            // Implement attribute logic if necessary
            return { message: req.t('actions.read_data.unsupported_type'), data: {} };
        }

        // Persist to variables if requested
        if (variableName) {
            variableManager.set(variableName, data, req.body.runId);
        }

        return {
            message: req.t('actions.read_data.success'),
            data: { content: data, variableName: variableName || undefined },
        };
    });

export default readDataAction;
