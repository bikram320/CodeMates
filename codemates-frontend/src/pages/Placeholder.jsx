import PageHeader from "src/components/layout/PageHeader";


export default function Placeholder({ title, description, note }) {
  return (
    <div className="placeholder-page">
      <PageHeader title={title} description={description} />
      <div className="mt-6 rounded-lg border border-dashed border-[var(--cm-border-strong)] p-8 text-center">
        <p className="text-sm text-[var(--cm-muted)]">
          "{title}" page not built yet.
        </p>
        {note && (
          <p className="mt-1 text-xs text-[var(--cm-muted)]">{note}</p>
        )}
      </div>
    </div>
  );
}