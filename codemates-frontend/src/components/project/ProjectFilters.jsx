/**
 * ProjectFilters
 *
 * Filter bar for the My Projects page.
 * Adapted for real ProjectResponse fields — type and role filters removed
 * because those fields don't exist in ProjectResponse.
 *
 * Available filters (all client-side — /api/projects/my returns everything):
 *   Search     → matches name, description, techStack string
 *   Status     → ACTIVE | COMPLETED | ARCHIVED
 *   Visibility → PUBLIC | PRIVATE
 *   Sort by    → createdAt (default) | name | memberCount
 *
 * Props:
 *   search            {string}
 *   onSearchChange    {fn}
 *   statusFilter      {string}   '' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
 *   onStatusChange    {fn}
 *   visibilityFilter  {string}   '' | 'PUBLIC' | 'PRIVATE'
 *   onVisibilityChange {fn}
 *   sortBy            {string}   'createdAt' | 'name' | 'memberCount'
 *   onSortChange      {fn}
 */

import { Search, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'ACTIVE',    label: 'Active'       },
  { value: 'COMPLETED', label: 'Completed'    },
  { value: 'ARCHIVED',  label: 'Archived'     },
];

const VISIBILITY_OPTIONS = [
  { value: '',        label: 'All'     },
  { value: 'PUBLIC',  label: 'Public'  },
  { value: 'PRIVATE', label: 'Private' },
];

const SORT_OPTIONS = [
  { value: 'createdAt',   label: 'Date Created' },
  { value: 'name',        label: 'Name A–Z'     },
  { value: 'memberCount', label: 'Team Size'     },
];

const SELECT_CLASS =
  'bg-[#121029] border border-[#26224A] text-[#F5F5F5] text-sm ' +
  'px-3 py-2 rounded-lg outline-none focus:border-[#6C7BFF] ' +
  'transition-colors cursor-pointer appearance-none pr-7';

function Chevron() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6890]">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Chevron />
    </div>
  );
}

export default function ProjectFilters({
  search,           onSearchChange,
  statusFilter,     onStatusChange,
  visibilityFilter, onVisibilityChange,
  sortBy,           onSortChange,
}) {
  const hasFilters = search || statusFilter || visibilityFilter;

  function clearAll() {
    onSearchChange('');
    onStatusChange('');
    onVisibilityChange('');
  }

  return (
  <div className="flex items-center gap-3 w-full">
    {/* Search — fills all remaining space (max-w-xs removed) */}
    <div className="relative flex-1 min-w-[180px]">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: '#6C7BFF' }}
      />
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search name, tech stack…"
        className="w-full bg-[#121029] border border-[#26224A] text-[#F5F5F5]
                   text-sm pl-9 pr-8 py-2 rounded-lg placeholder-[#4A4660]
                   outline-none focus:border-[#6C7BFF] transition-colors"
      />
      {search && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2
                     text-[#6B6890] hover:text-[#F5F5F5]"
        >
          <X size={13} />
        </button>
      )}
    </div>

    {/* All filter controls grouped on the right */}
    <div className="flex items-center gap-3 shrink-0 ml-auto">
      <SelectField value={statusFilter} onChange={onStatusChange} options={STATUS_OPTIONS} />
      <SelectField value={visibilityFilter} onChange={onVisibilityChange} options={VISIBILITY_OPTIONS} />
      <SelectField value={sortBy} onChange={onSortChange} options={SORT_OPTIONS} />

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-[#A7A3D6]
                     hover:text-[#F5F5F5] transition-colors py-2 px-1"
        >
          <X size={13} />
          Clear
        </button>
      )}
    </div>
  </div>
);
}