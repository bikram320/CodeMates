
import { FaGithub, FaLinkedin, FaDiscord } from "react-icons/fa";
import { Link } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import Logo from "../ui/Logo";

/**
 * Footer for public pages.
 *
 * Every link here goes to a route that actually exists in AppRoutes.jsx.
 * The previous version linked to Documentation/Guides/Changelog/Support/
 * Contribute/Code of conduct/Privacy/Terms — none of those routes exist,
 * so they've been removed rather than pointed at placeholder pages.
 * Add a column back once a real page exists for it.
 *
 * GitHub/Discord only render if a real URL is configured via
 * VITE_GITHUB_URL / VITE_DISCORD_URL in your .env file — no invented
 * URLs. If neither is set, the whole Community column is hidden.
 */

const PLATFORM_LINKS = [
  { label: "Discover Developers", to: "/discover/developers" },
  { label: "Browse Projects", to: "/discover/projects" },
];

const linkClass =
  "text-sm text-[var(--cm-text-dim)] transition-colors hover:text-[var(--cm-text)]";

export default function Footer({ tagline = "BETTER TOGETHER", logoSrc = null }) {
  const year = new Date().getFullYear();

  const githubUrl = import.meta.env.VITE_GITHUB_URL;
  const discordUrl = import.meta.env.VITE_DISCORD_URL;
  const hasCommunityLinks = Boolean(githubUrl || discordUrl);

  return (
    <footer className="border-t border-[var(--cm-border)] bg-[var(--cm-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div
          className={`grid gap-10 ${
            hasCommunityLinks ? "md:grid-cols-[1.4fr_1fr_1fr]" : "md:grid-cols-[1.4fr_1fr]"
          }`}
        >
          <div>
            <Logo to="/" size="md" src={logoSrc} />
            <p className="mt-4 font-[var(--cm-font-mono)] text-xs tracking-[0.2em] text-[var(--cm-lavender)]">
              {tagline}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--cm-muted)]">
              Find collaborators, form a team, and ship the project — without
              stitching five tools together.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--cm-text)]">Platform</h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {hasCommunityLinks && (
            <div>
              <h3 className="text-sm font-medium text-[var(--cm-text)]">Community</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {githubUrl && (
                  <li>
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`${linkClass} inline-flex items-center gap-1.5`}
                    >
                      <FaGithub size={14} />
                      GitHub
                    </a>
                  </li>
                )}
                {discordUrl && (
                  <li>
                    <a
                      href={discordUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`${linkClass} inline-flex items-center gap-1.5`}
                    >
                      <MessagesSquare size={14} />
                      Discord
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-[var(--cm-border)] pt-6">
          <p className="text-xs text-[var(--cm-muted)]">
            © {year} CodeMates. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}