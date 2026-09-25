import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { X } from "lucide-react";
import Navbar from "src/components/layout/Navbar";
import ProjectSidebar from "src/components/layout/ProjectSidebar";
import { useAuth } from "src/context/AuthContext";

export default function ProjectLayout({
  project,
  children,
  user,
  notificationCount = 0,
  logoSrc = null,
}) {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const params = useParams();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fall back to the route param when no project object was supplied.
  const activeProject = project || { id: params.projectId || "", name: "Project" };

  useEffect(() => {
    if (!drawerOpen) return undefined;

    function handleKey(event) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const activeUser = user || authUser;

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