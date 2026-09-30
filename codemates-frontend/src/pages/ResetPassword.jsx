<<<<<<< Updated upstream
/**
 * src/pages/ResetPassword.jsx
 *
 * Reset password page (/reset-password?token=...). Renders inside PublicLayout,
 * using the same AuthLayout / AuthInput as Login, Register and Forgot Password.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   ResetPassword.jsx → useAuth() → authApi.js → POST /api/auth/reset-password
 *
 * The token itself is only ever checked by the backend (ResetPasswordRequest
 * just requires it to be non-blank; validity is AuthService's problem). The
 * backend returns one message string on failure, with no code distinguishing
 * "expired" from "already used" from "invalid" — so any failure here shows
 * that message plus a "Request a new link" link, rather than guessing which.
 *
 * Success clears the auth cookies server-side (see AuthController.resetPassword),
 * forcing a fresh login — that's why this page sends the user to /login rather
 * than signing them in.
 *
 * Password rules mirror the backend's actual @Size(min=8) on newPassword —
 * nothing stricter. Keep in sync with Register.jsx's PASSWORD_RULES.
 */
=======

>>>>>>> Stashed changes

import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Loader2, Lock } from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import useAuth from "../hooks/useAuth";
import { primaryButton, textLink } from "./authStyles.js";

// Kept in sync with Register.jsx's PASSWORD_RULES: both mirror the backend's
// @Size(min=8) on password fields, nothing more.
const PASSWORD_RULES = [{ id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 }];

function validate({ password, confirmPassword }) {
  const e = {};
  if (!password) e.password = "Create a new password.";
  else if (password.length < 8) e.password = "Password must be at least 8 characters.";

  if (!confirmPassword) e.confirmPassword = "Confirm your new password.";
  else if (confirmPassword !== password) e.confirmPassword = "Passwords don't match.";
  return e;
}

<<<<<<< Updated upstream
const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5 text-sm font-semibold " +
  "text-[#16171D] transition-colors hover:bg-[#8190FF] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]";

const textLink =
  "rounded text-[#C9A8FF] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60";
=======
>>>>>>> Stashed changes

