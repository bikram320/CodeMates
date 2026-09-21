/**
 * Mock contribution scores and events, keyed by project id to match
 * projectDetailsMock.js. Shaped to match contribution-service's real
 * response contracts (see codemates-api-docs.md, section 7):
 *
 * ContributionScoreResponse: { userId, projectId, tasksCompleted,
 *   tasksReviewed, messagesSent, commitsCount, filesShared, totalScore,
 *   lastCalculatedAt }
 * ContributionEventResponse: { id, userId, projectId, eventType,
 *   pointsAwarded, referenceId, referenceType, description, createdAt }
 *
 * Two things mirrored on purpose, not just approximated:
 *
 * 1. tasksReviewed and filesShared are 0 everywhere below — the real
 *    backend has no code path that increments either yet, so they'll
 *    always read 0 for real too.
 * 2. eventType only appears as TASK_COMPLETED, COMMIT_PUSHED, or
 *    MESSAGE_SENT — the only three event types the real system
 *    currently emits.
 *
 * totalScore's weighting (10/task, 5/commit, 1/message) is this mock's
 * own invention for internal consistency — the real scoring weights
 * aren't documented, so don't treat this formula as authoritative.
 *
 * Filename note: this is "contributionsMock.js" (plural) deliberately —
 * contributionsApi.js imports from this exact name. There should be no
 * other "contributionMock.js"/"contributionsMock.js" anywhere in
 * src/mock/.
 */

export const projectContributionScores = {
  p1: [
    {
      userId: "m1",
      projectId: "p1",
      tasksCompleted: 8,
      tasksReviewed: 0,
      messagesSent: 34,
      commitsCount: 22,
      filesShared: 0,
      totalScore: 224,
      lastCalculatedAt: "2026-09-19T18:00:00Z",
    },
    {
      userId: "m2",
      projectId: "p1",
      tasksCompleted: 12,
      tasksReviewed: 0,
      messagesSent: 41,
      commitsCount: 30,
      filesShared: 0,
      totalScore: 311,
      lastCalculatedAt: "2026-09-19T18:00:00Z",
    },
    {
      userId: "m3",
      projectId: "p1",
      tasksCompleted: 5,
      tasksReviewed: 0,
      messagesSent: 19,
      commitsCount: 9,
      filesShared: 0,
      totalScore: 114,
      lastCalculatedAt: "2026-09-19T18:00:00Z",
    },
  ],

  p2: [
    {
      userId: "m1",
      projectId: "p2",
      tasksCompleted: 10,
      tasksReviewed: 0,
      messagesSent: 15,
      commitsCount: 27,
      filesShared: 0,
      totalScore: 250,
      lastCalculatedAt: "2026-09-19T18:00:00Z",
    },
    {
      userId: "m2",
      projectId: "p2",
      tasksCompleted: 4,
      tasksReviewed: 0,
      messagesSent: 8,
      commitsCount: 11,
      filesShared: 0,
      totalScore: 103,
      lastCalculatedAt: "2026-09-19T18:00:00Z",
    },
  ],
};

export const defaultProjectContributionScores = projectContributionScores.p1;

// Newest first, matching the real endpoint's ordering.
export const projectContributionEvents = {
  p1: [
    {
      id: "e1",
      userId: "m2",
      projectId: "p1",
      eventType: "COMMIT_PUSHED",
      pointsAwarded: 5,
      referenceId: "a1b2c3",
      referenceType: "COMMIT",
      description: "pushed 3 commits to feature/websocket-sync",
      createdAt: "2026-09-19T15:10:00Z",
    },
    {
      id: "e2",
      userId: "m1",
      projectId: "p1",
      eventType: "TASK_COMPLETED",
      pointsAwarded: 10,
      referenceId: "t5",
      referenceType: "TASK",
      description: "completed \"Set up CI pipeline\"",
      createdAt: "2026-09-19T09:40:00Z",
    },
    {
      id: "e3",
      userId: "m3",
      projectId: "p1",
      eventType: "MESSAGE_SENT",
      pointsAwarded: 1,
      referenceId: "c1-m3",
      referenceType: "MESSAGE",
      description: "sent a message in the team chat",
      createdAt: "2026-09-18T13:22:00Z",
    },
    {
      id: "e4",
      userId: "m2",
      projectId: "p1",
      eventType: "TASK_COMPLETED",
      pointsAwarded: 10,
      referenceId: "t7",
      referenceType: "TASK",
      description: "completed \"Optimistic UI for task moves\"",
      createdAt: "2026-09-18T11:05:00Z",
    },
    {
      id: "e5",
      userId: "m1",
      projectId: "p1",
      eventType: "COMMIT_PUSHED",
      pointsAwarded: 5,
      referenceId: "d4e5f6",
      referenceType: "COMMIT",
      description: "pushed 2 commits to main",
      createdAt: "2026-09-17T16:30:00Z",
    },
    {
      id: "e6",
      userId: "m2",
      projectId: "p1",
      eventType: "COMMIT_PUSHED",
      pointsAwarded: 5,
      referenceId: "g7h8i9",
      referenceType: "COMMIT",
      description: "pushed 1 commit to fix/card-resize",
      createdAt: "2026-09-16T10:15:00Z",
    },
    {
      id: "e7",
      userId: "m3",
      projectId: "p1",
      eventType: "TASK_COMPLETED",
      pointsAwarded: 10,
      referenceId: "t8",
      referenceType: "TASK",
      description: "completed \"Write unit tests for board state\"",
      createdAt: "2026-09-15T14:00:00Z",
    },
    {
      id: "e8",
      userId: "m1",
      projectId: "p1",
      eventType: "MESSAGE_SENT",
      pointsAwarded: 1,
      referenceId: "c1-m1",
      referenceType: "MESSAGE",
      description: "sent a message in the team chat",
      createdAt: "2026-09-14T09:00:00Z",
    },
    {
      id: "e9",
      userId: "m2",
      projectId: "p1",
      eventType: "COMMIT_PUSHED",
      pointsAwarded: 5,
      referenceId: "j1k2l3",
      referenceType: "COMMIT",
      description: "pushed 4 commits to feature/websocket-sync",
      createdAt: "2026-09-13T17:45:00Z",
    },
    {
      id: "e10",
      userId: "m3",
      projectId: "p1",
      eventType: "COMMIT_PUSHED",
      pointsAwarded: 5,
      referenceId: "p4q5r6",
      referenceType: "COMMIT",
      description: "pushed 2 commits to a11y-audit",
      createdAt: "2026-09-12T08:30:00Z",
    },
  ],

  p2: [
    {
      id: "e1",
      userId: "m1",
      projectId: "p2",
      eventType: "COMMIT_PUSHED",
      pointsAwarded: 5,
      referenceId: "m1n2o3",
      referenceType: "COMMIT",
      description: "pushed the OTLP exporter branch",
      createdAt: "2026-09-18T11:05:00Z",
    },
    {
      id: "e2",
      userId: "m2",
      projectId: "p2",
      eventType: "MESSAGE_SENT",
      pointsAwarded: 1,
      referenceId: "c2-m2",
      referenceType: "MESSAGE",
      description: "sent a message in the team chat",
      createdAt: "2026-09-18T10:50:00Z",
    },
    {
      id: "e3",
      userId: "m1",
      projectId: "p2",
      eventType: "TASK_COMPLETED",
      pointsAwarded: 10,
      referenceId: "t1",
      referenceType: "TASK",
      description: "completed \"OpenTelemetry exporter\"",
      createdAt: "2026-09-17T09:00:00Z",
    },
  ],
};

export const defaultProjectContributionEvents = projectContributionEvents.p1;