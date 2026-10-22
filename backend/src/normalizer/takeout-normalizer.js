/**
 * High-signal topic keyword heuristic patterns (D-07)
 */
const TOPIC_REGEX =
  /\b(tutorial|speedrun|essay|gameplay|podcast|compilation|lo-fi|lofi|meditation|workout|routine|review|challenge|explained|guide|asmr|reaction|deep dive)\b/gi;

/**
 * 20-minute rapid-fire session gap threshold in milliseconds (D-07)
 */
const SESSION_GAP_THRESHOLD_MS = 20 * 60 * 1000; // 1,200,000 ms

/**
 * Formats hour integer (0–4) into friendly derived label (D-06)
 *
 * @param {number} hour
 * @returns {string}
 */
function formatDerivedHour(hour) {
  if (hour === 0) return 'watched around 12 AM';
  return `watched around ${hour} AM`;
}

/**
 * In-memory streaming normalizer and statistical reducer (NORM-01 to NORM-05)
 */
export class TakeoutNormalizer {
  constructor() {
    this.totalRecords = 0;
    this.validRecords = 0;
    this.deletedVideoCount = 0;

    /** @type {Map<string, number>} */
    this.creatorMap = new Map();

    /** @type {Map<string, { count: number, originalTitle: string, lateNightCount: number, sampleHour: number | null }>} */
    this.titleMap = new Map();

    /** @type {number[]} */
    this.hourBins = new Array(24).fill(0);

    /** @type {Map<string, { originalTitle: string, repeatCount: number, peakHour: number }>} */
    this.lateNightCandidateMap = new Map();

    /** @type {number | null} */
    this.prevTimestampMs = null;
    this.rapidFireCount = 0;
    this.validTimestampCount = 0;

    /** @type {number | null} */
    this.minTimestamp = null;
    /** @type {number | null} */
    this.maxTimestamp = null;

    /** @type {Set<string>} */
    this.candidateTopicSet = new Set();
  }

  /**
   * Tracks deleted-video placeholder without adding to valid counts
   */
  recordDeleted() {
    this.totalRecords++;
    this.deletedVideoCount++;
  }

  /**
   * Online reducer: processes a single parsed Takeout item and dereferences it immediately (PRIV-01, PRIV-02)
   *
   * @param {{ cleanTitle: string, channel: string, time?: string }} item
   */
  processItem(item) {
    this.totalRecords++;
    this.validRecords++;

    const cleanTitle = item.cleanTitle || 'Untitled Video';
    const channel = item.channel || 'Unknown Channel';

    // 1. Channel concentration (NORM-01, D-04)
    this.creatorMap.set(channel, (this.creatorMap.get(channel) || 0) + 1);

    // 2. Title tracking (NORM-03, D-05)
    const titleKey = cleanTitle.toLowerCase();
    const titleEntry = this.titleMap.get(titleKey) || {
      count: 0,
      originalTitle: cleanTitle,
      lateNightCount: 0,
      sampleHour: null
    };
    titleEntry.count++;

    // 3. Timestamp analysis (NORM-02, D-06, D-07)
    let itemHour = null;
    if (item.time) {
      const parsedDate = new Date(item.time);
      const timestampMs = parsedDate.getTime();

      if (!Number.isNaN(timestampMs)) {
        this.validTimestampCount++;
        itemHour = parsedDate.getUTCHours();
        this.hourBins[itemHour]++;
        titleEntry.sampleHour = itemHour;

        if (this.minTimestamp === null || timestampMs < this.minTimestamp) {
          this.minTimestamp = timestampMs;
        }
        if (this.maxTimestamp === null || timestampMs > this.maxTimestamp) {
          this.maxTimestamp = timestampMs;
        }

        // Late-night detection (12:00 AM–4:59 AM: UTC hours 0..4)
        if (itemHour >= 0 && itemHour < 5) {
          titleEntry.lateNightCount++;
          const lateEntry = this.lateNightCandidateMap.get(titleKey) || {
            originalTitle: cleanTitle,
            repeatCount: 0,
            peakHour: itemHour
          };
          lateEntry.repeatCount++;
          // Give goblin hours (2 AM or 3 AM) priority
          if (itemHour === 2 || itemHour === 3) {
            lateEntry.peakHour = itemHour;
          }
          this.lateNightCandidateMap.set(titleKey, lateEntry);
        }

        // Rapid-fire binge clustering: consecutive videos <= 20 minutes apart
        if (this.prevTimestampMs !== null) {
          const delta = Math.abs(timestampMs - this.prevTimestampMs);
          if (delta <= SESSION_GAP_THRESHOLD_MS) {
            this.rapidFireCount++;
          }
        }
        this.prevTimestampMs = timestampMs;
      }
    }

    this.titleMap.set(titleKey, titleEntry);

    // 4. Topic extraction heuristic (D-07)
    const matches = cleanTitle.match(TOPIC_REGEX);
    if (matches) {
      for (const m of matches) {
        this.candidateTopicSet.add(m.toLowerCase());
      }
    }
  }

