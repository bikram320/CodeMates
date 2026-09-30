import { useState, useEffect } from "react";

export default function Avatar({ name = "", src = "", size = 36, className = "" }) {
  const [failed, setFailed] = useState(false);

  // If the src changes (e.g. list refetch), give the new image a chance to load
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const initials = name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  const showImage = src && !failed;

  return (
      <span
          aria-hidden="true"
          style={{ width: size, height: size }}
          className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--cm-indigo-soft)] text-xs font-medium text-[var(--cm-lavender)] ${className}`}
      >
      {showImage ? (
          <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setFailed(true)}
          />
      ) : (
          initials || "?"
      )}
    </span>
  );
}