// src/pages/Dashboard.jsx
/**
 * ── Data flow ────────────────────────────────────────────
 *   Dashboard.jsx → useDashboard() → getDashboard()
 *   → real backend calls in src/api/dashboardApi.js
 *   (mock mode removed — this now always hits the live API)
 *
 * ── Layout ───────────────────────────────────────────────
 *   WelcomeSection            (full width)
 *   DashboardStats             (4-column grid)
 *   RecentActivity | SuggestedDevelopers  (1/2 + 1/2)
 *
 * ActiveProjects / UpcomingTasks removed: no Project or Task
 * controller exists yet. Re-add once /api/projects/my (or similar)
 * ships.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import DashboardStats from '../components/dashboard/DashboardStats';
import RecentActivity from '../components/dashboard/RecentActivity';
import SuggestedDevelopers from '../components/dashboard/SuggestedDevelopers';

function Pulse({ className }) {
  return <div className={`bg-[#1D1A40] rounded animate-pulse ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard…" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-56" />
          <Pulse className="h-4 w-80" />
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <Pulse className="h-10 w-10 rounded-lg" />
            <Pulse className="h-8 w-14" />
            <Pulse className="h-3.5 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Pulse className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-5">
        <AlertCircle size={28} style={{ color: '#EF4444' }} />
      </div>
      <h2 className="text-lg font-semibold text-[#F5F5F5] mb-2">Failed to load dashboard</h2>
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

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <DashboardError message={error?.message} onRetry={refetch} />;

  return (
    <div className="w-full space-y-5">
      <WelcomeSection user={data.user} />
      <DashboardStats stats={data.stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity notifications={data.recentActivity} />
        <SuggestedDevelopers developers={data.suggestedDevelopers} />
      </div>
    </div>
  );
}