/**
 * ClientFeedback.tsx — Client Feedback Submission
 *
 * Client submits star ratings + written review for completed projects.
 * Fields: overall rating, quality, communication, timeline, review message.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Send, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Sample projects for the dropdown ─────────────────────────────────────────

const COMPLETED_PROJECTS = [
  { id: "p1", title: "SaaS Dashboard Rebuild",   freelancer: "Alex Johnson" },
  { id: "p2", title: "Brand Website",            freelancer: "Maria Chen" },
  { id: "p3", title: "E-commerce Integration",   freelancer: "David Park" },
];

// ─── Star rating input ─────────────────────────────────────────────────────────

const StarInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-text-secondary">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
          >
            <Star className={cn(
              "h-5 w-5 transition-all",
              n <= (hovered || value) ? "fill-gold text-gold scale-110" : "text-text-disabled"
            )} />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-1.5 font-mono text-xs font-bold text-gold">{value}.0</span>
        )}
      </div>
    </div>
  );
};

// ─── ClientFeedback ───────────────────────────────────────────────────────────

export const ClientFeedback: React.FC = () => {
  const [projectId, setProjectId]       = useState("p1");
  const [overall,   setOverall]         = useState(0);
  const [quality,   setQuality]         = useState(0);
  const [comms,     setComms]           = useState(0);
  const [timeline,  setTimeline]        = useState(0);
  const [review,    setReview]          = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [submitted,  setSubmitted]      = useState(false);

  const project = COMPLETED_PROJECTS.find(p => p.id === projectId)!;
  const canSubmit = overall > 0 && quality > 0 && comms > 0 && timeline > 0 && review.trim().length > 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary">Feedback Submitted!</h2>
          <p className="text-sm text-text-muted">
            Thank you for your review of <span className="text-accent font-semibold">{project.freelancer}</span>.
            Your feedback helps improve the platform.
          </p>
          <button onClick={() => { setSubmitted(false); setOverall(0); setQuality(0); setComms(0); setTimeline(0); setReview(""); }}
            className="rounded-xl border border-accent/30 bg-accent/10 px-5 py-2 text-sm font-semibold text-accent hover:bg-accent/20 transition-all">
            Submit Another Review
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Rate Your Freelancer</h1>
        <p className="text-sm text-text-muted mt-0.5">Your honest feedback helps the community</p>
      </div>

      {/* Form card */}
      <div className="glass-gold rounded-2xl border border-border p-6 space-y-6">

        {/* Project select */}
        <div className="space-y-1.5">
          <label className="mono-label">Select Project</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
          >
            {COMPLETED_PROJECTS.map(p => (
              <option key={p.id} value={p.id}>{p.title} — {p.freelancer}</option>
            ))}
          </select>
        </div>

        <div className="h-px bg-border" />

        {/* Star ratings */}
        <div className="space-y-4">
          <p className="mono-label">Ratings</p>
          <StarInput label="Overall Satisfaction"  value={overall}   onChange={setOverall} />
          <StarInput label="Work Quality"          value={quality}   onChange={setQuality} />
          <StarInput label="Communication"         value={comms}     onChange={setComms} />
          <StarInput label="Timeline & Delivery"   value={timeline}  onChange={setTimeline} />
        </div>

        {/* Average indicator */}
        {overall > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
            <p className="text-xs text-text-muted">Average Rating</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={cn("h-3.5 w-3.5", n <= Math.round((overall + quality + comms + timeline) / 4) ? "fill-gold text-gold" : "text-text-disabled")} />
                ))}
              </div>
              <span className="font-mono text-sm font-bold text-gold">
                {((overall + quality + comms + timeline) / 4).toFixed(1)}
              </span>
            </div>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Written review */}
        <div className="space-y-1.5">
          <label className="mono-label">Written Review</label>
          <textarea
            rows={4}
            value={review}
            onChange={e => setReview(e.target.value)}
            maxLength={1000}
            placeholder="Describe your experience working with this freelancer. What went well? What could be improved?"
            className="w-full resize-none rounded-xl border border-border bg-elevated px-4 py-3 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <p className={cn("text-[10px]", review.length > 900 ? "text-error" : "text-text-disabled")}>
              {review.length} / 1000 characters
            </p>
            {review.trim().length > 0 && review.trim().length < 10 && (
              <p className="text-[10px] text-error">Minimum 10 characters</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-base hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-glow"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            <><Send className="h-4 w-4" /> Submit Feedback</>
          )}
        </motion.button>
      </div>
    </div>
  );
};
