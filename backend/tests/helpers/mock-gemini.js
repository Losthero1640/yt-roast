import { demoRoastReport } from '../../fixtures/demo-profile.js';

/**
 * Creates a valid mock roast report matching EnhancedRoastReportSchema (D-18)
 *
 * @param {Object} [overrides]
 * @returns {Object}
 */
export function getValidMockRoastResponse(overrides = {}) {
  return {
    ...demoRoastReport,
    ...overrides
  };
}

/**
 * Factory creating deterministic mock Gemini clients for testing (AI-05, TEST-03)
 *
 * @param {Object} [options]
 * @param {Object} [options.responseJson] - JSON payload to return
 * @param {number} [options.delayMs] - Milliseconds to delay before responding
 * @param {boolean} [options.simulateTimeout] - If true, waits until abort signal fires
 * @param {boolean} [options.simulateRateLimit] - If true, throws 429 error
 * @param {boolean} [options.simulateInvalidJson] - If true, returns malformed text
 * @param {boolean} [options.simulateEmptyResponse] - If true, returns empty string
 * @returns {Object} Mock GoogleGenAI client with calls inspection
 */
export function createMockGeminiClient(options = {}) {
  const calls = [];

  const mockClient = {
    calls,
    models: {
      async generateContent({ model, contents, config }) {
        calls.push({ model, contents, config });

        // Simulate 15s timeout / abort signal
        if (options.simulateTimeout) {
          return new Promise((_, reject) => {
            if (config.abortSignal) {
              config.abortSignal.addEventListener('abort', () => {
                const abortErr = new Error('The user aborted a request.');
                abortErr.name = 'AbortError';
                reject(abortErr);
              });
            }
          });
        }

        // Simulate network delay
        if (options.delayMs) {
          await new Promise((resolve) => setTimeout(resolve, options.delayMs));
        }

        // Check if aborted during delay
        if (config.abortSignal?.aborted) {
          const abortErr = new Error('The user aborted a request.');
          abortErr.name = 'AbortError';
          throw abortErr;
        }

        // Simulate HTTP 429 Rate Limit
        if (options.simulateRateLimit) {
          const rateLimitErr = new Error('Resource has been exhausted (e.g. check quota).');
          rateLimitErr.status = 429;
          rateLimitErr.code = 'RESOURCE_EXHAUSTED';
          throw rateLimitErr;
        }

        // Simulate Malformed JSON
        if (options.simulateInvalidJson) {
          return { text: 'MALFORMED_JSON_STRING_<!DOCTYPE html>' };
        }

        // Simulate Empty Response
        if (options.simulateEmptyResponse) {
          return { text: '' };
        }

        // Return provided response or default valid demo report
        const responseData = options.responseJson !== undefined
          ? options.responseJson
          : getValidMockRoastResponse();

        return {
          text: JSON.stringify(responseData)
        };
      }
    }
  };

  return mockClient;
}
