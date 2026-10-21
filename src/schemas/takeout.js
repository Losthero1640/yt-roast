import { z } from 'zod';

/**
 * Single subtitle / channel reference in Google Takeout
 */
export const TakeoutSubtitleSchema = z.object({
  name: z.string().optional(),
  url: z.string().optional()
});

/**
 * Raw item from Google Takeout watch-history.json
 */
export const TakeoutItemSchema = z.object({
  header: z.string().optional(),
  title: z.string().optional(),
  titleUrl: z.string().optional(),
  subtitles: z.array(TakeoutSubtitleSchema).optional(),
  time: z.string().optional(),
  products: z.array(z.string()).optional(),
  activityControls: z.array(z.string()).optional()
});

/**
 * Normalized viewing profile output by TakeoutNormalizer
 */
export const NormalizedViewingProfileSchema = z.object({
  totalRecords: z.number().int().nonnegative(),
  validRecords: z.number().int().nonnegative(),
  deletedVideoCount: z.number().int().nonnegative(),
  activeDateRange: z.object({
    start: z.string(),
    end: z.string()
  }).nullable(),
  topCreators: z.object({
    primary: z.array(z.object({
      name: z.string(),
      count: z.number().int().positive(),
      share: z.number().min(0).max(1)
    })),
    secondary: z.array(z.string())
  }),
  repeatedTitles: z.object({
    topRepeats: z.array(z.object({
      title: z.string(),
      count: z.number().int().min(2)
    })),
    totalReplayEvents: z.number().int().nonnegative(),
    replayRatio: z.number().min(0).max(1)
  }),
  lateNightTitles: z.array(z.object({
    title: z.string(),
    derivedHour: z.string()
  })),
  sessionClusters: z.object({
    rapidFireCount: z.number().int().nonnegative(),
    rapidFireRatio: z.number().min(0).max(1),
    candidateTopics: z.array(z.string())
  }),
  dataQuality: z.object({
    totalRecords: z.number().int().nonnegative(),
    validRecords: z.number().int().nonnegative(),
    missingTimestampCount: z.number().int().nonnegative(),
    timestampValidityRate: z.number().min(0).max(1),
    isDegraded: z.boolean()
  }),
  isInsufficient: z.boolean()
});
