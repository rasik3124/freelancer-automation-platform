import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Loader2, XCircle, RefreshCw, AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Proposal } from "../../types/proposal";
import { formatBudget } from "../../types/proposal";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Shared overlay wrapper ───────────────────────────────────────────────────

const ModalOverlay: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
    <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
    <motion.div key="box" initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
      className="relative z-10 w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 space-y-5"
      style={{ backgroundColor: "#0d0d0d" }}>
      {children}
    </motion.div>
  </div>
);

// ─── AcceptProposalModal ──────────────────────────────────────────────────────

interface AcceptProps { proposal: Proposal; onClose: () => void; onAccepted: (p: Proposal) => void; }
export const AcceptProposalModal: React.FC<AcceptProps> = ({ proposal: p, onClose, onAccepted }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const accept = async () => {
    if (!confirmed) { setError("Please check the confirmation box to proceed."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.put<{ data: Proposal }>(`/api/proposals/${p.id}`, { status: "accepted" });
      onAccepted(res.data.data);
      // Redirect to schedule meeting
      setTimeout(() => navigate(`/dashboard/client/meetings?freelancer=${p.freelancerId}`), 400);
    } catch {
      setError("Could not accept proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <ModalOverlay onClose={onClose}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <h3 className="font-display text-base font-bold text-textPrimary">Accept Proposal</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border p-4 space-y-2" style={{ backgroundColor: "#111111" }}>
          <p className="text-sm text-textMuted">Accepting proposal from:</p>
          <p className="font-bold text-textPrimary">{p.freelancerName}</p>
          <p className="text-xs text-textMuted">{p.freelancerRole}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
            <span className="font-semibold text-accent">{formatBudget(p.priceMin, p.priceMax)}</span>
            <span className="text-textMuted">Timeline: {p.timeline}</span>
            <span className="text-textMuted">Project: {p.projectName}</span>
          </div>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={(e) => { setConfirmed(e.target.checked); if (e.target.checked) setError(""); }}
            className="accent-accent mt-0.5 h-4 w-4 cursor-pointer shrink-0" />
          <span className="text-sm text-textMuted leading-relaxed">
            I understand that <strong className="text-textPrimary">{p.freelancerName}</strong> will be hired for this project and this action will update the proposal status.
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error/5 border border-error/20 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-error shrink-0" />
            <p className="text-xs text-error">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
          <button onClick={accept} disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-sm font-bold text-white hover:bg-success/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {loading ? "Accepting…" : "Accept & Schedule"}
          </button>
        </div>
      </ModalOverlay>
    </AnimatePresence>,
    document.body
  );
};

// ─── RejectProposalModal ──────────────────────────────────────────────────────

interface RejectProps { proposal: Proposal; onClose: () => void; onRejected: (p: Proposal) => void; }
export const RejectProposalModal: React.FC<RejectProps> = ({ proposal: p, onClose, onRejected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reject = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.put<{ data: Proposal }>(`/api/proposals/${p.id}`, { status: "rejected" });
      onRejected(res.data.data);
    } catch {
      setError("Could not reject proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <ModalOverlay onClose={onClose}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
              <XCircle className="h-5 w-5 text-error" />
            </div>
            <h3 className="font-display text-base font-bold text-textPrimary">Reject Proposal</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <p className="text-sm text-textMuted">
          Are you sure you want to reject the proposal from <strong className="text-textPrimary">{p.freelancerName}</strong>? They will be notified.
        </p>

        {error && <p className="text-xs text-error rounded-xl bg-error/5 border border-error/20 px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
          <button onClick={reject} disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error py-2.5 text-sm font-bold text-white hover:bg-error/80 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            {loading ? "Rejecting…" : "Reject Proposal"}
          </button>
        </div>
      </ModalOverlay>
    </AnimatePresence>,
    document.body
  );
};

// ─── RequestRevisionModal ─────────────────────────────────────────────────────

interface RevisionProps { proposal: Proposal; onClose: () => void; onRevisionRequested: (p: Proposal) => void; }
export const RequestRevisionModal: React.FC<RevisionProps> = ({ proposal: p, onClose, onRevisionRequested }) => {
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!note.trim()) { setNoteError("Please provide revision details."); return; }
    setLoading(true); setNoteError("");
    try {
      const res = await api.put<{ data: Proposal }>(`/api/proposals/${p.id}`, { status: "revision_requested", revisionNote: note.trim() });
      onRevisionRequested(res.data.data);
    } catch {
      setNoteError("Failed to send revision request.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <ModalOverlay onClose={onClose}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <RefreshCw className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="font-display text-base font-bold text-textPrimary">Request Revision</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <p className="text-sm text-textMuted">
          Send revision notes to <strong className="text-textPrimary">{p.freelancerName}</strong>. Be specific about what changes you need.
        </p>

        <div className="space-y-1.5">
          <label className={cn("text-[10px] font-black uppercase tracking-widest", noteError ? "text-error" : "text-textDisabled")}>
            Revision Notes <span className="text-error">*</span>
          </label>
          <textarea rows={5} value={note} onChange={(e) => { setNote(e.target.value); if (e.target.value.trim()) setNoteError(""); }}
            placeholder={`e.g. "Please adjust the timeline to 5 weeks and clarify the testing phase deliverables…"`}
            className={cn("w-full resize-none rounded-xl border px-4 py-3 text-sm text-textPrimary placeholder-textDisabled bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
              noteError ? "border-error" : "border-border")} />
          {noteError && <p className="text-[11px] text-error">{noteError}</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-500 py-2.5 text-sm font-bold text-white hover:bg-yellow-400 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Sending…" : "Send Request"}
          </button>
        </div>
      </ModalOverlay>
    </AnimatePresence>,
    document.body
  );
};
