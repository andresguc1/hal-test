// controllers/aiUsage.controller.js
/**
 * AI Usage dashboard endpoints.
 * Read-only aggregates over `ai_usage_log` (SQLite) + a guarded clear action.
 */
import aiUsageService from '../services/AIUsageService.js';

export const getAiUsageSummary = async (req, res) => {
    try {
        const data = await aiUsageService.getSummary();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('[AIUsageController] Error fetching summary:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getAiUsageLogs = async (req, res) => {
    try {
        const { limit, offset, taskType, provider, model, success } = req.query;
        const result = await aiUsageService.getLogs({
            limit,
            offset,
            taskType,
            provider,
            model,
            success,
        });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        console.error('[AIUsageController] Error fetching logs:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const clearAiUsage = async (req, res) => {
    try {
        const deleted = await aiUsageService.clear();
        return res.status(200).json({ success: true, deleted });
    } catch (error) {
        console.error('[AIUsageController] Error clearing usage:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
