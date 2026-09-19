/**
 * TeamMemberList
 *
 * Responsive grid of TeamMemberCards, plus the two empty states:
 *   - the project has no members at all
 *   - search / role filter matched nobody
 *
 * Props:
 *   members            {Array}    Already filtered + sorted members to render
 *   totalCount         {number}   Members on the project before filtering
 *   hasActiveFilters   {boolean}  Search text or a role filter is applied
 *   currentUserId      {string}   Id of the viewer (gets a "you" tag)
 *   canManage          {boolean}  Viewer can change roles / remove members
 *   leaderCount        {number}   Used to lock the last remaining leader
 *   onChangeRole       {fn}       (memberId, newRole)
 *   onRemove           {fn}       (member)
 *   onInvite           {fn}       Opens the invite modal
 *   onClearFilters     {fn}       Resets search + role filter
 */

import { SearchX, UserPlus, Users } from 'lucide-react';

import EmptyState from '../ui/EmptyState';
import TeamMemberCard from './TeamMemberCard';

const secondaryButton =
  'inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium ' +
  'text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60';

export default function TeamMemberList({
  members,
  totalCount,
  hasActiveFilters,
  currentUserId,
  canManage,
  leaderCount,
  onChangeRole,
  onRemove,
  onInvite,
  onClearFilters,
}) {
  /* Project has nobody on it */
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center">
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Invite developers to start building this project together."
        />
        {canManage && (
          <button type="button" onClick={onInvite} className={secondaryButton}>
            <UserPlus size={15} />
            Invite member
          </button>
        )}
      </div>
    );
  }

  /* Filters hid everyone */
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center">
        <EmptyState
          icon={SearchX}
          title="No members match"
          description="Try a different name, username or skill, or pick another role."
        />
        {hasActiveFilters && (
          <button type="button" onClick={onClearFilters} className={secondaryButton}>
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <section aria-label="Project team members">
      <p className="mb-3 font-mono text-xs text-[#6B6890]" aria-live="polite">
        Showing {members.length} of {totalCount}{' '}
        {totalCount === 1 ? 'member' : 'members'}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            isCurrentUser={member.id === currentUserId}
            canManage={canManage}
            isLastLeader={member.role === 'LEADER' && leaderCount <= 1}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}