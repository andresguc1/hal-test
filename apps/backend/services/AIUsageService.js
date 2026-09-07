// services/AIUsageService.js
/**
 * AIUsageService
 * Reads and aggregates AI usage metrics from the `ai_usage_log` SQLite table.
 * Powers the AI Usage dashboard so the user can measure token/latency savings
 * from the AI Task Optimizer. Read-only + clear; never writes AI calls here.
 */
import { fn, col, literal, Op } from 'sequelize';

class AIUsageService {
    /**
     * Lazily loads the model and guarantees the table exists (best-effort sync).
     * Kept dynamic to avoid coupling and to stay friendly in tests / fresh setups.
     * @returns {Promise<object>} model or null if unavailable
     */
    async _model() {
        try {
            const { default: AIUsageLog } = await import('../database/models/AIUsageLog.js');
            const exists = await AIUsageLog.sequelize
                .query(`SELECT name FROM sqlite_master WHERE type='table' AND name='ai_usage_log'`)
                .then(([rows]) => rows.length > 0)
                .catch(() => false);

            if (!exists) {
                await AIUsageLog.sync().catch(() => {});
            }
            return AIUsageLog;
        } catch (err) {
            console.warn('[AIUsageService] Model unavailable:', err?.message);
            return null;
        }
    }

    /**
     * Aggregated metrics for the dashboard header + breakdowns.
     * @returns {Promise<object>}
     */
    async getSummary() {
        const empty = {
            totalCalls: 0,
            successCount: 0,
            failureCount: 0,
            successRate: 0,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            avgLatencyMs: 0,
            byTaskType: [],
            byProvider: [],
            byModel: [],
            dailyTrend: [],
        };

        let AIUsageLog;
        try {
            AIUsageLog = await this._model();
            if (!AIUsageLog) return empty;
        } catch (err) {
            console.warn('[AIUsageService] getSummary failed to load:', err?.message);
            return empty;
        }

        try {
            const [totals, byTaskType, byProvider, byModel, dailyTrend] = await Promise.all([
                AIUsageLog.findOne({
                    attributes: [
                        [fn('COUNT', col('id')), 'count'],
                        [
                            fn('SUM', literal('CASE WHEN "success" THEN 1 ELSE 0 END')),
                            'successCount',
                        ],
                        [fn('SUM', col('total_tokens')), 'totalTokens'],
                        [fn('SUM', col('prompt_tokens')), 'inputTokens'],
                        [fn('SUM', col('completion_tokens')), 'outputTokens'],
                        [fn('AVG', col('latency_ms')), 'avgLatencyMs'],
                    ],
                    raw: true,
                }),
                AIUsageLog.findAll({
                    attributes: [
                        'task_type',
                        [fn('COUNT', col('id')), 'count'],
                        [
                            fn('SUM', literal('CASE WHEN "success" THEN 1 ELSE 0 END')),
                            'successCount',
                        ],
                        [fn('SUM', col('total_tokens')), 'totalTokens'],
                        [fn('AVG', col('latency_ms')), 'avgLatencyMs'],
                    ],
                    group: ['task_type'],
                    order: [[fn('COUNT', col('id')), 'DESC']],
                    raw: true,
                }),
                AIUsageLog.findAll({
                    attributes: [
                        'provider',
                        [fn('COUNT', col('id')), 'count'],
                        [fn('SUM', col('total_tokens')), 'totalTokens'],
                        [fn('AVG', col('latency_ms')), 'avgLatencyMs'],
                    ],
                    group: ['provider'],
                    order: [[fn('COUNT', col('id')), 'DESC']],
                    raw: true,
                }),
                AIUsageLog.findAll({
                    attributes: [
                        'model',
                        [fn('COUNT', col('id')), 'count'],
                        [fn('SUM', col('total_tokens')), 'totalTokens'],
                        [fn('AVG', col('latency_ms')), 'avgLatencyMs'],
                    ],
                    group: ['model'],
                    order: [[fn('COUNT', col('id')), 'DESC']],
                    limit: 10,
                    raw: true,
                }),
                AIUsageLog.findAll({
                    attributes: [
                        [fn('DATE', col('createdAt')), 'day'],
                        [fn('COUNT', col('id')), 'count'],
                        [fn('SUM', col('total_tokens')), 'totalTokens'],
                    ],
                    where: {
                        createdAt: { [Op.gte]: new Date(Date.now() - 13 * 24 * 3600 * 1000) },
                    },
                    group: ['day'],
                    order: [['day', 'ASC']],
                    raw: true,
                }),
            ]);

            const totalCalls = Number(totals?.count || 0);
            const successCount = Number(totals?.successCount || 0);
            const totalTokens = Number(totals?.totalTokens || 0);
            const avgLatencyMs = totals?.avgLatencyMs ? Math.round(Number(totals.avgLatencyMs)) : 0;

            return {
                totalCalls,
                successCount,
                failureCount: Math.max(0, totalCalls - successCount),
                successRate: totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0,
                totalTokens,
                inputTokens: Number(totals?.inputTokens || 0),
                outputTokens: Number(totals?.outputTokens || 0),
                avgLatencyMs,
                byTaskType: byTaskType.map((r) => ({
                    taskType: r.task_type || 'unknown',
                    count: Number(r.count || 0),
                    successCount: Number(r.successCount || 0),
                    totalTokens: Number(r.totalTokens || 0),
                    avgLatencyMs: r.avgLatencyMs ? Math.round(Number(r.avgLatencyMs)) : 0,
                })),
                byProvider: byProvider.map((r) => ({
                    provider: r.provider || 'unknown',
                    count: Number(r.count || 0),
                    totalTokens: Number(r.totalTokens || 0),
                    avgLatencyMs: r.avgLatencyMs ? Math.round(Number(r.avgLatencyMs)) : 0,
                })),
                byModel: byModel.map((r) => ({
                    model: r.model || 'unknown',
                    count: Number(r.count || 0),
                    totalTokens: Number(r.totalTokens || 0),
                    avgLatencyMs: r.avgLatencyMs ? Math.round(Number(r.avgLatencyMs)) : 0,
                })),
                dailyTrend: dailyTrend.map((r) => ({
                    day: String(r.day || ''),
                    count: Number(r.count || 0),
                    totalTokens: Number(r.totalTokens || 0),
                })),
            };
        } catch (err) {
            console.warn('[AIUsageService] getSummary failed:', err?.message);
            return empty;
        }
    }

