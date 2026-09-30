// src/components/dashboard/SuggestedDevelopers.jsx
<<<<<<< Updated upstream
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
=======
// Props unchanged: { developers }, sendConnectionRequest wiring unchanged

import { useState } from 'react';
import { Users, Check, Loader2 } from 'lucide-react';

const AVATAR_TINTS = [
  'bg-indigo-50 text-indigo-600',
  'bg-violet-50 text-violet-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600',
];

function tintFor(id) {
  if (!id) return AVATAR_TINTS[0];
  const sum = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

function Avatar({ initials, avatarUrl, seed }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <div className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full text-sm font-semibold ${tintFor(seed)}`}>
      {initials}
    </div>
  );
}

function DeveloperCard({ developer }) {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  async function handleConnect() {
    setStatus('sending');
    try {
      const { sendConnectionRequest } = await import('../../api/dashboardApi');
      await sendConnectionRequest(developer.userId);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <Avatar initials={developer.initials} avatarUrl={developer.avatarUrl} seed={developer.id} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{developer.name}</p>
          <p className="truncate text-xs text-slate-400">@{developer.username}</p>
        </div>
        {developer.experienceLevel && (
          <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
            {developer.experienceLevel}
          </span>
        )}
      </div>

      {developer.bio && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{developer.bio}</p>
      )}

      {developer.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {developer.skills.slice(0, 3).map((skill) => (
            <span
              key={skill.id}
              className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500"
            >
              {skill.name}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={status === 'sending' || status === 'sent'}
        className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors ${
          status === 'sent'
            ? 'bg-emerald-50 text-emerald-600'
            : status === 'error'
            ? 'bg-rose-50 text-rose-600'
            : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-70'
        }`}
      >
        {status === 'sending' && <Loader2 size={14} className="animate-spin" />}
        {status === 'sent' && <Check size={14} />}
        {status === 'sending' && 'Sending…'}
        {status === 'sent' && 'Request sent'}
        {status === 'error' && 'Failed — retry'}
        {status === 'idle' && 'Connect'}
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
        <Users size={20} className="text-slate-300" />
      </div>
      <p className="text-sm text-slate-500">No suggestions yet.</p>
      <p className="mt-1 text-xs text-slate-400">
        Complete your profile to get matched with developers.
      </p>
    </div>
  );
}

export default function SuggestedDevelopers({
  developers = [],
  title = 'Suggested Developers',
  showViewAll = true,
  className = 'dashboard-panel developers-panel',
  gridClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-2',
}) {
  return (
    <section className={className}>
      <div className="dashboard-panel-heading">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {showViewAll && developers.length > 0 && (
          <a href="/discover/developers" className="dashboard-view-link">
            View all
          </a>
        )}
      </div>

      {developers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={gridClassName}>
          {developers.map((dev) => (
            <DeveloperCard key={dev.id} developer={dev} />
          ))}
        </div>
      )}
    </section>
  );
>>>>>>> Stashed changes
}