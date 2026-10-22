import { BrainrotScoreResultSchema } from '../schemas/roast.js';

/**
 * Maps a numeric 0–100 Brainrot score to its corresponding comedic tier (D-02)
 *
 * @param {number | null} score
 * @returns {"Monk" | "Casual" | "Slime Brain" | "Deep Fried" | "Digital Zombie" | "Unranked"}
 */
export function mapScoreToTier(score) {
  if (score === null || typeof score !== 'number' || Number.isNaN(score)) {
    return 'Unranked';
  }
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  if (clamped <= 19) return 'Monk';
  if (clamped <= 44) return 'Casual';
  if (clamped <= 69) return 'Slime Brain';
  if (clamped <= 89) return 'Deep Fried';
  return 'Digital Zombie';
}

/**
 * Calculates late-night subscore S_late (0–100)
 * Baseline: <= 5% -> 0 pts; Ceiling: >= 25% -> 100 pts (D-01)
 *
 * @param {number} lateNightRatio
 * @returns {number}
 */
export function calculateLateNightSubscore(lateNightRatio) {
  if (lateNightRatio <= 0.05) return 0;
  if (lateNightRatio >= 0.25) return 100;
  return Math.min(100, Math.max(0, Math.round(((lateNightRatio - 0.05) / 0.20) * 100)));
}

/**
 * Calculates repetition subscore S_rep (0–100)
 * 20% Creator Dominance (15%–50%) + 15% Title Re-watches (2%–12%) (D-01)
 *
 * @param {number} top5CreatorShare
 * @param {number} titleReplayRatio
 * @returns {{ creatorSubscore: number, titleSubscore: number, combinedRepetition: number }}
 */
export function calculateRepetitionSubscore(top5CreatorShare, titleReplayRatio) {
  // Creator Dominance: normal <= 15%, extreme >= 50%
  let sCreator = 0;
  if (top5CreatorShare <= 0.15) {
    sCreator = 0;
  } else if (top5CreatorShare >= 0.50) {
    sCreator = 100;
  } else {
    sCreator = Math.min(100, Math.max(0, Math.round(((top5CreatorShare - 0.15) / 0.35) * 100)));
  }

  // Title Re-watch: normal <= 2%, extreme >= 12%
  let sTitle = 0;
  if (titleReplayRatio <= 0.02) {
    sTitle = 0;
  } else if (titleReplayRatio >= 0.12) {
    sTitle = 100;
  } else {
    sTitle = Math.min(100, Math.max(0, Math.round((titleReplayRatio / 0.12) * 100)));
  }

  // Weighted combined: (20 * sCreator + 15 * sTitle) / 35
  const combinedRepetition = Math.min(
    100,
    Math.max(0, Math.round((sCreator * 20 + sTitle * 15) / 35))
  );

  return {
    creatorSubscore: sCreator,
    titleSubscore: sTitle,
    combinedRepetition
  };
}

/**
 * Calculates watch velocity subscore S_vel (0–100)
 * Normal <= 15%, severe doomscrolling >= 60% (D-01)
 *
 * @param {number} rapidFireRatio
 * @returns {number}
 */
export function calculateVelocitySubscore(rapidFireRatio) {
  if (rapidFireRatio <= 0.15) return 0;
  if (rapidFireRatio >= 0.60) return 100;
  return Math.min(100, Math.max(0, Math.round(((rapidFireRatio - 0.15) / 0.45) * 100)));
}

/**
 * Calculates deterministic Brainrot score and applies 4-case missing-data renormalization matrix (D-01, D-02, D-03)
 *
 * @param {Object} profile - Normalized viewing profile from TakeoutNormalizer
 * @returns {import('../schemas/roast.js').BrainrotScoreResult}
 */
