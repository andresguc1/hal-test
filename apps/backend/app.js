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
import { STORAGE_DIR, PUBLIC_DIR } from './config/paths.js';
import { init as initSocket } from './socket.js';

// Express Modules and Middlewares
import { apiLimiter, helmetMiddleware } from './middlewares/security.js';
import { developmentLogger, productionLogger } from './middlewares/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import i18n, { middleware as i18nMiddleware } from './config/i18n.js';
import { authenticated } from './middlewares/auth.middleware.js';

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

// Database
import { initDb } from './database/init.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 2001;

initSocket(server);

// --- 1. SECURITY & CONFIG MIDDLEWARES ---
app.set('trust proxy', 1);
app.use(helmetMiddleware);
app.use(i18nMiddleware.handle(i18n));

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:2001',
          'https://haltest.com',
          'https://hal-test-backend.onrender.com',
      ];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or same-origin)
            if (!origin) return callback(null, true);

            // Check if origin is allowed or if it's the same origin
            const isAllowed = allowedOrigins.some((allowed) => origin.startsWith(allowed));

            if (isAllowed || process.env.NODE_ENV !== 'production') {
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

// --- STATIC STORAGE (Moved up for precedence) ---
const staticOptions = {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
};
app.use('/storage', express.static(STORAGE_DIR, staticOptions));
app.use('/api/storage', express.static(STORAGE_DIR, staticOptions));

// Rate Limiter
app.use('/api', apiLimiter);

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

// Public Status Route
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'HaltTest API is up and running 🚀',
        version: '1.0.0-NO-MCP',
        mode: process.env.HALTEST_MODE || 'cloud',
        auth_enabled: process.env.AUTH_ENABLED !== 'false',
        timestamp: new Date().toISOString(),
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

// --- STATIC FILES SERVING (Production) ---

// 1. Serve Frontend App
app.use('/app', express.static(path.join(PUBLIC_DIR, 'app')));
app.get('/app', (req, res) => {
    res.redirect('/app/');
});

// Use a regex for the app SPA fallback
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

    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error(
                `[SPA App Error] Failed to send index.html from ${indexPath}: ${err.message}`,
            );
            next(err);
        }
    });
});

// 2. Serve Landing Page
app.use('/', express.static(path.join(PUBLIC_DIR, 'web')));

// Catch-all for SPA/Web using a Regex object for Express 5 compatibility
app.get(/^((?!\/(api|storage|app)).)*$/, (req, res, next) => {
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

// --- 7. SERVER START ---
let serverInstance;
const startServer = async () => {
    await initDb();

    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
        console.log(`[INIT] Created storage directory: ${STORAGE_DIR}`);
    }

    await storageCleanupService.run();
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
const gracefulShutdown = () => {
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
