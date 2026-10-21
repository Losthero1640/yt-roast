import { loadDemoProfile } from '../fixtures/demo-loader.js';
import { parseTakeoutStream, TakeoutParseError } from '../parser/takeout-stream-parser.js';
import { TakeoutNormalizer } from '../normalizer/takeout-normalizer.js';
import { calculateBrainrotScore } from '../scoring/brainrot-calculator.js';
import { RoastGeneratorService } from '../ai/roast-generator-service.js';
import { ConsentRequiredError } from '../ai/errors.js';

/**
 * Roast routes plugin implementing demo, upload, and OAuth endpoints
 *
 * @param {import('fastify').FastifyInstance} app
 */
export async function roastRoutes(app) {
  // Pre-configured or injected RoastGeneratorService
  const roastService = app.roastGeneratorService || new RoastGeneratorService();

  /**
   * GET /api/roast/demo
   * Returns instant pre-computed demo roast report (INGEST-04, API-01)
   */
  app.get('/api/roast/demo', async () => {
    return loadDemoProfile();
  });

  /**
   * POST /api/roast/upload
   * In-memory multipart streaming upload for unzipped watch-history.json (API-01, API-02, API-05, PRIV-02)
   */
  app.post('/api/roast/upload', async (req, reply) => {
    // 1. Consent Gate: Verify consent before consuming or processing stream (API-05)
    const hasConsent =
      req.query?.consent === 'true' ||
      req.headers['x-consent'] === 'true';

    if (!hasConsent) {
      throw new ConsentRequiredError(
        'Explicit user consent is required before processing viewing history.'
      );
    }

    // 2. Extract incoming file stream (100MB body limit enforced by multipart plugin)
    const part = await req.file();
    if (!part) {
      throw new TakeoutParseError('No file provided in multipart upload.', 'INVALID_FILE');
    }

    // 3. Online in-memory streaming ingestion (PRIV-01, PRIV-02)
    const normalizer = new TakeoutNormalizer();
    try {
      await parseTakeoutStream(part.file, {
        processItem: (item) => normalizer.processItem(item),
        recordDeleted: () => normalizer.recordDeleted()
      });
    } catch (err) {
      if (err instanceof TakeoutParseError) throw err;
      throw new TakeoutParseError(`Failed to stream Takeout archive: ${err.message}`);
    }

    const profile = normalizer.finalize();

    // 4. Sparse Dataset Fallback (NORM-05)
    if (profile.validRecords < 20 || profile.isInsufficient) {
      return reply.status(200).send({
        isInsufficient: true,
        message: 'Insufficient viewing history (minimum 20 valid records required).'
      });
    }

    // 5. Deterministic Scoring & Roast Generation
    const scoreResult = calculateBrainrotScore(profile);
    const roastResult = await roastService.generateRoastReport({
      profile,
      scoreResult,
      consentGranted: true
    });

    return reply.status(200).send(roastResult);
  });
}
