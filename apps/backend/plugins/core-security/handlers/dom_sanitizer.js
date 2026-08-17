import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { SecurityAuditor } from '../../../services/SecurityAuditor.js';
import { emitSecurityAlert } from '../../../socket.js';

const domSanitizerAction = (req, res) =>
    executePlaywrightAction(req, res, 'dom_sanitizer', async (page, _opts) => {
        const url = page.url();
        const activeDomAlerts = await SecurityAuditor.auditDOM(page);

        const runId = page._currentRunId;
        const nodeId = req.body.nodeId;
        const enriched = activeDomAlerts.map((a) => ({
            ...a,
            runId: runId || null,
            nodeId: nodeId || null,
            url,
            timestamp: Date.now(),
        }));

        if (page._securityAlerts) {
            page._securityAlerts.push(...enriched);
        }

        // Live emit alerts over WebSockets
        for (const alert of enriched) {
            emitSecurityAlert(alert);
        }

        const hasIssues = enriched.some((a) => a.severity === 'high' || a.severity === 'critical');
        return {
            message:
                enriched.length > 0
                    ? `DOM Sanitizer found unsafe attributes/elements: ${enriched.map((a) => a.message).join(', ')}`
                    : 'DOM Sanitizer completed. No issues found.',
            data: {
                url,
                alerts: enriched,
                status: hasIssues ? 'failed' : 'success',
            },
        };
    });

export default domSanitizerAction;
