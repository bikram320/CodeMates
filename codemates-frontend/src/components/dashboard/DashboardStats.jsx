// src/components/dashboard/DashboardStats.jsx
<<<<<<< Updated upstream
import { Users, UserPlus, Bell, Sparkles } from 'lucide-react';

const CARDS = [
  { key: 'connections', label: 'Connections', icon: Users },
  { key: 'pendingRequests', label: 'Pending requests', icon: UserPlus },
  { key: 'unreadNotifications', label: 'Unread notifications', icon: Bell },
  { key: 'skills', label: 'Skills listed', icon: Sparkles },
=======
// Props unchanged: { stats }

import { Users, UserPlus, Bell, FolderKanban } from 'lucide-react';

const CARDS = [
  { key: 'connections', label: 'Connections', icon: Users, tint: 'text-indigo-600', chip: 'bg-indigo-50' },
  { key: 'pendingRequests', label: 'Pending requests', icon: UserPlus, tint: 'text-amber-600', chip: 'bg-amber-50' },
  { key: 'unreadNotifications', label: 'Unread notifications', icon: Bell, tint: 'text-rose-500', chip: 'bg-rose-50' },
  { key: 'skills', label: 'Skills listed', icon: FolderKanban, tint: 'text-emerald-600', chip: 'bg-emerald-50' },
>>>>>>> Stashed changes
];

export default function DashboardStats({ stats }) {
  return (
<<<<<<< Updated upstream
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="card p-5 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#1D1A40] flex items-center justify-center">
            <Icon size={18} style={{ color: '#8B86B8' }} />
          </div>
          <div className="text-2xl font-semibold text-[#F5F5F5]">{stats[key] ?? 0}</div>
          <div className="text-sm text-[#8B86B8]">{label}</div>
=======
    <div className="dashboard-stats grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, tint, chip }) => (
        <div
          key={key}
          className="dashboard-stat group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${chip}`}>
            <Icon size={20} className={tint} />
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {stats?.[key] ?? 0}
          </div>
          <div className="mt-0.5 text-sm text-slate-500">{label}</div>
>>>>>>> Stashed changes
        </div>
      ))}
    </div>
  );
}