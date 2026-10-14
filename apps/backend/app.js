import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { createServer } from 'http';
import { storageCleanupService } from './services/StorageCleanupService.js';
import { browserService } from './services/browser.service.js';
import { doctorService } from './services/DoctorService.js';
import { STORAGE_DIR, PUBLIC_DIR } from './config/paths.js';
import { migrateStorageIfNecessary } from './config/migrateStorage.js';

// Migrate legacy storage data before touching DB
migrateStorageIfNecessary();

import { init as initSocket } from './socket.js';
import { yjsServer } from './services/collaboration/YjsServer.js';

// Express Modules and Middlewares
import { apiLimiter, helmetMiddleware } from './middlewares/security.js';
import { developmentLogger, productionLogger, createRequestLogger } from './middlewares/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import i18n, { middleware as i18nMiddleware } from './config/i18n.js';
import { authenticated } from './middlewares/auth.middleware.js';
import cookieParser from 'cookie-parser';
import { createToll } from 'tollai';
import { CLIENT_SOURCE } from 'tollai/client';
import { tollaiMiddleware as tollaiExpressMiddleware } from 'tollai/express';

// Swagger Documentation
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/swaggerConfig.js';

// Route Modules
import apiRouter from './routes/api.router.js';
import mockRouter from './routes/mock.router.js';
import projectRouter from './routes/project.router.js';
import aiRouter from './routes/ai.routes.js';
import keysRouter from './routes/keys.routes.js';
import historyRouter from './routes/history.router.js';
import storageRouter from './routes/storage.router.js';
import safetyGateRouter from './routes/safetyGate.router.js';

// Database
import { initDb } from './database/init.js';
import { bootstrapBuiltinPlugins } from './core/pluginBootstrap.js';
import { pluginManager } from './core/PluginManager.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 2001;

initSocket(server);

// Initialize Yjs collaboration server (runs on /collab/:flowId via HTTP upgrade)
if (process.env.COLLAB_ENABLED !== 'false') {
    yjsServer.init(server, {
        storagePath: path.join(STORAGE_DIR, 'yjs-docs'),
    });
}

// --- 1. SECURITY & CONFIG MIDDLEWARES ---
app.set('trust proxy', 1);
app.use(helmetMiddleware);
app.use(cookieParser());
app.use(i18nMiddleware.handle(i18n));

// Create TollAI instance
// mode 'api' tolls only the paths matched by `protect`; the /tollai/* protocol
// endpoints (challenge, verify, dwell, client.js, status) bypass policy and are
// always reachable.
const toll = createToll({
    mode: 'api',
    protect: ['/', '/blog/**', '/docs/**'],
    exclude: ['/api/**', '/storage/**', '/app/**'],
    clientSource: CLIENT_SOURCE,
    secret: process.env.TOLLAI_SECRET,
    powDifficulty: Number(process.env.TOLLAI_POW_DIFFICULTY) || 12,
    powTTL: 30000,
    sessionTTL: 900000,
    cookieName: 'tollai_session',
    secure: process.env.NODE_ENV === 'production',
    minDwellMs: Number(process.env.TOLLAI_MIN_DWELL_MS) || 1500,
    minResponseTime: 1500,
    challengeTTL: 60000,
    rateWindowMs: 10000,
    rateLimit: 30,
    maxSessions: 10000,
    clientPath: '/tollai/client.js',
});

const getAllowedOrigins = () => {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins) {
        return envOrigins.split(',');
    }
    return [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:2001',
        'https://haltest.com',
        'https://hal-test-backend.onrender.com',
    ];
};

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const origins = getAllowedOrigins();
    if (origins.some((allowed) => origin.startsWith(allowed.trim()))) return true;
    return isLocalOrPrivateOrigin(origin);
};

/**
 * Validates if the origin is a local host, local domain, or private LAN IP address.
 */
