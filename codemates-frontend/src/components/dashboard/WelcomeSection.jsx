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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function WelcomeSection({ user }) {
  const name = user?.fullName || user?.username || 'Developer';

  return (
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
      </div>
    </div>
  );
}