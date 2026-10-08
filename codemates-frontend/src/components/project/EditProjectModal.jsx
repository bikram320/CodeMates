import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Modal for editing a project's core details.
 *
 * Maps to PUT /api/projects/{id} (projectApi.updateProject) — LEADER only,
 * partial-update semantics on the server (only sent fields are changed).
 *
 * Fields match what updateProject actually accepts:
 *   name, description, githubRepoUrl, visibility, techStack, maxMembers
 *
 * `status` is deliberately NOT editable here — archiving/completing a
 * project is a separate, more consequential action better suited to a
 * dedicated Settings page, not folded into a general "edit details" modal.
 *
 * Props:
 * - open      {boolean}
 * - project   {ProjectResponse}  current project, used to prefill the form
 * - saving    {boolean}
 * - error     {string|null}
 * - onClose   {fn}
 * - onSave    {fn(data)}  data = { name, description, githubRepoUrl, visibility, techStack, maxMembers }
 */
export default function EditProjectModal({
  open,
  project,
  saving = false,
  error = null,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    githubRepoUrl: "",
    visibility: "PUBLIC",
    techStack: "",
    maxMembers: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Reload the form from the current project every time the modal opens,
  // so stale edits from a previous open (or a previous project) never leak in.
  useEffect(() => {
    if (!open || !project) return;
    setForm({
      name: project.name ?? "",
      description: project.description ?? "",
      githubRepoUrl: project.githubRepoUrl ?? "",
      visibility: project.visibility ?? "PUBLIC",
      techStack: project.techStack ?? "",
      maxMembers: project.maxMembers ?? "",
    });
    setFieldErrors({});
  }, [open, project]);

  if (!open) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Project name is required.";
    else if (form.name.trim().length > 60) errs.name = "Keep the name under 60 characters.";

    if (form.maxMembers !== "" && (!Number.isInteger(Number(form.maxMembers)) || Number(form.maxMembers) < 1)) {
      errs.maxMembers = "Enter a whole number of 1 or more.";
    }

    if (form.githubRepoUrl && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(form.githubRepoUrl.trim())) {
      errs.githubRepoUrl = "Use a link like https://github.com/owner/repository";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      githubRepoUrl: form.githubRepoUrl.trim(),
      visibility: form.visibility,
      techStack: form.techStack.trim(),
      maxMembers: form.maxMembers === "" ? undefined : Number(form.maxMembers),
    });
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2 text-sm " +
    "text-[var(--cm-text)] placeholder:text-[var(--cm-muted)] outline-none focus:border-[var(--cm-indigo)] transition-colors";

  const labelClass = "mb-1.5 block text-xs font-medium text-[var(--cm-text-dim)]";
  const errorClass = "mt-1 text-xs text-red-300";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 shadow-xl shadow-black/50">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="edit-project-title" className="text-base font-semibold text-[var(--cm-text)]">
            Edit project details
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-md p-1 text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="edit-project-name">Name</label>
            <input
              id="edit-project-name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
              maxLength={60}
            />
            {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-project-description">Description</label>
            <textarea
              id="edit-project-description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              maxLength={2000}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-project-github">GitHub repository URL</label>
            <input
              id="edit-project-github"
              type="text"
              value={form.githubRepoUrl}
              onChange={(e) => update("githubRepoUrl", e.target.value)}
              placeholder="https://github.com/owner/repository"
              className={inputClass}
            />
            {fieldErrors.githubRepoUrl && <p className={errorClass}>{fieldErrors.githubRepoUrl}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="edit-project-techstack">Tech stack</label>
            <input
              id="edit-project-techstack"
              type="text"
              value={form.techStack}
              onChange={(e) => update("techStack", e.target.value)}
              placeholder="React, TypeScript, Tailwind"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="edit-project-visibility">Visibility</label>
              <select
                id="edit-project-visibility"
                value={form.visibility}
                onChange={(e) => update("visibility", e.target.value)}
                className={inputClass}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="edit-project-maxmembers">Max members</label>
              <input
                id="edit-project-maxmembers"
                type="number"
                min={1}
                value={form.maxMembers}
                onChange={(e) => update("maxMembers", e.target.value)}
                className={inputClass}
              />
              {fieldErrors.maxMembers && <p className={errorClass}>{fieldErrors.maxMembers}</p>}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[var(--cm-border)] px-4 py-2 text-sm font-medium text-[var(--cm-text)] transition-colors hover:border-[var(--cm-border-strong)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--cm-indigo)] px-4 py-2 text-sm font-semibold text-[#0A0918] transition-colors hover:bg-[var(--cm-lavender)] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
