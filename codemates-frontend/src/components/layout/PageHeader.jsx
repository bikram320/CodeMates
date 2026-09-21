import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";


export default function PageHeader({
  title,
  description,
  action = null,
  breadcrumbs = [],
  meta = null,
  divider = true,
  className = "",
}) {
  return (
    <div
      className={`pb-5 ${
        divider ? "border-b border-[var(--cm-border)]" : ""
      } ${className}`}
    >
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--cm-muted)]">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  <li>
                    {crumb.to && !isLast ? (
                      <Link
                        to={crumb.to}
                        className="transition-colors hover:text-[var(--cm-text-dim)]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={isLast ? "text-[var(--cm-text-dim)]" : ""}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                  {!isLast && (
                    <li aria-hidden="true" className="flex items-center">
                      <ChevronRight size={13} />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cm-text)]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--cm-text-dim)]">
              {description}
            </p>
          )}
          {meta && <div className="mt-3">{meta}</div>}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}