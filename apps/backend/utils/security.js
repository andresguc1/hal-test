import path from 'path';
import { STORAGE_DIR } from '../config/paths.js';

/**
 * Validates if a path is safe (within the allowed storage directory)
 * @param {string} targetPath - The path to validate
 * @param {string} baseDir - The allowed base directory (defaults to STORAGE_DIR)
 * @returns {boolean} - True if the path is safe
 */
export const isSafePath = (targetPath, baseDir = STORAGE_DIR) => {
    if (!targetPath) return false;

    const resolvedPath = path.resolve(targetPath);
    const resolvedBase = path.resolve(baseDir);

    return resolvedPath.startsWith(resolvedBase);
};
