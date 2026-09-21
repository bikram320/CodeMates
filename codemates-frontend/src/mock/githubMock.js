/**
 * Mock GitHub data for the Project GitHub page.
 *
 * ⚠️ Nothing here comes from GitHub — it's sample data shaped like what the
 * page needs. Only githubApi.js should import this file, so it can be deleted
 * when the real endpoints are wired in.
 *
 * createMockGitHubData() returns a fresh snapshot on every call (timestamps
 * are relative to "now", so "synced 12m ago" stays believable) with:
 *
 *   repository      { id, repoName, repoFullName, repoUrl, description, isPrivate,
 *                     isArchived, defaultBranch, primaryLanguage, starsCount,
 *                     forksCount, lastPushedAt, lastSyncedAt, connectedBy, connectedAt }
 *   stats           { totalCommits, commitsLast7Days, commitsLast30Days, lastCommitAt,
 *                     branches, pullRequests: { open, merged, closed },
 *                     issues: { open, closed } }
 *   dailyCommits    [{ date: 'YYYY-MM-DD', count }]   14 days, oldest → newest
 *   recentCommits   [{ sha, message, author: { name, username }, branch, committedAt }]
 *   recentActivity  [{ id, type, actor, number?, title?, ref?, createdAt }]
 *
 * plus the underlying lists the numbers above are drawn from (not shown in the
 * UI yet, kept so future Branches / Pull requests / Issues views have data):
 *
 *   branches        every branch (stats.branches === branches.length)
 *   pullRequests    the most recent PRs (stats.pullRequests are repo-wide totals)
 *   issues          the most recent issues (stats.issues are repo-wide totals)
 */

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h) => minutesAgo(h * 60);
const daysAgo = (d) => hoursAgo(d * 24);
const dateOnly = (d) => daysAgo(d).slice(0, 10);

// Commits per day, oldest → newest. The last 7 add up to 27.
const DAILY_COUNTS = [3, 5, 4, 6, 2, 1, 0, 4, 7, 6, 5, 3, 0, 2];

