import { Routes, Route, useOutletContext } from "react-router-dom";
import BackButton from "src/components/ui/BackButton";

import Publiclayout from "src/layouts/Publiclayout";
import Applayout from "src/layouts/Applayout";
import Projectlayout from "src/layouts/Projectlayout";

import AuthSlider from "src/pages/AuthSlider.jsx";
import Landing from "src/pages/Landing";
import ForgotPassword from "src/pages/ForgotPassword";
import ResetPassword from "src/pages/ResetPassword";
import OAuthCallback from "src/pages/OAuthCallback";

import LoggedOut from "src/pages/LoggedOut";

import Dashboard from "src/pages/Dashboard";
import Profile from "src/pages/Profile";
import DiscoverDevelopers from "src/pages/DiscoverDevelopers";
import DeveloperProfile from "src/pages/DeveloperProfile";
import DiscoverProjects from "src/pages/DiscoverProjects";
import ProjectDetails from "src/pages/ProjectDetails";
import ProjectTasks from "src/pages/ProjectTasks";
import ProjectTeam from "src/pages/ProjectTeam";
import ProjectChat from "src/pages/ProjectChat";
import ProjectResources from "src/pages/ProjectResources";
import ProjectContributions from "src/pages/ProjectContributions";
import GitHubIntegration from "src/pages/GithubIntegration";
import Notifications from "src/pages/Notifications";
import ProjectAnalytics from "src/pages/ProjectAnalytics";
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
            <BackButton
                label="Back to home"
                className="mt-2 rounded-md bg-[var(--cm-indigo)] px-4 py-2 text-white hover:bg-[var(--cm-indigo-hover)]"
            />
        </div>
    );
}

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public marketing page (header + footer) */}
            <Route element={<Publiclayout />}>
                <Route path="/" element={<Landing />} />
            </Route>

            {/*
        Auth screens + standalone pages: no marketing header or footer.
        /login and /register both render the sliding AuthSlider page.
      */}
            <Route element={<Publiclayout showHeader={false} showFooter={false} />}>
                <Route path="/login" element={<AuthSlider />} />
                <Route path="/register" element={<AuthSlider />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/logged-out" element={<LoggedOut />} />
            </Route>

            {/* Authenticated app pages */}
            <Route element={<Applayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                {/*
          NOTE: no route for the sign-out confirmation — it's not a page.
          LogoutConfirmModal is an overlay (open/onClose props) mounted
          from wherever the "Sign out" action lives (the navbar's account
          menu), so it pops up over whatever page the user is already on
          instead of navigating them to a blank /logout route first.
        */}
                <Route path="/profile" element={<Profile />} />

                <Route path="/discover/developers" element={<DiscoverDevelopers />} />
                <Route path="/discover/developers/:username" element={<DeveloperProfile />} />
                <Route path="/connections/developers/:username" element={<DeveloperProfile />} />
                <Route path="/discover/projects" element={<DiscoverProjects />} />
                <Route path="/projects" element={<MyProjects />} />
                <Route path="/projects/create" element={<CreateProject />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={<Notifications />} />
                {/* <Route
          path="/settings"
          element={<Settings />}
        /> */}
            </Route>

            {/* Project-scoped pages, nested under a single project's layout */}
            <Route path="/projects/:projectId" element={<Projectlayout />}>
                <Route index element={<ProjectDetails />} />
                <Route path="tasks" element={<ProjectTasks />} />
                <Route path="team" element={<ProjectTeam />} />
                <Route path="chat" element={<ProjectChat />} />
                <Route path="resources" element={<ProjectResources />} />
                <Route path="contributions" element={<ProjectContributions />} />
                <Route path="analytics" element={<ProjectAnalytics />} />
                <Route path="github" element={<GitHubIntegration />} />

                {/* <Route
          path="settings"
          element={<ProjectSettings />}
        /> */}
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}