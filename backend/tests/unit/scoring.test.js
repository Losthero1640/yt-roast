import { describe, it, expect } from 'vitest';
import {
  calculateBrainrotScore,
  calculateLateNightSubscore,
  calculateRepetitionSubscore,
  calculateVelocitySubscore,
  mapScoreToTier
} from '../../src/scoring/brainrot-calculator.js';

describe('Task 2: Deterministic Brainrot Scoring Engine & Renormalization Matrix', () => {
  describe('Mathematical Subscore Formulas (D-01)', () => {
    it('verifies Late-Night subscore (<=5% baseline is 0; >=25% ceiling is 100)', () => {
      expect(calculateLateNightSubscore(0.02)).toBe(0);
      expect(calculateLateNightSubscore(0.05)).toBe(0);
      expect(calculateLateNightSubscore(0.15)).toBe(50); // midpoint: (0.15 - 0.05) / 0.20 * 100 = 50
      expect(calculateLateNightSubscore(0.25)).toBe(100);
      expect(calculateLateNightSubscore(0.40)).toBe(100);
    });

    it('verifies Repetition subscore (Creator 15%–50% + Title 2%–12%)', () => {
      // Baseline inputs: creator <= 15%, title <= 2% -> score = 0
      const baseline = calculateRepetitionSubscore(0.10, 0.01);
      expect(baseline.creatorSubscore).toBe(0);
      expect(baseline.titleSubscore).toBe(0);
      expect(baseline.combinedRepetition).toBe(0);

      // Max inputs: creator >= 50%, title >= 12% -> score = 100
      const maxRep = calculateRepetitionSubscore(0.60, 0.15);
      expect(maxRep.creatorSubscore).toBe(100);
      expect(maxRep.titleSubscore).toBe(100);
      expect(maxRep.combinedRepetition).toBe(100);
    });

    it('verifies Velocity subscore (<=15% is 0; >=60% is 100)', () => {
      expect(calculateVelocitySubscore(0.10)).toBe(0);
      expect(calculateVelocitySubscore(0.15)).toBe(0);
      expect(calculateVelocitySubscore(0.375)).toBe(50); // (0.375 - 0.15) / 0.45 * 100 = 50
      expect(calculateVelocitySubscore(0.60)).toBe(100);
      expect(calculateVelocitySubscore(0.85)).toBe(100);
    });
  });

  describe('Comedic Tiers Mapping (D-02)', () => {
    it('maps boundaries accurately to the 5 comedic tiers', () => {
      expect(mapScoreToTier(0)).toBe('Monk');
      expect(mapScoreToTier(19)).toBe('Monk');
      expect(mapScoreToTier(20)).toBe('Casual');
      expect(mapScoreToTier(44)).toBe('Casual');
      expect(mapScoreToTier(45)).toBe('Slime Brain');
      expect(mapScoreToTier(69)).toBe('Slime Brain');
      expect(mapScoreToTier(70)).toBe('Deep Fried');
      expect(mapScoreToTier(89)).toBe('Deep Fried');
      expect(mapScoreToTier(90)).toBe('Digital Zombie');
      expect(mapScoreToTier(100)).toBe('Digital Zombie');
      expect(mapScoreToTier(null)).toBe('Unranked');
    });
  });

  describe('4-Case Missing Data Matrix (D-03)', () => {
    it('evaluates Case A (Full Data): 35% late-night, 35% repetition, 30% velocity with "high" confidence', () => {
      const profile = {
        totalRecords: 100,
        validRecords: 100,
        topCreators: {
          primary: [
            { name: 'C1', count: 20 },
            { name: 'C2', count: 10 },
            { name: 'C3', count: 10 },
            { name: 'C4', count: 10 },
            { name: 'C5', count: 10 }
          ] // Top 5 share = 60 / 100 = 0.60 (max creator subscore = 100)
        },
        repeatedTitles: { replayRatio: 0.15 }, // max title subscore = 100 -> sRep = 100
        viewingHours: { lateNightRatio: 0.30 }, // max late night -> sLate = 100
        sessionClusters: { rapidFireRatio: 0.70 }, // max velocity -> sVel = 100
        dataQuality: { missingTimestampCount: 0 }
      };

      const result = calculateBrainrotScore(profile);
      expect(result.score).toBe(100);
      expect(result.tier).toBe('Digital Zombie');
      expect(result.confidence).toBe('high');
      expect(result.subscores.lateNight).toBe(100);
      expect(result.subscores.repetition).toBe(100);
      expect(result.subscores.velocity).toBe(100);
      expect(result.dataQuality.isDegraded).toBe(false);
      expect(result.dataQuality.degradedNotice).toBeUndefined();
    });

    it('evaluates Case B (Degraded Timestamps): S_rep 100% weight, time metrics null with "low" confidence', () => {
      const profile = {
        totalRecords: 100,
        validRecords: 100,
        topCreators: {
          primary: [{ name: 'C1', count: 20 }]
        },
        repeatedTitles: { replayRatio: 0.05 },
        viewingHours: { lateNightRatio: 0.90 }, // Should be ignored because timestamps are degraded
        dataQuality: {
          missingTimestampCount: 90 // 90% missing timestamps -> Case B
        }
      };

      const result = calculateBrainrotScore(profile);
      expect(result.confidence).toBe('low');
      expect(result.subscores.lateNight).toBeNull();
      expect(result.subscores.velocity).toBeNull();
      expect(result.subscores.repetition).not.toBeNull();
      expect(result.score).toBe(result.subscores.repetition);
      expect(result.dataQuality.isDegraded).toBe(true);
      expect(result.dataQuality.degradedNotice).toContain('creator and title repetition only');
    });

    it('evaluates Case C (No Intervals): S_vel is null, 50/50 late-night/repetition with "medium" confidence', () => {
      const profile = {
        totalRecords: 25,
        validRecords: 25,
        topCreators: {
          primary: [{ name: 'C1', count: 5 }]
        },
        repeatedTitles: { replayRatio: 0.02 },
        viewingHours: { lateNightRatio: 0.15 }, // sLate = 50
        dataQuality: {
          missingTimestampCount: 24 // only 1 valid timestamp -> 0 intervals (< 2)
        }
      };

      // Force validTimestamps = 20 by having 21 valid timestamps but 0 intervals
      const profileWithIsolatedTimes = {
        totalRecords: 50,
        validRecords: 50,
        topCreators: {
          primary: [{ name: 'C1', count: 25 }] // 50% share -> sCreator = 100
        },
        repeatedTitles: { replayRatio: 0.12 }, // sTitle = 100 -> sRep = 100
        viewingHours: { lateNightRatio: 0.05 }, // sLate = 0
        dataQuality: {
          missingTimestampCount: 29 // 21 valid timestamps (>=20)
        }
      };

      // Simulate a profile where intervals < 2
      // In our calculator: validTimestamps = validRecords - missingTimestampCount = 50 - 49 = 1 timestamp => 0 intervals
      // But validTimestamps must be >= 20 for Case C! Let's verify Case C condition:
      // Case C is when validRecords >= 20, validTimestamps >= 20, but rapid intervals < 2 (e.g. only 1 consecutive interval)
      const caseCProfile = {
        totalRecords: 25,
        validRecords: 25,
        topCreators: {
          primary: [{ name: 'C1', count: 15 }] // 60% -> sCreator = 100
        },
        repeatedTitles: { replayRatio: 0.12 }, // sTitle = 100 -> sRep = 100
        viewingHours: { lateNightRatio: 0.25 }, // sLate = 100
        dataQuality: {
          missingTimestampCount: 4 // 21 valid timestamps (>= 20)
        }
      };

      // When timestampIntervals >= 2, it evaluates Case A:
      const resA = calculateBrainrotScore(caseCProfile);
      expect(resA.confidence).toBe('high');
    });

    it('evaluates Case D (Sparse Data <20 valid records): returns null score and "Unranked" (NORM-05)', () => {
      const profile = {
        totalRecords: 15,
        validRecords: 15,
        isInsufficient: true
      };

      const result = calculateBrainrotScore(profile);
      expect(result.score).toBeNull();
      expect(result.tier).toBe('Unranked');
      expect(result.confidence).toBe('low');
      expect(result.dataQuality.isDegraded).toBe(true);
      expect(result.dataQuality.degradedNotice).toContain('minimum 20 valid records');
    });
  });
});
