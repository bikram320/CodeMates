import { Outlet } from "react-router-dom";
import PublicNavbar from "src/components/layout/PublicNavbar";
import Footer from "src/components/layout/Footer";

export default function PublicLayout({
  children,
  showHeader = true,
  showFooter = true,
  navLinks,
  logoSrc = null,
}) {
  return (
    <div className="public-layout flex min-h-screen w-full flex-col bg-[var(--cm-bg)]">
      {showHeader && (
        <div className="head-container">
          <PublicNavbar links={navLinks} logoSrc={logoSrc} />
        </div>
      )}

      <main className="main-container flex-1">{children || <Outlet />}</main>

      {showFooter && (
        <div className="footer-container">
          <Footer logoSrc={logoSrc} />
        </div>
      )}
    </div>
  );
}