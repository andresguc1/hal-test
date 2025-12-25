/**
 * Security Utilities Module
 * Provides validation and sanitization functions to prevent common security vulnerabilities
 * including SSRF, Path Traversal, and Code Injection.
 */

/**
 * Allowed backend domains for endpoint validation.
 * In production, only the configured API base should be allowed.
 * @type {string[]}
 */
const ALLOWED_DOMAINS = [
  "http://localhost:2001",
  "http://127.0.0.1:2001",
  // Add production domain from environment variable if available
  ...(import.meta.env?.VITE_API_BASE ? [import.meta.env.VITE_API_BASE] : []),
];

/**
 * Validates that an endpoint URL is from an allowed domain.
 * Prevents Server-Side Request Forgery (SSRF) attacks.
 *
 * @param {string} url - The endpoint URL to validate
 * @returns {boolean} True if the URL is from an allowed domain, false otherwise
 *
 * @example
 * validateEndpoint('http://localhost:2001/api/actions/click') // true
 * validateEndpoint('http://evil.com/steal-data') // false
 */
export const validateEndpoint = (url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Check if the URL starts with any allowed domain
    const isAllowed = ALLOWED_DOMAINS.some((domain) => {
      return url.startsWith(domain);
    });

    // Additional check: ensure protocol is http or https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    return isAllowed;
  } catch {
    // Invalid URL format
    return false;
  }
};

/**
 * Sanitizes a file path to prevent path traversal attacks.
 * Removes dangerous patterns like '../', absolute paths, and null bytes.
 *
 * @param {string} filePath - The file path to sanitize
 * @returns {string|null} Sanitized path or null if path is invalid/dangerous
 *
 * @example
 * sanitizeFilePath('document.pdf') // 'document.pdf'
 * sanitizeFilePath('../../etc/passwd') // null
 * sanitizeFilePath('/etc/passwd') // null
 */
export const sanitizeFilePath = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    return null;
  }

  const path = filePath.trim();

  // Reject if empty after trim
  if (path === "") {
    return null;
  }

  // Reject paths with null bytes (common in path traversal attacks)
  if (path.includes("\0")) {
    return null;
  }

  // Reject paths with parent directory references
  if (path.includes("..")) {
    return null;
  }

  // Reject absolute paths (Unix and Windows)
  if (path.startsWith("/") || /^[a-zA-Z]:/.test(path)) {
    return null;
  }

  // Reject paths with backslashes (Windows path separators can be used for traversal)
  if (path.includes("\\")) {
    return null;
  }

  return path;
};

/**
 * Validates and logs JavaScript code execution attempts.
 * This provides basic validation and audit trail for script execution.
 * Note: This does NOT make script execution safe - it only provides logging.
 *
 * @param {string} script - The JavaScript code to validate
 * @param {string} [context='unknown'] - Context where the script will be executed
 * @returns {{valid: boolean, sanitized: string, warnings: string[]}} Validation result
 *
 * @example
 * validateScript('return true;', 'wait_conditional')
 * // { valid: true, sanitized: 'return true;', warnings: [] }
 */
export const validateScript = (script, context = "unknown") => {
  const warnings = [];

  if (!script || typeof script !== "string") {
    return {
      valid: false,
      sanitized: "",
      warnings: ["Script must be a non-empty string"],
    };
  }

  const trimmedScript = script.trim();

  if (trimmedScript === "") {
    return {
      valid: false,
      sanitized: "",
      warnings: ["Script cannot be empty"],
    };
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    { pattern: /eval\s*\(/i, message: "Contains eval() - high risk" },
    {
      pattern: /Function\s*\(/i,
      message: "Contains Function() constructor - high risk",
    },
    {
      pattern: /import\s*\(/i,
      message: "Contains dynamic import() - potential risk",
    },
    {
      pattern: /fetch\s*\(/i,
      message: "Contains fetch() - potential data exfiltration",
    },
    {
      pattern: /XMLHttpRequest/i,
      message: "Contains XMLHttpRequest - potential data exfiltration",
    },
    {
      pattern: /document\.cookie/i,
      message: "Accesses document.cookie - potential security risk",
    },
    {
      pattern: /localStorage/i,
      message: "Accesses localStorage - potential security risk",
    },
    {
      pattern: /sessionStorage/i,
      message: "Accesses sessionStorage - potential security risk",
    },
  ];

  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(trimmedScript)) {
      warnings.push(message);
    }
  });

  // Log the script execution attempt (in development)
  if (import.meta.env?.DEV) {
    console.warn("[Security] Script execution attempt:", {
      context,
      script:
        trimmedScript.substring(0, 100) +
        (trimmedScript.length > 100 ? "..." : ""),
      warnings,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    valid: true, // We allow execution but log warnings
    sanitized: trimmedScript,
    warnings,
  };
};

/**
 * Generic input sanitization function.
 * Removes potentially dangerous characters based on input type.
 *
 * @param {string} input - The input to sanitize
 * @param {'text'|'number'|'url'|'selector'} type - The type of input
 * @returns {string} Sanitized input
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>', 'text')
 * // '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export const sanitizeInput = (input, type = "text") => {
  if (input == null) {
    return "";
  }

  let sanitized = String(input);

  switch (type) {
    case "text":
      // Escape HTML special characters
      sanitized = sanitized
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
      break;

    case "number":
      // Remove non-numeric characters except decimal point and minus
      sanitized = sanitized.replace(/[^0-9.-]/g, "");
      break;

    case "url": {
      // Basic URL sanitization - remove dangerous protocols
      sanitized = sanitized.trim();
      const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
      const lowerInput = sanitized.toLowerCase();

      if (dangerousProtocols.some((proto) => lowerInput.startsWith(proto))) {
        sanitized = "";
      }
      break;
    }

    case "selector":
      // Allow CSS selectors and XPath, but trim whitespace
      sanitized = sanitized.trim();
      break;

    default:
      sanitized = sanitized.trim();
  }

  return sanitized;
};

/**
 * Validates an array of file paths.
 * Returns only the valid, sanitized paths.
 *
 * @param {string|string[]} paths - File path(s) to validate
 * @returns {{valid: string[], invalid: string[], errors: string[]}} Validation result
 *
 * @example
 * validateFilePaths('file1.pdf, ../../etc/passwd, file2.png')
 * // { valid: ['file1.pdf', 'file2.png'], invalid: ['../../etc/passwd'], errors: [...] }
 */
export const validateFilePaths = (paths) => {
  const result = {
    valid: [],
    invalid: [],
    errors: [],
  };

  if (!paths) {
    result.errors.push("No file paths provided");
    return result;
  }

  // Convert to array if string
  let pathArray = [];
  if (typeof paths === "string") {
    pathArray = paths
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  } else if (Array.isArray(paths)) {
    pathArray = paths;
  } else {
    result.errors.push("Invalid paths format - must be string or array");
    return result;
  }

  pathArray.forEach((path) => {
    const sanitized = sanitizeFilePath(path);
    if (sanitized) {
      result.valid.push(sanitized);
    } else {
      result.invalid.push(path);
      result.errors.push(`Invalid or dangerous path: ${path}`);
    }
  });

  return result;
};
