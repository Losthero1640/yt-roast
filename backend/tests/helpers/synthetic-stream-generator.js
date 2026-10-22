import { Readable } from 'node:stream';

/**
 * Creates an on-the-fly streaming Readable that yields a valid Takeout JSON array
 * without buffering the full dataset in memory (PRIV-02, TEST-04, D-11)
 *
 * @param {number} [targetSizeBytes=54525952] - Default 52 MB (52 * 1024 * 1024)
 * @returns {NodeJS.ReadableStream}
 */
export function createSyntheticTakeoutStream(targetSizeBytes = 52 * 1024 * 1024) {
  let bytesEmitted = 0;
  let isFirst = true;
  let index = 0;
  let finished = false;

  const baseTime = new Date('2026-01-01T00:00:00.000Z').getTime();

  return new Readable({
    read() {
      if (finished) return;

      if (bytesEmitted === 0) {
        const startChunk = '[\n';
        bytesEmitted += Buffer.byteLength(startChunk);
        this.push(startChunk);
        return;
      }

      if (bytesEmitted >= targetSizeBytes) {
        finished = true;
        const endChunk = '\n]';
        bytesEmitted += Buffer.byteLength(endChunk);
        this.push(endChunk);
        this.push(null);
        return;
      }

      // Generate a batch of records (~64 KB per read call) to balance throughput & memory
      let batch = '';
      while (batch.length < 65536 && bytesEmitted + Buffer.byteLength(batch) < targetSizeBytes) {
        index++;
        const creatorId = index % 25;
        const titleId = index % 100;
        const recordTime = new Date(baseTime + index * 60000).toISOString();

        const record = JSON.stringify({
          header: 'YouTube',
          title: `Watched Synthetic Video Title Number ${titleId}`,
          titleUrl: `https://www.youtube.com/watch?v=synth_${index}`,
          subtitles: [
            {
              name: `Creator Channel ${creatorId}`,
              url: `https://youtube.com/channel/creator_${creatorId}`
            }
          ],
          time: recordTime,
          products: ['YouTube']
        });

        batch += (isFirst ? '' : ',\n') + record;
        isFirst = false;
      }

      bytesEmitted += Buffer.byteLength(batch);
      this.push(batch);
    }
  });
}
