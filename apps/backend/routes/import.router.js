import { Router } from 'express';
import crypto from 'crypto';
import { importService } from '../services/importer/index.js';
import sequelize from '../database/index.js';
import { Flow, Node, Edge } from '../database/init.js';
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

            return res.json({ ...results, success: true });
        }
        // Si tenemos un directorio, escanearlo
        else if (directoryPath) {
            const result = importService.importDirectory(directoryPath);
            console.log('[DEBUG] Import directory result:', {
                total: result.total,
                success: result.success,
                failed: result.failed,
            });

            return res.json({ ...result, success: true });
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
                const destDir = path.dirname(destPath);
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
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
                fs.rmSync(tempDirPath, { recursive: true });
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

        res.json({ ...result, success: true });
    } catch (error) {
        console.error('[ERROR] Import directory with POM failed:', error);

        // Cleanup any temporary directory on error
        if (tempDirCreated) {
            try {
                fs.rmSync(tempDirPath, { recursive: true });
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

// Import a HalTest flow package (v3) that contains component dependencies.
// Persists each dependency as a new Flow, remaps flowId references, and
// returns the hydrated root flow so the frontend can render it.
router.post('/flow-package/:projectId', async (req, res) => {
    let transaction;
    try {
        const { projectId } = req.params;
        const flow = req.body?.flow;
        const components = req.body?.dependencies?.components || [];

        if (!flow || !Array.isArray(flow.nodes)) {
            return res
                .status(400)
                .json({ success: false, message: 'flow (with nodes) is required' });
        }

        transaction = await sequelize.transaction();

        // 1. Create new Flows for every component dependency with fresh IDs.
        //    Build a mapping from the exported (source) flow id -> new id.
        const idMap = new Map();
        const createdComponents = [];

        for (const comp of components) {
            const sourceId = comp.id;
            const newNodeIds = new Map(); // source component-node id -> new node id

            const newFlow = await Flow.create(
                {
                    name: comp.name || 'Imported Component',
                    projectId,
                    type: comp.type || 'component',
                    parentId: null,
                },
                { transaction },
            );

            idMap.set(sourceId, newFlow.id);

            // Create nodes for this component, remapping nested flowIds recursively
            const compNodes = Array.isArray(comp.nodes) ? comp.nodes : [];
            if (compNodes.length > 0) {
                const nodeRecords = compNodes.map((n, idx) => {
                    const oldNodeId = n.nodeId || n.id;
                    const newNodeId = oldNodeId ? oldNodeId : `${n.type}_${idx}`;
                    newNodeIds.set(oldNodeId, newNodeId);
                    return {
                        nodeId: newNodeId,
                        type: n.type,
                        data: remapDeep(n.data || {}, idMap),
                        position: n.position || { x: 0, y: 0 },
                        flowId: newFlow.id,
                        parentId: n.parentId || null,
                        order: idx,
                    };
                });

                await Node.bulkCreate(nodeRecords, { transaction });

                const hasInput = compNodes.some((n) => n.type === 'input');
                const hasOutput = compNodes.some((n) => n.type === 'output');
                await newFlow.update({ hasInput, hasOutput }, { transaction });
            }

            // Create edges for this component
            const compEdges = Array.isArray(comp.edges) ? comp.edges : [];
            if (compEdges.length > 0) {
                await Edge.bulkCreate(
                    compEdges.map((e) => ({
                        edgeId: e.edgeId || e.id || `${e.source}->${e.target}`,
                        source: newNodeIds.get(e.source) || e.source,
                        target: newNodeIds.get(e.target) || e.target,
                        sourceHandle: e.sourceHandle || null,
                        targetHandle: e.targetHandle || null,
                        flowId: newFlow.id,
                    })),
                    { transaction },
                );
            }

            createdComponents.push({
                sourceId,
                newId: newFlow.id,
                name: newFlow.name,
            });
        }

        // 2. Persist the main flow, remapping its component flowId references.
        const mainFlowId = `flow_${crypto.randomUUID()}`;
        const mainFlow = await Flow.create(
            {
                id: mainFlowId,
                name: flow.name || 'Imported Flow',
                projectId,
                type: flow.type || 'main',
                parentId: null,
                viewport: flow.viewport || { x: 0, y: 0, zoom: 1 },
            },
            { transaction },
        );

        const mainNodeIdMap = new Map();
        const mainNodes = (flow.nodes || []).map((n, idx) => {
            const oldNodeId = n.nodeId || n.id;
            const newNodeId = oldNodeId || `${n.type}_main_${idx}`;
            mainNodeIdMap.set(oldNodeId, newNodeId);
            return {
                nodeId: newNodeId,
                type: n.type,
                data: remapDeep(n.data || {}, idMap),
                position: n.position || { x: 0, y: 0 },
                flowId: mainFlow.id,
                parentId: n.parentId || null,
                order: idx,
            };
        });

        if (mainNodes.length > 0) {
            await Node.bulkCreate(mainNodes, { transaction });

            const hasInput = mainNodes.some((n) => n.type === 'input');
            const hasOutput = mainNodes.some((n) => n.type === 'output');
            await mainFlow.update({ hasInput, hasOutput }, { transaction });
        }

        const mainEdges = Array.isArray(flow.edges) ? flow.edges : [];
        if (mainEdges.length > 0) {
            await Edge.bulkCreate(
                mainEdges.map((e) => ({
                    edgeId: e.edgeId || e.id || `${e.source}->${e.target}`,
                    source: mainNodeIdMap.get(e.source) || e.source,
                    target: mainNodeIdMap.get(e.target) || e.target,
                    sourceHandle: e.sourceHandle || null,
                    targetHandle: e.targetHandle || null,
                    flowId: mainFlow.id,
                })),
                { transaction },
            );
        }

        await transaction.commit();

        // 3. Return the hydrated main flow + created component mapping
        const hydrated = await Flow.findByPk(mainFlow.id, {
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        res.status(201).json({
            success: true,
            flow: mapFlowPackage(hydrated),
            idMap: Object.fromEntries(idMap),
            components: createdComponents,
        });
    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('[ImportRouter] flow-package failed:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Recursively remap any node.data.flowId / configuration.flowId that references
// a source component id present in the idMap (sourceId -> newId).
function remapDeep(data, idMap) {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map((item) => remapDeep(item, idMap));

    const out = {};
    for (const [key, value] of Object.entries(data)) {
        if (key === 'flowId' && typeof value === 'string' && idMap.has(value)) {
            out[key] = idMap.get(value);
        } else if (key === 'ref' && typeof value === 'string' && idMap.has(value)) {
            out[key] = idMap.get(value);
        } else {
            out[key] = remapDeep(value, idMap);
        }
    }
    return out;
}

function mapFlowPackage(flow) {
    if (!flow) return null;
    const f = flow.toJSON();
    return {
        id: f.id,
        name: f.name,
        type: f.type,
        parentId: f.parentId,
        viewport: f.viewport,
        hasInput: f.hasInput,
        hasOutput: f.hasOutput,
        nodeCount: (f.nodes || []).length,
        nodes: (f.nodes || []).map((n) => ({
            id: n.nodeId,
            type: n.type,
            data: n.data,
            position: n.position,
        })),
        edges: (f.edges || []).map((e) => ({
            id: e.edgeId,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
        })),
    };
}

export default router;
