import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';
import { isSafePath } from '../../../utils/security.js';
import { STORAGE_DIR } from '../../../config/paths.js';

const handleDownloadsAction = (req, res) =>
    executePlaywrightAction(req, res, 'handle_downloads', async (page, opts) => {
        const { selector, path: savePath, variableName } = opts;

        const downloadPromise = page.waitForEvent('download');
        await page.click(selector);
        const download = await downloadPromise;

        // Security check: Prevent Path Traversal
        if (!isSafePath(savePath, STORAGE_DIR)) {
            throw new Error(
                req.t('errors.unsafe_path', { path: savePath }) || `Unsafe path: ${savePath}`,
            );
        }

        await download.saveAs(savePath);

        // Persist path to variable if requested
        if (variableName) {
            variableManager.set(variableName, savePath, req.body.runId);
        }

        return {
            message: req.t('actions.handle_downloads.success'),
            data: { path: savePath, variableName: variableName || undefined },
        };
    });

export default handleDownloadsAction;
