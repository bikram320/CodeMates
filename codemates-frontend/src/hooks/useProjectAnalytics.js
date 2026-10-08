/**
 * src/hooks/useProjectAnalytics.js
 *
 * Data hook for the Project Analytics page — real backend, no mock.
 *
 *   ProjectAnalytics.jsx → useProjectAnalytics(projectId)
 *     → projectApi.js         getProject, getProjectMembers   (project-service)
 *     → taskApi.js            getTasks                        (project-service)
 *     → contributionsApi.js   getProjectContributions,
 *                             getContributionActivity          (contribution-service)
 *     → projectHealthApi.js   getProjectHealth, syncProjectHealth (project-service)
 *     → useUserDirectory      userId → real profile (fullName / username)
 *
 * Names: every DTO only carries a raw userId, so all userIds found in members,
 * contribution scores and activity events are resolved in ONE batched call via
 * useUserDirectory, then each derived shape gets a real display name.
 * Fallback order: fullName → username → "User 1234abcd".
 *
 * Health is intentionally NOT part of the "core" ready-state: it has its own
 * loading/empty/error handling (data: null is success, not an error).
 */

import { useMemo } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { getProject, getProjectMembers } from '../api/projectApi';
import { getTasks } from '../api/taskApi';
import { getProjectContributions, getContributionActivity } from '../api/contributionsApi';
import { getProjectHealth, syncProjectHealth } from '../api/projectHealthApi';
import useUserDirectory from './useUserDirectory';

const keys = {
  project: (id) => ['projectAnalytics', id, 'project'],
  tasks: (id) => ['projectAnalytics', id, 'tasks'],
  members: (id) => ['projectAnalytics', id, 'members'],
  contributions: (id) => ['projectAnalytics', id, 'contributions'],
  activity: (id) => ['projectAnalytics', id, 'activity'],
  health: (id) => ['projectAnalytics', id, 'health'],
};

/** Last-resort label when a profile can't be resolved. */
const shortUserLabel = (userId) => `User ${userId?.slice(0, 8) ?? '?'}`;

/** Builds a userId → display name resolver from the profile directory. */
const makeNameOf = (directory) => (userId) => {
  const p = directory?.[userId];
  return p?.fullName?.trim() || p?.username || shortUserLabel(userId);
};

const options = { retry: false, staleTime: 30_000 };

/* ── Task breakdown ──────────────────────────────────────────────────────── */

