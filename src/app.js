import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';

/**
 * Fastify application factory
 * Configured for zero-disk-write streaming ingestion (PRIV-01, PRIV-02, D-11)
 *
 * @param {import('fastify').FastifyServerOptions} opts
 * @returns {import('fastify').FastifyInstance}
 */
export function buildApp(opts = {}) {
  const app = Fastify({
    logger: false,
    ...opts
  });

  // Register multipart strictly with zero temporary disk spooling
  app.register(fastifyMultipart, {
    attachFieldsToBody: false,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB max per API-02
    }
  });

  // Health check route
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'yt-roast',
      storage: 'zero-persistence-in-memory'
    };
  });

  return app;
}
