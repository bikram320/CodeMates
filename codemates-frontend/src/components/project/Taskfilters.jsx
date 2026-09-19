/**
 * TaskFilters
 *
 * Filter bar rendered above the Kanban board.
 * Contains: search input, priority select, assignee select, and a clear-all button.
 *
 * Props:
 *   search           {string}
 *   onSearchChange   {fn}
 *   priorityFilter   {string}   '' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
 *   onPriorityChange {fn}
 *   assigneeFilter   {string}   '' | userId
 *   onAssigneeChange {fn}
 *   members          {Array}    project members for the assignee dropdown
 *   totalCount       {number}   total tasks (before filter)
 *   filteredCount    {number}   tasks after filter
 */

import { Search, X } from 'lucide-react';

const PRIORITIES = [
  { value: '',       label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent'  },
  { value: 'HIGH',   label: 'High'    },
  { value: 'MEDIUM', label: 'Medium'  },
  { value: 'LOW',    label: 'Low'     },
];

const SELECT_BASE =
  'bg-[#121029] border border-[#26224A] text-[#F5F5F5] text-sm px-3 py-2 rounded-lg ' +
  'outline-none focus:border-[#6C7BFF] transition-colors cursor-pointer ' +
  'appearance-none pr-8';

// Simple custom select wrapper so we can keep a consistent look
function FilterSelect({ value, onChange, children, className = '' }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${SELECT_BASE} ${className}`}
      >
        {children}
      </select>
      {/* Chevron */}
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6890]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export default function TaskFilters({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  members = [],
  totalCount,
  filteredCount,
}) {
  const hasFilters = search || priorityFilter || assigneeFilter;

  function clearAll() {
    onSearchChange('');
    onPriorityChange('');
    onAssigneeChange('');
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
          placeholder="Search tasks…"
          className="w-full bg-[#121029] border border-[#26224A] text-[#F5F5F5] text-sm
                     pl-9 pr-3 py-2 rounded-lg placeholder-[#4A4660] outline-none
                     focus:border-[#6C7BFF] transition-colors"
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

      {/* Priority filter */}
      <FilterSelect value={priorityFilter} onChange={onPriorityChange}>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </FilterSelect>

      {/* Assignee filter */}
      <FilterSelect value={assigneeFilter} onChange={onAssigneeChange}>
        <option value="">All Members</option>
        <option value="__unassigned__">Unassigned</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>{m.fullName}</option>
        ))}
      </FilterSelect>

      {/* Clear all — only visible when a filter is active */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-[#A7A3D6] hover:text-[#F5F5F5] transition-colors px-2 py-2"
        >
          <X size={13} />
          Clear
        </button>
      )}

      {/* Result count — shows when filtered */}
      {hasFilters && typeof filteredCount === 'number' && (
        <span className="text-xs text-[#6B6890] ml-auto">
          {filteredCount} of {totalCount} task{totalCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}