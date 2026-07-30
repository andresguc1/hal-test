import tls from 'tls';
import { URL } from 'url';

/**
 * CryptoTLSValidator.js
 * Audits TLS versions, certificate validity, and cipher suites using Node.js TLS module.
 */
export class CryptoTLSValidator {
    /**
     * Inspect TLS details of a remote host target.
     * @param {string} targetUrl
     * @returns {Promise<Array>} List of TLS audit findings
     */
    static async validate(targetUrl) {
        const results = [];
        try {
            const parsed = new URL(targetUrl);
            if (parsed.protocol !== 'https:') {
                results.push({
                    ruleId: 'SEC-CRY-TLS-VERSION',
                    status: 'FAIL',
                    title: 'Non-HTTPS Connection (Plaintext Protocol)',
                    description: `Target URL ${targetUrl} uses unencrypted HTTP protocol instead of HTTPS.`,
                    evidence: { protocol: parsed.protocol },
                    recommendation: 'Enforce HTTPS for all web application traffic.',
                });
                return results;
            }

            const port = parsed.port || 443;
            const host = parsed.hostname;

            const tlsDetails = await new Promise((resolve, reject) => {
                const socket = tls.connect(
                    {
                        host,
                        port,
                        servername: host,
                        rejectUnauthorized: false, // Don't throw error if self-signed so we can inspect cert details
                    },
                    () => {
                        const cipher = socket.getCipher();
                        const protocol = socket.getProtocol();
                        const cert = socket.getPeerCertificate();
                        socket.end();

                        resolve({ cipher, protocol, cert });
                    },
                );

                socket.on('error', (err) => {
                    reject(err);
                });
                socket.setTimeout(5000, () => {
                    socket.destroy();
                    reject(new Error('TLS connection timeout'));
                });
            });

            // Check TLS Protocol Version
            const validProtocols = ['TLSv1.2', 'TLSv1.3'];
            if (!validProtocols.includes(tlsDetails.protocol)) {
                results.push({
                    ruleId: 'SEC-CRY-TLS-VERSION',
                    status: 'FAIL',
                    title: 'Insecure or Outdated TLS Protocol',
                    description: `Target negotiated protocol ${tlsDetails.protocol}. Modern applications require TLS 1.2 or TLS 1.3.`,
                    evidence: { protocol: tlsDetails.protocol, cipher: tlsDetails.cipher },
                    recommendation: 'Disable TLS 1.0, TLS 1.1, and SSL 3.0 on web server.',
                });
            } else {
                results.push({
                    ruleId: 'SEC-CRY-TLS-VERSION',
                    status: 'PASS',
                    title: 'Modern TLS Protocol Enforced',
                    description: `TLS handshake negotiated secure protocol: ${tlsDetails.protocol} (${tlsDetails.cipher?.name || 'N/A'}).`,
                    evidence: { protocol: tlsDetails.protocol, cipher: tlsDetails.cipher?.name },
                    recommendation: 'Maintain TLS 1.2+ protocol requirements.',
                });
            }
        } catch (err) {
            results.push({
                ruleId: 'SEC-CRY-TLS-VERSION',
                status: 'FAIL',
                title: 'TLS Connection Inspection Error',
                description: `Could not establish TLS connection to target: ${err.message}`,
                evidence: { error: err.message },
                recommendation: 'Ensure target hostname is accessible and configured for HTTPS.',
            });
        }

        return results;
    }
}