const backToLogin = (
  <Link to="/login" className={`inline-flex items-center gap-1.5 font-medium ${textLink}`}>
    <ArrowLeft size={14} aria-hidden="true" />
    Back to login
  </Link>
);

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const { resetPassword } = useAuth();

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // string | null
  const [done, setDone] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const resultRef = useRef(null);
  useEffect(() => {
    if (done) resultRef.current?.focus(); // announce success to keyboard/screen-reader users
  }, [done]);

  const errors = validate(values);
  const errorFor = (f) => ((touched[f] || submitted) ? errors[f] : undefined);
  const showRules = values.password.length > 0 || touched.password || submitted;

  const bind = (field) => ({
    value: values[field],
    onChange: (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setError(null);
    },
    onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const firstInvalid = ["password", "confirmPassword"].find((f) => errors[f]);
    if (firstInvalid) {
      document.getElementById(`reset-${firstInvalid}`)?.focus();
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await resetPassword(token, values.password);
      setSuccessMessage(response?.message);
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── No token in the URL ─────────────────────────────────────────────── */
  if (!token) {
    return (
      <AuthLayout title="This link isn't valid" footer={backToLogin}>
        <div role="alert" className="flex flex-col items-center text-center">
          <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10 text-red-300">
            <AlertCircle size={22} />
          </span>
          <p className="text-sm leading-relaxed text-[#9CA3AF]">
            The password reset link is missing or incomplete. Request a new one and open the link from the latest
            email.
          </p>
        </div>
        <Link to="/forgot-password" className={`${primaryButton} mt-6`}>
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (done) {
    return (
<<<<<<< Updated upstream
      <AuthLayout title="Password updated">
        <div ref={resultRef} tabIndex={-1} role="status" className="flex flex-col items-center text-center focus:outline-none">
          <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A8FF]/10 text-[#C9A8FF]">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm leading-relaxed text-[#F3F4F6]">{successMessage || "Your password has been reset."}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">Log in with your new password to get back to your projects.</p>
        </div>
        <Link to="/login" className={`${primaryButton} mt-6`}>
          Back to login
        </Link>
      </AuthLayout>
=======
        <AuthLayout title="Password updated">
          

          <div ref={resultRef} tabIndex={-1} role="status" className="flex flex-col items-center text-center focus:outline-none">
          <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A8FF]/10 text-[#C9A8FF]">
            <CheckCircle2 size={22} />
          </span>
            <p className="text-sm leading-relaxed text-[#F3F4F6]">{successMessage || "Your password has been reset."}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">Log in with your new password to get back to your projects.</p>
          </div>
          <Link to="/login" className={`${primaryButton} mt-6`}>
            Back to login
          </Link>
          
        </AuthLayout>
>>>>>>> Stashed changes
    );
  }

  /* ── Form ────────────────────────────────────────────────────────────── */
  return (
<<<<<<< Updated upstream
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a new password for your CodeMates account."
      footer={backToLogin}
    >
      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-400/5 px-3.5 py-3">
          <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" />
          <p className="text-sm leading-relaxed text-red-200">
            {error}{" "}
            <Link to="/forgot-password" className={`font-medium ${textLink}`}>
              Request a new link
            </Link>
          </p>
        </div>
      )}
=======
      <AuthLayout
          title="Reset your password"
          subtitle="Enter the 8-digit code we emailed you and choose a new password."
          footer={backToLogin}
      >
        <div className="[&_label]:!text-[#16171D]">
        {error && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-400/5 px-3.5 py-3">
              <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" />
              <p className="text-sm leading-relaxed text-red-200">
                {error}{" "}
                <Link to="/forgot-password" className={`font-medium ${textLink}`}>
                  Request a new code
                </Link>
              </p>
            </div>
        )}
>>>>>>> Stashed changes

      <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
        <fieldset disabled={isLoading} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <div className="flex flex-col gap-2.5">
            <AuthInput
<<<<<<< Updated upstream
              id="reset-password"
              label="New password"
              type="password"
              icon={Lock}
              placeholder="Create a new password"
              autoComplete="new-password"
              error={errorFor("password")}
              {...(showRules
                ? { "aria-describedby": `reset-password-rules${errorFor("password") ? " reset-password-error" : ""}` }
                : {})}
              hint={showRules ? undefined : "Use at least 8 characters."}
              {...bind("password")}
=======
                id="reset-email"
                label="Email"
                type="email"
                icon={Mail}
                placeholder="Enter email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                error={errorFor("email")}
                {...bind("email")}
>>>>>>> Stashed changes
            />
            {showRules && (
              <ul id="reset-password-rules" aria-label="Password requirements" className="flex flex-col gap-1">
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
            id="reset-confirmPassword"
            label="Confirm new password"
            type="password"
            icon={Lock}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            error={errorFor("confirmPassword")}
            {...bind("confirmPassword")}
          />

<<<<<<< Updated upstream
          <button type="submit" className={primaryButton}>
            {isLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isLoading ? "Resetting password…" : "Reset Password"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
=======
            <div className="flex flex-col gap-2.5">
              <AuthInput
                  id="reset-password"
                  label="New password"
                  type="password"
                  icon={Lock}
                  placeholder="Create a new password"
                  autoComplete="new-password"
                  error={errorFor("password")}
                  {...(showRules
                      ? { "aria-describedby": `reset-password-rules${errorFor("password") ? " reset-password-error" : ""}` }
                      : {})}
                  hint={showRules ? undefined : "Use at least 8 characters."}
                  {...bind("password")}
              />
              {showRules && (
                  <ul id="reset-password-rules" aria-label="Password requirements" className="flex flex-col gap-1">
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
                id="reset-confirmPassword"
                label="Confirm new password"
                type="password"
                icon={Lock}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                error={errorFor("confirmPassword")}
                {...bind("confirmPassword")}
            />

            <button type="submit" className={primaryButton}>
              {isLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {isLoading ? "Resetting password…" : "Reset Password"}
            </button>
          </fieldset>
        </form>
        </div>
      </AuthLayout>
>>>>>>> Stashed changes
  );
}