import { Link } from "react-router-dom";

import { CapybaraMark } from "./AuthLayout";

/**
 * Split-screen auth layout for Login and Register only — a visual brand
 * panel on one side, the form on the other. ForgotPassword and ResetPassword
 * keep using the original centered AuthLayout unchanged; this is a separate
 * component rather than a mode on that one, to avoid touching pages outside
 * this redesign's scope.
 *
 * visualSide mirrors the panel: "right" for Login, "left" for Register.
 * illustrationSrc is which capybara illustration to show — Login and
 * Register each pass their own (see capybaraIndigoAsset.js).
 *
 * Below the lg breakpoint the visual panel is hidden entirely (a 50/50 split
 * doesn't work on a phone) and a small logo lockup takes its place at the
 * top of the form so branding isn't lost on mobile.
 */

const TAG_PILLS = ["React", "Spring Boot", "Kafka"];

function VisualPanel({ heading, tagline, illustrationSrc }) {
    return (
        <div
            className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between"
            style={{ background: "radial-gradient(120% 100% at 50% 0%, #241F52 0%, #14132A 55%, #0D0C12 100%)" }}
        >
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6C7BFF]/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#C9A8FF]/10 blur-3xl" />

            <div className="relative z-10 p-10 xl:p-14">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                >
                    <CapybaraMark className="h-8 w-auto" />
                    <span className="text-lg font-semibold text-[#F3F4F6]">CodeMates</span>
                </Link>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center px-10 xl:px-14">
                <img
                    src={illustrationSrc}
                    alt=""
                    aria-hidden="true"
                    className="w-full max-w-sm drop-shadow-[0_20px_60px_rgba(108,123,255,0.25)]"
                />
            </div>

            <div className="relative z-10 p-10 xl:p-14">
                <h2 className="text-2xl font-semibold leading-snug text-[#F3F4F6] xl:text-3xl">{heading}</h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#9CA3AF]">{tagline}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                    {TAG_PILLS.map((t) => (
                        <span
                            key={t}
                            className="rounded-full border border-[#6C7BFF]/30 bg-[#6C7BFF]/10 px-3 py-1 text-xs text-[#C9A8FF]"
                        >
              {t}
            </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SplitAuthLayout({
                                            visualSide = "right",
                                            visualHeading,
                                            visualTagline,
                                            illustrationSrc,
                                            title,
                                            subtitle,
                                            footer,
                                            children,
                                        }) {
    const visual = <VisualPanel heading={visualHeading} tagline={visualTagline} illustrationSrc={illustrationSrc} />;

    return (
        <div className="flex min-h-screen w-full flex-col lg:flex-row">
            {visualSide === "left" && visual}

            <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14 lg:w-1/2 lg:px-12 xl:px-20">
                <Link
                    to="/"
                    className="mb-8 inline-flex items-center gap-2.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60 lg:hidden"
                >
                    <CapybaraMark className="h-8 w-auto" />
                    <span className="text-lg font-semibold text-[#9CA3AF]">CodeMates</span>
                </Link>

                <div className="w-full max-w-sm">
                    <h1 className="text-2xl font-semibold text-[#F3F4F6] sm:text-3xl">{title}</h1>
                    {subtitle && <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{subtitle}</p>}

                    <div className="mt-7">{children}</div>

                    {footer && <p className="mt-6 text-sm text-[#9CA3AF]">{footer}</p>}
                </div>
            </div>

            {visualSide === "right" && visual}
        </div>
    );
}