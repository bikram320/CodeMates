import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, BarChart3, Check, ChevronDown, FolderGit2, ListChecks, MessageSquare, Search, Sparkles, Users } from "lucide-react";
import Button from "../components/ui/Button";

const FAQS = [
  ["What is CodeMates?", "A focused workspace for discovering developers, forming teams, and moving shared projects from idea to shipped work."],
  ["Do I need a finished idea?", "No. Browse projects that need your skills, or start with a rough concept and invite collaborators as it takes shape."],
  ["What can my team manage here?", "Tasks, project chat, shared resources, contributions, analytics, and GitHub activity all live inside the project workspace."],
  ["Can I join more than one project?", "Yes. Your profile and connections travel with you, so you can contribute to several projects without rebuilding your workspace."],
  ["Is GitHub required?", "No. GitHub is an optional integration for teams that want repository and commit activity alongside their project work."],
];

const FEATURES = [
  { icon: Search, title: "Find the right people", text: "Search by skill, experience, and availability instead of hoping the right collaborator happens to see your post." },
  { icon: Users, title: "Shape a real team", text: "Send connection requests, invite teammates, and give every project a clear place to work together." },
  { icon: ListChecks, title: "Keep work moving", text: "Turn ideas into visible tasks with a Kanban workflow your whole team can understand at a glance." },
  { icon: MessageSquare, title: "Talk in context", text: "Keep decisions, questions, and updates close to the project instead of scattering them across tools." },
];

const BOARD_COLUMNS = [
  { title: "To Do", tone: "rose", cards: ["Define MVP scope", "Invite a designer"] },
  { title: "In Progress", tone: "blue", cards: ["Build auth flow", "Create project shell"] },
  { title: "Done", tone: "green", cards: ["Project brief", "Team kickoff"] },
];

function BrowserFrame({ children, className = "" }) {
  return <div className={`landing-browser ${className}`}><div className="landing-browser-bar"><span /><span /><span /><p>codemates / workspace</p><div className="landing-browser-actions">- □ ×</div></div>{children}</div>;
}

function WorkspacePreview() {
  return <BrowserFrame className="landing-workspace-preview"><div className="preview-sidebar"><strong>CM</strong>{["Overview", "Tasks", "Team", "Chat", "Resources", "GitHub"].map((item, index) => <span key={item} className={index === 1 ? "active" : ""}>{item}</span>)}</div><div className="preview-main"><div className="preview-heading"><div><small>PROJECT / OPENBOARD</small><h3>Build in public, together.</h3></div><b>+ Invite</b></div><div className="preview-stats"><span><small>TEAM MEMBERS</small><strong>06</strong></span><span><small>OPEN TASKS</small><strong>14</strong></span><span><small>CONTRIBUTIONS</small><strong>82</strong></span></div><div className="preview-board">{BOARD_COLUMNS.map((column) => <div className="preview-column" key={column.title}><p><i className={column.tone} />{column.title}<em>{column.cards.length}</em></p>{column.cards.map((card) => <div className="preview-task" key={card}><strong>{card}</strong><small>{column.title === "Done" ? "completed" : "this week"}</small></div>)}</div>)}</div></div></BrowserFrame>;
}