const isLocalOrPrivateOrigin = (origin) => {
    if (!origin) return true;

    // Check localhost, 127.0.0.1, ::1
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('::1')) {
        return true;
    }

    // Regex for private network IPs:
    // 10.x.x.x, 192.168.x.x, 172.16.x.x to 172.31.x.x
    const privateIpRegex =
        /^https?:\/\/(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/;
    if (privateIpRegex.test(origin)) {
        return true;
    }

    // Regex for mDNS local domains (e.g. mymac.local)
    const localDomainRegex = /^https?:\/\/[a-zA-Z0-9-]+\.local(?::\d+)?$/;
    if (localDomainRegex.test(origin)) {
        return true;
    }

    return false;
};

// --- STATIC STORAGE (served before the global CORS guard) ---
// Traces/videos stored here must be fetchable by the hosted Playwright trace
// viewer (https://trace.playwright.dev), so storage gets its own CORS policy
// instead of the strict API one. Add more viewers via TRACE_VIEWER_ORIGINS.
const traceViewerOrigins = (process.env.TRACE_VIEWER_ORIGINS || 'https://trace.playwright.dev')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const storageCors = cors({
    origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin) || traceViewerOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Not allowed: pass through without CORS headers (never throw — the
        // browser enforces the block, the file itself stays servable).
        callback(null, false);
    },
    methods: ['GET', 'HEAD', 'OPTIONS'],
});

