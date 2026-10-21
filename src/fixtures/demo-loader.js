import { demoRoastReport, demoNormalizedProfile } from '../../fixtures/demo-profile.js';
import { RoastReportSchema } from '../schemas/roast.js';
import { NormalizedViewingProfileSchema } from '../schemas/takeout.js';

/**
 * Returns the bundled pre-computed roast report for "The 3 AM Productivity Goblin" (INGEST-04, D-12, D-14)
 * Guarantees zero latency and zero external AI API invocation
 *
 * @returns {import('../schemas/roast.js').RoastReport}
 */
export function getDemoRoastProfile() {
  // Validate data against canonical schema to ensure no drift
  return RoastReportSchema.parse(demoRoastReport);
}

/**
 * Returns the pre-computed normalized statistics for the demo profile
 *
 * @returns {import('../schemas/takeout.js').NormalizedViewingProfile}
 */
export function getDemoNormalizedProfile() {
  return NormalizedViewingProfileSchema.parse(demoNormalizedProfile);
}
