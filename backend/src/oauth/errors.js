/**
 * Domain-specific error classes for Google OAuth and YouTube Data API (API-03, SEC-02)
 */

export class OAuthError extends Error {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.code]
   * @param {number} [options.statusCode]
   * @param {string|null} [options.providerError]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = 'OAuthError';
    this.code = options.code || 'OAUTH_ERROR';
    this.statusCode = options.statusCode || 500;
    this.providerError = options.providerError || null;
  }
}

export class OAuthConfigurationError extends OAuthError {
  constructor(message = 'OAuth configuration is missing or incomplete on the server.') {
    super(message, { code: 'OAUTH_CONFIG_ERROR', statusCode: 500 });
    this.name = 'OAuthConfigurationError';
  }
}

export class OAuthTokenExchangeError extends OAuthError {
  constructor(message = 'Failed to exchange authorization code for access token.', options = {}) {
    super(message, {
      code: 'OAUTH_TOKEN_ERROR',
      statusCode: options.statusCode || 400,
      providerError: options.providerError
    });
    this.name = 'OAuthTokenExchangeError';
  }
}

export class YouTubeApiError extends OAuthError {
  constructor(message = 'Failed to retrieve YouTube taste data from Google.', options = {}) {
    super(message, {
      code: 'YOUTUBE_API_ERROR',
      statusCode: options.statusCode || 502,
      providerError: options.providerError
    });
    this.name = 'YouTubeApiError';
  }
}
