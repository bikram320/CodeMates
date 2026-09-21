/**
 * Mock data for the Developer Profile page, keyed by username so it lines
 * up with the entries in mock/developerMock.js (clicking "View Profile" on
 * one of those cards can eventually route here and find a matching entry).
 *
 * This is a stand-in for what GET /api/developers/:username will return.
 * When that's ready, useDeveloper(username) swaps its internals to call
 * developerApi.getDeveloperByUsername(username) instead of reading this file
 * — nothing in DeveloperProfile.jsx needs to change when that happens.
 */
export const developerProfiles = {
  "aria-chen": {
    id: "1",
    username: "aria-chen",
    name: "Aria Chen",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    tagline: "Frontend engineer focused on accessible, performant UI.",
    location: "Toronto, Canada",
    bio: "I'm a frontend engineer with a soft spot for design systems and a strong opinion about type safety. I've spent the last few years building React apps for startups, and I'm always down to pair on something open source.",
    skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
    experienceLevel: "Advanced",
    experienceSummary:
      "5+ years building production React applications, with a focus on design systems and developer tooling.",
    availability: "Available",
    projects: [
      {
        id: "p1",
        name: "OpenBoard",
        description: "A lightweight kanban board for small teams.",
        url: "#",
      },
      {
        id: "p2",
        name: "a11y-lint",
        description: "ESLint plugin catching common accessibility mistakes.",
        url: "#",
      },
    ],
    links: {
      github: "https://github.com/aria-chen",
      linkedin: "https://linkedin.com/in/aria-chen",
      portfolio: "https://ariachen.dev",
    },
  },

  "devon-marsh": {
    id: "2",
    username: "devon-marsh",
    name: "Devon Marsh",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    tagline: "Backend-leaning full-stack dev, currently deep in distributed systems.",
    location: "Berlin, Germany",
    bio: "I like systems that fall over gracefully. Most of my recent work has been on service-to-service reliability and tracing at a mid-size fintech, but I still write plenty of frontend when a project needs it.",
    skills: ["Go", "Node.js", "Python"],
    experienceLevel: "Expert",
    experienceSummary:
      "8 years across backend and infra roles, with a focus on distributed systems and observability.",
    availability: "Open to offers",
    projects: [
      {
        id: "p1",
        name: "tracewell",
        description: "Minimal distributed tracing for small Go services.",
        url: "#",
      },
    ],
    links: {
      github: "https://github.com/devon-marsh",
      linkedin: "https://linkedin.com/in/devon-marsh",
      portfolio: "",
    },
  },

  "priya-nair": {
    id: "3",
    username: "priya-nair",
    name: "Priya Nair",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    tagline: "ML engineer building recommendation systems.",
    location: "Bengaluru, India",
    bio: "Currently building recommendation systems for a mid-size e-commerce company. Outside of work I'm usually tinkering with a side project or trying to get a paper's results to actually reproduce.",
    skills: ["Python", "ML / AI"],
    experienceLevel: "Advanced",
    experienceSummary:
      "6 years in applied ML, mostly recommendation and ranking systems in production.",
    availability: "Available",
    projects: [
      {
        id: "p1",
        name: "rankly",
        description: "A small, readable reference implementation of learning-to-rank.",
        url: "#",
      },
      {
        id: "p2",
        name: "CodeMates",
        description: "Developer collaboration platform — this one!",
        url: "#",
      },
    ],
    links: {
      github: "https://github.com/priya-nair",
      linkedin: "",
      portfolio: "https://priyanair.dev",
    },
  },
};

// Used when a route hits a username with no matching mock entry, so the
// page has something to show during development instead of going blank.
export const defaultDeveloperProfile = developerProfiles["aria-chen"];