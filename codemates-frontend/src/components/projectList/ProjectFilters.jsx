/**
 * ProjectFilters
 *
 * Filter and sort bar for the My Projects page.
 * Distinct from TaskFilters (which handles Kanban task filtering).
 *
 * Props:
 *   search           {string}
 *   onSearchChange   {fn}
 *   statusFilter     {string}   '' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
 *   onStatusChange   {fn}
 *   typeFilter       {string}   '' | 'OPEN_SOURCE' | 'STARTUP' | 'HACKATHON' | 'LEARNING' | 'PERSONAL'
 *   onTypeChange     {fn}
 *   roleFilter       {string}   '' | 'LEADER' | 'CONTRIBUTOR' | 'REVIEWER'
 *   onRoleChange     {fn}
 *   sortBy           {string}   'lastActivity' | 'name' | 'progress' | 'members'
 *   onSortChange     {fn}
 */

import { Search, X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'ACTIVE',    label: 'Active'       },
  { value: 'PAUSED',    label: 'Paused'       },
  { value: 'COMPLETED', label: 'Completed'    },
  { value: 'ARCHIVED',  label: 'Archived'     },
];

const TYPE_OPTIONS = [
  { value: '',            label: 'All Types'   },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
  { value: 'STARTUP',     label: 'Startup'     },
  { value: 'HACKATHON',   label: 'Hackathon'   },
  { value: 'LEARNING',    label: 'Learning'    },
  { value: 'PERSONAL',    label: 'Personal'    },
];

const ROLE_OPTIONS = [
  { value: '',            label: 'All Roles'   },
  { value: 'LEADER',      label: 'Leader'      },
  { value: 'CONTRIBUTOR', label: 'Contributor' },
  { value: 'REVIEWER',    label: 'Reviewer'    },
];

const SORT_OPTIONS = [
  { value: 'lastActivity', label: 'Last Activity' },
  { value: 'name',         label: 'Name A–Z'      },
  { value: 'progress',     label: 'Progress'      },
  { value: 'members',      label: 'Team Size'     },
];

const SELECT_CLASS =
  'bg-[#121029] border border-[#26224A] text-[#F5F5F5] text-sm ' +
  'px-3 py-2 rounded-lg outline-none focus:border-[#6C7BFF] ' +
  'transition-colors cursor-pointer appearance-none pr-7';

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
      {/* Chevron */}
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6890]">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export default function ProjectFilters({
  search, onSearchChange,
  statusFilter, onStatusChange,
  typeFilter, onTypeChange,
  roleFilter, onRoleChange,
  sortBy, onSortChange,
}) {
  const hasFilters = search || statusFilter || typeFilter || roleFilter;

  function clearAll() {
    onSearchChange('');
    onStatusChange('');
    onTypeChange('');
    onRoleChange('');
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: '#6C7BFF' }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects, tech stack…"
          className="w-full bg-[#121029] border border-[#26224A] text-[#F5F5F5]
                     text-sm pl-9 pr-8 py-2 rounded-lg placeholder-[#4A4660]
                     outline-none focus:border-[#6C7BFF] transition-colors"
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

      {/* Status */}
      <SelectField
        value={statusFilter}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
      />

      {/* Type */}
      <SelectField
        value={typeFilter}
        onChange={onTypeChange}
        options={TYPE_OPTIONS}
      />

      {/* Role */}
      <SelectField
        value={roleFilter}
        onChange={onRoleChange}
        options={ROLE_OPTIONS}
      />

      {/* Sort */}
      <div className="relative ml-auto">
        <SelectField
          value={sortBy}
          onChange={onSortChange}
          options={SORT_OPTIONS}
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-[#A7A3D6]
                     hover:text-[#F5F5F5] transition-colors px-1 py-2"
        >
          <X size={13} />
          Clear
        </button>
      )}
    </div>
  );
}