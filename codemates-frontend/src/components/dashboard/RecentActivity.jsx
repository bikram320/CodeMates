// src/components/dashboard/RecentActivity.jsx
// Props unchanged: { notifications }

import { CheckCircle2, ListTodo, FolderPlus, Sparkles, Bell } from 'lucide-react';

const TYPE_STYLES = {
  TASK_COMPLETED: { icon: CheckCircle2, tint: 'text-emerald-600', chip: 'bg-emerald-50' },
  TASK_ASSIGNED: { icon: ListTodo, tint: 'text-indigo-600', chip: 'bg-indigo-50' },
  PROJECT_CREATED: { icon: FolderPlus, tint: 'text-violet-600', chip: 'bg-violet-50' },
};
const DEFAULT_STYLE = { icon: Sparkles, tint: 'text-amber-600', chip: 'bg-amber-50' };

function ActivityRow({ notification }) {
  const { icon: Icon, tint, chip } = TYPE_STYLES[notification.type] ?? DEFAULT_STYLE;
  return (
    <div className="flex items-start gap-3 py-4 border-b border-slate-100 last:border-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${chip}`}>
        <Icon size={15} className={tint} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{notification.title}</p>
        {notification.body && (
          <p className="mt-0.5 text-sm text-slate-500">{notification.body}</p>
        )}
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
        <Bell size={18} className="text-slate-300" />
      </div>
      <p className="text-sm text-slate-500">Nothing new yet.</p>
    </div>
  );
}

export default function RecentActivity({ notifications = [] }) {
  return (
    <section className="dashboard-panel activity-panel">
      <div className="dashboard-panel-heading">
        <h2 className="text-lg font-semibold text-slate-900">Activity Overview</h2>
        <a href="/notifications" className="dashboard-view-link">View all</a>
      </div>
      <div className="dashboard-chart" aria-hidden="true">
        <div className="dashboard-chart-scale"><span>6</span><span>4</span><span>2</span><span>0</span></div>
        <svg viewBox="0 0 640 180" preserveAspectRatio="none" role="presentation">
          <defs>
            <linearGradient id="activity-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#3048d8" stopOpacity=".18" />
              <stop offset="1" stopColor="#3048d8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="dashboard-chart-area" d="M0 132 C26 135 37 120 54 125 S78 96 96 120 S121 136 139 96 S167 116 188 105 S214 152 239 140 S265 111 281 119 S310 145 329 130 S353 68 371 91 S396 137 421 124 S449 101 467 122 S493 133 516 116 S548 104 565 110 S602 100 640 93 V180 H0 Z" />
          <path className="dashboard-chart-line" d="M0 132 C26 135 37 120 54 125 S78 96 96 120 S121 136 139 96 S167 116 188 105 S214 152 239 140 S265 111 281 119 S310 145 329 130 S353 68 371 91 S396 137 421 124 S449 101 467 122 S493 133 516 116 S548 104 565 110 S602 100 640 93" />
          <circle cx="371" cy="91" r="4" className="dashboard-chart-dot" />
        </svg>
        <div className="dashboard-chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      </div>
      <div className="dashboard-activity-list">
        <div className="dashboard-subheading">Recent updates</div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          notifications.map((n) => <ActivityRow key={n.id} notification={n} />)
        )}
        </div>
      </div>
    </section>
  );
}