// src/components/dashboard/RecentActivity.jsx
export default function RecentActivity({ notifications = [] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#F5F5F5]">Recent Activity</h2>
      <div className="card px-4 py-2">
        {notifications.length === 0 && (
          <p className="text-sm text-[#8B86B8] py-6 text-center">Nothing new yet.</p>
        )}
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 py-3 border-b border-[#26224A] last:border-0">
            <span
              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
              style={{ background: n.isRead ? '#3A3660' : '#7C6CF6' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#F5F5F5] truncate">{n.title}</p>
              {n.body && <p className="text-xs text-[#8B86B8] mt-0.5 line-clamp-2">{n.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}