/**
 * src/pages/Dashboard.jsx
 *
 * The authenticated user's main landing page.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *
 *   Dashboard.jsx
 *       ↓  calls
 *   useDashboard()          src/hooks/useDashboard.js
 *       ↓  calls
 *   getDashboard()          src/api/dashboardApi.js
 *       ↓  routes to (based on VITE_USE_MOCK)
 *   getMockDashboard()      src/mock/dashboardMock.js   ← current
 *   or real API calls       /api/users/me, /api/projects/my, etc. ← future
 *
 * ── Switching to the real API ──────────────────────────────────────────────────
 *
 *   Change VITE_USE_MOCK=false in .env
 *   Nothing in this file changes.
 *
 * ── Layout ────────────────────────────────────────────────────────────────────
 *
 *   WelcomeSection              (full width)
 *   DashboardStats              (4-column grid)
 *   ActiveProjects | UpcomingTasks  (2/3 + 1/3)
 *   RecentActivity | SuggestedDevelopers  (1/2 + 1/2)
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import DashboardStats from '../components/dashboard/DashboardStats';
import ActiveProjects from '../components/dashboard/ActiveProjects';
import UpcomingTasks from '../components/dashboard/UpcomingTasks';
import RecentActivity from '../components/dashboard/RecentActivity';
import SuggestedDevelopers from '../components/dashboard/SuggestedDevelopers';

// ── Skeleton ──────────────────────────────────────────────────────────────────
// Shown while the API/mock is loading. Mirrors the real layout shape.

function Pulse({ className }) {
  return <div className={`bg-[#1D1A40] rounded animate-pulse ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard…" aria-busy="true">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-56" />
          <Pulse className="h-4 w-80" />
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <Pulse className="h-10 w-10 rounded-lg" />
            <Pulse className="h-8 w-14" />
            <Pulse className="h-3.5 w-28" />
          </div>
        ))}
      </div>

      {/* Projects + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Pulse className="h-5 w-32" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="flex justify-between gap-2">
                  <Pulse className="h-4 w-28" />
                  <Pulse className="h-4 w-16 rounded" />
                </div>
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-4/5" />
                <div className="flex gap-1.5">
                  <Pulse className="h-5 w-14 rounded" />
                  <Pulse className="h-5 w-14 rounded" />
                  <Pulse className="h-5 w-14 rounded" />
                </div>
                <Pulse className="h-1 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Pulse className="h-5 w-32" />
          <div className="card px-4 py-2 space-y-0">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#26224A] last:border-0">
                <Pulse className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Pulse className="h-3.5 w-full" />
                  <Pulse className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + Developers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Pulse className="h-5 w-32" />
          <div className="card px-4 py-2 space-y-0">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#26224A] last:border-0">
                <Pulse className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Pulse className="h-3.5 w-full" />
                  <Pulse className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Pulse className="h-5 w-44" />
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Pulse className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Pulse className="h-3.5 w-20" />
                    <Pulse className="h-3 w-12" />
                  </div>
                </div>
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-4/5" />
                <div className="flex gap-1">
                  <Pulse className="h-5 w-12 rounded" />
                  <Pulse className="h-5 w-12 rounded" />
                </div>
                <Pulse className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function DashboardError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-5">
        <AlertCircle size={28} style={{ color: '#EF4444' }} />
      </div>
      <h2 className="text-lg font-semibold text-[#F5F5F5] mb-2">
        Failed to load dashboard
      </h2>
      <p className="text-sm text-[#8B86B8] mb-7 max-w-sm leading-relaxed">
        {message || 'Something went wrong while fetching your dashboard data.'}
      </p>
      <button onClick={onRetry} className="btn-primary">
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <DashboardError
        message={error?.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1 ── Greeting */}
      <WelcomeSection user={data.user} />

      {/* 2 ── Key metrics */}
      <DashboardStats stats={data.stats} />

      {/* 3 ── Projects (2/3) + Tasks (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveProjects projects={data.activeProjects} />
        </div>
        <div>
          <UpcomingTasks tasks={data.upcomingTasks} />
        </div>
      </div>

      {/* 4 ── Activity feed + Suggested developers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={data.recentActivity} />
        <SuggestedDevelopers developers={data.suggestedDevelopers} />
      </div>
    </div>
  );
}