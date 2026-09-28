// src/components/dashboard/SuggestedDevelopers.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Same idea as the initials-fallback Avatar in Navbar.jsx: try the real
// image first, and if it 404s / never had one, fall back to initials
// instead of a broken-image icon.
function DevAvatar({ name, avatarUrl, size = 40 }) {
    const [failed, setFailed] = useState(false);
    const initials = (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');

    if (avatarUrl && !failed) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                onError={() => setFailed(true)}
                className="rounded-full object-cover shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            style={{ width: size, height: size }}
            className="inline-flex items-center justify-center rounded-full bg-[#1D1A40] text-sm font-medium text-[#C9A8FF] shrink-0"
        >
      {initials || '?'}
    </span>
    );
}

export default function SuggestedDevelopers({ developers = [] }) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">Suggested Developers</h2>
            <div className="grid grid-cols-2 gap-4">
                {developers.map((d) => (
                    <div key={d.id} className="card p-4 space-y-3">
                        {/* TODO: confirm the real profile route - assuming
                /discover/developers/:username for now. Swap the `to`
                below once you confirm it against your router. */}
                        <Link to={`/discover/developers/${d.username}`} className="flex items-center gap-3">
                            <DevAvatar name={d.fullName || d.username} avatarUrl={d.avatarUrl} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[#F5F5F5] truncate">{d.fullName}</p>
                                <p className="text-xs text-[#8B86B8] truncate">@{d.username}</p>
                            </div>
                            {typeof d.matchScore === 'number' && (
                                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#6C7BFF]/10 text-[#6C7BFF] shrink-0">
                  {Math.round(d.matchScore)}% match
                </span>
                            )}
                        </Link>
                        {d.bio && <p className="text-xs text-[#8B86B8] line-clamp-2">{d.bio}</p>}
                        <div className="flex gap-1 flex-wrap">
                            {(d.skills ?? []).slice(0, 2).map((s) => (
                                <span key={s.id} className="text-[11px] px-2 py-0.5 rounded bg-[#1D1A40] text-[#8B86B8]">
                  {s.name}
                </span>
                            ))}
                        </div>
                        <Link to={`/discover/developers/${d.username}`} className="btn-primary w-full text-sm block text-center">
                            Connect
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}