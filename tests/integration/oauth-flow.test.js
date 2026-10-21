import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { GoogleOAuthService, MODE_1_DISCLAIMER } from '../../src/oauth/google-oauth-service.js';
import { RoastGeneratorService } from '../../src/ai/roast-generator-service.js';
import { createMockGeminiClient } from '../helpers/mock-gemini.js';
import { mockSubscriptionsResponse, mockLikedVideosResponse } from '../../fixtures/mock-oauth-data.js';

describe('Mode 1 Google OAuth Quick Roast Flow (API-01, API-03, API-04, SEC-01, TEST-05)', () => {
  let app;
  let mockGeminiClient;

  // Mock fetch implementation for deterministic OAuth and YouTube Data API responses
  const mockFetch = async (url) => {
    const urlStr = String(url);

    if (urlStr.includes('oauth2.googleapis.com/token')) {
      return {
        ok: true,
        json: async () => ({
          access_token: 'ya29.mock_ephemeral_token_1234567890',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      };
    }

    if (urlStr.includes('/subscriptions')) {
      return {
        ok: true,
        json: async () => mockSubscriptionsResponse
      };
    }

    if (urlStr.includes('/videos')) {
      return {
        ok: true,
        json: async () => mockLikedVideosResponse
      };
    }

    return {
      ok: false,
      status: 404,
      text: async () => 'Not Found'
    };
  };

  beforeEach(async () => {
    mockGeminiClient = createMockGeminiClient();
    const roastGeneratorService = new RoastGeneratorService({
      apiKey: 'test-key',
      client: mockGeminiClient
    });

    const googleOAuthService = new GoogleOAuthService({
      clientId: 'test-client-id.apps.googleusercontent.com',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/api/roast/oauth/callback',
      fetchImpl: mockFetch
    });

    app = buildApp({ roastGeneratorService, googleOAuthService });
    await app.ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/roast/oauth/url generates valid Google OAuth authorization URL (API-01, API-03)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/roast/oauth/url?state=test_state_123'
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.url).toBeDefined();
    expect(body.state).toBe('test_state_123');

    // Asserts required OAuth parameters
    expect(body.url).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(body.url).toContain('client_id=test-client-id.apps.googleusercontent.com');
    expect(body.url).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly');
    expect(body.url).toContain('response_type=code');
    expect(body.url).toContain('state=test_state_123');
  });

  it('GET /api/roast/oauth/callback without code returns 400 Bad Request', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/roast/oauth/callback' // missing code
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe('MISSING_CODE');
  });

  it('GET /api/roast/oauth/callback executes Quick Roast with ephemeral token and disclaimer badge (API-03, API-04, SEC-01)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/roast/oauth/callback?code=mock_auth_code_98765&state=test_state_123'
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store, private, max-age=0');

    const body = JSON.parse(res.payload);
    expect(body.roast).toBeDefined();
    expect(body.scoreDetails).toBeDefined();

    // Verify Mode 1 identifier and mandatory disclaimer badge (API-04)
    expect(body.mode).toBe('mode_1_quick_roast');
    expect(body.disclaimer).toBe(MODE_1_DISCLAIMER);
    expect(body.disclaimer).toContain('public subscriptions and liked videos');

    // Ephemeral token guarantee: token must never appear in response payload (API-03)
    const rawPayload = res.payload;
    expect(rawPayload).not.toContain('ya29.');
    expect(rawPayload).not.toContain('mock_ephemeral_token');
    expect(rawPayload).not.toContain('test-client-secret');

    // Verify AI call was dispatched
    expect(mockGeminiClient.calls).toHaveLength(1);
  });

  it('GET /api/roast/oauth/callback handles token exchange failure gracefully and sanitized (SEC-02)', async () => {
    // Failing fetch implementation
    const failingFetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid authorization code'
    });

    const failingOAuthService = new GoogleOAuthService({
      clientId: 'test-client-id',
      clientSecret: 'super-secret-key',
      fetchImpl: failingFetch
    });

    const failingApp = buildApp({
      googleOAuthService: failingOAuthService,
      roastGeneratorService: new RoastGeneratorService({
        apiKey: 'test-key',
        client: mockGeminiClient
      })
    });
    await failingApp.ready();

    const res = await failingApp.inject({
      method: 'GET',
      url: '/api/roast/oauth/callback?code=bad_code'
    });

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.payload);
    expect(body.error).toBeDefined();

    // Sensitive secrets must never appear in error message
    expect(JSON.stringify(body)).not.toContain('super-secret-key');
    expect(body.error.stack).toBeUndefined();

    await failingApp.close();
  });
});
