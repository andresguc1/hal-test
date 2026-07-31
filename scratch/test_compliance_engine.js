import { SecurityComplianceEngine } from '../apps/backend/services/SecurityComplianceEngine.js';

async function runTest() {
    console.log('--- Testing Security Compliance Engine ---');
    
    const result = await SecurityComplianceEngine.runComplianceAudit({
        targetUrl: 'https://example.com',
        frameworkCode: 'OWASP_ASVS_L2',
        headers: {
            'strict-transport-security': 'max-age=31536000; includeSubDomains',
            'x-content-type-options': 'nosniff',
            'x-frame-options': 'SAMEORIGIN'
        },
        cookies: [
            { name: 'session_id', httpOnly: true, secure: true }
        ],
        localStorage: {},
        sessionStorage: {}
    });

    console.log('Compliance Audit Result:');
    console.log(`- Target: ${result.targetUrl}`);
    console.log(`- Score: ${result.complianceScore}%`);
    console.log(`- Status: ${result.status}`);
    console.log(`- Passed Rules: ${result.passedRules}/${result.totalRules}`);
    console.log('- Sample Findings:');
    result.results.slice(0, 4).forEach(f => {
        console.log(`  [${f.status}] ${f.ruleId}: ${f.title} (${f.compliance_reference})`);
    });

    if (typeof result.complianceScore === 'number' && result.results.length > 0) {
        console.log('✅ Security Compliance Engine Verification SUCCESSFUL!');
        process.exit(0);
    } else {
        console.error('❌ Security Compliance Engine Verification FAILED!');
        process.exit(1);
    }
}

runTest().catch(err => {
    console.error('Error running compliance test script:', err);
    process.exit(1);
});
