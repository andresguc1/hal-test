import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { emitSecurityAlert } from '../../../socket.js';
import { SecurityAuditor } from '../../../services/SecurityAuditor.js';

const sensitiveDataMonitorAction = (req, res) =>
    executePlaywrightAction(req, res, 'sensitive_data_monitor', async (page, _opts) => {
        const url = page.url();
        const activeDomAlerts = await SecurityAuditor.auditDOM(page);

        const isPlaintext = url.startsWith('http://');
        if (isPlaintext) {
            activeDomAlerts.push(
                SecurityAuditor.enrichAlert({
                    ruleId: 'dom-plaintext-transmit',
                    severity: 'high',
                    message: 'Page transmits all data over unencrypted HTTP plaintext protocol.',
                    evidence: { url },
                }),
            );
        }

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
            for (const alert of enriched) {
                const exists = page._securityAlerts.some(
                    (a) =>
                        a.ruleId === alert.ruleId &&
                        a.message === alert.message &&
                        a.nodeId === alert.nodeId,
                );
                if (!exists) {
                    page._securityAlerts.push(alert);
                }
            }
        }

        for (const alert of enriched) {
            emitSecurityAlert(alert);
        }

        const hasIssues = enriched.some((a) => a.severity === 'high' || a.severity === 'critical');
        return {
            message:
                enriched.length > 0
                    ? `Sensitive Data Monitor found potential exposures: ${enriched.map((a) => a.message).join(', ')}`
                    : 'Sensitive Data Monitor completed. No input or transmit issues found.',
            data: {
                url,
                alerts: enriched,
                status: hasIssues ? 'failed' : 'success',
            },
        };
    });

export default sensitiveDataMonitorAction;
