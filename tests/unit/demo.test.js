import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getDemoRoastProfile, getDemoNormalizedProfile } from '../../src/fixtures/demo-loader.js';
import { RoastReportSchema } from '../../src/schemas/roast.js';
import { NormalizedViewingProfileSchema } from '../../src/schemas/takeout.js';

describe('Task 3: Bundled Demo Profile & Synthetic Fixtures', () => {
  it('loads the pre-computed demo roast report matching RoastReportSchema (INGEST-04, D-12, D-13)', () => {
    const profile = getDemoRoastProfile();

    expect(profile).toBeDefined();
    expect(profile.viewingArchetype).toBe('The 3 AM Productivity Goblin');
    expect(profile.brainrotScore).toBe(84);

    // Validate using canonical Zod schema
    const parseResult = RoastReportSchema.safeParse(profile);
    expect(parseResult.success).toBe(true);

    // Verify multi-joke variety (AI-03, AI-04)
    expect(profile.roasts.length).toBeGreaterThanOrEqual(4);
    const styles = profile.roasts.map((r) => r.style);
    expect(styles).toContain('combination');
    expect(styles).toContain('specific');
    expect(styles).toContain('pattern');
    expect(styles).toContain('archetype');

    // Verify comedic red flags
    expect(profile.redFlags.length).toBeGreaterThanOrEqual(3);
    expect(profile.redFlags.length).toBeLessThanOrEqual(5);

    // Verify card payload
    expect(profile.cardPayload.tier).toBe('Deep Fried');
    expect(profile.cardPayload.headline).toBe('The 3 AM Productivity Goblin');
  });

  it('verifies synthetic Takeout JSON fixture contains 300–500 realistic records (D-14)', () => {
    const rawContent = readFileSync('fixtures/synthetic-takeout.json', 'utf-8');
    const records = JSON.parse(rawContent);

    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThanOrEqual(300);
    expect(records.length).toBeLessThanOrEqual(500);

    // Inspect sample record fields
    const sample = records[0];
    expect(sample).toHaveProperty('header');
    expect(sample).toHaveProperty('title');
    expect(sample).toHaveProperty('time');
  });

  it('loads demo normalized stats conforming to NormalizedViewingProfileSchema', () => {
    const normalized = getDemoNormalizedProfile();
    const parseResult = NormalizedViewingProfileSchema.safeParse(normalized);

    expect(parseResult.success).toBe(true);
    expect(normalized.totalRecords).toBe(350);
    expect(normalized.deletedVideoCount).toBe(6);
    expect(normalized.topCreators.primary.length).toBe(5);
    expect(normalized.topCreators.secondary.length).toBe(10);
  });
});
