/**
 * src/pages/ResetPassword.jsx
 *
 * Reset password page (/reset-password?token=...). Renders inside PublicLayout,
 * using the same AuthLayout / AuthInput as Login, Register and Forgot Password.
 *
 * ⚠️ MOCK BEHAVIOR ONLY. The token is never verified and nothing is changed.
 *   - any non-empty ?token=… → the reset "succeeds"
 *   - ?token=expired         → the server-style "link has expired" error
 *   - no token in the URL    → the "link isn't valid" screen
 *   - ?mockAuth=error        → simulates the service being unreachable
 *
 * ── Going live later ──────────────────────────────────────────────────────────
 *   Replace mockResetPassword() with POST /api/auth/reset-password
 *   { token, newPassword }. The backend clears the auth cookies and forces a
 *   fresh login, which is why success sends the user to /login. The token
 *   itself is only ever checked by the backend, so an invalid or expired token
 *   comes back as an error on submit (handled by `tokenProblem` below).
 */

import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Loader2, Lock } from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";

/* ── Mock reset ──────────────────────────────────────────────────────────── */

function mockResetPassword({ token }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("mockAuth") === "error") {
        return reject(Object.assign(new Error("We couldn't reach CodeMates. Check your connection and try again."), { status: 503 }));
      }
      if (token === "expired") {
        return reject(Object.assign(new Error("This reset link has expired. Request a new one to continue."), { status: 410 }));
      }
      resolve(null);
    }, 1000);
  });
}

/* ── Validation ──────────────────────────────────────────────────────────── */

// Keep in sync with PASSWORD_RULES in Register.jsx.
const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /\d/.test(p) },
];

function validate({ password, confirmPassword }) {
  const e = {};
  if (!password) e.password = "Create a new password.";
  else if (!PASSWORD_RULES.every((r) => r.test(password))) e.password = "Password doesn't meet all the requirements below.";

  if (!confirmPassword) e.confirmPassword = "Confirm your new password.";
  else if (confirmPassword !== password) e.confirmPassword = "Passwords don't match.";
  return e;
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5 text-sm font-semibold " +
  "text-[#16171D] transition-colors hover:bg-[#8190FF] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]";

const textLink =
  "rounded text-[#C9A8FF] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60";

const backToLogin = (
  <Link to="/login" className={`inline-flex items-center gap-1.5 font-medium ${textLink}`}>
    <ArrowLeft size={14} aria-hidden="true" />
    Back to login
  </Link>
);

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // { message, tokenProblem }
  const [done, setDone] = useState(false);

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
      await mockResetPassword({ token, newPassword: values.password });
      setDone(true);
    } catch (err) {
      setError({
        message: err.message || "Something went wrong. Try again.",
        tokenProblem: err.status === 400 || err.status === 410,
      });
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
      <AuthLayout title="Password updated">
        <div ref={resultRef} tabIndex={-1} role="status" className="flex flex-col items-center text-center focus:outline-none">
          <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A8FF]/10 text-[#C9A8FF]">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm leading-relaxed text-[#F3F4F6]">Your password has been reset.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">Log in with your new password to get back to your projects.</p>
        </div>
        <Link to="/login" className={`${primaryButton} mt-6`}>
          Back to login
        </Link>
      </AuthLayout>
    );
  }

  /* ── Form ────────────────────────────────────────────────────────────── */
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a new password for your CodeMates account."
      footer={backToLogin}
    >
      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-400/30 bg-red-400/5 px-3.5 py-3">
          <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" />
          <p className="text-sm leading-relaxed text-red-200">
            {error.message}
            {error.tokenProblem && (
              <>
                {" "}
                <Link to="/forgot-password" className={`font-medium ${textLink}`}>
                  Request a new link
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
        <fieldset disabled={isLoading} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
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
              hint={showRules ? undefined : "Use 8+ characters with upper and lower case letters and a number."}
              {...bind("password")}
            />
            {showRules && (
              <ul id="reset-password-rules" aria-label="Password requirements" className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
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

      <p
        role="note"
        className="mt-6 rounded-lg border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-3.5 py-2.5 text-xs leading-relaxed text-[#9CA3AF]"
      >
        <span className="font-medium text-[#F3F4F6]">Demo mode.</span> The token isn't checked and no password is
        changed. Use ?token=expired in the URL to see the expired-link error.
      </p>
    </AuthLayout>
  );
}