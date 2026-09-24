/**
 * src/pages/ForgotPassword.jsx
 *
 * Forgot password page (/forgot-password). Renders inside PublicLayout, using
 * the same AuthLayout / AuthInput as Login and Register.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   ForgotPassword.jsx → useAuth() → authApi.js → POST /api/auth/forgot-password
 *
 * The endpoint always succeeds and never reveals whether the email is
 * registered — that's true of the real backend, not a mock behavior, so the
 * success text below doesn't confirm an account exists either. The success
 * message shown is the backend's own wording (ApiResponse.message), not text
 * written here, so it stays correct if that copy changes server-side.
 *
 * No reset email is actually sent by anything in this frontend; whether/how
 * the backend sends one isn't visible in the files provided.
 *
 * The emailed link would open /reset-password?token=…, which calls
 * POST /api/auth/reset-password { token, newPassword }.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import useAuth from "../hooks/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5 text-sm font-semibold " +
  "text-[#16171D] transition-colors hover:bg-[#8190FF] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]";

const outlineButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#9CA3AF] px-4 py-2.5 text-sm font-medium " +
  "text-[#F3F4F6] transition-colors hover:border-[#C9A8FF] hover:bg-white/[0.03] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const textLink =
  "rounded text-[#C9A8FF] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { email, message } once requested

  const successRef = useRef(null);
  useEffect(() => {
    if (result) successRef.current?.focus(); // announce the result to keyboard/screen-reader users
  }, [result]);

  const trimmed = email.trim();
  const emailError = !trimmed
    ? "Enter your email address."
    : !EMAIL_RE.test(trimmed)
    ? "Enter a valid email address, like name@example.com."
    : undefined;
  const shownError = touched || submitted ? emailError : undefined;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (emailError) {
      document.getElementById("forgot-email")?.focus();
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await forgotPassword(trimmed);
      setResult({ email: trimmed, message: response?.message });
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const useDifferentEmail = () => {
    setResult(null);
    setSubmitted(false);
    setTouched(false);
  };

  const backToLogin = (
    <Link to="/login" className={`inline-flex items-center gap-1.5 font-medium ${textLink}`}>
      <ArrowLeft size={14} aria-hidden="true" />
      Back to login
    </Link>
  );

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (result) {
    return (
      <AuthLayout title="Check your email" footer={backToLogin}>
        <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-center text-center focus:outline-none">
          <span
            aria-hidden="true"
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A8FF]/10 text-[#C9A8FF]"
          >
            <MailCheck size={22} />
          </span>
          <p className="text-sm leading-relaxed text-[#F3F4F6]">
            A password reset link has been requested for <span className="break-all font-semibold">{result.email}</span>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]">
            {result.message || "If an account exists for this email, the link will arrive shortly."} Check your spam
            folder if you don't see it.
          </p>
        </div>

        <button type="button" onClick={useDifferentEmail} className={`${outlineButton} mt-6`}>
          Use a different email
        </button>
      </AuthLayout>
    );
  }

  /* ── Form ────────────────────────────────────────────────────────────── */
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a link to reset your password."
      footer={backToLogin}
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-400/30 bg-red-400/5 px-3.5 py-3"
        >
          <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" />
          <p className="text-sm leading-relaxed text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
        <fieldset disabled={isLoading} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <AuthInput
            id="forgot-email"
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onBlur={() => setTouched(true)}
            error={shownError}
          />

          <button type="submit" className={primaryButton}>
            {isLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isLoading ? "Sending link…" : "Send Reset Link"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}