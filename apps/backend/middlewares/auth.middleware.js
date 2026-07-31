import { supabase } from '../services/supabaseClient.js';
import { User } from '../database/init.js';

/**
 * Middleware to verify Supabase JWT token from Authorization header
 */
export const authenticated = async (req, res, next) => {
    // Check for authentication bypass
    const isAuthDisabled =
        process.env.AUTH_ENABLED === 'false' || process.env.VITE_AUTH_ENABLED === 'false';
    const isLocalMode = process.env.HALTEST_MODE === 'local' || process.env.HAL_CLI_MODE === 'true';
    const isSupabaseMissing = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Allow bypass if auth is disabled, explicitly in local mode, or if Supabase credentials are missing
    if (isAuthDisabled || isLocalMode || isSupabaseMissing) {
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
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Authentication service error',
            error: err.message,
        });
    }
};
