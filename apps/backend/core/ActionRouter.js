import { Router } from 'express';
import { nodeRegistry } from './NodeRegistry.js';
import { engineHooks, HookPhase } from './EngineHooks.js';

/**
 * ActionRouter
 * Dynamically generates Express routes from the NodeRegistry.
 * Replaces the static actionRoutes array in api.router.js.
 * Maintains backward compatibility with existing actionRoutes format.
 */
class ActionRouter {
    constructor() {
        this._routes = new Map();
    }

    /**
     * Generates Express routes from all registered node handlers.
     * @param {Function} validateMiddleware - The schema validation middleware
     * @returns {Router} - Express Router with all action routes
     */
    generateRoutes(validateMiddleware) {
        const router = Router();
        const allTypes = nodeRegistry.getAllTypes();

        for (const nodeType of allTypes) {
            const handler = nodeRegistry.getHandler(nodeType);
            const schema = nodeRegistry.getSchema(nodeType);

            if (handler) {
                const middleware = schema ? validateMiddleware(schema) : [];

                router.post(`/actions/${nodeType}`, ...middleware, async (req, res, next) => {
                    try {
                        await engineHooks.emit(HookPhase.NODE_BEFORE_EXECUTE, {
                            nodeType,
                            req,
                            res,
                        });

                        await handler(req, res);

                        await engineHooks.emit(HookPhase.NODE_AFTER_EXECUTE, {
                            nodeType,
                            req,
                            res,
                        });
                    } catch (error) {
                        await engineHooks.emit(HookPhase.NODE_ON_ERROR, {
                            nodeType,
                            req,
                            res,
                            error,
                        });
                        next(error);
                    }
                });

                this._routes.set(nodeType, { handler, schema });
            }
        }

        return router;
    }

    /**
     * Returns action routes in the legacy format for backward compatibility
     * with api.router.js and ExecutionService.
     * @returns {Array<object>} - Array of { path, schema, action, category }
     */
    getActionRoutes() {
        const routes = [];

        for (const nodeType of nodeRegistry.getAllTypes()) {
            const def = nodeRegistry.get(nodeType);
            if (def?.handler) {
                routes.push({
                    path: nodeType,
                    schema: `${nodeType}BodySchema`,
                    action: `${nodeType}Action`,
                    category: def.category || 'uncategorized',
                });
            }
        }

        return routes;
    }

    /**
     * Gets the count of registered routes.
     */
    count() {
        return this._routes.size;
    }
}

export const actionRouter = new ActionRouter();
export default actionRouter;
