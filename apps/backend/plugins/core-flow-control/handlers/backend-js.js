import { variableManager } from '../../../services/VariableManager.js';

const backendJsAction = async (req, res) => {
    try {
        const { expression, script, code, outputVar = 'backendResult' } = req.body;
        const activeScript = expression || script || code;
        if (!activeScript) {
            return res.status(400).json({
                success: false,
                message: 'Expression/Script is required',
            });
        }

        const result = variableManager.evaluate(activeScript, req.body.runId);
        const resolvedOutput = outputVar.replace('${', '').replace('}', '');
        variableManager.set(resolvedOutput, result, req.body.runId);

        console.log(`[FLOW] Backend JS executed. Saved to ${resolvedOutput}`);

        return res.status(200).json({
            success: true,
            message: 'Backend Script executed successfully',
            data: { result, variable: resolvedOutput },
        });
    } catch (error) {
        console.error('[ERROR] backendJsAction:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Error executing backend JS',
            error: error.message,
        });
    }
};

export default backendJsAction;
