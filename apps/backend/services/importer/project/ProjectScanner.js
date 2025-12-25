import fs from 'fs';
import path from 'path';
import { FrameworkDetector } from '../detectors/FrameworkDetector.js';

/**
 * Escanea directorios recursivamente para encontrar archivos de prueba soportados.
 */
export class ProjectScanner {
    constructor() {
        this.ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
    }

    /**
     * Escanea un directorio y devuelve una lista de archivos soportados.
     * @param {string} dirPath - Ruta absoluta del directorio.
     * @param {boolean} includeAll - Si true, incluye todos los archivos JS/TS, no solo tests.
     * @returns {Array<{path: string, framework: string}>} Lista de archivos encontrados.
     */
    scan(dirPath, includeAll = false) {
        let results = [];

        if (!fs.existsSync(dirPath)) {
            return results;
        }

        const stats = fs.statSync(dirPath);
        if (!stats.isDirectory()) {
            // Si es un archivo, verificar si es soportado
            const framework = this.detectFramework(dirPath);
            if (framework) {
                results.push({ path: dirPath, framework });
            }
            return results;
        }

        const files = fs.readdirSync(dirPath);

        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const fileStats = fs.statSync(fullPath);

            if (fileStats.isDirectory()) {
                if (!this.ignoreDirs.includes(file)) {
                    results = results.concat(this.scan(fullPath, includeAll));
                }
            } else {
                if (includeAll) {
                    // Include all JS/TS files for indexing
                    const ext = path.extname(fullPath).toLowerCase();
                    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
                        results.push({ path: fullPath, framework: 'javascript' });
                    }
                } else {
                    // Only include test files
                    const framework = this.detectFramework(fullPath);
                    if (framework) {
                        results.push({ path: fullPath, framework });
                    }
                }
            }
        }

        return results;
    }

    detectFramework(filePath) {
        // Optimización: Verificar extensión primero
        const ext = path.extname(filePath).toLowerCase();
        if (!['.js', '.ts', '.py', '.java', '.cs', '.groovy', '.txt'].includes(ext)) {
            return null;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const framework = FrameworkDetector.detect(content);
            return framework !== 'unknown' ? framework : null;
        } catch (error) {
            console.warn(`Error reading file ${filePath}:`, error);
            return null;
        }
    }
}
