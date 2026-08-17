import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { emitSecurityAlert } from '../../../socket.js';

const auditPolicyAction = (req, res) =>
    executePlaywrightAction(req, res, 'audit_policy', async (page, _opts) => {
        const url = page.url();
        const alerts = (page._securityAlerts || []).filter(
            (a) =>
                a.ruleId.startsWith('csp') ||
                a.ruleId.includes('hsts') ||
                a.ruleId.includes('xfo') ||
                a.ruleId.includes('xcto') ||
                a.ruleId.includes('cors') ||
                a.ruleId.includes('cookie'),
        );

        const runId = page._currentRunId;
        const nodeId = req.body.nodeId;
        const enriched = alerts.map((a) => ({
            ...a,
            runId: runId || null,
            nodeId: nodeId || null,
            url,
            timestamp: Date.now(),
        }));

        for (const alert of enriched) {
            emitSecurityAlert(alert);
        }

        const hasIssues = enriched.some((a) => a.severity === 'high' || a.severity === 'critical');
        return {
            message:
                enriched.length > 0
                    ? `Audit Policy Checkpoint finished with issues: ${enriched.map((a) => a.message).join(', ')}`
                    : 'Audit Policy Checkpoint passed. CSP, cookies and headers look secure.',
            data: {
                url,
                alerts: enriched,
                status: hasIssues ? 'failed' : 'success',
            },
        };
    });

export default auditPolicyAction;
