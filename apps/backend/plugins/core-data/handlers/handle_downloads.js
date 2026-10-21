import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';

const handleDownloadsAction = (req, res) =>
    executePlaywrightAction(req, res, 'handle_downloads', async (page, opts) => {
        const {
            selector,
            action = 'save',
            path: savePath,
            variableName,
            minSizeKB,
            maxSizeKB,
            expectedFileName,
            timeout,
        } = opts;

        // Determine effective save path: use provided path or default to user's Downloads folder
        // Works on all OS: Linux ~/Downloads, macOS ~/Downloads, Windows C:\Users\<name>\Downloads
        const DOWNLOAD_DEFAULT_DIR = path.join(os.homedir(), 'Downloads');
        let effectiveSavePath = (savePath || '').trim() || DOWNLOAD_DEFAULT_DIR;

        // Ensure the target directory exists (resolve later once we know the filename).
        const saveDir = fs.statSync(effectiveSavePath, { throwIfNoEntry: false })?.isDirectory()
            ? effectiveSavePath
            : path.dirname(effectiveSavePath);
        try {
            await fsp.access(saveDir);
        } catch (_) {
            try {
                await fsp.mkdir(saveDir, { recursive: true });
            } catch (_) {
                // Cannot create directory; fall back to user's Downloads
                effectiveSavePath = DOWNLOAD_DEFAULT_DIR;
            }
        }

        // 1. Esperar evento download con timeout
        const downloadPromise = page.waitForEvent('download', {
            timeout: timeout || 60000,
        });
        await page.click(selector);
        const download = await downloadPromise;

        // 2. Obtener nombre sugerido del servidor
        const suggestedName = download.suggestedFilename();

        // 3. Validar expectedFileName si se proporcionó
        if (expectedFileName && suggestedName !== expectedFileName) {
            throw new Error(
                `Expected file "${expectedFileName}" but server sent "${suggestedName}"`,
            );
        }

        // 4. Ramificar según acción
        let finalPath = null;

        if (action === 'wait') {
            // Solo esperar que la descarga complete. download.path() fuerza
            // la finalización y retorna la ruta temporal de Playwright.
            // Playwright limpia esta carpeta al cerrar el contexto.
            finalPath = await download.path();
        } else if (action === 'validateAndDelete') {
            // Descargar a temporal, validar, eliminar
            const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'haltest-dl-'));
            const tempPath = path.join(tempDir, suggestedName);

            await download.saveAs(tempPath);

            // Validar tamaño
            validateFileSize(tempPath, minSizeKB, maxSizeKB);

            // Eliminar archivo + directorio temporal
            await fsp.unlink(tempPath);
            await fsp.rmdir(tempDir).catch(() => {});

            finalPath = null; // ya no existe
        } else {
            // 'save' (y backward compat: 'validate', 'saveAndValidate')
            // Si effectiveSavePath es un directorio, unir con el filename sugerido
            const isDir = fs.statSync(effectiveSavePath, { throwIfNoEntry: false })?.isDirectory();
            const targetFile = isDir
                ? path.join(effectiveSavePath, suggestedName)
                : effectiveSavePath;
            finalPath = await resolveDownloadPath(targetFile);
            await download.saveAs(finalPath);

            // Validar tamaño después de guardar
            validateFileSize(finalPath, minSizeKB, maxSizeKB);
        }

        // 5. Persistir en variable
        if (variableName && finalPath) {
            variableManager.set(variableName, finalPath, req.body.runId);
        }

        return {
            message: req.t('actions.handle_downloads.success'),
            data: {
                path: finalPath || undefined,
                fileName: suggestedName,
                action,
                variableName: variableName || undefined,
            },
        };
    });

export default handleDownloadsAction;

/**
 * Valida el tamaño del archivo contra minSizeKB y maxSizeKB.
 */
function validateFileSize(filePath, minSizeKB, maxSizeKB) {
    if (minSizeKB === undefined && maxSizeKB === undefined) return;
    const stat = fs.statSync(filePath);
    const fileSizeKB = stat.size / 1024;
    if (minSizeKB !== undefined && fileSizeKB < minSizeKB) {
        throw new Error(
            `Downloaded file too small: ${fileSizeKB.toFixed(2)} KB (min: ${minSizeKB} KB)`,
        );
    }
    if (maxSizeKB !== undefined && fileSizeKB > maxSizeKB) {
        throw new Error(
            `Downloaded file too large: ${fileSizeKB.toFixed(2)} KB (max: ${maxSizeKB} KB)`,
        );
    }
}

/**
 * Resuelve el download path, verificando si el archivo ya existe y
 * añadiendo un sufijo de timestamp si es necesario para prevenir
 * sobrescrituras silenciosas.
 */
async function resolveDownloadPath(savePath) {
    const exists = await fsp
        .access(savePath)
        .then(() => true)
        .catch(() => false);
    if (!exists) return savePath;

    const timestamp = Date.now().toString().slice(-6);
    const parsed = path.parse(savePath);
    const newPath = `${parsed.dir}/${parsed.name}_${timestamp}${parsed.ext}`;
    return resolveDownloadPath(newPath);
}
