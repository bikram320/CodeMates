import { Link } from "react-router-dom";
import { User, Mail, MessagesSquare } from "lucide-react";
import { FaGithub, FaLinkedin, FaDiscord } from "react-icons/fa";
import Logo from "src/components/ui/Logo";


const DEFAULT_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Discover developers", to: "/discover/developers" },
      { label: "Browse projects", to: "/discover/projects" },
      { label: "Project workspaces", to: "/features/workspaces" },
      { label: "Contribution tracking", to: "/features/contributions" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", to: "/docs" },
      { label: "Guides", to: "/guides" },
      { label: "Changelog", to: "/changelog" },
      { label: "Support", to: "/support" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", to: "https://github.com", external: true },
      { label: "Discord", to: "https://discord.com", external: true },
      { label: "Contribute", to: "/contribute" },
      { label: "Code of conduct", to: "/code-of-conduct" },
    ],
  },
];

const DEFAULT_SOCIALS = [
  { label: "GitHub", href: "https://github.com", icon: FaGithub },
  { label: "Discord", href: "https://discord.com", icon: FaDiscord },
  { label: "LinkedIn", href: "https://linkedin.com", icon: FaLinkedin },
  { label: "Email", href: "mailto:hello@codemates.dev", icon: Mail },
];

const linkClass =
  "text-sm text-[var(--cm-text-dim)] transition-colors hover:text-[var(--cm-text)]";

export default function Footer({
  columns = DEFAULT_COLUMNS,
  socials = DEFAULT_SOCIALS,
  tagline = "BETTER TOGETHER",
  logoSrc = null,
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--cm-border)] bg-[var(--cm-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand block */}
          <div>
            <Logo to="/" size="md" src={logoSrc} />
            <p className="mt-4 font-[var(--cm-font-mono)] text-xs tracking-[0.2em] text-[var(--cm-lavender)]">
              {tagline}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--cm-muted)]">
              Find collaborators, form a team, and ship the project — without
              stitching five tools together.
            </p>

            <div className="mt-5 flex items-center gap-2">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--cm-border)] text-[var(--cm-text-dim)] transition-colors hover:border-[var(--cm-border-strong)] hover:text-[var(--cm-text)]"
                  >
                    {Icon && <Icon size={17} />}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-medium text-[var(--cm-text)]">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClass}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--cm-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--cm-muted)]">
            © {year} CodeMates. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="text-xs text-[var(--cm-muted)] hover:text-[var(--cm-text-dim)]">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs text-[var(--cm-muted)] hover:text-[var(--cm-text-dim)]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}