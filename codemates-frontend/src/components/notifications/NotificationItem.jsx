import {
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  FolderPlus,
  GitBranch,
  Mail,
  MessageSquare,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserMinus,
} from "lucide-react";

const INDIGO = "#6C7BFF";
const LAVENDER = "#C9A8FF";

/**
 * Presentation config per notification `type`. Keys are exactly the
 * NotificationType constants the backend defines (notification-service) —
 * nothing here is invented or UI-only.
 * `category` drives the filter chips in NotificationFilters.
 */
export const NOTIFICATION_TYPES = {
  PROJECT_INVITATION: { label: "Project invitation", icon: Mail, category: "projects", accent: LAVENDER },
  PROJECT_MEMBER_JOINED: { label: "Invitation accepted", icon: UserCheck, category: "projects", accent: INDIGO },
  PROJECT_CREATED: { label: "Project activity", icon: FolderPlus, category: "projects", accent: INDIGO },
  PROJECT_MEMBER_REMOVED: { label: "Project activity", icon: UserMinus, category: "projects", accent: LAVENDER },
  TASK_CREATED: { label: "New task", icon: ClipboardList, category: "tasks", accent: INDIGO },
  TASK_ASSIGNED: { label: "Task assignment", icon: ClipboardList, category: "tasks", accent: LAVENDER },
  TASK_STATUS_CHANGED: { label: "Task update", icon: RefreshCw, category: "tasks", accent: INDIGO },
  TASK_COMPLETED: { label: "Task update", icon: CheckCircle2, category: "tasks", accent: INDIGO },
  MESSAGE_RECEIVED: { label: "Project message", icon: MessageSquare, category: "messages", accent: INDIGO },
  GITHUB_SYNC_COMPLETED: { label: "GitHub activity", icon: GitBranch, category: "github", accent: INDIGO },
  WELCOME: { label: "Welcome", icon: Sparkles, category: "general", accent: LAVENDER },
};

const FALLBACK = { label: "Notification", icon: Bell, category: "general", accent: INDIGO };

export const getNotificationMeta = (type) => NOTIFICATION_TYPES[type] ?? FALLBACK;

/** "Just now" · "12m ago" · "3h ago" · "2d ago" · "Sep 12" */
export function formatRelativeTime(iso) {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  if (diffMin < 10080) return `${Math.floor(diffMin / 1440)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationItem({ notification, onMarkAsRead }) {
  const { id, type, title, body, isRead, createdAt } = notification;
  const { label, icon: Icon, accent } = getNotificationMeta(type);

  return (
  <li className="group flex items-center gap-3 bg-white px-4 py-3 transition-colors hover:bg-gray-50">
    {/* Unread dot */}
    <span
      aria-hidden="true"
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: isRead ? "transparent" : "#3B82F6" }}
    />

    <Icon size={16} aria-hidden="true" className="shrink-0" style={{ color: accent, opacity: isRead ? 0.6 : 1 }} />

    <div className="min-w-0 flex-1">
      <p className="truncate text-xs text-gray-500">{label}</p>
      <h3
        className={`truncate text-sm leading-snug ${
          isRead ? "font-normal text-gray-600" : "font-semibold text-gray-900"
        }`}
      >
        {!isRead && <span className="sr-only">Unread: </span>}
        {title}
      </h3>
      <p className="truncate text-xs text-gray-500">{body}</p>
    </div>

    <span className="hidden shrink-0 rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 sm:inline-block">
      {label}
    </span>

    <div className="flex w-28 shrink-0 justify-end">
      {isRead ? (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Check size={12} aria-hidden="true" />
          Read
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onMarkAsRead(id)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs
                     font-medium text-gray-800 transition-colors duration-150 hover:bg-gray-50
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <Check size={12} aria-hidden="true" />
          Mark as read
        </button>
      )}
    </div>

    <time
      dateTime={createdAt}
      title={new Date(createdAt).toLocaleString()}
      className="w-20 shrink-0 text-right text-xs text-gray-500"
    >
      {formatRelativeTime(createdAt)}
    </time>
  </li>
);
}