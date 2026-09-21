/**
 * src/mock/dashboardMock.js
 *
 * Simulates the combined response that getDashboard() will assemble
 * from multiple Spring Boot microservice calls in production.
 *
 * Field names and types match the real API response shapes exactly:
 *   - user          → ProfileResponse  (/api/users/me)
 *   - activeProjects → ProjectResponse[] (/api/projects/my)
 *   - upcomingTasks  → TaskResponse[]
 *   - recentActivity → NotificationResponse[]  (/api/notifications)
 *   - suggestedDevelopers → MatchScoreResponseDto[] (/api/discovery/match-scores/top)
 *
 * To test loading states, the delay is set to 800ms.
 * Increase MOCK_DELAY_MS if you want to observe the skeleton longer.
 *
 * When the Spring Boot backend is available:
 *   Set VITE_USE_MOCK=false in .env — this file is no longer called.
 */

const MOCK_DELAY_MS = 800;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── User ─────────────────────────────────────────────────────────────────────
// Mirrors ProfileResponse from /api/users/me

const mockUser = {
  id: 'user-uuid-001',
  username: 'alexkim',
  fullName: 'Alex Kim',
  avatarUrl: null,          // null → show initials avatar
  initials: 'AK',
  bio: 'Full stack developer. Building CodeMates.',
  experienceLevel: 'INTERMEDIATE',
  isOpenToCollaborate: true,
  activityStatus: 'ACTIVE',
};

// ── Stats ─────────────────────────────────────────────────────────────────────
// Computed from multiple sources in the real API

const mockStats = {
  activeProjects: 4,
  tasksDueSoon: 3,          // tasks with dueDate within 48h
  connections: 23,
  contributionsThisWeek: 14,
};

// ── Active Projects ───────────────────────────────────────────────────────────
// Mirrors ProjectResponse[] from /api/projects/my (status === ACTIVE only)

const mockActiveProjects = [
  {
    id: 'proj-uuid-001',
    name: 'orbit-cli',
    description: 'Command line tool for deploying static sites with zero configuration.',
    ownerUserId: 'user-uuid-001',
    role: 'Leader',             // from ProjectMemberResponseDto
    memberCount: 4,
    taskCount: 18,
    tasksCompleted: 11,
    techStack: ['Rust', 'WebAssembly', 'CLI'],
    lastActivity: '2h ago',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    githubRepoUrl: 'https://github.com/alexkim/orbit-cli',
  },
  {
    id: 'proj-uuid-002',
    name: 'lumen-ui',
    description: 'Component library for dark-first developer interfaces.',
    ownerUserId: 'user-uuid-005',
    role: 'Contributor',
    memberCount: 6,
    taskCount: 32,
    tasksCompleted: 24,
    techStack: ['React', 'TypeScript', 'Tailwind'],
    lastActivity: '5h ago',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    githubRepoUrl: 'https://github.com/priya_d/lumen-ui',
  },
  {
    id: 'proj-uuid-003',
    name: 'nova-api',
    description: 'RESTful API gateway for distributed microservice architectures.',
    ownerUserId: 'user-uuid-006',
    role: 'Reviewer',
    memberCount: 3,
    taskCount: 12,
    tasksCompleted: 5,
    techStack: ['Spring Boot', 'PostgreSQL', 'Docker'],
    lastActivity: '1d ago',
    status: 'ACTIVE',
    visibility: 'PRIVATE',
    githubRepoUrl: null,
  },
  {
    id: 'proj-uuid-004',
    name: 'devhub-core',
    description: 'Open source developer analytics and contribution tracking engine.',
    ownerUserId: 'user-uuid-007',
    role: 'Contributor',
    memberCount: 8,
    taskCount: 45,
    tasksCompleted: 38,
    techStack: ['Python', 'FastAPI', 'Redis'],
    lastActivity: '3d ago',
    status: 'ACTIVE',
    visibility: 'PUBLIC',
    githubRepoUrl: 'https://github.com/devhub/core',
  },
];

// ── Upcoming Tasks ─────────────────────────────────────────────────────────────
// Mirrors TaskResponse[] — priority values match the API enum: LOW|MEDIUM|HIGH|URGENT

