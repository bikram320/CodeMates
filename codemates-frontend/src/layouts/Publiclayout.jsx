import { Outlet } from "react-router-dom";
import PublicNavbar from "src/components/layout/PublicNavbar";
import Footer from "src/components/layout/Footer";


export default function PublicLayout({
  children,
  showFooter = true,
  navLinks,
  logoSrc = null,
}) {
  return (
    <div className="public-layout container flex min-h-screen flex-col bg-[var(--cm-bg)]">
      <div className="head-container">
        <PublicNavbar links={navLinks} logoSrc={logoSrc} />
      </div>

      <main className="main-container flex-1">{children || <Outlet />}</main>

      {showFooter && (
        <div className="footer-container">
          <Footer logoSrc={logoSrc} />
        </div>
      )}
    </div>
  );
}