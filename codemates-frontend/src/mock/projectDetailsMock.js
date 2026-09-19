/**
 * Detail-view mock data for Project Details, keyed by id to match the
 * entries in mock/projectMock.js (so "View Project" from Discover
 * Projects leads somewhere real). Only a couple of projects are fleshed
 * out in full detail — that's enough for the UI; the rest fall back to
 * defaultProjectDetails.
 *
 * Stands in for what GET /api/projects/:projectId will return later.
 */
export const projectDetails = {
  p1: {
    id: "p1",
    name: "OpenBoard",
    shortDescription:
      "A lightweight kanban board for small teams, built with real-time sync.",
    description:
      "OpenBoard aims to be the kanban tool you actually want to use — fast, keyboard-friendly, and built for small teams who don't need Jira's complexity. We're building real-time collaborative boards with WebSocket sync, and looking for people who care about performance and clean UI just as much as we do.",
    techStack: ["React", "Node.js", "TypeScript"],
    projectType: "Open Source",
    status: "Recruiting",
    githubUrl: "https://github.com/example/openboard",
    goals: [
      "Ship a stable v1.0 with real-time multi-user editing",
      "Keep the bundle size under 150kb gzipped",
      "Reach 500 GitHub stars by end of year",
    ],
    requiredSkills: ["React", "TypeScript", "WebSockets", "Node.js"],
    rolesNeeded: ["Frontend Developer", "Backend Developer", "QA"],
    teamSize: { current: 3, max: 5 },
    tasks: { total: 42, completed: 27 },
    members: [
      {
        id: "m1",
        name: "Aria Chen",
        avatarUrl: "https://i.pravatar.cc/150?img=47",
        role: "Maintainer",
      },
      {
        id: "m2",
        name: "Sam Osei",
        avatarUrl: "https://i.pravatar.cc/150?img=15",
        role: "Frontend Developer",
      },
      {
        id: "m3",
        name: "Jonas Berg",
        avatarUrl: "https://i.pravatar.cc/150?img=51",
        role: "Contributor",
      },
    ],
  },

  p2: {
    id: "p2",
    name: "TraceWell",
    shortDescription: "Minimal distributed tracing for small Go services.",
    description:
      "TraceWell is a lightweight, opinionated tracing library for small Go services that don't need the overhead of a full observability stack. It's early days — the core API is stable, but we need help with the collector backend and documentation.",
    techStack: ["Go"],
    projectType: "Open Source",
    status: "Recruiting",
    githubUrl: "https://github.com/example/tracewell",
    goals: [
      "Support OpenTelemetry export by v0.5",
      "Write a full onboarding guide for new contributors",
    ],
    requiredSkills: ["Go", "Distributed Systems"],
    rolesNeeded: ["Backend Developer", "DevOps"],
    teamSize: { current: 2, max: 4 },
    tasks: { total: 18, completed: 6 },
    members: [
      {
        id: "m1",
        name: "Devon Marsh",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        role: "Maintainer",
      },
      {
        id: "m2",
        name: "Mika Tanaka",
        avatarUrl: "https://i.pravatar.cc/150?img=25",
        role: "Contributor",
      },
    ],
  },
};

// Shown for any project id with no detailed entry above, so the page has
// something to render during development instead of going blank.
export const defaultProjectDetails = projectDetails.p1;