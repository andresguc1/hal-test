import { connect } from '@lancedb/lancedb';
import { createHash } from 'crypto';
import { vectorCacheConfig } from '../../config/vectorCache.js';
import { VECTOR_CACHE_DIR } from '../../config/paths.js';
import {
    TABLE_NAMES,
    DOM_FINGERPRINTS_SCHEMA,
    FLOW_NODES_SCHEMA,
    createDomFingerprintRecord,
    createFlowNodeRecord,
} from './schema.js';
import { embedText, embedBatch } from './EmbeddingProvider.js';

class VectorCacheService {
    constructor() {
        this.db = null;
        this.domFingerprintsTable = null;
        this.flowNodesTable = null;
        this.initialized = false;
        this.initPromise = null;
    }

    async init() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            if (!vectorCacheConfig.enabled) {
                console.log('[VectorCache] Disabled via config');
                return;
            }

            try {
                console.log('[VectorCache] Connecting to LanceDB at:', VECTOR_CACHE_DIR);
                this.db = await connect(VECTOR_CACHE_DIR);

                this.domFingerprintsTable = await this.db.createTable(
                    TABLE_NAMES.DOM_FINGERPRINTS,
                    [],
                    { schema: DOM_FINGERPRINTS_SCHEMA, existOk: true },
                );

                this.flowNodesTable = await this.db.createTable(TABLE_NAMES.FLOW_NODES, [], {
                    schema: FLOW_NODES_SCHEMA,
                    existOk: true,
                });

                await this.createIndexes();
                this.initialized = true;
                console.log('[VectorCache] Initialized successfully');
            } catch (error) {
                console.error('[VectorCache] Initialization failed:', error);
                throw error;
            }
        })();

        return this.initPromise;
    }

    async createIndexes() {
        if (!this.domFingerprintsTable || !this.flowNodesTable) return;

        try {
            await this.domFingerprintsTable.createIndex({
                column: 'domVector',
                indexType: vectorCacheConfig.indexType,
                metric: 'cosine',
                ...vectorCacheConfig.hnswParams,
            });
            console.log('[VectorCache] Created vector index on dom_fingerprints.domVector');
        } catch (e) {
            console.log('[VectorCache] Vector index may already exist:', e.message);
        }

        try {
            await this.flowNodesTable.createIndex({
                column: 'vector',
                indexType: vectorCacheConfig.indexType,
                metric: 'cosine',
                ...vectorCacheConfig.hnswParams,
            });
            console.log('[VectorCache] Created vector index on flow_nodes.vector');
        } catch (e) {
            console.log('[VectorCache] Vector index may already exist:', e.message);
        }
    }

    hashUrl(url) {
        return createHash('sha256').update(url).digest('hex').slice(0, 16);
    }

    async embed(text) {
        return embedText(text);
    }

    async upsertDomFingerprint(data) {
        if (!vectorCacheConfig.enabled || !this.initialized) return;

        if (data.confidence < vectorCacheConfig.minConfidenceToStore) {
            console.log('[VectorCache] Skipping - confidence below threshold:', data.confidence);
            return;
        }

        try {
            const urlHash = data.urlHash || this.hashUrl(data.url || '');
            const domVector =
                data.domVector || (await this.embed(data.compressedDOM || data.selector));

            const existing = await this.domFingerprintsTable
                .query()
                .where(
                    `urlHash = '${urlHash}' AND selector = '${data.selector.replace(/'/g, "''")}'`,
                )
                .limit(1)
                .toArray();

            const now = Date.now();

            if (existing.length > 0) {
                const record = existing[0];
                await this.domFingerprintsTable.update(`id = '${record.id}'`, {
                    successCount: record.successCount + 1,
                    lastUsed: now,
                    confidence: Math.max(record.confidence, data.confidence),
                    metadata: { ...record.metadata, ...data.metadata },
                });
                console.log('[VectorCache] Updated existing fingerprint:', data.selector);
            } else {
                const record = createDomFingerprintRecord({
                    urlHash,
                    selector: data.selector,
                    domVector,
                    domMinHash: data.domMinHash || this.computeMinHash(data.compressedDOM || ''),
                    actionType: data.actionType,
                    confidence: data.confidence,
                    metadata: data.metadata,
                });
                await this.domFingerprintsTable.add([record]);
                console.log('[VectorCache] Inserted new fingerprint:', data.selector);
            }

            await this.pruneIfNeeded(urlHash);
        } catch (error) {
            console.error('[VectorCache] upsertDomFingerprint error:', error);
        }
    }

    computeMinHash(text) {
        const hash = createHash('sha256').update(text).digest('hex');
        return hash.slice(0, 16);
    }

    async pruneIfNeeded(urlHash) {
        try {
            const count = await this.domFingerprintsTable
                .query()
                .where(`urlHash = '${urlHash}'`)
                .select(['id'])
                .toArray();

            if (count.length > vectorCacheConfig.maxEntriesPerUrl) {
                const toDelete = await this.domFingerprintsTable
                    .query()
                    .where(`urlHash = '${urlHash}'`)
                    .orderBy('lastUsed')
                    .limit(count.length - vectorCacheConfig.maxEntriesPerUrl)
                    .select(['id'])
                    .toArray();

                if (toDelete.length > 0) {
                    const ids = toDelete.map((r) => r.id).join("','");
                    await this.domFingerprintsTable.delete(`id IN ('${ids}')`);
                    console.log(
                        '[VectorCache] Pruned',
                        toDelete.length,
                        'old entries for urlHash:',
                        urlHash,
                    );
                }
            }
        } catch (error) {
            console.error('[VectorCache] pruneIfNeeded error:', error);
        }
    }

    async searchSimilarSelectors({ domVector, urlHash, actionType, k = 5 }) {
        if (!vectorCacheConfig.enabled || !this.initialized || !this.domFingerprintsTable) {
            return [];
        }

        try {
            let query = this.domFingerprintsTable
                .query()
                .nearestTo(domVector, 'domVector', k * 3)
                .where(`urlHash = '${urlHash}'`);

            if (actionType) {
                query = query.where(`actionType = '${actionType}'`);
            }

            const results = await query
                .select(['id', 'selector', 'confidence', 'successCount', 'actionType', 'metadata'])
                .limit(k)
                .toArray();

            return results
                .filter((r) => r._distance <= 1 - vectorCacheConfig.similarityThreshold)
                .map((r) => ({
                    selector: r.selector,
                    confidence: r.confidence,
                    successCount: r.successCount,
                    actionType: r.actionType,
                    similarity: 1 - r._distance,
                    metadata: r.metadata,
                }))
                .slice(0, k);
        } catch (error) {
            console.error('[VectorCache] searchSimilarSelectors error:', error);
            return [];
        }
    }

    async upsertFlowNode(data) {
        if (!vectorCacheConfig.enabled || !this.initialized || !this.flowNodesTable) return;

        try {
            const textToEmbed =
                `${data.label} ${data.description} ${data.nodeType} ${(data.tags || []).join(' ')}`.trim();
            const vector = await this.embed(textToEmbed);

            const existing = await this.flowNodesTable
                .query()
                .where(`id = '${data.id}'`)
                .limit(1)
                .toArray();

            const record = createFlowNodeRecord({
                ...data,
                vector,
            });

            if (existing.length > 0) {
                await this.flowNodesTable.update(`id = '${data.id}'`, record);
            } else {
                await this.flowNodesTable.add([record]);
            }
        } catch (error) {
            console.error('[VectorCache] upsertFlowNode error:', error);
        }
    }

    async searchFlowNodes(queryText, flowId, k = 10) {
        if (!vectorCacheConfig.enabled || !this.initialized || !this.flowNodesTable) {
            return [];
        }

        try {
            const queryVector = await this.embed(queryText);

            const results = await this.flowNodesTable
                .query()
                .nearestTo(queryVector, 'vector', k * 2)
                .where(`flowId = '${flowId}'`)
                .select(['id', 'label', 'nodeType', 'description', 'tags'])
                .limit(k)
                .toArray();

            return results
                .filter((r) => r._distance <= 1 - vectorCacheConfig.similarityThreshold)
                .map((r) => ({
                    nodeId: r.id,
                    label: r.label,
                    nodeType: r.nodeType,
                    description: r.description,
                    tags: r.tags,
                    similarity: 1 - r._distance,
                }));
        } catch (error) {
            console.error('[VectorCache] searchFlowNodes error:', error);
            return [];
        }
    }

    async indexFlowNodes(nodes, flowId) {
        if (!vectorCacheConfig.enabled || !nodes?.length) return;

        const texts = nodes.map((n) => {
            const label = n.data?.label || n.data?.customLabel || '';
            const desc = n.data?.description || '';
            const type = n.type || '';
            const tags = n.data?.tags || [];
            return `${label} ${desc} ${type} ${tags.join(' ')}`.trim();
        });

        try {
            const vectors = await embedBatch(texts);
            const records = nodes.map((n, i) =>
                createFlowNodeRecord({
                    id: n.id,
                    flowId,
                    label: n.data?.label || n.data?.customLabel || '',
                    nodeType: n.type || '',
                    description: n.data?.description || '',
                    tags: n.data?.tags || [],
                    vector: vectors[i],
                }),
            );

            await this.flowNodesTable.add(records);
            console.log('[VectorCache] Indexed', records.length, 'flow nodes for flow:', flowId);
        } catch (error) {
            console.error('[VectorCache] indexFlowNodes error:', error);
        }
    }

    async prune() {
        if (!vectorCacheConfig.enabled || !this.initialized) return;

        const cutoff = Date.now() - vectorCacheConfig.ttlDays * 24 * 60 * 60 * 1000;

        try {
            await this.domFingerprintsTable.delete(`lastUsed < ${cutoff}`);
            console.log(
                '[VectorCache] Pruned entries older than',
                vectorCacheConfig.ttlDays,
                'days',
            );
        } catch (error) {
            console.error('[VectorCache] prune error:', error);
        }
    }

    async getStats() {
        if (!this.initialized) return { enabled: false };

        try {
            const domCount =
                (await this.domFingerprintsTable
                    ?.query()
                    .select(['id'])
                    .toArray()
                    .then((r) => r.length)) || 0;
            const nodeCount =
                (await this.flowNodesTable
                    ?.query()
                    .select(['id'])
                    .toArray()
                    .then((r) => r.length)) || 0;
            return { enabled: true, domFingerprints: domCount, flowNodes: nodeCount };
        } catch {
            return { enabled: true, error: 'stats failed' };
        }
    }
}

export const vectorCacheService = new VectorCacheService();
