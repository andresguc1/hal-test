import { PolicyRulesEngine } from './PolicyRulesEngine.js';
import { AppConfigValidator } from './validators/AppConfigValidator.js';
import { CryptoTLSValidator } from './validators/CryptoTLSValidator.js';
import { AuthComplianceValidator } from './validators/AuthComplianceValidator.js';
import SecurityComplianceRun from '../database/models/SecurityComplianceRun.js';
import SecurityComplianceResult from '../database/models/SecurityComplianceResult.js';
import { emitSecurityAlert } from '../socket.js';

export class SecurityComplianceEngine {
    /**
     * Run a comprehensive Security Compliance audit on a target URL and captured context.
     * @param {object} params
     * @param {string} params.targetUrl
     * @param {string} [params.executionId]
     * @param {string} [params.projectId]
     * @param {string} [params.frameworkCode] - 'OWASP_ASVS_L2', 'PCI_DSS_V4', 'ISO_27001', 'GDPR_PRIVACY'
     * @param {object} [params.headers]
     * @param {Array} [params.cookies]
     * @param {object} [params.localStorage]
     * @param {object} [params.sessionStorage]
     * @returns {Promise<object>} Audit summary and findings
     */
    static async runComplianceAudit({
        targetUrl,
        executionId = null,
        projectId = null,
        frameworkCode = 'OWASP_ASVS_L2',
        headers = {},
        cookies = [],
        localStorage = {},
        sessionStorage = {},
    }) {
        console.log(
            ` [COMPLIANCE_ENGINE] Starting Security Audit for target: ${targetUrl} (${frameworkCode})`,
        );

        const allFindings = [];

        // 1. Run App Config & Headers Validator
        const configFindings = AppConfigValidator.validate({ targetUrl, headers, cookies });
        allFindings.push(...configFindings);

        // 2. Run Crypto & TLS Validator
        const tlsFindings = await CryptoTLSValidator.validate(targetUrl);
        allFindings.push(...tlsFindings);

        // 3. Run Storage & Auth Validator
        const authFindings = AuthComplianceValidator.validateStorage({
            localStorage,
            sessionStorage,
        });
        allFindings.push(...authFindings);

        // Map rule metadata and recommendations
        const enrichedResults = allFindings.map((finding) => {
            const ruleMeta = PolicyRulesEngine.getRuleById(finding.ruleId) || {};
            const enriched = {
                ...finding,
                category: ruleMeta.category || 'General Security',
                severity: ruleMeta.severity || 'MEDIUM',
                recommendation: finding.recommendation || ruleMeta.recommendation || '',
                compliance_reference:
                    ruleMeta.mappings?.asvs ||
                    ruleMeta.mappings?.pci ||
                    ruleMeta.mappings?.iso ||
                    'OWASP Top 10',
            };

            // Emit live alert to telemetry clients
            if (enriched.status === 'FAIL' || enriched.status === 'WARNING') {
                emitSecurityAlert({ ...enriched, nodeId: 'live-dast' });
            }
            return enriched;
        });

        // Calculate Compliance Score
        const totalRules = enrichedResults.length;
        const passedRules = enrichedResults.filter((f) => f.status === 'PASS').length;
        const failedRules = enrichedResults.filter((f) => f.status === 'FAIL').length;

        const complianceScore =
            totalRules > 0 ? Math.round((passedRules / totalRules) * 1000) / 10 : 100.0;
        const status = failedRules === 0 ? 'PASS' : complianceScore >= 80 ? 'WARNING' : 'FAIL';

        // Persist to Database if DB models are available
        let complianceRunId = null;
        try {
            if (SecurityComplianceRun && SecurityComplianceResult) {
                const runRecord = await SecurityComplianceRun.create({
                    execution_id: executionId || `run_${Date.now()}`,
                    project_id: projectId || 'default',
                    framework_code: frameworkCode,
                    target_url: targetUrl,
                    compliance_score: complianceScore,
                    total_rules: totalRules,
                    passed_rules: passedRules,
                    failed_rules: failedRules,
                    status: status,
                });

                complianceRunId = runRecord.id;

                const resultRecords = enrichedResults.map((r) => ({
                    compliance_run_id: complianceRunId,
                    rule_id: r.ruleId,
                    category: r.category,
                    severity: r.severity,
                    status: r.status,
                    title: r.title,
                    description: r.description,
                    evidence_json: JSON.stringify(r.evidence || {}),
                    recommendation: r.recommendation,
                    compliance_reference: r.compliance_reference,
                }));

                await SecurityComplianceResult.bulkCreate(resultRecords);
                console.log(
                    ` [COMPLIANCE_ENGINE] ✅ Compliance Audit saved with ID: ${complianceRunId} (Score: ${complianceScore}%)`,
                );
            }
        } catch (dbErr) {
            console.warn(' [COMPLIANCE_ENGINE] ⚠️ Database persistence notice:', dbErr.message);
        }

        return {
            id: complianceRunId,
            frameworkCode,
            targetUrl,
            complianceScore,
            status,
            totalRules,
            passedRules,
            failedRules,
            results: enrichedResults,
        };
    }
}
