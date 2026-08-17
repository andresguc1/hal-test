import { variableManager } from '../../../services/VariableManager.js';
import { emitVariableChange } from '../../../socket.js';

const variableAction = async (req, res) => {
    try {
        const { operation = 'set', name, value, scope = 'flow', runId } = req.body;

        let result;
        let message;

        switch (operation) {
            case 'set':
                if (
                    !req.body.isDynamicValue &&
                    runId &&
                    variableManager.isInitializedFromDataset(name, runId)
                ) {
                    const datasetValue = variableManager.get(name, runId);
                    result = {
                        name,
                        value: datasetValue,
                        scope,
                        operation: 'set',
                        skipped: true,
                    };
                    message = `Variable "${name}" is driven by dataset (value: "${datasetValue}"). Skipped overwriting with flow default "${value}".`;
                    console.log(`[VariableManager] ${message}`);
                    break;
                }
                variableManager.set(name, value, runId, scope);
                result = { name, value, scope, operation: 'set' };
                message = req.t('actions.variable.set_success', { name, scope });
                emitVariableChange({ name, value, scope, operation: 'set' });
                break;

            case 'get': {
                const getValue = variableManager.get(name, runId);
                result = { name, value: getValue, scope, operation: 'get' };
                message = req.t('actions.variable.get_success', { name });
                break;
            }

            case 'increment': {
                const amount = typeof value === 'number' ? value : 1;
                variableManager.increment(name, amount, runId);
                const newValue = variableManager.get(name, runId);
                result = { name, value: newValue, amount, scope, operation: 'increment' };
                message = req.t('actions.variable.increment_success', { name, amount });
                emitVariableChange({ name, value: newValue, scope, operation: 'increment' });
                break;
            }

            case 'push': {
                variableManager.push(name, value, runId);
                const array = variableManager.get(name, runId);
                result = { name, array, scope, operation: 'push' };
                message = req.t('actions.variable.push_success', { name });
                emitVariableChange({ name, value: array, scope, operation: 'push' });
                break;
            }

            default:
                return res.status(400).json({
                    success: false,
                    message: `Invalid operation: ${operation}`,
                });
        }

        return res.status(200).json({
            success: true,
            message,
            data: result,
        });
    } catch (error) {
        console.error('[ERROR] variableAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.variable.error'),
            error: error.message,
        });
    }
};

export default variableAction;
