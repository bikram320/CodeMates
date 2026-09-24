/**
 * RecentActivity
 *
 * Reverse-chronological activity feed driven by NotificationResponse[].
 * Each notification type maps to a different icon and accent colour.
 *
 * Notification types (from NotificationType enum in API docs):
 *   GITHUB_SYNC_COMPLETED → commit
 *   TASK_COMPLETED         → task_completed
 *   PROJECT_MEMBER_JOINED  → member_joined
 *   PROJECT_INVITATION     → member_joined
 *   MESSAGE_RECEIVED       → comment
 *   PROJECT_CREATED        → project_created
 *   (everything else)      → comment
 *
 * Props:
 *   activities {Array} - from data.recentActivity (NotificationResponse shape)
 *     .id           {string}
 *     .type         {string}   mapped type string (see dashboardApi normalizeNotification)
 *     .message      {string}
 *     .actor        {string}   username of person who triggered the event
 *     .actorInitials{string}
 *     .project      {string}   project name
 *     .projectId    {string}
 *     .timestamp    {string}   relative time string
 *     .isRead       {boolean}
 */

import {
  GitBranch,
  CheckSquare,
  UserPlus,
  GitMerge,
  MessageSquare,
  FolderPlus,
  Activity,
} from 'lucide-react';

const ACTIVITY_CONFIG = {
  commit: {
    Icon: GitBranch,
    color: '#6C7BFF',
    bg: 'rgba(108, 123, 255, 0.1)',
  },
  task_completed: {
    Icon: CheckSquare,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
  task_assigned: {
    Icon: CheckSquare,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  member_joined: {
    Icon: UserPlus,
    color: '#C9A8FF',
    bg: 'rgba(201, 168, 255, 0.1)',
  },
  pr_merged: {
    Icon: GitMerge,
    color: '#6C7BFF',
    bg: 'rgba(108, 123, 255, 0.1)',
  },
  comment: {
    Icon: MessageSquare,
    color: '#A7A3D6',
    bg: 'rgba(167, 163, 214, 0.1)',
  },
  project_created: {
    Icon: FolderPlus,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
};

function ActivityItem({ activity }) {
  const config = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.comment;
  const { Icon, color, bg } = config;

  // Strip actor from start of message to avoid "alexkim alexkim pushed…"
  const messageBody =
    activity.actor && activity.message.startsWith(activity.actor)
      ? activity.message.slice(activity.actor.length).trim()
      : activity.message;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#26224A] last:border-0">
      {/* Type icon */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: bg }}
      >
        <Icon size={13} style={{ color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#A7A3D6] leading-snug">
          {activity.actor && (
            <span className="text-[#F5F5F5] font-medium">{activity.actor} </span>
          )}
          {messageBody}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {activity.project && (
            <>
              <span className="text-[10px] font-mono text-[#C9A8FF] truncate max-w-[120px]">
                {activity.project}
              </span>
              <span className="text-[#2E2A66]">·</span>
            </>
          )}
          <span className="text-[10px] text-[#4A4660]">{activity.timestamp}</span>
        </div>
      </div>

      {/* Unread indicator */}
      {activity.isRead === false && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#6C7BFF] shrink-0 mt-2" />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-8 text-center">
      <div className="w-10 h-10 rounded-lg bg-[#1D1A40] flex items-center justify-center mx-auto mb-3">
        <Activity size={18} className="text-[#2E2A66]" />
      </div>
      <p className="text-xs text-[#6B6890]">No recent activity.</p>
      <p className="text-[10px] text-[#4A4660] mt-1">
        Start or join a project to see activity here.
      </p>
    </div>
  );
}

export default function RecentActivity({ activities }) {
  return (
    <section>
      <h2 className="page-section-heading mb-4">Recent Activity</h2>

      {!activities?.length ? (
        <EmptyState />
      ) : (
        <div className="card px-4 py-1">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </section>
  );
}