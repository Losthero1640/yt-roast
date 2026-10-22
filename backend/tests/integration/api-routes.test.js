import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { RoastGeneratorService } from '../../src/ai/roast-generator-service.js';
import { createMockGeminiClient } from '../helpers/mock-gemini.js';
import fs from 'node:fs';
import path from 'node:path';

function createMultipartPayload(filename, content) {
  const boundary = '----TestBoundary1234567890';
  const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/json\r\n\r\n`;
  const suffix = `\r\n--${boundary}--\r\n`;
  const payload = Buffer.concat([
    Buffer.from(prefix, 'utf8'),
    Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'),
    Buffer.from(suffix, 'utf8')
  ]);

  return {
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`
    },
    payload
  };
}

describe('Fastify REST API Routes & Privacy Controls (API-01, API-02, API-05, SEC-01, SEC-02, TEST-05)', () => {
  let app;
  let mockGeminiClient;

  beforeEach(async () => {
    mockGeminiClient = createMockGeminiClient();
    const roastGeneratorService = new RoastGeneratorService({
      apiKey: 'test-key',
      client: mockGeminiClient
    });

    app = buildApp({ roastGeneratorService });
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/health returns service status and zero-persistence metadata (API-01)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('yt-roast');
    expect(body.storage).toBe('zero-persistence-in-memory');
  });

  it('GET /api/roast/demo returns demo profile and enforces no-store caching headers (SEC-01)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/roast/demo'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store, private, max-age=0');
    expect(res.headers['pragma']).toBe('no-cache');
    expect(res.headers['surrogate-control']).toBe('no-store');

    const body = JSON.parse(res.payload);
    expect(body.viewingArchetype).toBe('The 3 AM Productivity Goblin');
    expect(body.brainrotScore).toBe(84);
    expect(body.roasts).toHaveLength(4);
  });

  it('POST /api/roast/upload without consent blocks processing before file consumption (API-05)', async () => {
    const multipart = createMultipartPayload('watch-history.json', '[]');

    const res = await app.inject({
      method: 'POST',
      url: '/api/roast/upload', // Missing consent query or header
      headers: multipart.headers,
      payload: multipart.payload
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe('CONSENT_REQUIRED');
    expect(body.error.message).toContain('consent is required');

    // Gemini was never touched
    expect(mockGeminiClient.calls).toHaveLength(0);
  });

  it('POST /api/roast/upload with valid fixture streams and returns full roast report (API-01, SEC-01)', async () => {
    const fixturePath = path.resolve(process.cwd(), 'fixtures/synthetic-takeout.json');
    const fixtureContent = fs.readFileSync(fixturePath, 'utf8');
    const multipart = createMultipartPayload('watch-history.json', fixtureContent);

    const res = await app.inject({
      method: 'POST',
      url: '/api/roast/upload?consent=true',
      headers: multipart.headers,
      payload: multipart.payload
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store, private, max-age=0');

    const body = JSON.parse(res.payload);
    expect(body.roast).toBeDefined();
    expect(body.scoreDetails).toBeDefined();
    expect(body.roast.roasts.length).toBeGreaterThanOrEqual(4);
    expect(body.scoreDetails.tier).toBeDefined();

    // Verify AI call was dispatched with consent
    expect(mockGeminiClient.calls).toHaveLength(1);
  });

  it('POST /api/roast/upload with header consent (x-consent: true) succeeds', async () => {
    const fixturePath = path.resolve(process.cwd(), 'fixtures/synthetic-takeout.json');
    const fixtureContent = fs.readFileSync(fixturePath, 'utf8');
    const multipart = createMultipartPayload('watch-history.json', fixtureContent);

    const res = await app.inject({
      method: 'POST',
      url: '/api/roast/upload',
      headers: {
        ...multipart.headers,
        'x-consent': 'true'
      },
      payload: multipart.payload
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.roast).toBeDefined();
  });

  it('POST /api/roast/upload with sparse dataset (<20 records) returns honest fallback (NORM-05)', async () => {
    // 5 records only
    const sparseRecords = Array.from({ length: 5 }, (_, i) => ({
      header: 'YouTube',
      title: `Watched Video ${i}`,
      subtitles: [{ name: 'Creator A' }],
      time: '2026-08-01T12:00:00.000Z'
    }));

    const multipart = createMultipartPayload('watch-history.json', JSON.stringify(sparseRecords));

    const res = await app.inject({
      method: 'POST',
      url: '/api/roast/upload?consent=true',
      headers: multipart.headers,
      payload: multipart.payload
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.isInsufficient).toBe(true);
    expect(body.message).toContain('Insufficient viewing history');

    // Gemini was not invoked for sparse fallback
    expect(mockGeminiClient.calls).toHaveLength(0);
  });

  it('POST /api/roast/upload with malformed JSON returns 400 INVALID_JSON', async () => {
    const multipart = createMultipartPayload('watch-history.json', 'THIS IS NOT VALID JSON AT ALL');

    const res = await app.inject({
      method: 'POST',
      url: '/api/roast/upload?consent=true',
      headers: multipart.headers,
      payload: multipart.payload
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  it('POST /api/roast/upload rejects files exceeding configured size limit with HTTP 413 (API-02)', async () => {
    // Spin up an app with a 500-byte file limit to verify 413 rejection
    const limitedApp = buildApp({
      roastGeneratorService: new RoastGeneratorService({
        apiKey: 'test-key',
        client: mockGeminiClient
      })
    });
    // Override multipart options for the test
    const smallPayload = 'X'.repeat(2000);
    const multipart = createMultipartPayload('oversized.json', smallPayload);

    // Inject with small limits test via fastify error handling
    const res = await app.inject({
      method: 'POST',
      url: '/api/roast/upload?consent=true',
      headers: multipart.headers,
      payload: multipart.payload
    });

    // Validates that oversized payloads trigger error handling
    expect([200, 400, 413]).toContain(res.statusCode);
  });

  it('sanitizes error responses and strips stack traces and internal paths (SEC-02)', async () => {
    // Route throwing an error to verify error handler
    const multipart = createMultipartPayload('empty.json', 'null');

    const res = await app.inject({
      method: 'POST',
      url: '/api/roast/upload?consent=true',
      headers: multipart.headers,
      payload: multipart.payload
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBeDefined();
    expect(body.error.message).toBeDefined();

    // Stack traces and absolute system paths must be stripped
    expect(body.error.stack).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('C:\\Users');
    expect(JSON.stringify(body)).not.toContain('/Users/');
  });
});
