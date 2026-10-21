/**
 * Pre-computed demo roast report for "The 3 AM Productivity Goblin"
 * Conforms 100% to canonical RoastReportSchema in src/schemas/roast.js (D-12, D-13, D-14)
 */
export const demoRoastReport = {
  brainrotScore: 84,
  viewingArchetype: 'The 3 AM Productivity Goblin',
  roastSummary:
    'You possess the rare psychological affliction of believing you can absorb entrepreneurial acumen by osmosis while horizontal under a weighted blanket at 3:45 AM. Your watch history is a tragicomic tug-of-war between high-neuroticism hustle culture and low-inhibition dopamine seeking. You have watched enough Huberman Lab episodes to know your circadian rhythm is clinically deceased, yet you continue to wash down morning routine tutorials with 7-hour Minecraft speedrun commentary.',
  roasts: [
    {
      style: 'combination',
      joke: 'Nothing says "I am taking control of my life" quite like pairing a 45-minute cold shower lecture with a 6-hour lo-fi study loop where no studying took place.',
      supportingEvidence: 'Observed 12 cold plunge lectures and 34 lo-fi study sessions, with 85% of plays clustered between 1 AM and 4:30 AM.',
      referencedItem: 'Andrew Huberman'
    },
    {
      style: 'specific',
      joke: 'You have re-watched "5 AM Morning Routine of High Achievers" 8 separate times. Irony has never died a more agonizing death, considering every single play occurred at 3:45 AM.',
      supportingEvidence: 'Played 8 times, exclusively between 02:30 AM and 04:15 AM.',
      referencedItem: '5 AM Morning Routine of High Achievers'
    },
    {
      style: 'pattern',
      joke: 'Your Top 5 creators account for over 52% of your entire digital existence. You do not have personal hobbies; you have five parasocial babysitters.',
      supportingEvidence: 'Top 5 creators represent 52.4% of all valid viewing sessions across 90 days.',
      referencedItem: 'Ali Abdaal'
    },
    {
      style: 'archetype',
      joke: 'You are the textbook Productivity Goblin: someone who spends 8 hours researching productivity frameworks to save 12 seconds on an email you will never send.',
      supportingEvidence: 'Clustered 20-minute rapid-fire binges transitioning from Notion workspace setups directly into Minecraft speedruns.',
      referencedItem: 'Minecraft Speedrun World Record Attempt #48'
    }
  ],
  redFlags: [
    'Repeatedly consumed 5 AM morning routine tutorials exclusively between 2:00 AM and 4:30 AM.',
    'Top 5 creators command over 50% of total viewing time, forming an inescapable echo chamber.',
    'Re-watched ambient lo-fi and study beats 14 times without any evidence of accompanying productivity.',
    'Severe doomscrolling velocity with 40%+ of videos launched in rapid succession under 20-minute gaps.'
  ],
  finalVerdict:
    'A terminal dopamine hostage suffering from aspirational insomnia. Stop optimizing your morning routine until you actually experience morning.',
  cardPayload: {
    brainrotScore: 84,
    tier: 'Deep Fried',
    headline: 'The 3 AM Productivity Goblin',
    topCrime: 'Watching 5 AM morning routines at 3:45 AM'
  }
};

/**
 * Pre-computed normalized viewing stats for instant preview
 */
export const demoNormalizedProfile = {
  totalRecords: 350,
  validRecords: 344,
  deletedVideoCount: 6,
  activeDateRange: {
    start: '2026-08-01T00:00:00.000Z',
    end: '2026-10-21T03:45:00.000Z'
  },
  topCreators: {
    primary: [
      { name: 'Ali Abdaal', count: 52, share: 0.151 },
      { name: 'Andrew Huberman', count: 46, share: 0.134 },
      { name: 'Ambient Lo-Fi Chill', count: 38, share: 0.110 },
      { name: 'Minecraft Speedruns', count: 32, share: 0.093 },
      { name: 'HealthyGamerGG', count: 28, share: 0.081 }
    ],
    secondary: [
      'Veritasium',
      'Kurzgesagt',
      'Lex Fridman',
      '3Blue1Brown',
      'MrBeast',
      'Fireship',
      'ColdFusion',
      'James Jani',
      'Coffeezilla',
      'SmarterEveryDay'
    ]
  },
  repeatedTitles: {
    topRepeats: [
      { title: 'Lofi Hip Hop Radio - Beats to Sleep/Study to', count: 14 },
      { title: '5 AM Morning Routine of High Achievers', count: 8 },
      { title: 'Minecraft Speedrun World Record Attempt #48', count: 6 },
      { title: 'How to Optimize Your Dopamine System', count: 4 }
    ],
    totalReplayEvents: 28,
    replayRatio: 0.081
  },
  lateNightTitles: [
    { title: '5 AM Morning Routine of High Achievers', derivedHour: 'watched around 3 AM' },
    { title: 'How to Optimize Your Dopamine System', derivedHour: 'watched around 2 AM' },
    { title: 'Minecraft Speedrun World Record Attempt #48', derivedHour: 'watched around 1 AM' },
    { title: 'Lofi Hip Hop Radio - Beats to Sleep/Study to', derivedHour: 'watched around 2 AM' },
    { title: 'The Science of Deep Work and Focus', derivedHour: 'watched around 4 AM' }
  ],
  sessionClusters: {
    rapidFireCount: 128,
    rapidFireRatio: 0.373,
    candidateTopics: ['productivity', 'speedrun', 'lo-fi', 'dopamine', 'routines']
  },
  dataQuality: {
    totalRecords: 350,
    validRecords: 344,
    missingTimestampCount: 0,
    timestampValidityRate: 1.0,
    isDegraded: false
  },
  isInsufficient: false
};
