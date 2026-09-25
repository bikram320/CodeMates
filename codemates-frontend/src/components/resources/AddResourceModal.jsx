import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "../ui/Button";

const RESOURCE_TYPES = [
  { value: "LINK", label: "Link" },
  { value: "DOCUMENT", label: "Document" },
  { value: "DESIGN", label: "Design" },
  { value: "OTHER", label: "Other" },
];

const inputClass =
  "w-full rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2 text-sm text-[var(--cm-text)] placeholder:text-[var(--cm-muted)] focus:border-[var(--cm-indigo)] focus:outline-none";

/**
 * Modal for adding a resource. Self-contained (owns its own
 * overlay/panel) rather than built on a separate generic Modal
 * primitive — same reasoning as TaskModal.jsx.
 *
 * Add-only: ProjectResourceController has no update endpoint (only
 * POST, DELETE /{id}, and GET), so the earlier edit mode has been
 * removed rather than left as a mock. If an edit endpoint gets added
 * to the backend later, this modal is the right place to bring it back.
 *
 * Props:
 * - open     boolean
 * - saving   boolean — disables the form and shows a busy label while the create request is in flight
 * - onClose  () => void
 * - onSave   (resourceData) => void
 */
export default function AddResourceModal({ open, saving = false, onClose, onSave }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("LINK");

  useEffect(() => {
    if (!open) return;
    setName("");
    setUrl("");
    setDescription("");
    setResourceType("LINK");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave?.({
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      resourceType,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={saving ? undefined : onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6"
        style={{ backgroundColor: "var(--cm-surface-2, #1e1d36)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--cm-text)]">Add Resource</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="resource-name" className="text-xs text-[var(--cm-muted)]">
            Name
          </label>
          <input
            id="resource-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. API Reference Doc"
            required
            disabled={saving}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="resource-url" className="text-xs text-[var(--cm-muted)]">
            URL
          </label>
          <input
            id="resource-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
            disabled={saving}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="resource-description" className="text-xs text-[var(--cm-muted)]">
            Description
          </label>
          <textarea
            id="resource-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is this, and why does the team need it?"
            disabled={saving}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="resource-type" className="text-xs text-[var(--cm-muted)]">
            Type
          </label>
          <select
            id="resource-type"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            disabled={saving}
            className={inputClass}
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Adding..." : "Add Resource"}
          </Button>
        </div>
      </form>
    </div>
  );
}