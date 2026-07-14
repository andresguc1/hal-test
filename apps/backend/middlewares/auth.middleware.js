import { supabase } from '../services/supabaseClient.js';
import { User } from '../database/init.js';

/**
 * Middleware to verify Supabase JWT token from Authorization header
 */
export const authenticated = async (req, res, next) => {
    // Check for authentication bypass (ONLY allowed in development)
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    const isAuthDisabled =
        process.env.AUTH_ENABLED === 'false' || process.env.VITE_AUTH_ENABLED === 'false';
    const isLocalMode = process.env.HALTEST_MODE === 'local' || process.env.HAL_CLI_MODE === 'true';

    // Allow bypass in development with flags OR if explicitly in local mode (NPM/CLI)
    if ((isDev && isAuthDisabled) || isLocalMode) {
        console.log(
            `[AUTH] Bypass active (Environment: ${process.env.NODE_ENV}, Reason: ${isLocalMode ? 'Local Mode' : 'Disabled'})`,
        );
        req.user = { id: 'guest-user', email: 'guest@haltest.dev', role: 'guest' };
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

        // Ensure user is mirrored in local SQLite database
        await User.findOrCreate({
            where: { id: user.id },
            defaults: {
                email: user.email,
                name: user.user_metadata?.full_name || user.email.split('@')[0],
                role: 'user',
            },
        });

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
