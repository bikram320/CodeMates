/**
 * src/pages/Login.jsx
 *
 * Login page (/login). Renders inside PublicLayout.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   Login.jsx → useAuth() → authApi.js → POST /api/auth/login (real backend)
 *
 * On success the backend sets httpOnly session cookies and returns
 * { userId, email, authProvider }; the page then navigates to the route the
 * user was sent from (location.state.from) or /dashboard.
 *
 * "Remember me" is kept as a UI checkbox but isn't sent anywhere: LoginRequest
 * has no such field, and cookie lifetimes are fixed server-side.
 *
 * There is no GitHub login button here: the provided AuthController has no
 * OAuth endpoint, so nothing was left to call. Re-add it once one exists.
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";

import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import useAuth from "../hooks/useAuth";

const DEFAULT_REDIRECT = "/dashboard";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ email, password }) {
  const errors = {};
  const trimmed = email.trim();
  if (!trimmed) errors.email = "Enter your email address.";
  else if (!EMAIL_RE.test(trimmed)) errors.email = "Enter a valid email address, like name@example.com.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

const primaryButton =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5 text-sm font-semibold " +
  "text-[#16171D] transition-colors hover:bg-[#8190FF] " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#6C7BFF] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]";

const textLink =
  "rounded text-[#C9A8FF] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? DEFAULT_REDIRECT;
  const { login } = useAuth();

  const [values, setValues] = useState({ email: "", password: "", remember: false });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const firstInvalid = ["email", "password"].find((f) => errors[f]);
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`)?.focus();
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setIsSubmitting(false);
    }
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

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          <AuthInput
            id="login-email"
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
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
            {isSubmitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Signing in…" : "Log in"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}