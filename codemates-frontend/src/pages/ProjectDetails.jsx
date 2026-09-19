import { useState } from "react";
import { useParams } from "react-router-dom";
import { FolderX } from "lucide-react";

import ProjectHeader from "../components/project/ProjectHeader";
import ProjectOverview from "../components/project/ProjectOverview";
import ProjectStats from "../components/project/ProjectStats";
import ProjectMemberPreview from "../components/project/ProjectMemberPreview";
import EmptyState from "../components/ui/EmptyState";

import {
  projectDetails,
  defaultProjectDetails,
} from "../mock/projectDetailsMock";

/**
 * Project Details page (/projects/:projectId).
 *
 * Reads directly from local mock data for now — no API call yet. The
 * shape returned here is what useProject(projectId) should resolve to
 * once it's wired to a real endpoint; swapping the mock import below
 * for that hook later shouldn't require touching this JSX.
 */
export default function ProjectDetails() {
  const { projectId } = useParams();
  const [joined, setJoined] = useState(false);

  const project = projectDetails[projectId] ?? defaultProjectDetails;

  if (!project) {
    return (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="This project doesn't exist or may have been removed."
      />
    );
  }

  return (
    <div className="project-details-page">
      <div className="head-container">
        <ProjectHeader
          name={project.name}
          description={project.shortDescription}
          status={project.status}
          projectType={project.projectType}
          techStack={project.techStack}
          githubUrl={project.githubUrl}
          joined={joined}
          onJoin={() => setJoined((j) => !j)}
        />
      </div>

      <div className="body-container mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="main-container">
          <ProjectOverview
            description={project.description}
            goals={project.goals}
            requiredSkills={project.requiredSkills}
            rolesNeeded={project.rolesNeeded}
          />
        </div>

        <div className="sidebar-container flex flex-col gap-6">
          <ProjectStats teamSize={project.teamSize} tasks={project.tasks} />
          <ProjectMemberPreview members={project.members} />
        </div>
      </div>
    </div>
  );
}