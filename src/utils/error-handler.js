import {
  ConsentRequiredError,
  PayloadTooLargeError,
  GeminiTimeoutError,
  GeminiRateLimitError,
  GeminiValidationError,
  GeminiServiceError
} from '../ai/errors.js';
import { TakeoutParseError } from '../parser/takeout-stream-parser.js';
import { logger } from './logger.js';

/**
 * Global Fastify error handler with strict exception sanitization (SEC-02, PRIV-04)
 *
 * @param {Error & { statusCode?: number, code?: string, validation?: any }} error
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export function fastifyErrorHandler(error, request, reply) {
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'An unexpected error occurred.';

  // Map known domain errors to appropriate HTTP status codes
  if (error instanceof ConsentRequiredError || code === 'CONSENT_REQUIRED') {
    statusCode = 400;
    code = 'CONSENT_REQUIRED';
    message = 'Explicit user consent is required before processing viewing history.';
  } else if (
    error instanceof PayloadTooLargeError ||
    code === 'PROMPT_TOO_LARGE' ||
    code === 'FST_REQ_FILE_TOO_LARGE' ||
    code === 'FST_ERR_CTP_BODY_TOO_LARGE' ||
    statusCode === 413
  ) {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Uploaded file exceeds the maximum allowed limit of 100MB.';
  } else if (error instanceof TakeoutParseError || code === 'INVALID_JSON') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = error.message || 'Uploaded file is not a valid or readable Takeout JSON export.';
  } else if (error instanceof GeminiRateLimitError || code === 'GEMINI_RATE_LIMIT') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    message = 'AI generation service rate limit reached. Please retry in a few moments.';
    reply.header('Retry-After', String(error.retryAfterSeconds || 10));
  } else if (error instanceof GeminiTimeoutError || code === 'GEMINI_TIMEOUT') {
    statusCode = 504;
    code = 'REQUEST_TIMEOUT';
    message = 'AI roast generation timed out. Please try again.';
  } else if (error instanceof GeminiValidationError || code === 'GEMINI_VALIDATION_ERROR') {
    statusCode = 502;
    code = 'AI_VALIDATION_ERROR';
    message = 'AI provider generated an unparseable or ungrounded response.';
  } else if (error instanceof GeminiServiceError || code === 'GEMINI_SERVICE_ERROR') {
    statusCode = 502;
    code = 'AI_SERVICE_ERROR';
    message = 'AI provider service is temporarily unavailable.';
  } else if (error.validation) {
    statusCode = 400;
    code = 'INVALID_REQUEST';
    message = 'Request parameters failed validation.';
  } else if (statusCode === 500) {
    // Sanitize any unhandled internal server error message
    message = 'An internal server error occurred.';
  }

  // Redacted logging without leaking tokens or file line contents (PRIV-04)
  logger.error(`HTTP ${statusCode} [${code}] on ${request.method} ${request.url}: ${message}`);

  // Return strictly sanitized response without stack trace or system paths (SEC-02)
  reply.status(statusCode).send({
    error: {
      code,
      message
    }
  });
}
