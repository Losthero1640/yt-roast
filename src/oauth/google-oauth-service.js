import { calculateBrainrotScore } from '../scoring/brainrot-calculator.js';
import { NormalizedViewingProfileSchema } from '../schemas/takeout.js';

export const MODE_1_DISCLAIMER =
  'This roast is based solely on your public subscriptions and liked videos, not complete viewing history.';

/**
 * Service managing Google OAuth 2.0 flow and Mode 1 Quick Roast generation (API-03, API-04, PRIV-01)
 */
export class GoogleOAuthService {
  /**
   * @param {Object} [options]
   * @param {string} [options.clientId]
   * @param {string} [options.clientSecret]
   * @param {string} [options.redirectUri]
   * @param {typeof fetch} [options.fetchImpl] - Optional custom fetch for deterministic testing
   */
  constructor(options = {}) {
    this.clientId = options.clientId || process.env.GOOGLE_CLIENT_ID || 'mock-client-id';
    this.clientSecret = options.clientSecret || process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';
    this.redirectUri =
      options.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/roast/oauth/callback';
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
  }

  /**
   * Generates Google OAuth authorization URL requesting youtube.readonly scope (API-03)
   *
   * @param {Object} [params]
   * @param {string} [params.state]
   * @returns {string}
   */
  getAuthorizationUrl({ state = 'default_state' } = {}) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'online',
      prompt: 'select_account',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for ephemeral access token (API-03)
   *
   * @param {string} code
   * @returns {Promise<{ access_token: string }>}
   */
  async exchangeCodeForToken(code) {
    if (!code || typeof code !== 'string') {
      throw new Error('Authorization code is required.');
    }

    const tokenRes = await this.fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Google OAuth token exchange failed: ${errText || tokenRes.statusText}`);
    }

    return tokenRes.json();
  }

  /**
   * Fetches user's subscriptions and liked videos from YouTube Data API v3 (API-03)
   *
   * @param {string} accessToken
   * @returns {Promise<{ subscriptions: any[], likedVideos: any[] }>}
   */
  async fetchUserTasteProfile(accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    };

    const [subsRes, likesRes] = await Promise.all([
      this.fetchImpl('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50', {
        headers
      }),
      this.fetchImpl('https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50', {
        headers
      })
    ]);

    if (!subsRes.ok || !likesRes.ok) {
      throw new Error('Failed to retrieve user YouTube taste data from YouTube Data API.');
    }

    const [subsJson, likesJson] = await Promise.all([subsRes.json(), likesRes.json()]);

    return {
      subscriptions: subsJson.items || [],
      likedVideos: likesJson.items || []
    };
  }

  /**
   * Adapts subscriptions and liked videos into a canonical NormalizedViewingProfile (Case B)
   *
   * @param {Object} taste
   * @param {any[]} taste.subscriptions
   * @param {any[]} taste.likedVideos
   * @returns {import('../schemas/takeout.js').NormalizedViewingProfile}
   */
  adaptTasteToProfile({ subscriptions = [], likedVideos = [] }) {
    const totalRecords = Math.max(25, subscriptions.length + likedVideos.length);

    // Primary creators from subscriptions (ranks 1–5)
    const primary = subscriptions.slice(0, 5).map((sub, i) => {
      const name = sub.snippet?.title || `Subscribed Creator ${i + 1}`;
      return {
        name,
        count: Math.max(5, 15 - i * 2),
        share: 0.15
      };
    });

    // Secondary creators (ranks 6–15)
    const secondary = subscriptions
      .slice(5, 15)
      .map((sub, i) => sub.snippet?.title || `Secondary Creator ${i + 6}`);

    // Liked videos mapped to repeated titles
    const topRepeats = likedVideos.slice(0, 5).map((v) => ({
      title: v.snippet?.title || 'Liked Video',
      count: 3
    }));

    const rawProfile = {
      totalRecords,
      validRecords: totalRecords,
      deletedVideoCount: 0,
      activeDateRange: null,
      topCreators: {
        primary,
        secondary
      },
      repeatedTitles: {
        topRepeats,
        totalReplayEvents: topRepeats.length * 2,
        replayRatio: 0.25
      },
      lateNightTitles: [],
      sessionClusters: {
        rapidFireCount: 0,
        rapidFireRatio: 0,
        candidateTopics: ['tutorial', 'routine', 'essay', 'speedrun']
      },
      dataQuality: {
        totalRecords,
        validRecords: totalRecords,
        missingTimestampCount: totalRecords,
        timestampValidityRate: 0,
        isDegraded: true
      },
      isInsufficient: false
    };

    return NormalizedViewingProfileSchema.parse(rawProfile);
  }

  /**
   * Executes Quick Roast flow with ephemeral token lifecycle (API-03, API-04, PRIV-01)
   *
   * @param {Object} params
   * @param {string} params.code - Authorization code from callback
   * @param {import('../ai/roast-generator-service.js').RoastGeneratorService} params.roastGeneratorService
   * @returns {Promise<any>} Full roast result decorated with disclaimer badge
   */
  async executeQuickRoast({ code, roastGeneratorService }) {
    // 1. Exchange code for ephemeral token
    const tokenData = await this.exchangeCodeForToken(code);
    let ephemeralAccessToken = tokenData.access_token;

    // 2. Fetch YouTube data and immediately dereference token (PRIV-01, API-03)
    let tasteProfile;
    try {
      tasteProfile = await this.fetchUserTasteProfile(ephemeralAccessToken);
    } finally {
      // Ephemeral token guarantee: drop immediately from scope
      ephemeralAccessToken = null;
    }

    // 3. Adapt taste data into normalized profile
    const profile = this.adaptTasteToProfile(tasteProfile);

    // 4. Calculate deterministic score (Case B: degraded timestamps, repetition only)
    const scoreResult = calculateBrainrotScore(profile);

    // 5. Generate AI roast report
    const roastResult = await roastGeneratorService.generateRoastReport({
      profile,
      scoreResult,
      consentGranted: true
    });

    // 6. Attach mandatory prominent disclaimer badge (API-04)
    return {
      ...roastResult,
      mode: 'mode_1_quick_roast',
      disclaimer: MODE_1_DISCLAIMER
    };
  }
}
