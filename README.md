~~# CodeMates — Intelligent Developer Collaboration Platform

## Overview

CodeMates is a full-stack developer collaboration platform designed to simplify how developers find teammates, build projects, and collaborate during software development.

The platform combines elements of professional networking, project management, real-time communication, and AI-driven developer matching into a single unified system.

Unlike traditional tools that focus on only one aspect of collaboration (such as GitHub for code, Jira for tasks, or LinkedIn for networking), CodeMates aims to integrate the entire developer collaboration lifecycle.

---

## Problem Statement

Modern software development is fragmented across multiple tools:

- Developers struggle to find the right teammates for projects
- Team formation is manual and inefficient
- Communication and project execution are disconnected
- Contribution tracking is unclear and often unfair
- Project progress lacks transparency

As a result, many student and real-world projects fail due to poor collaboration rather than technical difficulty.

CodeMates solves this by providing a unified developer ecosystem.

---

## Core Idea

> "From discovering developers → forming teams → building projects → tracking contributions → analyzing performance — all in one platform."

---

## Key Features

*Status tags below reflect what's actually implemented in the backend as of this write-up, not just the product vision — see the API docs for exact endpoints.*

### 1. Developer Profile System ✅ Implemented
Each user has a structured developer profile including:

- Skills and technologies
- Experience level
- Bio and portfolio links
- GitHub integration
- Activity status

---

### 2. Developer Discovery System ✅ Implemented
Users can search and connect with other developers using:

- Skill-based search
- Experience filters
- Interest matching
- GitHub-based activity insights

---

### 3. AI-Powered Developer Matching (ML Feature) 🔜 Planned (Phase 2)

The system will recommend developers based on:

- Skill similarity scoring
- GitHub contribution activity
- Project relevance matching
- Collaboration history (future extension)

Output (planned):
- Ranked developer suggestions
- Match percentage score
- Reason for recommendation

**Current state:** the read/write plumbing exists (`MatchScoreResponseDto` with per-category
sub-scores and a weighted total), and the API returns real data — but the scoring logic itself
is a placeholder; nothing computes real skill/activity/interest similarity yet, and there's no
"reason for recommendation" field at all yet.

---

### 4. Social Networking Layer ✅ Implemented

- Friend/connection requests (send, accept, reject, block, remove)
- Private (direct) messaging
- Developer connections list
- Profile viewing with interaction options

---

### 5. Project & Workspace System ✅ Implemented

Users can create and manage projects by:

- Adding project name, description, and GitHub repository link
- Inviting developers to collaborate (7-day expiring invitations)
- Assigning roles (Leader, Contributor, Reviewer)
- Managing project workspace

Each workspace includes:

- Project discussion chat (real-time, WebSocket-based)
- Resource sharing — link-based (paste a URL to a Drive doc, Figma file, hosted asset, etc.);
  not binary file upload/storage within the app itself
- ~~File/asset organization~~ — see note above; full binary upload isn't built (needs
  object storage like S3/MinIO), only external-link resources are

---

### 6. Task Management System (Jira-like) ✅ Implemented

Inside each project:

- Kanban board (To Do, In Progress, Review, Done)
- Task assignment to members
- Deadlines and priorities
- Task comments and updates

---

### 7. Contribution Tracking System ⚠️ Partially implemented

Automatically tracks developer activity:

- ✅ Task completion
- ✅ Code contributions (via GitHub commit sync)
- ✅ Messages and participation
- 🔜 File and documentation contributions — the `filesShared`/`tasksReviewed` counters exist
  in the data model but nothing increments them yet

Generates a **Contribution Score** for fairness and transparency.

---

### 8. Analytics Dashboard (ML Feature) 🔜 Planned (Phase 2)

Provides insights such as:

- Team productivity trends
- Individual contribution analysis
- Project progress tracking
- Risk detection (delays or inactivity)

### Project Health Prediction (planned):
- Green: on track
- Yellow: moderate risk
- Red: high risk of delay

**Current state:** not started — no risk/health computation exists anywhere in the backend yet.
The raw data it would need (task completion rates, activity timestamps) is already being
collected via contribution-service, so this is a computation-layer feature to build on top of
existing data, not a from-scratch data pipeline.

---

### 9. GitHub Integration ✅ Implemented

- ✅ OAuth login via GitHub (sign up/log in with a GitHub account)
- ✅ Fetch repositories
- ✅ Analyze contributions (commit sync, feeds contribution scoring)
- ✅ Link projects to real codebases (repository linking)

---

## System Architecture

### Frontend
- React.js
- Tailwind CSS
- Zustand / Redux
- React Query

### Backend
- Spring Boot (Microservices)
- Spring Security + JWT (httpOnly cookies)
- WebSocket (real-time communication)

### Database
- PostgreSQL (primary data)
- Redis (caching + sessions)

### Communication Layer
- WebSockets for real-time chat and updates
- Kafka for inter-service events (registration, project/task lifecycle, GitHub sync, messaging)

---

## ML / AI Integration Points

1. **Developer Recommendation Engine** 🔜 Planned — plumbing built, scoring model not yet implemented
2. **Project Health Prediction** 🔜 Planned — not started
3. **Contribution Intelligence** ⚠️ Partial — real events tracked (tasks, commits, messages); "meaningful vs inactive" judgment not built

---

## Expected Outcomes

- Faster and smarter team formation
- Improved collaboration efficiency
- Transparent contribution tracking
- Reduced project failure rate
- Strong ecosystem for student and startup projects

---

## Future Enhancements

- AI project assistant
- Video meetings
- Screen sharing
- Smart resume generation from projects
- Plugin system for developers
- Binary file upload for workspace resources (currently link-only — see Project & Workspace System above)

---

## Conclusion

CodeMates is designed as a complete developer collaboration ecosystem that enhances how teams are formed and how software projects are executed. It focuses on combining networking, execution, and intelligence into a single platform to improve productivity and project success rates.~~
