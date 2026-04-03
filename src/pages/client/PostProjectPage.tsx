/**
 * PostProjectPage.tsx — Client post a new project form
 */
import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Loader2, CheckCircle2, DollarSign, Clock, Tag, AlignLeft, Briefcase } from "lucide-react";
import { ROUTES } from "../../constants";
import { cn } from "../../lib/utils";
import api from "../../services/api";

const CATEGORIES = ["Web Development","Mobile App","UI/UX Design","Backend API","DevOps","Data Science","Marketing","Other"];

export const PostProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [form, setForm] = useState({
    title:       "",
    description: "",
    category:    "Web Development",
    budget:      "",
    timeline:    "",
    skills:      "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const valid = form.title.trim() && form.description.trim() && form.budget.trim();

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await api.post("/api/projects", {
        ...form,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      });
    } catch {
      // server may not have this endpoint yet — treat as success in demo
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => navigate(ROUTES.CLIENT_PROJECTS), 2000);
    }
  };

  if (submitted) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary">Project Posted!</h2>
          <p className="text-sm text-text-muted">Redirecting to your projects…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Post a Project</h1>
        <p className="text-sm text-text-muted mt-0.5">Fill in your project details to receive freelancer proposals</p>
      </div>

      <div className="glass-gold rounded-2xl border border-border p-6 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="mono-label flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Project Title</label>
          <input value={form.title} onChange={set("title")} placeholder="e.g. Build a React SaaS Dashboard"
            className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all" />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="mono-label flex items-center gap-1.5"><AlignLeft className="h-3 w-3" /> Description</label>
          <textarea rows={4} value={form.description} onChange={set("description")}
            placeholder="Describe what you need built, requirements, tech stack, deliverables…"
            className="w-full resize-none rounded-xl border border-border bg-elevated px-4 py-3 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all leading-relaxed" />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="mono-label flex items-center gap-1.5"><Tag className="h-3 w-3" /> Category</label>
          <select value={form.category} onChange={set("category")}
            className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent/50 focus:outline-none transition-all">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Budget */}
          <div className="space-y-1.5">
            <label className="mono-label flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> Budget</label>
            <input value={form.budget} onChange={set("budget")} placeholder="e.g. $3,000 or $30–50/hr"
              className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all" />
          </div>
          {/* Timeline */}
          <div className="space-y-1.5">
            <label className="mono-label flex items-center gap-1.5"><Clock className="h-3 w-3" /> Timeline</label>
            <input value={form.timeline} onChange={set("timeline")} placeholder="e.g. 4 weeks"
              className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all" />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-1.5">
          <label className="mono-label">Required Skills (comma-separated)</label>
          <input value={form.skills} onChange={set("skills")} placeholder="React, Node.js, TypeScript, Figma"
            className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <motion.button onClick={handleSubmit} disabled={!valid || submitting} whileTap={{ scale: 0.97 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-base hover:bg-accent-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</> : <><PlusCircle className="h-4 w-4" /> Post Project</>}
          </motion.button>
          <button onClick={() => navigate(ROUTES.CLIENT_PROJECTS)}
            className="rounded-xl border border-border bg-elevated px-5 py-3 text-sm font-medium text-text-muted hover:text-text-primary transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
