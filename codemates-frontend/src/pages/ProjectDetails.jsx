import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FolderX } from "lucide-react";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectOverview from "../components/project/ProjectOverview";
import ProjectStats from "../components/project/ProjectStats";
import ProjectMemberPreview from "../components/project/ProjectMemberPreview";
import EditProjectModal from "../components/project/EditProjectModal";
import EmptyState from "../components/ui/EmptyState";

import { getProject, getProjectMembers, updateProject } from "../api/projectApi";
import useAuth from "../hooks/useAuth";

/**
 * Project Details page (/projects/:projectId).
 *
 * Wired directly to ProjectController via projectApi.js — no mock data.
 *
 * Layout: the header card on top; below it a main column (About, then the
 * Team with real names/avatars) and a narrow Details sidebar (team size,
 * created date, visibility).
 *
 * Editing: PUT /api/projects/{id} (projectApi.updateProject), LEADER only.
 * `canManage` is derived from the fetched member list + the signed-in
 * user's id, mirroring the server-side check.
 *
 * Member names/avatars: getProjectMembers returns userId only —
 * ProjectMemberPreview resolves them via useUserDirectory.
 */
export default function ProjectDetails() {
  const { projectId } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  async function handleSaveProject(formData) {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProject(projectId, formData);
      setProject(updated);
      setEditOpen(false);
    } catch (err) {
      setSaveError(err?.message || "Failed to update project.");
    } finally {
      setSaving(false);
    }
  }

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

  const canManage =
      !!user && members.some((m) => m.userId === user.userId && m.role === "LEADER");

  return (
      <div className="project-details-page">
        <div className="head-container">
          <ProjectHeader
              name={project.name}
              status={project.status}
              visibility={project.visibility}
              techStack={techStack}
              githubUrl={project.githubRepoUrl}
              canManage={canManage}
              onEdit={() => setEditOpen(true)}
          />
        </div>

        <div className="body-container mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
          <div className="main-container flex min-w-0 flex-col gap-6">
            <ProjectOverview description={project.description} />
            <ProjectMemberPreview members={members} />
          </div>

          <div className="sidebar-container flex flex-col gap-6">
            <ProjectStats
                teamSize={{ current: project.memberCount, max: project.maxMembers }}
                createdAt={project.createdAt}
                visibility={project.visibility}
            />
          </div>
        </div>

        <EditProjectModal
            open={editOpen}
            project={project}
            saving={saving}
            error={saveError}
            onClose={() => {
              if (!saving) {
                setEditOpen(false);
                setSaveError(null);
              }
            }}
            onSave={handleSaveProject}
        />
      </div>
  );
}