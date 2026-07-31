/**
 * SensitiveDataScanner.js
 * Scans text content (HTML, JSON, XML, strings) for exposed secrets, credentials, PII,
 * and system metadata using high-fidelity regexes, Shannon Entropy, and algorithmic checksums.
 */

// Luhn Algorithm to validate Credit Card Numbers
function validateLuhn(ccNum) {
    const clean = String(ccNum).replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = clean.length - 1; i >= 0; i--) {
        let digit = parseInt(clean.charAt(i), 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

// Shannon Entropy Calculation
// H(x) = -sum(P(xi) * log2(P(xi)))
export function calculateShannonEntropy(str) {
    if (!str || str.length === 0) return 0;
    const len = str.length;
    const frequencies = {};

    for (let i = 0; i < len; i++) {
        const char = str[i];
        frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(frequencies)) {
        const p = count / len;
        entropy -= p * Math.log2(p);
    }

    return parseFloat(entropy.toFixed(3));
}

// Key signatures and regular expressions
export const REGEX_PATTERNS = {
    // --- SECRETS & CREDENTIALS ---
    jwt: {
        regex: /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/g,
        ruleId: 'SEC-LEAK-APIKEY',
        title: 'Exposed JWT Token',
        severity: 'HIGH',
        confidence: 'HIGH',
    },
    awsKeyId: {
        regex: /\b(AKIA|ASCA|A3T|ASIA)[0-9A-Z]{16}\b/g,
        ruleId: 'SEC-LEAK-APIKEY',
        title: 'Exposed AWS Access Key ID',
        severity: 'HIGH',
        confidence: 'HIGH',
    },
    stripeKey: {
        regex: /\bsk_(live|test)_[0-9a-zA-Z]{24,99}\b/g,
        ruleId: 'SEC-LEAK-APIKEY',
        title: 'Exposed Stripe API Key',
        severity: 'HIGH',
        confidence: 'HIGH',
    },
    openaiKey: {
        regex: /\bsk-[a-zA-Z0-9]{48}\b/g,
        ruleId: 'SEC-LEAK-APIKEY',
        title: 'Exposed OpenAI API Key',
        severity: 'HIGH',
        confidence: 'HIGH',
    },
    githubToken: {
        regex: /\bgh[oprs]_[a-zA-Z0-9]{36,255}\b/g,
        ruleId: 'SEC-LEAK-APIKEY',
        title: 'Exposed GitHub Token',
        severity: 'HIGH',
        confidence: 'HIGH',
    },
    privateKey: {
        regex: /-----BEGIN (RSA |EC |DSA |GPG |)?PRIVATE KEY-----[\s\S]+?-----END (RSA |EC |DSA |GPG |)?PRIVATE KEY-----/g,
        ruleId: 'SEC-LEAK-APIKEY',
        title: 'Exposed Private Key',
        severity: 'HIGH',
        confidence: 'HIGH',
    },
    genericApiKey: {
        regex: /\b(api_key|apikey|secret|passwd|password|private_key|token|bearer|auth_token)\b\s*[:=]\s*["']([^"'\r\n]{16,})["']/gi,
        ruleId: 'SEC-LEAK-APIKEY',
        title: 'Exposed Key or Password Parameter',
        severity: 'HIGH',
        // We will confirm with entropy, if high entropy => HIGH, otherwise MEDIUM
        confidence: 'MEDIUM',
    },

    // --- PII ---
    email: {
        regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
        ruleId: 'SEC-LEAK-PII',
        title: 'Exposed Email Address Address',
        severity: 'MEDIUM',
        confidence: 'MEDIUM',
    },
    phoneNumber: {
        regex: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        ruleId: 'SEC-LEAK-PII',
        title: 'Exposed Phone Number',
        severity: 'MEDIUM',
        confidence: 'MEDIUM',
    },
    creditCard: {
        regex: /\b(?:\d[ -]*?){13,19}\b/g, // General digits sequence, validate with Luhn
        ruleId: 'SEC-LEAK-PII',
        title: 'Exposed Credit Card Number',
        severity: 'HIGH',
        confidence: 'HIGH',
    },
    ssn: {
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        ruleId: 'SEC-LEAK-PII',
        title: 'Exposed Social Security Number (SSN)',
        severity: 'HIGH',
        confidence: 'HIGH',
    },

    // --- SYSTEM METADATA ---
    internalIp: {
        regex: /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
        ruleId: 'SEC-LEAK-SYSTEM',
        title: 'Exposed Internal IP Address',
        severity: 'MEDIUM',
        confidence: 'HIGH',
    },
    stackTrace: {
        regex: /\b(Exception in thread|at [a-zA-Z0-9_$]+(\.[a-zA-Z0-9_$]+)+|[a-zA-Z0-9._$]*Exception: [\s\S]{0,100}at [a-zA-Z0-9._$]+)/gi,
        ruleId: 'SEC-LEAK-SYSTEM',
        title: 'Exposed Application Stack Trace',
        severity: 'MEDIUM',
        confidence: 'HIGH',
    },
};

export class SensitiveDataScanner {
    /**
     * Scans a target text string for sensitive content leaks.
     * @param {string} text - The input content to search.
     * @param {string} [resourceName] - Name of the affected resource (URL, database key, etc.).
     * @returns {Array<object>} List of findings.
     */
    static scan(text, resourceName = 'unknown') {
        const findings = [];
        if (!text || typeof text !== 'string') return findings;

        // Run structured pattern scans
        for (const [patternKey, config] of Object.entries(REGEX_PATTERNS)) {
            // Reset regex lastIndex just in case
            config.regex.lastIndex = 0;
            let match;

            while ((match = config.regex.exec(text)) !== null) {
                const matchedValue = match[0];
                const matchedContext = text.substring(
                    Math.max(0, match.index - 50),
                    Math.min(text.length, match.index + matchedValue.length + 50),
                );

                // Algorithmic verification overrides
                if (patternKey === 'creditCard') {
                    if (!validateLuhn(matchedValue)) {
                        continue; // False positive credit card
                    }
                }

                let finalConfidence = config.confidence;
                let finalSeverity = config.severity;

                // For generic API key parameters, check entropy of the matched value group
                if (patternKey === 'genericApiKey' && match[2]) {
                    const secretVal = match[2];
                    const entropy = calculateShannonEntropy(secretVal);

                    // Exclude low-entropy dummy values (like "123456", "password123")
                    if (entropy < 3.2) {
                        continue;
                    }

                    if (entropy > 3.5) {
                        finalConfidence = 'HIGH';
                        finalSeverity = 'HIGH';
                    } else {
                        finalConfidence = 'MEDIUM';
                        finalSeverity = 'MEDIUM';
                    }
                }

                // Push finding
                findings.push({
                    ruleId: config.ruleId,
                    status: 'FAIL',
                    title: config.title,
                    severity: finalSeverity,
                    confidence: finalConfidence,
                    description: `Sensitive data leak of type "${config.title}" detected in raw content.`,
                    evidence: {
                        matchedValue:
                            matchedValue.length > 100
                                ? `${matchedValue.substring(0, 100)}...`
                                : matchedValue,
                        context: `...${matchedContext.replace(/\r?\n/g, ' ').trim()}...`,
                        entropy: calculateShannonEntropy(matchedValue),
                    },
                    affected_resource: resourceName,
                });

                // Prevent infinite loop for zero-width matches
                if (config.regex.lastIndex === match.index) {
                    config.regex.lastIndex++;
                }
            }
        }

        return findings;
    }
}
