import { PayloadTooLargeError } from './errors.js';

/**
 * Hard serialized prompt payload ceiling in bytes (D-16)
 */
export const MAX_PROMPT_BYTES = 4096;

/**
 * Maximum character length for individual titles and creators to eliminate bloat (D-16)
 */
export const MAX_ENTITY_CHARS = 80;

/**
 * Defensive string clamping removing control characters and limiting length (D-16)
 *
 * @param {string} [str]
 * @param {number} [maxChars=80]
 * @returns {string}
 */
export function clampText(str, maxChars = MAX_ENTITY_CHARS) {
  if (!str || typeof str !== 'string') return '';
  // Strip control characters, null bytes, and excess whitespace
  const sanitized = str.replace(/[\x00-\x1F\x7F]+/g, ' ').trim();
  if (sanitized.length <= maxChars) return sanitized;
  return sanitized.slice(0, maxChars - 3) + '...';
}

/**
 * Extracts allowed creators and video titles for post-generation hallucination checks (D-18)
 *
 * @param {Object} profile - Normalized viewing profile
 * @returns {{ creators: string[], titles: string[] }}
 */
export function extractAllowedEvidence(profile = {}) {
  const creators = new Set();
  const titles = new Set();

  // Top primary creators
  for (const c of profile.topCreators?.primary || []) {
    if (c.name && c.name !== 'Unknown Channel') {
      creators.add(c.name.trim());
    }
  }

  // Secondary creators
  for (const name of profile.topCreators?.secondary || []) {
    if (name && name !== 'Unknown Channel') {
      creators.add(name.trim());
    }
  }

  // Top repeated titles
  for (const item of profile.repeatedTitles?.topRepeats || []) {
    if (item.title) {
      titles.add(item.title.trim());
    }
  }

  // Late-night titles
  for (const item of profile.lateNightTitles || []) {
    if (item.title) {
      titles.add(item.title.trim());
    }
  }

  return {
    creators: Array.from(creators),
    titles: Array.from(titles)
  };
}

/**
 * Assembles a size-capped, PII-purged prompt embedding locked deterministic scores (D-16, D-18, D-19, PRIV-03)
 *
 * @param {Object} params
 * @param {Object} params.profile - Normalized viewing profile from Phase 1
 * @param {Object} params.scoreResult - Deterministic Brainrot score result from Phase 1
 * @returns {string} Assembled prompt string guaranteed to be <= 4,096 bytes
 */
