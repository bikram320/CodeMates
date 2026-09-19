/**
 * src/api/dashboardApi.js
 *
 * Dashboard data layer.
 *
 * There is no single /api/dashboard endpoint on the Spring Boot backend.
 * The dashboard is assembled from multiple microservice calls:
 *
 *   GET /api/users/me                          → user profile
 *   GET /api/projects/my                       → user's projects
 *   GET /api/notifications/unread-count        → notification count
 *   GET /api/discovery/match-scores/top?limit  → suggested developers
 *
 * In mock mode all of this is simulated by dashboardMock.js.
 * In real mode the calls run in parallel and are merged into the
 * same data shape — so Dashboard.jsx and its child components
 * never need to change.
 *
 * ── Switching between mock and real ──────────────────────────────────────────
 *
 * Development (default):
 *   VITE_USE_MOCK=true   in .env
 *
 * When Spring Boot is ready:
 *   VITE_USE_MOCK=false  in .env
 *   VITE_API_BASE_URL=http://localhost:8080
 *
 * That's the only change needed. Dashboard.jsx stays untouched.
 */

import client from './client';
import { getMockDashboard } from '../mock/dashboardMock';

// Default to mock unless explicitly disabled
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// How many suggested developers to request
const MATCH_LIMIT = 4;

// How many upcoming tasks to surface per project (real mode)
const TASKS_PER_PROJECT = 2;

/**
 * getDashboard()
 *
 * Returns everything the Dashboard page needs in one call.
 *
 * Shape returned (same in mock and real):
 * {
 *   user:                { id, username, fullName, avatarUrl, bio, experienceLevel }
 *   stats:               { activeProjects, tasksDueSoon, connections, contributionsThisWeek }
 *   activeProjects:      ProjectResponse[]   (status === ACTIVE, first 4)
 *   upcomingTasks:       TaskResponse[]      (due soonest, across all projects)
 *   recentActivity:      NotificationResponse[]
 *   suggestedDevelopers: MatchScoreResponseDto[]
 * }
 */
export async function getDashboard() {
  if (USE_MOCK) {
    return getMockDashboard();
  }

  // ── Real API: parallel requests ─────────────────────────────────────────────
  // All four calls go out at the same time — no waterfall.
  const [profile, projects, notifCount, matchScores] = await Promise.all([
    client.get('/api/users/me'),
    client.get('/api/projects/my'),
    client.get('/api/notifications/unread-count').catch(() => ({ count: 0 })),
    client.get(`/api/discovery/match-scores/top?limit=${MATCH_LIMIT}`).catch(() => []),
  ]);

  // Active projects only (the endpoint returns all statuses)
  const activeProjects = (projects ?? [])
    .filter((p) => p.status === 'ACTIVE')
    .slice(0, 4);

  // Fetch tasks for each active project in parallel
  const tasksByProject = await Promise.all(
    activeProjects.map((p) =>
      client
        .get(`/api/projects/${p.id}/tasks?status=TODO,IN_PROGRESS&limit=${TASKS_PER_PROJECT}`)
        .catch(() => [])
    )
  );

  // Flatten, sort by dueDate ascending, keep first 5
  const upcomingTasks = tasksByProject
    .flat()
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  // Recent activity from notifications (newest first, limit 6)
  const notificationsPage = await client
    .get('/api/notifications?limit=6')
    .catch(() => ({ notifications: [] }));

  return {
    user: {
      id: profile.userId,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      experienceLevel: profile.experienceLevel,
      initials: getInitials(profile.fullName),
    },
    stats: {
      activeProjects: activeProjects.length,
      tasksDueSoon: upcomingTasks.filter((t) => isDueSoon(t.dueDate)).length,
      connections: 0,        // connection-service endpoint TBD
      contributionsThisWeek: 0, // contribution-service — needs project IDs
    },
    activeProjects: activeProjects.map(normalizeProject),
    upcomingTasks: upcomingTasks.map(normalizeTask),
    recentActivity: (notificationsPage.notifications ?? []).map(normalizeNotification),
    suggestedDevelopers: (matchScores ?? []).map(normalizeMatchScore),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isDueSoon(dateStr) {
  if (!dateStr) return false;
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 1000 * 60 * 60 * 48; // within 48 hours
}

/** Normalize ProjectResponse to the shape components expect */
function normalizeProject(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    role: 'Contributor',      // real role requires member lookup — simplify for now
    memberCount: p.memberCount,
    taskCount: 0,             // no aggregate endpoint — would need separate call
    tasksCompleted: 0,
    techStack: parseTechStack(p.techStack),
    lastActivity: formatRelative(p.createdAt),
    status: p.status,
    githubRepoUrl: p.githubRepoUrl,
  };
}

/** Normalize TaskResponse */
function normalizeTask(t) {
  return {
    id: t.id,
    title: t.title,
    projectId: t.projectId,
    projectName: '',          // not in TaskResponse — add a lookup if needed
    priority: t.priority.toLowerCase(), // API returns HIGH → high
    dueDate: t.dueDate,
    status: t.status,
  };
}

/** Normalize NotificationResponse → activity feed item */
function normalizeNotification(n) {
  return {
    id: n.id,
    type: mapNotificationType(n.type),
    message: n.body || n.title,
    actor: '',
    actorInitials: '??',
    project: '',
    projectId: n.referenceId,
    timestamp: formatRelative(n.createdAt),
  };
}

/** Normalize MatchScoreResponseDto → suggested developer card */
function normalizeMatchScore(m) {
  return {
    id: m.id,
    matchedUserId: m.matchedUserId,
    matchScore: Math.round(m.totalMatchScore ?? 0),
    skillScore: m.skillScore,
    experienceScore: m.experienceScore,
    activityScore: m.activityScore,
    interestScore: m.interestScore,
    // profile fields need a separate /api/users/{username} call — not fetched here yet
    name: '',
    username: '',
    initials: '??',
    bio: '',
    skills: [],
    isConnected: false,
  };
}

function parseTechStack(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return [raw]; }
}

function formatRelative(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapNotificationType(type) {
  const map = {
    TASK_COMPLETED: 'task_completed',
    TASK_ASSIGNED: 'task_assigned',
    PROJECT_MEMBER_JOINED: 'member_joined',
    PROJECT_INVITATION: 'member_joined',
    GITHUB_SYNC_COMPLETED: 'commit',
    MESSAGE_RECEIVED: 'comment',
    PROJECT_CREATED: 'project_created',
  };
  return map[type] ?? 'comment';
}