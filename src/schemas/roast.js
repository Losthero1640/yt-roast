import { z } from 'zod';

/**
 * Comedic joke styles enforced across roast reports
 */
export const RoastJokeStyleEnum = z.enum([
  'pattern',
  'combination',
  'specific',
  'archetype'
]);

/**
 * Individual structured joke schema
 */
export const RoastJokeSchema = z.object({
  style: RoastJokeStyleEnum,
  joke: z.string().min(1),
  supportingEvidence: z.string().min(1),
  referencedItem: z.string().optional()
});

/**
 * Comedic Brainrot tiers
 */
export const BrainrotTierEnum = z.enum([
  'Monk',
  'Casual',
  'Slime Brain',
  'Deep Fried',
  'Digital Zombie',
  'Unranked'
]);

/**
 * Data confidence grades
 */
export const BrainrotConfidenceEnum = z.enum([
  'high',
  'medium',
  'low'
]);

/**
 * Shareable card payload
 */
export const CardPayloadSchema = z.object({
  brainrotScore: z.number().int().min(0).max(100),
  tier: BrainrotTierEnum,
  headline: z.string().min(1),
  topCrime: z.string().min(1)
});

/**
 * Canonical Roast Report Schema (matching requirement AI-03)
 */
export const RoastReportSchema = z.object({
  brainrotScore: z.number().int().min(0).max(100),
  viewingArchetype: z.string().min(1),
  roastSummary: z.string().min(1),
  roasts: z.array(RoastJokeSchema).min(1),
  redFlags: z.array(z.string().min(1)).min(3).max(5),
  finalVerdict: z.string().min(1),
  cardPayload: CardPayloadSchema
});

/**
 * Canonical Brainrot Scoring Result Schema (D-01, D-02, D-03)
 */
export const BrainrotScoreResultSchema = z.object({
  score: z.number().int().min(0).max(100).nullable(),
  tier: BrainrotTierEnum,
  confidence: BrainrotConfidenceEnum,
  subscores: z.object({
    lateNight: z.number().int().min(0).max(100).nullable(),
    repetition: z.number().int().min(0).max(100).nullable(),
    velocity: z.number().int().min(0).max(100).nullable()
  }),
  dataQuality: z.object({
    totalRecords: z.number().int().nonnegative(),
    validRecords: z.number().int().nonnegative(),
    missingTimestampCount: z.number().int().nonnegative(),
    timestampValidityRate: z.number().min(0).max(1),
    isDegraded: z.boolean(),
    degradedNotice: z.string().optional()
  })
});
