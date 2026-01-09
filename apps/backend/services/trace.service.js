// import * as fsp from 'fs/promises'; // Removed per user request
import * as path from 'path';

const STORAGE_DIR = path.resolve('./storages');
const TRACE_BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000;

class TraceService {
    constructor() {
        this.buffer = [];
        this.lastFlush = Date.now();
        // Iniciar el intervalo de flush automático
        this.interval = setInterval(() => this.flush(), FLUSH_INTERVAL);

        // Asegurar flush al salir
        if (typeof process !== 'undefined') {
            process.on('beforeExit', () => {
                this.flush().catch(() => {});
            });
        }
    }

    /**
     * Agrega una traza al buffer.
     * @param {Object} data - Datos de la traza.
     */
    add(data) {
        this.buffer.push({
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
        });

        const now = Date.now();
        if (this.buffer.length >= TRACE_BATCH_SIZE || now - this.lastFlush >= FLUSH_INTERVAL) {
            this.flush();
        }
    }

    /**
     * Escribe las trazas pendientes en disco.
     */
    async flush() {
        // Debug file writing disabled per user request
        this.buffer = [];
        this.lastFlush = Date.now();
    }
}

export const traceService = new TraceService();
