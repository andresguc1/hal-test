import { smartEmitLog } from '../../../core/ActionExecutor.js';

const runTestsAction = (req, res) => {
    const { testSuite, parallel, retries, reportFormat, timeout } = req.body;

    smartEmitLog(`[TEST RUNNER] Starting execution of suite: ${testSuite || 'all'}`, 'info');

    if (parallel > 1) {
        smartEmitLog(`[TEST RUNNER] Distributing across ${parallel} workers...`, 'info');
    }

    if (reportFormat) {
        smartEmitLog(`[TEST RUNNER] Report format set to: ${reportFormat}`, 'info');
    }

    return res.status(200).json({
        success: true,
        message: req.t('actions.run_tests.success') || 'Test execution simulation triggered',
        data: { testSuite, parallel, retries, reportFormat, timeout },
    });
};

export default runTestsAction;
