import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the backend application (apps/backend or dist/backend)
const BACKEND_ROOT = __dirname.endsWith('config') ? path.resolve(__dirname, '..') : __dirname;

// Secure storage directory (outside npx cache)
const homeDir = os.homedir();
export const STORAGE_DIR = process.env.HALTEST_HOME
    ? path.resolve(process.env.HALTEST_HOME)
    : path.join(homeDir, '.haltest');

export const STORAGE_RUNS_DIR = path.resolve(STORAGE_DIR, 'runs');
export const PUBLIC_DIR = path.resolve(BACKEND_ROOT, 'public');

export default {
    BACKEND_ROOT,
    STORAGE_DIR,
    STORAGE_RUNS_DIR,
    PUBLIC_DIR,
};
