import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Send, Loader2, X, CheckCircle2, Paperclip } from "lucide-react";
import api from "../../services/api";
import { cn } from "../../lib/utils";
import { Project } from "../../types/project";

interface SendInquiryFormProps {
  freelancerId: string;
  freelancerName: string;
  onClose: () => void;
  inline?: boolean;
  preselectedProjectId?: string;
}

export const SendInquiryForm: React.FC<SendInquiryFormProps> = ({
  freelancerId, freelancerName, onClose, inline = false, preselectedProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(preselectedProjectId ?? "");
  const [message, setMessage] = useState("");
  const [msgError, setMsgError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get<{ data: Project[] }>("/api/projects").then((r) => setProjects(r.data.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!message.trim()) { setMsgError("Message is required."); return; }
    setMsgError(""); setIsSubmitting(true);
    try {
      await api.post("/api/inquiries", { freelancerId, projectId: projectId || null, message: message.trim() });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1800);
    } catch (e: any) {
      setMsgError(e?.response?.data?.error ?? "Failed to send. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wrapClass = inline
    ? "rounded-2xl border border-accent/20 bg-accent/5 p-5 space-y-4"
    : "space-y-4";

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-success/20 bg-success/5 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <p className="font-bold text-textPrimary">Inquiry sent to {freelancerName}!</p>
        <p className="text-xs text-textMuted">They'll be notified and can respond shortly.</p>
      </motion.div>
    );
  }

  return (
    <div className={wrapClass}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-textPrimary">Message {freelancerName}</p>
        <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors" aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Project selector */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-textDisabled">
          Project (optional)
        </label>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
          className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all">
          <option value="">No specific project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className={cn("text-[10px] font-black uppercase tracking-widest", msgError ? "text-error" : "text-textDisabled")}>
          Message <span className="text-error">*</span>
        </label>
        <textarea
          rows={5} value={message} onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) setMsgError(""); }}
          placeholder={`Hi ${freelancerName}, I'd like to discuss…`}
          className={cn("w-full resize-none rounded-xl border px-4 py-3 text-sm text-textPrimary placeholder-textDisabled bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
            msgError ? "border-error" : "border-border")} />
        {msgError && <p className="text-[11px] text-error">{msgError}</p>}
      </div>

      {/* Attachment note */}
      <div className="flex items-center gap-2 text-[10px] text-textDisabled">
        <Paperclip className="h-3 w-3" />
        Attach files by dragging &amp; dropping into the message — coming soon.
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
        <button onClick={submit} disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-colors disabled:opacity-50">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSubmitting ? "Sending…" : "Send Inquiry"}
        </button>
      </div>
    </div>
  );
};
