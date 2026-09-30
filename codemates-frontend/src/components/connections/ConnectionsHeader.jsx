/**
 * Hero for the Connections page: title/description plus a quick count of
 * connections and pending requests.
 *
 * Props:
 * - totalConnections  number
 * - pendingCount      number
 */
import { Users } from 'lucide-react';

export default function ConnectionsHeader({ totalConnections = 0, pendingCount = 0 }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[var(--cm-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      {/* Left: icon + title, subtitle underneath */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <Users size={28} className="shrink-0 text-indigo-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cm-text)]">
            Connections
          </h1>
        </div>
        <p className="text-sm text-[var(--cm-text-dim)]">
          Developers you're connected with, plus pending requests.
        </p>
      </div>

      <div className="flex gap-4 text-sm text-[var(--cm-muted)]">
        <span>
          <span className="font-semibold text-[var(--cm-text)]">{totalConnections}</span>{" "}
          connections
        </span>
        <span>
          <span className="font-semibold text-[var(--cm-text)]">{pendingCount}</span>{" "}
          pending
        </span>
      </div>
    </div>
  );
}