// src/pages/Dashboard.jsx
// Same data flow as before — only markup/classes changed.

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import DashboardStats from '../components/dashboard/DashboardStats';
import RecentActivity from '../components/dashboard/RecentActivity';
import SuggestedDevelopers from '../components/dashboard/SuggestedDevelopers';
import '../styles/dashboard.css';

function Pulse({ className }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard…" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2.5">
          <Pulse className="h-8 w-64" />
          <Pulse className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          <Pulse className="h-10 w-36 rounded-lg" />
          <Pulse className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <Pulse className="h-10 w-10 rounded-xl" />
            <Pulse className="h-8 w-14" />
            <Pulse className="h-3.5 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Pulse className="h-5 w-32" />
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3 py-4 border-b border-slate-100 last:border-0">
                <Pulse className="w-2 h-2 rounded-full mt-2 shrink-0" />
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
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Pulse className="w-11 h-11 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Pulse className="h-3.5 w-20" />
                    <Pulse className="h-3 w-14" />
                  </div>
                </div>
                <Pulse className="h-9 w-full rounded-lg" />
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
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
        <AlertCircle size={30} className="text-rose-500" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Failed to load dashboard
      </h2>
      <p className="text-sm text-slate-500 mb-7 max-w-sm leading-relaxed">
        {message || 'Something went wrong while fetching your dashboard data.'}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
      >
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
    <div className="dashboard-page w-full">
      <WelcomeSection user={data.user} />
      <DashboardStats stats={data.stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity notifications={data.recentActivity} />
        <SuggestedDevelopers developers={data.suggestedDevelopers} />
      </div>
    </div>
  );
}