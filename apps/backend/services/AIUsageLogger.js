// services/AIUsageLogger.js
/**
 * AIUsageLogger
 * Persists per-call AI metrics (tokens, latency, model, task type) into SQLite.
 * Used to validate token/latency savings of the AI Task Optimizer.
 * Fire-and-forget: a failed log write must never affect an AI response.
 */
class AIUsageLogger {
    async log(entry) {
        try {
            const { default: AIUsageLog } = await import('../database/models/AIUsageLog.js');
            const promptTokens = entry.promptTokens ?? 0;
            const completionTokens = entry.completionTokens ?? 0;
            await AIUsageLog.create({
                taskType: entry.taskType || 'unknown',
                provider: entry.provider?.slice(0, 100) || null,
                model: entry.model?.slice(0, 255) || null,
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
                latencyMs: entry.latencyMs != null ? Math.round(entry.latencyMs) : null,
                success: entry.success !== false,
                retryCount: entry.retryCount || 0,
                nodeId: entry.nodeId?.slice(0, 255) || null,
                runId: entry.runId?.slice(0, 255) || null,
                error: entry.error ? String(entry.error).slice(0, 2000) : null,
            });
        } catch (err) {
            console.warn('[AIUsageLogger] Failed to log AI usage:', err?.message);
        }
    }
}

export default new AIUsageLogger();
