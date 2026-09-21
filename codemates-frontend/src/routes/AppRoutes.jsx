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
import ProjectResources from "src/pages/ProjectResources";
import ProjectContributions from "src/pages/ProjectContributions";
import ProjectGitHub from "src/pages/ProjectGitHub";
import Notifications from "src/pages/Notifications";
import ProjectAnalytics from "src/pages/ProjectAnalytics";
import Settings from "src/pages/Settings";
import ProjectSettings from "src/pages/ProjectSettings";
import MyProjects from "src/pages/MyProjects";
import CreateProject from "src/pages/CreateProject";
import Connections from "src/pages/Connections";
import Messages from "src/pages/Messages";
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
          element={<MyProjects />} 
        />
        <Route
          path="/projects/create"
          element={<CreateProject />}
        />
        <Route
          path="/connections"
          element={<Connections />}
        />
        <Route
          path="/messages"
          element={<Messages />}
        />
        <Route
          path="/notifications"
          element={<Notifications />}
        />
        <Route
          path="/settings"
          element={<Settings />}
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
            element={<ProjectResources />}
        />
        <Route
            path="contributions"
            element={<ProjectContributions />}
        />
        <Route
          path="analytics"
          element={<ProjectAnalytics />}
        />
        <Route
          path="github"
          element={<ProjectGitHub />}
        />

        <Route
          path="settings"
          element={<ProjectSettings />}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}