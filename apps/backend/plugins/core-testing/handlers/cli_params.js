import { smartEmitLog } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';

const cliParamsAction = (req, res) => {
    const { paramName, paramType, defaultValue, required } = req.body;

    // 1. Search in process.env, req.query, or req.params (for webhook-like triggers)
    let value =
        process.env[paramName] || req.query[paramName] || req.params[paramName] || req.body.value;

    // 2. Fallback to default
    if (value === undefined || value === null || value === '') {
        value = defaultValue;
    }

    // 3. Check if required
    if (required && (value === undefined || value === null || value === '')) {
        return res.status(400).json({
            success: false,
            message: `Required CLI parameter missing: ${paramName}`,
        });
    }

    // 4. Type conversion
    if (paramType === 'number') value = Number(value);
    if (paramType === 'boolean') value = String(value).toLowerCase() === 'true';

    // 5. Persist to Global variable scope
    variableManager.set(paramName, value, 'global');

    smartEmitLog(`[CLI] Parameter injected: ${paramName} = ${value}`, 'info');

    return res.status(200).json({
        success: true,
        message: `CLI parameter ${paramName} injected successfully`,
        data: { [paramName]: value },
    });
};

export default cliParamsAction;