const mockUpcomingTasks = [
  {
    id: 'task-uuid-001',
    projectId: 'proj-uuid-003',
    projectName: 'nova-api',          // denormalized for display — not in real TaskResponse
    title: 'Write unit tests for auth middleware',
    description: 'Cover the JWT validation and refresh logic.',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2026-09-19',
    assignedToUserId: 'user-uuid-001',
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'task-uuid-002',
    projectId: 'proj-uuid-001',
    projectName: 'orbit-cli',
    title: 'Fix race condition in cache invalidation layer',
    description: 'Concurrent writes cause stale entries.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-09-20',
    assignedToUserId: 'user-uuid-001',
    createdAt: '2026-09-14T11:30:00Z',
  },
  {
    id: 'task-uuid-003',
    projectId: 'proj-uuid-002',
    projectName: 'lumen-ui',
    title: 'Add dark mode design tokens to Button component',
    description: 'Follow the existing token naming conventions.',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '2026-09-21',
    assignedToUserId: 'user-uuid-001',
    createdAt: '2026-09-13T14:00:00Z',
  },
  {
    id: 'task-uuid-004',
    projectId: 'proj-uuid-004',
    projectName: 'devhub-core',
    title: 'Optimize PostgreSQL query for contributor leaderboard',
    description: 'Current N+1 issue on large teams.',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    dueDate: '2026-09-25',
    assignedToUserId: 'user-uuid-001',
    createdAt: '2026-09-12T08:00:00Z',
  },
  {
    id: 'task-uuid-005',
    projectId: 'proj-uuid-001',
    projectName: 'orbit-cli',
    title: 'Update README with new CLI flags documentation',
    description: '',
    status: 'TODO',
    priority: 'LOW',
    dueDate: '2026-09-24',
    assignedToUserId: 'user-uuid-001',
    createdAt: '2026-09-11T16:00:00Z',
  },
];

// ── Recent Activity ────────────────────────────────────────────────────────────
// Mirrors NotificationResponse[] from /api/notifications
// type values match NotificationType enum constants

const mockRecentActivity = [
  {
    id: 'notif-uuid-001',
    type: 'commit',                       // mapped from GITHUB_SYNC_COMPLETED
    message: 'Pushed 3 commits to orbit-cli',
    actor: 'alexkim',
    actorInitials: 'AK',
    project: 'orbit-cli',
    projectId: 'proj-uuid-001',
    timestamp: '2h ago',
    isRead: false,
  },
  {
    id: 'notif-uuid-002',
    type: 'task_completed',               // mapped from TASK_COMPLETED
    message: "Completed task 'Set up CI/CD pipeline'",
    actor: 'priya_d',
    actorInitials: 'PD',
    project: 'nova-api',
    projectId: 'proj-uuid-003',
    timestamp: '4h ago',
    isRead: false,
  },
  {
    id: 'notif-uuid-003',
    type: 'member_joined',               // mapped from PROJECT_MEMBER_JOINED
    message: 'sam_r joined lumen-ui as Contributor',
    actor: 'sam_r',
    actorInitials: 'SR',
    project: 'lumen-ui',
    projectId: 'proj-uuid-002',
    timestamp: '6h ago',
    isRead: true,
  },
  {
    id: 'notif-uuid-004',
    type: 'pr_merged',
    message: "PR #42 'feat: add offline sync support' was merged",
    actor: 'ji_w',
    actorInitials: 'JW',
    project: 'devhub-core',
    projectId: 'proj-uuid-004',
    timestamp: '1d ago',
    isRead: true,
  },
  {
    id: 'notif-uuid-005',
    type: 'comment',                     // mapped from MESSAGE_RECEIVED
    message: "Left a comment on 'Fix cache race condition'",
    actor: 'alexkim',
    actorInitials: 'AK',
    project: 'orbit-cli',
    projectId: 'proj-uuid-001',
    timestamp: '1d ago',
    isRead: true,
  },
  {
    id: 'notif-uuid-006',
    type: 'project_created',             // mapped from PROJECT_CREATED
    message: "Created new project 'mira-lang'",
    actor: 'maya_t',
    actorInitials: 'MT',
    project: 'mira-lang',
    projectId: 'proj-uuid-005',
    timestamp: '2d ago',
    isRead: true,
  },
];

// ── Suggested Developers ──────────────────────────────────────────────────────
// Mirrors MatchScoreResponseDto[] from /api/discovery/match-scores/top
// (profile fields are denormalized here — real API needs a separate /api/users/{username} call)

