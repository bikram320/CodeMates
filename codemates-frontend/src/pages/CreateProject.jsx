/**
 * src/pages/CreateProject.jsx
 *
 * Create Project page (/projects/new).
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *
 *   CreateProject.jsx
 *       ↓  calls
 *   useCreateProject()        src/hooks/useCreateProject.js
 *       ↓  calls
 *   createProject()           src/api/projectsApi.js
 *       ↓  routes to (based on VITE_USE_MOCK)
 *   createProjectMock()       src/mock/projectsMock.js   ← current
 *   or POST /api/projects                                ← future
 *
 * The mock adds the project to the same store My Projects reads, so it appears
 * there and resolves at /projects/:id. Discover Projects has its own static
 * list and is not affected.
 *
 * Try the error UI with: a name that already exists (e.g. "OpenBoard"), or
 * ?mockCreateProject=error in the URL.
 *
 * ── Going live later ──────────────────────────────────────────────────────────
 *   Set VITE_USE_MOCK=false. Only these fields exist in the backend's
 *   CreateProjectRequest today:
 *     name, description, githubRepoUrl, visibility, techStack, maxMembers
 *   projectType, rolesNeeded and status are collected by the form but the
 *   backend can't store them yet (status can only be set afterwards with
 *   PUT /api/projects/{id}). See toCreateProjectPayload() below.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, X } from "lucide-react";

import CreateProjectForm from "../components/projectForm/CreateProjectForm";
import useCreateProject from "../hooks/useCreateProject";

const PROJECTS_PATH = "/projects";
const REDIRECT_DELAY_MS = 1200;
const NO_FIELD_ERRORS = {};

// The API names some fields differently from the form.
const API_TO_FORM_FIELD = { maxMembers: "teamSize" };
const FORM_FIELDS = ["name", "description", "projectType", "techStack", "teamSize", "rolesNeeded", "githubRepoUrl"];

const toFormFieldErrors = (apiErrors) =>
  Object.fromEntries(Object.entries(apiErrors).map(([key, msg]) => [API_TO_FORM_FIELD[key] ?? key, msg]));

/** Form values → API payload. */
function toCreateProjectPayload(values) {
  return {
    // In the backend's CreateProjectRequest today:
    name: values.name,
    description: values.description,
    githubRepoUrl: values.githubRepoUrl || null,
    visibility: values.visibility,
    techStack: values.techStack,
    maxMembers: Number(values.teamSize),
    // Not in CreateProjectRequest yet (needs backend support):
    projectType: values.projectType,
    rolesNeeded: values.rolesNeeded,
    status: values.status,
  };
}

export default function CreateProject() {
  const navigate = useNavigate();

  const { createProject, isCreating, isSuccess, createdProject: created } = useCreateProject();
  const phase = isCreating ? "submitting" : isSuccess ? "success" : "idle";

  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(NO_FIELD_ERRORS);

  const feedbackRef = useRef(null);
  const redirectTimer = useRef(null);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  // Bring the success/error banner into view (the form is long).
  useEffect(() => {
    if (formError || phase === "success") {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [formError, phase]);

  const handleSubmit = async (values) => {
    setFormError(null);
    setFieldErrors(NO_FIELD_ERRORS);

    try {
      const project = await createProject(toCreateProjectPayload(values));
      redirectTimer.current = setTimeout(() => navigate(`/projects/${project.id}`), REDIRECT_DELAY_MS);
    } catch (err) {
      const mapped = err.fieldErrors ? toFormFieldErrors(err.fieldErrors) : null;
      if (mapped && FORM_FIELDS.some((f) => mapped[f])) {
        setFieldErrors(mapped);
        setFormError("We couldn't create the project. Check the highlighted fields and try again.");
      } else {
        setFormError(err.message || "Something went wrong while creating the project. Try again.");
      }
    }
  };

  return (
    <div className="create-project-page">
      <div className="head-container mx-auto w-full max-w-3xl">
        <Link
          to={PROJECTS_PATH}
          className="mb-3 inline-flex items-center gap-1.5 rounded text-sm text-[#8B86B8] transition-colors
                     hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          All projects
        </Link>
        <h1 className="text-2xl font-semibold text-[#F5F5F5]">Create a project</h1>
        <p className="mt-1 text-sm leading-relaxed text-[#8B86B8]">
          Describe what you're building and who you need. You can invite teammates once it's created.
        </p>
      </div>

      <div className="body-container mx-auto mt-6 flex w-full max-w-3xl flex-col gap-6">
        {(formError || phase === "success") && (
        <div ref={feedbackRef} className="flex flex-col gap-3">
          {phase === "success" && created && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-[#5FD3A0]/30 bg-[#5FD3A0]/5 px-4 py-3"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#5FD3A0]" aria-hidden="true" />
              <p className="flex-1 text-sm leading-relaxed text-[#A9A6C8]">
                <span className="font-medium text-[#F5F5F5]">{created.name} was created.</span> Taking you to the
                project…{" "}
                <Link
                  to={`/projects/${created.id}`}
                  className="rounded font-medium text-[#C9A8FF] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60"
                >
                  Go now
                </Link>
              </p>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-300" aria-hidden="true" />
              <p className="flex-1 text-sm leading-relaxed text-red-200">{formError}</p>
              <button
                type="button"
                onClick={() => setFormError(null)}
                aria-label="Dismiss"
                className="shrink-0 rounded text-red-300 transition-colors hover:text-red-100
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        )}

        <CreateProjectForm
          onSubmit={handleSubmit}
          onCancel={() => navigate(PROJECTS_PATH)}
          isSubmitting={phase === "submitting"}
          disabled={phase !== "idle"}
          fieldErrors={fieldErrors}
        />
      </div>
    </div>
  );
}