import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import {
  parseTakeoutStream,
  isDeletedPlaceholder,
  normalizeTitle,
  extractCreator,
  TakeoutParseError
} from '../../src/parser/takeout-stream-parser.js';

describe('Task 2: Streaming Takeout Parser', () => {
  it('normalizes titles by stripping "Watched " prefix while preserving legitimate titles (D-08)', () => {
    expect(normalizeTitle('Watched Morning Routine 2024')).toBe('Morning Routine 2024');
    expect(normalizeTitle('watched lowercase prefix')).toBe('lowercase prefix');
    expect(normalizeTitle('Watched ')).toBe('');
    expect(normalizeTitle('Watched')).toBe('Watched');
    expect(normalizeTitle('')).toBe('');
    expect(normalizeTitle(null)).toBe('');
    expect(normalizeTitle('Watching A Movie')).toBe('Watching A Movie');
  });

  it('identifies deleted and removed video placeholders via allowlist without false positives (D-09)', () => {
    expect(isDeletedPlaceholder('Watched a video that has been removed')).toBe(true);
    expect(isDeletedPlaceholder('watched a video that is no longer available')).toBe(true);
    expect(isDeletedPlaceholder('Watched a private video')).toBe(true);
    expect(isDeletedPlaceholder('Private video')).toBe(true);
    expect(isDeletedPlaceholder('A video that has been removed')).toBe(true);

    // Legitimate titles containing "private" or "removed" must NOT be filtered
    expect(isDeletedPlaceholder('Watched Private Eyes Full Episode')).toBe(false);
    expect(isDeletedPlaceholder('Watched Removed Scene Breakdown')).toBe(false);
    expect(isDeletedPlaceholder('How to make a private server')).toBe(false);
  });

  it('safely extracts channel name or falls back to "Unknown Channel"', () => {
    expect(extractCreator([{ name: 'Veritasium', url: 'https://...' }])).toBe('Veritasium');
    expect(extractCreator([{ name: '  Kurzgesagt  ' }])).toBe('Kurzgesagt');
    expect(extractCreator([])).toBe('Unknown Channel');
    expect(extractCreator(null)).toBe('Unknown Channel');
    expect(extractCreator([{ name: '' }])).toBe('Unknown Channel');
  });

  it('streams a valid JSON array and processes records incrementally (INGEST-01)', async () => {
    const rawData = [
      {
        header: 'YouTube',
        title: 'Watched 10 Hours of Rain Sounds',
        titleUrl: 'https://youtube.com/watch?v=1',
        subtitles: [{ name: 'Ambient Relaxation' }],
        time: '2024-03-01T03:15:00.000Z'
      },
      {
        header: 'YouTube',
        title: 'Watched How to Stop Doomscrolling',
        titleUrl: 'https://youtube.com/watch?v=2',
        subtitles: [{ name: 'HealthyGamerGG' }],
        time: '2024-03-01T04:20:00.000Z'
      }
    ];

    const stream = Readable.from([JSON.stringify(rawData)]);
    const processed = [];

    const stats = await parseTakeoutStream(stream, {
      processItem: (item) => processed.push(item)
    });

    expect(stats.totalParsed).toBe(2);
    expect(stats.deletedCount).toBe(0);
    expect(processed).toHaveLength(2);
    expect(processed[0].cleanTitle).toBe('10 Hours of Rain Sounds');
    expect(processed[0].channel).toBe('Ambient Relaxation');
    expect(processed[1].cleanTitle).toBe('How to Stop Doomscrolling');
    expect(processed[1].channel).toBe('HealthyGamerGG');
  });

  it('filters deleted-video placeholders and tracks count without throwing (INGEST-02, D-09)', async () => {
    const rawData = [
      {
        header: 'YouTube',
        title: 'Watched a video that has been removed',
        time: '2024-03-01T02:00:00.000Z'
      },
      {
        header: 'YouTube',
        title: 'Watched Valid Video 1',
        subtitles: [{ name: 'Creator One' }],
        time: '2024-03-01T02:30:00.000Z'
      },
      {
        header: 'YouTube',
        title: 'Watched a private video',
        time: '2024-03-01T03:00:00.000Z'
      }
    ];

    const stream = Readable.from([JSON.stringify(rawData)]);
    const processed = [];
    let deletedCallbackCount = 0;

    const stats = await parseTakeoutStream(stream, {
      processItem: (item) => processed.push(item),
      recordDeleted: () => deletedCallbackCount++
    });

    expect(stats.totalParsed).toBe(3);
    expect(stats.deletedCount).toBe(2);
    expect(deletedCallbackCount).toBe(2);
    expect(processed).toHaveLength(1);
    expect(processed[0].cleanTitle).toBe('Valid Video 1');
  });

  it('processes international UTF-8 scripts, non-Latin characters, and emojis without offset crashes (INGEST-03)', async () => {
    const rawData = [
      {
        header: 'YouTube',
        title: 'Watched 日本語の勉強 - 初級レッスン 🌸',
        subtitles: [{ name: '日本語チャンネル' }],
        time: '2024-03-02T12:00:00.000Z'
      },
      {
        header: 'YouTube',
        title: 'Watched नमस्ते दुनिया - प्रोग्रामिंग सीखें 🚀💻',
        subtitles: [{ name: 'कोड इंडिया' }],
        time: '2024-03-02T13:00:00.000Z'
      },
      {
        header: 'YouTube',
        title: 'Watched Café & Crème Français ☕🥐',
        subtitles: [{ name: 'Parisian Life' }],
        time: '2024-03-02T14:00:00.000Z'
      }
    ];

    const stream = Readable.from([JSON.stringify(rawData)]);
    const processed = [];

    await parseTakeoutStream(stream, {
      processItem: (item) => processed.push(item)
    });

    expect(processed).toHaveLength(3);
    expect(processed[0].cleanTitle).toBe('日本語の勉強 - 初級レッスン 🌸');
    expect(processed[0].channel).toBe('日本語チャンネル');
    expect(processed[1].cleanTitle).toBe('नमस्ते दुनिया - प्रोग्रामिंग सीखें 🚀💻');
    expect(processed[1].channel).toBe('कोड इंडिया');
    expect(processed[2].cleanTitle).toBe('Café & Crème Français ☕🥐');
  });

  it('fast-fails on malformed, truncated, or invalid JSON with TakeoutParseError (D-10)', async () => {
    // Malformed JSON truncated in the middle
    const corruptedChunks = [
      '[{"header": "YouTube", "title": "Watched Half An Entry", "subtit',
      'CORRUPTED_GARBAGE_HERE!!!'
    ];

    const stream = Readable.from(corruptedChunks);
    const processed = [];

    await expect(
      parseTakeoutStream(stream, {
        processItem: (item) => processed.push(item)
      })
    ).rejects.toThrow(TakeoutParseError);
  });
});
