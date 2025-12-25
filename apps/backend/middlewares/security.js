// middlewares/security.js

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// -------------------------------------------------------------
// 1. HELMET: Configuración de Cabeceras de Seguridad
// -------------------------------------------------------------
/**
 * Middleware de Helmet para configurar cabeceras HTTP de seguridad.
 * Ayuda a prevenir ataques como XSS, inyección de scripts, y clics secuestrados.
 * * NOTA: La Content Security Policy (CSP) es compleja. Para Hal-Test, la mantenemos
 * en una configuración base, pero podría necesitar ajustes.
 */
export const helmetMiddleware = helmet({
    // Deshabilitar el encabezado 'X-Powered-By'
    hidePoweredBy: true,

    // Configuración básica de CSP para permitir recursos de origen propio y Playwright
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Necesario si usas scripts inline
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            // Conectar a Playwright o a otros servicios
            connectSrc: ["'self'", 'ws:', 'wss:'],
        },
    },
    // Configuración HSTS (HTTP Strict Transport Security)
    strictTransportSecurity: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true,
    },
});

// -------------------------------------------------------------
// 2. RATE LIMITING: Limitación de Solicitudes
// -------------------------------------------------------------
/**
 * Middleware de Rate Limiting (Limitación de Tasa) para prevenir ataques de fuerza bruta
 * y de denegación de servicio (DoS) por uso excesivo.
 * * Se configura para 100 solicitudes por ventana de 15 minutos por IP.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita cada IP a 100 solicitudes por 'window' (ventana de 15 min)
    standardHeaders: true, // Incluye cabeceras `RateLimit-*`
    legacyHeaders: false, // Deshabilita cabeceras `X-RateLimit-*`
    message: async (req, res) => {
        // Mensaje de respuesta cuando se excede el límite
        res.status(429).json({
            success: false,
            error: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo después de 15 minutos.',
        });
    },
});

// -------------------------------------------------------------
// EXPORTACIONES CONDICIONALES
// -------------------------------------------------------------

// Si Hal-Test tuviera una ruta de ejecución pesada (ej: /api/run-test)
export const heavyTaskLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutos
    max: 10, // Solo 10 ejecuciones por hora
    message: async (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Límite de ejecución de pruebas excedido. Espere una hora.',
        });
    },
});
