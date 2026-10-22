import { describe, it, expect } from 'vitest';
import { TakeoutNormalizer } from '../../src/normalizer/takeout-normalizer.js';

describe('Task 1: Statistical Normalizer & Session Clustering', () => {
  it('enforces dynamic creator tiering: top 5 detailed, ranks 6–15 string names only (D-04, NORM-01)', () => {
    const normalizer = new TakeoutNormalizer();

    // Create 16 distinct creators with varying view counts
    for (let c = 1; c <= 16; c++) {
      const creatorName = `Creator ${c.toString().padStart(2, '0')}`;
      const views = 20 - c; // Creator 01 has 19 views, Creator 16 has 4 views
      for (let v = 0; v < views; v++) {
        normalizer.processItem({
          cleanTitle: `Video ${c}-${v}`,
          channel: creatorName,
          time: '2024-03-01T12:00:00.000Z'
        });
      }
    }

    const profile = normalizer.finalize();

    // Top 5 primary
    expect(profile.topCreators.primary).toHaveLength(5);
    expect(profile.topCreators.primary[0].name).toBe('Creator 01');
    expect(profile.topCreators.primary[0].count).toBe(19);
    expect(profile.topCreators.primary[0].share).toBeGreaterThan(0);

    // Ranks 6–15 secondary (10 items, strings only)
    expect(profile.topCreators.secondary).toHaveLength(10);
    expect(profile.topCreators.secondary[0]).toBe('Creator 06');
    expect(typeof profile.topCreators.secondary[0]).toBe('string');
  });

  it('calculates repeated-title metrics with >=3 plays threshold and sum(count - 1) total (D-05, NORM-03)', () => {
    const normalizer = new TakeoutNormalizer();

    // Video A: 4 plays -> replay events = 3. Qualifies for top repeats list (>=3)
    for (let i = 0; i < 4; i++) {
      normalizer.processItem({ cleanTitle: 'Study Beats 24/7', channel: 'Music', time: '2024-03-01T12:00:00.000Z' });
    }

    // Video B: 2 plays -> replay events = 1. Excluded from top repeats list (<3)
    for (let i = 0; i < 2; i++) {
      normalizer.processItem({ cleanTitle: 'Unique Podcast Ep 1', channel: 'Talk', time: '2024-03-01T13:00:00.000Z' });
    }

    // Video C: 1 play -> replay events = 0
    for (let i = 0; i < 15; i++) {
      normalizer.processItem({ cleanTitle: `Single View Video ${i}`, channel: 'Various', time: '2024-03-01T14:00:00.000Z' });
    }

    const profile = normalizer.finalize();

    // totalReplayEvents = (4 - 1) + (2 - 1) = 3 + 1 = 4
    expect(profile.repeatedTitles.totalReplayEvents).toBe(4);
    // topRepeats includes only Video A (>=3 plays)
    expect(profile.repeatedTitles.topRepeats).toHaveLength(1);
    expect(profile.repeatedTitles.topRepeats[0].title).toBe('Study Beats 24/7');
    expect(profile.repeatedTitles.topRepeats[0].count).toBe(4);
  });

  it('tracks 20-minute session delta for rapid-fire clustering (D-07)', () => {
    const normalizer = new TakeoutNormalizer();
    const baseTime = new Date('2024-03-01T00:00:00.000Z').getTime();

    // Video 0 at t=0
    normalizer.processItem({ cleanTitle: 'Video 0', channel: 'Ch', time: new Date(baseTime).toISOString() });
    // Video 1 at t=10 mins (delta = 10 min <= 20 min -> rapid fire!)
    normalizer.processItem({ cleanTitle: 'Video 1', channel: 'Ch', time: new Date(baseTime + 10 * 60000).toISOString() });
    // Video 2 at t=25 mins (delta = 15 min <= 20 min -> rapid fire!)
    normalizer.processItem({ cleanTitle: 'Video 2', channel: 'Ch', time: new Date(baseTime + 25 * 60000).toISOString() });
    // Video 3 at t=90 mins (delta = 65 min > 20 min -> NOT rapid fire)
    normalizer.processItem({ cleanTitle: 'Video 3', channel: 'Ch', time: new Date(baseTime + 90 * 60000).toISOString() });
    // Video 4 at t=105 mins (delta = 15 min <= 20 min -> rapid fire!)
    normalizer.processItem({ cleanTitle: 'Video 4', channel: 'Ch', time: new Date(baseTime + 105 * 60000).toISOString() });

    // Fill up to 20 items so it is not marked insufficient
    for (let i = 5; i < 22; i++) {
      normalizer.processItem({ cleanTitle: `Filler ${i}`, channel: 'Ch', time: new Date(baseTime + i * 3600000).toISOString() });
    }

    const profile = normalizer.finalize();

    // Exactly 3 rapid-fire intervals out of 4 tested
    expect(profile.sessionClusters.rapidFireCount).toBe(3);
  });

  it('prioritizes late-night goblin hours (2 AM–4 AM) and repeat counts (D-06, NORM-02)', () => {
    const normalizer = new TakeoutNormalizer();

    // Title 1: 3 plays at 3 AM (goblin hour + repeated)
    for (let i = 0; i < 3; i++) {
      normalizer.processItem({ cleanTitle: 'Late Night Speedrun', channel: 'Speedruns', time: '2024-03-01T03:15:00.000Z' });
    }

    // Title 2: 1 play at 3 AM (goblin hour)
    normalizer.processItem({ cleanTitle: 'Goblin Solitary Video', channel: 'Creep', time: '2024-03-01T03:45:00.000Z' });

    // Title 3: 1 play at 12 AM (late night, but not goblin hour)
    normalizer.processItem({ cleanTitle: 'Midnight Snack', channel: 'Food', time: '2024-03-01T00:30:00.000Z' });

    // Add daytime videos to cross 20 threshold
    for (let i = 0; i < 20; i++) {
      normalizer.processItem({ cleanTitle: `Daytime ${i}`, channel: 'Work', time: '2024-03-01T14:00:00.000Z' });
    }

    const profile = normalizer.finalize();

    expect(profile.lateNightTitles.length).toBeGreaterThanOrEqual(3);
    // Late Night Speedrun must be first because of repeatCount = 3
    expect(profile.lateNightTitles[0].title).toBe('Late Night Speedrun');
    expect(profile.lateNightTitles[0].derivedHour).toBe('watched around 3 AM');
  });

  it('triggers isInsufficient fallback when valid records < 20 (NORM-05, D-03)', () => {
    const normalizer = new TakeoutNormalizer();

    for (let i = 0; i < 15; i++) {
      normalizer.processItem({ cleanTitle: `Video ${i}`, channel: 'Creator', time: '2024-03-01T12:00:00.000Z' });
    }

    const profile = normalizer.finalize();

    expect(profile.isInsufficient).toBe(true);
    expect(profile.validRecords).toBe(15);
  });

  it('accurately tracks missing timestamps and degradation rate (D-03)', () => {
    const normalizer = new TakeoutNormalizer();

    // 10 items with timestamps
    for (let i = 0; i < 10; i++) {
      normalizer.processItem({ cleanTitle: `With Time ${i}`, channel: 'Ch', time: '2024-03-01T12:00:00.000Z' });
    }

    // 15 items without timestamps
    for (let i = 0; i < 15; i++) {
      normalizer.processItem({ cleanTitle: `No Time ${i}`, channel: 'Ch', time: undefined });
    }

    const profile = normalizer.finalize();

    expect(profile.validRecords).toBe(25);
    expect(profile.dataQuality.missingTimestampCount).toBe(15);
    expect(profile.dataQuality.isDegraded).toBe(true); // >50% missing timestamps
  });
});
