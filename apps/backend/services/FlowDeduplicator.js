/**
 * FlowDeduplicator — Centralized flow uniqueness service
 *
 * Ensures that flows (main, component, loop) are never created as duplicates
 * within a project. Used by import handlers (V3 flow-package, project import,
 * import-subflow) that previously used raw Flow.create without uniqueness checks.
 *
 * Dedup strategy:
 * 1. Content match (same nodes + edges, ignoring positions) → reuse existing flow
 * 2. Name match (different content) → auto-suffix with (1), (2), ...
 * 3. No match → create with original name
 */

import { createHash } from 'crypto';
import Flow from '../database/models/Flow.js';

/**
 * Compute a stable content hash from nodes and edges.
 * Positions are excluded so that re-importing the same flow at a different
 * canvas offset still matches. Node/edge keys are sorted for deterministic output.
 */
export function computeContentHash(nodes = [], edges = []) {
    const normalizeNode = (n) => ({
        id: n.id || n.nodeId || null,
        type: n.type || null,
        data: sortKeys(n.data || {}),
        // intentionally exclude position, width, height, style
    });
    const normalizeEdge = (e) => ({
        id: e.id || e.edgeId || null,
        source: e.source || null,
        target: e.target || null,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
    });

    const payload = JSON.stringify({
        nodes: nodes.map(normalizeNode).sort((a, b) => String(a.id).localeCompare(String(b.id))),
        edges: edges.map(normalizeEdge).sort((a, b) => String(a.id).localeCompare(String(b.id))),
    });

    return createHash('sha256').update(payload).digest('hex');
}

function sortKeys(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
        sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
}

/**
 * Find an existing flow in the project that matches by name and/or content hash.
 *
 * @param {string} projectId
 * @param {string} type - 'main' | 'component' | 'loop'
 * @param {string} name
 * @param {string|null} contentHash
 * @param {object|null} transaction - Sequelize transaction
 * @returns {Promise<Flow|null>}
 */
export async function findExistingFlow(
    projectId,
    type,
    name,
    contentHash = null,
    transaction = null,
) {
    const opts = { transaction };

    // 1. Exact content match (highest confidence)
    if (contentHash) {
        const byContent = await Flow.findOne({
            where: { projectId, type, contentHash },
            ...opts,
        });
        if (byContent) return byContent;
    }

    // 2. Name match (caller decides whether same-content = reuse, different-content = rename)
    const byName = await Flow.findOne({
        where: { projectId, type, name },
        ...opts,
    });
    return byName || null;
}

/**
 * Resolve a unique flow name by appending (1), (2), ... on collision.
 *
 * @param {string} projectId
 * @param {string} type
 * @param {string} desiredName
 * @param {object|null} transaction
 * @returns {Promise<string>} unique name
 */
export async function resolveUniqueName(projectId, type, desiredName, transaction = null) {
    let finalName = desiredName;
    let counter = 1;
    // Cap iterations to avoid infinite loops on pathological data
    while (counter < 1000) {
        const existing = await Flow.findOne({
            where: { projectId, type, name: finalName },
            transaction,
        });
        if (!existing) return finalName;
        finalName = `${desiredName} (${counter++})`;
    }
    return `${desiredName} (${Date.now()})`;
}

/**
 * Main dedup entry point. Decides whether to create, reuse, or rename.
 *
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.type - 'main' | 'component' | 'loop'
 * @param {string} params.name - desired flow name
 * @param {Array}  params.nodes - flow nodes (raw, unhashed)
 * @param {Array}  params.edges - flow edges
 * @param {object|null} params.transaction
 * @returns {Promise<{action: 'create'|'reuse', name: string, contentHash: string, existingFlowId?: string}>}
 */
export async function ensureUniqueFlow({
    projectId,
    type,
    name,
    nodes = [],
    edges = [],
    transaction = null,
}) {
    const contentHash = computeContentHash(nodes, edges);
    const flowType = type || 'main';
    const desiredName = name || 'Imported Flow';

    const existing = await findExistingFlow(
        projectId,
        flowType,
        desiredName,
        contentHash,
        transaction,
    );

    if (existing) {
        // Same content already exists → reuse (even if name differs slightly, content is authoritative)
        if (existing.contentHash && existing.contentHash === contentHash) {
            return {
                action: 'reuse',
                name: existing.name,
                contentHash,
                existingFlowId: existing.id,
            };
        }
        // Same name, different content → need rename
        const uniqueName = await resolveUniqueName(projectId, flowType, desiredName, transaction);
        return { action: 'create', name: uniqueName, contentHash };
    }

    // No name or content collision
    return { action: 'create', name: desiredName, contentHash };
}

export default {
    computeContentHash,
    findExistingFlow,
    resolveUniqueName,
    ensureUniqueFlow,
};
