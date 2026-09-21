import SearchBar from "../ui/SearchBar";

/**
 * Search control for the accepted-connections list. Kept as its own
 * component (rather than inlining SearchBar directly in the page) so a
 * skill/role filter can be added here later without touching
 * Connections.jsx.
 *
 * Props:
 * - search          string
 * - onSearchChange  (string) => void
 */
export default function ConnectionFilters({ search, onSearchChange }) {
  return (
    <SearchBar
      value={search}
      onChange={onSearchChange}
      placeholder="Search your connections..."
    />
  );
}