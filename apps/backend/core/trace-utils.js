// core/trace-utils.js - Playwright trace chunk assembly helpers
// ============================================================
//
// Playwright's `tracing.startChunk()/stopChunk()` API exports each chunk as an
// isolated `.zip` containing `trace.trace` + `trace.network` + `resources/*`.
// Calling `tracing.stop({ path })` afterwards only exports the *current* (last)
// chunk, so the run-level trace ends up almost empty. To give the Trace Viewer
// a playable trace we merge every per-node chunk zip into a single multi-chunk
// zip, which is the format the bundled viewer already understands (it loads
// every entry matching `(.+)\.trace$`).

import * as fsp from 'fs/promises';
import * as path from 'path';

const CHUNK_PREFIX = 'node-';

/**
 * Lists per-node trace chunk zips ordered by modification time (oldest first).
 * @param {string} traceDir
 * @returns {Promise<Array<{ full: string, name: string, mtime: number }>>}
 */
export async function listTraceChunks(traceDir) {
    try {
        const files = await fsp.readdir(traceDir);
        const chunks = files.filter((f) => f.endsWith('.zip') && f.startsWith(CHUNK_PREFIX));
        const withStat = await Promise.all(
            chunks.map(async (name) => {
                const full = path.join(traceDir, name);
                const stat = await fsp.stat(full).catch(() => null);
                return { full, name, mtime: stat ? stat.mtimeMs : 0 };
            }),
        );
        return withStat.sort((a, b) => a.mtime - b.mtime);
    } catch {
        return [];
    }
}

/**
 * Merges per-node chunk zips into a single multi-chunk trace zip.
 *
 * @param {string} traceDir - Directory holding the `node-*.zip` chunks
 * @param {string} runId
 * @returns {Promise<string|null>} Absolute path to a playable trace zip, or
 *   null when there are no chunks to merge.
 */
export async function mergeTraceChunks(traceDir, runId) {
    const chunks = await listTraceChunks(traceDir);
    if (chunks.length === 0) return null;
    // A single chunk is already a valid trace; no need to repackage it.
    if (chunks.length === 1) return chunks[0].full;

    const AdmZip = (await import('adm-zip')).default;
    const output = new AdmZip();
    const seenResources = new Set();
    let ordinal = 0;

    for (const chunk of chunks) {
        let source;
        try {
            source = new AdmZip(chunk.full);
        } catch {
            continue;
        }
        // First chunk keeps the conventional `trace.trace` name; the rest are
        // suffixed so the viewer treats them as additional chunks.
        const key = ordinal === 0 ? 'trace' : `trace-chunk-${ordinal}`;
        for (const entry of source.getEntries()) {
            const name = entry.entryName;
            if (name === 'trace.trace') {
                output.addFile(`${key}.trace`, entry.getData());
            } else if (name === 'trace.network') {
                output.addFile(`${key}.network`, entry.getData());
            } else if (name.startsWith('resources/')) {
                if (!seenResources.has(name)) {
                    seenResources.add(name);
                    output.addFile(name, entry.getData());
                }
            }
        }
        ordinal += 1;
    }

    if (ordinal === 0) return null;

    const outputPath = path.join(traceDir, `trace-${runId}-${Date.now()}.zip`);
    await fsp.mkdir(traceDir, { recursive: true }).catch(() => {});
    await fsp.writeFile(outputPath, output.toBuffer());
    return outputPath;
}
