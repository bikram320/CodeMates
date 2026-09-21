/**
 * Mock account settings for the Settings page.
 *
 * Only settingsApi.js should import this file, so it can be deleted when the
 * real endpoints are wired in.
 *
 * createMockSettings() returns a fresh object each call:
 *
 * {
 *   profile: {
 *     fullName, username, bio,
 *     experienceLevel      'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
 *     isOpenToCollaborate  boolean
 *     availability         'AVAILABLE' | 'BUSY' | 'AWAY'
 *     skills               string[]
 *     githubUsername, linkedinUrl, portfolioUrl   ('' when not set)
 *   },
 *   avatarUrl: string | null            display only — photo upload isn't built
 *   account: {
 *     email, emailVerified,
 *     authProvider         'LOCAL' | 'GITHUB'   (GitHub accounts have no password)
 *     passwordChangedAt    ISO string | null
 *   },
 *   notifications: {
 *     categories: { [id]: { inApp: boolean, email: boolean } },
 *     digest               'NEVER' | 'DAILY' | 'WEEKLY'
 *   },
 *   preferences: {
 *     theme, language, timezone, timeFormat, startPage, compactCards, reduceMotion
 *   }
 * }
 */

/** Usernames belonging to other people, so a username change can conflict. */
export const MOCK_TAKEN_USERNAMES = [
  'miachen',
  'diego_codes',
  'priya_n',
  'tnovak',
  'sara_ok',
  'liambecker',
  'kaito_ml',
  'nina_codes',
  'admin',
  'codemates',
];

/** Emails already registered to someone else. */
export const MOCK_TAKEN_EMAILS = ['admin@codemates.dev', 'mia.chen@example.com'];

const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

export function createMockSettings() {
  return {
    profile: {
      fullName: 'Aarav Sharma',
      username: 'aarav_dev',
      bio: 'Full-stack developer building tools for developer collaboration. Mostly React and Spring Boot, currently obsessed with clean API contracts and accessible UIs.',
      experienceLevel: 'INTERMEDIATE',
      isOpenToCollaborate: true,
      availability: 'AVAILABLE',
      skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Spring Boot'],
      githubUsername: 'aarav-sharma-dev',
      linkedinUrl: 'https://www.linkedin.com/in/aarav-sharma-demo',
      portfolioUrl: 'https://aaravsharma.example.com',
    },

    avatarUrl: null,

    account: {
      email: 'aarav.sharma@example.com',
      emailVerified: true,
      authProvider: 'LOCAL', // try 'GITHUB' to see the no-password variant
      passwordChangedAt: daysAgo(95),
    },

    notifications: {
      categories: {
        PROJECT_INVITATION: { inApp: true, email: true },
        TEAM_CHANGES: { inApp: true, email: false },
        TASK_ASSIGNED: { inApp: true, email: true },
        TASK_UPDATES: { inApp: true, email: false },
        MESSAGE_RECEIVED: { inApp: true, email: false },
        GITHUB_SYNC: { inApp: false, email: false },
      },
      digest: 'WEEKLY',
    },

    preferences: {
      theme: 'DARK',
      language: 'en-US',
      timezone: 'Europe/London',
      timeFormat: '24H',
      startPage: 'DASHBOARD',
      compactCards: false,
      reduceMotion: false,
    },
  };
}