const staticOptions = {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
};
app.use('/storage', storageCors, express.static(STORAGE_DIR, staticOptions));
app.use('/api/storage', storageCors, express.static(STORAGE_DIR, staticOptions));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            if (isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                console.warn(`[CORS Blocked] Origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiter
app.use('/api', apiLimiter);

// Request Logger (Structured)
app.use(createRequestLogger);

// --- 3. SWAGGER DOCUMENTATION ---
app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'HaltTest API Documentation',
    }),
);

// --- 4. LOGGERS ---
if (process.env.NODE_ENV === 'production') {
    app.use(productionLogger());
} else {
    app.use(developmentLogger());
}

// --- 5. ROUTE MOUNTING ---

// Load release metadata at startup
let releaseMetadata = null;
try {
    const metadataPath = path.join(PUBLIC_DIR, 'RELEASE_METADATA.json');
    if (fs.existsSync(metadataPath)) {
        releaseMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }
} catch (e) {
    console.warn('[INIT] Could not load release metadata:', e.message);
}

// Public Status Route
app.get('/api/status', (req, res) => {
    const collabEnabled = process.env.COLLAB_ENABLED !== 'false';
    const version = releaseMetadata?.version || '1.0.0-NO-MCP';
    const git = releaseMetadata?.git || {};
    const buildId = releaseMetadata?.buildId || 'unknown';

    res.json({
        status: 'ok',
        message: 'HaltTest API is up and running 🚀',
        version,
        git: {
            commit: git.commit,
            shortCommit: git.shortCommit,
            branch: git.branch,
            tag: git.tag,
            isDirty: git.isDirty,
            commitDate: git.commitDate,
        },
        buildId,
        mode: process.env.HALTEST_MODE || 'cloud',
        auth_enabled: process.env.AUTH_ENABLED !== 'false',
        collaboration_enabled: collabEnabled,
        collaboration_stats: collabEnabled ? yjsServer.getStats() : null,
        timestamp: new Date().toISOString(),
        releaseTimestamp: releaseMetadata?.timestamp,
    });
});

// Public Browser/OS Compatibility Doctor (detects missing or incompatible Playwright/browsers)
app.get('/api/doctor', (req, res) => {
    const report = doctorService.check();
    res.status(200).json(report);
});

// Prometheus Metrics Endpoint
import { metricsCollector } from './services/metrics.js';
app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metricsCollector.formatPrometheus());
});

// Health Check Endpoint (more detailed)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        },
        version: releaseMetadata?.version || 'unknown',
        commit: releaseMetadata?.git?.shortCommit || 'unknown',
    });
});

// Protected API Routes
// Apply Auth to all subsequent /api routes
app.use('/api', authenticated);

// Mount routers
app.use('/api', apiRouter);
app.use('/api', mockRouter);
app.use('/api/history', historyRouter);
app.use('/api', projectRouter);
app.use('/api/ai', aiRouter);
app.use('/api/keys', keysRouter);
app.use('/api/storage', storageRouter);
app.use('/api/safety-gate', safetyGateRouter);

// --- STATIC FILES SERVING (Production) ---

// 1. Serve Frontend App - PUBLIC (authenticated users bypass TollAI anyway)
app.use(
    '/app',
    express.static(path.join(PUBLIC_DIR, 'app'), {
        index: false,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
        },
    }),
);
app.get('/app', (req, res) => {
    res.redirect('/app/');
});

// Use a regex for the app SPA fallback - PUBLIC
app.get(/\/app($|\/.*)/, (req, res, next) => {
    if (req.path.startsWith('/app/api')) return next();

    // Skip if it looks like a static asset file (to avoid serving index.html as CSS/JS)
    const assetExtensions = [
        '.js',
        '.css',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.ico',
        '.woff',
        '.woff2',
    ];
    if (assetExtensions.some((ext) => req.path.toLowerCase().endsWith(ext))) {
        return next();
    }

    const indexPath = path.join(PUBLIC_DIR, 'app', 'index.html');

    if (!fs.existsSync(indexPath)) {
        console.error(`[SPA App Error] index.html not found at: ${indexPath}`);
        return res.status(404).json({
            status: 'error',
            message: `Frontend application entry point not found. Expected at: ${indexPath}`,
            hint: 'Ensure that the frontend is correctly built and included in the public/app directory.',
        });
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error(
                `[SPA App Error] Failed to send index.html from ${indexPath}: ${err.message}`,
            );
            next(err);
        }
    });
});

// 2. Serve Landing Page - PROTECTED by TollAI (INVISIBLE on /, standard on /blog, /docs)
const tollaiProtected = tollaiExpressMiddleware(toll);

// Protocol endpoints (/tollai/*) must be handled by tollai middleware globally
app.use('/tollai', tollaiProtected);

// Invisible TollAI protection for root "/" — no UI, no shell
async function invisibleTollaiProtection(req, res, next) {
    const cookieHeader = req.headers.cookie || '';
    const hasSession = cookieHeader.split('; ').some((c) => c.startsWith('tollai_session='));

    if (hasSession) {
        return next(); // Already verified, serve landing page
    }

    // No session: serve invisible HTML that does PoW silently via tollai protocol
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Haltest</title>
<style>body{margin:0;min-height:100vh;background:#0d1117}</style></head>
<body>
<div id="root"></div>
<script>
(function(){'use strict';
var SESSION_COOKIE='tollai_session';
function rotr(x,n){return((x>>>n)|(x<<(32-n)))>>>0;}
function sha256(str){var TWO32=4294967296,pow=Math.pow;var K=new Uint32Array(64),H=new Uint32Array(8),comp={},pc=0,cand,i;
for(cand=2;pc<64;cand++){if(!comp[cand]){for(i=0;i<313;i+=cand)comp[i]=cand;H[pc]=(pow(cand,.5)*TWO32)|0;K[pc++]=(pow(cand,1/3)*TWO32)|0;}}
var bytes=[],c;for(i=0;i<str.length;i++){c=str.charCodeAt(i);if(c>255)return null;bytes.push(c);}
var bitLen=bytes.length*8;bytes.push(0x80);while(bytes.length%64!==56)bytes.push(0);
bytes.push(0,0,0,0,(bitLen>>>24)&0xff,(bitLen>>>16)&0xff,(bitLen>>>8)&0xff,bitLen&0xff);
var w=new Uint32Array(64),t,off,p,s0,s1;
for(off=0;off<bytes.length;off+=64){for(t=0;t<16;t++){p=off+4*t;w[t]=((bytes[p]<<24)|(bytes[p+1]<<16)|(bytes[p+2]<<8)|bytes[p+3])>>>0;}
for(t=16;t<64;t++){s0=rotr(w[t-15],7)^rotr(w[t-15],18)^(w[t-15]>>>3);s1=rotr(w[t-2],17)^rotr(w[t-2],19)^(w[t-2]>>>10);w[t]=(w[t-16]+s0+w[t-7]+s1)>>>0;}
var a=H[0],b=H[1],cc=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];var S1,ch,t1,S0,maj,t2;
for(t=0;t<64;t++){S1=rotr(e,6)^rotr(e,11)^rotr(e,25);ch=((e&f)^(~e&g))>>>0;t1=(h+S1+ch+K[t]+w[t])>>>0;
S0=rotr(a,2)^rotr(a,13)^rotr(a,22);maj=((a&b)^(a&cc)^(b&cc))>>>0;t2=(S0+maj)>>>0;
h=g;g=f;f=e;e=(d+t1)>>>0;d=cc;cc=b;b=a;a=(t1+t2)>>>0;}
H[0]=(H[0]+a)>>>0;H[1]=(H[1]+b)>>>0;H[2]=(H[2]+cc)>>>0;H[3]=(H[3]+d)>>>0;
H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;}
var out='';for(i=0;i<8;i++)out+=H[i].toString(16).padStart(8,'0');return out;}
function leadingZeroBits(hex){var bits=0;for(var i=0;i<hex.length&&bits<64;i++){var nib=parseInt(hex[i],16);if(nib===0){bits+=4;continue;}bits+=Math.clz32(nib)-28;break;}return bits;}
function solvePow(challenge,difficulty){for(var nonce=0;nonce<4e9;nonce++){if((nonce&0x3fff)===0){}var d=sha256(challenge+':'+nonce);if(d&&leadingZeroBits(d)>=difficulty)return nonce;}return null;}
function postJSON(url,body){return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)}).then(function(r){return r.json();});}
function establish(){return fetch('/tollai/challenge').then(function(r){return r.json();}).then(function(ch){if(!ch.challenge)throw new Error('no challenge');var nonce=solvePow(ch.challenge,ch.difficulty);if(nonce===null)throw new Error('pow exhausted');return postJSON('/tollai/verify',{challenge:ch.challenge,nonce:String(nonce),difficulty:ch.difficulty}).then(function(res){if(!res.verified)throw new Error(res.code||'verify failed');});}).catch(function(){throw new Error('tollai failed');});}
function hasSession(){return document.cookie.split('; ').some(function(c){return c.startsWith(SESSION_COOKIE+'=');});}
establish().then(function(){location.reload();}).catch(function(){location.reload();});
})();
</script>
</body></html>`);
}

