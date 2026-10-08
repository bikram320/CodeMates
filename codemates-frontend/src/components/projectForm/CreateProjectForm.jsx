import { useEffect, useState } from "react";
import { ChevronDown, Globe, Loader2, Lock, Plus, X } from "lucide-react";

import ProjectFormSection, { FormField, controlClass, fieldProps } from "./ProjectFormSection";


/* ── Options ─────────────────────────────────────────────────────────────── */

// Single source of truth: the same types My Projects cards render from.
//const PROJECT_TYPES = Object.entries(TYPE_CONFIG).map(([id, { label }]) => ({ id, label }));

// Role names match the ones Discover Projects uses in `requiredRoles`.
const ROLE_OPTIONS = [
  "Frontend Developer", "Backend Developer", "Full-stack Developer", "Mobile Developer", "Designer",
  "DevOps", "ML Engineer", "QA", "Technical Writer", "Project Manager",
].map((label) => ({ id: label, label }));

const TECH_SUGGESTIONS = [
  "React", "Spring Boot", "PostgreSQL", "Node.js", "TypeScript", "Python",
  "Docker", "Kafka", "Redis", "Tailwind CSS", "Flutter", "TensorFlow",
];

// Values match the backend `status` and `visibility` enums.
const STATUS_OPTIONS = [
  { id: "ACTIVE", label: "Active: work is under way" },
  { id: "COMPLETED", label: "Completed: already shipped" },
  { id: "ARCHIVED", label: "Archived: kept for reference" },
];

const VISIBILITY_OPTIONS = [
  { id: "PRIVATE", icon: Lock, label: "Private", desc: "Only members and people you invite can see this project." },
  { id: "PUBLIC", icon: Globe, label: "Public", desc: "Anyone can find and view it in Discover Projects. Only members can make changes." },
];

/* ── Validation ──────────────────────────────────────────────────────────── */

const GITHUB_REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?(\.git)?\/?$/;
const LIMITS = { nameMin: 3, nameMax: 60, descMin: 20, descMax: 500, teamMin: 2, teamMax: 20, techMax: 12, techNameMax: 30 };

// Also the order in which the first invalid field is focused.
const FIELD_ORDER = ["name", "description", "projectType", "techStack", "teamSize", "rolesNeeded", "githubRepoUrl"];

