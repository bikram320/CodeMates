import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Calendar,
    ExternalLink,
    Lock,
    UserPlus,
    Users,
    X,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import Navbar from "src/components/layout/Navbar";
import ProjectSidebar from "src/components/layout/ProjectSidebar";
import Button from "src/components/ui/Button";
import Spinner from "src/components/ui/Spinner";
import useAuth from "src/hooks/useAuth";
import useProfile from "src/hooks/useProfile";
import { useMyJoinRequests, useJoinRequestMutations } from "src/hooks/useMyProjects";
import { getProject, checkMembership, requestToJoin } from "src/api/projectApi";

/* ── Non-member preview ──────────────────────────────────────────────────── */

function BackToDiscoverLink() {
    return (
        <Link
            to="/discover/projects"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--cm-text-dim)]
                 transition-colors hover:text-[var(--cm-text)]"
        >
            <ArrowLeft size={15} />
            Back to Discover Projects
        </Link>
    );
}

/**
 * Non-member preview for a PUBLIC project. Only reached for PUBLIC
 * projects the caller hasn't joined — PRIVATE + non-member never gets
 * this far (see isPrivateAndBlocked below), and shows
 * PrivateProjectNotice instead.
 *
 * Pulls its own join-request state via useMyJoinRequests() rather than
 * taking currentUserId as a prop, so it can show "Request pending" /
 * "Cancel request" without the parent needing to plumb that through.
 */
