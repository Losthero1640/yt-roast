/**
 * Health check route plugin
 *
 * @param {import('fastify').FastifyInstance} app
 */
export async function healthRoutes(app) {
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'yt-roast',
      storage: 'zero-persistence-in-memory',
      timestamp: new Date().toISOString()
    };
  });
}
