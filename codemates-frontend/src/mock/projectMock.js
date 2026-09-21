/**
 * Local mock dataset for Discover Projects. Pure data, filtered directly
 * in DiscoverProjects.jsx for now — no API/hook layer yet, matching how
 * Discover Developers worked before its api/hook layer was added.
 *
 * "Availability" filtering on the page uses this same `status` field —
 * a project's status ("Recruiting" vs "In Progress"/"Completed") is what
 * communicates whether it currently needs teammates.
 */
export const projects = [
  {
    id: "p1",
    name: "OpenBoard",
    shortDescription:
      "A lightweight kanban board for small teams, built with real-time sync.",
    techStack: ["React", "Node.js", "TypeScript"],
    projectType: "Open Source",
    teamSize: { current: 3, max: 5 },
    requiredExperience: "Intermediate",
    requiredRoles: ["Frontend Developer", "Backend Developer"],
    status: "Recruiting",
  },
  {
    id: "p2",
    name: "TraceWell",
    shortDescription: "Minimal distributed tracing for small Go services.",
    techStack: ["Go"],
    projectType: "Open Source",
    teamSize: { current: 2, max: 4 },
    requiredExperience: "Advanced",
    requiredRoles: ["Backend Developer", "DevOps"],
    status: "Recruiting",
  },
  {
    id: "p3",
    name: "Rankly",
    shortDescription:
      "A readable reference implementation of learning-to-rank algorithms.",
    techStack: ["Python", "ML / AI"],
    projectType: "Academic",
    teamSize: { current: 1, max: 3 },
    requiredExperience: "Advanced",
    requiredRoles: ["ML Engineer"],
    status: "Recruiting",
  },
  {
    id: "p4",
    name: "HackDash",
    shortDescription:
      "Dashboard template built during a 24-hour hackathon, needs polish.",
    techStack: ["React", "TypeScript"],
    projectType: "Hackathon",
    teamSize: { current: 2, max: 2 },
    requiredExperience: "Beginner",
    requiredRoles: [],
    status: "Completed",
  },
  {
    id: "p5",
    name: "FinLedger",
    shortDescription:
      "Personal finance tracker with bank-sync and budgeting insights.",
    techStack: ["Java", "React"],
    projectType: "Startup",
    teamSize: { current: 4, max: 6 },
    requiredExperience: "Intermediate",
    requiredRoles: ["Frontend Developer", "QA"],
    status: "In Progress",
  },
  {
    id: "p6",
    name: "a11y-lint",
    shortDescription:
      "ESLint plugin catching common accessibility mistakes before they ship.",
    techStack: ["TypeScript", "Node.js"],
    projectType: "Open Source",
    teamSize: { current: 1, max: 4 },
    requiredExperience: "Intermediate",
    requiredRoles: ["Frontend Developer", "Technical Writer"],
    status: "Recruiting",
  },
  {
    id: "p7",
    name: "CampusConnect",
    shortDescription:
      "A student project-matching tool for university hackathon teams.",
    techStack: ["Python", "React"],
    projectType: "Academic",
    teamSize: { current: 2, max: 5 },
    requiredExperience: "Beginner",
    requiredRoles: ["Frontend Developer", "Backend Developer", "Designer"],
    status: "Recruiting",
  },
  {
    id: "p8",
    name: "ShipFast CI",
    shortDescription:
      "Opinionated CI/CD starter templates for small teams shipping fast.",
    techStack: ["Go", "TypeScript"],
    projectType: "Side Project",
    teamSize: { current: 3, max: 3 },
    requiredExperience: "Expert",
    requiredRoles: [],
    status: "Completed",
  },
];

export const CURRENT_USER_ID = "user-uuid-001";

export const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    textClass: "text-[#10B981]",
    borderClass: "border-[#10B981]/40",
    bgClass: "bg-[#10B981]/10",
    dotClass: "bg-[#10B981]",
  },
  PAUSED: {
    label: "Paused",
    textClass: "text-[#F59E0B]",
    borderClass: "border-[#F59E0B]/40",
    bgClass: "bg-[#F59E0B]/10",
    dotClass: "bg-[#F59E0B]",
  },
  COMPLETED: {
    label: "Completed",
    textClass: "text-[#8B86B8]",
    borderClass: "border-[#8B86B8]/40",
    bgClass: "bg-[#8B86B8]/10",
    dotClass: "bg-[#8B86B8]",
  },
  ARCHIVED: {
    label: "Archived",
    textClass: "text-[#6B6890]",
    borderClass: "border-[#6B6890]/40",
    bgClass: "bg-[#6B6890]/10",
    dotClass: "bg-[#6B6890]",
  },
};

export const TYPE_CONFIG = {
  OPEN_SOURCE: { label: "Open Source", textClass: "text-[#C9A8FF]", borderClass: "border-[#2E2A66]" },
  STARTUP: { label: "Startup", textClass: "text-[#6C7BFF]", borderClass: "border-[#2E2A66]" },
  HACKATHON: { label: "Hackathon", textClass: "text-[#F59E0B]", borderClass: "border-[#2E2A66]" },
  LEARNING: { label: "Learning", textClass: "text-[#10B981]", borderClass: "border-[#2E2A66]" },
  PERSONAL: { label: "Personal", textClass: "text-[#8B86B8]", borderClass: "border-[#2E2A66]" },
};

export const ROLE_CONFIG = {
  LEADER: {
    label: "Leader",
    textClass: "text-[#C9A8FF]",
    borderClass: "border-[#6C7BFF]/40",
    bgClass: "bg-[#6C7BFF]/10",
  },
  CONTRIBUTOR: {
    label: "Contributor",
    textClass: "text-[#A7A3D6]",
    borderClass: "border-[#2E2A66]",
    bgClass: "bg-[#1D1A40]",
  },
  REVIEWER: {
    label: "Reviewer",
    textClass: "text-[#F59E0B]",
    borderClass: "border-[#F59E0B]/40",
    bgClass: "bg-[#F59E0B]/10",
  },
};

export const MOCK_MY_PROJECTS = projects.map((project, index) => ({
  id: project.id,
  name: project.name,
  description: project.shortDescription,
  status: project.status === "Recruiting" ? "ACTIVE" : project.status === "Completed" ? "COMPLETED" : "PAUSED",
  type: project.projectType.toUpperCase().replaceAll(" ", "_"),
  role: index % 3 === 0 ? "LEADER" : "CONTRIBUTOR",
  isOwner: index % 3 === 0,
  memberCount: project.teamSize.current,
  taskCount: 10 + index * 2,
  tasksCompleted: index * 2,
  techStack: project.techStack,
  lastActivity: `${index + 1} day${index === 0 ? "" : "s"} ago`,
  visibility: "PUBLIC",
  githubRepoUrl: index % 2 === 0 ? `https://github.com/codemates/${project.name}` : null,
}));