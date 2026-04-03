import React, { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Check, Loader2, Plus, Tag } from "lucide-react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import { Project, PROJECT_TYPES } from "../../types/project";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostProjectFormProps {
  onClose: () => void;
  onCreated: (p: Project) => void;
}

interface FormData {
  // Step 1
  title: string;
  description: string;
  type: string;
  budgetMin: string;
  budgetMax: string;
  deadline: string;
  priority: string;
  // Step 2
  problemStatement: string;
  features: string[];
  technologies: string[];
  deliverables: string[];
  targetAudience: string;
  references: string[];
}

const INITIAL: FormData = {
  title: "", description: "", type: PROJECT_TYPES[0],
  budgetMin: "", budgetMax: "", deadline: "", priority: "medium",
  problemStatement: "", features: [], technologies: [], deliverables: [], targetAudience: "", references: [],
};

// ─── Tag input ────────────────────────────────────────────────────────────────

const TagInput: React.FC<{
  label: string; id: string; tags: string[];
  onChange: (tags: string[]) => void; placeholder?: string; error?: string;
}> = ({ label, id, tags, onChange, placeholder, error }) => {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0, -1));
  };
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={cn("text-xs font-bold uppercase tracking-widest", error ? "text-error" : "text-textMuted")}>{label}</label>
      <div className={cn("flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 focus-within:ring-2 focus-within:ring-accent/50 transition-all", error ? "border-error" : "border-border bg-surface")}>
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-error transition-colors">×</button>
          </span>
        ))}
        <input
          id={id} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} onBlur={add}
          placeholder={tags.length === 0 ? (placeholder ?? "Type and press Enter…") : ""} className="min-w-[120px] flex-1 bg-transparent text-sm text-textPrimary placeholder-textDisabled outline-none" />
      </div>
      {error && <p className="text-[11px] text-error">{error}</p>}
    </div>
  );
};

// ─── Field ────────────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }> = ({ label, id, error, required, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className={cn("text-xs font-bold uppercase tracking-widest", error ? "text-error" : "text-textMuted")}>
      {label}{required && <span className="text-error ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-error">{error}</p>}
  </div>
);

const inputClass = (err?: string) =>
  cn("w-full rounded-xl border px-4 py-2.5 text-sm text-textPrimary placeholder-textDisabled bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
    err ? "border-error" : "border-border");

// ─── Step indicators ──────────────────────────────────────────────────────────

const STEPS = ["Basic Info", "Requirements", "Review"];
const StepBar: React.FC<{ step: number }> = ({ step }) => (
  <div className="flex items-center gap-2 px-1">
    {STEPS.map((label, i) => (
      <React.Fragment key={i}>
        <div className="flex items-center gap-1.5">
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all", i < step ? "bg-success text-white" : i === step ? "bg-accent text-white shadow-glow" : "bg-elevated text-textDisabled")}>
            {i < step ? <Check className="h-3 w-3" /> : i + 1}
          </div>
          <span className={cn("hidden sm:block text-[10px] font-bold uppercase tracking-widest", i === step ? "text-accent" : "text-textDisabled")}>{label}</span>
        </div>
        {i < STEPS.length - 1 && <div className={cn("flex-1 h-px", i < step ? "bg-success" : "bg-border")} />}
      </React.Fragment>
    ))}
  </div>
);

// ─── Validation ───────────────────────────────────────────────────────────────

type Errors = Partial<Record<keyof FormData, string>>;

function validateStep1(f: FormData): Errors {
  const e: Errors = {};
  if (!f.title.trim() || f.title.trim().length < 5) e.title = "Title must be at least 5 characters.";
  if (f.title.trim().length > 100) e.title = "Title must be under 100 characters.";
  if (!f.budgetMin || Number(f.budgetMin) <= 0) e.budgetMin = "Enter a positive minimum budget.";
  if (!f.budgetMax || Number(f.budgetMax) <= 0) e.budgetMax = "Enter a positive maximum budget.";
  if (Number(f.budgetMin) >= Number(f.budgetMax)) e.budgetMax = "Max budget must be greater than min.";
  if (!f.deadline) e.deadline = "Select a deadline.";
  else {
    const due = new Date(f.deadline);
    const now = new Date();
    if (due <= now) e.deadline = "Deadline must be in the future.";
    else if ((due.getTime() - now.getTime()) > 2 * 365 * 86400000) e.deadline = "Deadline cannot be more than 2 years away.";
  }
  return e;
}

