/**
 * Privacy-first logging utility with automatic credential, token, and payload redaction (PRIV-04)
 */

const SENSITIVE_PATTERNS = [
  // Google OAuth Access Tokens
  /ya29\.[a-zA-Z0-9_\-]+/g,
  // Google OAuth Authorization Codes (raw and URL-encoded)
  /(?:code=)?4(?:%2F|\/)[a-zA-Z0-9_\-]+/gi,
  // Google Client Secrets
  /GOCSPX-[a-zA-Z0-9_\-]+/g,
  // Google Gemini / API Keys
  /AIza[0-9A-Za-z-_]{35}/g,
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  // Generic code query parameters
  /([?&]code=)[^&\s]+/gi
];

/**
 * Redacts sensitive credentials, tokens, and authorization codes from text strings (PRIV-04)
 *
 * @param {string} text
 * @returns {string} Redacted string
 */
export function redactSensitiveText(text) {
  if (typeof text !== 'string') return text;
  let redacted = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED_CREDENTIAL]');
  }
  return redacted;
}

/**
 * Recursively redacts sensitive keys and values from objects before logging
 *
 * @param {any} data
 * @returns {any} Sanitized clone of data
 */
export function sanitizeLogData(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return redactSensitiveText(data);
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const sanitized = {};
  const sensitiveKeys = new Set([
    'accesstoken',
    'access_token',
    'refreshtoken',
    'refresh_token',
    'clientsecret',
    'client_secret',
    'authorizationcode',
    'code',
    'apikey',
    'api_key',
    'password',
    'authorization',
    'file',
    'filecontent',
    'content'
  ]);

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else if (typeof value === 'string') {
      sanitized[key] = redactSensitiveText(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export const logger = {
  info(message, data) {
    // Zero-overhead logging, only prints redacted text
    const cleanMsg = redactSensitiveText(message);
    if (data !== undefined) {
      console.log(`[INFO] ${cleanMsg}`, sanitizeLogData(data));
    } else {
      console.log(`[INFO] ${cleanMsg}`);
    }
  },
  warn(message, data) {
    const cleanMsg = redactSensitiveText(message);
    if (data !== undefined) {
      console.warn(`[WARN] ${cleanMsg}`, sanitizeLogData(data));
    } else {
      console.warn(`[WARN] ${cleanMsg}`);
    }
  },
  error(message, data) {
    const cleanMsg = redactSensitiveText(message);
    if (data !== undefined) {
      console.error(`[ERROR] ${cleanMsg}`, sanitizeLogData(data));
    } else {
      console.error(`[ERROR] ${cleanMsg}`);
    }
  }
};
