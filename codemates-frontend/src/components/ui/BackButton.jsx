import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ label = "Back", onClick, className = "" }) {
  const navigate = useNavigate();

  const handleClick = (event) => {
    onClick?.(event);
    navigate(-1);
  };

  return (
<<<<<<< Updated upstream
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm text-[var(--cm-text-dim)] transition-colors hover:text-[var(--cm-text)] ${className}`}
    >
      <ArrowLeft size={16} />
      {label}
    </button>
=======
      <button
          type="button"
          onClick={handleClick}
         className={`inline-flex cursor-pointer items-center gap-2 text-sm text-[#6B7280] transition-colors hover:text-[#16171D] ${className}`}
      >
        <ArrowLeft size={16} />
        {label}
      </button>
>>>>>>> Stashed changes
  );
}