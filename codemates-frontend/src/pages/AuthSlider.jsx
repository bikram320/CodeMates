import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import LoginForm from "./LoginForm.jsx";
import RegisterForm from "./RegisterForm.jsx";

import hardworkingCapybara from "../assets/hardworking_capybara.jpg";
import suitCapybara from "../assets/suit_capybara.jpg";

// IMAGE_WHEN_LOGIN: right panel while LOGIN shows. IMAGE_WHEN_REGISTER: left panel while REGISTER shows.
const IMAGE_WHEN_LOGIN = hardworkingCapybara;
const IMAGE_WHEN_REGISTER = suitCapybara;

// Scales everything inside the forms (including AuthInput) without touching its code.
const CONTENT_SCALE = 0.85;

const OAUTH_ERROR_MESSAGES = {
  state_mismatch: "Something went wrong verifying that GitHub sign-in. Please try again.",
  no_verified_email: "Your GitHub account needs a verified email address to sign in with GitHub. Verify one on GitHub, then try again.",
  oauth_failed: "We couldn't complete GitHub sign-in. Please try again.",
};

/** One form half. The inactive half sits under the sliding panel, so make it inert. */
function Panel({ side, active, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.inert = !active;
  }, [active]);

  return (
    <section
      ref={ref}
      aria-hidden={!active}
      className={`${active ? "flex" : "hidden md:flex"} flex-col md:absolute md:top-0 md:h-full md:w-1/2 md:overflow-y-auto
        ${side === "left" ? "md:left-0" : "md:right-0"}`}
    >
      <div style={{ zoom: CONTENT_SCALE }} className="mx-auto my-auto w-full max-w-md px-6 py-8 md:px-10 [&_label]:!text-[#16171D]">
        {children}
      </div>
    </section>
  );
}

function PanelCopy({ visible, image, heading, tagline, cta, onClick }) {
  return (
    <div
      aria-hidden={!visible}
      className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none
        ${visible ? "opacity-100 delay-200" : "pointer-events-none opacity-0"}`}
    >
      <img
        src={image}
        alt=""
        onError={(e) => { e.currentTarget.style.display = "none"; }}
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      {/* Scrim keeps the text readable over the image */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#16171D]/95 via-[#16171D]/60 to-transparent" />
      <div className="relative flex h-full flex-col items-center justify-end gap-3 px-10 pb-10 text-center">
        <h2 className="text-xl font-bold leading-tight text-[#F3F4F6]" style={{ color: "#F3F4F6" }}>{heading}</h2>
        <p className="max-w-sm text-[13px] leading-relaxed text-[#D1D5DB]">{tagline}</p>
        <button
          type="button"
          onClick={onClick}
          tabIndex={visible ? 0 : -1}
          className="mt-1 rounded-lg border border-[#F3F4F6]/70 bg-[#16171D]/40 px-7 py-2 text-sm font-medium text-[#F3F4F6] backdrop-blur-sm
                     transition-colors hover:border-[#C9A8FF] hover:bg-[#16171D]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

export default function AuthSlider() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const pathMode = location.pathname.startsWith("/register") ? "register" : "login";
  const [mode, setMode] = useState(pathMode);
  const [oauthError, setOauthError] = useState(null);

  // Follow the URL when something else navigates here.
  useEffect(() => setMode(pathMode), [pathMode]);

  // GitHub OAuth failures land here with ?error=... — capture once, then clean the URL.
  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    setOauthError(OAUTH_ERROR_MESSAGES[code] || "GitHub sign-in didn't complete. Please try again.");
    const next = new URLSearchParams(searchParams);
    next.delete("error");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTo = (next) => {
    setMode(next);
    navigate(`/${next}`, { replace: true, state: location.state });
  };

  const isRegister = mode === "register";

  return (
    <main className="fixed inset-0 z-[100] overflow-y-auto bg-white">
     <div className="flex min-h-full items-center justify-center p-4 md:p-6">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-[#16171D]/10 bg-white shadow-2xl shadow-black/15 md:h-[min(720px,calc(100vh-3rem))]">
        <Panel side="left" active={!isRegister}>
          <LoginForm oauthError={oauthError} onSwitch={() => switchTo("register")} />
        </Panel>

        <Panel side="right" active={isRegister}>
          <RegisterForm oauthError={oauthError} onSwitch={() => switchTo("login")} />
        </Panel>

        {/* Sliding image panel (desktop only). Login mode: parked right. Register mode: slides left. */}
        <div
          className={`pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-1/2 transition-transform duration-700 ease-in-out motion-reduce:transition-none md:block
            ${isRegister ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="pointer-events-auto relative h-full w-full overflow-hidden bg-[#1B1C24]">
            <PanelCopy
              visible={isRegister}
              image={IMAGE_WHEN_REGISTER}
              heading="Ship it together."
              tagline="CodeMates brings developer networking, team formation, project workspaces, and contribution tracking into one place — instead of five disconnected tools."
              cta="Log in"
              onClick={() => switchTo("login")}
            />
            <PanelCopy
              visible={!isRegister}
              image={IMAGE_WHEN_LOGIN}
              heading="Find your team. Build the project."
              tagline="CodeMates helps developers find collaborators, form teams, communicate in real time, and track progress — all in one place."
              cta="Create an account"
              onClick={() => switchTo("register")}
            />
          </div>
        </div>
      </div>
     </div>
    </main>
  );
}