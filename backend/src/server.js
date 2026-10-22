import { buildApp } from './app.js';
import { RoastGeneratorService } from './ai/roast-generator-service.js';
import { GoogleOAuthService } from './oauth/google-oauth-service.js';
import { logger } from './utils/logger.js';

// Load .env file natively if available (Node.js 20.6.0+)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (err) {
    // .env file is optional if environment variables are injected via container/system
    if (err.code !== 'ENOENT') {
      logger.warn(`Could not load .env file: ${err.message}`);
    }
  }
}

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

// Initialize services with environment configuration
const roastGeneratorService = new RoastGeneratorService({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash'
});

const googleOAuthService = new GoogleOAuthService({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${port}/api/roast/oauth/callback`
});

const app = buildApp({
  logger: false, // Custom redacted logger handles output per PRIV-04
  roastGeneratorService,
  googleOAuthService
});

try {
  await app.listen({ port, host });
  logger.info(`YouTube Roast AI backend listening at http://${host}:${port}`);
} catch (err) {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
}

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    logger.info(`Received ${signal}. Shutting down server...`);
    await app.close();
    process.exit(0);
  });
}
