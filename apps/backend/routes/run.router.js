import { Router } from 'express';
import {
    startRunAction,
    endRunAction,
    getRunsAction,
    getRunDetailsAction,
} from '../controllers/run.controller.js';

const router = Router();

router.post('/start', startRunAction);
router.post('/:id/end', endRunAction);
router.get('/', getRunsAction);
router.get('/:id', getRunDetailsAction);

export default router;
