import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
import Navbar from "src/components/layout/Navbar";
import AppSidebar from "src/components/layout/AppSidebar";


export default function AppLayout({
  children,
  user,
  navItems,
  notificationCount = 0,
  sidebarFooter = null,
  logoSrc = null,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer with Escape.
  useEffect(() => {
    if (!drawerOpen) return undefined;

    function handleKey(event) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  return (
    <div className="app-layout flex h-screen w-full flex-col overflow-hidden bg-[var(--cm-bg)]">
      <div className="head-container shrink-0">
        <Navbar
          user={user}
          notificationCount={notificationCount}
          onMenuToggle={() => setDrawerOpen(true)}
          logoSrc={logoSrc}
        />
      </div>

      <div className="body-container flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="sidebar-container hidden lg:block">
          <AppSidebar items={navItems} footer={sidebarFooter} />
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
                aria-label="Close navigation"
                className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
              >
                <X size={19} />
              </button>
              <AppSidebar
                items={navItems}
                footer={sidebarFooter}
                onNavigate={() => setDrawerOpen(false)}
                className="pt-12"
              />
            </div>
          </div>
        )}

        {/* Scrollable page content */}
        <main className="main-container flex-1 overflow-y-auto">
          <div className="content-container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}