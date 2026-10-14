import { pipeline } from '@xenova/transformers';
import { vectorCacheConfig } from '../../config/vectorCache.js';

let embedderPromise = null;
let embedder = null;

export async function getEmbedder() {
    if (embedder) return embedder;
    if (embedderPromise) return embedderPromise;

    embedderPromise = (async () => {
        console.log(
            '[EmbeddingProvider] Loading embedding model:',
            vectorCacheConfig.embeddingModel,
        );
        embedder = await pipeline('feature-extraction', vectorCacheConfig.embeddingModel, {
            quantized: true,
        });
        console.log('[EmbeddingProvider] Model loaded successfully');
        return embedder;
    })();

    return embedderPromise;
}

export async function embedText(text) {
    const extractor = await getEmbedder();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

export async function embedBatch(texts) {
    const extractor = await getEmbedder();
    const results = [];
    for (const text of texts) {
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        results.push(Array.from(output.data));
    }
    return results;
}

export function clearEmbedder() {
    embedder = null;
    embedderPromise = null;
}
