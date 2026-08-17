import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import * as fsp from 'fs/promises';
import * as path from 'path';
/* eslint-disable no-undef */

const persistSessionAction = (req, res) =>
    executePlaywrightAction(req, res, 'persist_session', async (page, opts, browserId, context) => {
        const {
            action = 'save',
            path: savePath,
            includeLocalStorage = true,
            includeSessionStorage = true,
        } = opts;

        if (!savePath) throw new Error('Path es requerido para persistir la sesión');

        // Helper to ensure directory exists
        const ensureDirectory = async (filePath) => {
            const dir = path.dirname(filePath);
            await fsp.mkdir(dir, { recursive: true });
        };

        if (action === 'save') {
            await ensureDirectory(savePath);
            // Default storageState saves cookies and local storage from the Context
            await context.storageState({ path: savePath });
            // Note: storageState captures cookies and localStorage from ALL origins in context.
            return { message: 'Sesión guardada en archivo', data: { path: savePath } };
        } else if (action === 'load') {
            // Load state manually into current context
            let state;
            try {
                const content = await fsp.readFile(savePath, 'utf-8');
                state = JSON.parse(content);
            } catch (e) {
                throw new Error(`No se pudo leer el archivo de sesión en: ${savePath}`);
            }

            if (state.cookies) {
                await context.addCookies(state.cookies);
            }

            if (state.origins) {
                // Inyectar storage para el origen actual si coincide
                const currentOrigin = new URL(page.url()).origin;
                const originState = state.origins.find((o) => o.origin === currentOrigin);

                if (originState && originState.localStorage && includeLocalStorage) {
                    await page.evaluate((ls) => {
                        ls.forEach((item) => window.localStorage.setItem(item.name, item.value));
                    }, originState.localStorage);
                }
                if (originState && originState.sessionStorage && includeSessionStorage) {
                    await page.evaluate((ss) => {
                        ss.forEach((item) => window.sessionStorage.setItem(item.name, item.value));
                    }, originState.sessionStorage);
                }
            }
            return { message: 'Sesión cargada (Best Effort) en contexto activo' };
        } else if (action === 'clear') {
            await context.clearCookies();
            await page.evaluate(() => {
                window.localStorage.clear();
                window.sessionStorage.clear();
            });
            return { message: 'Sesión limpiada (Cookies y Storage)' };
        } else {
            throw new Error(`Acción de persistencia no válida: ${action}`);
        }
    });

export default persistSessionAction;
