import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the backend application (apps/backend)
// Use path.join for better cross-platform compatibility
const BACKEND_ROOT = path.resolve(__dirname, '..');

export const STORAGE_DIR = path.resolve(BACKEND_ROOT, 'storage');
export const STORAGE_RUNS_DIR = path.resolve(STORAGE_DIR, 'runs');
export const PUBLIC_DIR = path.resolve(BACKEND_ROOT, 'public');

export default {
    BACKEND_ROOT,
    STORAGE_DIR,
    STORAGE_RUNS_DIR,
    PUBLIC_DIR,
};
