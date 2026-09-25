import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FolderX } from "lucide-react";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectOverview from "../components/project/ProjectOverview";
import ProjectStats from "../components/project/ProjectStats";
import ProjectMemberPreview from "../components/project/ProjectMemberPreview";
import EmptyState from "../components/ui/EmptyState";

import { getProject, getProjectMembers } from "../api/projectApi";

/**
 * Project Details page (/projects/:projectId).
 *
 * Wired directly to ProjectController via projectApi.js — no mock data.
 *
 * Dropped vs. the earlier mock version, because ProjectResponse and the
 * real member endpoint don't carry the data for them:
 * - "Request to Join" CTA (no self-serve join endpoint on the backend)
 * - projectType badge (no matching field; replaced with visibility)
 * - goals / requiredSkills / rolesNeeded sections (no matching fields)
 * - task count / progress stat (lives behind a task-service endpoint
 *   not covered here)
 * - member names/avatars (getProjectMembers returns userId only, no
 *   display name — see ProjectMemberPreview)
 */
export default function ProjectDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [projectData, memberData] = await Promise.all([
        getProject(projectId),
        getProjectMembers(projectId),
      ]);
      setProject(projectData);
      setMembers(memberData ?? []);
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-sm text-[var(--cm-muted)]">
        Loading project...
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="This project doesn't exist or may have been removed."
      />
    );
  }

  const techStack = project.techStack
    ? project.techStack.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="project-details-page">
      <div className="head-container">
        <ProjectHeader
          name={project.name}
          status={project.status}
          visibility={project.visibility}
          techStack={techStack}
          githubUrl={project.githubRepoUrl}
        />
      </div>

      <div className="body-container mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="main-container">
          <ProjectOverview description={project.description} />
        </div>

        <div className="sidebar-container flex flex-col gap-6">
          <ProjectStats
            teamSize={{ current: project.memberCount, max: project.maxMembers }}
          />
          <ProjectMemberPreview members={members} />
        </div>
      </div>
    </div>
  );
}