// 🚀 HaltTest Backend Server (Main Orchestrator)
// ==========================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { init as initSocket } from './socket.js';

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
app.use(helmetMiddleware);
app.use(apiLimiter);

// --- 2. FORMAT MIDDLEWARES ---
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api', projectRouter);

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
    server.listen(PORT, () => {
        console.log(`\n🚀 ================================`);
        console.log(`   HaltTest Backend Server`);
        console.log(`   Running on: http://localhost:${PORT}`);
        console.log(`   Documentation: http://localhost:${PORT}/api/docs`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✅ Server started.`);
        console.log(`================================\n`);
    });
};

startServer();

export default app;
