import { pipeline } from 'node:stream/promises';
import StreamArray from 'stream-json/streamers/stream-array.js';
import { Writable } from 'node:stream';

/**
 * Custom error for invalid or truncated JSON streams
 */
export class TakeoutParseError extends Error {
  constructor(message = 'Invalid or malformed Takeout JSON', code = 'INVALID_JSON') {
    super(message);
    this.name = 'TakeoutParseError';
    this.code = code;
  }
}

/**
 * Recognized Takeout placeholder titles for removed/private videos
 * Exact match (case-insensitive) after trimming
 */
const DELETED_PLACEHOLDERS = new Set([
  'watched a video that has been removed',
  'watched a video that is no longer available',
  'watched a private video',
  'a video that has been removed',
  'a video that is no longer available',
  'private video'
]);

/**
 * Checks whether a video title is a known Takeout deleted/removed video placeholder (D-09)
 *
 * @param {string} [title]
 * @returns {boolean}
 */
export function isDeletedPlaceholder(title) {
  if (!title || typeof title !== 'string') return true;
  const normalized = title.trim().toLowerCase();
  return DELETED_PLACEHOLDERS.has(normalized);
}

/**
 * Defensively strips leading "Watched " prefix while preserving legitimate titles and Unicode/emojis (D-08, INGEST-03)
 *
 * @param {string} [rawTitle]
 * @returns {string}
 */
export function normalizeTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  return rawTitle.replace(/^Watched\s+/i, '').trim();
}

/**
 * Safely extracts creator channel name from subtitles array, falling back to 'Unknown Channel'
 *
 * @param {Array<{ name?: string, url?: string }>} [subtitles]
 * @returns {string}
 */
export function extractCreator(subtitles) {
  if (Array.isArray(subtitles) && subtitles.length > 0 && subtitles[0]?.name) {
    const name = subtitles[0].name.trim();
    return name.length > 0 ? name : 'Unknown Channel';
  }
  return 'Unknown Channel';
}

/**
 * Parses an unzipped Google Takeout watch-history.json stream incrementally (INGEST-01, INGEST-02, INGEST-03, D-10)
 *
 * @param {NodeJS.ReadableStream} inputStream - Incoming readable stream
 * @param {Object} sink - Accumulator or handler callbacks
 * @param {Function} sink.processItem - Function called for each valid parsed item
 * @param {Function} [sink.recordDeleted] - Optional callback for deleted video occurrences
 * @returns {Promise<{ totalParsed: number, deletedCount: number }>}
 */
export async function parseTakeoutStream(inputStream, sink) {
  let totalParsed = 0;
  let deletedCount = 0;

  const arrayStream = StreamArray.withParserAsStream();

  const reducerSink = new Writable({
    objectMode: true,
    write(chunk, _encoding, callback) {
      try {
        const item = chunk?.value;
        if (!item || typeof item !== 'object') {
          callback();
          return;
        }

        totalParsed++;

        const rawTitle = item.title || '';
        if (isDeletedPlaceholder(rawTitle)) {
          deletedCount++;
          if (typeof sink.recordDeleted === 'function') {
            sink.recordDeleted(item);
          }
          callback();
          return;
        }

        const cleanTitle = normalizeTitle(rawTitle);
        const channel = extractCreator(item.subtitles);

        sink.processItem({
          cleanTitle,
          rawTitle,
          channel,
          time: item.time,
          titleUrl: item.titleUrl,
          header: item.header,
          products: item.products
        });

        callback();
      } catch (err) {
        callback(err);
      }
    }
  });

  try {
    await pipeline(inputStream, arrayStream, reducerSink);
    return { totalParsed, deletedCount };
  } catch (err) {
    // Teardown / drain input stream to prevent hanging connections (Pitfall 1)
    if (inputStream && typeof inputStream.resume === 'function' && !inputStream.destroyed) {
      inputStream.resume();
    }
    throw new TakeoutParseError(`Takeout streaming parse failed: ${err.message}`, 'INVALID_JSON');
  }
}