export function buildRoastPrompt({ profile, scoreResult }) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('Valid NormalizedViewingProfile is required to build roast prompt.');
  }
  if (!scoreResult || typeof scoreResult !== 'object') {
    throw new Error('Valid BrainrotScoreResult is required to build roast prompt.');
  }

  // 1. Evidence Extraction & Capping (D-16)
  const primaryCreators = (profile.topCreators?.primary || [])
    .slice(0, 5)
    .map((c) => `${clampText(c.name, 40)} (${c.count}v, ${Math.round((c.share || 0) * 100)}%)`);

  const secondaryCreators = (profile.topCreators?.secondary || [])
    .slice(0, 6)
    .map((name) => clampText(name, 35));

  const repeatTitles = (profile.repeatedTitles?.topRepeats || [])
    .slice(0, 4)
    .map((item) => `"${clampText(item.title, 45)}" (${item.count}x)`);

  const lateNightTitles = (profile.lateNightTitles || [])
    .slice(0, 3)
    .map((item) => `"${clampText(item.title, 45)}"`);

  const topics = (profile.sessionClusters?.candidateTopics || [])
    .slice(0, 5)
    .map((t) => clampText(t, 25));

  // 2. Aggregate metrics (purging exact timestamps and URLs)
  let activeSpan = 'unspecified time period';
  if (profile.activeDateRange?.start && profile.activeDateRange?.end) {
    const msDiff = Math.abs(
      new Date(profile.activeDateRange.end).getTime() - new Date(profile.activeDateRange.start).getTime()
    );
    const days = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24)));
    activeSpan = `${days} days`;
  }

  const rapidFireRatio = Math.round((profile.sessionClusters?.rapidFireRatio || 0) * 100);
  const replayRatio = Math.round((profile.repeatedTitles?.replayRatio || 0) * 100);
  const lateNightRatio = Math.round((profile.viewingHours?.lateNightRatio || 0) * 100);

  // 3. Deterministic Brainrot Ground Truth (D-19)
  const lockedScore = scoreResult.score !== null ? scoreResult.score : 'Unranked';
  const lockedTier = scoreResult.tier || 'Unranked';
  const subscores = scoreResult.subscores || {};
  const sLate = subscores.lateNight !== null && subscores.lateNight !== undefined ? `${subscores.lateNight}/100` : 'unobserved';
  const sRep = subscores.repetition !== null && subscores.repetition !== undefined ? `${subscores.repetition}/100` : 'unobserved';
  const sVel = subscores.velocity !== null && subscores.velocity !== undefined ? `${subscores.velocity}/100` : 'unobserved';

  // 4. Construct Structured Prompt String
  const prompt = `You are an elite, merciless standup comedy roast master and sharp cultural critic performing a personalized roast based on a user's verified YouTube activity.

=== LOCKED DETERMINISTIC METRICS (DO NOT ALTER) ===
- Brainrot Score: ${lockedScore}/100
- Comedic Tier: ${lockedTier}
- Subscores: Late-Night = ${sLate}, Repetition = ${sRep}, Velocity = ${sVel}

=== OBSERVED VIEWING EVIDENCE (STRICT GROUND TRUTH) ===
- Total Valid Videos Watched: ${profile.validRecords || 0} across ${activeSpan}
- Rapid-Fire Doomscrolling Velocity: ${rapidFireRatio}% of views started within 20m of previous view
- Late-Night Bingeing (12 AM–5 AM): ${lateNightRatio}% of all timestamped views
- Title Replay Ratio: ${replayRatio}% of views were repeat viewings
- Top 5 Primary Creators: ${primaryCreators.length > 0 ? primaryCreators.join('; ') : 'None'}
- Other Frequent Channels: ${secondaryCreators.length > 0 ? secondaryCreators.join(', ') : 'None'}
- Top Repeated Titles: ${repeatTitles.length > 0 ? repeatTitles.join('; ') : 'None'}
- Notable Late-Night Titles: ${lateNightTitles.length > 0 ? lateNightTitles.join('; ') : 'None'}
- Recurring Topic Clusters: ${topics.length > 0 ? topics.join(', ') : 'None'}

=== COMEDY ROASTMASTER RULES & PUNCHLINE MECHANICS ===
1. Tone: Lethal, witty, punchline-driven standup roast. Make the user laugh out loud at their own absurdity.
2. BANNED CLICHÉS (NEVER USE): "goldfish memory/retention", "algorithm having an identity crisis", "delicate dance/juggling act", "digital graveyard", "testament to", "selective amnesia", "it's not just X", "proving that you".
3. ROAST SUMMARY (OPENING MONOLOGUE): Open directly with character assassination. Contrast who they pretend to be (10x tech architect, productivity guru) vs who their watch history reveals they actually are (procrastinating, keeping tutorials pinned like trophies while watching drama roasts in bed). Every sentence must sting.
4. JOKE DIVERSITY & STYLE RULES (AI-04, D-18):
   - You MUST generate at least 4 jokes in the "roasts" array covering the 4 styles:
     * "pattern": Roast habits (re-watching, bingeing). Don't call them forgetful; roast treating tutorials like comfort sitcoms, waiting for syntax to enter via telepathy without writing code.
     * "combination": Synthesize TWO contrasting patterns (e.g. serious architecture vs comedy roasts). Frame the clash vividly with an absurd punchline.
     * "specific": Target a specific creator or title from evidence in "referencedItem". Attack the irony of the title vs their actual life.
     * "archetype": Dissect their fictional persona (the armchair CTO, tutorial hell resident).
5. Grounding: All specific references must strictly use real entities from above. No clinical diagnoses.
6. Return between 3 and 5 punchy "redFlags".
7. Conclude with a memorable, scathing "finalVerdict" that cuts to the core of their procrastination.
8. Include a "cardPayload" with brainrotScore: ${lockedScore === 'Unranked' ? 0 : lockedScore}, tier: "${lockedTier}", headline, and topCrime.`;

  // 5. Explicit Measurement & Hard Ceiling Rejection (D-16)
  const byteLength = Buffer.byteLength(prompt, 'utf8');
  if (byteLength > MAX_PROMPT_BYTES) {
    throw new PayloadTooLargeError(
      `Serialized evidence prompt exceeds hard ceiling of ${MAX_PROMPT_BYTES} bytes (measured: ${byteLength} bytes).`
    );
  }

  return prompt;
}
