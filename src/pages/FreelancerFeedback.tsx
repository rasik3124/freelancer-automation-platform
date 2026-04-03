/**
 * FreelancerFeedback.tsx — Client Feedback & Reviews (Freelancer View)
 *
 * - Average rating display
 * - Rating distribution chart
 * - Review timeline
 * - Rating breakdown (Quality, Communication, Timeline)
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Star, TrendingUp, Award, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";

// ─── Sample data ──────────────────────────────────────────────────────────────

const REVIEWS = [
  {
    id: "1",
    client: "TechVentures Inc.",
    project: "SaaS Dashboard Rebuild",
    rating: 5,
    quality: 5, communication: 5, timeline: 5,
    review: "Exceptional work. Delivered beyond expectations — the dashboard redesign transformed our product. Highly recommend for any complex React projects.",
    date: "2025-12-18",
    avatarInitials: "TV",
  },
  {
    id: "2",
    client: "DesignStudio Co.",
    project: "Brand Website",
    rating: 5,
    quality: 5, communication: 5, timeline: 4,
    review: "Professional, fast, and incredibly talented. Communication was smooth throughout the project and the final result was stunning.",
    date: "2025-11-30",
    avatarInitials: "DS",
  },
  {
    id: "3",
    client: "Startup Labs",
    project: "Mobile App MVP",
    rating: 4.5,
    quality: 5, communication: 4, timeline: 4,
    review: "Great developer. Minor delays due to scope changes but handled them professionally. Would hire again.",
    date: "2025-11-10",
    avatarInitials: "SL",
  },
  {
    id: "4",
    client: "Growth Agency",
    project: "Marketing Automation",
    rating: 5,
    quality: 5, communication: 5, timeline: 5,
    review: "Built exactly what we needed. Proactive communication and zero bugs at launch. 10/10.",
    date: "2025-10-22",
    avatarInitials: "GA",
  },
  {
    id: "5",
    client: "E-commerce Plus",
    project: "Shopify Integration",
    rating: 4,
    quality: 4, communication: 4, timeline: 4,
    review: "Solid work, delivered the integration as described. Good communicator.",
    date: "2025-09-15",
    avatarInitials: "EP",
  },
];

const DIST = [
  { stars: 5, count: 18, pct: 72 },
  { stars: 4, count: 5,  pct: 20 },
  { stars: 3, count: 2,  pct: 8  },
  { stars: 2, count: 0,  pct: 0  },
  { stars: 1, count: 0,  pct: 0  },
];

// ─── Stars component ──────────────────────────────────────────────────────────

const Stars: React.FC<{ value: number; size?: "sm" | "md" }> = ({ value, size = "md" }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        className={cn(
          size === "sm" ? "h-3 w-3" : "h-4 w-4",
          s <= Math.round(value) ? "fill-gold text-gold" : "text-text-disabled"
        )}
      />
    ))}
  </div>
);

// ─── FreelancerFeedback ────────────────────────────────────────────────────────

export const FreelancerFeedback: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "5" | "4" | "3">("all");

  const avg = (REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length).toFixed(2);

  const filtered = filter === "all" ? REVIEWS : REVIEWS.filter(r => Math.round(r.rating) === Number(filter));

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Client Feedback</h1>
        <p className="text-sm text-text-muted mt-0.5">Reviews and ratings from completed projects</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Average Rating", value: avg, icon: Star,           color: "text-gold" },
          { label: "Total Reviews",  value: "25", icon: MessageSquare, color: "text-accent" },
          { label: "5-Star Reviews", value: "18", icon: Award,         color: "text-success" },
          { label: "Response Rate",  value: "96%", icon: TrendingUp,   color: "text-accent" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="stat-card"
            >
              <Icon className={cn("h-5 w-5", s.color)} />
              <div>
                <p className={cn("font-mono text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Rating distribution */}
        <div className="glass-gold rounded-2xl border border-border p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Rating Breakdown</p>

          <div className="flex flex-col items-center mb-5">
            <p className="font-mono text-5xl font-bold text-accent">{avg}</p>
            <Stars value={Number(avg)} />
            <p className="text-xs text-text-muted mt-1">out of 5 · 25 reviews</p>
          </div>

          <div className="space-y-2">
            {DIST.map(d => (
              <div key={d.stars} className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 w-14 shrink-0">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn("h-2.5 w-2.5", s <= d.stars ? "fill-gold text-gold" : "text-text-disabled")} />
                  ))}
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${d.pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-accent"
                  />
                </div>
                <span className="w-6 text-right text-[10px] font-mono text-text-muted">{d.count}</span>
              </div>
            ))}
          </div>

          {/* Sub-ratings */}
          <div className="mt-5 space-y-2 border-t border-border pt-4">
            {[
              { label: "Work Quality",    value: 4.9 },
              { label: "Communication",   value: 4.8 },
              { label: "On-Time",         value: 4.7 },
              { label: "Would Hire Again", value: 4.9 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 rounded-full bg-elevated overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(item.value / 5) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-accent font-bold w-7">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            {(["all", "5", "4", "3"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                  filter === f
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border bg-elevated text-text-muted hover:text-text-primary"
                )}>
                {f === "all" ? "All Reviews" : `${f} ★`}
              </button>
            ))}
          </div>

          {filtered.map((r, i) => (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-gold rounded-2xl border border-border p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-xs font-bold text-accent">
                    {r.avatarInitials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-primary">{r.client}</p>
                    <p className="text-[11px] text-text-muted">{r.project}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={r.rating} size="sm" />
                      <span className="text-[10px] font-mono font-bold text-gold">{r.rating}</span>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-mono text-text-disabled">
                  {new Date(r.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <p className="mt-3 text-sm text-text-secondary leading-relaxed italic">
                "{r.review}"
              </p>

              {/* Sub-ratings */}
              <div className="mt-3 flex gap-3 border-t border-border pt-3">
                {[
                  { label: "Quality",       value: r.quality },
                  { label: "Communication", value: r.communication },
                  { label: "Timeline",      value: r.timeline },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-disabled">{s.label}</span>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={cn("h-2.5 w-2.5", n <= s.value ? "fill-gold text-gold" : "text-text-disabled")} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