function ActivityPreview() {
  return <BrowserFrame className="landing-activity-preview"><div className="activity-top"><small>TEAM ACTIVITY</small><strong>Last 7 days <ChevronDown size={13} /></strong></div><div className="activity-chart"><div className="activity-bars">{[42, 67, 51, 82, 58, 93, 72, 100, 64, 86, 48, 78].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="activity-line" /></div><div className="activity-list"><p><b className="avatar cyan">AK</b><span><strong>Amara completed a task</strong><small>Build auth flow · 12 min ago</small></span><em>+8</em></p><p><b className="avatar pink">JR</b><span><strong>Jon pushed a commit</strong><small>openboard-web · 44 min ago</small></span><em>+5</em></p></div></BrowserFrame>;
}

export default function Landing() {
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 50);
    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    const revealItems = document.querySelectorAll(".landing-reveal");
    if (!revealItems.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.14 }
    );

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return <div className="landing-page">
    <section className="landing-hero"><div className="landing-hero-grid" /><div className="landing-eyebrow"><span /> THE COLLABORATION LAYER FOR DEVELOPERS <span /></div><h1><span className="landing-tagline-line">Find the Right People.</span><span className="landing-tagline-line accent">Build the Right Things.</span></h1><p className="landing-hero-copy">CodeMates brings ambitious developers together to discover ideas, form teams, and turn shared momentum into real projects.</p><div className="landing-hero-actions"><Button to="/register" size="lg" rightIcon={ArrowRight}>Start building</Button><Button to="/discover/projects" variant="outline" size="lg">Explore projects</Button></div><p className="landing-note"><Sparkles size={14} /> Made for side projects, open source, and the next thing you cannot build alone.</p><WorkspacePreview /></section>
    <section className="landing-intro-band landing-reveal" id="how-it-works"><p className="landing-kicker">YOUR ENTIRE WORKFLOW, ONE SHARED PLACE.</p><h2>Good work gets easier<br />when the right people are close.</h2><p>From the first connection to the final commit, CodeMates gives your team the context to make progress without the busywork between tools.</p></section>
    <section className="landing-feature-stack">{FEATURES.map((feature, index) => { const Icon = feature.icon; return <article className={`landing-feature-row landing-reveal ${index % 2 ? "reverse" : ""}`} key={feature.title}><div className="landing-feature-copy"><span className="landing-feature-icon"><Icon size={19} /></span><small>0{index + 1} / CODEMATES</small><h2>{feature.title}</h2><p>{feature.text}</p><a href={index === 0 ? "/discover/developers" : "#workspace"}>{index === 0 ? "Discover developers" : "See how it works"} <ArrowRight size={15} /></a></div><div className="landing-feature-visual">{index === 0 ? <div className="discover-preview"><div className="fake-search"><Search size={14} /> Search by skill, role, or project</div>{["Maya Chen", "Leo Okafor", "Priya Shah"].map((name, i) => <div className="person-row" key={name}><b className={`avatar ${["cyan", "pink", "lime"][i]}`}>{name.split(" ").map((part) => part[0]).join("")}</b><span><strong>{name}</strong><small>{["React · UI systems", "Java · APIs", "Data · Python"][i]}</small></span><button type="button">Connect</button></div>)}</div> : index === 1 ? <WorkspacePreview /> : index === 2 ? <div className="mini-board">{BOARD_COLUMNS.map((column) => <div key={column.title}><strong>{column.title}</strong>{column.cards.map((card) => <span key={card}><Check size={12} />{card}</span>)}</div>)}</div> : <ActivityPreview />}</div></article>; })}</section>
    <section className="landing-proof-band landing-reveal" id="workspace"><div><BarChart3 size={19} /><strong>ONE WORKSPACE.</strong><span>less tab-switching</span></div><div><FolderGit2 size={19} /><strong>REAL PROJECTS.</strong><span>visible momentum</span></div><div><Users size={19} /><strong>BETTER TOGETHER.</strong><span>stronger outcomes</span></div></section>
    <section className="landing-pricing landing-reveal"><div><p className="landing-kicker">A SIMPLE PLACE TO START</p><h2>One simple price.<br /><span>No subscription.</span></h2><p>Build your profile, find collaborators, and join projects without putting a paywall between you and your next great idea.</p></div><div className="price-card"><small>CODEMATES ACCESS</small><strong>$0</strong><span>forever for the core workspace</span><Button to="/register" fullWidth rightIcon={ArrowRight}>Create your free profile</Button><p><Check size={14} /> Developer discovery</p><p><Check size={14} /> Project workspaces</p><p><Check size={14} /> Tasks, chat, and contributions</p></div></section>
    <section className="landing-faq landing-reveal"><p className="landing-kicker">QUESTIONS, ANSWERED</p><h2>Frequently asked questions</h2><div>{FAQS.map(([question, answer], index) => <button type="button" className={`faq-row ${openFaq === index ? "open" : ""}`} onClick={() => setOpenFaq(openFaq === index ? -1 : index)} key={question}><span>{question}</span><ChevronDown size={16} />{openFaq === index && <p>{answer}</p>}</button>)}</div></section>
    <section className="landing-final-cta landing-reveal"><div className="landing-final-grid" /><Sparkles size={20} /><h2>Your next project<br /><span>starts with a hello.</span></h2><p>Find your people. Make something real.</p><Button to="/register" size="lg" rightIcon={ArrowRight}>Join CodeMates</Button></section>
  </div>;
}