// Protect root "/" with INVISIBLE TollAI
app.get(
    '/',
    invisibleTollaiProtection,
    express.static(path.join(PUBLIC_DIR, 'web')),
    (req, res, next) => {
        res.sendFile(path.join(PUBLIC_DIR, 'web', 'index.html'), (err) => {
            if (err) next();
        });
    },
);

// Protect /blog/** and /docs/** with STANDARD TollAI (visible shell)
app.use('/blog', tollaiProtected, express.static(path.join(PUBLIC_DIR, 'web')));
app.use('/docs', tollaiProtected, express.static(path.join(PUBLIC_DIR, 'web')));

// Landing page static assets (unprotected)
app.use(express.static(path.join(PUBLIC_DIR, 'web')));

// Catch-all for SPA/Web (unprotected routes) - Regex for Express 5 compatibility
app.get(/^((?!\/(api|storage|app|tollai|blog|docs)).)*$/, (req, res, next) => {
    // Skip if it looks like a static asset file (to avoid serving index.html as CSS/JS)
    const assetExtensions = [
        '.js',
        '.css',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.ico',
        '.woff',
        '.woff2',
        '.webm',
    ];
    if (assetExtensions.some((ext) => req.path.toLowerCase().endsWith(ext))) {
        return res.status(404).end();
    }

    res.sendFile(path.join(PUBLIC_DIR, 'web', 'index.html'), (err) => {
        if (err) next();
    });
});

