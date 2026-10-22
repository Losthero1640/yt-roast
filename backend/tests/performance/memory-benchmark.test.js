import { describe, it, expect, afterEach } from 'vitest';
import { createSyntheticTakeoutStream } from '../helpers/synthetic-stream-generator.js';
import { setupZeroDiskSpies } from '../helpers/zero-disk-spy.js';
import { parseTakeoutStream } from '../../src/parser/takeout-stream-parser.js';
import { TakeoutNormalizer } from '../../src/normalizer/takeout-normalizer.js';

describe('Task 3: 50MB+ Streaming Memory Benchmark & Zero-Disk Verification (PRIV-02, TEST-04, D-11)', () => {
  let zeroDisk;

  afterEach(() => {
    if (zeroDisk) {
      zeroDisk.restore();
    }
  });

  it(
    'streams a 52MB+ synthetic Takeout archive with <30MB incremental heap, <50MB peak heap, and 0 disk writes',
    async () => {
      // 1. Initialize multi-layer zero-disk spies
      zeroDisk = setupZeroDiskSpies();

      // Force GC before measuring baseline if exposed
      if (typeof global.gc === 'function') {
        global.gc();
      }

      // 2. Measure baseline memory usage
      const baselineHeap = process.memoryUsage().heapUsed;
      let peakHeapUsed = baselineHeap;
      let itemsProcessed = 0;

      const normalizer = new TakeoutNormalizer();
      const syntheticStream = createSyntheticTakeoutStream(52 * 1024 * 1024); // 52 MB

      // 3. Process stream while periodically sampling memory to track true peak heap
      await parseTakeoutStream(syntheticStream, {
        processItem: (item) => {
          normalizer.processItem(item);
          itemsProcessed++;

          // Sample memory periodically every 1,000 items
          if (itemsProcessed % 1000 === 0) {
            const currentHeap = process.memoryUsage().heapUsed;
            if (currentHeap > peakHeapUsed) {
              peakHeapUsed = currentHeap;
            }
          }
        },
        recordDeleted: () => {
          normalizer.recordDeleted();
        }
      });

      const profile = normalizer.finalize();
      const finalHeap = process.memoryUsage().heapUsed;
      if (finalHeap > peakHeapUsed) {
        peakHeapUsed = finalHeap;
      }

      const incrementalHeap = peakHeapUsed - baselineHeap;

      console.log('--- Memory Benchmark Results ---');
      console.log(`Total valid items processed: ${profile.validRecords}`);
      console.log(`Baseline heap: ${(baselineHeap / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Peak heap during streaming: ${(peakHeapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Incremental heap increase: ${(incrementalHeap / 1024 / 1024).toFixed(2)} MB`);
      console.log('--------------------------------');

      // 4. Assertions per requirements and decision D-11:
      expect(profile.validRecords).toBeGreaterThan(10000);

      // Hard assertion 1: Incremental heap usage must be under 30MB
      expect(incrementalHeap).toBeLessThan(30 * 1024 * 1024);

      // Hard assertion 2: Peak heap usage must be under 50MB
      expect(peakHeapUsed).toBeLessThan(50 * 1024 * 1024);

      // Hard assertion 3: Multi-layer zero-disk verification (zero calls, zero temp files)
      zeroDisk.assertZeroWrites();
    },
    60000 // 60s timeout for 52MB stream parsing
  );
});
