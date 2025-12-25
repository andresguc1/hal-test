import * as fsp from 'fs/promises';
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
        if (this.buffer.length === 0) return;

        const traces = [...this.buffer];
        this.buffer = [];
        this.lastFlush = Date.now();

        // Usar setImmediate para no bloquear el event loop principal
        setImmediate(async () => {
            try {
                await fsp.mkdir(STORAGE_DIR, { recursive: true });
                await Promise.allSettled(
                    traces.map((trace, idx) => {
                        const filename = `trace_${trace.action || 'unknown'}_${Date.now()}_${idx}.json`;
                        return fsp.writeFile(
                            path.join(STORAGE_DIR, filename),
                            JSON.stringify(trace, null, 2),
                            'utf8',
                        );
                    }),
                );
            } catch (err) {
                console.error('[TraceService] Error flushing traces:', err.message);
            }
        });
    }
}

export const traceService = new TraceService();
