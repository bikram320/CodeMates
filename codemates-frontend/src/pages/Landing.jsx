import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  FolderGit2,
  ListChecks,
  MessageSquare,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import { FaGithub, FaLinkedin, FaDiscord } from "react-icons/fa";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import SkillBadge from "../components/developer/SkillBadge";

const VALUE_PROPS = [
  {
    icon: Search,
    title: "Find collaborators",
    description:
      "Search by skill, experience, or availability to find developers who fit what you're building.",
  },
  {
    icon: Users,
    title: "Build your team",
    description:
      "Send connection requests, form a team, and assign roles without leaving the platform.",
  },
  {
    icon: MessageSquare,
    title: "Work together",
    description:
      "A dedicated workspace per project — tasks, chat, and shared resources in one place.",
  },
  {
    icon: BarChart3,
    title: "Track progress",
    description:
      "See who's contributing what, from tasks completed to commits pushed, all in one view.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create your profile",
    description: "Add your skills, experience level, and what you're looking to work on.",
  },
  {
    number: "02",
    title: "Find collaborators",
    description: "Browse developers by skill and availability, or discover projects looking for help.",
  },
  {
    number: "03",
    title: "Create or join a project",
    description: "Start something new, or request to join a project that needs your skills.",
  },
  {
    number: "04",
    title: "Build together",
    description: "Manage tasks, chat with your team, and track contributions as you ship.",
  },
];

const FEATURES = [
  { icon: Search, title: "Developer discovery", description: "Filter by skill, experience, and availability to find the right people." },
  { icon: Users, title: "Team formation", description: "Send and manage connection requests to build your project team." },
  { icon: ListChecks, title: "Task management", description: "A Kanban board for every project — To Do, In Progress, Review, Done." },
  { icon: MessageSquare, title: "Real-time project chat", description: "Team and direct conversations scoped to each project." },
  { icon: FolderGit2, title: "Shared resources", description: "Link docs, designs, and repos so the team always knows where to look." },
  { icon: Trophy, title: "Contribution tracking", description: "See tasks completed, commits pushed, and activity per teammate." },
  { icon: FaGithub, title: "GitHub integration", description: "Link a project to its repository to track commit activity." },
  { icon: BarChart3, title: "Project analytics", description: "A running view of how a project's team is contributing over time." },
];

// Same section names as the real ProjectSidebar, rendered as a static
// strip here — not the live component itself (see the note above).
const WORKSPACE_TABS = [
  "Overview",
  "Tasks",
  "Team",
  "Chat",
  "Resources",
  "Contributions",
  "Analytics",
  "GitHub",
];

export default function Landing() {
  const location = useLocation();

  // Picks up a "#how-it-works" hash carried over from another public
  // page (see PublicNavbar's handleHowItWorksClick) and scrolls once
  // this page has actually rendered.
  useEffect(() => {
    if (!location.hash) return undefined;
    const id = location.hash.replace("#", "");
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
        <div>
          <p className="font-[var(--cm-font-mono)] text-sm text-[var(--cm-lavender)]">
            CODEMATES
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold text-[var(--cm-text)] sm:text-6xl">
            Build better projects together.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--cm-text-dim)]">
            CodeMates helps developers find collaborators, form teams, manage
            projects, communicate in real time, and track progress — all in
            one place, instead of five disconnected tools.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/register" size="lg">
              Get Started
            </Button>
            <Button to="/discover/projects" variant="outline" size="lg">
              Explore Projects
            </Button>
          </div>
        </div>

        {/* Subtle workspace preview, built from the same Card/Badge/
            SkillBadge components used across the real app — not a mockup
            image, so it can't visually drift from the actual product. */}
        <Card padding="lg" className="hidden lg:block">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
              OpenBoard · Tasks
            </p>
            <Badge variant="soft">3 in progress</Badge>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {[
              { title: "Set up WebSocket sync", tag: "High" },
              { title: "Write onboarding docs", tag: "Low" },
              { title: "Accessibility audit", tag: "Medium" },
            ].map((task) => (
              <div
                key={task.title}
                className="flex items-center justify-between rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2.5"
              >
                <span className="text-sm text-[var(--cm-text-dim)]">{task.title}</span>
                <Badge variant="neutral">{task.tag}</Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--cm-border)] pt-4">
            <div className="flex flex-wrap gap-1.5">
              <SkillBadge skill="React" />
              <SkillBadge skill="TypeScript" />
            </div>
            <span className="flex items-center gap-1 text-xs text-[var(--cm-muted)]">
              <Users size={13} />
              3 members
            </span>
          </div>
        </Card>
      </section>

      {/* Value proposition */}
      <section className="border-t border-[var(--cm-border)] bg-[var(--cm-section-bg)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} padding="md">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--cm-indigo-soft)] text-[var(--cm-lavender)]">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-[var(--cm-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--cm-text-dim)]">
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-[var(--cm-text)]">How it works</h2>
          <p className="mt-3 text-sm text-[var(--cm-text-dim)]">
            From an empty profile to a shipped project, in four steps.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="font-[var(--cm-font-mono)] text-sm text-[var(--cm-lavender)]">
                {step.number}
              </span>
              <h3 className="text-base font-semibold text-[var(--cm-text)]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature showcase */}
      <section className="border-t border-[var(--cm-border)] bg-[var(--cm-section-bg)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-[var(--cm-text)]">
              Everything a project needs
            </h2>
            <p className="mt-3 text-sm text-[var(--cm-text-dim)]">
              One workspace instead of five disconnected tools.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} padding="md" hoverable>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cm-indigo-soft)] text-[var(--cm-lavender)]">
                    <Icon size={16} />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-[var(--cm-text)]">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--cm-text-dim)]">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workspace preview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-[var(--cm-text)]">
            One workspace per project
          </h2>
          <p className="mt-3 text-sm text-[var(--cm-text-dim)]">
            Every project gets its own space — the same tabs you'll see once you're inside one.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {WORKSPACE_TABS.map((tab, index) => (
            <div key={tab} className="flex items-center gap-2">
              <span className="rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface-2)] px-3 py-1.5 text-sm text-[var(--cm-text-dim)]">
                {tab}
              </span>
              {index < WORKSPACE_TABS.length - 1 && (
                <ArrowRight size={14} className="text-[var(--cm-muted)]" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--cm-border)] bg-[var(--cm-section-bg)]">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-[var(--cm-text)]">
            Ready to build something together?
          </h2>
          <p className="mt-3 text-sm text-[var(--cm-text-dim)]">
            Create your profile and start finding collaborators today.
          </p>
          <Button to="/register" size="lg" rightIcon={ArrowRight} className="mt-6">
            Start Building
          </Button>
        </div>
      </section>
    </div>
  );
}