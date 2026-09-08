import JSZip from 'jszip';
import crypto from 'crypto';
import { Flow, Node, Edge, Canvas } from '../database/init.js';
import sequelize from '../database/index.js';

class ProjectImportService {
    /**
     * Import a project from a HAL zip package.
     *
     * Expected structure:
     * - manifest.json      (validate formatVersion)
     * - project.json       { name, description, activeFlowId, flowsMeta }
     * - flows/{id}.json    Full flows with nodes + edges
     * - components/{id}.json (optional; cross-project components to import)
     * - external-refs.json (optional)
     *
     * @param {Buffer} buffer - Raw ZIP file content
     * @param {{ targetProjectId?: string|null, targetName?: string|null, userId?: string|null }} [options]
     * @returns {Promise<{ project: object, createdFlows: Array, idMap: object, warnings: Array }>}
     */
    async importProject(buffer, options = {}) {
        const { targetProjectId = null, targetName = null, userId = null } = options;
        const warnings = [];

        const zip = await JSZip.loadAsync(buffer);

        // ---- 1. Validate manifest ----
        const manifestFile = zip.file('manifest.json');
        let manifest = null;
        if (manifestFile) {
            try {
                manifest = JSON.parse(await manifestFile.async('string'));
            } catch (e) {
                throw new Error('Invalid manifest.json in package');
            }
        }
        if (manifest && manifest.formatVersion && manifest.formatVersion > 1) {
            throw new Error(
                `Unsupported format version: ${manifest.formatVersion}. This version of Haltest supports up to v1.`,
            );
        }

        // ---- 2. Read project.json ----
        const projectFile = zip.file('project.json');
        if (!projectFile) {
            throw new Error('project.json not found in package');
        }

        let sourceProject;
        try {
            sourceProject = JSON.parse(await projectFile.async('string'));
        } catch (e) {
            throw new Error('Invalid project.json in package');
        }

        const projectName = targetName || sourceProject.name || 'Imported Project';

        // ---- 3. Read external-refs.json (optional) ----
        let externalRefs = { hasCrossProjectRefs: false, externalComponents: [] };
        const extFile = zip.file('external-refs.json');
        if (extFile) {
            try {
                externalRefs = JSON.parse(await extFile.async('string'));
            } catch (e) {
                warnings.push('Ignored invalid external-refs.json');
            }
        }

        // ---- 4. Begin transaction ----
        let transaction;
        try {
            transaction = await sequelize.transaction();

            // ---- 5. Create/Find the target project ----
            let project;
            if (targetProjectId) {
                const { Project } = await requireModel();
                project = await Project.findByPk(targetProjectId, { transaction });
                if (!project) {
                    await transaction.rollback();
                    throw new Error('Target project not found');
                }
                await project.update({ name: projectName }, { transaction });
            } else {
                // Find or reuse the user from the import options
                let effectiveUserId = userId;
                if (effectiveUserId) {
                    const { User } = await import('../database/init.js');
                    const user = await User.findByPk(effectiveUserId, { transaction });
                    if (!user) {
                        // Try by email
                        const email = 'local@haltest.dev';
                        const existing = await User.findOne({ where: { email }, transaction });
                        if (existing) effectiveUserId = existing.id;
                        else {
                            const created = await User.create(
                                { id: effectiveUserId, email },
                                { transaction },
                            );
                            effectiveUserId = created.id;
                        }
                    }
                }
                const { Project } = await requireModel();
                project = await Project.create(
                    {
                        name: projectName,
                        description: sourceProject.description || '',
                        userId: effectiveUserId || null,
                        collaborationEnabled: sourceProject.collaborationEnabled || false,
                    },
                    { transaction },
                );

                // Create a default canvas
                await Canvas.create(
                    {
                        name: 'Default Canvas',
                        description: 'Imported canvas',
                        projectId: project.id,
                    },
                    { transaction },
                );
            }

            // ---- 6. Build the ID mapping for all flows ----
            // Map: source flow id -> new flow id
            const flowIdMap = new Map();
            const sourceFlowIds = new Set();
            const sourceFlows = new Map(); // sourceFlowId -> parsed flow object

            // Read all flows from the zip
            const flowEntries = Object.values(zip.files).filter(
                (f) => f.name.startsWith('flows/') && f.name.endsWith('.json') && !f.dir,
            );

            // Read all external components
            const extEntries = Object.values(zip.files).filter(
                (f) => f.name.startsWith('components/') && f.name.endsWith('.json') && !f.dir,
            );

            for (const entry of flowEntries) {
                try {
                    const flow = JSON.parse(await entry.async('string'));
                    if (flow && flow.id) {
                        sourceFlows.set(flow.id, flow);
                        sourceFlowIds.add(flow.id);
                    }
                } catch (e) {
                    warnings.push(`Skipped invalid flow: ${entry.name}`);
                }
            }

            // External components (cross-project refs)
            const externalSourceIds = new Set();
            const allSourceFlows = new Map(sourceFlows);
            for (const entry of extEntries) {
                try {
                    const flow = JSON.parse(await entry.async('string'));
                    if (flow && flow.id) {
                        allSourceFlows.set(flow.id, flow);
                        externalSourceIds.add(flow.id);
                    }
                } catch (e) {
                    warnings.push(`Skipped invalid component: ${entry.name}`);
                }
            }

            // Generate a new ID for every known flow
            for (const [sourceId] of allSourceFlows) {
                flowIdMap.set(sourceId, `flow_${crypto.randomUUID()}`);
            }

            // ---- 7. Insert flows (external components first - i.e., dependencies) ----
            const createdFlows = new Map(); // sourceFlowId -> { newId, name, type }

            // Insert external components first (they are dependencies)
            for (const sourceId of externalSourceIds) {
                const flow = allSourceFlows.get(sourceId);
                const newFlowId = flowIdMap.get(sourceId);
                const created = await this._createFlowWithContent(
                    flow,
                    newFlowId,
                    project.id,
                    flowIdMap,
                    transaction,
                    true, // isExternal
                );
                createdFlows.set(sourceId, created);
            }

            // Insert all local flows next (in any order; references resolve after all are created)
            for (const [sourceId, flow] of sourceFlows) {
                const newFlowId = flowIdMap.get(sourceId);
                const created = await this._createFlowWithContent(
                    flow,
                    newFlowId,
                    project.id,
                    flowIdMap,
                    transaction,
                    false,
                );
                createdFlows.set(sourceId, created);
            }

            // ---- 8. Set activeFlowId ----
            const sourceActiveId = sourceProject.activeFlowId;
            let newActiveId = null;
            if (sourceActiveId && flowIdMap.has(sourceActiveId)) {
                newActiveId = flowIdMap.get(sourceActiveId);
            } else {
                // Default to first "main" flow or first available
                const firstMain = [...createdFlows.values()].find((f) => f.type === 'main');
                newActiveId = firstMain?.newId || [...createdFlows.values()][0]?.newId || null;
            }
            if (newActiveId) {
                await project.update({ activeFlowId: newActiveId }, { transaction });
            }

            await transaction.commit();

            // ---- 9. Build the response ----
            const idMap = Object.fromEntries(flowIdMap);
            const createdFlowArray = [...createdFlows.values()];

            return {
                project,
                createdFlows: createdFlowArray,
                idMap,
                warnings,
                stats: {
                    flowCount: createdFlowArray.length,
                    externalComponentCount: externalSourceIds.size,
                    crossProjectRefs: externalRefs.hasCrossProjectRefs,
                },
            };
        } catch (err) {
            if (transaction && !transaction.finished) await transaction.rollback();
            throw err;
        }
    }