function validateStep2(f: FormData): Errors {
  const e: Errors = {};
  if (f.features.length < 2) e.features = "Add at least 2 key features.";
  return e;
}

// ─── PostProjectForm ──────────────────────────────────────────────────────────

export const PostProjectForm: React.FC<PostProjectFormProps> = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const nextStep = () => {
    const errs = step === 0 ? validateStep1(form) : step === 1 ? validateStep2(form) : {};
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const submit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post<{ data: Project }>("/api/projects", {
        ...form,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
      });
      onCreated(res.data.data);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error ?? "Failed to create project. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 2 * 365 * 86400000).toISOString().split("T")[0];

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border shadow-2xl"
        style={{ backgroundColor: "#0d0d0d", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-6">
          <h3 className="font-display text-base font-bold text-textPrimary">Post a New Project</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {/* Step bar */}
        <div className="border-b border-border px-6 py-3"><StepBar step={step} /></div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <Field label="Project Title" id="proj-title" error={errors.title} required>
                  <input id="proj-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. E-commerce Website Redesign" className={inputClass(errors.title)} maxLength={100} />
                </Field>
                <Field label="Description" id="proj-desc">
                  <textarea id="proj-desc" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief overview of the project…" rows={3} className={cn(inputClass(), "resize-none")} />
                </Field>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Project Type" id="proj-type" required>
                    <select id="proj-type" value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass()}>
                      {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Priority" id="proj-priority" required>
                    <select id="proj-priority" value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputClass()}>
                      {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Budget Min ($)" id="proj-bmin" error={errors.budgetMin} required>
                    <input id="proj-bmin" type="number" min={1} value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} placeholder="e.g. 2000" className={inputClass(errors.budgetMin)} />
                  </Field>
                  <Field label="Budget Max ($)" id="proj-bmax" error={errors.budgetMax} required>
                    <input id="proj-bmax" type="number" min={1} value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} placeholder="e.g. 5000" className={inputClass(errors.budgetMax)} />
                  </Field>
                </div>
                <Field label="Deadline" id="proj-deadline" error={errors.deadline} required>
                  <input id="proj-deadline" type="date" min={minDate} max={maxDate} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} className={inputClass(errors.deadline)} />
                </Field>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <Field label="Problem Statement" id="proj-problem">
                  <textarea id="proj-problem" value={form.problemStatement} onChange={(e) => set("problemStatement", e.target.value)} placeholder="What problem does this project solve?" rows={3} className={cn(inputClass(), "resize-none")} />
                </Field>
                <TagInput label="Key Features" id="proj-features" tags={form.features} onChange={(v) => set("features", v)} placeholder="e.g. User auth  (Enter after each)" error={errors.features} />
                <TagInput label="Technologies" id="proj-tech" tags={form.technologies} onChange={(v) => set("technologies", v)} placeholder="e.g. React, Node.js…" />
                <TagInput label="Deliverables" id="proj-deliverables" tags={form.deliverables} onChange={(v) => set("deliverables", v)} placeholder="e.g. Source code, Figma file…" />
                <Field label="Target Audience" id="proj-audience">
                  <input id="proj-audience" value={form.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} placeholder="e.g. Small business owners aged 25-45" className={inputClass()} />
                </Field>
                <TagInput label="Reference Links" id="proj-refs" tags={form.references} onChange={(v) => set("references", v)} placeholder="e.g. https://example.com" />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <p className="text-sm text-textMuted">Review your project before posting. Once submitted, freelancers can find and propose on it.</p>
                {[
                  ["Title", form.title],
                  ["Type", form.type],
                  ["Budget", `$${form.budgetMin} – $${form.budgetMax}`],
                  ["Deadline", form.deadline],
                  ["Priority", form.priority],
                  ["Features", form.features.join(", ") || "—"],
                  ["Technologies", form.technologies.join(", ") || "—"],
                  ["Deliverables", form.deliverables.join(", ") || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0 text-sm">
                    <span className="text-textMuted font-medium w-28 shrink-0">{label}</span>
                    <span className="text-textPrimary font-semibold text-right break-words">{value as string}</span>
                  </div>
                ))}
                {submitError && <p className="rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">{submitError}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isSubmitting ? "Posting…" : "Post Project"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modal, document.body);
};
