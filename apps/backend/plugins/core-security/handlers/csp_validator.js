import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const cspValidatorAction = (req, res) =>
    executePlaywrightAction(req, res, 'csp_validator', async (page, _opts) => {
        const url = page.url();
        const alerts = (page._securityAlerts || []).filter((a) => a.ruleId.startsWith('csp'));
        const hasViolations = alerts.some(
            (a) => a.severity === 'high' || a.severity === 'critical',
        );
        return {
            message:
                alerts.length > 0
                    ? `CSP validation finished with issues: ${alerts.map((a) => a.message).join(', ')}`
                    : 'CSP validated successfully and looks secure.',
            data: {
                url,
                alerts,
                status: hasViolations ? 'failed' : 'success',
            },
        };
    });

export default cspValidatorAction;
