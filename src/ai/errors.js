/**
 * Custom error hierarchy for AI roast generation, privacy, and validation (D-20)
 */

export class RoastError extends Error {
  constructor(message, code = 'ROAST_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

/**
 * Thrown when user consent is not granted prior to evidence transmission (D-17)
 */
export class ConsentRequiredError extends RoastError {
  constructor(message = 'Explicit user consent is required before sending viewing evidence to AI provider.') {
    super(message, 'CONSENT_REQUIRED');
  }
}

/**
 * Thrown when serialized prompt payload exceeds hard 4,096 byte ceiling (D-16)
 */
export class PayloadTooLargeError extends RoastError {
  constructor(message = 'Serialized evidence prompt exceeds hard ceiling of 4,096 bytes.') {
    super(message, 'PROMPT_TOO_LARGE');
  }
}

/**
 * Thrown when AI request exceeds 15,000 ms timeout (D-20)
 */
export class GeminiTimeoutError extends RoastError {
  constructor(message = 'Gemini generation timed out after 15 seconds.') {
    super(message, 'GEMINI_TIMEOUT');
  }
}

/**
 * Thrown on HTTP 429 / resource exhaustion from Gemini API (D-20)
 */
export class GeminiRateLimitError extends RoastError {
  constructor(message = 'Gemini rate limit exceeded. Please try again in a few moments.', retryAfterSeconds = 10) {
    super(message, 'GEMINI_RATE_LIMIT');
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Thrown on unparseable JSON, schema failure, or hallucinated evidence references (D-20)
 */
export class GeminiValidationError extends RoastError {
  constructor(message = 'Gemini response failed schema validation or evidence grounding.', details = []) {
    super(message, 'GEMINI_VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Thrown on upstream 5xx or unhandled network errors (D-20)
 */
export class GeminiServiceError extends RoastError {
  constructor(message = 'Gemini service encountered an upstream error.') {
    super(message, 'GEMINI_SERVICE_ERROR');
  }
}
