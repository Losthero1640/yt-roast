import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildApp } from '../../src/app.js';
import { RoastReportSchema, BrainrotScoreResultSchema } from '../../src/schemas/roast.js';

describe('Task 1: Project Scaffolding & Canonical Schemas', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it('verifies Fastify application factory initializes and responds to /api/health', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.storage).toBe('zero-persistence-in-memory');
  });

  it('guarantees zero database dependencies in package.json (PRIV-01)', () => {
    const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    const forbiddenDbTerms = [
      'mongoose',
      'mongodb',
      'pg',
      'mysql',
      'sqlite',
      'prisma',
      'sequelize',
      'typeorm',
      'redis',
      'knex'
    ];

    for (const dep of Object.keys(allDeps)) {
      for (const term of forbiddenDbTerms) {
        expect(dep.toLowerCase()).not.toContain(term);
      }
    }
  });

  it('validates a compliant RoastReport object using canonical Zod schema (AI-03, D-13)', () => {
    const validReport = {
      brainrotScore: 82,
      viewingArchetype: 'The 3 AM Productivity Goblin',
      roastSummary: 'You watch 4-hour video essays on productivity at 3:45 AM while doing absolutely nothing productive.',
      roasts: [
        {
          style: 'combination',
          joke: 'Nothing says executive optimization like pairing a Huberman cold shower tutorial with a 7-hour Minecraft speedrun.',
          supportingEvidence: 'Observed 18 cold shower videos and 42 speedrun streams between 1 AM and 4 AM.',
          referencedItem: 'Andrew Huberman'
        },
        {
          style: 'specific',
          joke: 'You have watched "Lofi Hip Hop - Beats to Relax/Study to" 34 times. The studying has yet to begin.',
          supportingEvidence: 'Played 34 times across 60 days.',
          referencedItem: 'Lofi Hip Hop - Beats to Relax/Study to'
        }
      ],
      redFlags: [
        'Consistently watches self-help videos exclusively between 2 AM and 5 AM.',
        'Rewatched the same Minecraft parkour compilation 14 times.',
        'Top 5 creators account for over 55% of all viewing time.'
      ],
      finalVerdict: 'Scientifically certified terminal doomscroller who mistakes video consumption for personal growth.',
      cardPayload: {
        brainrotScore: 82,
        tier: 'Deep Fried',
        headline: 'Terminal 3 AM Dopamine Chaser',
        topCrime: 'Watched 14 hours of CEO morning routines during ungodly hours'
      }
    };

    const parsed = RoastReportSchema.safeParse(validReport);
    expect(parsed.success).toBe(true);
  });

  it('rejects an invalid RoastReport missing mandatory fields or invalid joke styles', () => {
    const invalidReport = {
      brainrotScore: 150, // exceeds 100
      viewingArchetype: 'Tester',
      roasts: [
        {
          style: 'unsupported_style', // invalid enum
          joke: 'invalid',
          supportingEvidence: 'none'
        }
      ]
    };

    const parsed = RoastReportSchema.safeParse(invalidReport);
    expect(parsed.success).toBe(false);
  });

  it('validates BrainrotScoreResult schema for both full and degraded quality cases (D-03)', () => {
    const fullResult = {
      score: 75,
      tier: 'Deep Fried',
      confidence: 'high',
      subscores: {
        lateNight: 80,
        repetition: 70,
        velocity: 75
      },
      dataQuality: {
        totalRecords: 450,
        validRecords: 420,
        missingTimestampCount: 10,
        timestampValidityRate: 0.976,
        isDegraded: false
      }
    };

    const degradedResult = {
      score: 55,
      tier: 'Slime Brain',
      confidence: 'low',
      subscores: {
        lateNight: null,
        repetition: 55,
        velocity: null
      },
      dataQuality: {
        totalRecords: 120,
        validRecords: 110,
        missingTimestampCount: 95,
        timestampValidityRate: 0.136,
        isDegraded: true,
        degradedNotice: 'Score calculated on creator and title repetition only; time metrics unobserved.'
      }
    };

    expect(BrainrotScoreResultSchema.safeParse(fullResult).success).toBe(true);
    expect(BrainrotScoreResultSchema.safeParse(degradedResult).success).toBe(true);
  });
});
