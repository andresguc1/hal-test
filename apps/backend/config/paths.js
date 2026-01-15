import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the backend application (apps/backend)
const BACKEND_ROOT = path.resolve(__dirname, '..');

export const STORAGE_DIR = path.join(BACKEND_ROOT, 'storage');
export const STORAGE_RUNS_DIR = path.join(STORAGE_DIR, 'runs');
export const PUBLIC_DIR = path.join(BACKEND_ROOT, 'public');

export default {
    BACKEND_ROOT,
    STORAGE_DIR,
    STORAGE_RUNS_DIR,
    PUBLIC_DIR,
};
