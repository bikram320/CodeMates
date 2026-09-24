/**
 * src/pages/Register.jsx
 *
 * Register page (/register). Renders inside PublicLayout, using the same
 * AuthLayout / AuthInput as Login.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   Register.jsx → useAuth() → authApi.js → POST /api/auth/register (real backend)
 *
 * RegisterRequest only accepts { email, password, username, fullName } — that's
 * all this page sends. The "Developer profile" section (skills, bio,
 * availability, GitHub, LinkedIn) is still collected because the product spec
 * asks for it, but it currently isn't sent anywhere: there's no profile
 * endpoint in the files provided. The section says so, so the form doesn't
 * silently discard what someone filled in without telling them. Once a
 * profile endpoint exists, send `profile` (built below) to it right after
 * register() resolves.
 *
 * Validation mirrors the backend's actual rules, not stricter ones:
 *   - username: @Size(min=3, max=50), any characters — RegisterRequest doesn't
 *     restrict which ones, so neither does this page.
 *   - password: @Size(min=8) only — no uppercase/lowercase/number requirement.
 * (Keep ResetPassword.jsx's PASSWORD_RULES in sync if this changes.)
 *
 * There is no "Sign up with GitHub" button here: the provided AuthController
 * has no OAuth endpoint, so nothing was left to call. Re-add it once one exists.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle, AtSign, Check, ChevronDown, Loader2, Lock, Mail, User, X,
} from "lucide-react";
import {FaGithub as Github, FaLinkedin as Linkedin} from "react-icons/fa";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import useAuth from "../hooks/useAuth";

/* ── Options ─────────────────────────────────────────────────────────────── */

const SKILLS_MAX = 10;
const SKILL_NAME_MAX = 30;
const BIO_MAX = 200;

// Kept in sync with ResetPassword.jsx's PASSWORD_RULES: both mirror the
// backend's @Size(min=8) on password fields, nothing more.
const PASSWORD_RULES = [{ id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 }];

const AVAILABILITY = [
  { id: "OPEN", label: "Open to collaborate", desc: "Appear in searches for available developers." },
  { id: "CLOSED", label: "Not right now", desc: "Stay out of availability searches for now." },
];

/* ── Validation ──────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GITHUB_NAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const GITHUB_URL_RE = /^https?:\/\/(?:www\.)?github\.com\/([^/?#\s]+)\/?$/i;
const LINKEDIN_RE = /^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/[^\s/]+\/?$/i;

/** "octocat", "@octocat" or a github.com/octocat link → "octocat"; invalid → null; empty → "". */
function parseGithubUsername(input) {
  const raw = input.trim().replace(/^@/, "");
  if (!raw) return "";
  const name = raw.match(GITHUB_URL_RE)?.[1] ?? raw;
  return GITHUB_NAME_RE.test(name) ? name : null;
}

function validate(v) {
  const e = {};

  const name = v.fullName.trim();
  if (!name) e.fullName = "Enter your full name.";

  const username = v.username.trim();
  if (!username) e.username = "Choose a username.";
  else if (username.length < 3 || username.length > 50) e.username = "Username must be between 3 and 50 characters.";

  const email = v.email.trim();
  if (!email) e.email = "Enter your email address.";
  else if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address, like name@example.com.";

  if (!v.password) e.password = "Create a password.";
  else if (v.password.length < 8) e.password = "Password must be at least 8 characters.";

  if (!v.confirmPassword) e.confirmPassword = "Confirm your password.";
  else if (v.confirmPassword !== v.password) e.confirmPassword = "Passwords don't match.";

  if (v.bio.trim().length > BIO_MAX) e.bio = `Keep your bio under ${BIO_MAX} characters.`;
  if (parseGithubUsername(v.githubUsername) === null) e.githubUsername = "Enter a GitHub username (like octocat) or your profile link.";
  if (v.linkedinUrl.trim() && !LINKEDIN_RE.test(v.linkedinUrl.trim())) {
    e.linkedinUrl = "Use your LinkedIn profile link, like https://www.linkedin.com/in/your-name.";
  }
  if (!v.terms) e.terms = "Accept the terms to create your account.";

  return e;
}

// Visual order, used to focus the first invalid field.
const FIELD_ORDER = ["fullName", "username", "email", "password", "confirmPassword", "bio", "githubUsername", "linkedinUrl", "terms"];
const PROFILE_FIELDS = ["bio", "githubUsername", "linkedinUrl"];

/* ── Styles ──────────────────────────────────────────────────────────────── */

const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5 text-sm font-semibold " +
  "text-[#16171D] transition-colors hover:bg-[#8190FF] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]";

const textLink =
  "rounded text-[#C9A8FF] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60";

