import crypto from 'crypto';

const TOLLAI_COOKIE_NAME = 'tollai_session';
const TOLLAI_SESSION_TTL = 15 * 60 * 1000; // 15 minutes

const activeSessions = new Map();

function generateSessionToken() {
    return 'tollai_session_' + crypto.randomBytes(16).toString('hex');
}

function createSession() {
    const token = generateSessionToken();
    const expiresAt = Date.now() + TOLLAI_SESSION_TTL;
    activeSessions.set(token, { createdAt: Date.now(), expiresAt });
    return token;
}

function validateSession(token) {
    if (!token) return false;
    const session = activeSessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
        activeSessions.delete(token);
        return false;
    }
    return true;
}

function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of activeSessions.entries()) {
        if (now > session.expiresAt) {
            activeSessions.delete(token);
        }
    }
}

setInterval(cleanupExpiredSessions, 60 * 1000);

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

export { createSession, validateSession, generateSessionToken };
