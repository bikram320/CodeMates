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
    <div className="card p-5">
      {/* Icon with tinted background */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <Icon size={18} style={{ color: accentColor }} />
      </div>

      {/* Number */}
      <p className="text-3xl font-bold font-mono text-[#F5F5F5] tracking-tight mb-1">
        {value ?? 0}
      </p>

      {/* Label */}
      <p className="text-sm text-[#8B86B8]">{label}</p>
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}