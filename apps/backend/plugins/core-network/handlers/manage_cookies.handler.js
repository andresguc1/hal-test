import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';

const manageCookies = (req, res) => {
    req.body.target = 'cookie';
    return executePlaywrightAction(
        req,
        res,
        'manage_cookies',
        async (page, opts, browserId, context) => {
            const { target, action, key, value, variableName, cookiesData } = opts;

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

            return { message: 'Unknown cookie action' };
        },
    );
};

export default manageCookies;
