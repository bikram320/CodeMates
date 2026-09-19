/**
 * Mock data for the Project Team page.
 *
 * Only teamApi.js should import this file. Components and hooks go through
 * teamApi → useProjectTeam so this file can be deleted when the real
 * Spring Boot endpoints are wired in.
 *
 * TeamMember shape (what the Team UI consumes):
 * {
 *   id:             string   UUID of the member's *user* (not the membership row) —
 *                            this is the `memberUserId` the backend expects in
 *                            DELETE/PUT /api/projects/{id}/members/{memberUserId}
 *   name:           string   profile.fullName
 *   username:       string   profile.username
 *   avatarUrl:      string|null
 *   role:           'LEADER' | 'CONTRIBUTOR' | 'REVIEWER'
 *   skills:         string[] profile.skills[].skillName
 *   availability:   'AVAILABLE' | 'BUSY' | 'AWAY'
 *   status:         'ACTIVE'  → accepted member
 *                   'PENDING' → invited, hasn't accepted yet
 *   joinedAt:       ISO string | null   (null while PENDING)
 *   tasksCompleted: number              (contribution-service)
 *   invitedAt?, expiresAt?  ISO strings, PENDING only (invitations expire after 7 days)
 * }
 */

/** The signed-in user in mock mode. Replace with the auth user's id later. */
export const MOCK_CURRENT_USER_ID = 'b7f3c1a2-4e5d-4a86-9c31-0d2e7a5f1b01';

const daysFromNow = (days) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const avatar = (seed) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

/**
 * Returns a fresh copy every call so mutations in the mock "server"
 * (teamApi.js) never leak back into this file.
 */
export function createMockTeam() {
  return [
    {
      id: MOCK_CURRENT_USER_ID,
      name: 'Aarav Sharma',
      username: 'aarav_dev',
      avatarUrl: avatar('aarav_dev'),
      role: 'LEADER',
      skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      joinedAt: '2026-03-04T09:12:00Z',
      tasksCompleted: 31,
    },
    {
      id: '3d9a5e64-8b1c-4f27-a0d3-6c52e1f9a102',
      name: 'Mia Chen',
      username: 'miachen',
      avatarUrl: avatar('miachen'),
      role: 'CONTRIBUTOR',
      skills: ['React', 'TypeScript', 'Tailwind'],
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      joinedAt: '2026-03-18T14:40:00Z',
      tasksCompleted: 24,
    },
    {
      id: 'e21c7f08-5a36-4d9b-8e74-b0a3d6c8f203',
      name: 'Diego Alvarez',
      username: 'diego_codes',
      avatarUrl: null,
      role: 'REVIEWER',
      skills: ['Spring Boot', 'Java', 'MySQL', 'Testing'],
      availability: 'BUSY',
      status: 'ACTIVE',
      joinedAt: '2026-04-02T08:05:00Z',
      tasksCompleted: 17,
    },
    {
      id: '5f8b2d91-c4e7-4a13-b6f0-92d1a7e35304',
      name: 'Priya Nair',
      username: 'priya_n',
      avatarUrl: avatar('priya_n'),
      role: 'CONTRIBUTOR',
      skills: ['Python', 'ML', 'FastAPI', 'Pandas'],
      availability: 'AWAY',
      status: 'ACTIVE',
      joinedAt: '2026-04-21T11:30:00Z',
      tasksCompleted: 12,
    },
    {
      id: 'a04e6c37-d9f2-4b85-9a1c-7e38b5d0c405',
      name: 'Tomás Novak',
      username: 'tnovak',
      avatarUrl: null,
      role: 'CONTRIBUTOR',
      skills: ['Go', 'Kubernetes'],
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      joinedAt: '2026-05-09T16:18:00Z',
      tasksCompleted: 9,
    },
    {
      id: 'c7d15a82-3e60-4f9c-b248-1a9f4e7d6506',
      name: 'Sara Okafor',
      username: 'sara_ok',
      avatarUrl: avatar('sara_ok'),
      role: 'REVIEWER',
      skills: ['UI/UX', 'Figma', 'Accessibility', 'React', 'CSS', 'Storybook'],
      availability: 'AVAILABLE',
      status: 'ACTIVE',
      joinedAt: '2026-05-27T10:02:00Z',
      tasksCompleted: 14,
    },
    {
      id: '19b3e4f6-7a58-4c21-8d0e-f5c2a9b17607',
      name: 'Liam Becker',
      username: 'liambecker',
      avatarUrl: null,
      role: 'CONTRIBUTOR',
      skills: [],
      availability: 'BUSY',
      status: 'ACTIVE',
      joinedAt: '2026-07-14T13:45:00Z',
      tasksCompleted: 3,
    },
    // Invited but hasn't accepted yet — shows in the "pending" count, not as a card.
    {
      id: '8e6f0b45-2c19-4d73-a5b8-3d7e91c4f808',
      name: 'Kaito Mori',
      username: 'kaito_ml',
      avatarUrl: avatar('kaito_ml'),
      role: 'REVIEWER',
      skills: ['PyTorch', 'MLOps'],
      availability: 'AVAILABLE',
      status: 'PENDING',
      joinedAt: null,
      tasksCompleted: 0,
      invitedAt: daysFromNow(-2),
      expiresAt: daysFromNow(5),
    },
  ];
}