    /**
     * Create a single flow record with its nodes and edges.
     * Remaps any internal component references (node.data.flowId / configuration.flowId).
     */
    async _createFlowWithContent(
        sourceFlow,
        newFlowId,
        projectId,
        flowIdMap,
        transaction,
        isExternal = false,
    ) {
        const flow = await Flow.create(
            {
                id: newFlowId,
                name: sourceFlow.name || (isExternal ? 'External Component' : 'Imported Flow'),
                projectId,
                canvasId: null,
                type: sourceFlow.type || 'main',
                parentId: null,
                viewport: sourceFlow.viewport || { x: 0, y: 0, zoom: 1 },
                hasInput: sourceFlow.hasInput || false,
                hasOutput: sourceFlow.hasOutput || false,
            },
            { transaction },
        );

        const sourceNodes = sourceFlow.nodes || [];
        const sourceEdges = sourceFlow.edges || [];

        // Remap node data references to new flow IDs
        const nodeIdMap = new Map();
        const nodeRecords = sourceNodes.map((n, idx) => {
            const oldNodeId = n.nodeId || n.id;
            const newNodeId = oldNodeId || `${n.type}_${idx}`;
            nodeIdMap.set(oldNodeId, newNodeId);
            return {
                nodeId: newNodeId,
                type: n.type,
                data: this._remapDeep(JSON.parse(JSON.stringify(n.data || {})), flowIdMap),
                position: n.position || { x: 0, y: 0 },
                flowId: flow.id,
                parentId: n.parentId || null,
                order: idx,
            };
        });

        if (nodeRecords.length > 0) {
            await Node.bulkCreate(nodeRecords, { transaction });
        }

        const edgeRecords = sourceEdges.map((e) => ({
            edgeId: e.edgeId || e.id || `${e.source}->${e.target}`,
            source: nodeIdMap.get(e.source) || e.source,
            target: nodeIdMap.get(e.target) || e.target,
            sourceHandle: e.sourceHandle === 'default' ? null : e.sourceHandle || null,
            targetHandle: e.targetHandle === 'default' ? null : e.targetHandle || null,
            type: e.type || 'custom',
            flowId: flow.id,
        }));

        if (edgeRecords.length > 0) {
            await Edge.bulkCreate(edgeRecords, { transaction });
        }

        return {
            sourceId: sourceFlow.id,
            newId: flow.id,
            name: flow.name,
            type: flow.type,
            nodeCount: nodeRecords.length,
        };
    }

    /**
     * Recursively remap any node.data.flowId / configuration.flowId that references
     * a source component id present in the flowIdMap (sourceId -> newId).
     */
    _remapDeep(data, flowIdMap) {
        if (!data || typeof data !== 'object') return data;
        if (Array.isArray(data)) return data.map((item) => this._remapDeep(item, flowIdMap));

        const out = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'flowId' && typeof value === 'string' && flowIdMap.has(value)) {
                out[key] = flowIdMap.get(value);
            } else if (key === 'ref' && typeof value === 'string' && flowIdMap.has(value)) {
                out[key] = flowIdMap.get(value);
            } else if (key === 'flowId' && typeof value === 'string' && value.startsWith('flow_')) {
                // This was already generated (from a previous import) - keep it
                out[key] = value;
            } else {
                out[key] = this._remapDeep(value, flowIdMap);
            }
        }
        return out;
    }
}

const projectImportService = new ProjectImportService();

export { projectImportService };

// Small helper to lazily require models
async function requireModel() {
    const mod = await import('../database/init.js');
    return mod;
}
