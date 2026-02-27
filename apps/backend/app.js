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
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }),
);

app.use('/api', apiLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve storage folder statically
app.use('/storage', express.static(STORAGE_DIR));

// Localization
app.use(i18nMiddleware.handle(i18n));

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
app.get(/\/app\/?(?!api).*/, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'app', 'index.html'));
});

// 2. Serve Landing Page
app.use('/', express.static(path.join(PUBLIC_DIR, 'web')));
app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/storage')) {
        return next();
    }
    res.sendFile(path.join(PUBLIC_DIR, 'web', 'index.html'), (err) => {
        if (err) next();
    });
});

// --- 6. ERROR HANDLING ---
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: req.t('common.route_not_found', { method: req.method, path: req.path }),
    });
});
app.use(errorHandler);

// --- 7. SERVER START ---
const startServer = async () => {
    await initDb();

    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
        console.log(`[INIT] Created storage directory: ${STORAGE_DIR}`);
    }

    await storageCleanupService.run();
    if (process.env.NODE_ENV !== 'test') {
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
    }
};

startServer();

export default app;
