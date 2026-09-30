<<<<<<< Updated upstream
/**
 * WelcomeSection
 *
 * Top section of the dashboard.
 * Shows a time-aware greeting, the user's name, and quick-action buttons.
 *
 * Props:
 *   user  {object}  - from data.user (ProfileResponse shape)
 *         .fullName {string}
 *         .username {string}
 */

import { Plus, UserPlus } from 'lucide-react';
=======
// src/components/dashboard/WelcomeSection.jsx
// Props unchanged: { user }
>>>>>>> Stashed changes

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', emoji: '' };
  if (hour < 18) return { text: 'Good afternoon', emoji: '👋' };
  return { text: 'Good evening', emoji: '👋' };
}

export default function WelcomeSection({ user }) {
  const { text, emoji } = getGreeting();
  const firstName = user?.fullName?.split(' ')[0] || user?.username || 'there';

  return (
<<<<<<< Updated upstream
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
          {getGreeting()}, {name} 👋
        </h1>
        <p className="text-[#A7A3D6] text-sm mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="btn-outline text-sm">
          <UserPlus size={14} />
          Find Developers
        </button>
        <button className="btn-primary text-sm">
          <Plus size={14} />
          New Project
        </button>
=======
    <div className="dashboard-welcome flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {text}, {firstName}
          <span aria-hidden="true">{emoji}</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      <div className="flex gap-3">
        <a
          href="/discover/developers"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600"
        >
          Find Developers
        </a>
        <a
          href="/projects/create"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
        >
          <span className="text-base leading-none">+</span> New Project
        </a>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}