function ProjectPreview({ project }) {
    const queryClient = useQueryClient();
    const { joinRequests } = useMyJoinRequests();
    const { cancelJoinRequest, isCancelling } = useJoinRequestMutations();

    const existingRequest = joinRequests.find((r) => r.projectId === project.id);

    const joinMutation = useMutation({
        mutationFn: () => requestToJoin(project.id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["join-requests", "my"] }),
    });

    const techList = (project.techStack ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const requestState =
        joinMutation.isSuccess || existingRequest?.status === "PENDING"
            ? "pending"
            : existingRequest?.status === "REJECTED"
                ? "rejected"
                : existingRequest?.status === "CANCELLED"
                    ? "cancelled"
                    : "none";

    const createdLabel = project.createdAt
        ? new Date(project.createdAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
        : null;

    return (
        <div className="project-preview mx-auto flex max-w-2xl flex-col gap-6 py-8">
            <BackToDiscoverLink />

            <div className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--cm-text)]">{project.name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-[var(--cm-border)] px-2 py-0.5 text-[var(--cm-text-dim)]">
                {project.status}
              </span>
                            <span className="rounded-full border border-[var(--cm-border)] px-2 py-0.5 text-[var(--cm-text-dim)]">
                {project.visibility}
              </span>
                        </div>
                    </div>

                    <div className="shrink-0">
                        {requestState === "pending" ? (
                            <div className="flex flex-col items-end gap-2">
                                <Button variant="outline" disabled>
                                    Request pending
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => cancelJoinRequest(existingRequest.id)}
                                    disabled={isCancelling}
                                    className="inline-flex items-center gap-1.5 text-xs text-[var(--cm-text-dim)]
                             transition-colors hover:text-red-300 disabled:opacity-50"
                                >
                                    <XCircle size={13} />
                                    {isCancelling ? "Cancelling…" : "Cancel request"}
                                </button>
                            </div>
                        ) : requestState === "rejected" ? (
                            <p className="max-w-[16rem] text-right text-sm text-[var(--cm-text-dim)]">
                                Your last request wasn't accepted.
                            </p>
                        ) : (
                            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                                <UserPlus size={15} />
                                {joinMutation.isPending ? "Requesting…" : "Request to Join"}
                            </Button>
                        )}
                        {joinMutation.isError && (
                            <p role="alert" className="mt-2 max-w-[16rem] text-right text-sm text-red-300">
                                {joinMutation.error?.message || "Couldn't send your request. Try again."}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[var(--cm-border)] pt-4 text-sm text-[var(--cm-text-dim)]">
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} />
              {project.memberCount}
              {project.maxMembers ? ` / ${project.maxMembers}` : ""} members
          </span>
                    {createdLabel && (
                        <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              Created {createdLabel}
            </span>
                    )}
                    {project.githubRepoUrl && (

                        <a href={project.githubRepoUrl}
                           target="_blank"
                           rel="noreferrer"
                           className="inline-flex items-center gap-1.5 hover:text-[var(--cm-text)]"
                        >
                            <ExternalLink size={14} />
                            Repository
                        </a>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] p-5">
                <h2 className="mb-2 text-sm font-semibold text-[var(--cm-text)]">About this project</h2>
                <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
                    {project.description || "No description provided."}
                </p>
            </div>

            {techList.length > 0 && (
                <div>
                    <h2 className="mb-2 text-sm font-semibold text-[var(--cm-text)]">Tech stack</h2>
                    <div className="flex flex-wrap gap-2">
                        {techList.map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-[var(--cm-surface)] px-3 py-1 text-xs text-[var(--cm-text-dim)]"
                            >
                {t}
              </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function PrivateProjectNotice() {
    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
            <BackToDiscoverLink />
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface)] py-24 text-center">
                <Lock size={28} className="text-[var(--cm-text-dim)]" />
                <h1 className="text-xl font-semibold text-[var(--cm-text)]">This project is private</h1>
                <p className="max-w-sm text-sm text-[var(--cm-text-dim)]">
                    You need to be a member to view this project.
                </p>
            </div>
        </div>
    );
}

/* ── Main layout ─────────────────────────────────────────────────────────── */

export default function ProjectLayout({
                                          project: projectProp,
                                          children,
                                          user,
                                          notificationCount = 0,
                                          logoSrc = null,
                                      }) {
    const { user: authUser, isAuthenticated, isLoading } = useAuth();
    const params = useParams();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const activeUser = user || authUser;

    // useAuth()'s `user.userId` comes from a single, unscoped localStorage
    // cache (see useAuth.js's CACHE_KEY) that's only populated by an actual
    // login()/register() call in THIS browser. Switch accounts, open a
    // second tab, or land here after any flow that doesn't call login()
    // directly, and it silently falls back to the `profileUnknown`
    // placeholder — userId: null — with no error, no loading state, nothing
    // to signal it happened. That made every membership check below quietly
    // never fire for any account except whichever one most recently logged
    // in fresh in this browser, and non-members/members/project owners
    // alike all fell through to the same "treat as non-member" branch.
    //
    // useProfile() doesn't have this problem: getMyProfile() is a real
    // GET /api/users/me call, authenticated purely by the httpOnly cookie
    // server-side — nothing cached client-side to go stale or leak between
    // accounts. ProfileResponse carries a real `userId` field (confirmed
    // from the actual network response), so it's the reliable source here.
    const { profile } = useProfile();

    const currentUserId =
        profile?.userId ??
        activeUser?.userId ??
        activeUser?.id ??
        null;

    useEffect(() => {
        if (!drawerOpen) return undefined;
        function handleKey(event) {
            if (event.key === "Escape") setDrawerOpen(false);
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [drawerOpen]);

    // Only fetched when no `project` prop was supplied — same
    // fallback-to-route-param behavior as before, now backed by a real
    // fetch so visibility/status/memberCount are available for the
    // membership branch below. getProject() 403s for a PRIVATE project the
    // caller isn't a member of, which IS the "private, blocked" signal —
    // no second round trip needed.
    const projectQuery = useQuery({
        queryKey: ["projects", params.projectId],
        queryFn: () => getProject(params.projectId),
        enabled: !projectProp && !!params.projectId && isAuthenticated,
        retry: false,
    });

    const project = projectProp || projectQuery.data;
    const isPrivateAndBlocked =
        !projectProp && projectQuery.isError && projectQuery.error?.status === 403;

    const membershipQuery = useQuery({
        queryKey: ["projects", params.projectId, "members", currentUserId, "check"],
        queryFn: () => checkMembership(params.projectId, currentUserId),
        enabled: !!params.projectId && !!currentUserId && !!project,
        retry: false,
    });

    if (isLoading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (isPrivateAndBlocked) {
        return (
            <div className="project-layout flex h-screen w-full flex-col overflow-hidden bg-[var(--cm-bg)]">
                <div className="head-container shrink-0">
                    <Navbar user={activeUser} notificationCount={notificationCount} logoSrc={logoSrc} />
                </div>
                <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <PrivateProjectNotice />
                </main>
            </div>
        );
    }

    if (!projectProp && (projectQuery.isLoading || (project && membershipQuery.isLoading))) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[var(--cm-bg)]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!projectProp && projectQuery.isError) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-[var(--cm-bg)] text-center">
                <AlertTriangle size={24} className="text-[var(--cm-text-dim)]" />
                <p className="text-sm text-[var(--cm-text-dim)]">
                    {projectQuery.error?.message || "Couldn't load this project."}
                </p>
            </div>
        );
    }

    const isMember = projectProp ? true : Boolean(membershipQuery.data?.isMember);

    // Non-member on a PUBLIC project: lightweight preview, no sidebar tabs.
    if (!projectProp && project && !isMember) {
        return (
            <div className="project-layout flex h-screen w-full flex-col overflow-hidden bg-[var(--cm-bg)]">
                <div className="head-container shrink-0">
                    <Navbar user={activeUser} notificationCount={notificationCount} logoSrc={logoSrc} />
                </div>
                <main className="main-container flex-1 overflow-y-auto">
                    <div className="content-container w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                        <ProjectPreview project={project} />
                    </div>
                </main>
            </div>
        );
    }

    const activeProject = project || { id: params.projectId || "", name: "Project" };

    return (
        <div className="project-layout flex h-screen w-full flex-col overflow-hidden bg-[var(--cm-bg)]">
            <div className="head-container shrink-0">
                <Navbar
                    user={activeUser}
                    notificationCount={notificationCount}
                    onMenuToggle={() => setDrawerOpen(true)}
                    logoSrc={logoSrc}
                />
            </div>

            <div className="body-container flex flex-1 overflow-hidden">
                {/* Desktop sidebar */}
                <div className="sidebar-container hidden lg:block">
                    <ProjectSidebar project={activeProject} />
                </div>

                {/* Mobile drawer */}
                {drawerOpen && (
                    <div className="drawer-container fixed inset-0 z-50 lg:hidden">
                        <div
                            className="drawer-overlay absolute inset-0 bg-black/60"
                            onClick={() => setDrawerOpen(false)}
                            aria-hidden="true"
                        />
                        <div className="drawer-panel relative h-full w-[var(--cm-sidebar-w)] shadow-2xl shadow-black/50">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Close project navigation"
                                className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
                            >
                                <X size={19} />
                            </button>
                            <ProjectSidebar
                                project={activeProject}
                                onNavigate={() => setDrawerOpen(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Scrollable project content */}
                <main className="main-container flex-1 overflow-y-auto">
                    <div className="content-container w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                        {children || <Outlet context={{ project: activeProject }} />}
                    </div>
                </main>
            </div>
        </div>
    );
}