// Insert routes before error handling
// --- 6. ERROR HANDLING ---
app.use((req, res) => {
    const t = typeof req.t === 'function' ? req.t : (key) => key;
    res.status(404).json({
        status: 'error',
        message: t('common.route_not_found', { method: req.method, path: req.path }),
    });
});
app.use(errorHandler);

import { abortAllPools } from './services/WorkerPool.js';
import { getIO } from './socket.js';
import { executionLock } from './services/collaboration/ExecutionLock.js';

// --- 7. SERVER START ---
let serverInstance;
const startServer = async () => {
    await initDb();

    // Register built-in plugin handlers into NodeRegistry
    await bootstrapBuiltinPlugins();

    // Discover and load third-party plugins from storage/plugins/
    try {
        await pluginManager.loadAllPlugins();
    } catch (error) {
        console.error(`[PluginManager] Failed to load third-party plugins: ${error.message}`);
    }

    // Load any active execution locks persisted before the last restart
    await executionLock.loadFromDB();

    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
        console.log(`[INIT] Created storage directory: ${STORAGE_DIR}`);
    }

    await storageCleanupService.run();
    await doctorService.runStartupCheck();
    if (process.env.NODE_ENV !== 'test') {
        serverInstance = server.listen(PORT, '0.0.0.0', () => {
            const baseUrl = `http://localhost:${PORT}`;
            console.log(`\n🚀 =================================================`);
            console.log(`   HaltTest Server is Up & Running!`);
            console.log(`   =================================================`);
            console.log(`   🌍 Landing Page:  ${baseUrl}/`);
            console.log(`   🖥️  Application:   ${baseUrl}/app/ (Frontend production build)`);
            console.log(`   -------------------------------------------------`);
            console.log(`   🚧 Dev App:       http://localhost:5173/ (Hot Reload)`);
            console.log(`   🚧 Dev Landing:   http://localhost:3000/ (Hot Reload)`);
            console.log(`   -------------------------------------------------`);
            console.log(`   📚 API Docs:      ${baseUrl}/api/docs`);
            console.log(`   🛠️  Environment:   ${process.env.NODE_ENV || 'development'}`);
            console.log(`   -------------------------------------------------`);
            console.log(`   🐱 GitHub Repo:   https://github.com/andresguc1/hal-test`);
            console.log(`   ❤️  Thanks for supporting the project!`);
            console.log(`   =================================================\n`);
        });
    }
};

// --- GRACEFUL SHUTDOWN ---
let shuttingDown = false;
const gracefulShutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n[INIT] 🛑 Received termination signal. Starting graceful shutdown...');

    // 1. Terminate any running Worker Pools (CPU Leak fix)
    try {
        abortAllPools();
    } catch (e) {
        console.error('[INIT] Error aborting pools:', e);
    }

    // 2. Disconnect all sockets so Express can close
    try {
        const io = getIO();
        if (io) io.close();
    } catch (e) {
        // socket not initialized
    }

    // 2.5 Drain every browser session (Fase 4): reap dead processes, close
    // registered sessions and clear run/context registries so no orphaned
    // browser processes survive a restart.
    try {
        console.log('[INIT] Draining browser sessions...');
        await browserService.drain();
    } catch (e) {
        console.error('[INIT] Error draining browser sessions:', e);
    }

    // 3. Shutdown collaboration server
    try {
        await executionLock.releaseAll();
        await yjsServer.destroy();
    } catch (e) {
        console.error('[INIT] Error shutting down collaboration:', e);
    }

    // 3. Close the Express Server
    if (serverInstance) {
        serverInstance.close(() => {
            console.log('[INIT] ❌ Express server closed.');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }

    // Force exit after 3 seconds if not closed gracefully
    setTimeout(() => {
        console.error('[INIT] ⚠️ Forced shutdown due to timeout');
        process.exit(1);
    }, 3000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Nodemon restart signal

// Manual reload for schema update
startServer();

export default app;
// Trigger reload for schema update
