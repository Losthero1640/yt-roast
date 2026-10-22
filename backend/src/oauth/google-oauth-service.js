import { calculateBrainrotScore } from '../scoring/brainrot-calculator.js';
import { NormalizedViewingProfileSchema } from '../schemas/takeout.js';
import {
  OAuthError,
  OAuthConfigurationError,
  OAuthTokenExchangeError,
  YouTubeApiError
} from './errors.js';
import { logger } from '../utils/logger.js';

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
   * Exchanges authorization code for ephemeral access token with stage-specific error classification (API-03, SEC-02)
   *
   * @param {string} code
   * @returns {Promise<{ access_token: string }>}
   */
  async exchangeCodeForToken(code) {
    if (!code || typeof code !== 'string') {
      throw new OAuthTokenExchangeError('Authorization code is required.', { statusCode: 400 });
    }

    let tokenRes;
    try {
      tokenRes = await this.fetchImpl('https://oauth2.googleapis.com/token', {
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
    } catch (networkErr) {
      logger.error(`[OAuth] Network error during token exchange: ${networkErr.message}`);
      throw new OAuthTokenExchangeError('Failed to communicate with Google authentication server.', {
        statusCode: 502,
        providerError: 'NETWORK_ERROR'
      });
    }

    if (!tokenRes.ok) {
      let errJson = null;
      try {
        errJson = await tokenRes.json();
      } catch {
        // Non-JSON response
      }

      const providerError = errJson?.error || 'token_exchange_failed';

      // Redacted diagnostic log (PRIV-04: never echoes code or secrets)
      logger.warn(`[OAuth] Token exchange failed with status ${tokenRes.status}: provider_error=${providerError}`);

      let userMessage = 'Google sign-in authorization failed or expired. Please sign in again.';
      let statusCode = 400;

      if (providerError === 'invalid_grant') {
        userMessage = 'Google authorization code is invalid, expired, or already used. Please sign in again.';
        statusCode = 400;
      } else if (providerError === 'invalid_client' || providerError === 'unauthorized_client') {
        userMessage = 'OAuth client configuration is invalid. Please contact the administrator.';
        statusCode = 500;
      } else if (tokenRes.status >= 500) {
        userMessage = 'Google authorization service is temporarily unavailable. Please retry in a moment.';
        statusCode = 502;
      }

      throw new OAuthTokenExchangeError(userMessage, {
        statusCode,
        providerError
      });
    }

    return tokenRes.json();
  }

  /**
   * Fetches user's subscriptions and liked videos from YouTube Data API v3 with graceful partial fallback (API-03)
   *
   * @param {string} accessToken
   * @returns {Promise<{ subscriptions: any[], likedVideos: any[] }>}
   */
  async fetchUserTasteProfile(accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    };

    let subsRes;
    let likesRes;

    try {
      [subsRes, likesRes] = await Promise.all([
        this.fetchImpl('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50', {
          headers
        }),
        this.fetchImpl('https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50', {
          headers
        })
      ]);
    } catch (netErr) {
      logger.error(`[OAuth: YouTube] Network error fetching taste data: ${netErr.message}`);
      throw new YouTubeApiError('Network error connecting to YouTube Data API.', {
        providerError: 'NETWORK_ERROR'
      });
    }

    logger.info(
      `[OAuth: YouTube] Subscriptions API status=${subsRes.status}, Liked Videos API status=${likesRes.status}`
    );

    // 1. Process subscriptions response
    let subscriptions = [];
    if (subsRes.ok) {
      const subsJson = await subsRes.json();
      subscriptions = subsJson.items || [];
    } else {
      const subsStatus = subsRes.status;
      let subsReason = 'unknown';
      try {
        const subsErr = await subsRes.json();
        subsReason = subsErr?.error?.errors?.[0]?.reason || subsErr?.error?.message || 'failed';
      } catch {}

      logger.warn(`[OAuth: YouTube] Subscriptions status=${subsStatus}, reason=${subsReason}`);

      // Channel not found (404) or subscriptions are private/forbidden (403): treat gracefully as empty
      if (subsStatus === 404 || subsReason === 'channelNotFound' || subsReason === 'subscriptionForbidden') {
        subscriptions = [];
      } else if (subsStatus === 401) {
        throw new OAuthTokenExchangeError('Access token is invalid or expired. Please sign in again.', { statusCode: 401 });
      } else if (subsReason === 'quotaExceeded') {
        throw new YouTubeApiError('YouTube API quota limit exceeded. Please try again later.', { providerError: 'quotaExceeded' });
      }
    }

    // 2. Process liked videos response
    let likedVideos = [];
    if (likesRes.ok) {
      const likesJson = await likesRes.json();
      likedVideos = likesJson.items || [];
    } else {
      const likesStatus = likesRes.status;
      let likesReason = 'unknown';
      try {
        const likesErr = await likesRes.json();
        likesReason = likesErr?.error?.errors?.[0]?.reason || likesErr?.error?.message || 'failed';
      } catch {}

      logger.warn(`[OAuth: YouTube] Liked videos status=${likesStatus}, reason=${likesReason}`);

      // Private likes or rating access restricted (403) or 404: treat gracefully as empty
      if (likesStatus === 404 || likesStatus === 403) {
        likedVideos = [];
      } else if (likesStatus === 401) {
        throw new OAuthTokenExchangeError('Access token is invalid or expired. Please sign in again.', { statusCode: 401 });
      } else if (likesReason === 'quotaExceeded') {
        throw new YouTubeApiError('YouTube API quota limit exceeded. Please try again later.', { providerError: 'quotaExceeded' });
      }
    }

    // If both failed with 5xx or unrecoverable error
    if (!subsRes.ok && !likesRes.ok && subscriptions.length === 0 && likedVideos.length === 0) {
      if (subsRes.status >= 500 || likesRes.status >= 500) {
        throw new YouTubeApiError('YouTube Data API is temporarily unavailable.', { providerError: 'SERVICE_UNAVAILABLE' });
      }
    }

    return {
      subscriptions,
      likedVideos
    };
  }

  /**
   * Adapts subscriptions and liked videos into a canonical NormalizedViewingProfile with sparse fallbacks (Case B)
   *
   * @param {Object} taste
   * @param {any[]} [taste.subscriptions]
   * @param {any[]} [taste.likedVideos]
   * @returns {import('../schemas/takeout.js').NormalizedViewingProfile | { isInsufficient: true, message: string }}
   */
  adaptTasteToProfile({ subscriptions = [], likedVideos = [] }) {
    // Sparse dataset check (NORM-05)
    if (subscriptions.length === 0 && likedVideos.length === 0) {
      return {
        isInsufficient: true,
        message: 'No public subscriptions or liked videos found on this YouTube account.'
      };
    }

    const totalRecords = Math.max(25, subscriptions.length * 3 + likedVideos.length * 2);

    // Extract creators from subscriptions
    let creatorList = subscriptions.map((sub, i) => {
      const name = sub.snippet?.title || `Subscribed Creator ${i + 1}`;
      return { name, source: 'sub' };
    });

    // If subscriptions are sparse (<5), supplement with channel titles from liked videos
    if (creatorList.length < 5) {
      const seenNames = new Set(creatorList.map((c) => c.name.toLowerCase()));
      for (const v of likedVideos) {
        const channelTitle = v.snippet?.channelTitle;
        if (channelTitle && !seenNames.has(channelTitle.toLowerCase())) {
          seenNames.add(channelTitle.toLowerCase());
          creatorList.push({ name: channelTitle, source: 'liked' });
          if (creatorList.length >= 15) break;
        }
      }
    }

    // Fallback if needed
    if (creatorList.length === 0) {
      creatorList.push({ name: 'YouTube Trending', source: 'fallback' });
    }

    // Primary creators (ranks 1–5)
    const primary = creatorList.slice(0, 5).map((c, i) => ({
      name: c.name,
      count: Math.max(5, 15 - i * 2),
      share: 0.15
    }));

    // Secondary creators (ranks 6–15)
    const secondary = creatorList.slice(5, 15).map((c) => c.name);

    // Repeated titles from liked videos
    let topRepeats = likedVideos.slice(0, 5).map((v) => ({
      title: v.snippet?.title || 'Liked Video',
      count: 3
    }));

    // If liked videos were empty, create repeats from primary creators
    if (topRepeats.length === 0) {
      topRepeats = primary.slice(0, 3).map((c) => ({
        title: `Latest Upload from ${c.name}`,
        count: 2
      }));
    }

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
        candidateTopics: ['tutorial', 'routine', 'essay', 'speedrun', 'review', 'vlog']
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
   * Executes Quick Roast flow with ephemeral token lifecycle and stage diagnostics (API-03, API-04, PRIV-01)
   *
   * @param {Object} params
   * @param {string} params.code - Authorization code from callback
   * @param {import('../ai/roast-generator-service.js').RoastGeneratorService} params.roastGeneratorService
   * @returns {Promise<any>} Full roast result decorated with disclaimer badge or insufficient data report
   */
  async executeQuickRoast({ code, roastGeneratorService }) {
    // 1. Stage 1: Exchange code for ephemeral token
    let ephemeralAccessToken = null;
    try {
      const tokenData = await this.exchangeCodeForToken(code);
      ephemeralAccessToken = tokenData.access_token;
    } catch (err) {
      if (err instanceof OAuthError) throw err;
      throw new OAuthTokenExchangeError(`OAuth token exchange failed: ${err.message}`);
    }

    // 2. Stage 2: Fetch YouTube data and immediately dereference token (PRIV-01, API-03)
    let tasteProfile;
    try {
      tasteProfile = await this.fetchUserTasteProfile(ephemeralAccessToken);
    } finally {
      // Ephemeral token guarantee: drop immediately from scope
      ephemeralAccessToken = null;
    }

    // 3. Stage 3: Adapt taste data into normalized profile
    const profile = this.adaptTasteToProfile(tasteProfile);
    if (profile.isInsufficient) {
      return {
        isInsufficient: true,
        message: profile.message || 'No public subscriptions or liked videos found on this YouTube account.'
      };
    }

    // 4. Stage 4: Calculate deterministic score (Case B: degraded timestamps, repetition only)
    const scoreResult = calculateBrainrotScore(profile);

    // 5. Stage 5: Generate AI roast report
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
