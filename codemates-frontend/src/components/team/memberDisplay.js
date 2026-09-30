/**
 * Shared helpers for showing a person on the Team page.
 *
 * `profile` is one entry of useUserDirectory's `directory` (the same lookup
 * the project Overview uses). Field names are tried in order so this works
 * whichever one your /api/users/by-ids response uses — trim to match.
 */

export const shortId = (userId) =>
  userId ? `${userId.slice(0, 8)}…` : 'Unknown member';

export function getDisplayName(profile, userId) {
  return (
    profile?.displayName ||
    profile?.fullName ||
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    profile?.username ||
    shortId(userId)
  );
}

export const getUsername = (profile) =>
  profile?.username ? `@${profile.username}` : '';
