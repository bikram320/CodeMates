import { Search, X } from 'lucide-react';
import { ROLES, ROLE_META } from './TeamMemberCard';

/**
 * Filter bar for the Project Team page.
 *
 * There's no name/username/skills data to search on (see the note in
 * TeamMemberCard.jsx), so search here matches against the member's
 * userId instead — the only field actually available to filter by.
 *
 * Props:
 *   search        {string}
 *   onSearchChange {fn}
 *   role          {string}  'ALL' | 'LEADER' | 'CONTRIBUTOR' | 'REVIEWER'
 *   onRoleChange  {fn}
 *   counts        {object}  { ALL, LEADER, CONTRIBUTOR, REVIEWER }
 */
export default function TeamFilters({ search, onSearchChange, role, onRoleChange, counts }) {
    const chips = [{ value: 'ALL', label: 'All' }, ...ROLES.map((r) => ({ value: r, label: ROLE_META[r].label }))];

    return (
        <div className="flex flex-col gap-3">
            <div className="relative max-w-xs">
                <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#6C7BFF' }}
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by name or username…"
                    className="w-full rounded-lg border border-[#26224A] bg-[#121029] py-2 pl-9 pr-3 text-sm
                     text-[#F5F5F5] placeholder-[#4A4660] outline-none transition-colors
                     focus:border-[#6C7BFF]"
                />
                {search && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6890] hover:text-[#F5F5F5]"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {chips.map((chip) => {
                    const active = role === chip.value;
                    return (
                        <button
                            key={chip.value}
                            type="button"
                            onClick={() => onRoleChange(chip.value)}
                            aria-pressed={active}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                active
                                    ? 'border-[#6C7BFF] bg-[#6C7BFF]/10 text-[#8E9BFF]'
                                    : 'border-[#26224A] text-[#8B88AE] hover:border-[#2E2A66] hover:text-[#F5F5F5]'
                            }`}
                        >
                            {chip.label} ({counts[chip.value] ?? 0})
                        </button>
                    );
                })}
            </div>
        </div>
    );
}