/**
 * src/pages/ForgotPassword.jsx
 *
 * Forgot password page (/forgot-password). Renders inside PublicLayout, using
 * the same AuthLayout / AuthInput as Login and Register.
 *
 * ── Flow ──────────────────────────────────────────────────────────────────────
 *   Step 1 (form):  user enters email  → POST /api/auth/forgot-password
 *   Step 2 (code):  user enters the 8-digit code from the email here and
 *                   continues to /reset-password?email=...&code=...
 *                   (ResetPassword.jsx reads those params, pre-fills the form,
 *                   and the code is actually verified by the backend when the
 *                   new password is submitted).
 *
 * The user can also skip the code box and click the link in the email, which
 * opens the same /reset-password?email=...&code=... URL. And if they already
 * have a code, "I already have a code" on step 1 goes straight to
 * /reset-password.
 *
 * The forgot-password endpoint always succeeds and never reveals whether the
 * email is registered, so the success text doesn't confirm an account exists.
 * The message shown is the backend's own wording (ApiResponse.message).
 *
 * Data flow: ForgotPassword.jsx → useAuth() → authApi.js → POST /api/auth/forgot-password
 */

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, KeyRound, Loader2, Mail, MailCheck } from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import useAuth from "../hooks/useAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_RE = /^\d{8}$/;

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
  const navigate = useNavigate();

  // step 1
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { email, message } once requested

  // step 2
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeSubmitted, setCodeSubmitted] = useState(false);

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

  const codeError = !code
      ? "Enter the 8-digit code from your email."
      : !CODE_RE.test(code)
          ? "The code is exactly 8 digits."
          : undefined;
  const shownCodeError = codeTouched || codeSubmitted ? codeError : undefined;

  const sendCode = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await forgotPassword(trimmed);
      setResult({ email: trimmed, message: response?.message });
      setCode("");
      setCodeTouched(false);
      setCodeSubmitted(false);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (emailError) {
      document.getElementById("forgot-email")?.focus();
      return;
    }
    await sendCode();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setCodeSubmitted(true);
    if (codeError) {
      document.getElementById("forgot-code")?.focus();
      return;
    }
    // Hand off to the reset page; the backend verifies the code on final submit.
    const params = new URLSearchParams({ email: result.email, code });
    navigate(`/reset-password?${params.toString()}`);
  };

  const useDifferentEmail = () => {
    setResult(null);
    setError(null);
    setSubmitted(false);
    setTouched(false);
  };

  const backToLogin = (
      <Link to="/login" className={`inline-flex items-center gap-1.5 font-medium ${textLink}`}>
        <ArrowLeft size={14} aria-hidden="true" />
        Back to login
      </Link>
  );

  const errorBanner = error && (
      <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-400/30 bg-red-400/5 px-3.5 py-3"
      >
        <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" />
        <p className="text-sm leading-relaxed text-red-200">{error}</p>
      </div>
  );

  /* ── Step 2: enter the code ──────────────────────────────────────────── */
  if (result) {
    return (
        <AuthLayout title="Check your email" footer={backToLogin}>
          {errorBanner}

          <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-center text-center focus:outline-none">
          <span
              aria-hidden="true"
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A8FF]/10 text-[#C9A8FF]"
          >
            <MailCheck size={22} />
          </span>
            <p className="text-sm leading-relaxed text-[#F3F4F6]">
              A reset code has been requested for <span className="break-all font-semibold">{result.email}</span>.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#9CA3AF]">
              {result.message || "If an account exists for this email, the code will arrive shortly."} Enter the 8-digit
              code below, or click the link in the email. Check your spam folder if you don't see it.
            </p>
          </div>

          <form onSubmit={handleVerify} noValidate className="mt-6">
            <div className="flex flex-col gap-5">
              <AuthInput
                  id="forgot-code"
                  label="8-digit code"
                  type="text"
                  icon={KeyRound}
                  placeholder="12345678"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={8}
                  spellCheck={false}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  onBlur={() => setCodeTouched(true)}
                  error={shownCodeError}
                  hint={shownCodeError ? undefined : "The code expires in 15 minutes."}
              />

              <button type="submit" className={primaryButton}>
                Verify code
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-col gap-3">
            <button type="button" onClick={sendCode} disabled={isLoading} className={outlineButton}>
              {isLoading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {isLoading ? "Sending…" : "Resend code"}
            </button>
            <button type="button" onClick={useDifferentEmail} className={`${textLink} text-sm`}>
              Use a different email
            </button>
          </div>
        </AuthLayout>
    );
  }

  /* ── Step 1: request a code ──────────────────────────────────────────── */
  return (
      <AuthLayout
          title="Forgot your password?"
          subtitle="Enter the email you signed up with and we'll send you a code and a link to reset your password."
          footer={backToLogin}
      >
        {errorBanner}

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
              {isLoading ? "Sending code…" : "Send Reset Code"}
            </button>
          </fieldset>
        </form>

        <p className="mt-5 text-center text-sm text-[#9CA3AF]">
          Already have a code?{" "}
          <Link to="/reset-password" className={`font-medium ${textLink}`}>
            Enter it here
          </Link>
        </p>
      </AuthLayout>
  );
}