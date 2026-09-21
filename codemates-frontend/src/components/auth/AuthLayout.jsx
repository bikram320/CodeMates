import { Link } from "react-router-dom";

/**
 * Content wrapper for public auth pages (Login, Register, Forgot password).
 *
 * Renders inside the existing PublicLayout, so it draws no header or footer
 * of its own: just the brand lockup, a heading, an outlined card (same
 * 1px #9CA3AF outline the landing page cards use) and an optional line below.
 */

// Capybara mark traced from the footer logo on the landing page.
// Swap it for your real logo asset/component by passing the `logo` prop.
export function CapybaraMark({ className = "h-9 w-auto" }) {
  return (
    <svg viewBox="0 0 44 28" className={className} role="img" aria-label="CodeMates capybara logo">
      <path
        fill="#495AF7"
        fillRule="evenodd"
        d="M17.5 25.5Q17.1 25.9 9.9 25.9Q2.7 25.9 2.3 25.5Q2.0 25.1 2.0 23.4Q2.0 21.7 3.1 19.0Q4.1 16.4 5.6 14.5Q7.0 12.6 10.3 9.7Q13.6 6.8 13.6 6.5Q13.7 6.2 13.4 5.5Q13.1 4.7 13.5 4.1Q13.9 3.5 14.2 3.3Q14.6 3.0 15.1 3.0Q15.7 3.0 16.6 3.3Q17.5 3.7 18.1 2.9Q18.7 2.2 19.6 2.1Q20.6 1.9 21.1 2.1Q21.5 2.3 22.0 3.1Q22.5 3.8 23.9 3.9Q25.4 4.1 26.0 4.4Q26.7 4.8 27.6 5.0Q28.6 5.1 30.0 5.8Q31.4 6.5 31.9 7.0Q32.4 7.5 32.7 9.3Q32.9 11.1 32.7 11.6Q32.4 12.1 31.4 13.0Q30.4 13.9 29.7 14.3Q29.0 14.7 27.5 14.9Q25.9 15.2 25.0 16.1Q24.1 17.1 23.7 18.2Q23.3 19.3 23.3 19.7Q23.4 20.1 23.8 20.9Q24.2 21.6 25.3 22.3Q26.3 22.9 26.4 23.3Q26.5 23.8 24.1 23.9Q21.7 24.0 21.1 24.4Q20.6 24.8 19.3 24.9Q18.0 25.0 17.5 25.5ZM23.5 7.8Q24.0 7.9 24.3 7.8Q24.5 7.6 24.4 7.3Q24.3 7.1 23.5 7.2Q22.8 7.3 22.9 7.5Q23.0 7.8 23.5 7.8ZM38.1 25.6Q37.6 25.9 30.0 25.9Q22.4 26.0 22.0 25.9Q21.5 25.8 21.4 25.6Q21.2 25.3 21.5 25.1Q21.8 25.0 24.0 24.9Q26.2 24.9 26.8 24.5Q27.4 24.1 29.5 20.1Q31.5 16.1 36.5 16.1Q41.4 16.1 41.7 16.4Q42.0 16.8 41.9 17.6Q41.8 18.3 40.2 21.8Q38.7 25.2 38.1 25.6ZM34.5 22.0Q34.8 22.2 35.4 21.7Q36.0 21.2 35.9 20.9Q35.9 20.5 35.7 20.3Q35.4 20.1 35.0 20.1Q34.5 20.2 34.3 20.5Q34.1 20.8 34.1 21.4Q34.1 21.9 34.5 22.0Z"
      />
    </svg>
  );
}

export default function AuthLayout({ title, subtitle, footer, logo, children }) {
  return (
    <div className="auth-layout flex w-full justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            to="/"
            aria-label="CodeMates home"
            className="mb-6 inline-flex items-center gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            {logo ?? <CapybaraMark />}
            <span className="text-xl font-semibold text-[#9CA3AF]">CodeMates</span>
          </Link>
          <h1 className="text-2xl font-semibold text-[#F3F4F6] sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{subtitle}</p>}
        </div>

        <div className="rounded-xl border border-[#9CA3AF] p-5 sm:p-8">{children}</div>

        {footer && <p className="mt-6 text-center text-sm text-[#9CA3AF]">{footer}</p>}
      </div>
    </div>
  );
}