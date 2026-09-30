import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, AtSign, Check, Loader2, Lock, Mail, User } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import AuthInput from "../components/auth/AuthInput";
import AuthDivider from "../components/auth/AuthDivider";
import useAuth from "../hooks/useAuth";
import { GITHUB_AUTH_URL } from "../api/authApi";
import { primaryButton, outlineButton, textLink } from "./authStyles.js";

// Kept in sync with ResetPassword.jsx's PASSWORD_RULES (mirrors backend @Size(min=8)).
const PASSWORD_RULES = [{ id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 }];

/* ── Validation ──────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v) {
  const e = {};
  if (!v.fullName.trim()) e.fullName = "Enter your full name.";

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

  if (!v.terms) e.terms = "Accept the terms to create your account.";
  return e;
}

const FIELD_ORDER = ["fullName", "username", "email", "password", "confirmPassword", "terms"];

const INITIAL = { fullName: "", username: "", email: "", password: "", confirmPassword: "", terms: false };

/* ── Form ────────────────────────────────────────────────────────────────── */

export default function RegisterForm({ oauthError, onSwitch }) {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [values, setValues] = useState(INITIAL);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (oauthError) setError(oauthError);
  }, [oauthError]);

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
    setTimeout(() => document.getElementById(`register-${field}`)?.focus(), 0);
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
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-[#16171D]" style={{ color: "#16171D" }}>Create your account</h1>
        <p className="mt-1.5 text-sm text-[#6B7280]">Find collaborators, form a team, and ship the project.</p>
      </header>

      {error && (
        <div ref={bannerRef} role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-400/40 bg-red-50 px-3.5 py-3">
          <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm leading-relaxed text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
          <AuthInput
            id="register-fullName" label="Full name" icon={User} placeholder="Enter your full name"
            autoComplete="name" error={errorFor("fullName")} {...bind("fullName")}
          />
          <AuthInput
            id="register-username" label="Username" icon={AtSign} placeholder="3 to 50 characters"
            autoComplete="username" autoCapitalize="none" spellCheck={false}
        
            error={errorFor("username")} {...bind("username")}
          />
          <AuthInput
            id="register-email" label="Email" type="email" icon={Mail} placeholder="Enter email"
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
             
              {...bind("password")}
            />
            {showRules && (
              <ul id="register-password-rules" aria-label="Password requirements" className="flex flex-col gap-1">
                {PASSWORD_RULES.map((r) => {
                  const met = r.test(values.password);
                  return (
                    <li key={r.id} className={`flex items-center gap-2 text-xs ${met ? "text-[#4F5DE8]" : "text-[#6B7280]"}`}>
                      {met ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <span aria-hidden="true" className="ml-1 mr-1 h-1.5 w-1.5 rounded-full bg-[#6B7280]/60" />
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

          <div className="flex flex-col gap-1.5">
            <label className="inline-flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-[#6B7280]">
              <input
                id="register-terms" type="checkbox" checked={values.terms}
                aria-invalid={errorFor("terms") ? true : undefined}
                aria-describedby={errorFor("terms") ? "register-terms-error" : undefined}
                onChange={(e) => {
                  setField("terms", e.target.checked);
                  setTouched((t) => ({ ...t, terms: true }));
                }}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[#6B7280] bg-transparent accent-[#6C7BFF]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
              />
              <span>
                I agree to the <Link to="/terms" className={textLink}>Terms of Service</Link> and{" "}
                <Link to="/privacy" className={textLink}>Privacy Policy</Link>.
              </span>
            </label>
            {errorFor("terms") && (
              <p id="register-terms-error" className="flex items-start gap-1.5 text-xs leading-relaxed text-red-600">
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

      <AuthDivider className="my-5" />

      {/* Plain <a>: must be a real page navigation. Same URL as Login. */}
      <a href={GITHUB_AUTH_URL} className={outlineButton}>
        <FaGithub size={16} aria-hidden="true" />
        Sign up with GitHub
      </a>

      {/* The image panel handles switching on desktop; this covers mobile. */}
      <p className="mt-5 text-center text-sm text-[#6B7280] md:hidden">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className={`font-medium ${textLink}`}>Log in</button>
      </p>
    </>
  );
}