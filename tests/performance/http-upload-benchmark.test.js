import { describe, it, expect, afterEach } from 'vitest';
import { Readable } from 'node:stream';
import http from 'node:http';
import { buildApp } from '../../src/app.js';
import { setupZeroDiskSpies } from '../helpers/zero-disk-spy.js';
import { RoastGeneratorService } from '../../src/ai/roast-generator-service.js';
import { createMockGeminiClient } from '../helpers/mock-gemini.js';

/**
 * Creates an on-the-fly streaming multipart Readable without buffering the 52MB file in memory (TEST-04, PRIV-02)
 *
 * @param {number} [targetSizeBytes=54525952] - Default 52 MB
 * @param {string} [boundary='----BenchmarkBoundary1234567890']
 * @returns {NodeJS.ReadableStream}
 */
function createSyntheticMultipartStream(
  targetSizeBytes = 52 * 1024 * 1024,
  boundary = '----BenchmarkBoundary1234567890'
) {
  let bytesEmitted = 0;
  let isFirst = true;
  let index = 0;
  let finished = false;

  const baseTime = new Date('2026-01-01T00:00:00.000Z').getTime();
  const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="watch-history.json"\r\nContent-Type: application/json\r\n\r\n[\n`;
  const suffix = `\n]\r\n--${boundary}--\r\n`;

  return new Readable({
    read() {
      if (finished) return;

      if (bytesEmitted === 0) {
        bytesEmitted += Buffer.byteLength(prefix);
        this.push(prefix);
        return;
      }

      if (bytesEmitted >= targetSizeBytes) {
        finished = true;
        bytesEmitted += Buffer.byteLength(suffix);
        this.push(suffix);
        this.push(null);
        return;
      }

      // Generate a batch of records (~64 KB per read call) respecting stream backpressure
      let batch = '';
      while (batch.length < 65536 && bytesEmitted + Buffer.byteLength(batch) < targetSizeBytes) {
        index++;
        const creator = (index % 5 === 0) ? 'Alpha Channel' : (`Channel ${index % 10}`);
        const titleId = index % 50;
        const recordTime = new Date(baseTime + index * 60000).toISOString();

        const record = JSON.stringify({
          header: 'YouTube',
          title: `Watched Synthetic Video Title Number ${titleId}`,
          titleUrl: `https://www.youtube.com/watch?v=synth_${index}`,
          subtitles: [
            {
              name: creator,
              url: `https://youtube.com/channel/${creator}`
            }
          ],
          time: recordTime,
          products: ['YouTube']
        });

        batch += (isFirst ? '' : ',\n') + record;
        isFirst = false;
      }

      bytesEmitted += Buffer.byteLength(batch);
      this.push(Buffer.from(batch));
    }
  });
}