export function createMockGitHubData() {
  const repository = {
    id: 'repo-codemates-frontend',
    repoName: 'codemates-frontend',
    repoFullName: 'codemates-dev/codemates-frontend',
    repoUrl: 'https://github.com/codemates-dev/codemates-frontend',
    description:
      'React + Tailwind frontend for CodeMates: developer discovery, project workspaces, Kanban tasks, team management and contribution tracking.',
    isPrivate: true,
    isArchived: false,
    defaultBranch: 'main',
    primaryLanguage: 'JavaScript',
    starsCount: 24,
    forksCount: 3,
    lastPushedAt: hoursAgo(2),
    lastSyncedAt: minutesAgo(12),
    connectedBy: 'aarav_dev',
    connectedAt: '2026-03-06T10:20:00Z',
  };

  const dailyCommits = DAILY_COUNTS.map((count, i) => ({
    date: dateOnly(DAILY_COUNTS.length - 1 - i),
    count,
  }));

  const recentCommits = [
    {
      sha: 'a3f9c21e7b04d58a91c6e2f03b7d4a18c5e9f602',
      message: 'feat(team): connect ProjectTeam page to useProjectTeam hook',
      author: { name: 'Aarav Sharma', username: 'aarav_dev' },
      branch: 'main',
      committedAt: hoursAgo(2),
    },
    {
      sha: '7be1d048c2a95f36e8b04d71a3c96e52f1d8a437',
      message: 'fix(kanban): keep column scroll position after task update',
      author: { name: 'Mia Chen', username: 'miachen' },
      branch: 'fix/kanban-scroll',
      committedAt: hoursAgo(5),
    },
    {
      sha: 'c40a8e59f1b73d26a0e94c8b57d31f6e2a9c8d05',
      message: 'feat(github): add repository stats cards',
      author: { name: 'Aarav Sharma', username: 'aarav_dev' },
      branch: 'feature/github-integration',
      committedAt: hoursAgo(9),
    },
    {
      sha: '19d5f7a3e08c46b1d2f95a7e30c8b64d1e7f2a93',
      message: 'refactor(api): unwrap ApiResponse envelope in one place',
      author: { name: 'Diego Alvarez', username: 'diego_codes' },
      branch: 'main',
      committedAt: daysAgo(1),
    },
    {
      sha: 'e82b04c9d6a3517f8e20b4d95a1c7e36f0d8b542',
      message: 'style(a11y): stronger focus rings on modal controls',
      author: { name: 'Sara Okafor', username: 'sara_ok' },
      branch: 'main',
      committedAt: daysAgo(2),
    },
    {
      sha: '5c7a91e2b3f084d6a19e5c02f8b7d43a6e1c9f80',
      message: 'docs: add local setup steps to README',
      author: { name: 'Priya Nair', username: 'priya_n' },
      branch: 'docs/readme-setup',
      committedAt: daysAgo(2),
    },
    {
      sha: 'b06e3d84a7c1592f0e8d46b3a95c7f21d8e04a6c',
      message: 'chore(ci): cache node_modules between workflow runs',
      author: { name: 'Tomás Novak', username: 'tnovak' },
      branch: 'main',
      committedAt: daysAgo(3),
    },
  ];

  const branches = [
    { name: 'main', isDefault: true, lastCommitBy: 'aarav_dev', lastCommitAt: hoursAgo(2) },
    { name: 'fix/kanban-scroll', isDefault: false, lastCommitBy: 'miachen', lastCommitAt: hoursAgo(5) },
    { name: 'feature/github-integration', isDefault: false, lastCommitBy: 'aarav_dev', lastCommitAt: hoursAgo(9) },
    { name: 'feature/chat-message-list', isDefault: false, lastCommitBy: 'diego_codes', lastCommitAt: daysAgo(1) },
    { name: 'docs/readme-setup', isDefault: false, lastCommitBy: 'priya_n', lastCommitAt: daysAgo(2) },
    { name: 'feature/resource-links', isDefault: false, lastCommitBy: 'sara_ok', lastCommitAt: daysAgo(6) },
    { name: 'chore/ci-cache', isDefault: false, lastCommitBy: 'tnovak', lastCommitAt: daysAgo(5) },
    { name: 'refactor/api-envelope', isDefault: false, lastCommitBy: 'diego_codes', lastCommitAt: daysAgo(1) },
    { name: 'release/v0.4.0', isDefault: false, lastCommitBy: 'tnovak', lastCommitAt: daysAgo(4) },
  ];

  const pullRequests = [
    { number: 69, title: 'feat(github): GitHub integration UI', author: 'aarav_dev', state: 'OPEN', branch: 'feature/github-integration', createdAt: hoursAgo(4) },
    { number: 68, title: 'feat(team): project team page UI', author: 'miachen', state: 'MERGED', branch: 'feature/team-page', createdAt: daysAgo(2), mergedAt: hoursAgo(1) },
    { number: 67, title: 'feat(chat): project chat message list', author: 'diego_codes', state: 'OPEN', branch: 'feature/chat-message-list', createdAt: daysAgo(1) },
    { number: 66, title: 'style(a11y): stronger focus rings on modal controls', author: 'sara_ok', state: 'MERGED', branch: 'style/focus-rings', createdAt: daysAgo(3), mergedAt: daysAgo(2) },
    { number: 65, title: 'docs: add local setup steps to README', author: 'priya_n', state: 'OPEN', branch: 'docs/readme-setup', createdAt: daysAgo(2) },
    { number: 64, title: 'chore(ci): try pnpm cache', author: 'tnovak', state: 'CLOSED', branch: 'chore/pnpm-cache', createdAt: daysAgo(6), closedAt: daysAgo(5) },
    { number: 63, title: 'fix(kanban): keep column scroll position after task update', author: 'miachen', state: 'OPEN', branch: 'fix/kanban-scroll', createdAt: hoursAgo(5) },
  ];

  const issues = [
    { number: 41, title: 'Contribution score lags after commit sync', author: 'priya_n', state: 'OPEN', labels: ['bug'], createdAt: hoursAgo(8) },
    { number: 40, title: 'Invite modal does not restore focus on close', author: 'sara_ok', state: 'OPEN', labels: ['a11y'], createdAt: daysAgo(1) },
    { number: 39, title: 'Add pagination to project discovery', author: 'tnovak', state: 'OPEN', labels: ['enhancement'], createdAt: daysAgo(3) },
    { number: 38, title: 'Focus ring has low contrast on Kanban cards', author: 'sara_ok', state: 'CLOSED', labels: ['a11y'], createdAt: daysAgo(4), closedAt: daysAgo(2) },
    { number: 37, title: 'CORS blocked when calling the gateway from Vite dev server', author: 'diego_codes', state: 'CLOSED', labels: ['bug'], createdAt: daysAgo(8), closedAt: daysAgo(6) },
    { number: 36, title: 'Support binary file upload for workspace resources', author: 'aarav_dev', state: 'OPEN', labels: ['enhancement'], createdAt: daysAgo(9) },
  ];

  const stats = {
    totalCommits: 342,
    commitsLast7Days: dailyCommits.slice(-7).reduce((sum, d) => sum + d.count, 0),
    commitsLast30Days: 118,
    lastCommitAt: recentCommits[0].committedAt,
    branches: branches.length,
    pullRequests: { open: 4, merged: 61, closed: 3 },
    issues: { open: 12, closed: 47 },
  };

  const recentActivity = [
    { id: 'ev-1', type: 'PULL_REQUEST_MERGED', actor: 'miachen', number: 68, title: 'feat(team): project team page UI', createdAt: hoursAgo(1) },
    { id: 'ev-2', type: 'PULL_REQUEST_OPENED', actor: 'aarav_dev', number: 69, title: 'feat(github): GitHub integration UI', createdAt: hoursAgo(4) },
    { id: 'ev-3', type: 'ISSUE_OPENED', actor: 'priya_n', number: 41, title: 'Contribution score lags after commit sync', createdAt: hoursAgo(8) },
    { id: 'ev-4', type: 'BRANCH_CREATED', actor: 'aarav_dev', ref: 'feature/github-integration', createdAt: daysAgo(1) },
    { id: 'ev-5', type: 'ISSUE_CLOSED', actor: 'sara_ok', number: 38, title: 'Focus ring has low contrast on Kanban cards', createdAt: daysAgo(2) },
    { id: 'ev-6', type: 'RELEASE_PUBLISHED', actor: 'tnovak', ref: 'v0.4.0', createdAt: daysAgo(4) },
  ];

  return {
    repository,
    stats,
    dailyCommits,
    recentCommits,
    recentActivity,
    branches,
    pullRequests,
    issues,
  };
}