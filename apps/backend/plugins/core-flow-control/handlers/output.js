import { variableManager } from '../../../services/VariableManager.js';

const outputAction = async (req, res) => {
    try {
        const { name, value } = req.body;

        let resolvedValue = undefined;
        if (value !== undefined) {
            resolvedValue = variableManager.resolveValue(value, req.body.runId);
        }

        if (name) {
            variableManager.set(name, resolvedValue, req.body.runId);
        }

        return res.status(200).json({
            success: true,
            action: 'return',
            data:
                resolvedValue !== undefined
                    ? resolvedValue
                    : name
                      ? { name, value: resolvedValue }
                      : {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error in output action',
            error: error.message,
        });
    }
};

export default outputAction;
