import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { roastRoutes } from './routes/roast.js';
import { fastifyErrorHandler } from './utils/error-handler.js';

/**
 * Fastify application factory
 * Configured for zero-disk-write streaming ingestion, security headers, and error sanitization (PRIV-01, PRIV-02, SEC-01, SEC-02)
 *
 * @param {import('fastify').FastifyServerOptions & { roastGeneratorService?: any, googleOAuthService?: any }} opts
 * @returns {import('fastify').FastifyInstance}
 */
export function buildApp(opts = {}) {
  const { roastGeneratorService, googleOAuthService, ...fastifyOpts } = opts;

  const app = Fastify({
    logger: false,
    connectionTimeout: 90000,
    requestTimeout: 90000,
    ...fastifyOpts
  });

  // Attach injected services if supplied
  if (roastGeneratorService) {
    app.roastGeneratorService = roastGeneratorService;
  }
  if (googleOAuthService) {
    app.googleOAuthService = googleOAuthService;
  }

  // 1. Register multipart strictly in streaming memory mode without disk spooling (PRIV-02, API-02)
  app.register(fastifyMultipart, {
    attachFieldsToBody: false,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB max per API-02
    }
  });

  // Register CORS to allow seamless decoupled deployment (e.g. Vercel frontend calling Render backend)
  app.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-consent']
  });

  // 2. Global Security Headers: Ensure all /api/roast responses enforce no-store caching (SEC-01)
  app.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/api/roast')) {
      reply.header('Cache-Control', 'no-store, private, max-age=0');
      reply.header('Pragma', 'no-cache');
      reply.header('Surrogate-Control', 'no-store');
    }
  });

  // 3. Global Sanitized Error Handler (SEC-02, PRIV-04)
  app.setErrorHandler(fastifyErrorHandler);

  // 4. Register Route Plugins (API-01)
  app.register(healthRoutes);
  app.register(roastRoutes);

  return app;
}
