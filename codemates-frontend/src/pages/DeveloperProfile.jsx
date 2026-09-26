import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Globe, UserX } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

import ProfileHeader from "../components/developer/ProfileHeader";
import SkillBadge from "../components/developer/SkillBadge";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { getProfileByUsername, isNotFoundError } from "../api/profileApi";
import { useProfileConnection } from "../hooks/useProfileConnection";

// This page is mounted at two routes (see AppRoutes.jsx):
//   /discover/developers/:username
//   /connections/developers/:username
// Same component, same data — only the "back" link's destination and
// label change, based on which URL prefix got here. This also makes the
// sidebar highlight the right section automatically, since AppSidebar's
// NavLink does prefix matching on the path.
function BackLink() {
  const location = useLocation();
  const fromConnections = location.pathname.startsWith("/connections/developers");

  return fromConnections ? (
      <Link
          to="/connections"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--cm-muted)] transition-colors hover:text-[var(--cm-text)]"
      >
        <ArrowLeft size={16} />
        Back to Connections
      </Link>
  ) : (
      <Link
          to="/discover/developers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--cm-muted)] transition-colors hover:text-[var(--cm-text)]"
      >
        <ArrowLeft size={16} />
        Back to Discover Developers
      </Link>
  );
}

export default function DeveloperProfile() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumping this re-runs the fetch effect below — what the error state's
  // "Try again" button calls, since the original code had no way to retry
  // at all (the whole page was a dead end on failure).
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getProfileByUsername(username);

        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to load developer profile:", err);

        if (!cancelled) {
          setError(err);
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [username, retryCount]);

  // Real connection status + actions against social-service — replaces the
  // old `useState(false)` "connected" toggle, which only ever flipped local
  // UI state and never called the backend at all. See useProfileConnection
  // for why this needs more than the bare status endpoint, and for the
  // `profile.userId` assumption.
  const {
    state: connectionState,
    connect,
    accept,
    reject,
    remove,
    retry: retryConnection,
    isActing,
    actionError,
  } = useProfileConnection(profile?.userId);

  if (loading) {
    return (
        <div className="developer-profile-page">
          <BackLink />
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        </div>
    );
  }

  if (error && isNotFoundError(error)) {
    return (
        <div className="developer-profile-page">
          <BackLink />
          <EmptyState
              icon={UserX}
              title="Developer not found"
              description="This profile doesn't exist or may have been removed."
          />
        </div>
    );
  }

  if (error || !profile) {
    return (
        <div className="developer-profile-page">
          <BackLink />
          <EmptyState
              icon={AlertTriangle}
              title="Unable to load profile"
              description={
                  error?.message ||
                  "Something went wrong while loading this profile."
              }
              action={
                <Button variant="outline" onClick={() => setRetryCount((c) => c + 1)}>
                  Try again
                </Button>
              }
          />
        </div>
    );
  }

  const githubUrl = profile.githubUsername
      ? `https://github.com/${profile.githubUsername}`
      : null;

  const hasLinks = Boolean(githubUrl || profile.linkedinUrl || profile.portfolioUrl);


  return (
      <div className="developer-profile-page">
        <BackLink />

        {/* Profile Header */}
        <div className="head-container">
          <ProfileHeader
              name={profile.fullName || profile.username}
              username={profile.username}
              avatarUrl={profile.avatarUrl}
              tagline={profile.bio}
              experienceLevel={profile.experienceLevel}
              availability={
                profile.isOpenToCollaborate
                    ? "Open to collaborate"
                    : profile.activityStatus || "Not currently available"
              }
              connectionState={connectionState}
              onConnect={connect}
              onAccept={accept}
              onReject={reject}
              onRemove={remove}
              onRetry={retryConnection}
              // ⚠️ Assumption: no Messages page/API was provided, so this guesses
              // a `/messages/:userId` route. Adjust to match the real Messages
              // page's routing once that's confirmed.
              onMessage={() => navigate("/messages", { state: { otherUserId: profile.userId } })}
              isActing={isActing}
              connectionError={actionError}
          />
        </div>

        {/* Main content: primary column (About/Skills/Interests) + a compact
          sidebar, instead of six identical full-width stacked cards —
          Experience/Availability/Collaboration are already shown as badges
          in the header above, so they're consolidated into one small
          "Details" card here rather than repeated as their own cards. */}
        <div className="body-container mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="page-section-heading mb-3">About</h2>
              <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
                {profile.bio || "No bio added yet."}
              </p>
            </Card>

            <Card>
              <h2 className="page-section-heading mb-3">Skills</h2>
              {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                        <SkillBadge key={skill.id} skill={skill.skillName} />
                    ))}
                  </div>
              ) : (
                  <p className="text-sm text-[var(--cm-text-dim)]">
                    No skills added yet.
                  </p>
              )}
            </Card>

            <Card>
              <h2 className="page-section-heading mb-3">Interests</h2>
              {profile.interests && profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                        <Badge key={interest.id} variant="neutral">
                          {interest.interestName}
                        </Badge>
                    ))}
                  </div>
              ) : (
                  <p className="text-sm text-[var(--cm-text-dim)]">
                    No interests added yet.
                  </p>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <h2 className="page-section-heading mb-3">Details</h2>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--cm-text-dim)]">Experience</dt>
                  <dd>
                    {profile.experienceLevel ? (
                        <Badge variant="neutral">{profile.experienceLevel}</Badge>
                    ) : (
                        <span className="text-[var(--cm-muted)]">Not specified</span>
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--cm-text-dim)]">Status</dt>
                  <dd className="text-[var(--cm-text)]">
                    {profile.activityStatus || "Unknown"}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--cm-text-dim)]">Collaboration</dt>
                  <dd>
                    <Badge variant={profile.isOpenToCollaborate ? "soft" : "neutral"}>
                      {profile.isOpenToCollaborate ? "Open" : "Not open"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <h2 className="page-section-heading mb-3">Links</h2>
              <div className="flex flex-col gap-3">
                {githubUrl && (
                    <a href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)] hover:text-white"
                  >
                  <FaGithub />
                  GitHub
                  </a>
                  )}

                {profile.linkedinUrl && (

                    <a href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)] hover:text-white"
                  >
                  <FaLinkedin />
                  LinkedIn
                  </a>
                  )}

                {profile.portfolioUrl && (

                    <a href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)] hover:text-white"
                  >
                  <Globe />
                  Portfolio
                  </a>
                  )}

                {!hasLinks && (
                    <p className="text-sm text-[var(--cm-text-dim)]">
                      No links added yet.
                    </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
  );
}