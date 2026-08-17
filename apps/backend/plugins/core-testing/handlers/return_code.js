import { smartEmitLog } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';

const returnCodeAction = (req, res) => {
    const { successField = 'success', exitOnFail = true, customCodes, verbose = true } = req.body;

    // We look for the success state in the variables (defaulting to the 'success' variable)
    const isSuccess = variableManager.get(successField, req.body.runId) !== false;

    let codes = { success: 0, failed: 1 };
    if (customCodes) {
        try {
            codes = typeof customCodes === 'string' ? JSON.parse(customCodes) : customCodes;
        } catch (e) {
            console.warn('[ReturnCode] Failed to parse customCodes JSON');
        }
    }

    const finalCode = isSuccess ? codes.success : codes.failed;

    // Store in a reserved global variable
    variableManager.set('HAL_RETURN_CODE', finalCode, 'global');

    if (verbose) {
        smartEmitLog(
            `[SYSTEM] Final return code set to: ${finalCode} (Success: ${isSuccess})`,
            'info',
        );
    }

    if (!isSuccess && exitOnFail) {
        smartEmitLog(`[SYSTEM] Flow flagged to exit with failure code.`, 'warning');
    }

    return res.status(200).json({
        success: true,
        message: `Return code ${finalCode} registered`,
        data: { code: finalCode, exitOnFail },
    });
};

export default returnCodeAction;
