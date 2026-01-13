// 🚀 HaltTest Backend Server (Main Orchestrator)
// ==========================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { init as initSocket } from './socket.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express Modules and Middlewares
import { apiLimiter, helmetMiddleware } from './middlewares/security.js';
import { developmentLogger, productionLogger } from './middlewares/logger.js';
import errorHandler from './middlewares/errorHandler.js';
import i18n, { middleware as i18nMiddleware } from './config/i18n.js';

// Route Modules
import apiRouter from './routes/api.router.js';
import mockRouter from './routes/mock.router.js';
import projectRouter from './routes/project.router.js';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve storage folder statically for Flight Recorder screenshots
// Screenshots are stored at: storage/runs/{runId}/{filename}.png
// Accessible via: http://localhost:2001/storage/runs/{runId}/{filename}.png
// Accessible via: http://localhost:2001/storage/runs/{runId}/{filename}.png
app.use('/storage', express.static(path.join(__dirname, 'storage')));

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

// Project and Flow management routes
// Project and Flow management routes
app.use('/api', projectRouter);

// --- STATIC FILES SERVING (Production) ---
const publicPath = path.join(__dirname, 'public');

// 1. Serve Frontend App at /app
app.use('/app', express.static(path.join(publicPath, 'app')));

// Explicitly handle /app to redirect to /app/ (trailing slash) to ensure relative assets work
app.get('/app', (req, res) => {
    res.redirect('/app/');
});

// SPA Fallback for any /app/* request not caught by static middleware
app.get(/\/app\/?(?!api).*/, (req, res) => {
    res.sendFile(path.join(publicPath, 'app', 'index.html'));
});

// 2. Serve Landing Page at / (Root)
app.use('/', express.static(path.join(publicPath, 'web')));
app.get(/.*/, (req, res, next) => {
    // If it's an API call that wasn't handled, let it pass to 404 handler
    if (req.path.startsWith('/api') || req.path.startsWith('/storage')) {
        return next();
    }
    // Otherwise serve Landing Page (SPA support)
    res.sendFile(path.join(publicPath, 'web', 'index.html'), (err) => {
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
