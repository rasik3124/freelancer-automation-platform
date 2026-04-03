import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, ExternalLink, Clock } from "lucide-react";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FreelancerRecommendation {
  id: string;
  name: string;
  title: string;
  skills: string[];
  matchScore: number;
  rating: number;
  reviews: number;
  hourlyRate: number;
  availability: string;
  avatarInitials: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const RecommendationSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-border p-5 space-y-4" style={{ backgroundColor: "#111111" }}>
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-full bg-elevated" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded-full bg-elevated" />
        <div className="h-3 w-36 rounded-full bg-elevated" />
      </div>
      <div className="h-6 w-12 rounded-full bg-elevated" />
    </div>
    <div className="flex gap-1.5">
      {[60, 48, 56].map((w) => (
        <div key={w} className="h-5 rounded-full bg-elevated" style={{ width: w }} />
      ))}
    </div>
    <div className="flex justify-between">
      <div className="h-3 w-20 rounded-full bg-elevated" />
      <div className="h-3 w-16 rounded-full bg-elevated" />
    </div>
  </div>
);

// ─── Single recommendation card ───────────────────────────────────────────────

const RecommendationCard: React.FC<{
  rec: FreelancerRecommendation;
  index: number;
}> = ({ rec, index }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
    className="group rounded-2xl border border-border p-5 space-y-4 transition-all duration-200 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 cursor-pointer"
    style={{ backgroundColor: "#111111" }}
  >
    {/* Header: avatar + name + match badge */}
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-accent/20 text-sm font-bold text-accent">
        {rec.avatarInitials}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold text-textPrimary">
          {rec.name}
        </span>
        <span className="truncate text-xs text-textMuted">{rec.title}</span>
      </div>
      <div
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black",
          rec.matchScore >= 90
            ? "bg-success/10 text-success"
            : rec.matchScore >= 80
            ? "bg-accent/10 text-accent"
            : "bg-elevated text-textMuted"
        )}
      >
        {rec.matchScore}%
      </div>
    </div>

    {/* Skills */}
    <div className="flex flex-wrap gap-1.5">
      {rec.skills.slice(0, 4).map((skill) => (
        <span
          key={skill}
          className="rounded-full border border-border bg-elevated px-2 py-0.5 text-[10px] font-medium text-textMuted"
        >
          {skill}
        </span>
      ))}
    </div>

    {/* Footer: rating + rate + availability */}
    <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-gold">
          <Star className="h-3 w-3 fill-gold" />
          <span className="font-bold text-textPrimary">{rec.rating}</span>
          <span className="text-textDisabled">({rec.reviews})</span>
        </span>
        <span className="font-semibold text-textPrimary">${rec.hourlyRate}/hr</span>
      </div>
      <span className="flex items-center gap-1 text-textDisabled">
        <Clock className="h-3 w-3" />
        {rec.availability}
      </span>
    </div>

    {/* CTA (shows on hover) */}
    <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 py-2 text-xs font-bold text-accent opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-accent/10">
      View Profile <ExternalLink className="h-3 w-3" />
    </button>
  </motion.div>
);

// ─── AIRecommendations ────────────────────────────────────────────────────────

/**
 * AIRecommendations — 3 freelancer match cards from GET /api/dashboard/ai-recommendations.
 * Skeleton while loading, error state if fetch fails.
 */
export const AIRecommendations: React.FC = () => {
  const [recs, setRecs] = useState<FreelancerRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<{ data: FreelancerRecommendation[] }>(
          "/api/dashboard/ai-recommendations"
        );
        if (mounted) setRecs(res.data.data);
      } catch {
        if (mounted) setError("Could not load recommendations.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-textPrimary">
          AI Freelancer Matches
        </h3>
        <button className="text-xs font-bold text-accent hover:underline">
          Browse all →
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <RecommendationSkeleton key={i} />)}
        </div>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((rec, i) => (
            <RecommendationCard key={rec.id} rec={rec} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};
