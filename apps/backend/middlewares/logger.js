// ../middlewares/logger.js (Con soporte ESM)

import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// -----------------------------------------------------------------
// Helpers para ESM (__dirname, __filename)
// -----------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------
// Configuración de Logs
// -----------------------------------------------------------------
const logDirectory = path.join(__dirname, '../logs');

// Asegúrate de que el directorio de logs exista
try {
    fs.mkdirSync(logDirectory, { recursive: true });
} catch (error) {
    // Manejo de error si no se pudo crear el directorio
    if (error.code !== 'EEXIST') {
        // Ignorar si el error es que ya existe
        console.error('Error al crear el directorio de logs:', error.message);
    }
}

// Crea un stream de escritura para el archivo de logs de producción
const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'),
    { flags: 'a' }, // 'a' significa 'append'
);

// Formato de logging 'combined' para producción
const combinedLogger = morgan('combined', { stream: accessLogStream });

// -----------------------------------------------------------------
// Exportación de Loggers (Usando 'export')
// -----------------------------------------------------------------

/**
 * Middleware para logging en ambiente de desarrollo.
 * @returns {Function} Middleware de Morgan (formato 'dev').
 */
export const developmentLogger = () => morgan('dev');

/**
 * Middleware para logging en ambiente de producción.
 * @returns {Function} Middleware de Morgan (formato 'combined').
 */
export const productionLogger = () => combinedLogger;
