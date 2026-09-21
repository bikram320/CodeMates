/**
 * src/pages/Login.jsx
 *
 * Login page (/login). Renders inside PublicLayout.
 *
 * ⚠️ MOCK BEHAVIOR ONLY. No real authentication happens: nothing is sent
 * anywhere, no token or cookie is stored, and "remember me" is ignored.
 *   - demo@codemates.dev / password123 → succeeds
 *   - any other valid email + password → "Incorrect email or password"
 *   - "Continue with GitHub" → succeeds as the demo user
 *   - ?mockAuth=error in the URL → simulates the service being unreachable
 *
 * On success the page navigates to the route the user was sent from
 * (location.state.from) or /dashboard. Replace mockLogin() with the real
 * calls when auth is built.
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import AuthDivider from "../components/auth/AuthDivider";

const DEFAULT_REDIRECT = "/dashboard";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── Mock auth ───────────────────────────────────────────────────────────── */

const DEMO_ACCOUNT = { email: "demo@codemates.dev", password: "password123" };

const authError = (message, status) => Object.assign(new Error(message), { status });

function mockLogin({ email, password }, method) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const forced = new URLSearchParams(window.location.search).get("mockAuth") === "error";
      if (forced) {
        return reject(authError("We couldn't reach CodeMates. Check your connection and try again.", 503));
      }
      const ok =
        method === "github" ||
        (email.trim().toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password);
      if (!ok) return reject(authError("Incorrect email or password. Check your details and try again.", 401));
      resolve({ user: { id: "user-uuid-001", name: "Demo Developer", email: DEMO_ACCOUNT.email } });
    }, 900);
  });
}

/* ── Validation ──────────────────────────────────────────────────────────── */

function validate({ email, password }) {
  const errors = {};
  const trimmed = email.trim();
  if (!trimmed) errors.email = "Enter your email address.";
  else if (!EMAIL_RE.test(trimmed)) errors.email = "Enter a valid email address, like name@example.com.";
  if (!password) errors.password = "Enter your password.";
  return errors;
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
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#9CA3AF] disabled:hover:bg-transparent " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const textLink =
  "rounded text-[#C9A8FF] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60";

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? DEFAULT_REDIRECT;

  const [values, setValues] = useState({ email: "", password: "", remember: false });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(null); // null | "password" | "github"
  const [error, setError] = useState(null);

  const isBusy = pending !== null;
  const errors = validate(values);
  const errorFor = (field) => ((touched[field] || submitted) ? errors[field] : undefined);

  const bind = (field) => ({
    value: values[field],
    onChange: (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setError(null);
    },
    onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
  });

  const signIn = async (method) => {
    setError(null);
    setPending(method);
    try {
      await mockLogin(values, method);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setPending(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    const firstInvalid = ["email", "password"].find((f) => errors[f]);
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`)?.focus();
      return;
    }
    signIn("password");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where your team left off."
      footer={
        <>
          New to CodeMates?{" "}
          <Link to="/register" className={`font-medium ${textLink}`}>
            Create an account
          </Link>
        </>
      }
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

      <form onSubmit={handleSubmit} noValidate aria-busy={pending === "password"}>
        <fieldset disabled={isBusy} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <AuthInput
            id="login-email"
            label="Email"
            type="email"
            icon={Mail}
            placeholder="Enter your email address"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            error={errorFor("email")}
            {...bind("email")}
          />

          <AuthInput
            id="login-password"
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errorFor("password")}
            {...bind("password")}
          />

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#9CA3AF]">
              <input
                type="checkbox"
                checked={values.remember}
                onChange={(e) => setValues((v) => ({ ...v, remember: e.target.checked }))}
                className="h-4 w-4 cursor-pointer rounded border-[#9CA3AF] bg-transparent accent-[#6C7BFF]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className={`text-sm ${textLink}`}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className={primaryButton}>
            {pending === "password" && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {pending === "password" ? "Signing in…" : "Log in"}
          </button>
        </fieldset>
      </form>

      <AuthDivider className="my-6" />

      <button type="button" onClick={() => signIn("github")} disabled={isBusy} className={outlineButton}>
        {pending === "github" ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <FaGithub size={16} aria-hidden="true" />
        )}
        {pending === "github" ? "Connecting to GitHub…" : "Continue with GitHub"}
      </button>

      <p
        role="note"
        className="mt-6 rounded-lg border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-3.5 py-2.5 text-xs leading-relaxed text-[#9CA3AF]"
      >
        <span className="font-medium text-[#F3F4F6]">Demo mode.</span> Nothing is sent anywhere. Log in with{" "}
        {DEMO_ACCOUNT.email} and {DEMO_ACCOUNT.password}, or use GitHub.
      </p>
    </AuthLayout>
  );
}