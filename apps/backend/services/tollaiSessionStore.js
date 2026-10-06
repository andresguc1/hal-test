import crypto from 'crypto';

const TOLLAI_SESSION_TTL = 15 * 60 * 1000; // 15 minutes

const activeSessions = new Map();

function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of activeSessions.entries()) {
        if (now > session.expiresAt) {
            activeSessions.delete(token);
        }
    }
}

setInterval(cleanupExpiredSessions, 60 * 1000);

export function createSession() {
    const token = 'tollai_session_' + crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + TOLLAI_SESSION_TTL;
    activeSessions.set(token, { createdAt: Date.now(), expiresAt });
    return token;
}

export function validateSession(token) {
    if (!token) return false;
    const session = activeSessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
        activeSessions.delete(token);
        return false;
    }
    return true;
}

export function getSession(token) {
    return activeSessions.get(token);
}

export function deleteSession(token) {
    activeSessions.delete(token);
}

export { activeSessions, TOLLAI_SESSION_TTL };
