/**
 * Local mock dataset for Discover Developers.
 *
 * This is pure data — no delay, no filtering logic. developerApi.js is the
 * layer that simulates a network call and applies filters against this.
 * When the real backend is ready, this file can be deleted entirely; it
 * only exists to stand in for what the Spring Boot API will return.
 */
export const developers = [
  {
    id: "1",
    username: "aria-chen",
    name: "Aria Chen",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    bio: "Frontend engineer who cares a lot about accessibility and a little too much about type systems.",
    skills: ["React", "TypeScript", "Node.js"],
    experienceLevel: "Advanced",
    availability: "Available",
  },
  {
    id: "2",
    username: "devon-marsh",
    name: "Devon Marsh",
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    bio: "Backend-leaning full-stack dev. Currently deep in distributed systems and Go.",
    skills: ["Go", "Node.js", "Python"],
    experienceLevel: "Expert",
    availability: "Open to offers",
  },
  {
    id: "3",
    username: "priya-nair",
    name: "Priya Nair",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    bio: "ML engineer building recommendation systems. Open to pairing on side projects.",
    skills: ["Python", "ML / AI"],
    experienceLevel: "Advanced",
    availability: "Available",
  },
  {
    id: "4",
    username: "leo-fontaine",
    name: "Leo Fontaine",
    avatarUrl: "https://i.pravatar.cc/150?img=8",
    bio: "Second-year CS student. Learning React by breaking things and fixing them again.",
    skills: ["React", "TypeScript"],
    experienceLevel: "Beginner",
    availability: "Available",
  },
  {
    id: "5",
    username: "mika-tanaka",
    name: "Mika Tanaka",
    avatarUrl: "https://i.pravatar.cc/150?img=25",
    bio: "Java backend developer, 6 years in fintech. Looking for open-source projects with real users.",
    skills: ["Java", "Go"],
    experienceLevel: "Expert",
    availability: "Not available",
  },
  {
    id: "6",
    username: "sam-osei",
    name: "Sam Osei",
    avatarUrl: "https://i.pravatar.cc/150?img=15",
    bio: "Product-minded engineer. Enjoys shipping fast and arguing about design systems.",
    skills: ["React", "Node.js", "TypeScript"],
    experienceLevel: "Intermediate",
    availability: "Open to offers",
  },
  {
    id: "7",
    username: "noor-siddiqui",
    name: "Noor Siddiqui",
    avatarUrl: "https://i.pravatar.cc/150?img=29",
    bio: "Data engineer turned ML enthusiast. Building a side project on model interpretability.",
    skills: ["Python", "ML / AI", "Go"],
    experienceLevel: "Intermediate",
    availability: "Available",
  },
  {
    id: "8",
    username: "jonas-berg",
    name: "Jonas Berg",
    avatarUrl: "https://i.pravatar.cc/150?img=51",
    bio: "Hackathon regular. Fast prototyper, slow at finishing README files.",
    skills: ["TypeScript", "React", "Java"],
    experienceLevel: "Beginner",
    availability: "Available",
  },
];