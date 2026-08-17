import { variableManager } from '../../../services/VariableManager.js';

const inputAction = async (req, res) => {
    try {
        const { name, defaultValue } = req.body;

        if (name && !variableManager.has(name, req.body.runId) && defaultValue !== undefined) {
            variableManager.set(name, defaultValue, req.body.runId);
        }

        return res.status(200).json({
            success: true,
            data: name ? { name, value: variableManager.get(name, req.body.runId) } : {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error in input action',
            error: error.message,
        });
    }
};

export default inputAction;
