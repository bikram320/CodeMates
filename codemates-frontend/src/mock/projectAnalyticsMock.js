/**
 * src/mock/analyticsMock.js
 *
 * ⚠️ MOCK DATA ONLY. Invented numbers for UI development — not from GitHub,
 * the task board, or any backend. Only src/api/analyticsApi.js should import
 * this file.
 *
 * Each export below stands in for one slice of analytics. The same sample data
 * is returned for every projectId.
 *
 * Reuses real CodeMates concepts:
 *   - task statuses TODO / IN_PROGRESS / REVIEW / DONE
 *   - task priorities URGENT / HIGH / MEDIUM / LOW
 *   - contributions = ContributionScoreResponse
 *       { userId, tasksCompleted, commitsCount, messagesSent, totalScore }
 *
 * Dev scenarios: add ?mockAnalytics=empty or ?mockAnalytics=error to the URL.
 */

const minutesAgo = (m) => new Date(Date.now() - m * 60_000).toISOString();
const dayString = (daysBack) => new Date(Date.now() - daysBack * 86_400_000).toISOString().slice(0, 10);

// 14 days, oldest → newest. The last 7 days match the "weekly" team numbers.
const TASKS_PER_DAY = [1, 2, 0, 3, 1, 2, 1, 0, 1, 1, 2, 2, 0, 1];
const COMMITS_PER_DAY = [4, 5, 2, 7, 6, 1, 3, 3, 6, 5, 8, 4, 2, 6];
const MESSAGES_PER_DAY = [8, 12, 15, 9, 14, 4, 6, 10, 14, 12, 16, 9, 5, 7];

/* ── sample data (one builder per slice) ─────────────────────────────────── */

const buildOverview = (projectId) => ({
  projectId,
  milestone: { name: "MVP release", dueDate: new Date(Date.now() + 19 * 86_400_000).toISOString() },
});

const buildTasks = () => ({
  overdue: 4,
  byStatus: [
    { id: "todo", label: "To Do", count: 6 },
    { id: "in_progress", label: "In Progress", count: 9 },
    { id: "review", label: "Review", count: 4 },
    { id: "done", label: "Done", count: 29 },
  ],
  byPriority: [
    { id: "urgent", label: "Urgent", total: 4, done: 2 },
    { id: "high", label: "High", total: 12, done: 7 },
    { id: "medium", label: "Medium", total: 20, done: 13 },
    { id: "low", label: "Low", total: 12, done: 7 },
  ],
});

const buildTeam = () => ({
  members: [
    { userId: "u-01", name: "Aarav Sharma", role: "Leader", lastActiveAt: minutesAgo(25), weekly: { tasksCompleted: 2, commits: 9, messages: 21 } },
    { userId: "u-02", name: "Rohan Karki", role: "Contributor", lastActiveAt: minutesAgo(120), weekly: { tasksCompleted: 3, commits: 14, messages: 16 } },
    { userId: "u-03", name: "Sita Gurung", role: "Contributor", lastActiveAt: minutesAgo(300), weekly: { tasksCompleted: 1, commits: 6, messages: 18 } },
    { userId: "u-04", name: "Anita Rai", role: "Contributor", lastActiveAt: minutesAgo(1500), weekly: { tasksCompleted: 1, commits: 4, messages: 9 } },
    { userId: "u-05", name: "Bikash Thapa", role: "Reviewer", lastActiveAt: minutesAgo(2900), weekly: { tasksCompleted: 0, commits: 1, messages: 7 } },
    { userId: "u-06", name: "Kiran Adhikari", role: "Contributor", lastActiveAt: minutesAgo(8700), weekly: { tasksCompleted: 0, commits: 0, messages: 2 } },
  ],
});

