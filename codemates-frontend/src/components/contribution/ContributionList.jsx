import { Trophy } from "lucide-react";
import ContributionCard from "./ContributionCard";
import EmptyState from "../ui/EmptyState";

/**
 * Grid of per-member contribution cards, ranked by totalScore descending.
 *
 * Props:
 * - contributors  already-enriched, already-sorted contributor objects
 * - onSelect      optional (userId) => void — opens a per-user drilldown
 */
export default function ContributionList({ contributors = [], onSelect }) {
  if (contributors.length === 0) {
    return (
        <EmptyState
            icon={Trophy}
            title="No contributions yet"
            description="Once the team starts completing tasks, sending messages, or pushing commits, activity will show up here."
        />
    );
  }

  return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {contributors.map((contributor, index) => (
            <ContributionCard
                key={contributor.userId}
                rank={index + 1}
                {...contributor}
                onClick={onSelect ? () => onSelect(contributor.userId) : undefined}
            />
        ))}
      </div>
  );
}