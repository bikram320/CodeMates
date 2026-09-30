// src/components/dashboard/SuggestedDevelopers.jsx
import { Link } from 'react-router-dom';
import Avatar from 'src/components/ui/Avatar'; // adjust if your Avatar lives elsewhere

export default function SuggestedDevelopers({ developers = [] }) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Suggested Developers</h2>
            <div className="grid grid-cols-2 gap-4">
                {developers.map((d) => (
                    <div key={d.id} className="card p-4 space-y-3">
                        <Link
                            to={`/discover/developers/${d.username}`}
                            className="flex items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--cm-indigo)]"
                        >
                            {/* Passing the username (no spaces) gives just its first letter */}
                            <Avatar name={d.username} src={d.avatarUrl} size={40} />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#F5F5F5] truncate hover:underline">
                                    {d.fullName}
                                </p>
                                <p className="text-xs text-[#8B86B8] truncate">@{d.username}</p>
                            </div>
                        </Link>
                        {d.bio && <p className="text-xs text-[#8B86B8] line-clamp-2">{d.bio}</p>}
                        <div className="flex gap-1 flex-wrap">
                            {(d.skills ?? []).slice(0, 2).map((s) => (
                                <span key={s.id} className="text-[11px] px-2 py-0.5 rounded bg-[#1D1A40] text-[#8B86B8]">
                  {s.name}
                </span>
                            ))}
                        </div>
                        <button type="button" className="btn-primary w-full text-sm">
                            Connect
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}