const buildContributions = () => ({
  contributions: [
    { userId: "u-01", name: "Aarav Sharma", tasksCompleted: 9, commitsCount: 41, messagesSent: 88, totalScore: 301 },
    { userId: "u-02", name: "Rohan Karki", tasksCompleted: 8, commitsCount: 52, messagesSent: 61, totalScore: 297 },
    { userId: "u-03", name: "Sita Gurung", tasksCompleted: 6, commitsCount: 27, messagesSent: 74, totalScore: 215 },
    { userId: "u-04", name: "Anita Rai", tasksCompleted: 4, commitsCount: 19, messagesSent: 43, totalScore: 140 },
    { userId: "u-05", name: "Bikash Thapa", tasksCompleted: 2, commitsCount: 8, messagesSent: 35, totalScore: 79 },
    { userId: "u-06", name: "Kiran Adhikari", tasksCompleted: 0, commitsCount: 5, messagesSent: 22, totalScore: 37 },
  ],
});

const buildActivity = () => ({
  trend: TASKS_PER_DAY.map((t, i) => ({
    date: dayString(13 - i),
    tasksCompleted: t,
    commits: COMMITS_PER_DAY[i],
    messages: MESSAGES_PER_DAY[i],
  })),
  events: [
    { id: "a1", type: "COMMIT_PUSHED", actorName: "Rohan Karki", message: "pushed 3 commits to develop", createdAt: minutesAgo(18) },
    { id: "a2", type: "TASK_COMPLETED", actorName: "Aarav Sharma", message: "completed \"Add JWT refresh interceptor\"", createdAt: minutesAgo(55) },
    { id: "a3", type: "MESSAGE_SENT", actorName: "Sita Gurung", message: "posted standup notes in project chat", createdAt: minutesAgo(130) },
    { id: "a4", type: "TASK_STATUS_CHANGED", actorName: "Anita Rai", message: "moved \"Contribution score card\" to Review", createdAt: minutesAgo(190) },
    { id: "a5", type: "MEMBER_JOINED", actorName: "Bikash Thapa", message: "joined the project as Reviewer", createdAt: minutesAgo(320) },
    { id: "a6", type: "RESOURCE_SHARED", actorName: "Aarav Sharma", message: "shared \"API design doc\" in Resources", createdAt: minutesAgo(1560) },
    { id: "a7", type: "TASK_COMPLETED", actorName: "Rohan Karki", message: "completed \"Kanban drag-and-drop\"", createdAt: minutesAgo(1700) },
    { id: "a8", type: "MESSAGE_SENT", actorName: "Kiran Adhikari", message: "asked about the trail map screens in chat", createdAt: minutesAgo(2900) },
  ],
});

/* ── empty variants ──────────────────────────────────────────────────────── */

const EMPTY_TASKS = {
  overdue: 0,
  byStatus: [
    { id: "todo", label: "To Do", count: 0 },
    { id: "in_progress", label: "In Progress", count: 0 },
    { id: "review", label: "Review", count: 0 },
    { id: "done", label: "Done", count: 0 },
  ],
  byPriority: [],
};

/* ── scenario + network simulation ───────────────────────────────────────── */

function getScenario() {
  try {
    return new URLSearchParams(window.location.search).get("mockAnalytics") || "default";
  } catch {
    return "default";
  }
}

const apiError = (message, status) => Object.assign(new Error(message), { status });

/** Resolves `build(isEmpty)` after a small delay, or rejects in the "error" scenario. */
function respond(baseDelay, build) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const scenario = getScenario();
      if (scenario === "error") {
        return reject(apiError("Couldn't load project analytics. Try again in a moment.", 503));
      }
      resolve(build(scenario === "empty"));
    }, baseDelay + Math.random() * 200);
  });
}

/* ── mock endpoints ──────────────────────────────────────────────────────── */

export const mockGetProjectAnalytics = (projectId) =>
  respond(450, (empty) => (empty ? { projectId, milestone: null } : buildOverview(projectId)));

export const mockGetTaskAnalytics = () => respond(600, (empty) => (empty ? EMPTY_TASKS : buildTasks()));

export const mockGetTeamActivity = () => respond(700, (empty) => (empty ? { members: [] } : buildTeam()));

export const mockGetContributionAnalytics = () =>
  respond(550, (empty) => (empty ? { contributions: [] } : buildContributions()));

export const mockGetProjectActivity = () =>
  respond(650, (empty) => (empty ? { trend: [], events: [] } : buildActivity()));