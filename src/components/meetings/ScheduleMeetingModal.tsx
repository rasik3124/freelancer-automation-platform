import React, { useEffect, useState, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CalendarPlus, Video, AlertTriangle, Search } from "lucide-react";
import api from "../../services/api";
import { DURATION_OPTIONS, Meeting } from "../../types/meeting";
import { Freelancer } from "../../types/freelancer";
import { Project } from "../../types/project";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  freelancerId: string; freelancerName: string; freelancerAvatarInitials: string;
  projectId: string; projectName: string;
  date: string; time: string; duration: number;
  meetingLink: string; notes: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

const INITIAL: FormData = {
  freelancerId: "", freelancerName: "", freelancerAvatarInitials: "",
  projectId: "", projectName: "",
  date: "", time: "", duration: 30,
  meetingLink: "", notes: "",
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }> = ({ label, id, error, required, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className={cn("text-[10px] font-black uppercase tracking-widest", error ? "text-error" : "text-textDisabled")}>
      {label}{required && <span className="text-error ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-error">{error}</p>}
  </div>
);

const inputCls = (err?: string) => cn(
  "w-full rounded-xl border px-4 py-2.5 text-sm text-textPrimary placeholder-textDisabled bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
  err ? "border-error" : "border-border"
);

// ─── Freelancer search dropdown ───────────────────────────────────────────────

const FreelancerSearch: React.FC<{
  value: string; onChange: (id: string, name: string, initials: string) => void; error?: string;
}> = ({ value, onChange, error }) => {
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<Freelancer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<{ data: Freelancer[] }>("/api/freelancers", { params: { q, sort: "match" } })
      .then(r => setOptions(r.data.data))
      .finally(() => setLoading(false));
  }, [q, open]);

  const selected = options.find(f => f.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(v => !v)}
        className={cn("flex items-center gap-2 cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition-all",
          error ? "border-error" : "border-border bg-surface",
          open && "ring-2 ring-accent/50")}
      >
        {selected
          ? <><span className="font-bold text-textPrimary">{selected.name}</span><span className="text-textMuted text-xs ml-1">— {selected.role}</span></>
          : <span className="text-textDisabled">Search freelancers…</span>}
      </div>
      {open && (
        <div className="absolute z-30 top-full mt-1 w-full rounded-2xl border border-border shadow-2xl" style={{ backgroundColor: "#0d0d0d" }}>
          <div className="flex items-center gap-2 p-2 border-b border-border">
            <Search className="h-3.5 w-3.5 text-textDisabled shrink-0" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Type name, role or skill…"
              className="flex-1 bg-transparent text-sm text-textPrimary placeholder-textDisabled focus:outline-none" />
          </div>
          <div className="max-h-52 overflow-y-auto custom-scrollbar p-1">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-accent" /></div>
            ) : options.length === 0 ? (
              <p className="py-4 text-center text-xs text-textDisabled">No results</p>
            ) : options.slice(0, 8).map(f => (
              <button key={f.id} onClick={() => { onChange(f.id, f.name, f.avatarInitials); setOpen(false); }}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-elevated",
                  value === f.id ? "bg-accent/10" : "")}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-xs font-black text-accent">{f.avatarInitials}</div>
                <div>
                  <p className="text-xs font-bold text-textPrimary">{f.name}</p>
                  <p className="text-[10px] text-textMuted">{f.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormData): Errors {
  const errs: Errors = {};
  if (!form.freelancerId) errs.freelancerId = "Select a freelancer.";
  if (!form.date) { errs.date = "Date is required."; }
  else {
    const today = new Date().toISOString().split("T")[0];
    if (form.date <= today) errs.date = "Date must be in the future.";
  }
  if (!form.time) { errs.time = "Time is required."; }
  else {
    const h = parseInt(form.time.split(":")[0]);
    if (h < 8 || h >= 20) errs.time = "Time must be between 8:00 AM and 8:00 PM.";
  }
  return errs;
}

// ─── ScheduleMeetingModal ─────────────────────────────────────────────────────

interface ScheduleMeetingModalProps {
  onClose: () => void;
  onScheduled: (m: Meeting) => void;
  preselectedFreelancerId?: string;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({ onClose, onScheduled, preselectedFreelancerId }) => {
  const [form, setForm] = useState<FormData>({ ...INITIAL, freelancerId: preselectedFreelancerId ?? "" });
  const [errors, setErrors] = useState<Errors>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get<{ data: Project[] }>("/api/projects").then(r => setProjects(r.data.data)).catch(() => {});
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleEsc); document.body.style.overflow = ""; };
  }, []);

  const handleEsc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };

  const set = (k: keyof FormData, v: unknown) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0]; // tomorrow

  const submit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true); setSubmitError("");
    try {
      const res = await api.post<{ data: Meeting }>("/api/meetings/schedule", form);
      onScheduled(res.data.data);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1600);
    } catch (e: any) {
      setSubmitError(e?.response?.data?.error ?? "Failed to schedule meeting. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border shadow-2xl"
        style={{ backgroundColor: "#0d0d0d", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-accent" />
            <h3 className="font-display text-base font-bold text-textPrimary">Schedule Meeting</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                <CalendarPlus className="h-7 w-7 text-success" />
              </div>
              <p className="font-bold text-textPrimary">Meeting scheduled!</p>
              <p className="text-sm text-textMuted">Calendar invites are being sent to all participants.</p>
            </motion.div>
          ) : (
            <>
              {/* Freelancer */}
              <Field label="Freelancer" id="meet-freelancer" error={errors.freelancerId} required>
                <FreelancerSearch value={form.freelancerId}
                  onChange={(id, name, initials) => { set("freelancerId", id); set("freelancerName", name); set("freelancerAvatarInitials", initials); }}
                  error={errors.freelancerId} />
              </Field>

              {/* Project */}
              <Field label="Project" id="meet-project">
                <select id="meet-project" value={form.projectId}
                  onChange={(e) => {
                    const proj = projects.find(p => p.id === e.target.value);
                    set("projectId", e.target.value);
                    set("projectName", proj?.title ?? "");
                  }}
                  className={inputCls()}>
                  <option value="">No specific project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </Field>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date" id="meet-date" error={errors.date} required>
                  <input id="meet-date" type="date" min={minDate} value={form.date}
                    onChange={(e) => set("date", e.target.value)} className={inputCls(errors.date)} />
                </Field>
                <Field label="Time (8 AM – 8 PM)" id="meet-time" error={errors.time} required>
                  <input id="meet-time" type="time" min="08:00" max="20:00" value={form.time}
                    onChange={(e) => set("time", e.target.value)} className={inputCls(errors.time)} />
                </Field>
              </div>

              {/* Duration */}
              <Field label="Duration" id="meet-duration" required>
                <select id="meet-duration" value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} className={inputCls()}>
                  {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              {/* Meeting Link */}
              <Field label="Meeting Link (optional)" id="meet-link">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-textDisabled shrink-0" />
                  <input id="meet-link" type="url" value={form.meetingLink} onChange={(e) => set("meetingLink", e.target.value)}
                    placeholder="https://meet.google.com/… (auto-generated if blank)"
                    className={cn(inputCls(), "flex-1")} />
                </div>
              </Field>

              {/* Notes */}
              <Field label="Notes (optional)" id="meet-notes">
                <textarea id="meet-notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  placeholder="Agenda, topics to cover, documents to share…"
                  className={cn(inputCls(), "resize-none")} />
              </Field>

              {submitError && (
                <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-3 py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-error shrink-0" />
                  <p className="text-xs text-error">{submitError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="border-t border-border px-6 py-4 flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
            <button onClick={submit} disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-colors disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              {submitting ? "Scheduling…" : "Schedule Meeting"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );

  return createPortal(
    <AnimatePresence>{modal}</AnimatePresence>,
    document.body
  );
};
