export const TABLE_NAMES = {
    DOM_FINGERPRINTS: 'dom_fingerprints',
    FLOW_NODES: 'flow_nodes',
};

export const DOM_FINGERPRINTS_SCHEMA = {
    id: 'string',
    urlHash: 'string',
    selector: 'string',
    domVector: { type: 'vector', dimension: 384 },
    domMinHash: 'string',
    actionType: 'string',
    confidence: 'float32',
    successCount: 'int32',
    lastUsed: 'int64',
    metadata: 'json',
};

export const FLOW_NODES_SCHEMA = {
    id: 'string',
    flowId: 'string',
    label: 'string',
    nodeType: 'string',
    description: 'string',
    tags: 'string[]',
    vector: { type: 'vector', dimension: 384 },
    updatedAt: 'int64',
};

export function createDomFingerprintRecord(data) {
    const now = Date.now();
    return {
        id: data.id || crypto.randomUUID(),
        urlHash: data.urlHash,
        selector: data.selector,
        domVector: data.domVector,
        domMinHash: data.domMinHash || '',
        actionType: data.actionType,
        confidence: data.confidence || 1.0,
        successCount: data.successCount || 1,
        lastUsed: data.lastUsed || now,
        metadata: data.metadata || {},
    };
}

export function createFlowNodeRecord(data) {
    return {
        id: data.id,
        flowId: data.flowId,
        label: data.label || '',
        nodeType: data.nodeType || '',
        description: data.description || '',
        tags: data.tags || [],
        vector: data.vector,
        updatedAt: Date.now(),
    };
}
