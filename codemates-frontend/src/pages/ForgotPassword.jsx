/**
 * src/pages/ForgotPassword.jsx
 *
 * Forgot password page (/forgot-password). Renders inside PublicLayout, using
 * the same AuthLayout / AuthInput as Login and Register.
 *
 * ⚠️ MOCK BEHAVIOR ONLY. No email is sent and nothing leaves the browser.
 * Any valid email "succeeds". ?mockAuth=error in the URL simulates the
 * service being unreachable.
 *
 * ── Going live later ──────────────────────────────────────────────────────────
 *   Replace mockRequestPasswordReset() with POST /api/auth/forgot-password
 *   { email }. The backend always returns success whether or not the email is
 *   registered, so the success message must not confirm an account exists
 *   (it says "if an account exists…" for that reason).
 *   The emailed link should open a reset page that calls
 *   POST /api/auth/reset-password { token, newPassword }. That page isn't built yet.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── Mock request ────────────────────────────────────────────────────────── */

function mockRequestPasswordReset() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("mockAuth") === "error") {
        return reject(Object.assign(new Error("We couldn't reach CodeMates. Check your connection and try again."), { status: 503 }));
      }
      resolve(null); // mirrors the real endpoint: always succeeds
    }, 1000);
  });
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

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

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sentTo, setSentTo] = useState(null); // the email the request was made for

  const successRef = useRef(null);
  useEffect(() => {
    if (sentTo) successRef.current?.focus(); // announce the result to keyboard/screen-reader users
  }, [sentTo]);

  const trimmed = email.trim();
  const emailError = !trimmed
    ? "Enter your email address."
    : !EMAIL_RE.test(trimmed)
    ? "Enter a valid email address."
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
      await mockRequestPasswordReset(trimmed);
      setSentTo(trimmed);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const useDifferentEmail = () => {
    setSentTo(null);
    setSubmitted(false);
    setTouched(false);
  };

  const backToLogin = (
    <Link to="/login" className={`inline-flex items-center gap-1.5 font-medium ${textLink}`}>
      <ArrowLeft size={14} aria-hidden="true" />
      Back to login
    </Link>
  );

  const demoNote = (
    <p
      role="note"
      className="mt-6 rounded-lg border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-3.5 py-2.5 text-xs leading-relaxed text-[#9CA3AF]"
    >
      <span className="font-medium text-[#F3F4F6]">Demo mode.</span> No email is sent. Any valid address shows the
      success screen.
    </p>
  );

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (sentTo) {
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
            A password reset link has been requested for <span className="break-all font-semibold">{sentTo}</span>.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]">
            If an account exists for this email, the link will arrive in a few minutes. Check your spam folder if you
            don't see it.
          </p>
        </div>

        <button type="button" onClick={useDifferentEmail} className={`${outlineButton} mt-6`}>
          Use a different email
        </button>

        {demoNote}
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
            placeholder="Enter your email address"
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

      {demoNote}
    </AuthLayout>
  );
}