// src/components/dashboard/DashboardStats.jsx
import { Users, UserPlus, Bell, Sparkles } from 'lucide-react';

const CARDS = [
  { key: 'connections', label: 'Connections', icon: Users },
  { key: 'pendingRequests', label: 'Pending requests', icon: UserPlus },
  { key: 'unreadNotifications', label: 'Unread notifications', icon: Bell },
  { key: 'skills', label: 'Skills listed', icon: Sparkles },
];

export default function DashboardStats({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="card p-5 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-[#1D1A40] flex items-center justify-center">
            <Icon size={18} style={{ color: '#8B86B8' }} />
          </div>
          <div className="text-2xl font-semibold text-[#F5F5F5]">{stats[key] ?? 0}</div>
          <div className="text-sm text-[#8B86B8]">{label}</div>
        </div>
      ))}
    </div>
  );
}