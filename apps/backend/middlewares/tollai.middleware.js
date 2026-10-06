import { validateSession } from '../services/tollaiSessionStore.js';

const TOLLAI_COOKIE_NAME = 'tollai_session';

function isAuthenticated(req) {
    // Check if user is already authenticated by auth middleware
    if (req.user && req.user.id && req.user.id !== 'guest-user') {
        return true;
    }
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return true;
    }
    // Check Supabase auth cookies (various naming patterns)
    if (req.cookies) {
        for (const [name, value] of Object.entries(req.cookies)) {
            // Supabase uses: sb-<project-ref>-auth-token, supabase.auth.token, etc.
            if (name.startsWith('sb-') && name.endsWith('-auth-token')) {
                return true;
            }
            if (name.includes('supabase') && (name.includes('auth') || name.includes('token'))) {
                return true;
            }
            // Generic session/auth cookies
            if (
                (name === 'session' || name === 'auth-token' || name === 'access_token') &&
                value &&
                value.length > 20
            ) {
                return true;
            }
        }
    }
    return false;
}

export function tollaiMiddleware(options = {}) {
    const {
        paths = ['/'],
        excludePaths = [
            '/tollai',
            '/api',
            '/storage',
            '/assets',
            '/images',
            '/favicon.ico',
            '/robots.txt',
            '/sitemap.xml',
        ],
        requireValidSession = true,
        redirectToChallenge = true,
    } = options;

    return (req, res, next) => {
        if (excludePaths.some((p) => req.path.startsWith(p))) {
            return next();
        }

        const shouldProtect = paths.some((p) => {
            if (p === '/')
                return (
                    req.path === '/' ||
                    req.path.startsWith('/blog') ||
                    req.path.startsWith('/docs') ||
                    req.path.startsWith('/app')
                );
            return req.path.startsWith(p);
        });

        if (!shouldProtect) {
            return next();
        }

        // Skip TollAI for authenticated users
        if (isAuthenticated(req)) {
            return next();
        }

        const token = req.cookies && req.cookies[TOLLAI_COOKIE_NAME];

        if (!token || !validateSession(token)) {
            if (requireValidSession && redirectToChallenge) {
                if (req.accepts('html')) {
                    return res.status(403).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Verification Required</title>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <script src="/tollai-client.js"></script>
              <style>
                body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .container { text-align: center; padding: 2rem; }
                .spinner { border: 3px solid #3b82f6; border-top: 3px solid transparent; border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="spinner"></div>
                <h2>Verifying access...</h2>
                <p>Please wait while we verify you're human.</p>
              </div>
            </body>
            </html>
          `);
                }
                return res
                    .status(403)
                    .json({ error: 'TollAI verification required', code: 'TOLLAI_REQUIRED' });
            }
        }

        req.tollai = { verified: !!token && validateSession(token), token };
        next();
    };
}

export function tollaiVerifyMiddleware(req, res, next) {
    const token = req.cookies && req.cookies[TOLLAI_COOKIE_NAME];
    req.tollai = { verified: !!token && validateSession(token), token };
    next();
}
