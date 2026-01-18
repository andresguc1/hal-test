import { supabase } from '../services/supabaseClient.js';

/**
 * Middleware to verify Supabase JWT token from Authorization header
 */
export const authenticated = async (req, res, next) => {
    // Check if authentication is disabled (ONLY allowed in non-production)
    const isDev = process.env.NODE_ENV !== 'production';
    const isAuthDisabled =
        process.env.AUTH_ENABLED === 'false' || process.env.VITE_AUTH_ENABLED === 'false';

    if (isDev && isAuthDisabled) {
        req.user = { id: 'local-dev-user', email: 'local@haltest.dev', role: 'admin' };
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Missing or invalid token format',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Invalid token',
                error: error?.message,
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error during authentication',
        });
    }
};
