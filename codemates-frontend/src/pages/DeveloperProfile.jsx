import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowUpRight, User, Globe, UserX } from "lucide-react";
import { FaGithub, FaLinkedin, FaDiscord } from "react-icons/fa";

import ProfileHeader from "../components/developer/ProfileHeader";
import SkillBadge from "../components/developer/SkillBadge";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";



const SECTION_TITLE = "page-section-heading mb-3";

/**
 * Developer Profile page (/discover/developers/:username).
 *
 * Reads directly from local mock data for now — no API call yet. The
 * shape returned here (a single profile object) is exactly what
 * useDeveloper(username) should resolve to once it's wired to
 * developerApi.getDeveloperByUsername(username), so swapping the mock
 * import below for that hook later shouldn't require touching the JSX.
 */
export default function DeveloperProfile() {
  const { username } = useParams();
  const [connected, setConnected] = useState(false);

  // Falls back to a default mock profile so the page has something to show
  // for any username while there's no real backend behind it yet.
  const profile = developerProfiles[username] ?? defaultDeveloperProfile;

  if (!profile) {
    return (
      <EmptyState
        icon={UserX}
        title="Developer not found"
        description="This profile doesn't exist or may have been removed."
      />
    );
  }

  return (
    <div className="developer-profile-page">
      <div className="head-container">
        <ProfileHeader
          name={profile.name}
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          tagline={profile.tagline}
          location={profile.location}
          experienceLevel={profile.experienceLevel}
          availability={profile.availability}
          connected={connected}
          onConnect={() => setConnected((c) => !c)}
        />
      </div>

      <div className="body-container mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="main-container flex flex-col gap-6">
          <Card>
            <h2 className={SECTION_TITLE}>About</h2>
            <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
              {profile.bio}
            </p>
          </Card>

          <Card>
            <h2 className={SECTION_TITLE}>Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </Card>

          <Card>
            <h2 className={SECTION_TITLE}>Experience</h2>
            <Badge variant="neutral" className="mb-2">
              {profile.experienceLevel}
            </Badge>
            <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
              {profile.experienceSummary}
            </p>
          </Card>

          <Card>
            <h2 className={SECTION_TITLE}>Projects</h2>
            <div className="flex flex-col">
              {profile.projects.map((project, index) => (
                <div
                  key={project.id}
                  className={`flex items-start justify-between gap-4 py-4 ${
                    index === 0 ? "pt-0" : ""
                  } ${
                    index < profile.projects.length - 1
                      ? "border-b border-[var(--cm-border)]"
                      : "pb-0"
                  }`}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[var(--cm-text)]">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--cm-text-dim)]">
                      {project.description}
                    </p>
                  </div>
                  <Button
                    href={project.url}
                    variant="ghost"
                    size="sm"
                    rightIcon={ArrowUpRight}
                    className="shrink-0"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="sidebar-container flex flex-col gap-6">
          <Card>
            <h2 className={SECTION_TITLE}>Links</h2>
            <div className="flex flex-col gap-2">
              {profile.links.github && (
                <Button
                  href={profile.links.github}
                  variant="outline"
                  size="sm"
                  leftIcon={FaGithub}
                  className="justify-start"
                >
                  GitHub
                </Button>
              )}
              {profile.links.linkedin && (
                <Button
                  href={profile.links.linkedin}
                  variant="outline"
                  size="sm"
                  leftIcon={FaLinkedin}
                  className="justify-start"
                >
                  LinkedIn
                </Button>
              )}
              
            
              {profile.links.portfolio && (
                <Button
                  href={profile.links.portfolio}
                  variant="outline"
                  size="sm"
                  leftIcon={Globe}
                  className="justify-start"
                >
                  Portfolio
                </Button>
              )}
              {!profile.links.github &&
                !profile.links.linkedin &&
                !profile.links.portfolio && (
                  <p className="text-sm text-[var(--cm-muted)]">
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