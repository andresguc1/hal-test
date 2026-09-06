import { supabase } from '../services/supabaseClient.js';
import { User } from '../database/init.js';

/**
 * Middleware to verify Supabase JWT token from Authorization header
 */
export const authenticated = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Check for authentication bypass conditions
    const isAuthDisabled =
        process.env.AUTH_ENABLED === 'false' || process.env.VITE_AUTH_ENABLED === 'false';
    const isLocalMode = process.env.HALTEST_MODE === 'local' || process.env.HAL_CLI_MODE === 'true';
    const isSupabaseMissing = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Allow guest access when auth is disabled, in local mode, Supabase is not
    // configured, or the client explicitly opts-in with a known guest token.
    if (
        isAuthDisabled ||
        isLocalMode ||
        isSupabaseMissing ||
        token === 'local-guest-token' ||
        token === 'local-dev-token' ||
        token === 'guest'
    ) {
        req.user = { id: 'guest-user', email: 'guest@haltest.dev', role: 'guest' };
        return next();
    }

    // No token provided → allow as guest (legacy behaviour for local + unconfigured setups)
    if (!token) {
        req.user = { id: 'guest-user', email: 'guest@haltest.dev', role: 'guest' };
        return next();
    }

    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            // Token present but invalid/expired → deny instead of guest fallback
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
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
        console.error('[AUTH] Auth Middleware Error:', err.message);
        // Supabase connection error — deny to be safe in cloud mode
        return res.status(503).json({
            success: false,
            error: 'Authentication service unavailable',
        });
    }
};
