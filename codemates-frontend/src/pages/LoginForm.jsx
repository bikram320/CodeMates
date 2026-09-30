import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import AuthInput from "../components/auth/AuthInput";
import AuthDivider from "../components/auth/AuthDivider";
import useAuth from "../hooks/useAuth";
import { GITHUB_AUTH_URL } from "../api/authApi";
import { primaryButton, outlineButton, textLink } from "./authStyles.js";

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

export default function LoginForm({ oauthError, onSwitch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? DEFAULT_REDIRECT;
  const { login } = useAuth();

  const [values, setValues] = useState({ email: "", password: "", remember: false });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (oauthError) setError(oauthError);
  }, [oauthError]);

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
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-[#16171D]" style={{ color: "#16171D" }}>Welcome back</h1>
        <p className="mt-1.5 text-sm text-[#6B7280]">Log in to pick up where your team left off.</p>
      </header>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-400/30 bg-red-400/5 px-3.5 py-3">
          <AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm leading-relaxed text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
          <AuthInput
            id="login-email" label="Email" type="email" icon={Mail} placeholder="Enter email"
            autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
            error={errorFor("email")} {...bind("email")}
          />
          <AuthInput
            id="login-password" label="Password" type="password" icon={Lock} placeholder="Enter your password"
            autoComplete="current-password" error={errorFor("password")} {...bind("password")}
          />

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-[#6B7280]">
              <input
                type="checkbox" checked={values.remember}
                onChange={(e) => setValues((v) => ({ ...v, remember: e.target.checked }))}
                className="h-4 w-4 cursor-pointer rounded border-[#6B7280] bg-transparent accent-[#6C7BFF]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className={`whitespace-nowrap text-sm ${textLink}`}>Forgot password?</Link>
          </div>

          <button type="submit" className={primaryButton}>
            {isSubmitting && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Signing in…" : "Log in"}
          </button>
        </fieldset>
      </form>

      <AuthDivider className="my-6" />

      {/* Plain <a>: must be a real page navigation, per GithubAuthController. */}
      <a href={GITHUB_AUTH_URL} className={outlineButton}>
        <FaGithub size={16} aria-hidden="true" />
        Continue with GitHub
      </a>

      {/* The overlay handles switching on desktop; this covers mobile. */}
      <p className="mt-6 text-center text-sm text-[#6B7280] md:hidden">
        New to CodeMates?{" "}
        <button type="button" onClick={onSwitch} className={`font-medium ${textLink}`}>Create an account</button>
      </p>
    </>
  );
}