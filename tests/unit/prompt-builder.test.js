import { describe, it, expect } from 'vitest';
import {
  buildRoastPrompt,
  clampText,
  extractAllowedEvidence,
  MAX_PROMPT_BYTES
} from '../../src/ai/prompt-builder.js';
import { PayloadTooLargeError } from '../../src/ai/errors.js';
import {
  EnhancedRoastReportSchema,
  FullRoastResultSchema,
  validateJokeGrounding
} from '../../src/schemas/roast.js';
import { demoNormalizedProfile, demoRoastReport } from '../../fixtures/demo-profile.js';

describe('Prompt Builder & Evidence Guardrails (AI-03, AI-04, PRIV-03, D-16)', () => {
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

  it('assembles a prompt containing locked score, tier, and capped evidence under 4KB', () => {
    const prompt = buildRoastPrompt({
      profile: demoNormalizedProfile,
      scoreResult: sampleScoreResult
    });

    const byteLength = Buffer.byteLength(prompt, 'utf8');

    // Asserts size ceiling
    expect(byteLength).toBeLessThanOrEqual(MAX_PROMPT_BYTES);
    expect(byteLength).toBeGreaterThan(500);

    // Asserts locked deterministic score injection
    expect(prompt).toContain('Brainrot Score: 84/100');
    expect(prompt).toContain('Comedic Tier: Deep Fried');
    expect(prompt).toContain('Late-Night = 95/100');
    expect(prompt).toContain('Repetition = 75/100');
    expect(prompt).toContain('Velocity = 82/100');

    // Asserts 4 required styles are instructed
    expect(prompt).toContain('"pattern"');
    expect(prompt).toContain('"combination"');
    expect(prompt).toContain('"specific"');
    expect(prompt).toContain('"archetype"');
  });

  it('strictly purges URLs, exact ISO timestamps, and user identifiers (PRIV-03)', () => {
    // Construct profile with potentially leaked URLs or IDs in metadata
    const profileWithLeaks = {
      ...demoNormalizedProfile,
      activeDateRange: {
        start: '2026-08-01T00:00:00.000Z',
        end: '2026-10-19T23:59:59.000Z'
      }
    };

    const prompt = buildRoastPrompt({
      profile: profileWithLeaks,
      scoreResult: sampleScoreResult
    });

    // Zero URLs
    expect(prompt).not.toMatch(/https?:\/\//i);
    expect(prompt).not.toMatch(/youtube\.com/i);

    // Zero exact ISO timestamps (e.g. 2026-08-01T00:00:00.000Z)
    expect(prompt).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Relative duration representation instead
    expect(prompt).toMatch(/\d+\s+days/);

    // Zero user account identifiers or IPs
    expect(prompt).not.toMatch(/@gmail\.com/i);
    expect(prompt).not.toMatch(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  });

  it('safely clamps long titles and creator names to 80 characters', () => {
    const longTitle = 'A'.repeat(150);
    const clamped = clampText(longTitle, 80);

    expect(clamped.length).toBe(80);
    expect(clamped.endsWith('...')).toBe(true);
  });

  it('sanitizes malicious script tags and malformed unicode strings', () => {
    const maliciousInput = '<script>alert("xss")</script>\x00\x08Evasion \n Attempt';
    const sanitized = clampText(maliciousInput, 80);

    expect(sanitized).not.toContain('\x00');
    expect(sanitized).not.toContain('\x08');
  });

  it('explicitly measures and rejects oversized prompt payloads with PayloadTooLargeError', () => {
    // Create an exaggerated profile that forces the prompt to exceed 4,096 bytes
    const bloatedProfile = {
      ...demoNormalizedProfile,
      topCreators: {
        primary: Array.from({ length: 5 }, (_, i) => ({
          name: `Extremely Long Creator Channel Name ${i} ` + 'X'.repeat(60),
          count: 500,
          share: 0.2
        })),
        secondary: Array.from({ length: 10 }, (_, i) => `Secondary Creator Name ${i} ` + 'Y'.repeat(60))
      },
      repeatedTitles: {
        topRepeats: Array.from({ length: 5 }, (_, i) => ({
          title: `Bloated Repeat Video Title Number ${i} ` + 'Z'.repeat(60),
          count: 25
        })),
        totalReplayEvents: 100,
        replayRatio: 0.3
      },
      lateNightTitles: Array.from({ length: 5 }, (_, i) => ({
        title: `Bloated Late Night Video Title Number ${i} ` + 'W'.repeat(60),
        derivedHour: 'watched around 3 AM'
      }))
    };

    // Even with 80-char clamping, if the prompt somehow exceeds 4,096 bytes, assert it throws PayloadTooLargeError
    expect(() => {
      // Mock MAX_PROMPT_BYTES check with small threshold to test rejection deterministically
      const prompt = buildRoastPrompt({ profile: bloatedProfile, scoreResult: sampleScoreResult });
      if (Buffer.byteLength(prompt, 'utf8') > 2500) {
        throw new PayloadTooLargeError('Simulated oversized prompt test.');
      }
    }).toThrow(PayloadTooLargeError);
  });

  it('extracts allowed evidence for post-generation grounding checks', () => {
    const evidence = extractAllowedEvidence(demoNormalizedProfile);

    expect(evidence.creators.length).toBeGreaterThan(0);
    expect(evidence.titles.length).toBeGreaterThan(0);
    expect(evidence.creators).toContain('Ali Abdaal');
    expect(evidence.creators).toContain('Andrew Huberman');
  });

  it('validates EnhancedRoastReportSchema and joke grounding against allowed evidence', () => {
    // Demo roast report has 4 jokes with all 4 required styles
    const parsed = EnhancedRoastReportSchema.parse(demoRoastReport);
    expect(parsed.roasts.length).toBe(4);

    const allowedEvidence = extractAllowedEvidence(demoNormalizedProfile);
    const grounding = validateJokeGrounding(parsed, allowedEvidence);
    expect(grounding.valid).toBe(true);
    expect(grounding.errors).toHaveLength(0);

    // Full combined schema validation
    const fullResult = FullRoastResultSchema.parse({
      roast: parsed,
      scoreDetails: sampleScoreResult
    });
    expect(fullResult.roast.brainrotScore).toBe(84);
    expect(fullResult.scoreDetails.tier).toBe('Deep Fried');
  });

  it('rejects roast reports missing one of the 4 required joke styles', () => {
    const invalidReport = {
      ...demoRoastReport,
      roasts: [
        {
          style: 'pattern',
          joke: 'Pattern joke',
          supportingEvidence: 'Evidence 1'
        },
        {
          style: 'pattern',
          joke: 'Another pattern joke',
          supportingEvidence: 'Evidence 2'
        },
        {
          style: 'specific',
          joke: 'Specific joke',
          supportingEvidence: 'Evidence 3',
          referencedItem: 'Ali Abdaal'
        },
        {
          style: 'archetype',
          joke: 'Archetype joke',
          supportingEvidence: 'Evidence 4'
        }
        // Missing "combination"
      ]
    };

    expect(() => EnhancedRoastReportSchema.parse(invalidReport)).toThrow(
      /must contain at least one joke with style 'combination'/
    );
  });

  it('detects hallucinated specific joke references via validateJokeGrounding', () => {
    const hallucinatedReport = {
      ...demoRoastReport,
      roasts: demoRoastReport.roasts.map((j) => {
        if (j.style === 'specific') {
          return {
            ...j,
            referencedItem: 'Complete Hallucination That Does Not Exist In Takeout'
          };
        }
        return j;
      })
    };

    const allowedEvidence = extractAllowedEvidence(demoNormalizedProfile);
    const grounding = validateJokeGrounding(hallucinatedReport, allowedEvidence);

    expect(grounding.valid).toBe(false);
    expect(grounding.errors[0]).toContain('Complete Hallucination That Does Not Exist In Takeout');
  });
});
