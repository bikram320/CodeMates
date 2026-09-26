/**
 * src/pages/Login.jsx
 *
 * Login page (/login). Renders inside PublicLayout, using SplitAuthLayout
 * (visual panel on the right — Register mirrors it on the left).
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
 * GitHub is a real, separate flow, not a fetch call: the button is a plain
 * <a href={GITHUB_AUTH_URL}> that navigates the browser away entirely (see
 * authApi.js's comment on GITHUB_AUTH_URL for the full redirect chain). If it
 * fails, GithubAuthController redirects back to frontend.oauth-failure-redirect
 * with ?error=state_mismatch|no_verified_email|oauth_failed — where that
 * lands in this app isn't visible from the frontend, so this page checks for
 * that query param on mount defensively, in case it's here.
 *
 * NOTE: lucide-react no longer ships brand/logo icons (Github, Linkedin,
 * etc.) as of recent versions — they were removed from the core icon set.
 * The GitHub icon below comes from react-icons instead (npm install react-icons).
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { FaGithub } from "react-icons/fa";

import SplitAuthLayout from "../components/auth/SplitAuthLayout.jsx";
import { CAPYBARA_WORKING_DATA_URI } from "../components/auth/capybaraIndegoAsset.js";
import AuthInput from "../components/auth/AuthInput";
import AuthDivider from "../components/auth/AuthDivider";
import useAuth from "../hooks/useAuth";
import { GITHUB_AUTH_URL } from "../api/authApi";

const DEFAULT_REDIRECT = "/dashboard";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const OAUTH_ERROR_MESSAGES = {
  state_mismatch: "Something went wrong verifying that GitHub sign-in. Please try again.",
  no_verified_email: "Your GitHub account needs a verified email address to sign in with GitHub. Verify one on GitHub, then try again.",
  oauth_failed: "We couldn't complete GitHub sign-in. Please try again.",
};

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

const outlineButton =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#9CA3AF] px-4 py-2.5 text-sm font-medium " +
    "text-[#F3F4F6] transition-colors hover:border-[#C9A8FF] hover:bg-white/[0.03] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const textLink =
    "rounded text-[#C9A8FF] transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]/60";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? DEFAULT_REDIRECT;
  const { login } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const [values, setValues] = useState({ email: "", password: "", remember: false });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // A GitHub OAuth failure may land back here with ?error=... — show it once,
  // then drop it from the URL so a refresh doesn't keep re-showing it.
  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    setError(OAUTH_ERROR_MESSAGES[code] || "GitHub sign-in didn't complete. Please try again.");
    const next = new URLSearchParams(searchParams);
    next.delete("error");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <SplitAuthLayout
          visualSide="right"
          visualHeading="Ship it together."
          visualTagline="CodeMates brings developer networking, team formation, project workspaces, and contribution tracking into one place — instead of five disconnected tools."
          illustrationSrc={CAPYBARA_WORKING_DATA_URI}
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

        <AuthDivider className="my-6" />

        {/* Plain <a>, not a button/onClick — this has to be a real page
          navigation, per GithubAuthController's own comment. */}
        <a href={GITHUB_AUTH_URL} className={outlineButton}>
          <FaGithub size={16} aria-hidden="true" />
          Continue with GitHub
        </a>
      </SplitAuthLayout>
  );
}