import { Router } from 'express';
import {
    startRunAction,
    endRunAction,
    getRunsAction,
    getRunDetailsAction,
    deleteRunAction,
    clearHistoryAction,
} from '../controllers/run.controller.js';

const router = Router();

router.delete('/', clearHistoryAction); // Clear all
router.delete('/:id', deleteRunAction); // Delete one
router.post('/start', startRunAction);
router.post('/:id/end', endRunAction);
router.get('/', getRunsAction);
router.get('/:id', getRunDetailsAction);

export default router;
