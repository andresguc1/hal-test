import { variableManager } from '../../../services/VariableManager.js';

const transformAction = async (req, res) => {
    try {
        const { operation, input, expression, mergeWith, outputVar } = req.body;

        const inputArray =
            (typeof input === 'string' ? variableManager.get(input, req.body.runId) : null) ||
            variableManager.resolveValue(input, req.body.runId) ||
            [];

        let result;
        switch (operation) {
            case 'map':
                result = inputArray.map((item) =>
                    variableManager.evaluate(expression, req.body.runId, { item }),
                );
                break;
            case 'filter':
                result = inputArray.filter((item) =>
                    variableManager.evaluate(expression, req.body.runId, { item }),
                );
                break;
            case 'merge': {
                const mergeArray =
                    (typeof mergeWith === 'string'
                        ? variableManager.get(mergeWith, req.body.runId)
                        : null) ||
                    variableManager.resolveValue(mergeWith, req.body.runId) ||
                    [];
                result = Array.isArray(mergeArray)
                    ? [...inputArray, ...mergeArray]
                    : [...inputArray, mergeArray];
                break;
            }
            case 'reduce': {
                if (inputArray.length === 0) {
                    result = null;
                } else {
                    result = inputArray.reduce((acc, item) => {
                        return variableManager.evaluate(expression, req.body.runId, { acc, item });
                    });
                }
                break;
            }
            default:
                result = inputArray;
        }

        variableManager.set(outputVar, result, req.body.runId);

        return res.status(200).json({
            success: true,
            message: req.t('actions.transform.success'),
            data: { operation, result, outputVar },
        });
    } catch (error) {
        console.error('[ERROR] transformAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.transform.error'),
            error: error.message,
        });
    }
};

export default transformAction;