const INITIAL = {
  fullName: "", username: "", email: "", password: "", confirmPassword: "",
  skills: [], bio: "", availability: "OPEN", githubUsername: "", linkedinUrl: "", terms: false,
};

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skillNote, setSkillNote] = useState("");

  const bannerRef = useRef(null);
  useEffect(() => {
    if (error) bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const errors = validate(values);
  const errorFor = (f) => serverErrors[f] || ((touched[f] || submitted) && errors[f]) || undefined;
  const showRules = values.password.length > 0 || touched.password || submitted;

  const setField = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setServerErrors((s) => (s[field] ? { ...s, [field]: undefined } : s));
    setError(null);
  };
  const bind = (field) => ({
    value: values[field],
    onChange: (e) => setField(field, e.target.value),
    onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
  });

  const focusField = (field) => {
    if (PROFILE_FIELDS.includes(field)) setShowProfile(true);
    setTimeout(() => document.getElementById(`register-${field}`)?.focus(), 0);
  };

  /* Skills */
  const addSkills = (raw) => {
    const items = raw.split(",").map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean);
    if (items.length === 0) return;

    const next = [...values.skills];
    let note = "";
    for (const item of items) {
      if (item.length > SKILL_NAME_MAX) note = `Keep skill names under ${SKILL_NAME_MAX} characters.`;
      else if (next.some((s) => s.toLowerCase() === item.toLowerCase())) note = `${item} is already added.`;
      else if (next.length >= SKILLS_MAX) {
        note = `You can add up to ${SKILLS_MAX} skills.`;
        break;
      } else next.push(item);
    }
    setField("skills", next);
    setSkillNote(note);
    setSkillInput(note && next.length === values.skills.length ? raw : "");
  };
  const removeSkill = (name) => {
    setField("skills", values.skills.filter((s) => s !== name));
    setSkillNote("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const firstInvalid = FIELD_ORDER.find((f) => errors[f]);
    if (firstInvalid) return focusField(firstInvalid);

    setError(null);
    setServerErrors({});
    setIsSubmitting(true);
    try {
      await register({
        email: values.email.trim(),
        password: values.password,
        username: values.username.trim(),
        fullName: values.fullName.trim(),
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setIsSubmitting(false);
      if (err.fieldErrors) {
        setServerErrors(err.fieldErrors);
        setError("We couldn't create your account. Check the highlighted field and try again.");
        focusField(FIELD_ORDER.find((f) => err.fieldErrors[f]) ?? "fullName");
      } else {
        setError(err.message || "Something went wrong. Try again.");
      }
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Find collaborators, form a team, and ship the project."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className={`font-medium ${textLink}`}>
            Log in
          </Link>
        </>
      }
    >
      {error && (
        <div
          ref={bannerRef}
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-400/30 bg-red-400/5 px-3.5 py-3"
        >
          <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" />
          <p className="text-sm leading-relaxed text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <AuthInput
            id="register-fullName" label="Full name" icon={User} placeholder="Ada Lovelace"
            autoComplete="name" error={errorFor("fullName")} {...bind("fullName")}
          />

          <AuthInput
            id="register-username" label="Username" icon={AtSign} placeholder="ada_codes"
            autoComplete="username" autoCapitalize="none" spellCheck={false}
            hint="3 to 50 characters. Shown on your public profile."
            error={errorFor("username")} {...bind("username")}
          />

          <AuthInput
            id="register-email" label="Email" type="email" icon={Mail} placeholder="you@example.com"
            autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
            error={errorFor("email")} {...bind("email")}
          />

          <div className="flex flex-col gap-2.5">
            <AuthInput
              id="register-password" label="Password" type="password" icon={Lock} placeholder="Create a password"
              autoComplete="new-password" error={errorFor("password")}
              {...(showRules
                ? { "aria-describedby": `register-password-rules${errorFor("password") ? " register-password-error" : ""}` }
                : {})}
              hint={showRules ? undefined : "Use at least 8 characters."}
              {...bind("password")}
            />
            {showRules && (
              <ul id="register-password-rules" aria-label="Password requirements" className="flex flex-col gap-1">
                {PASSWORD_RULES.map((r) => {
                  const met = r.test(values.password);
                  return (
                    <li key={r.id} className={`flex items-center gap-2 text-xs ${met ? "text-[#C9A8FF]" : "text-[#9CA3AF]"}`}>
                      {met ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <span aria-hidden="true" className="ml-1 mr-1 h-1.5 w-1.5 rounded-full bg-[#9CA3AF]/60" />
                      )}
                      {r.label}
                      <span className="sr-only">{met ? " (met)" : " (not met yet)"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <AuthInput
            id="register-confirmPassword" label="Confirm password" type="password" icon={Lock}
            placeholder="Re-enter your password" autoComplete="new-password"
            error={errorFor("confirmPassword")} {...bind("confirmPassword")}
          />

          {/* ── Optional developer profile ─────────────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setShowProfile((s) => !s)}
              aria-expanded={showProfile}
              aria-controls="register-profile"
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#9CA3AF]/50 px-4 py-3 text-left transition-colors
                         hover:border-[#9CA3AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              <span>
                <span className="block text-sm font-medium text-[#F3F4F6]">
                  Developer profile <span className="text-xs font-normal text-[#9CA3AF]">(optional)</span>
                </span>
                <span className="block text-xs text-[#9CA3AF]">Skills, bio, availability and links.</span>
              </span>
              <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-[#9CA3AF] transition-transform ${showProfile ? "rotate-180" : ""}`} />
            </button>

            {showProfile && (
              <div id="register-profile" className="mt-4 flex flex-col gap-5">
                <p className="rounded-lg border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-3.5 py-2.5 text-xs leading-relaxed text-[#9CA3AF]">
                  <span className="font-medium text-[#F3F4F6]">Not saved yet.</span> Account creation isn't connected
                  to a profile service yet, so anything entered here won't be stored. It's included so the form is
                  ready once that's wired up.
                </p>

                <div className="flex flex-col gap-2.5">
                  <AuthInput
                    id="register-skills"
                    label={<>Skills <span className="text-xs font-normal text-[#9CA3AF]">(optional)</span></>}
                    placeholder="e.g. React, Spring Boot"
                    autoComplete="off"
                    value={skillInput}
                    error={skillNote || undefined}
                    hint={`Press Enter or comma to add. Up to ${SKILLS_MAX}.`}
                    onChange={(e) => {
                      if (e.target.value.includes(",")) addSkills(e.target.value);
                      else {
                        setSkillInput(e.target.value);
                        setSkillNote("");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkills(skillInput);
                      }
                    }}
                    onBlur={() => skillInput.trim() && addSkills(skillInput)}
                  />
                  {values.skills.length > 0 && (
                    <ul aria-label="Added skills" className="flex flex-wrap gap-2">
                      {values.skills.map((s) => (
                        <li
                          key={s}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#6C7BFF]/40 bg-[#6C7BFF]/10 px-3 py-1 text-xs font-medium text-[#F3F4F6]"
                        >
                          {s}
                          <button
                            type="button"
                            aria-label={`Remove ${s}`}
                            onClick={() => removeSkill(s)}
                            className="rounded text-[#9CA3AF] hover:text-[#F3F4F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <AuthInput
                  id="register-bio" multiline rows={3}
                  label={<>Short bio <span className="text-xs font-normal text-[#9CA3AF]">(optional)</span></>}
                  placeholder="Backend developer who likes building developer tools."
                  hint={`${values.bio.trim().length}/${BIO_MAX} characters`}
                  error={errorFor("bio")} {...bind("bio")}
                />

                <div role="group" aria-labelledby="register-availability-label" className="flex flex-col gap-1.5">
                  <span id="register-availability-label" className="text-sm font-medium text-[#F3F4F6]">Availability</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {AVAILABILITY.map((o) => (
                      <label key={o.id} className="relative cursor-pointer">
                        <input
                          type="radio" name="availability" value={o.id} className="peer sr-only"
                          checked={values.availability === o.id}
                          onChange={() => setField("availability", o.id)}
                        />
                        <div
                          className="h-full rounded-lg border border-[#9CA3AF]/50 px-3 py-2.5 transition-colors hover:border-[#9CA3AF]
                                     peer-checked:border-[#6C7BFF] peer-checked:bg-[#6C7BFF]/[0.08]
                                     peer-focus-visible:ring-2 peer-focus-visible:ring-[#6C7BFF]/60 peer-disabled:opacity-60"
                        >
                          <span className="block text-sm font-medium text-[#F3F4F6]">{o.label}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-[#9CA3AF]">{o.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <AuthInput
                  id="register-githubUsername"
                  label={<>GitHub <span className="text-xs font-normal text-[#9CA3AF]">(optional)</span></>}
                  icon={Github} placeholder="username or github.com/username"
                  autoComplete="off" autoCapitalize="none" spellCheck={false}
                  error={errorFor("githubUsername")} {...bind("githubUsername")}
                />

                <AuthInput
                  id="register-linkedinUrl"
                  label={<>LinkedIn <span className="text-xs font-normal text-[#9CA3AF]">(optional)</span></>}
                  type="url" icon={Linkedin} placeholder="https://www.linkedin.com/in/your-name"
                  autoComplete="off" autoCapitalize="none" spellCheck={false}
                  error={errorFor("linkedinUrl")} {...bind("linkedinUrl")}
                />
              </div>
            )}
          </div>

          {/* ── Terms ──────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-[#9CA3AF]">
              <input
                id="register-terms" type="checkbox" checked={values.terms}
                aria-invalid={errorFor("terms") ? true : undefined}
                aria-describedby={errorFor("terms") ? "register-terms-error" : undefined}
                onChange={(e) => {
                  setField("terms", e.target.checked);
                  setTouched((t) => ({ ...t, terms: true }));
                }}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[#9CA3AF] bg-transparent accent-[#6C7BFF]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className={textLink}>Terms of Service</Link> and{" "}
                <Link to="/privacy" className={textLink}>Privacy Policy</Link>.
              </span>
            </label>
            {errorFor("terms") && (
              <p id="register-terms-error" className="flex items-start gap-1.5 text-xs leading-relaxed text-red-300">
                <AlertCircle size={13} aria-hidden="true" className="mt-px shrink-0" />
                {errorFor("terms")}
              </p>
            )}
          </div>

          <button type="submit" className={primaryButton}>
            {isSubmitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}