import React from "react";
import { Users } from "lucide-react";
import { Freelancer, SortOption, SORT_OPTIONS } from "../../types/freelancer";
import { FreelancerCard, FreelancerCardSkeleton } from "./FreelancerCard";
import { cn } from "../../lib/utils";

const PAGE_SIZE = 9;

interface FreelancerGridProps {
  freelancers: Freelancer[];
  isLoading: boolean;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  onView: (id: string) => void;
  onInquire: (id: string) => void;
  page: number;
  onLoadMore: () => void;
}

export const FreelancerGrid: React.FC<FreelancerGridProps> = ({
  freelancers, isLoading, sort, onSortChange, onView, onInquire, page, onLoadMore,
}) => {
  const displayed = freelancers.slice(0, page * PAGE_SIZE);
  const hasMore = displayed.length < freelancers.length;

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-textMuted font-medium">
          {isLoading ? "Searching…" : `${freelancers.length} freelancer${freelancers.length !== 1 ? "s" : ""} found`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-textDisabled hidden sm:block">Sort:</span>
          <select
            id="freelancer-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <FreelancerCardSkeleton key={i} />)}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Users className="h-7 w-7 text-accent" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-base font-bold text-textPrimary">No freelancers found</h4>
            <p className="text-sm text-textMuted max-w-xs">Try adjusting your search or filter criteria.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {displayed.map((f, i) => (
              <FreelancerCard key={f.id} freelancer={f} index={i} sort={sort} onView={onView} onInquire={onInquire} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={onLoadMore}
                className={cn("rounded-xl border border-border px-6 py-2.5 text-sm font-bold text-textMuted hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all")}
                id="load-more-freelancers"
              >
                Load More ({freelancers.length - displayed.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
