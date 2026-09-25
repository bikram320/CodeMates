import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserX, Globe } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

import ProfileHeader from "../components/developer/ProfileHeader";
import SkillBadge from "../components/developer/SkillBadge";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

import {
  getProfileByUsername,
  isNotFoundError,
} from "../api/profileApi";

export default function DeveloperProfile() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

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
  }, [username]);

  if (loading) {
    return (
        <div className="developer-profile-page">
          <div className="head-container">
            <Card>
              <p className="text-sm text-[var(--cm-text-dim)]">
                Loading developer profile...
              </p>
            </Card>
          </div>
        </div>
    );
  }

  if (error && isNotFoundError(error)) {
    return (
        <EmptyState
            icon={UserX}
            title="Developer not found"
            description="This profile doesn't exist or may have been removed."
        />
    );
  }

  if (error || !profile) {
    return (
        <EmptyState
            icon={UserX}
            title="Unable to load profile"
            description={
                error?.message ||
                "Something went wrong while loading this profile."
            }
        />
    );
  }

  const githubUrl = profile.githubUsername
      ? `https://github.com/${profile.githubUsername}`
      : null;

  return (
      <div className="developer-profile-page">
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
              connected={connected}
              onConnect={() => setConnected(!connected)}
          />
        </div>

        {/* Main Content */}
        <div className="body-container">
          {/* About */}
          <Card>
            <h2 className="page-section-heading mb-3">
              About
            </h2>

            <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
              {profile.bio || "No bio added yet."}
            </p>
          </Card>

          {/* Skills */}
          <Card>
            <h2 className="page-section-heading mb-3">
              Skills
            </h2>

            {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                      <SkillBadge
                          key={skill.id}
                          skill={skill.skillName}
                      />
                  ))}
                </div>
            ) : (
                <p className="text-sm text-[var(--cm-text-dim)]">
                  No skills added yet.
                </p>
            )}
          </Card>

          {/* Interests */}
          <Card>
            <h2 className="page-section-heading mb-3">
              Interests
            </h2>

            {profile.interests && profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                      <Badge
                          key={interest.id}
                          variant="neutral"
                      >
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

          {/* Experience */}
          <Card>
            <h2 className="page-section-heading mb-3">
              Experience
            </h2>

            {profile.experienceLevel ? (
                <Badge variant="neutral">
                  {profile.experienceLevel}
                </Badge>
            ) : (
                <p className="text-sm text-[var(--cm-text-dim)]">
                  Experience level not specified.
                </p>
            )}

            {profile.activityStatus && (
                <p className="mt-2 text-sm text-[var(--cm-text-dim)]">
                  Activity status: {profile.activityStatus}
                </p>
            )}
          </Card>

          {/* Links */}
          <Card>
            <h2 className="page-section-heading mb-3">
              Links
            </h2>

            <div className="flex flex-col gap-3">
              {githubUrl && (
                  <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)] hover:text-white"
                  >
                    <FaGithub />
                    GitHub
                  </a>
              )}

              {profile.linkedinUrl && (
                  <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)] hover:text-white"
                  >
                    <FaLinkedin />
                    LinkedIn
                  </a>
              )}

              {profile.portfolioUrl && (
                  <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--cm-text-dim)] hover:text-white"
                  >
                    <Globe />
                    Portfolio
                  </a>
              )}

              {!githubUrl &&
                  !profile.linkedinUrl &&
                  !profile.portfolioUrl && (
                      <p className="text-sm text-[var(--cm-text-dim)]">
                        No links added yet.
                      </p>
                  )}
            </div>
          </Card>

          {/* Collaboration */}
          <Card>
            <h2 className="page-section-heading mb-3">
              Collaboration
            </h2>

            <Badge variant="neutral">
              {profile.isOpenToCollaborate
                  ? "Open to collaborate"
                  : "Not currently open"}
            </Badge>
          </Card>
        </div>
      </div>
  );
}