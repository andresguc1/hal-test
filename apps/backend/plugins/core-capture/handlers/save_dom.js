import * as fsp from 'fs/promises';
import * as path from 'path';
import { variableManager } from '../../../services/VariableManager.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const saveDomAction = (req, res) =>
    executePlaywrightAction(req, res, 'save_dom', async (page, opts) => {
        const { path: savePath, variableName, selector, timeout = 30000 } = opts;

        if (!savePath && !variableName) {
            throw new Error(req.t('errors.save_dom_destination_required'));
        }

        let resolvedPath = null;
        if (savePath) {
            if (savePath.includes('..')) {
                throw new Error(req.t('errors.unsafe_file_path'));
            }
            resolvedPath = path.resolve(savePath);
        }

        let content = '';
        if (selector) {
            const targetSelector = await normalizeSelectorForDotId(page, selector);
            const locator = buildPlaywrightLocator(page, targetSelector);
            await locator.waitFor({ state: 'attached', timeout });
            content = await locator.evaluate((el) => el.outerHTML);
        } else {
            content = await page.content();
        }

        const results = {};

        if (resolvedPath) {
            await fsp.writeFile(resolvedPath, content);
            results.path = resolvedPath;
        }

        if (variableName) {
            variableManager.set(variableName, content, req.body.runId);
            results.variableStored = variableName;
        }

        return {
            message: 'DOM guardado exitosamente',
            data: results,
            traceDetails: {
                path: resolvedPath,
                variableName,
                selector,
                contentLength: content.length,
            },
        };
    });

export default saveDomAction;
