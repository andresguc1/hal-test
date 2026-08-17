import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';
import * as fsp from 'fs/promises';
import { isSafePath } from '../../../utils/security.js';
import { STORAGE_DIR } from '../../../config/paths.js';

const saveResultsAction = (req, res) =>
    executePlaywrightAction(req, res, 'save_results', async (page, opts) => {
        const { data, path: savePath, variableName } = opts;

        // Security check: Prevent Path Traversal
        if (!isSafePath(savePath, STORAGE_DIR)) {
            throw new Error(
                req.t('errors.unsafe_path', { path: savePath }) || `Unsafe path: ${savePath}`,
            );
        }

        await fsp.writeFile(
            savePath,
            typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        );

        // Persist path to variable if requested
        if (variableName) {
            variableManager.set(variableName, savePath, req.body.runId);
        }

        return {
            message: req.t('actions.save_results.success'),
            data: { path: savePath, variableName: variableName || undefined },
        };
    });

export default saveResultsAction;
