import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { buildRoastPrompt, extractAllowedEvidence } from './prompt-builder.js';
import {
  EnhancedRoastReportSchema,
  FullRoastResultSchema,
  validateJokeGrounding
} from '../schemas/roast.js';
import {
  ConsentRequiredError,
  PayloadTooLargeError,
  GeminiTimeoutError,
  GeminiRateLimitError,
  GeminiValidationError,
  GeminiServiceError,
  RoastError
} from './errors.js';

/**
 * Gemini Structured Output JSON Schema (AI-02, AI-03, D-15)
 */
export const GEMINI_ROAST_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    brainrotScore: {
      type: Type.INTEGER,
      description: 'Deterministic Brainrot score (0-100) provided in the prompt'
    },
    viewingArchetype: {
      type: Type.STRING,
      description: 'Comedic archetype name (e.g. The 3 AM Productivity Goblin)'
    },
    roastSummary: {
      type: Type.STRING,
      description: 'Substantive opening roast monologue'
    },
    roasts: {
      type: Type.ARRAY,
      description: 'Array of at least 4 jokes covering pattern, combination, specific, and archetype styles',
      items: {
        type: Type.OBJECT,
        properties: {
          style: {
            type: Type.STRING,
            enum: ['pattern', 'combination', 'specific', 'archetype']
          },
          joke: { type: Type.STRING },
          supportingEvidence: { type: Type.STRING },
          referencedItem: { type: Type.STRING }
        },
        required: ['style', 'joke', 'supportingEvidence']
      }
    },
    redFlags: {
      type: Type.ARRAY,
      description: '3 to 5 bullet points of observed digital red flags',
      items: { type: Type.STRING }
    },
    finalVerdict: {
      type: Type.STRING,
      description: 'Scathing, memorable concluding takeaway'
    },
    cardPayload: {
      type: Type.OBJECT,
      properties: {
        brainrotScore: { type: Type.INTEGER },
        tier: {
          type: Type.STRING,
          enum: ['Monk', 'Casual', 'Slime Brain', 'Deep Fried', 'Digital Zombie', 'Unranked']
        },
        headline: { type: Type.STRING },
        topCrime: { type: Type.STRING }
      },
      required: ['brainrotScore', 'tier', 'headline', 'topCrime']
    }
  },
  required: [
    'brainrotScore',
    'viewingArchetype',
    'roastSummary',
    'roasts',
    'redFlags',
    'finalVerdict',
    'cardPayload'
  ]
};

/**
 * Core AI Roast Generator Service connecting normalized evidence to Gemini (AI-01 to AI-05)
 */
export class RoastGeneratorService {
  /**
   * @param {Object} [options]
   * @param {string} [options.apiKey] - Gemini API Key (defaults to process.env.GEMINI_API_KEY)
   * @param {string} [options.model] - Model ID (defaults to process.env.GEMINI_MODEL || 'gemini-2.5-flash')
   * @param {Object} [options.client] - Pre-instantiated GoogleGenAI client (for testing/mocking)
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    this.model = options.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (options.client) {
      this.client = options.client;
    } else if (this.apiKey) {
      this.client = new GoogleGenAI({
        apiKey: this.apiKey,
        httpOptions: { timeout: 15000 }
      });
    } else {
      // Lazy or mocked initialization allowed for local unit tests
      this.client = null;
    }
  }

  /**
   * Generates a fully validated AI roast report from a normalized profile and deterministic score
   *
   * @param {Object} params
   * @param {Object} params.profile - Normalized viewing profile from Phase 1
   * @param {Object} params.scoreResult - Deterministic Brainrot score result from Phase 1
   * @param {boolean} params.consentGranted - User consent confirmation
   * @returns {Promise<import('../schemas/roast.js').FullRoastResult>}
   */
  async generateRoastReport({ profile, scoreResult, consentGranted }) {
    // 1. Mandatory User Consent Gate (D-17)
    if (consentGranted !== true) {
      throw new ConsentRequiredError(
        'Explicit user consent is required before sending viewing evidence to AI provider.'
      );
    }

    if (!this.client) {
      throw new GeminiServiceError(
        'Gemini client is not initialized. Please provide GEMINI_API_KEY environment variable.'
      );
    }

    // 2. Assemble and Size-Check Prompt (D-16, PRIV-03)
    const prompt = buildRoastPrompt({ profile, scoreResult });
    const promptBytes = Buffer.byteLength(prompt, 'utf8');
    if (promptBytes > 4096) {
      throw new PayloadTooLargeError(
        `Serialized prompt payload exceeds hard ceiling of 4,096 bytes (measured: ${promptBytes} bytes).`
      );
    }

    // 3. Setup 15-second AbortController Timeout (AI-05, D-20)
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      // 4. Dispatch Structured Gemini Request
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_ROAST_RESPONSE_SCHEMA,
          abortSignal: controller.signal
        }
      });

      // 5. Extract and Parse JSON Response
      const responseText = response?.text || '';
      if (!responseText) {
        throw new GeminiValidationError('Gemini returned an empty response body.');
      }

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new GeminiValidationError(`Gemini output was not valid JSON: ${jsonErr.message}`);
      }

      // 6. Enforce Score Immutability (D-19)
      const lockedScore = scoreResult.score !== null ? scoreResult.score : 0;
      const lockedTier = scoreResult.tier || 'Unranked';

      parsed.brainrotScore = lockedScore;
      parsed.cardPayload = parsed.cardPayload || {};
      parsed.cardPayload.brainrotScore = lockedScore;
      parsed.cardPayload.tier = lockedTier;

      // 7. Validate Against Augmented Zod Schema (D-18)
      const validatedRoast = EnhancedRoastReportSchema.parse(parsed);

      // 8. Validate Evidence Grounding to Prevent Hallucinations (D-18)
      const allowedEvidence = extractAllowedEvidence(profile);
      const grounding = validateJokeGrounding(validatedRoast, allowedEvidence);
      if (!grounding.valid) {
        throw new GeminiValidationError(
          `Gemini generated ungrounded joke reference: ${grounding.errors[0]}`,
          grounding.errors
        );
      }

      // 9. Assemble and Validate Full Roast Result (D-18, D-19)
      return FullRoastResultSchema.parse({
        roast: validatedRoast,
        scoreDetails: scoreResult
      });
    } catch (err) {
      // Retain custom RoastError exceptions directly
      if (err instanceof RoastError) {
        throw err;
      }

      // Timeout detection (controller aborted or AbortError)
      if (timedOut || controller.signal.aborted || err.name === 'AbortError') {
        throw new GeminiTimeoutError('Gemini generation timed out after 15 seconds.');
      }

      // Rate limit mapping (HTTP 429 / RESOURCE_EXHAUSTED)
      const status = err.status || err.statusCode || (err.response && err.response.status);
      const message = err.message || '';
      if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        throw new GeminiRateLimitError(
          'Gemini rate limit exceeded. Please wait a moment before requesting another roast.'
        );
      }

      // Schema or validation issues
      if (err instanceof z.ZodError) {
        throw new GeminiValidationError(
          `Gemini output failed schema validation: ${err.issues.map((i) => i.message).join('; ')}`,
          err.issues
        );
      }

      // Generic upstream service error (sanitized: never echoes keys or prompts)
      throw new GeminiServiceError(`Gemini service error: ${err.message || 'Unknown upstream failure'}`);
    } finally {
      // Resource cleanup: Always cancel timer to prevent lingering handles
      clearTimeout(timeoutId);
    }
  }
}
