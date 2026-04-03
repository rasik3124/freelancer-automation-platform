import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, MapPin, Clock, ExternalLink, Send } from "lucide-react";
import {
  Freelancer, AVAILABILITY_COLOR, AVAILABILITY_LABELS, SortOption,
} from "../../types/freelancer";
import { cn } from "../../lib/utils";

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-accent to-violet-600", "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-400", "from-orange-500 to-pink-500",
];
const avatarGradient = (id: string) => AVATAR_GRADIENTS[id.charCodeAt(id.length - 1) % AVATAR_GRADIENTS.length];

// ─── Stars ────────────────────────────────────────────────────────────────────

const Stars: React.FC<{ rating: number; size?: string }> = ({ rating, size = "h-3 w-3" }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={cn(size, i < Math.floor(rating) ? "fill-gold text-gold" : "fill-border text-border")} />
    ))}
  </div>
);

// ─── FreelancerCard ───────────────────────────────────────────────────────────

interface FreelancerCardProps {
  freelancer: Freelancer;
  index: number;
  sort: SortOption;
  onView: (id: string) => void;
  onInquire: (id: string) => void;
}

export const FreelancerCard: React.FC<FreelancerCardProps> = ({ freelancer: f, index, sort, onView, onInquire }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group flex flex-col rounded-2xl border border-border transition-all duration-200 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5"
      style={{ backgroundColor: "#111111" }}
    >
      {/* Top section */}
      <div className="flex items-start gap-3 p-5 pb-0">
        {/* Avatar */}
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base font-black text-white", avatarGradient(f.id))}>
          {f.avatarInitials}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <button onClick={() => onView(f.id)} className="text-sm font-bold text-textPrimary hover:text-accent transition-colors text-left leading-tight">
                {f.name}
              </button>
              <p className="text-[11px] text-textMuted mt-0.5">{f.role}</p>
            </div>

            {/* Match score badge (shown when sort = match) */}
            {sort === "match" && (
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
                f.matchScore >= 90 ? "bg-success/10 text-success" : f.matchScore >= 75 ? "bg-accent/10 text-accent" : "bg-elevated text-textMuted")}>
                {f.matchScore}%
              </span>
            )}
          </div>

          {/* Rating + rate + availability */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1">
              <Stars rating={f.rating} />
              <span className="text-[10px] text-textMuted">({f.reviews})</span>
            </div>
            <span className="text-[11px] font-bold text-accent">${f.hourlyRate}/hr</span>
            <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", AVAILABILITY_COLOR[f.availability])}>
              <Clock className="h-2.5 w-2.5" />{AVAILABILITY_LABELS[f.availability]}
            </span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 px-5 pt-2 text-[10px] text-textDisabled">
        <MapPin className="h-2.5 w-2.5" />{f.location}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 px-5 pt-3">
        {f.skills.slice(0, 4).map((s) => (
          <span key={s} className="rounded-full border border-border bg-elevated px-2 py-0.5 text-[10px] font-medium text-textMuted">{s}</span>
        ))}
        {f.skills.length > 4 && (
          <span className="text-[10px] text-textDisabled self-center">+{f.skills.length - 4}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex gap-2 border-t border-border p-4 pt-4">
        <button
          onClick={() => onView(f.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> View Profile
        </button>
        <button
          onClick={() => onInquire(f.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2 text-xs font-bold text-white hover:bg-accent/90 shadow-glow transition-colors"
        >
          <Send className="h-3 w-3" /> Inquire
        </button>
      </div>
    </motion.div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

export const FreelancerCardSkeleton: React.FC = () => (
  <div className="animate-pulse flex flex-col rounded-2xl border border-border p-5 gap-3" style={{ backgroundColor: "#111111" }}>
    <div className="flex items-start gap-3">
      <div className="h-12 w-12 rounded-xl bg-elevated shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded-full bg-elevated" />
        <div className="h-3 w-36 rounded-full bg-elevated" />
        <div className="h-3 w-24 rounded-full bg-elevated" />
      </div>
    </div>
    <div className="flex gap-1.5">
      {[48, 56, 44, 52].map((w) => <div key={w} className="h-5 rounded-full bg-elevated" style={{ width: w }} />)}
    </div>
    <div className="flex gap-2 mt-2">
      <div className="flex-1 h-8 rounded-xl bg-elevated" />
      <div className="flex-1 h-8 rounded-xl bg-elevated" />
    </div>
  </div>
);

// ─── Stars export ─────────────────────────────────────────────────────────────
export { Stars };
