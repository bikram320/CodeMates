/**
 * DashboardStats
 *
 * Four key metrics shown as cards below the welcome section.
 *
 * Props:
 *   stats {object}
 *     .activeProjects        {number}
 *     .tasksDueSoon          {number}
 *     .connections           {number}
 *     .contributionsThisWeek {number}
 */

import { FolderKanban, CheckSquare, Users, Activity } from 'lucide-react';

function StatCard({ icon: Icon, value, label, accentColor }) {
  return (
    <div className="card flex items-center gap-3 p-3">
      {/* Icon with tinted background */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <Icon size={18} style={{ color: accentColor }} />
      </div>

      {/* Number */}
      <div className="min-w-0">
        <p className="font-mono text-xl font-semibold tracking-tight text-[#F5F5F5]">
          {value ?? 0}
        </p>
        <p className="truncate text-xs text-[#8B86B8]">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardStats({ stats }) {
  const cards = [
    {
      icon: FolderKanban,
      value: stats?.activeProjects,
      label: 'Active Projects',
      accentColor: '#6C7BFF',
    },
    {
      icon: CheckSquare,
      value: stats?.tasksDueSoon,
      label: 'Tasks Due Soon',
      accentColor: '#F59E0B',
    },
    {
      icon: Users,
      value: stats?.connections,
      label: 'Connections',
      accentColor: '#C9A8FF',
    },
    {
      icon: Activity,
      value: stats?.contributionsThisWeek,
      label: 'Contributions This Week',
      accentColor: '#10B981',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}