    /**
     * Recent AI usage entries with optional filters + pagination.
     * @param {object} options { limit, offset, taskType, provider, model, success }
     * @returns {Promise<object>} { logs, total, limit, offset }
     */
    async getLogs({ limit = 50, offset = 0, taskType, provider, model, success } = {}) {
        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
        const safeOffset = Math.max(Number(offset) || 0, 0);

        const where = {};
        if (taskType) where.task_type = taskType;
        if (provider) where.provider = provider;
        if (model) where.model = model;
        if (success !== undefined && success !== null && success !== '') {
            where.success = String(success) === 'true';
        }

        let AIUsageLog;
        try {
            AIUsageLog = await this._model();
            if (!AIUsageLog) {
                return { logs: [], total: 0, limit: safeLimit, offset: safeOffset };
            }
        } catch (err) {
            console.warn('[AIUsageService] getLogs failed to load:', err?.message);
            return { logs: [], total: 0, limit: safeLimit, offset: safeOffset };
        }

        try {
            const [rows, count] = await Promise.all([
                AIUsageLog.findAll({
                    where,
                    order: [['createdAt', 'DESC']],
                    limit: safeLimit,
                    offset: safeOffset,
                    raw: true,
                }),
                AIUsageLog.count({ where }),
            ]);

            return {
                logs: rows.map((r) => ({
                    id: r.id,
                    taskType: r.task_type,
                    provider: r.provider,
                    model: r.model,
                    promptTokens: r.prompt_tokens,
                    completionTokens: r.completion_tokens,
                    totalTokens: r.total_tokens,
                    latencyMs: r.latency_ms,
                    success: Boolean(r.success),
                    retryCount: r.retry_count,
                    nodeId: r.node_id,
                    runId: r.run_id,
                    error: r.error,
                    createdAt: r.createdAt,
                })),
                total: count,
                limit: safeLimit,
                offset: safeOffset,
            };
        } catch (err) {
            console.warn('[AIUsageService] getLogs failed:', err?.message);
            return { logs: [], total: 0, limit: safeLimit, offset: safeOffset };
        }
    }

    /**
     * Deletes all AI usage logs.
     * @returns {Promise<number>} number of deleted rows (0 if table missing)
     */
    async clear() {
        let AIUsageLog;
        try {
            AIUsageLog = await this._model();
            if (!AIUsageLog) return 0;
            return await AIUsageLog.destroy({ where: {} });
        } catch (err) {
            console.warn('[AIUsageService] clear failed:', err?.message);
            return 0;
        }
    }
}

export default new AIUsageService();
