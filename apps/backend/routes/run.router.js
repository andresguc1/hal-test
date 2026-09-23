import { Router } from 'express';
import {
    startRunAction,
    endRunAction,
    getRunsAction,
    getRunDetailsAction,
    getRunDatasetsAction,
    deleteRunAction,
    clearHistoryAction,
    getReportAnalyticsAction,
    startBatchRunAction,
    getBatchSummaryAction,
    getFlowHistoryAction,
    cancelRunAction,
    logRunStepAction,
    startDatasetBatchRunAction,
    startPerformanceRunAction,
    estimatePerformanceAction,
    startSecurityRunAction,
    exportPerformanceReportAction,
    exportRunReportAction,
} from '../controllers/run.controller.js';

const router = Router();

router.delete('/', clearHistoryAction); // Clear all
router.delete('/:id', deleteRunAction); // Delete one
router.post('/start', startRunAction);
router.post('/batch', startBatchRunAction);
router.post('/dataset-batch', startDatasetBatchRunAction);
router.post('/performance', startPerformanceRunAction);
router.post('/security', startSecurityRunAction);
router.post('/performance/estimate', estimatePerformanceAction);
router.get('/batch/:batchId/summary', getBatchSummaryAction);
router.post('/:id/end', endRunAction);
router.post('/:id/steps', logRunStepAction);
router.post('/:id/cancel', cancelRunAction);
router.get('/analytics', getReportAnalyticsAction);
router.get('/flow/:flowId/history', getFlowHistoryAction);
router.get('/:runId/export', exportPerformanceReportAction);
router.get('/:id/report', exportRunReportAction);
router.get('/:id/datasets', getRunDatasetsAction);
router.get('/', getRunsAction);
router.get('/:id', getRunDetailsAction);

export default router;
