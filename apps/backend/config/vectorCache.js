export const vectorCacheConfig = {
    enabled: process.env.HALTEST_VECTOR_CACHE === 'true',

    dbPath: './storage/vector-cache',

    embeddingModel: 'Xenova/all-MiniLM-L6-v2',
    vectorDimension: 384,

    maxEntriesPerUrl: 50,
    ttlDays: 90,
    minConfidenceToStore: 0.7,

    batchSize: 100,
    indexType: 'HNSW',
    hnswParams: { M: 16, efConstruction: 200 },

    similarityThreshold: 0.75,
    maxCandidates: 5,
};
