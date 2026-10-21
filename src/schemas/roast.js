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

/**
 * Enhanced Roast Report Schema (D-18)
 * Enforces min 4 jokes, all 4 styles represented, specific joke referencedItem, 3–5 red flags
 */
export const EnhancedRoastReportSchema = RoastReportSchema.extend({
  roasts: z.array(RoastJokeSchema).min(4)
}).superRefine((val, ctx) => {
  const styles = new Set(val.roasts.map((r) => r.style));
  for (const requiredStyle of ['pattern', 'combination', 'specific', 'archetype']) {
    if (!styles.has(requiredStyle)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Roast report must contain at least one joke with style '${requiredStyle}'.`,
        path: ['roasts']
      });
    }
  }

  // Ensure specific jokes have a non-empty referencedItem
  val.roasts.forEach((r, idx) => {
    if (r.style === 'specific') {
      if (!r.referencedItem || typeof r.referencedItem !== 'string' || r.referencedItem.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Specific joke at index ${idx} must specify a non-empty referencedItem.`,
          path: ['roasts', idx, 'referencedItem']
        });
      }
    }
  });
});

/**
 * Full combined roast report output schema pairing the roast narrative with
 * immutable deterministic scoring metrics (D-18, D-19)
 */
export const FullRoastResultSchema = z.object({
  roast: EnhancedRoastReportSchema,
  scoreDetails: BrainrotScoreResultSchema
});

/**
 * Validates that all specific joke referencedItem values are grounded in the provided evidence (D-18)
 *
 * @param {Object} report - Validated roast report
 * @param {Object} allowedEvidence - { creators: string[], titles: string[] }
 * @returns {{ valid: boolean, errors?: string[] }}
 */
export function validateJokeGrounding(report, allowedEvidence = {}) {
  const errors = [];
  const normalizedCreators = (allowedEvidence.creators || []).map((c) => c.trim().toLowerCase());
  const normalizedTitles = (allowedEvidence.titles || []).map((t) => t.trim().toLowerCase());

  for (let i = 0; i < report.roasts.length; i++) {
    const joke = report.roasts[i];
    if (joke.style === 'specific') {
      const ref = (joke.referencedItem || '').trim().toLowerCase();
      if (!ref) {
        errors.push(`Specific joke at index ${i} has empty referencedItem.`);
        continue;
      }

      // Check if ref matches any allowed creator or title (exact match or substring match)
      const matchesCreator = normalizedCreators.some((c) => c.includes(ref) || ref.includes(c));
      const matchesTitle = normalizedTitles.some((t) => t.includes(ref) || ref.includes(t));

      if (!matchesCreator && !matchesTitle) {
        errors.push(
          `Specific joke at index ${i} references item '${joke.referencedItem}', which was not found in the supplied evidence.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