function validate(v) {
  const e = {};

  const name = v.name.trim();
  if (!name) e.name = "Give your project a name.";
  else if (name.length < LIMITS.nameMin) e.name = `Project name needs at least ${LIMITS.nameMin} characters.`;
  else if (name.length > LIMITS.nameMax) e.name = `Project name can be at most ${LIMITS.nameMax} characters.`;

  const desc = v.description.trim();
  if (!desc) e.description = "Describe what you're building so developers can tell if they'd like to join.";
  else if (desc.length < LIMITS.descMin) e.description = `Add a bit more detail: ${LIMITS.descMin - desc.length} more characters needed.`;
  else if (desc.length > LIMITS.descMax) e.description = `Keep the description under ${LIMITS.descMax} characters.`;

  if (!v.projectType) e.projectType = "Choose the type of project.";

  if (v.techStack.length === 0) e.techStack = "Add at least one technology.";

  const size = Number(v.teamSize);
  if (v.teamSize.trim() === "") e.teamSize = "Enter how many people the team should have.";
  else if (!Number.isInteger(size)) e.teamSize = "Team size must be a whole number.";
  else if (size < LIMITS.teamMin || size > LIMITS.teamMax)
    e.teamSize = `Team size must be between ${LIMITS.teamMin} and ${LIMITS.teamMax}, including you.`;

  if (v.rolesNeeded.length === 0) e.rolesNeeded = "Pick at least one role you're looking for.";

  const repo = v.githubRepoUrl.trim();
  if (repo && !GITHUB_REPO_RE.test(repo)) e.githubRepoUrl = "Use a full repository link like https://github.com/owner/repository.";

  return e;
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-5 py-2.5 text-sm font-semibold " +
  "text-[#0A0918] transition-colors hover:bg-[#8190FF] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2A66] px-5 py-2.5 text-sm font-medium " +
  "text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#2E2A66] disabled:hover:bg-transparent " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const chip =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const Counter = ({ value, max }) => (
  <span className={`text-xs tabular-nums ${value > max ? "text-red-300" : "text-[#6B6890]"}`}>
    {value}/{max}
  </span>
);

/* ── Form ────────────────────────────────────────────────────────────────── */

const INITIAL = {
  name: "",
  description: "",
  projectType: "",
  techStack: [],
  teamSize: "5",
  rolesNeeded: [],
  visibility: "PRIVATE", // same default as the backend
  githubRepoUrl: "",
  status: "ACTIVE",
};

/**
 * Props
 *   onSubmit(values)  called with trimmed values once validation passes
 *   onCancel()
 *   isSubmitting      shows the spinner on the submit button
 *   disabled          locks every control (submitting or already created)
 *   fieldErrors       server-side errors keyed by field name, e.g. { name: "…" }
 */
export default function CreateProjectForm({ onSubmit, onCancel, isSubmitting = false, disabled = false, fieldErrors }) {
  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [techInput, setTechInput] = useState("");
  const [techNote, setTechNote] = useState("");

  const errors = validate(values);

  // Server-side errors: show them and jump to the first affected field.
  useEffect(() => {
    setServerErrors(fieldErrors ?? {});
    const first = FIELD_ORDER.find((f) => fieldErrors?.[f]);
    if (first) document.getElementById(`cp-${first}`)?.focus();
  }, [fieldErrors]);

  const errorFor = (field) => serverErrors[field] || ((touched[field] || submitted) && errors[field]) || undefined;
  const touch = (field) => setTouched((t) => (t[field] ? t : { ...t, [field]: true }));

  const setField = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setServerErrors((s) => (s[field] ? { ...s, [field]: undefined } : s));
  };

  const bind = (field) => ({
    value: values[field],
    onChange: (e) => setField(field, e.target.value),
    onBlur: () => touch(field),
  });

  /* Tech stack tags */
  const addTech = (raw) => {
    const items = raw.split(",").map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean);
    if (items.length === 0) return;

    const next = [...values.techStack];
    let note = "";
    for (const item of items) {
      if (item.length > LIMITS.techNameMax) note = `Keep technology names under ${LIMITS.techNameMax} characters.`;
      else if (next.some((t) => t.toLowerCase() === item.toLowerCase())) note = `${item} is already added.`;
      else if (next.length >= LIMITS.techMax) {
        note = `You can add up to ${LIMITS.techMax} technologies.`;
        break;
      } else next.push(item);
    }
    setField("techStack", next);
    touch("techStack");
    setTechNote(note);
    setTechInput(note && next.length === values.techStack.length ? raw : "");
  };

  const removeTech = (name) => {
    setField("techStack", values.techStack.filter((t) => t !== name));
    touch("techStack");
    setTechNote("");
  };

  const toggleRole = (id) => {
    setField("rolesNeeded", values.rolesNeeded.includes(id) ? values.rolesNeeded.filter((r) => r !== id) : [...values.rolesNeeded, id]);
    touch("rolesNeeded");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const firstInvalid = FIELD_ORDER.find((f) => errors[f]);
    if (firstInvalid) {
      document.getElementById(`cp-${firstInvalid}`)?.focus();
      return;
    }

    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      githubRepoUrl: values.githubRepoUrl.trim(),
    });
  };

  const suggestions = TECH_SUGGESTIONS.filter((s) => !values.techStack.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={disabled} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
        {/* ── Basics ─────────────────────────────────────────────────── */}
        <ProjectFormSection title="Project basics" description="What are you building? This is what other developers see first.">
          <FormField
            id="cp-name"
            label="Project name"
            required
            error={errorFor("name")}
            counter={<Counter value={values.name.trim().length} max={LIMITS.nameMax} />}
          >
            <input
              type="text"
              autoComplete="off"
              placeholder="e.g. DevPulse"
              className={controlClass(!!errorFor("name"))}
              {...fieldProps("cp-name", errorFor("name"), null, true)}
              {...bind("name")}
            />
          </FormField>

          <FormField
            id="cp-description"
            label="Description"
            required
            error={errorFor("description")}
            hint="What does it do, who is it for, and what stage is it at?"
            counter={<Counter value={values.description.trim().length} max={LIMITS.descMax} />}
          >
            <textarea
              rows={5}
              placeholder="A dashboard that shows how healthy a team's sprint is, pulled from tasks and GitHub activity…"
              className={`${controlClass(!!errorFor("description"))} resize-y`}
              {...fieldProps("cp-description", errorFor("description"), "hint", true)}
              {...bind("description")}
            />
          </FormField>

          <FormField id="cp-projectType" label="Project type" required error={errorFor("projectType")}>
            <div className="relative">
              <select
                className={`${controlClass(!!errorFor("projectType"))} appearance-none pr-10`}
                {...fieldProps("cp-projectType", errorFor("projectType"), null, true)}
                {...bind("projectType")}
              >
                <option value="" disabled className="bg-[#0A0918]">
                  Select a project type
                </option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0A0918]">
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6890]" />
            </div>
          </FormField>
        </ProjectFormSection>

        {/* ── Tech stack ─────────────────────────────────────────────── */}
        <ProjectFormSection title="Tech stack" description="The languages, frameworks and tools the project uses. Developers can find you by these.">
          <FormField
            id="cp-techStack"
            label="Technologies"
            required
            error={techNote || errorFor("techStack")}
            hint={`Press Enter or comma to add. Up to ${LIMITS.techMax}.`}
          >
            <div className="flex gap-2">
              <input
                type="text"
                autoComplete="off"
                placeholder="Type a technology, e.g. Spring Boot"
                value={techInput}
                className={controlClass(!!(techNote || errorFor("techStack")))}
                {...fieldProps("cp-techStack", techNote || errorFor("techStack"), "hint", true)}
                onChange={(e) => {
                  if (e.target.value.includes(",")) addTech(e.target.value);
                  else {
                    setTechInput(e.target.value);
                    setTechNote("");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech(techInput);
                  } else if (e.key === "Backspace" && !techInput && values.techStack.length) {
                    removeTech(values.techStack[values.techStack.length - 1]);
                  }
                }}
                onBlur={() => {
                  if (techInput.trim()) addTech(techInput);
                  touch("techStack");
                }}
              />
              <button type="button" onClick={() => addTech(techInput)} className={secondaryButton} aria-label="Add technology">
                <Plus size={15} />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </FormField>

          {values.techStack.length > 0 && (
            <ul aria-label="Selected technologies" className="flex flex-wrap gap-2">
              {values.techStack.map((t) => (
                <li key={t}>
                  <span className={`${chip} border-[#6C7BFF]/40 bg-[#6C7BFF]/10 text-[#F5F5F5]`}>
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTech(t)}
                      aria-label={`Remove ${t}`}
                      className="rounded text-[#A9A6C8] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60 disabled:opacity-60"
                    >
                      <X size={12} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {suggestions.length > 0 && values.techStack.length < LIMITS.techMax && (
            <div>
              <p className="mb-2 text-xs text-[#6B6890]">Popular</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTech(s)}
                    className={`${chip} border-[#2E2A66] text-[#A9A6C8] hover:border-[#C9A8FF]/60 hover:text-[#C9A8FF]`}
                  >
                    <Plus size={12} aria-hidden="true" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ProjectFormSection>

        {/* ── Team ───────────────────────────────────────────────────── */}
        <ProjectFormSection title="Team" description="How big should the team be, and who are you looking for?">
          <div className="sm:max-w-[220px]">
            <FormField
              id="cp-teamSize"
              label="Team size"
              required
              error={errorFor("teamSize")}
              hint={`Including you. ${LIMITS.teamMin}–${LIMITS.teamMax} people.`}
            >
              <input
                type="number"
                inputMode="numeric"
                min={LIMITS.teamMin}
                max={LIMITS.teamMax}
                className={controlClass(!!errorFor("teamSize"))}
                {...fieldProps("cp-teamSize", errorFor("teamSize"), "hint", true)}
                {...bind("teamSize")}
              />
            </FormField>
          </div>

          <FormField id="cp-rolesNeeded" label="Roles needed" required group error={errorFor("rolesNeeded")} hint="Select every role you'd like to fill.">
            <div
              role="group"
              aria-labelledby="cp-rolesNeeded-label"
              tabIndex={-1}
              {...fieldProps("cp-rolesNeeded", errorFor("rolesNeeded"), "hint")}
              className="flex flex-wrap gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              {ROLE_OPTIONS.map((r) => {
                const on = values.rolesNeeded.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleRole(r.id)}
                    className={`${chip} ${
                      on
                        ? "border-[#C9A8FF]/60 bg-[#C9A8FF]/10 text-[#C9A8FF]"
                        : "border-[#2E2A66] text-[#A9A6C8] hover:border-[#6C7BFF] hover:text-[#F5F5F5]"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </FormField>
        </ProjectFormSection>

        {/* ── Visibility & repository ────────────────────────────────── */}
        <ProjectFormSection title="Visibility & repository" description="Who can see the project, and where the code lives.">
          <FormField id="cp-visibility" label="Project visibility" group>
            <div role="radiogroup" aria-labelledby="cp-visibility-label" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {VISIBILITY_OPTIONS.map(({ id, icon: Icon, label, desc }) => (
                <label key={id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value={id}
                    checked={values.visibility === id}
                    onChange={() => setField("visibility", id)}
                    className="peer sr-only"
                  />
                  <div
                    className="flex h-full items-start gap-3 rounded-xl border border-[#2E2A66] p-4 transition-colors hover:border-[#3A3670]
                               peer-checked:border-[#6C7BFF] peer-checked:bg-[#6C7BFF]/[0.07]
                               peer-focus-visible:ring-2 peer-focus-visible:ring-[#6C7BFF]/60 peer-disabled:opacity-60"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        values.visibility === id ? "bg-[#6C7BFF]/15 text-[#6C7BFF]" : "bg-[#1D1A40] text-[#8B86B8]"
                      }`}
                    >
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#F5F5F5]">{label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-[#8B86B8]">{desc}</span>
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </FormField>

          <FormField
            id="cp-githubRepoUrl"
            label="GitHub repository URL"
            optional
            error={errorFor("githubRepoUrl")}
            hint="You can link a repository now or later. Linked repositories feed commit activity into contribution scores."
          >
            <input
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://github.com/owner/repository"
              className={controlClass(!!errorFor("githubRepoUrl"))}
              {...fieldProps("cp-githubRepoUrl", errorFor("githubRepoUrl"), "hint")}
              {...bind("githubRepoUrl")}
            />
          </FormField>

          <div className="sm:max-w-[320px]">
            <FormField id="cp-status" label="Project status">
              <div className="relative">
                <select className={`${controlClass()} appearance-none pr-10`} {...fieldProps("cp-status")} {...bind("status")}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0A0918]">
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6890]" />
              </div>
            </FormField>
          </div>
        </ProjectFormSection>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-xs text-[#6B6890] sm:mr-auto">You'll be added as the project's Leader.</p>
          <button type="button" onClick={onCancel} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" className={primaryButton} aria-busy={isSubmitting}>
            {isSubmitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Creating…" : "Create Project"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}