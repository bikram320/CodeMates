import { Routes, Route, Link, useOutletContext } from "react-router-dom";

import Publiclayout from "src/layouts/Publiclayout";
import Applayout from "src/layouts/Applayout";
import Projectlayout from "src/layouts/Projectlayout";

import Landing from "src/pages/Landing";
import Dashboard from "src/pages/Dashboard";
import DiscoverDevelopers from "src/pages/DiscoverDevelopers";
import DeveloperProfile from "src/pages/DeveloperProfile";
import DiscoverProjects from "src/pages/DiscoverProjects";
import ProjectDetails from "src/pages/ProjectDetails";
import ProjectTasks from "src/pages/ProjectTasks";
import ProjectTeam from "src/pages/ProjectTeam";
import ProjectChat from "src/pages/ProjectChat";
import Placeholder from "src/pages/Placeholder";

function ProjectPlaceholder({ title, description }) {
  const { project } = useOutletContext();
  return (
    <Placeholder
      title={title}
      description={description}
      note={`Project: ${project?.name || project?.id}`}
    />
  );
}

function NotFound() {
  return (
    <div className="not-found flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-[var(--cm-font-mono)] text-sm text-[var(--cm-lavender)]">
        404
      </p>
      <h1 className="text-2xl font-semibold text-[var(--cm-text)]">
        Page not found
      </h1>
      <p className="max-w-sm text-sm text-[var(--cm-text-dim)]">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-[var(--cm-indigo)] px-4 py-2 text-sm text-white transition-colors hover:bg-[var(--cm-indigo-hover)]"
      >
        Back to home
      </Link>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages: Landing, auth screens */}
      <Route element={<Publiclayout />}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={<Placeholder title="Log in" description="Access your CodeMates account." />}
        />
        <Route
          path="/register"
          element={
            <Placeholder
              title="Create an account"
              description="Join CodeMates to find collaborators and ship projects."
            />
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Placeholder
              title="Forgot password"
              description="We will send you a link to reset your password."
            />
          }
        />
        <Route
          path="/reset-password"
          element={
            <Placeholder title="Reset password" description="Choose a new password for your account." />
          }
        />
      </Route>

      {/* Authenticated app pages */}
      <Route element={<Applayout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/discover/developers" element={<DiscoverDevelopers />} />
        <Route path="/discover/developers/:username" element={<DeveloperProfile />} />
        <Route path="/discover/projects" element={<DiscoverProjects />} />
        <Route
          path="/projects"
          element={<Placeholder title="My Projects" description="Projects you own or are a member of." />}
        />
        <Route
          path="/projects/create"
          element={<Placeholder title="Create Project" description="Create a new project and start building your team." />}
        />
        <Route
          path="/connections"
          element={<Placeholder title="Connections" description="Developers you are connected with." />}
        />
        <Route
          path="/messages"
          element={<Placeholder title="Messages" description="Direct messages and project channels." />}
        />
        <Route
          path="/notifications"
          element={
            <Placeholder
              title="Notifications"
              description="Recent activity across your projects and connections."
            />
          }
        />
        <Route
          path="/settings"
          element={<Placeholder title="Settings" description="Manage your account and preferences." />}
        />
      </Route>

      {/* Project-scoped pages, nested under a single project's layout */}
      <Route path="/projects/:projectId" element={<Projectlayout />}>
        <Route index element={<ProjectDetails />} />
        <Route
          path="tasks"
          element={<ProjectTasks />}
        />
        <Route
          path="team"
          element={<ProjectTeam />}
        />
        <Route
          path="chat"
          element={<ProjectChat />}
        />
        <Route
          path="resources"
          element={<ProjectPlaceholder title="Resources" description="Shared files, links, and docs for this project." />}
        />
        <Route
          path="contributions"
          element={<ProjectPlaceholder title="Contributions" description="Who did what, visualized over time." />}
        />
        <Route
          path="analytics"
          element={<ProjectPlaceholder title="Analytics" description="Project progress, team activity, task completion, and contribution insights." />}
        />
        <Route
          path="github"
          element={<ProjectPlaceholder title="GitHub" description="Repository activity linked to this project." />}
        />
        <Route
          path="settings"
          element={<ProjectPlaceholder title="Project Settings" description="Manage this project's details and access." />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}