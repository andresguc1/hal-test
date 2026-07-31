import { PolicyRulesEngine } from './PolicyRulesEngine.js';
import { AppConfigValidator } from './validators/AppConfigValidator.js';
import { CryptoTLSValidator } from './validators/CryptoTLSValidator.js';
import { AuthComplianceValidator } from './validators/AuthComplianceValidator.js';
import { DataLeakEngine } from './security/DataLeakEngine.js';
import { SensitiveDataScanner } from './security/SensitiveDataScanner.js';
import { DomProtectionEngine } from './security/DomProtectionEngine.js';
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
        page = null,
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

        // 3.5 Run new DOM Policy & Header validator (CSP, Clickjacking, COOP)
        const policyFindings = DomProtectionEngine.auditPolicies(targetUrl, headers);
        allFindings.push(...policyFindings);

        // 3.6 Run new Active DOM scanner (DOM XSS Sinks, SRI, Trusted Types) if browser page is available
        if (page) {
            const domFindings = await DomProtectionEngine.auditDOM(page);
            allFindings.push(...domFindings);
        }

        // 4. Run DLP Storage Scan
        if (localStorage || sessionStorage) {
            for (const [key, value] of Object.entries(localStorage || {})) {
                if (value) {
                    const lsFindings = SensitiveDataScanner.scan(value, `LocalStorage Key: ${key}`);
                    allFindings.push(...lsFindings);
                }
            }
            for (const [key, value] of Object.entries(sessionStorage || {})) {
                if (value) {
                    const ssFindings = SensitiveDataScanner.scan(
                        value,
                        `SessionStorage Key: ${key}`,
                    );
                    allFindings.push(...ssFindings);
                }
            }
        }

        // 5. Run DLP Cookie Scan
        if (cookies && cookies.length > 0) {
            const cookieFindings = DataLeakEngine.auditCookies(cookies, targetUrl);
            allFindings.push(...cookieFindings);
        }

        // Map rule metadata and recommendations
        const enrichedResults = allFindings.map((finding) => {
            const ruleMeta = PolicyRulesEngine.getRuleById(finding.ruleId) || {};
            const enriched = {
                ...finding,
                category: ruleMeta.category || finding.category || 'General Security',
                severity: ruleMeta.severity || finding.severity || 'MEDIUM',
                recommendation: finding.recommendation || ruleMeta.recommendation || '',
                compliance_reference:
                    finding.compliance_reference ||
                    ruleMeta.mappings?.asvs ||
                    ruleMeta.mappings?.pci ||
                    ruleMeta.mappings?.iso ||
                    'OWASP Top 10',
                rule_id_code: finding.ruleId,
                confidence: finding.confidence || 'HIGH',
                affected_resource: finding.affected_resource || targetUrl,
                owasp_reference:
                    ruleMeta.mappings?.owasp || ruleMeta.category || 'Security Misconfiguration',
                asvs_reference: ruleMeta.mappings?.asvs || 'N/A',
            };

            // Emit live alert to telemetry clients
            if (enriched.status === 'FAIL' || enriched.status === 'WARNING') {
                emitSecurityAlert({ ...enriched, nodeId: 'live-dast' });
            }
            return enriched;
        });

        // Calculate granular scores (0 - 100)
        const dlpRules = enrichedResults.filter((r) => r.category === 'Data Leak Protection');
        const dlpPassed = dlpRules.filter((r) => r.status === 'PASS').length;
        const dataLeakScore =
            dlpRules.length > 0
                ? Math.max(0, Math.min(100, Math.round((dlpPassed / dlpRules.length) * 100)))
                : 100.0;

        const domRules = enrichedResults.filter((r) => r.category === 'DOM Protection');
        const domPassed = domRules.filter((r) => r.status === 'PASS').length;
        const domProtectionScore =
            domRules.length > 0
                ? Math.max(0, Math.min(100, Math.round((domPassed / domRules.length) * 100)))
                : 100.0;

        // Calculate Compliance Score
        const totalRules = enrichedResults.length;
        const passedRules = enrichedResults.filter((f) => f.status === 'PASS').length;
        const failedRules = enrichedResults.filter((f) => f.status === 'FAIL').length;

        const complianceScore =
            totalRules > 0 ? Math.round((passedRules / totalRules) * 1000) / 10 : 100.0;
        const status = failedRules === 0 ? 'PASS' : complianceScore >= 80 ? 'WARNING' : 'FAIL';

        // Calculate Risk Level (CRITICAL, HIGH, MEDIUM, LOW)
        let riskLevel = 'LOW';
        const failedFindings = enrichedResults.filter((r) => r.status === 'FAIL');
        if (failedFindings.some((r) => r.severity === 'CRITICAL')) {
            riskLevel = 'CRITICAL';
        } else if (failedFindings.some((r) => r.severity === 'HIGH')) {
            riskLevel = 'HIGH';
        } else if (failedFindings.some((r) => r.severity === 'MEDIUM')) {
            riskLevel = 'MEDIUM';
        }

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
                    data_leak_score: dataLeakScore,
                    dom_protection_score: domProtectionScore,
                    risk_level: riskLevel,
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
                    rule_id_code: r.rule_id_code,
                    confidence: r.confidence,
                    affected_resource: r.affected_resource,
                    owasp_reference: r.owasp_reference,
                    asvs_reference: r.asvs_reference,
                }));

                await SecurityComplianceResult.bulkCreate(resultRecords);
                console.log(
                    ` [COMPLIANCE_ENGINE] ✅ Compliance Audit saved with ID: ${complianceRunId} (Score: ${complianceScore}%, DLP: ${dataLeakScore}%, DOM: ${domProtectionScore}%, Risk: ${riskLevel})`,
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
            dataLeakScore,
            domProtectionScore,
            riskLevel,
            status,
            totalRules,
            passedRules,
            failedRules,
            results: enrichedResults,
        };
    }
}
