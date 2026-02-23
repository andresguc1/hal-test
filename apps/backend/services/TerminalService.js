/**
 * TerminalService.js
 * Manages the lifecycle of backend shell processes spawned from the interactive terminal.
 * Each "session" is a child_process instance identified by a sessionId (usually socket.id).
 */

import { spawn } from 'child_process';
import { emitTerminalOutput } from '../socket.js';
import { emitCodegenAction } from '../socket.js';

// ─── Allowed command prefixes (security whitelist) ────────────────────────────
// SECURITY: Only Playwright-related commands are permitted.
// Never add: env, cat, ls, pwd, which, echo, printenv, set, export, bash, sh, curl, wget
const ALLOWED_PREFIXES = ['npx playwright', 'npx @playwright'];

// ─── Env vars to STRIP from child processes (never leak secrets) ──────────────
const SENSITIVE_ENV_PATTERNS = [
    /KEY/i,
    /SECRET/i,
    /TOKEN/i,
    /PASSWORD/i,
    /PASS/i,
    /AUTH/i,
    /SUPABASE/i,
    /ENCRYPTION/i,
    /MASTER/i,
    /DATABASE_URL/i,
    /DB_/i,
    /API_KEY/i,
    /PRIVATE/i,
];

// ─── GUI-related env variables to KEEP for headful tools (Phase 2) ───────────
const GUI_ENV_VARS = [
    'DISPLAY',
    'XAUTHORITY',
    'WAYLAND_DISPLAY',
    'XDG_RUNTIME_DIR',
    'DBUS_SESSION_BUS_ADDRESS',
];

function sanitizeEnv(env) {
    const safe = {};
    for (const [key, val] of Object.entries(env)) {
        const isSensitive = SENSITIVE_ENV_PATTERNS.some((re) => re.test(key));
        if (!isSensitive) {
            safe[key] = val;
        }
    }
    // Always allow PATH and NODE-related vars for process resolution
    safe.PATH = env.PATH;
    safe.NODE = env.NODE;
    safe.HOME = env.HOME;

    // Explicitly keep GUI vars for headful browsers (codegen)
    for (const v of GUI_ENV_VARS) {
        if (env[v]) safe[v] = env[v];
    }

    safe.FORCE_COLOR = '0';
    return safe;
}

// ─── Codegen output parser ─────────────────────────────────────────────────────
// Matches lines like:  await page.click('selector');
//                      await page.getByLabel('Global').click();
//                      await page.goto('https://github.com');
const CODEGEN_REGEX =
    /await page\.(?:(click|fill|type|press|check|uncheck|selectOption|goto|dblclick|waitFor(?:Selector|URL))\s*\(\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]*)['"])?\s*\)|((?:getBy|locator)[^.]*)\.(click|fill|type|press|check|uncheck|selectOption|dblclick)\s*\(\s*(?:['"]([^'"]*)['"])?\s*\))/;

function parseCodegenLine(line) {
    const match = line.match(CODEGEN_REGEX);
    if (!match) return null;

    if (match[1]) {
        // Direct method: page.click('selector')
        return {
            actionType: match[1],
            selector: match[2],
            value: match[3] || null,
        };
    } else if (match[4]) {
        // Locator method: page.getByRole('link').click()
        return {
            actionType: match[5],
            selector: `${match[4]}`, // The locator string (e.g., "getByLabel('Global')")
            value: match[6] || null,
        };
    }
    return null;
}

// ─── Session Registry ─────────────────────────────────────────────────────────
class TerminalService {
    constructor() {
        /** @type {Map<string, import('child_process').ChildProcess>} */
        this.sessions = new Map();
    }

    /**
     * Validates that a command is in the allowed whitelist.
     * @param {string} cmd
     * @returns {{ allowed: boolean, reason?: string }}
     */
    isAllowed(cmd) {
        const trimmed = cmd.trim();
        const allowed = ALLOWED_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
        if (!allowed) {
            return {
                allowed: false,
                reason: `Command not allowed. Permitted prefixes: ${ALLOWED_PREFIXES.join(', ')}`,
            };
        }
        return { allowed: true };
    }

    /**
     * Spawns a new shell process for the given session.
     * @param {string} sessionId - Socket ID of the requesting client
     * @param {string} command - Full command string to execute
     */
    run(sessionId, command) {
        // Kill existing session if any
        this.kill(sessionId);

        const { allowed, reason } = this.isAllowed(command);
        if (!allowed) {
            emitTerminalOutput(sessionId, `⛔ ${reason}\n`, 'error');
            return;
        }

        emitTerminalOutput(sessionId, `$ ${command}\n`, 'command');

        const [cmd, ...args] = command.trim().split(/\s+/);
        let proc;
        try {
            proc = spawn(cmd, args, {
                shell: true,
                env: sanitizeEnv(process.env),
                cwd: process.cwd(),
            });
        } catch (err) {
            emitTerminalOutput(sessionId, `Error spawning process: ${err.message}\n`, 'error');
            return;
        }

        const isCodegen = command.includes('codegen');

        proc.stdout.on('data', (data) => {
            const text = data.toString();
            emitTerminalOutput(sessionId, text, 'stdout');

            // Parse codegen actions if this is a codegen session
            if (isCodegen) {
                for (const line of text.split('\n')) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    const action = parseCodegenLine(trimmed);
                    if (action) {
                        emitCodegenAction(sessionId, action);
                    }
                }
            }
        });

        proc.stderr.on('data', (data) => {
            emitTerminalOutput(sessionId, data.toString(), 'stderr');
        });

        proc.on('close', (code) => {
            emitTerminalOutput(sessionId, `\n[Process exited with code ${code}]\n`, 'system');
            this.sessions.delete(sessionId);
        });

        proc.on('error', (err) => {
            emitTerminalOutput(sessionId, `Process error: ${err.message}\n`, 'error');
            this.sessions.delete(sessionId);
        });

        this.sessions.set(sessionId, proc);
        console.log(`[TerminalService] Spawned process for session ${sessionId}: ${command}`);
    }

    /**
     * Sends raw text to a running process's stdin.
     * @param {string} sessionId
     * @param {string} input
     */
    sendInput(sessionId, input) {
        const proc = this.sessions.get(sessionId);
        if (proc && proc.stdin && !proc.stdin.destroyed) {
            proc.stdin.write(input);
        }
    }

    /**
     * Kills the process for a given session.
     * @param {string} sessionId
     */
    kill(sessionId) {
        const proc = this.sessions.get(sessionId);
        if (proc) {
            try {
                // 1. Try SIGINT (simulates Ctrl+C)
                proc.kill('SIGINT');

                // 2. Fallback to SIGKILL if it doesn't close within 2 seconds
                const killTimeout = setTimeout(() => {
                    if (this.sessions.has(sessionId)) {
                        console.log(
                            `[TerminalService] SIGINT timed out for ${sessionId}, forcing SIGKILL...`,
                        );
                        try {
                            proc.kill('SIGKILL');
                        } catch (e) {
                            /* ignore */
                        }
                    }
                }, 2000);

                // Clear timeout if process closes on its own
                proc.once('close', () => clearTimeout(killTimeout));
            } catch (err) {
                console.error(`[TerminalService] Error killing session ${sessionId}:`, err.message);
            }
            this.sessions.delete(sessionId);
            console.log(`[TerminalService] Requested kill for session: ${sessionId}`);
        }
    }

    /**
     * Kills all active sessions (e.g., on server shutdown).
     */
    killAll() {
        for (const [sessionId] of this.sessions) {
            this.kill(sessionId);
        }
    }
}

export const terminalService = new TerminalService();
