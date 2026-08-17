import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const headerAuditorAction = (req, res) =>
    executePlaywrightAction(req, res, 'header_auditor', async (page, _opts) => {
        const url = page.url();
        const alerts = (page._securityAlerts || []).filter(
            (a) =>
                a.ruleId.includes('hsts') ||
                a.ruleId.includes('xfo') ||
                a.ruleId.includes('xcto') ||
                a.ruleId.includes('cors') ||
                a.ruleId.includes('cookie'),
        );
        const hasIssues = alerts.some((a) => a.severity === 'high' || a.severity === 'critical');
        return {
            message:
                alerts.length > 0
                    ? `Header auditor found issues: ${alerts.map((a) => a.message).join(', ')}`
                    : 'Headers/Cookies audited successfully.',
            data: {
                url,
                alerts,
                status: hasIssues ? 'failed' : 'success',
            },
        };
    });

export default headerAuditorAction;
