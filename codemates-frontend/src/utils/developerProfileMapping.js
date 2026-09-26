/**
 * Shared helpers for turning a raw userId (from connections/messages APIs,
 * which never carry more than a UUID) into display-ready developer data,
 * using a profile already resolved via useUserProfiles()/getProfilesByIds.
 */

// Fallback only — used if a userId has no resolvable profile (e.g. the
// profile-service lookup failed, or the account was deleted).
export function placeholderDeveloper(userId) {
    return {
        id: userId,
        name: `User ${userId?.slice(0, 8)}`,
        username: userId?.slice(0, 8) ?? "unknown",
        avatarUrl: undefined,
        skills: [],
    };
}

export function developerFromProfile(userId, profile) {
    if (!profile) return placeholderDeveloper(userId);
    return {
        id: profile.userId,
        name: profile.fullName || profile.username,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        skills: (profile.skills ?? []).map((s) => s.skillName),
        experienceLevel: profile.experienceLevel,
        isOpenToCollaborate: profile.isOpenToCollaborate,
        activityStatus: profile.activityStatus,
    };
}