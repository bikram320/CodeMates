// src/components/dashboard/SuggestedDevelopers.jsx
export default function SuggestedDevelopers({ developers = [] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#F5F5F5]">Suggested Developers</h2>
      <div className="grid grid-cols-2 gap-4">
        {developers.map((d) => (
          <div key={d.id} className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={d.avatarUrl || '/default-avatar.png'}
                alt={d.username}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#F5F5F5] truncate">{d.fullName}</p>
                <p className="text-xs text-[#8B86B8] truncate">@{d.username}</p>
              </div>
            </div>
            {d.bio && <p className="text-xs text-[#8B86B8] line-clamp-2">{d.bio}</p>}
            <div className="flex gap-1 flex-wrap">
              {(d.skills ?? []).slice(0, 2).map((s) => (
                <span key={s.id} className="text-[11px] px-2 py-0.5 rounded bg-[#1D1A40] text-[#8B86B8]">
                  {s.name}
                </span>
              ))}
            </div>
            <button className="btn-primary w-full text-sm">Connect</button>
          </div>
        ))}
      </div>
    </div>
  );
}