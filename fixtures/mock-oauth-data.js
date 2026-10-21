/**
 * Mock fixtures for YouTube Data API v3 subscriptions and liked videos (API-03, TEST-05)
 */

export const mockSubscriptionsResponse = {
  kind: 'youtube#subscriptionListResponse',
  items: [
    {
      snippet: {
        title: 'Andrew Huberman',
        resourceId: { channelId: 'UC2D2CMWXMOVWx7giW1n3LIg' }
      }
    },
    {
      snippet: {
        title: 'Ali Abdaal',
        resourceId: { channelId: 'UCoOae5nYA7VqaXzerajD0lg' }
      }
    },
    {
      snippet: {
        title: 'Veritasium',
        resourceId: { channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA' }
      }
    },
    {
      snippet: {
        title: 'Kurzgesagt – In a Nutshell',
        resourceId: { channelId: 'UCsXVk37bltHxD1rDPwtNM8Q' }
      }
    },
    {
      snippet: {
        title: 'Lex Fridman',
        resourceId: { channelId: 'UCSHZKyawb77ixDdsGog4iWA' }
      }
    },
    {
      snippet: {
        title: 'Fireship',
        resourceId: { channelId: 'UCsBjURrPoezykLs9EqgamOA' }
      }
    },
    {
      snippet: {
        title: 'The Primeagen',
        resourceId: { channelId: 'UC8ENHE5xdFSwx71u3fDH5Xw' }
      }
    }
  ]
};

export const mockLikedVideosResponse = {
  kind: 'youtube#videoListResponse',
  items: [
    {
      snippet: {
        title: '5 AM Morning Routine of High Achievers',
        channelTitle: 'Ali Abdaal'
      }
    },
    {
      snippet: {
        title: 'The Science of Cold Exposure and Focus',
        channelTitle: 'Andrew Huberman'
      }
    },
    {
      snippet: {
        title: 'Lofi Hip Hop Radio – Beats to Sleep/Study to',
        channelTitle: 'Lofi Girl'
      }
    },
    {
      snippet: {
        title: 'Minecraft Speedrun World Record Attempt #48',
        channelTitle: 'Speedrunner'
      }
    },
    {
      snippet: {
        title: 'How I Built a $10M Business at 23',
        channelTitle: 'HustleBro'
      }
    }
  ]
};