const mockSuggestedDevelopers = [
  {
    id: 'match-uuid-001',
    matchedUserId: 'user-uuid-010',
    name: 'Priya Desai',
    username: 'priya_d',
    avatarUrl: null,
    initials: 'PD',
    bio: 'Backend engineer focused on distributed systems and API design.',
    skills: [
      { skillName: 'Java', proficiencyLevel: 'ADVANCED' },
      { skillName: 'Spring Boot', proficiencyLevel: 'ADVANCED' },
      { skillName: 'Kafka', proficiencyLevel: 'INTERMEDIATE' },
      { skillName: 'PostgreSQL', proficiencyLevel: 'INTERMEDIATE' },
    ],
    experienceLevel: 'SENIOR',
    matchScore: 94,              // totalMatchScore
    skillScore: 96,
    activityScore: 91,
    interestScore: 95,
    isConnected: false,
    projectsCount: 8,
    isOpenToCollaborate: true,
  },
  {
    id: 'match-uuid-002',
    matchedUserId: 'user-uuid-011',
    name: 'Sam Rodriguez',
    username: 'sam_r',
    avatarUrl: null,
    initials: 'SR',
    bio: 'Frontend developer building accessible component libraries and design systems.',
    skills: [
      { skillName: 'React', proficiencyLevel: 'ADVANCED' },
      { skillName: 'TypeScript', proficiencyLevel: 'ADVANCED' },
      { skillName: 'Tailwind', proficiencyLevel: 'INTERMEDIATE' },
      { skillName: 'Storybook', proficiencyLevel: 'INTERMEDIATE' },
    ],
    experienceLevel: 'INTERMEDIATE',
    matchScore: 88,
    skillScore: 90,
    activityScore: 85,
    interestScore: 89,
    isConnected: false,
    projectsCount: 5,
    isOpenToCollaborate: true,
  },
  {
    id: 'match-uuid-003',
    matchedUserId: 'user-uuid-012',
    name: 'Ji-ho Won',
    username: 'ji_w',
    avatarUrl: null,
    initials: 'JW',
    bio: 'ML engineer and open source contributor. Loves optimization problems.',
    skills: [
      { skillName: 'Python', proficiencyLevel: 'ADVANCED' },
      { skillName: 'PyTorch', proficiencyLevel: 'ADVANCED' },
      { skillName: 'FastAPI', proficiencyLevel: 'INTERMEDIATE' },
      { skillName: 'Docker', proficiencyLevel: 'INTERMEDIATE' },
    ],
    experienceLevel: 'INTERMEDIATE',
    matchScore: 82,
    skillScore: 80,
    activityScore: 88,
    interestScore: 78,
    isConnected: false,
    projectsCount: 12,
    isOpenToCollaborate: true,
  },
  {
    id: 'match-uuid-004',
    matchedUserId: 'user-uuid-013',
    name: 'Maya Torres',
    username: 'maya_t',
    avatarUrl: null,
    initials: 'MT',
    bio: 'Systems programmer building a new programming language from scratch.',
    skills: [
      { skillName: 'Rust', proficiencyLevel: 'ADVANCED' },
      { skillName: 'LLVM', proficiencyLevel: 'INTERMEDIATE' },
      { skillName: 'WebAssembly', proficiencyLevel: 'INTERMEDIATE' },
      { skillName: 'C++', proficiencyLevel: 'ADVANCED' },
    ],
    experienceLevel: 'SENIOR',
    matchScore: 79,
    skillScore: 85,
    activityScore: 70,
    interestScore: 82,
    isConnected: true,
    projectsCount: 7,
    isOpenToCollaborate: false,
  },
];

// ── Export ─────────────────────────────────────────────────────────────────────

/**
 * getMockDashboard()
 *
 * Simulates the combined network response with a realistic delay.
 * Returns the exact same shape that getDashboard() produces in real mode.
 */
export async function getMockDashboard() {
  await delay(MOCK_DELAY_MS);

  return {
    user: mockUser,
    stats: mockStats,
    activeProjects: mockActiveProjects,
    upcomingTasks: mockUpcomingTasks,
    recentActivity: mockRecentActivity,
    suggestedDevelopers: mockSuggestedDevelopers,
  };
}