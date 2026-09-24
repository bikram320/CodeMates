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
    <li
      className={`flex items-start gap-3 border-l-2 px-4 py-4 transition-colors sm:gap-4 sm:px-5 ${
        isRead ? "border-l-transparent" : "border-l-[#6C7BFF] bg-[#6C7BFF]/[0.06]"
      }`}
    >
      <div
        aria-hidden="true"
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1F`, color: accent, opacity: isRead ? 0.7 : 1 }}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`text-sm leading-snug ${
              isRead ? "font-medium text-[#A9A6C8]" : "font-semibold text-[#F5F5F5]"
            }`}
          >
            {!isRead && <span className="sr-only">Unread: </span>}
            {title}
          </h3>
          <time
            dateTime={createdAt}
            title={new Date(createdAt).toLocaleString()}
            className="shrink-0 pt-px text-xs text-[#6B6890]"
          >
            {formatRelativeTime(createdAt)}
          </time>
        </div>

        <p className={`mt-1 break-words text-sm leading-relaxed ${isRead ? "text-[#8B86B8]" : "text-[#A9A6C8]"}`}>
          {body}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            className="rounded-md border px-2 py-0.5 text-[11px] font-medium"
            style={{ borderColor: `${accent}40`, color: accent }}
          >
            {label}
          </span>

          {isRead ? (
            <span className="inline-flex items-center gap-1 text-xs text-[#6B6890]">
              <Check size={12} aria-hidden="true" />
              Read
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onMarkAsRead(id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E2A66] px-2.5 py-1 text-xs font-medium
                         text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              <Check size={12} aria-hidden="true" />
              Mark as read
            </button>
          )}
        </div>
      </div>
    </li>
  );
}