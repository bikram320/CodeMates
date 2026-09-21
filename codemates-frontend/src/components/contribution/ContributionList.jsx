import { Trophy } from "lucide-react";
import ContributionCard from "./ContributionCard";
import EmptyState from "../ui/EmptyState";

/**
 * Grid of per-member contribution cards, ranked by totalScore descending
 * (matches the real leaderboard endpoint's ordering — highest first).
 *
 * Props:
 * - contributors  already-enriched, already-sorted contributor objects
 *                 (see ContributionCard for the shape)
 */
export default function ContributionList({ contributors = [] }) {
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
        <ContributionCard key={contributor.userId} rank={index + 1} {...contributor} />
      ))}
    </div>
  );
}