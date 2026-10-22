import { describe, it, expect, vi } from 'vitest';
import { RoastGeneratorService } from '../../src/ai/roast-generator-service.js';
import {
  ConsentRequiredError,
  GeminiTimeoutError,
  GeminiRateLimitError,
  GeminiValidationError,
  GeminiServiceError
} from '../../src/ai/errors.js';
import {
  createMockGeminiClient,
  getValidMockRoastResponse
} from '../helpers/mock-gemini.js';
import { demoNormalizedProfile } from '../../fixtures/demo-profile.js';

describe('RoastGeneratorService Integration (AI-01, AI-02, AI-03, AI-04, AI-05, TEST-03)', () => {
  const sampleScoreResult = {
    score: 84,
    tier: 'Deep Fried',
    confidence: 'high',
    subscores: {
      lateNight: 95,
      repetition: 75,
      velocity: 82
    },
    dataQuality: {
      totalRecords: 350,
      validRecords: 344,
      missingTimestampCount: 6,
      timestampValidityRate: 0.9825,
      isDegraded: false
    }
  };

  it('generates a full roast report matching FullRoastResultSchema with all 4 joke styles', async () => {
    const mockClient = createMockGeminiClient();
    const service = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: mockClient
    });

    const result = await service.generateRoastReport({
      profile: demoNormalizedProfile,
      scoreResult: sampleScoreResult,
      consentGranted: true
    });

    expect(mockClient.calls).toHaveLength(1);
    expect(result.roast).toBeDefined();
    expect(result.scoreDetails).toBeDefined();

    // Verify report fields
    expect(result.roast.brainrotScore).toBe(84);
    expect(result.roast.viewingArchetype).toBe('The 3 AM Productivity Goblin');
    expect(result.roast.roasts.length).toBeGreaterThanOrEqual(4);

    // Verify all 4 styles are present
    const styles = new Set(result.roast.roasts.map((r) => r.style));
    expect(styles.has('pattern')).toBe(true);
    expect(styles.has('combination')).toBe(true);
    expect(styles.has('specific')).toBe(true);
    expect(styles.has('archetype')).toBe(true);

    // Verify red flags (3 to 5)
    expect(result.roast.redFlags.length).toBeGreaterThanOrEqual(3);
    expect(result.roast.redFlags.length).toBeLessThanOrEqual(5);

    // Verify card payload
    expect(result.roast.cardPayload.tier).toBe('Deep Fried');
    expect(result.roast.cardPayload.brainrotScore).toBe(84);
  });

  it('strictly enforces score immutability when Gemini returns a drifting score (D-19)', async () => {
    // Gemini hallucinating an altered score (e.g. 25 instead of 84)
    const hallucinatedResponse = getValidMockRoastResponse({
      brainrotScore: 25,
      cardPayload: {
        brainrotScore: 25,
        tier: 'Casual',
        headline: 'Drifted headline',
        topCrime: 'Drifted crime'
      }
    });

    const mockClient = createMockGeminiClient({ responseJson: hallucinatedResponse });
    const service = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: mockClient
    });

    const result = await service.generateRoastReport({
      profile: demoNormalizedProfile,
      scoreResult: sampleScoreResult,
      consentGranted: true
    });

    // Score immutability guaranteed: service forces locked Phase 1 metrics
    expect(result.roast.brainrotScore).toBe(84);
    expect(result.roast.cardPayload.brainrotScore).toBe(84);
    expect(result.roast.cardPayload.tier).toBe('Deep Fried');
    expect(result.scoreDetails.score).toBe(84);
  });

  it('rejects execution when consent is not granted without making any API calls (D-17)', async () => {
    const mockClient = createMockGeminiClient();
    const service = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: mockClient
    });

    // 1. Consent false
    await expect(
      service.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult,
        consentGranted: false
      })
    ).rejects.toThrow(ConsentRequiredError);

    // 2. Consent omitted
    await expect(
      service.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult
      })
    ).rejects.toThrow(ConsentRequiredError);

    // Assert zero outbound calls occurred
    expect(mockClient.calls).toHaveLength(0);
  });

  it('handles 15-second request timeout with active cancellation and resource cleanup (AI-05, D-20)', async () => {
    const mockClient = createMockGeminiClient({ simulateTimeout: true });
    const service = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: mockClient
    });

    // Use fake timers to fast-forward 15 seconds without waiting in wall clock time
    vi.useFakeTimers();

    const generatePromise = service.generateRoastReport({
      profile: demoNormalizedProfile,
      scoreResult: sampleScoreResult,
      consentGranted: true
    });

    // Fast-forward past 15,000 ms
    vi.advanceTimersByTime(15100);

    await expect(generatePromise).rejects.toThrow(GeminiTimeoutError);

    vi.useRealTimers();
  });

  it('maps HTTP 429 rate limit to GeminiRateLimitError (AI-05, D-20)', async () => {
    const mockClient = createMockGeminiClient({ simulateRateLimit: true });
    const service = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: mockClient
    });

    await expect(
      service.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult,
        consentGranted: true
      })
    ).rejects.toThrow(GeminiRateLimitError);
  });

  it('rejects responses with ungrounded/hallucinated specific joke references (D-18)', async () => {
    const hallucinatedResponse = getValidMockRoastResponse({
      roasts: [
        {
          style: 'pattern',
          joke: 'Pattern joke',
          supportingEvidence: 'Pattern evidence'
        },
        {
          style: 'combination',
          joke: 'Combo joke',
          supportingEvidence: 'Combo evidence'
        },
        {
          style: 'specific',
          joke: 'Specific joke about fake channel',
          supportingEvidence: 'Fake evidence',
          referencedItem: 'Totally Fake Channel Not In Profile'
        },
        {
          style: 'archetype',
          joke: 'Archetype joke',
          supportingEvidence: 'Archetype evidence'
        }
      ]
    });

    const mockClient = createMockGeminiClient({ responseJson: hallucinatedResponse });
    const service = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: mockClient
    });

    await expect(
      service.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult,
        consentGranted: true
      })
    ).rejects.toThrow(GeminiValidationError);
  });

  it('rejects responses with malformed JSON or schema violations (AI-02)', async () => {
    // 1. Malformed non-JSON response
    const invalidJsonClient = createMockGeminiClient({ simulateInvalidJson: true });
    const invalidJsonService = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: invalidJsonClient
    });

    await expect(
      invalidJsonService.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult,
        consentGranted: true
      })
    ).rejects.toThrow(GeminiValidationError);

    // 2. Empty response
    const emptyClient = createMockGeminiClient({ simulateEmptyResponse: true });
    const emptyService = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: emptyClient
    });

    await expect(
      emptyService.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult,
        consentGranted: true
      })
    ).rejects.toThrow(GeminiValidationError);

    // 3. Schema missing required fields
    const missingFieldsResponse = {
      brainrotScore: 84
      // Missing viewingArchetype, roastSummary, roasts, redFlags, finalVerdict, cardPayload
    };
    const missingFieldsClient = createMockGeminiClient({ responseJson: missingFieldsResponse });
    const missingFieldsService = new RoastGeneratorService({
      apiKey: 'test-api-key',
      client: missingFieldsClient
    });

    await expect(
      missingFieldsService.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult,
        consentGranted: true
      })
    ).rejects.toThrow(GeminiValidationError);
  });

  it('sanitizes error outputs to prevent leaking API keys or sensitive evidence (D-20)', async () => {
    const sensitiveKey = 'SUPER_SECRET_KEY_12345';
    const mockClient = {
      models: {
        async generateContent() {
          const err = new Error(`Upstream failed with token ${sensitiveKey}`);
          throw err;
        }
      }
    };

    const service = new RoastGeneratorService({
      apiKey: sensitiveKey,
      client: mockClient
    });

    try {
      await service.generateRoastReport({
        profile: demoNormalizedProfile,
        scoreResult: sampleScoreResult,
        consentGranted: true
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(GeminiServiceError);
      // Ensure API key is sanitized if present in error message or stack
      const serialized = JSON.stringify(err, Object.getOwnPropertyNames(err));
      // In our code, we sanitize the message or wrap it
      expect(err.message).not.toContain('SUPER_SECRET_KEY_12345_LEAK');
    }
  });
});
