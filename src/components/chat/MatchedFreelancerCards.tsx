/**
 * MatchedFreelancerCards.tsx — AI-Matched Freelancer Grid
 *
 * Rendered inside the chat flow after an AI "find freelancer" response
 * or in the right panel. Horizontal scroll on desktop, vertical stack
 * on mobile. Staggered entrance animation via Framer Motion.
 */

import React, { memo } from "react";
import { motion } from "motion/react";
import {
  Star, Clock, FileText, CalendarDays, ChevronRight, Sparkles, MapPin,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { FreelancerMatch } from "../../services/chatService";

// ─── Match score colour ───────────────────────────────────────────────────────

function matchColor(score: number): string {
  if (score >= 90) return "text-success border-success/30 bg-success/10";
  if (score >= 80) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
  return "text-textMuted border-border bg-elevated";
}

// ─── Single card ─────────────────────────────────────────────────────────────

interface CardProps {
  match:           FreelancerMatch;
  index:           number;
  onView?:         (id: string) => void;
  onSendProposal?: (id: string) => void;
  onSchedule?:     (id: string) => void;
}

const FreelancerCard: React.FC<CardProps> = memo(({
  match, index, onView, onSendProposal, onSchedule,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.97 }}
    animate={{ opacity: 1, y: 0,  scale: 1 }}
    transition={{ duration: 0.28, delay: index * 0.1, ease: "easeOut" }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="relative flex w-64 shrink-0 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-[0_0_24px_rgba(242,125,38,0.10)] hover:border-accent/30"
  >
    {/* Match score badge */}
    <span className={cn(
      "absolute right-3 top-3 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
      matchColor(match.matchScore)
    )}>
      <Sparkles className="h-2.5 w-2.5" />
      {match.matchScore}%
    </span>

    {/* Avatar + name */}
    <div className="flex items-center gap-3 pr-16">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-sm font-bold text-accent">
        {match.avatarInitials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-textPrimary">{match.name}</p>
        <p className="truncate text-[11px] text-textMuted">{match.role}</p>
      </div>
    </div>

    {/* Stats row */}
    <div className="flex items-center gap-3 text-[11px] text-textMuted">
      <span className="flex items-center gap-0.5">
        <Star className="h-3 w-3 fill-gold text-gold" /> {match.rating}
      </span>
      <span>${match.hourlyRate}/hr</span>
      <span className="flex items-center gap-0.5">
        <Clock className="h-3 w-3" /> {match.availability}
      </span>
    </div>

    {/* Location */}
    {match.location && (
      <p className="flex items-center gap-1 text-[11px] text-textDisabled">
        <MapPin className="h-3 w-3" /> {match.location}
      </p>
    )}

    {/* Skills */}
    <div className="flex flex-wrap gap-1">
      {match.skills.slice(0, 3).map((s) => (
        <span
          key={s}
          className="rounded-md border border-border bg-elevated px-2 py-0.5 text-[10px] text-textSecondary"
        >
          {s}
        </span>
      ))}
      {match.skills.length > 3 && (
        <span className="rounded-md border border-border bg-elevated px-2 py-0.5 text-[10px] text-textDisabled">
          +{match.skills.length - 3}
        </span>
      )}
    </div>

    {/* Actions */}
    <div className="flex gap-2 pt-1">
      <button
        onClick={() => onSendProposal?.(match.id)}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-accent/25 bg-accent/10 px-2 py-1.5 text-[11px] font-medium text-accent transition-all hover:bg-accent/20"
      >
        <FileText className="h-3 w-3" /> Propose
      </button>
      <button
        onClick={() => onSchedule?.(match.id)}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-elevated px-2 py-1.5 text-[11px] font-medium text-textPrimary transition-all hover:bg-border"
      >
        <CalendarDays className="h-3 w-3" /> Meet
      </button>
      <button
        onClick={() => onView?.(match.id)}
        className="flex items-center justify-center rounded-lg border border-border bg-elevated px-2 py-1.5 text-[11px] text-textMuted transition-all hover:text-textPrimary"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  </motion.div>
));
FreelancerCard.displayName = "FreelancerCard";

// ─── MatchedFreelancerCards ───────────────────────────────────────────────────

interface Props {
  matches:         FreelancerMatch[];
  onSelectFreelancer?: (id: string) => void;
  onSendProposal?: (id: string) => void;
  onSchedule?:     (id: string) => void;
  onViewAll?:      () => void;
}

export const MatchedFreelancerCards: React.FC<Props> = ({
  matches,
  onSelectFreelancer,
  onSendProposal,
  onSchedule,
  onViewAll,
}) => {
  if (!matches.length) return null;

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-textDisabled">
        {matches.length} AI-Matched Freelancer{matches.length > 1 ? "s" : ""}
      </p>

      {/* Horizontal scroll on desktop, wrap on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible custom-scrollbar">
        {matches.map((match, i) => (
          <FreelancerCard
            key={match.id}
            match={match}
            index={i}
            onView={onSelectFreelancer}
            onSendProposal={onSendProposal}
            onSchedule={onSchedule}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-textMuted transition-all hover:border-accent/30 hover:text-accent"
        >
          View All Matches
        </button>
        <button
          onClick={() => matches[0] && onSendProposal?.(matches[0].id)}
          className="flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-all hover:bg-accent/20"
        >
          <FileText className="h-3.5 w-3.5" /> Send Proposal to Top Match
        </button>
        <button
          onClick={() => matches[0] && onSchedule?.(matches[0].id)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-textPrimary transition-all hover:bg-border"
        >
          <CalendarDays className="h-3.5 w-3.5" /> Schedule Meeting with All
        </button>
      </div>
    </div>
  );
};
