import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Loader2, Search, MessageSquare } from "lucide-react";
import { Conversation } from "../../types/message";
import { Freelancer } from "../../types/freelancer";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface NewMessageModalProps {
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({ onClose, onCreated }) => {
  const [freelancers, setFreelancers]   = useState<Freelancer[]>([]);
  const [flQuery, setFlQuery]           = useState("");
  const [selectedFl, setSelectedFl]    = useState<Freelancer | null>(null);
  const [flOpen, setFlOpen]             = useState(false);
  const [topic, setTopic]               = useState("");
  const [message, setMessage]           = useState("");
  const [errors, setErrors]             = useState<{ freelancer?: string; message?: string }>({});
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState("");

  useEffect(() => {
    api.get<{ data: Freelancer[] }>("/api/freelancers", { params: { q: flQuery, sort: "match" } })
      .then(r => setFreelancers(r.data.data)).catch(() => {});
  }, [flQuery]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", h); };
  }, [onClose]);

  const submit = async () => {
    const errs: typeof errors = {};
    if (!selectedFl) errs.freelancer = "Please select a freelancer.";
    if (!message.trim()) errs.message = "Message is required.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true); setSubmitError("");
    try {
      const res = await api.post<{ data: { conversation: Conversation } }>("/api/conversations", {
        freelancerId: selectedFl!.id, freelancerName: selectedFl!.name,
        freelancerAvatarInitials: selectedFl!.avatarInitials, topic, message: message.trim(),
      });
      onCreated(res.data.data.conversation);
      onClose();
    } catch (e: any) {
      setSubmitError(e?.response?.data?.error ?? "Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#0d0d0d" }}>
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            <h3 className="font-display text-base font-bold text-textPrimary">New Message</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Freelancer selector */}
          <div className="space-y-1.5">
            <label className={cn("text-[10px] font-black uppercase tracking-widest", errors.freelancer ? "text-error" : "text-textDisabled")}>
              To <span className="text-error">*</span>
            </label>
            <div className="relative">
              <div onClick={() => setFlOpen(v => !v)}
                className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all",
                  errors.freelancer ? "border-error" : "border-border bg-surface",
                  flOpen && "ring-2 ring-accent/50 border-accent/50")}>
                {selectedFl
                  ? <><span className="font-bold text-textPrimary">{selectedFl.name}</span><span className="text-xs text-textMuted">— {selectedFl.role}</span></>
                  : <span className="text-textDisabled">Select a freelancer…</span>}
              </div>
              {flOpen && (
                <div className="absolute z-20 top-full mt-1 w-full rounded-2xl border border-border shadow-xl" style={{ backgroundColor: "#0d0d0d" }}>
                  <div className="flex items-center gap-2 p-2 border-b border-border">
                    <Search className="h-3.5 w-3.5 text-textDisabled shrink-0" />
                    <input autoFocus value={flQuery} onChange={e => setFlQuery(e.target.value)}
                      placeholder="Search freelancers…" className="flex-1 bg-transparent text-sm text-textPrimary focus:outline-none" />
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {freelancers.slice(0, 8).map(f => (
                      <button key={f.id} onClick={() => { setSelectedFl(f); setFlOpen(false); setErrors(e => ({ ...e, freelancer: undefined })); }}
                        className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-elevated transition-colors",
                          selectedFl?.id === f.id && "bg-accent/10")}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-black text-accent">{f.avatarInitials}</div>
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
            {errors.freelancer && <p className="text-[11px] text-error">{errors.freelancer}</p>}
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-textDisabled">Topic (optional)</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Project Discussion"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-textPrimary placeholder-textDisabled focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all" />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className={cn("text-[10px] font-black uppercase tracking-widest", errors.message ? "text-error" : "text-textDisabled")}>
              Message <span className="text-error">*</span>
            </label>
            <textarea rows={4} value={message}
              onChange={e => { setMessage(e.target.value); if (e.target.value.trim()) setErrors(v => ({ ...v, message: undefined })); }}
              placeholder={selectedFl ? `Hi ${selectedFl.name.split(" ")[0]}, …` : "Write your message here…"}
              className={cn("w-full resize-none rounded-xl border px-4 py-3 text-sm text-textPrimary placeholder-textDisabled bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
                errors.message ? "border-error" : "border-border")} />
            {errors.message && <p className="text-[11px] text-error">{errors.message}</p>}
          </div>

          {submitError && <p className="text-xs text-error rounded-xl bg-error/5 border border-error/20 px-3 py-2">{submitError}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
          <button onClick={submit} disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-colors disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? "Sending…" : "Send Message"}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(<AnimatePresence>{modal}</AnimatePresence>, document.body);
};
