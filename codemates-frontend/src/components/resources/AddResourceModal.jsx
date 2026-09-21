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
 * Modal for adding or editing a resource. Self-contained (owns its own
 * overlay/panel) rather than built on a separate generic Modal
 * primitive — same reasoning as TaskModal.jsx.
 *
 * ⚠️ Editing exists here as a mock/local-state operation only: the real
 * resource-service API has no edit endpoint at all yet (only create,
 * delete, and list — see codemates-api-docs.md). This isn't a "swap the
 * mock call for a real one later" situation; edit support needs to be
 * added to the backend before this can go live.
 *
 * Props:
 * - open       boolean
 * - resource   existing resource object, or null when adding
 * - onClose    () => void
 * - onSave     (resourceData) => void
 */
export default function AddResourceModal({ open, resource = null, onClose, onSave }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("LINK");

  useEffect(() => {
    if (!open) return;
    if (resource) {
      setName(resource.name ?? "");
      setUrl(resource.url ?? "");
      setDescription(resource.description ?? "");
      setResourceType(resource.resourceType ?? "LINK");
    } else {
      setName("");
      setUrl("");
      setDescription("");
      setResourceType("LINK");
    }
  }, [open, resource]);

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
      id: resource?.id,
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
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6"
        style={{ backgroundColor: "var(--cm-surface-2, #1e1d36)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--cm-text)]">
            {resource ? "Edit Resource" : "Add Resource"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
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
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {resource ? "Save Changes" : "Add Resource"}
          </Button>
        </div>
      </form>
    </div>
  );
}