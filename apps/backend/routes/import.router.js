import { Router } from 'express';
import { importService } from '../services/importer/index.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure multer to handle file uploads
const upload = multer({
    dest: '/tmp/hal_test_imports',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// Ensure the temporary directory exists
if (!fs.existsSync('/tmp/hal_test_imports')) {
    fs.mkdirSync('/tmp/hal_test_imports', { recursive: true });
}

// Health check for the import router
router.get('/status', (req, res) => {
    res.json({
        success: true,
        message: 'Import router is working',
        endpoints: ['/analyze', '/convert', '/import-directory', '/directory', '/directory-pom'],
    });
});

// Endpoint to analyze the file and detect framework
router.post('/analyze', (req, res) => {
    try {
        const { content } = req.body;

        console.log('[DEBUG] /analyze called');
        console.log('[DEBUG] Content type:', typeof content);
        if (typeof content === 'string') {
            console.log('[DEBUG] Content length:', content.length);
            console.log('[DEBUG] Content start:', content.substring(0, 50));
        } else {
            console.log('[DEBUG] Content is NOT a string:', content);
        }

        if (!content) {
            return res
                .status(400)
                .json({ success: false, message: req.t('actions.import_router.content_required') });
        }

        const result = importService.analyze(content);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint to convert the file
router.post('/convert', (req, res) => {
    try {
        const { content, framework } = req.body;
        console.log('[DEBUG] /convert called');
        console.log('[DEBUG] Framework requested:', framework);

        if (!content) {
            return res
                .status(400)
                .json({ success: false, message: req.t('actions.import_router.content_required') });
        }

        const result = importService.convert(content, framework);
        console.log('[DEBUG] Convert result success:', result.success);
        console.log('[DEBUG] Flows count:', result.flows?.length);

        if (result.success) {
            res.json({ success: true, data: result.flows, flows: result.flows }); // Send flows in root too just in case
        } else {
            res.status(400).json({ success: false, message: result.error });
        }
    } catch (error) {
        console.error('[ERROR] Convert failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Endpoint to import a full directory
router.post('/import-directory', (req, res) => {
    try {
        const { path } = req.body;
        console.log('[DEBUG] /import-directory called');
        console.log('[DEBUG] Directory path:', path);

        if (!path) {
            return res.status(400).json({
                success: false,
                message: req.t('actions.import_router.directory_path_required'),
            });
        }

        const result = importService.importDirectory(path);
        console.log('[DEBUG] Import directory result:', {
            total: result.total,
            success: result.success,
            failed: result.failed,
        });

        res.json({ success: true, ...result });
    } catch (error) {
        console.error('[ERROR] Import directory failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Alias for frontend compatibility - Supports FormData and JSON
router.post('/directory', upload.any(), async (req, res) => {
    try {
        // Debug completo del request
        console.log('[DEBUG] /directory called (alias)');
        console.log('[DEBUG] Content-Type:', req.headers['content-type']);
        console.log('[DEBUG] Request body:', req.body);
        console.log('[DEBUG] Request files:', req.files);

        let directoryPath;
        let filesToProcess = [];
        let isFileUpload = false;

        // Caso 1: FormData con archivos subidos
        if (req.files && req.files.length > 0) {
            console.log('[DEBUG] Processing uploaded files');
            isFileUpload = true;

            // Process each uploaded file
            for (const file of req.files) {
                console.log('[DEBUG] File:', file.originalname, 'saved to:', file.path);
                filesToProcess.push({
                    path: file.path,
                    originalName: file.originalname,
                    content: fs.readFileSync(file.path, 'utf-8'),
                });
            }
        }
        // Caso 2: JSON con path de directorio
        else if (req.body?.path || req.body?.directoryPath) {
            directoryPath = req.body.path || req.body.directoryPath;
            console.log('[DEBUG] Using directory path from body:', directoryPath);
        }
        // Caso 3: Query parameter
        else if (req.query?.path) {
            directoryPath = req.query.path;
            console.log('[DEBUG] Using directory path from query:', directoryPath);
        }

        // Si tenemos archivos subidos, procesarlos individualmente
        if (isFileUpload && filesToProcess.length > 0) {
            const results = {
                total: filesToProcess.length,
                success: 0,
                failed: 0,
                flows: [],
                errors: [],
            };

            for (const file of filesToProcess) {
                try {
                    const conversion = importService.convert(file.content);
                    if (conversion.success) {
                        results.success++;
                        results.flows.push(
                            ...conversion.flows.map((f) => ({
                                ...f,
                                meta: { ...f.meta, filePath: file.originalName },
                            })),
                        );
                    } else {
                        results.failed++;
                        results.errors.push({ file: file.originalName, error: conversion.error });
                    }
                } catch (err) {
                    results.failed++;
                    results.errors.push({ file: file.originalName, error: err.message });
                }

                // Clean up temporary file
                try {
                    fs.unlinkSync(file.path);
                } catch (cleanupErr) {
                    console.warn('[WARN] Could not delete temp file:', file.path);
                }
            }

            console.log('[DEBUG] File upload result:', {
                total: results.total,
                success: results.success,
                failed: results.failed,
            });

            return res.json({ success: true, ...results });
        }
        // Si tenemos un directorio, escanearlo
        else if (directoryPath) {
            const result = importService.importDirectory(directoryPath);
            console.log('[DEBUG] Import directory result:', {
                total: result.total,
                success: result.success,
                failed: result.failed,
            });

            return res.json({ success: true, ...result });
        }
        // No hay datos válidos
        else {
            return res.status(400).json({
                success: false,
                message: req.t('actions.import_router.files_or_directory_required'),
                receivedBody: req.body,
                receivedFiles: req.files?.length || 0,
                receivedQuery: req.query,
            });
        }
    } catch (error) {
        console.error('[ERROR] Import directory failed:', error);

        // Clean up temporary files in case of error
        if (req.files) {
            req.files.forEach((file) => {
                try {
                    fs.unlinkSync(file.path);
                } catch (cleanupErr) {
                    console.warn('[WARN] Could not delete temp file:', file.path);
                }
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

// Endpoint to import a directory with POM (Page Object Model) support
router.post('/directory-pom', upload.any(), async (req, res) => {
    // Variables scoped for the whole endpoint
    let directoryPath;
    let tempDirCreated = false;
    let tempDirPath = '';
    try {
        // Debug completo del request
        console.log('[DEBUG] /directory-pom called');
        console.log('[DEBUG] Content-Type:', req.headers['content-type']);
        console.log('[DEBUG] Request body:', req.body);
        console.log('[DEBUG] Request files:', req.files);

        // Caso 1: Files uploaded (FormData)
        if (req.files && req.files.length > 0) {
            // Crear un directorio temporal único
            const timestamp = Date.now();
            tempDirPath = path.join('/tmp/hal_test_imports', `pom_${timestamp}`);
            fs.mkdirSync(tempDirPath, { recursive: true });
            tempDirCreated = true;
            console.log('[DEBUG] Created temporary POM directory:', tempDirPath);

            // Move each file to the temporary directory
            for (const file of req.files) {
                const destPath = path.join(tempDirPath, file.originalname);
                fs.renameSync(file.path, destPath);
                console.log('[DEBUG] Moved uploaded file to:', destPath);
            }
            directoryPath = tempDirPath;
        }
        // Caso 2: JSON con path de directorio
        else if (req.body?.path || req.body?.directoryPath) {
            directoryPath = req.body.path || req.body.directoryPath;
            console.log('[DEBUG] Using directory path from body:', directoryPath);
        }
        // Caso 3: Query parameter
        else if (req.query?.path) {
            directoryPath = req.query.path;
            console.log('[DEBUG] Using directory path from query:', directoryPath);
        }

        if (!directoryPath) {
            return res.status(400).json({
                success: false,
                message: req.t('actions.import_router.directory_path_required_pom'),
                receivedBody: req.body,
                receivedFiles: req.files?.length || 0,
                receivedQuery: req.query,
                note: 'POM import expects a directory path or uploaded files representing a project',
            });
        }

        console.log('[DEBUG] Starting POM import for:', directoryPath);
        const result = importService.importDirectoryWithPOM(directoryPath);

        console.log('[DEBUG] Import directory with POM result:', {
            total: result.total,
            success: result.success,
            failed: result.failed,
            indexed: result.indexed,
        });

        // Cleanup temporary directory if we created one
        if (tempDirCreated) {
            try {
                fs.rmdirSync(tempDirPath, { recursive: true });
                console.log('[DEBUG] Cleaned up temporary POM directory:', tempDirPath);
            } catch (cleanupErr) {
                console.warn(
                    '[WARN] Could not delete temporary POM directory:',
                    tempDirPath,
                    cleanupErr,
                );
            }
        }

        // Also clean any leftover uploaded files (should be none after rename)
        if (req.files) {
            req.files.forEach((file) => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (e) {
                    console.warn('[WARN] Could not delete leftover file:', file.path);
                }
            });
        }

        res.json({ success: true, ...result });
    } catch (error) {
        console.error('[ERROR] Import directory with POM failed:', error);

        // Cleanup any temporary directory on error
        if (tempDirCreated) {
            try {
                fs.rmdirSync(tempDirPath, { recursive: true });
                console.log('[DEBUG] Cleaned up temporary POM directory after error:', tempDirPath);
            } catch (e) {
                console.warn(
                    '[WARN] Could not delete temporary POM directory after error:',
                    tempDirPath,
                );
            }
        }

        // Cleanup uploaded files on error
        if (req.files) {
            req.files.forEach((file) => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (e) {
                    console.warn('[WARN] Could not delete file on error cleanup:', file.path);
                }
            });
        }

        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

export default router;