  /**
   * Finalizes aggregated metrics into NormalizedViewingProfile
   *
   * @returns {Object} NormalizedViewingProfile
   */
  finalize() {
    const isInsufficient = this.validRecords < 20;

    // Creator dynamic tiering: Top 5 primary with stats, ranks 6–15 names only (D-04)
    const sortedCreators = Array.from(this.creatorMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const primaryCreators = sortedCreators.slice(0, 5).map(([name, count]) => ({
      name,
      count,
      share: this.validRecords > 0 ? Number((count / this.validRecords).toFixed(4)) : 0
    }));

    const secondaryCreators = sortedCreators.slice(5, 15).map(([name]) => name);

    // Repeated titles: >= 3 plays required for top repeats list; totalReplayEvents = sum(count - 1) for count >= 2 (D-05)
    let totalReplayEvents = 0;
    const qualifyingRepeats = [];

    for (const entry of this.titleMap.values()) {
      if (entry.count >= 2) {
        totalReplayEvents += entry.count - 1;
      }
      if (entry.count >= 3) {
        qualifyingRepeats.push({
          title: entry.originalTitle,
          count: entry.count
        });
      }
    }

    qualifyingRepeats.sort((a, b) => b.count - a.count);
    const topRepeats = qualifyingRepeats.slice(0, 5);
    const replayRatio =
      this.validRecords > 0
        ? Number((totalReplayEvents / this.validRecords).toFixed(4))
        : 0;

    // Late-night titles: Top 5 distinct prioritized by repeat count, goblin hours (D-06)
    const sortedLateNight = Array.from(this.lateNightCandidateMap.values()).sort(
      (a, b) => {
        if (b.repeatCount !== a.repeatCount) {
          return b.repeatCount - a.repeatCount;
        }
        const aIsGoblin = a.peakHour === 2 || a.peakHour === 3 ? 1 : 0;
        const bIsGoblin = b.peakHour === 2 || b.peakHour === 3 ? 1 : 0;
        if (bIsGoblin !== aIsGoblin) {
          return bIsGoblin - aIsGoblin;
        }
        return a.originalTitle.localeCompare(b.originalTitle);
      }
    );

    const lateNightTitles = sortedLateNight.slice(0, 5).map((item) => ({
      title: item.originalTitle,
      derivedHour: formatDerivedHour(item.peakHour)
    }));

    // Viewing hours & late-night ratio (NORM-02, D-01)
    const lateNightViews = this.hourBins.slice(0, 5).reduce((sum, count) => sum + count, 0);
    const lateNightRatio =
      this.validTimestampCount > 0
        ? Number((lateNightViews / this.validTimestampCount).toFixed(4))
        : 0;

    // Session clustering & rapid-fire ratio (D-07)
    const timestampIntervals = Math.max(0, this.validTimestampCount - 1);
    const rapidFireRatio =
      timestampIntervals > 0
        ? Number((this.rapidFireCount / timestampIntervals).toFixed(4))
        : 0;

    // Data quality assessment (D-03)
    const missingTimestampCount = this.validRecords - this.validTimestampCount;
    const timestampValidityRate =
      this.validRecords > 0
        ? Number((this.validTimestampCount / this.validRecords).toFixed(4))
        : 0;

    const isDegraded =
      this.validTimestampCount < 20 ||
      (this.validRecords > 0 && missingTimestampCount / this.validRecords > 0.5);

    const activeDateRange =
      this.minTimestamp !== null && this.maxTimestamp !== null
        ? {
            start: new Date(this.minTimestamp).toISOString(),
            end: new Date(this.maxTimestamp).toISOString()
          }
        : null;

    return {
      totalRecords: this.totalRecords,
      validRecords: this.validRecords,
      deletedVideoCount: this.deletedVideoCount,
      activeDateRange,
      topCreators: {
        primary: primaryCreators,
        secondary: secondaryCreators
      },
      repeatedTitles: {
        topRepeats,
        totalReplayEvents,
        replayRatio
      },
      lateNightTitles,
      viewingHours: {
        lateNightViews,
        lateNightRatio,
        hourBins: [...this.hourBins]
      },
      sessionClusters: {
        rapidFireCount: this.rapidFireCount,
        rapidFireRatio,
        candidateTopics: Array.from(this.candidateTopicSet).slice(0, 8)
      },
      dataQuality: {
        totalRecords: this.totalRecords,
        validRecords: this.validRecords,
        missingTimestampCount,
        timestampValidityRate,
        isDegraded
      },
      isInsufficient
    };
  }
}