describe('HTTP Multipart Streaming Benchmark & Zero-Disk Acceptance Test (TEST-04, PRIV-02, API-02)', () => {
  let app;
  let zeroDisk;

  afterEach(async () => {
    if (zeroDisk) {
      zeroDisk.restore();
    }
    if (app) {
      await app.close();
    }
  });

  it(
    'streams 52MB+ Takeout upload via HTTP with <30MB incremental heap, <50MB peak heap, and 0 disk writes',
    async () => {
      // 1. Initialize multi-layer zero-disk spies before server invocation
      zeroDisk = setupZeroDiskSpies();

      // Force GC before measuring baseline if exposed
      if (typeof global.gc === 'function') {
        global.gc();
      }

      // 2. Measure baseline memory usage
      const baselineHeap = process.memoryUsage().heapUsed;
      let peakHeapUsed = baselineHeap;

      // Monitor memory periodically during HTTP streaming to capture true peak heap
      const memorySampler = setInterval(() => {
        const currentHeap = process.memoryUsage().heapUsed;
        if (currentHeap > peakHeapUsed) {
          peakHeapUsed = currentHeap;
        }
      }, 50);

      // 3. Mock roast report grounded in synthetic stream creator names
      const benchmarkMockRoast = {
        brainrotScore: 50,
        viewingArchetype: 'The Synthetic Binge Streamer',
        roastSummary: 'A certified synthetic viewing enthusiast.',
        roasts: [
          {
            style: 'pattern',
            joke: 'Your pattern is synthetic repetition.',
            supportingEvidence: 'Watched thousands of synthetic videos.'
          },
          {
            style: 'combination',
            joke: 'You combine late night sessions with repetitive streams.',
            supportingEvidence: 'Observed 2 distinct binge patterns.'
          },
          {
            style: 'specific',
            joke: 'You cannot stop watching Alpha Channel.',
            supportingEvidence: 'Alpha Channel accounts for numerous views.',
            referencedItem: 'Alpha Channel'
          },
          {
            style: 'archetype',
            joke: 'An absolute digital stream benchmark zombie.',
            supportingEvidence: 'Clustered rapid-fire sessions.'
          }
        ],
        redFlags: [
          'Observed thousands of synthetic video views.',
          'Observed heavy concentration on Alpha Channel.',
          'Rapid fire session clusters detected.'
        ],
        finalVerdict: 'A benchmark test subject beyond human comprehension.',
        cardPayload: {
          brainrotScore: 50,
          tier: 'Casual',
          headline: 'Synthetic Streamer',
          topCrime: 'Automated bingeing'
        }
      };

      const mockGeminiClient = createMockGeminiClient({ responseJson: benchmarkMockRoast });
      const roastGeneratorService = new RoastGeneratorService({
        apiKey: 'test-key',
        client: mockGeminiClient
      });

      app = buildApp({ roastGeneratorService });
      await app.listen({ port: 0, host: '127.0.0.1' });
      const port = app.server.address().port;

      // 4. Create 52MB streaming multipart payload
      const boundary = '----BenchmarkBoundary1234567890';
      const multipartStream = createSyntheticMultipartStream(52 * 1024 * 1024, boundary);

      // 5. Stream HTTP multipart upload over real HTTP socket
      const { statusCode, headers, body } = await new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port,
            path: '/api/roast/upload?consent=true',
            method: 'POST',
            headers: {
              'content-type': `multipart/form-data; boundary=${boundary}`
            }
          },
          (res) => {
            let responseData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            res.on('end', () => {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                body: responseData
              });
            });
          }
        );

        req.on('error', reject);
        multipartStream.pipe(req);
      });

      // Stop sampler and record final heap
      clearInterval(memorySampler);
      const finalHeap = process.memoryUsage().heapUsed;
      if (finalHeap > peakHeapUsed) {
        peakHeapUsed = finalHeap;
      }

      const incrementalHeap = peakHeapUsed - baselineHeap;

      console.log('--- HTTP Upload Memory Benchmark Results ---');
      console.log(`HTTP Status: ${statusCode}`);
      console.log(`Baseline heap: ${(baselineHeap / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Final heap: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Peak heap during HTTP streaming: ${(peakHeapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Incremental heap increase: ${(incrementalHeap / 1024 / 1024).toFixed(2)} MB`);
      console.log('--------------------------------------------');

      // 6. Assertions per requirements TEST-04, PRIV-02, SEC-01
      expect(statusCode).toBe(200);
      expect(headers['cache-control']).toBe('no-store, private, max-age=0');

      const parsedBody = JSON.parse(body);
      expect(parsedBody.roast).toBeDefined();
      expect(parsedBody.scoreDetails).toBeDefined();

      // Hard assertion 1: Incremental heap usage must be under 30MB
      expect(incrementalHeap).toBeLessThan(30 * 1024 * 1024);

      // Hard assertion 2: Peak heap usage must be under 50MB
      expect(peakHeapUsed).toBeLessThan(50 * 1024 * 1024);

      // Hard assertion 3: Multi-layer zero-disk verification (0 file writes, 0 temp files)
      zeroDisk.assertZeroWrites();
    },
    60000 // 60s timeout for 52MB HTTP stream processing
  );
});
