/**
 * AuthComplianceValidator.js
 * Validates authentication mechanisms, password storage, token storage, and form attributes.
 */

export class AuthComplianceValidator {
    /**
     * Audit client-side storage and session state.
     * @param {object} params
     * @param {object} params.localStorage - Dump of localStorage keys/values
     * @param {object} params.sessionStorage - Dump of sessionStorage keys/values
     * @returns {Array} List of audit findings
     */
    static validateStorage({ localStorage = {}, sessionStorage = {} }) {
        const results = [];
        const combined = { ...localStorage, ...sessionStorage };

        let sensitiveTokenExposed = false;
        const exposedKeys = [];

        Object.keys(combined).forEach((key) => {
            const k = key.toLowerCase();
            const val = String(combined[key] || '');

            // Detect JWT tokens or raw password/bearer tokens in LocalStorage
            if (
                k.includes('token') ||
                k.includes('jwt') ||
                k.includes('auth') ||
                k.includes('bearer') ||
                val.startsWith('eyJ') // Standard JWT prefix base64 header {"alg":
            ) {
                sensitiveTokenExposed = true;
                exposedKeys.push(key);
            }
        });

        if (sensitiveTokenExposed) {
            results.push({
                ruleId: 'SEC-DAT-TOKEN-STORAGE',
                status: 'FAIL',
                title: 'Sensitive Auth Token Stored in Web Storage',
                description: `Found sensitive session tokens or JWTs stored in LocalStorage/SessionStorage (${exposedKeys.join(', ')}). Web Storage is accessible to any script (XSS risk).`,
                evidence: { exposedKeys },
                recommendation:
                    'Store session JWTs in HttpOnly SameSite cookies rather than LocalStorage/SessionStorage.',
            });
        } else {
            results.push({
                ruleId: 'SEC-DAT-TOKEN-STORAGE',
                status: 'PASS',
                title: 'No Exposed Auth Tokens in Web Storage',
                description: 'Client Web Storage does not contain plaintext authentication JWTs.',
                evidence: { checkedKeysCount: Object.keys(combined).length },
                recommendation: 'Continue protecting session tokens from client script access.',
            });
        }

        return results;
    }
}