export function calculateBrainrotScore(profile) {
  const totalRecords = profile.totalRecords || 0;
  const validRecords = profile.validRecords || 0;
  const missingTimestampCount =
    profile.dataQuality?.missingTimestampCount ?? validRecords;
  const validTimestamps = validRecords - missingTimestampCount;
  const timestampValidityRate =
    validRecords > 0 ? Number((validTimestamps / validRecords).toFixed(4)) : 0;

  // Case D: Sparse Dataset (<20 valid records) -> NORM-05 honest fallback
  if (validRecords < 20 || profile.isInsufficient) {
    return BrainrotScoreResultSchema.parse({
      score: null,
      tier: 'Unranked',
      confidence: 'low',
      subscores: {
        lateNight: null,
        repetition: null,
        velocity: null
      },
      dataQuality: {
        totalRecords,
        validRecords,
        missingTimestampCount,
        timestampValidityRate,
        isDegraded: true,
        degradedNotice: 'Insufficient viewing history (minimum 20 valid records required).'
      }
    });
  }

  // 1. Compute Repetition Subscore (always available if validRecords >= 20)
  const top5Views = (profile.topCreators?.primary || []).reduce(
    (sum, creator) => sum + (creator.count || 0),
    0
  );
  const top5Share = validRecords > 0 ? top5Views / validRecords : 0;
  const titleReplayRatio = profile.repeatedTitles?.replayRatio ?? 0;
  const { combinedRepetition: sRep } = calculateRepetitionSubscore(
    top5Share,
    titleReplayRatio
  );

  // Check timestamp degradation: <20 valid timestamps OR >50% missing timestamps
  const isTimeDegraded =
    validTimestamps < 20 || (validRecords > 0 && missingTimestampCount / validRecords > 0.5);

  // Case B: Degraded Timestamps (time metrics unobserved)
  if (isTimeDegraded) {
    const finalScore = sRep;
    return BrainrotScoreResultSchema.parse({
      score: finalScore,
      tier: mapScoreToTier(finalScore),
      confidence: 'low',
      subscores: {
        lateNight: null,
        repetition: sRep,
        velocity: null
      },
      dataQuality: {
        totalRecords,
        validRecords,
        missingTimestampCount,
        timestampValidityRate,
        isDegraded: true,
        degradedNotice:
          'Score calculated on creator and title repetition only; time metrics unobserved.'
      }
    });
  }

  // Timestamps are valid (>= 20)
  const lateNightRatio = profile.viewingHours?.lateNightRatio ?? 0;
  const sLate = calculateLateNightSubscore(lateNightRatio);

  const timestampIntervals = Math.max(0, validTimestamps - 1);
  const rapidFireRatio = profile.sessionClusters?.rapidFireRatio ?? 0;

  // Case C: Single Video / No consecutive intervals (<2 intervals)
  if (timestampIntervals < 2) {
    // Renormalize 50% late night, 50% repetition
    const finalScore = Math.min(
      100,
      Math.max(0, Math.round(sLate * 0.50 + sRep * 0.50))
    );
    return BrainrotScoreResultSchema.parse({
      score: finalScore,
      tier: mapScoreToTier(finalScore),
      confidence: 'medium',
      subscores: {
        lateNight: sLate,
        repetition: sRep,
        velocity: null
      },
      dataQuality: {
        totalRecords,
        validRecords,
        missingTimestampCount,
        timestampValidityRate,
        isDegraded: true,
        degradedNotice: 'Session velocity omitted due to isolated timestamps.'
      }
    });
  }

  // Case A: Full Data (35% late night, 35% repetition, 30% velocity)
  const sVel = calculateVelocitySubscore(rapidFireRatio);
  const finalScore = Math.min(
    100,
    Math.max(0, Math.round(sLate * 0.35 + sRep * 0.35 + sVel * 0.30))
  );

  return BrainrotScoreResultSchema.parse({
    score: finalScore,
    tier: mapScoreToTier(finalScore),
    confidence: 'high',
    subscores: {
      lateNight: sLate,
      repetition: sRep,
      velocity: sVel
    },
    dataQuality: {
      totalRecords,
      validRecords,
      missingTimestampCount,
      timestampValidityRate,
      isDegraded: false
    }
  });
}
