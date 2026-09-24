import { Link } from "react-router-dom";
import codemateIcon from "src/assets/logo.png";



const SIZES = {
  sm: { icon: "h-7", text: "text-lg", gap: "gap-2.5" },
  md: { icon: "h-9", text: "text-xl", gap: "gap-3" },
  lg: { icon: "h-11", text: "text-2xl", gap: "gap-3.5" },
};

export default function Logo({ size = "md", showText = true, className = "" }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <Link
      to="/"
      aria-label="CodeMates — go to homepage"
      className={`inline-flex items-center rounded-md ${s.gap} ${className}`}
    >
      <img
        src={codemateIcon}
        alt=""
        aria-hidden="true"
        className={`${s.icon} w-auto shrink-0 object-contain`}
      />

      {showText ? (
        <span
          className={`${s.text} font-semibold tracking-tight text-[var(--cm-text)]`}
        >
          Code<span className="text-[var(--cm-indigo)]">Mates</span>
        </span>
      ) : (
        <span className="sr-only">CodeMates</span>
      )}
    </Link>
  );
}