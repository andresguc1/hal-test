import { Flow, Node, Edge } from '../database/init.js';
import { projectStorageService } from './ProjectStorageService.js';

/**
 * FlowSerializer
 * Bidirectional serialization between SQLite (Sequelize) and on-disk JSON (flow.json v2).
 * Disk is the source-of-truth; SQLite serves as a read-cache for runtime performance.
 */
class FlowSerializer {
    /**
     * Serializes a flow from SQLite to the flow.json v2 format.
     * @param {string} flowId - The flow ID in SQLite
     * @param {string} projectId - The project ID
     * @returns {Promise<object>} - Flow JSON v2 object
     */
    async serializeFromDB(flowId, projectId) {
        const whereClause = { id: flowId };
        if (projectId) whereClause.projectId = projectId;

        const flow = await Flow.findOne({
            where: whereClause,
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        if (!flow) {
            throw new Error(`Flow ${flowId} not found in database`);
        }

        return this._mapFlowToV2(flow);
    }

    /**
     * Deserializes a flow.json v2 object and writes it to SQLite.
     * Creates or updates the flow, nodes, and edges.
     * @param {object} flowJson - Flow JSON v2 object
     * @param {string} projectId - The project ID
     * @returns {Promise<object>} - The saved Sequelize Flow instance
     */
    async deserializeToDB(flowJson, projectId) {
        const transaction = await Flow.sequelize.transaction();

        try {
            const flowData = {
                id: flowJson.id,
                name: flowJson.name,
                projectId,
                viewport: flowJson.viewport || { x: 0, y: 0, zoom: 1 },
                type: 'main',
                order: 0,
            };

            const [flow] = await Flow.upsert(flowData, {
                transaction,
                returning: true,
            });

            await Node.destroy({ where: { flowId: flow.id }, transaction });
            await Edge.destroy({ where: { flowId: flow.id }, transaction });

            if (flowJson.nodes && flowJson.nodes.length > 0) {
                const nodeRecords = flowJson.nodes.map((n, idx) => ({
                    nodeId: n.id,
                    type: n.type,
                    data: n.data || {},
                    position: n.position || { x: 0, y: 0 },
                    flowId: flow.id,
                    parentId: n.parentId || null,
                    order: idx,
                }));

                await Node.bulkCreate(nodeRecords, { transaction });

                const hasInput = flowJson.nodes.some((n) => n.type === 'input');
                const hasOutput = flowJson.nodes.some((n) => n.type === 'output');
                await flow.update({ hasInput, hasOutput }, { transaction });
            }

            if (flowJson.edges && flowJson.edges.length > 0) {
                const edgeRecords = flowJson.edges.map((e) => ({
                    edgeId: e.id,
                    source: e.source,
                    target: e.target,
                    sourceHandle: e.sourceHandle || 'default',
                    targetHandle: e.targetHandle || 'default',
                    flowId: flow.id,
                }));

                await Edge.bulkCreate(edgeRecords, { transaction });
            }

            await transaction.commit();
            return flow;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Saves a flow from SQLite to disk as flow.json.
     * @param {string} flowId - The flow ID
     * @param {string} projectId - The project ID
     * @returns {Promise<object>} - The saved JSON object
     */
    async saveToDisk(flowId, projectId) {
        const flowJson = await this.serializeFromDB(flowId, projectId);

        const relativePath = `flows/${flowId}.json`;
        await projectStorageService.writeFile(projectId, relativePath, flowJson);
        await projectStorageService.addFileRef(projectId, 'flows', relativePath);

        return flowJson;
    }

    /**
     * Loads a flow from disk and writes it to SQLite.
     * @param {string} flowId - The flow ID
     * @param {string} projectId - The project ID
     * @returns {Promise<object>} - The deserialized Sequelize Flow
     */
    async loadFromDisk(flowId, projectId) {
        const relativePath = `flows/${flowId}.json`;
        const flowJson = await projectStorageService.readFile(projectId, relativePath);
        return this.deserializeToDB(flowJson, projectId);
    }

    /**
     * Exports a flow as a standalone JSON file (for sharing/backup).
     * @param {string} flowId - The flow ID
     * @param {string} projectId - The project ID
     * @returns {Promise<object>} - { success, data, filename }
     */
    async exportJson(flowId, projectId) {
        const flowJson = await this.serializeFromDB(flowId, projectId);
        return {
            success: true,
            data: JSON.stringify(flowJson, null, 2),
            filename: `${flowJson.name || flowId}.json`,
            contentType: 'application/json',
        };
    }

    /**
     * Imports a flow from a standalone JSON file into SQLite and disk.
     * @param {object} flowJson - The flow JSON to import
     * @param {string} projectId - The target project ID
     * @returns {Promise<object>} - The deserialized Sequelize Flow
     */
    async importJson(flowJson, projectId) {
        const flow = await this.deserializeToDB(flowJson, projectId);

        const relativePath = `flows/${flow.id}.json`;
        await projectStorageService.writeFile(projectId, relativePath, flowJson);
        await projectStorageService.addFileRef(projectId, 'flows', relativePath);

        return flow;
    }

    /**
     * Syncs all flows for a project between SQLite and disk.
     * SQLite is authoritative for any flows not yet on disk.
     * Disk is authoritative for any flows that exist on disk.
     */
    async syncProject(projectId) {
        const dbFlows = await Flow.findAll({
            where: { projectId },
            include: [
                { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                { model: Edge, as: 'edges' },
            ],
        });

        const diskFlowFiles = projectStorageService.listFiles(projectId, 'flows');
        const diskFlowIds = new Set(diskFlowFiles.map((f) => f.replace('.json', '')));

        const results = { synced: 0, created: 0, conflicts: 0 };

        for (const dbFlow of dbFlows) {
            const flowV2 = this._mapFlowToV2(dbFlow);
            const relativePath = `flows/${dbFlow.id}.json`;

            if (diskFlowIds.has(dbFlow.id)) {
                const diskFlow = await projectStorageService.readFile(projectId, relativePath);

                if (this._needsSync(dbFlow, diskFlow)) {
                    await projectStorageService.writeFile(projectId, relativePath, flowV2);
                    results.synced++;
                }
                diskFlowIds.delete(dbFlow.id);
            } else {
                await projectStorageService.writeFile(projectId, relativePath, flowV2);
                await projectStorageService.addFileRef(projectId, 'flows', relativePath);
                results.created++;
            }
        }

        for (const remainingDiskId of diskFlowIds) {
            results.conflicts++;
            console.warn(
                `[FlowSerializer] Flow ${remainingDiskId} exists on disk but not in SQLite`,
            );
        }

        return results;
    }

    // ── Private Helpers ───────────────────────────────────────

    /**
     * Maps a Sequelize Flow instance to flow.json v2 format.
     */
    _mapFlowToV2(flow) {
        const flowObj = flow.toJSON ? flow.toJSON() : flow;

        const nodes = (flowObj.nodes || []).map((n) => ({
            id: n.nodeId || n.id,
            type: n.type,
            version: '1.0.0',
            position: n.position || { x: 0, y: 0 },
            data: n.data || {},
            parentId: n.parentId || undefined,
        }));

        const edges = (flowObj.edges || []).map((e) => ({
            id: e.edgeId || `edge_${e.source}_${e.target}`,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || 'default',
            targetHandle: e.targetHandle || 'default',
        }));

        return {
            $schema: 'https://haltest.dev/schemas/flow-v2.json',
            id: flowObj.id,
            name: flowObj.name,
            version: '2.0.0',
            viewport: flowObj.viewport || { x: 0, y: 0, zoom: 1 },
            nodes,
            edges,
            variables: {},
            metadata: {
                pluginVersion: '2.0.0',
                createdAt: flowObj.createdAt,
                updatedAt: flowObj.updatedAt,
            },
        };
    }

    /**
     * Determines if a DB flow needs to be synced to disk.
     * Uses updatedAt timestamps as a fast check.
     */
    _needsSync(dbFlow, diskFlow) {
        const dbUpdated = dbFlow.updatedAt ? new Date(dbFlow.updatedAt).getTime() : 0;
        const diskUpdated = diskFlow?.metadata?.updatedAt
            ? new Date(diskFlow.metadata.updatedAt).getTime()
            : 0;

        return dbUpdated > diskUpdated;
    }
}

export const flowSerializer = new FlowSerializer();
export default flowSerializer;
