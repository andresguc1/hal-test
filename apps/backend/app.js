// 🚀 HaltTest Backend Server (Main Orchestrator)
// ==========================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { createServer } from 'http';
import { init as initSocket } from './socket.js';
import path from 'path';
import { storageCleanupService } from './services/StorageCleanupService.js';
import { STORAGE_DIR, PUBLIC_DIR } from './config/paths.js';

// Express Modules and Middlewares
import { apiLimiter, helmetMiddleware } from './middlewares/security.js';
import { developmentLogger, productionLogger } from './middlewares/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import i18n, { middleware as i18nMiddleware } from './config/i18n.js';

// Route Modules
import apiRouter from './routes/api.router.js';
import mockRouter from './routes/mock.router.js';
import projectRouter from './routes/project.router.js';
import aiRouter from './routes/ai.routes.js'; // AI Mock Routes
import keysRouter from './routes/keys.routes.js'; // Secure Key Management

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 2001;
initSocket(server);

// --- 1. SECURITY MIDDLEWARES ---
// --- 1. SECURITY & CONFIG MIDDLEWARES ---
app.set('trust proxy', 1); // Required for Render/Proxies to work with Rate Limiters
app.use(helmetMiddleware);
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
);

app.use('/api', apiLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve storage folder statically for Flight Recorder screenshots
// Screenshots are stored at: storage/runs/{runId}/{filename}.png
// Accessible via: http://localhost:2001/storage/runs/{runId}/{filename}.png
// Accessible via: http://localhost:2001/storage/runs/{runId}/{filename}.png
app.use('/storage', express.static(STORAGE_DIR));

// Integration of i18next middleware for localized responses
app.use(i18nMiddleware.handle(i18n));

// --- 3. SWAGGER DOCUMENTATION ---
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/swaggerConfig.js';

// Mount Swagger/OpenAPI documentation
// Documentation will be accessible at http://localhost:PORT/api/docs
app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        // Explorer allows searching and filtering endpoints
        explorer: true,
        // Additional options for the UI
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

// Mount the router for real MCP actions (launch_browser, open_url, etc.)
app.use('/api', apiRouter);

// Mount the Mocks and Node configuration router
app.use('/api', mockRouter);

// History & Evidence Router
import historyRouter from './routes/history.router.js';
app.use('/api/history', historyRouter);

// Project and Flow management routes
// Project and Flow management routes
app.use('/api', projectRouter);

// AI & Copilot routes (Mocks)
app.use('/api/ai', aiRouter);

// Key Vault Routes
app.use('/api/keys', keysRouter);

// --- STATIC FILES SERVING (Production) ---
// Using PUBLIC_DIR from paths.js

// 1. Serve Frontend App at /app
app.use('/app', express.static(path.join(PUBLIC_DIR, 'app')));

// Explicitly handle /app to redirect to /app/ (trailing slash) to ensure relative assets work
app.get('/app', (req, res) => {
    res.redirect('/app/');
});

// SPA Fallback for any /app/* request not caught by static middleware
app.get(/\/app\/?(?!api).*/, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'app', 'index.html'));
});

// 2. Serve Landing Page at / (Root)
app.use('/', express.static(path.join(PUBLIC_DIR, 'web')));
app.get(/.*/, (req, res, next) => {
    // If it's an API call that wasn't handled, let it pass to 404 handler
    if (req.path.startsWith('/api') || req.path.startsWith('/storage')) {
        return next();
    }
    // Otherwise serve Landing Page (SPA support)
    res.sendFile(path.join(PUBLIC_DIR, 'web', 'index.html'), (err) => {
        if (err) next(); // If no index.html (e.g. dev mode), pass to 404
    });
});

// General status/health check route
/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Checks the health status of the HaltTest service.
 *     tags: [General]
 *     responses:
 *       200:
 *         description: The service is active and functioning correctly.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: HaltTest API is up and running 🚀
 *                 version:
 *                   type: string
 *                   example: 1.0.0-NO-MCP
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-12-15T15:13:46.000Z"
 */
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'HaltTest API is up and running 🚀',
        version: '1.0.0-NO-MCP',
        timestamp: new Date().toISOString(),
    });
});

// --- 6. ERROR HANDLING ---

// Handle Route Not Found (404)
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: req.t('common.route_not_found', { method: req.method, path: req.path }),
    });
});

// Centralized Error Handler (500, Validation, etc.)
app.use(errorHandler);

// --- 7. SERVER START ---
import { initDb } from './database/init.js';

const startServer = async () => {
    await initDb();

    // Ensure storage directories exist
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
        console.log(`[INIT] Created storage directory: ${STORAGE_DIR}`);
    }

    await storageCleanupService.run(); // Auto-cleanup old runs and /tmp
    server.listen(PORT, '0.0.0.0', () => {
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
};

startServer();

export default app;
