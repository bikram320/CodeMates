/**
 * Responsive grid layout for developer cards.
 *
 * Deliberately decoupled from DeveloperCard's exact prop names (which
 * this file's author hasn't seen) via a renderCard render-prop — the
 * caller decides how each developer object maps onto <DeveloperCard />.
 *
 *   <DeveloperGrid
 *     developers={developers}
 *     renderCard={(dev) => <DeveloperCard key={dev.id} {...dev} />}
 *   />
 *
 * Props:
 * - developers  array of developer objects
 * - renderCard  (developer) => node
 */
export default function DeveloperGrid({ developers = [], renderCard, className = "" }) {
  return (
    <div
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${className}`}
    >
      {developers.map((developer) => renderCard(developer))}
    </div>
  );
}