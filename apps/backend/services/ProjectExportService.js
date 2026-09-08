import JSZip from 'jszip';
import { Flow, Node, Edge, Canvas } from '../database/init.js';

const SECRET_PATTERNS = [/pass/i, /key/i, /token/i, /secret/i, /auth/i, /pwd/i];

class ProjectExportService {
    /**
     * Export an entire project as a self-contained ZIP package.
     *
     * Format:
     * - manifest.json      { formatVersion, haltestVersion, exportedAt, projectId, projectName, flowCount, componentCount, hasCrossProjectRefs }
     * - project.json       { id, name, description, activeFlowId, collaborationEnabled, flowsMeta: [] }
     * - flows/{id}.json    Each flow (main/component/loop) with nodes + edges
     *
     * All internal component references (node.data.configuration.flowId / node.data.flowId)
     * remain as-is since the entire project is included.
     *
     * @param {string} projectId
     * @param {{ sanitize: boolean }} [options]
     * @returns {Promise<{ zip: JSZip, buffer: Buffer, fileName: string, stats: object }>}
     */
    async exportProject(projectId, options = {}) {
        const sanitize = options.sanitize !== false;

        const project = await this._loadProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const zip = new JSZip();

        // ---- 1. Collect all flows in this project ----
        const flows = await Flow.findAll({
            where: { projectId },
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
            order: [
                ['order', 'ASC'],
                ['createdAt', 'ASC'],
            ],
        });

        const flowById = new Map();
        for (const f of flows) {
            flowById.set(f.id, f.toJSON());
        }

        // ---- 2. Detect cross-project references ----
        const crossProjectRefs = [];
        const localFlowIds = new Set(flowById.keys());

        // Check every node in every flow for component references to flows NOT in this project
        for (const flow of flows) {
            const flowJson = flow.toJSON();
            for (const node of flowJson.nodes || []) {
                const refFlowId = this._extractFlowRef(node);
                if (refFlowId && !localFlowIds.has(refFlowId)) {
                    // Cross-project reference: fetch the external flow and include as a standalone component
                    if (!crossProjectRefs.some((c) => c.sourceFlowId === refFlowId)) {
                        crossProjectRefs.push({
                            sourceFlowId: refFlowId,
                            referencedByFlowId: flow.id,
                            nodeId: node.nodeId,
                        });
                    }
                }
            }
        }

        // ---- 3. Collect external components (cross-project refs) ----
        const externalFlowById = new Map();
        for (const ref of crossProjectRefs) {
            if (!externalFlowById.has(ref.sourceFlowId)) {
                const external = await Flow.findOne({
                    where: { id: ref.sourceFlowId },
                    include: [
                        { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                        { model: Edge, as: 'edges' },
                    ],
                });
                if (external) {
                    externalFlowById.set(external.id, external.toJSON());
                }
            }
        }

        // ---- 4. Build the flows directory ----
        const flowFiles = [];
        for (const [flowId, flowJson] of flowById) {
            const sanitized = sanitize ? JSON.parse(JSON.stringify(flowJson)) : flowJson;
            if (sanitize) {
                this._sanitizeAllNodes(sanitized.nodes);
            }
            const fileEntry = `${flowId}.json`;
            zip.file(`flows/${fileEntry}`, JSON.stringify(sanitized, null, 2));
            flowFiles.push({ id: flowId, name: flowJson.name, type: flowJson.type });
        }

        // ---- 5. Build external components directory ----
        const externalComponents = [];
        for (const [extId, extJson] of externalFlowById) {
            const sanitized = sanitize ? JSON.parse(JSON.stringify(extJson)) : extJson;
            if (sanitize) {
                this._sanitizeAllNodes(sanitized.nodes);
            }
            zip.file(`components/${extId}.json`, JSON.stringify(sanitized, null, 2));
            externalComponents.push({
                sourceFlowId: extId,
                name: extJson.name,
                type: extJson.type || 'component',
            });
        }

        // ---- 6. project.json ----
        const projectMeta = {
            id: project.id,
            name: project.name,
            description: project.description || '',
            activeFlowId: project.activeFlowId || null,
            collaborationEnabled: project.collaborationEnabled || false,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            flowsMeta: flowFiles.map((f) => ({
                ...f,
                nodeCount: flowById.get(f.id)?.nodes?.length || 0,
                edgeCount: flowById.get(f.id)?.edges?.length || 0,
            })),
        };
        zip.file('project.json', JSON.stringify(projectMeta, null, 2));

        // ---- 7. Cross-project refs manifest ----
        zip.file(
            'external-refs.json',
            JSON.stringify(
                {
                    hasCrossProjectRefs: externalComponents.length > 0,
                    externalComponents,
                    references: crossProjectRefs,
                },
                null,
                2,
            ),
        );

        // ---- 8. manifest.json ----
        const manifest = {
            formatVersion: 1,
            haltedVersion: '1.0.0',
            exportedAt: new Date().toISOString(),
            projectId: project.id,
            projectName: project.name,
            flowCount: flowFiles.length,
            componentCount: externalComponents.length,
            hasCrossProjectRefs: externalComponents.length > 0,
            sanitized: sanitize,
            extensions: ['project.json', 'manifest.json', 'external-refs.json'],
        };
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));

        const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
        const safeName = project.name.replace(/[^a-z0-9_-]+/gi, '_').toLowerCase() || 'project';

        return {
            zip,
            buffer,
            fileName: `${safeName}-project.hal.zip`,
            stats: {
                projectId: project.id,
                flowCount: flowFiles.length,
                componentCount: externalComponents.length,
                crossProjectRefs: externalComponents.length > 0,
            },
        };
    }

    /**
     * Load a project with its canvases (top-level, no flows nested in canvases needed for export)
     */
    async _loadProject(projectId) {
        const { Project } = await requireModel();
        return await Project.findByPk(projectId);
    }

    /**
     * Extract a flow reference (component/loop) from a node's data.
     */
    _extractFlowRef(node) {
        if (!node.data) return null;
        if (typeof node.data.flowId === 'string') return node.data.flowId;
        if (node.data.configuration && typeof node.data.configuration.flowId === 'string') {
            return node.data.configuration.flowId;
        }
        return null;
    }

    /**
     * Sanitize secrets across all nodes in a flow object.
     */
    _sanitizeAllNodes(nodes) {
        if (!Array.isArray(nodes)) return;
        for (const node of nodes) {
            this._sanitizeNode(node);
        }
    }

    /**
     * Recursively strip values from keys that look like secrets.
     */
    _sanitizeNode(node) {
        if (!node || !node.data) return;
        const visited = new Set();
        const walk = (obj) => {
            if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
            visited.add(obj);
            if (Array.isArray(obj)) {
                for (const item of obj) walk(item);
                return;
            }
            for (const [key, value] of Object.entries(obj)) {
                if (SECRET_PATTERNS.some((p) => p.test(key))) {
                    if (typeof value === 'string') obj[key] = '';
                    else if (Array.isArray(value)) obj[key] = [];
                    else if (value && typeof value === 'object') obj[key] = {};
                } else {
                    walk(value);
                }
            }
        };
        walk(node.data);
    }
}

const projectExportService = new ProjectExportService();

export { projectExportService };

// Small helper to lazily require models (avoid import cycle at module top)
async function requireModel() {
    const mod = await import('../database/init.js');
    return mod;
}