const STATUS_META = {
  TODO: { id: 'todo', label: 'To Do' },
  IN_PROGRESS: { id: 'in_progress', label: 'In Progress' },
  REVIEW: { id: 'review', label: 'Review' },
  DONE: { id: 'done', label: 'Done' },
};
const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const PRIORITY_META = { URGENT: 'Urgent', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

function deriveTasks(tasks) {
  const now = Date.now();
  const byStatusCount = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
  const byPriorityCount = {};
  let overdue = 0;

  tasks.forEach((t) => {
    if (byStatusCount[t.status] !== undefined) byStatusCount[t.status] += 1;

    const p = (byPriorityCount[t.priority] ??= { total: 0, done: 0 });
    p.total += 1;
    if (t.status === 'DONE') p.done += 1;

    if (t.dueDate && t.status !== 'DONE' && new Date(t.dueDate).getTime() < now) overdue += 1;
  });

  return {
    overdue,
    byStatus: STATUS_ORDER.map((raw) => ({ ...STATUS_META[raw], count: byStatusCount[raw] })),
    byPriority: PRIORITY_ORDER.map((raw) => ({
      id: raw.toLowerCase(),
      label: PRIORITY_META[raw],
      total: byPriorityCount[raw]?.total ?? 0,
      done: byPriorityCount[raw]?.done ?? 0,
    })),
  };
}

/* ── Team activity (members × last 7 days of events) ────────────────────── */

const ROLE_LABEL = { LEADER: 'Leader', CONTRIBUTOR: 'Contributor', REVIEWER: 'Reviewer' };
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function deriveTeam(members, events, nameOf) {
  const now = Date.now();
  return members.map((m) => {
    const mine = events.filter((e) => e.userId === m.userId);
    const recent = mine.filter((e) => now - new Date(e.createdAt).getTime() <= SEVEN_DAYS_MS);

    const weekly = { tasksCompleted: 0, commits: 0, messages: 0 };
    recent.forEach((e) => {
      if (e.eventType === 'TASK_COMPLETED') weekly.tasksCompleted += 1;
      else if (e.eventType === 'COMMIT') weekly.commits += 1;
      else if (e.eventType === 'MESSAGE_SENT') weekly.messages += 1;
    });

    return {
      userId: m.userId,
      name: nameOf(m.userId),
      role: ROLE_LABEL[m.role] ?? m.role,
      lastActiveAt: mine[0]?.createdAt ?? m.joinedAt,
      weekly,
    };
  });
}

/* ── Contribution breakdown (all-time, straight from the leaderboard) ───── */

function deriveContributions(scores, nameOf) {
  return scores.map((s) => ({
    userId: s.userId,
    name: nameOf(s.userId),
    tasksCompleted: s.tasksCompleted ?? 0,
    commitsCount: s.commitsCount ?? 0,
    messagesSent: s.messagesSent ?? 0,
    totalScore: Number(s.totalScore ?? 0),
    tasksReviewed: s.tasksReviewed ?? 0,
    filesShared: s.filesShared ?? 0,
  }));
}

/* ── 14-day trend (bucketed from the same activity events) ──────────────── */

const DAY_MS = 86_400_000;

function deriveTrend(events) {
  const days = Array.from({ length: 14 }, (_, i) =>
      new Date(Date.now() - (13 - i) * DAY_MS).toISOString().slice(0, 10)
  );
  const buckets = Object.fromEntries(days.map((d) => [d, { tasksCompleted: 0, commits: 0, messages: 0 }]));

  events.forEach((e) => {
    const day = e.createdAt.slice(0, 10);
    const bucket = buckets[day];
    if (!bucket) return;
    if (e.eventType === 'TASK_COMPLETED') bucket.tasksCompleted += 1;
    else if (e.eventType === 'COMMIT') bucket.commits += 1;
    else if (e.eventType === 'MESSAGE_SENT') bucket.messages += 1;
  });

  return days.map((date) => ({ date, ...buckets[date] }));
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

export function useProjectAnalytics(projectId) {
  const queryClient = useQueryClient();

  const results = useQueries({
    queries: [
      { queryKey: keys.project(projectId), queryFn: () => getProject(projectId), ...options },
      { queryKey: keys.tasks(projectId), queryFn: () => getTasks(projectId), ...options },
      { queryKey: keys.members(projectId), queryFn: () => getProjectMembers(projectId), ...options },
      { queryKey: keys.contributions(projectId), queryFn: () => getProjectContributions(projectId), ...options },
      { queryKey: keys.activity(projectId), queryFn: () => getContributionActivity(projectId), ...options },
    ],
  });
  const [projectQ, tasksQ, membersQ, contributionsQ, activityQ] = results;

  const failed = results.find((r) => r.isError);
  const ready = results.every((r) => r.isSuccess);

  // One batched profile lookup for every user that appears anywhere on the page.
  const allUserIds = [
    ...(membersQ.data ?? []).map((m) => m.userId),
    ...(contributionsQ.data ?? []).map((c) => c.userId),
    ...(activityQ.data ?? []).map((e) => e.userId),
  ];
  const { directory } = useUserDirectory(allUserIds);

  const data = useMemo(() => {
    if (!ready) return null;
    const events = activityQ.data ?? [];
    const nameOf = makeNameOf(directory);
    return {
      project: projectQ.data,
      members: membersQ.data ?? [],
      tasks: deriveTasks(tasksQ.data ?? []),
      team: deriveTeam(membersQ.data ?? [], events, nameOf),
      contributions: deriveContributions(contributionsQ.data ?? [], nameOf),
      trend: deriveTrend(events),
      // userName is resolved here so ActivityTimeline doesn't need its own lookup
      activity: events.slice(0, 8).map((e) => ({ ...e, userName: nameOf(e.userId) })),
    };
  }, [ready, directory, projectQ.data, tasksQ.data, membersQ.data, contributionsQ.data, activityQ.data]);

  const healthQuery = useQuery({
    queryKey: keys.health(projectId),
    queryFn: () => getProjectHealth(projectId),
    ...options,
  });

  const syncHealthMutation = useMutation({
    mutationFn: () => syncProjectHealth(projectId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.health(projectId) }),
  });

  return {
    data,
    isLoading: !failed && !ready,
    isError: !!failed,
    error: failed?.error ?? null,
    refetch: () => Promise.all((failed ? results.filter((r) => r.isError) : results).map((r) => r.refetch())),

    health: healthQuery.data ?? null,
    isHealthLoading: healthQuery.isLoading,
    isHealthError: healthQuery.isError,
    healthError: healthQuery.error,

    syncHealth: () => syncHealthMutation.mutate(),
    isSyncingHealth: syncHealthMutation.isPending,
    syncHealthError: syncHealthMutation.error,
  };
}

export default useProjectAnalytics;