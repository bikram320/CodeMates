/**
 * SuggestedDevelopers
 *
 * Grid of developer cards suggested by the discovery service's ML match scores.
 * Driven by MatchScoreResponseDto[] from /api/discovery/match-scores/top.
 *
 * Note from API docs: the ML scoring model doesn't exist yet — the plumbing is
 * there but scores may be empty until the offline job runs. The mock fills this in.
 *
 * The Connect button uses local state only for now.
 * Wire it to POST /api/connections/request when the connection service is ready.
 *
 * Props:
 *   developers {Array} - from data.suggestedDevelopers (MatchScoreResponseDto + profile fields)
 *     .id           {string}
 *     .name         {string}
 *     .username     {string}
 *     .initials     {string}
 *     .avatarUrl    {string|null}
 *     .bio          {string}
 *     .skills       {Array}    [{ skillName, proficiencyLevel }]
 *     .matchScore   {number}   0-100 (totalMatchScore from API)
 *     .isConnected  {boolean}
 *     .experienceLevel {string}
 */

import { useState } from 'react';
import { Users, Zap } from 'lucide-react';

// Match score colour thresholds
function getScoreColor(score) {
  if (score >= 90) return '#10B981';  // green
  if (score >= 75) return '#6C7BFF';  // indigo
  return '#A7A3D6';                   // muted
}

function Avatar({ initials, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className="w-10 h-10 rounded-full border border-[#2E2A66] object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#1D1A40] border border-[#2E2A66] flex items-center justify-center text-sm font-bold text-[#6C7BFF] shrink-0 select-none">
      {initials}
    </div>
  );
}

function DeveloperCard({ developer }) {
  const [connected, setConnected] = useState(developer.isConnected);
  const scoreColor = getScoreColor(developer.matchScore);

  // Show first 3 skills; note remaining count
  const visibleSkills = developer.skills.slice(0, 3);
  const remaining = developer.skills.length - visibleSkills.length;

  return (
    <div className="card-hover p-4">
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar initials={developer.initials} avatarUrl={developer.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#F5F5F5] truncate">
              {developer.name}
            </p>
            {developer.matchScore > 0 && (
              <span
                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0"
                style={{
                  color: scoreColor,
                  backgroundColor: `${scoreColor}18`,
                }}
              >
                {developer.matchScore}% match
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#6B6890] font-mono mt-0.5">
            @{developer.username}
          </p>
        </div>
      </div>

      {/* Bio */}
      {developer.bio && (
        <p className="text-xs text-[#8B86B8] leading-relaxed mb-3 line-clamp-2">
          {developer.bio}
        </p>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {visibleSkills.map((skill) => (
          <span
            key={skill.skillName}
            className="text-[10px] font-mono text-[#C9A8FF] border border-[#2E2A66] px-1.5 py-0.5 rounded"
          >
            {skill.skillName}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] text-[#4A4660] self-center">
            +{remaining} more
          </span>
        )}
      </div>

      {/* Connect button */}
      <button
        onClick={() => setConnected((prev) => !prev)}
        className={`w-full text-xs py-2 rounded-lg border transition-colors duration-150 ${
          connected
            ? 'border-[#26224A] text-[#6B6890] cursor-default'
            : 'border-[#2E2A66] text-[#C9A8FF] hover:border-[#6C7BFF] hover:text-[#F5F5F5]'
        }`}
      >
        {connected ? 'Connected ✓' : 'Connect'}
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-8 text-center">
      <div className="w-10 h-10 rounded-lg bg-[#1D1A40] flex items-center justify-center mx-auto mb-3">
        <Users size={18} className="text-[#2E2A66]" />
      </div>
      <p className="text-xs text-[#6B6890]">No suggestions yet.</p>
      <p className="text-[10px] text-[#4A4660] mt-1">
        Complete your profile to get matched with developers.
      </p>
    </div>
  );
}

export default function SuggestedDevelopers({ developers }) {
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#F5F5F5]">Suggested Developers</h2>
          {/* AI badge — the match scoring is an ML feature */}
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#C9A8FF] border border-[#2E2A66] px-1.5 py-0.5 rounded">
            <Zap size={9} />
            AI
          </span>
        </div>
        {developers?.length > 0 && (
          <a
            href="/discover/developers"
            className="text-xs text-[#6C7BFF] hover:text-[#C9A8FF] transition-colors"
          >
            Browse all →
          </a>
        )}
      </div>

      {!developers?.length ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {developers.map((dev) => (
            <DeveloperCard key={dev.id} developer={dev} />
          ))}
        </div>
      )}
    </section>
  );
}