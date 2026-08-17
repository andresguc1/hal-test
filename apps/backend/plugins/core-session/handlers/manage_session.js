import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';
/* eslint-disable no-undef */

const manageSessionAction = (req, res) =>
    executePlaywrightAction(req, res, 'manage_session', async (page, opts, browserId, context) => {
        const { target, action, key, value, variableName, cookiesData } = opts;

        // 1. COOKIES
        if (target === 'cookie') {
            if (action === 'get') {
                const cookies = await context.cookies();
                if (key) {
                    const cookie = cookies.find((c) => c.name === key);
                    const val = cookie ? cookie.value : null;
                    if (variableName) {
                        variableManager.set(variableName, val, req.body.runId);
                    }
                    return {
                        message: `Cookie ${key} obtenida: ${val}`,
                        data: { value: val, cookie, variableStored: variableName },
                    };
                }
                return { message: 'Cookies obtenidas', data: { cookies } };
            } else if (action === 'set') {
                let url = 'http://localhost';
                try {
                    url = page.url();
                    if (url === 'about:blank') url = 'http://localhost';
                } catch (e) {
                    console.error('Error getting page URL for session cookie:', e);
                }

                const cookiesToSet = cookiesData
                    ? JSON.parse(cookiesData)
                    : [{ name: key, value, url }];
                await context.addCookies(
                    Array.isArray(cookiesToSet) ? cookiesToSet : [cookiesToSet],
                );
                return { message: 'Cookies establecidas' };
            } else if (action === 'delete') {
                const currentCookies = await context.cookies();
                const namesToDelete = cookiesData
                    ? new Set(JSON.parse(cookiesData))
                    : new Set([key]);
                const cookiesToKeep = currentCookies.filter((c) => !namesToDelete.has(c.name));
                await context.clearCookies();
                if (cookiesToKeep.length > 0) await context.addCookies(cookiesToKeep);
                return { message: 'Cookies eliminadas' };
            } else if (action === 'clear') {
                await context.clearCookies();
                return { message: 'Cookies limpiadas' };
            }
        }

        // 2. STORAGE (Local / Session)
        if (target === 'local_storage' || target === 'session_storage') {
            const storageType = target === 'session_storage' ? 'session' : 'local';
            if (action === 'get') {
                const data = await page.evaluate(
                    ({ storageType, key }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        return key ? storage.getItem(key) : JSON.stringify(storage);
                    },
                    { storageType, key },
                );
                if (variableName) {
                    variableManager.set(variableName, data, req.body.runId);
                }
                return {
                    message: `${target} obtenido: ${data}`,
                    data: { value: data, variableStored: variableName },
                };
            } else if (action === 'set') {
                await page.evaluate(
                    ({ storageType, key, value }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        storage.setItem(key, value);
                    },
                    { storageType, key, value },
                );
                return { message: `${target} actualizado` };
            } else if (action === 'delete') {
                await page.evaluate(
                    ({ storageType, key }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        storage.removeItem(key);
                    },
                    { storageType, key },
                );
                return { message: `${target} eliminado` };
            } else if (action === 'clear') {
                await page.evaluate(
                    ({ storageType }) => {
                        const storage =
                            storageType === 'session' ? window.sessionStorage : window.localStorage;
                        storage.clear();
                    },
                    { storageType },
                );
                return { message: `${target} limpiado` };
            }
        }

        // 3. HEADER
        if (target === 'header') {
            if (action === 'set') {
                await page.setExtraHTTPHeaders({ [key]: value });
                return { message: `Header ${key} inyectado` };
            }
            throw new Error(`Acción ${action} no soportada para headers`);
        }

        // 4. QUERY
        if (target === 'query') {
            if (action === 'set') {
                const currentUrl = new URL(page.url());
                currentUrl.searchParams.set(key, value);
                await page.goto(currentUrl.toString());
                return { message: `Query param ${key} inyectado y página recargada` };
            }
            throw new Error(`Acción ${action} no soportada para query params`);
        }

        throw new Error(`Combinación de target ${target} y acción ${action} no válida`);
    });

export default manageSessionAction;
