import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineStage {
  label: string;
  count: number;
  colorClass: string;       // Tailwind border + text color pair
  bgClass: string;          // Tailwind bg for count bubble
}

// ─── Static pipeline data ─────────────────────────────────────────────────────
// In production this would come from GET /api/dashboard/pipeline or
// a real-time onSnapshot subscription. For now, realistic mock data.

const PIPELINE_STAGES: PipelineStage[] = [
  {
    label: "New Lead",
    count: 2,
    colorClass: "border-border text-textMuted",
    bgClass: "bg-elevated text-textMuted",
  },
  {
    label: "Contacted",
    count: 3,
    colorClass: "border-yellow-500/30 text-yellow-400",
    bgClass: "bg-yellow-500/10 text-yellow-400",
  },
  {
    label: "Proposal In",
    count: 5,
    colorClass: "border-accent/30 text-accent",
    bgClass: "bg-accent/10 text-accent",
  },
  {
    label: "Negotiation",
    count: 2,
    colorClass: "border-violet-500/30 text-violet-400",
    bgClass: "bg-violet-500/10 text-violet-400",
  },
  {
    label: "In Progress",
    count: 3,
    colorClass: "border-blue-500/30 text-blue-400",
    bgClass: "bg-blue-500/10 text-blue-400",
  },
  {
    label: "Completed",
    count: 7,
    colorClass: "border-success/30 text-success",
    bgClass: "bg-success/10 text-success",
  },
];

// ─── PipelineStatus ───────────────────────────────────────────────────────────

/**
 * PipelineStatus — horizontal CRM pipeline showing freelancer count per stage.
 * Stages are connected by arrow icons. Scrolls horizontally on small screens.
 */
export const PipelineStatus: React.FC = () => {
  const total = PIPELINE_STAGES.reduce((acc, s) => acc + s.count, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-textPrimary">
          CRM Pipeline
        </h3>
        <span className="text-xs text-textDisabled font-medium">
          {total} total leads
        </span>
      </div>

      {/* Scrollable row */}
      <div
        className="rounded-2xl border border-border p-4 overflow-x-auto custom-scrollbar"
        style={{ backgroundColor: "#111111" }}
      >
        <div className="flex items-stretch gap-1 min-w-max">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage.label}>
              {/* Stage card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
                className={cn(
                  "group flex min-w-[120px] flex-col items-center justify-between gap-3 rounded-xl border px-4 py-4 text-center transition-all duration-200 hover:bg-elevated/40 cursor-default",
                  stage.colorClass
                )}
              >
                {/* Stage index */}
                <span className="text-[9px] font-black uppercase tracking-widest opacity-50">
                  Stage {i + 1}
                </span>

                {/* Count bubble */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-lg font-black",
                    stage.bgClass
                  )}
                >
                  {stage.count}
                </div>

                {/* Label */}
                <span className="text-[10px] font-semibold leading-tight">
                  {stage.label}
                </span>

                {/* Mini progress bar relative to total */}
                <div className="h-1 w-full rounded-full bg-elevated overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stage.count / total) * 100}%` }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                    className="h-full rounded-full bg-current opacity-50"
                  />
                </div>
              </motion.div>

              {/* Arrow connector (not after last) */}
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="flex shrink-0 items-center px-1 text-textDisabled">
                  <ArrowRight className="h-4 w-4 opacity-40" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
