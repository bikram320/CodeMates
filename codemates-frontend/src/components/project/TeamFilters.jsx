/**
 * TeamFilters
 *
 * Search box + role filter pills for the Project Team page.
 * Fully controlled — the page owns the state.
 *
 * Props:
 *   search           {string}
 *   onSearchChange   {fn}      (value)
 *   role             {string}  'ALL' | LEADER | CONTRIBUTOR | REVIEWER
 *   onRoleChange     {fn}      (role)
 *   counts           {object}  { ALL, LEADER, CONTRIBUTOR, REVIEWER }
 */

import { Search, X } from 'lucide-react';
import { ROLES, ROLE_META } from './TeamMemberCard';

const OPTIONS = [{ value: 'ALL', label: 'All' }].concat(
  ROLES.map((r) => ({ value: r, label: ROLE_META[r].label }))
);

export default function TeamFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  counts = {},
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:max-w-sm">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890]"
        />
        <input
          type="text"
          inputMode="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, username or skill"
          aria-label="Search team members"
          className="w-full rounded-lg border border-[#1C1A38] bg-[#0A0918] py-2.5 pl-9 pr-9
                     text-base text-[#F5F5F5] placeholder:text-[#6B6890] sm:text-sm
                     transition-colors hover:border-[#2E2A66]
                     focus:border-[#6C7BFF] focus:outline-none focus:ring-2 focus:ring-[#6C7BFF]/30"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center
                       rounded text-[#6B6890] transition-colors hover:text-[#F5F5F5]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Role pills ────────────────────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Filter by role"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:px-0 lg:pb-0"
      >
        {OPTIONS.map(({ value, label }) => {
          const active = role === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onRoleChange(value)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium
                          transition-colors duration-150
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60
                          ${
                            active
                              ? 'border-[#6C7BFF] bg-[#6C7BFF]/15 text-[#F5F5F5]'
                              : 'border-[#1C1A38] bg-[#0A0918] text-[#8B88AE] hover:border-[#2E2A66] hover:text-[#F5F5F5]'
                          }`}
            >
              {label}
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  active ? 'bg-[#6C7BFF]/25 text-[#C9A8FF]' : 'bg-[#1D1A40] text-[#6B6890]'
                }`}
              >
                {counts[value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}