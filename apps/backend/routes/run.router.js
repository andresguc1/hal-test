import { Router } from 'express';
import {
    startRunAction,
    endRunAction,
    getRunsAction,
    getRunDetailsAction,
    deleteRunAction,
    clearHistoryAction,
    getReportAnalyticsAction,
    startBatchRunAction,
    getBatchSummaryAction,
    getFlowHistoryAction,
    cancelRunAction,
    startDatasetBatchRunAction,
} from '../controllers/run.controller.js';

const router = Router();

router.delete('/', clearHistoryAction); // Clear all
router.delete('/:id', deleteRunAction); // Delete one
router.post('/start', startRunAction);
router.post('/batch', startBatchRunAction);
router.post('/dataset-batch', startDatasetBatchRunAction);
router.get('/batch/:batchId/summary', getBatchSummaryAction);
router.post('/:id/end', endRunAction);
router.post('/:id/cancel', cancelRunAction);
router.get('/analytics', getReportAnalyticsAction);
router.get('/flow/:flowId/history', getFlowHistoryAction);
router.get('/', getRunsAction);
router.get('/:id', getRunDetailsAction);

export default router;
