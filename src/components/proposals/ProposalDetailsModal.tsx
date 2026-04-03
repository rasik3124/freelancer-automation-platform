import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle2, RefreshCw, XCircle, MessageSquare, Send, DollarSign, Clock, Calendar, Tag } from "lucide-react";
import { Proposal, STATUS_META, formatBudget, relativeTime } from "../../types/proposal";
import { AcceptProposalModal, RejectProposalModal, RequestRevisionModal } from "./ProposalActionModals";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface ProposalDetailsModalProps {
  proposalId: string | null;
  onClose: () => void;
  onProposalUpdated: (p: Proposal) => void;
}

const AVATAR_GRADIENTS = ["from-accent to-violet-600","from-blue-500 to-cyan-400","from-emerald-500 to-teal-400","from-orange-500 to-pink-500"];
const grad = (id: string) => AVATAR_GRADIENTS[id.charCodeAt(id.length-1) % AVATAR_GRADIENTS.length];

// ─── Simple markdown-ish renderer (bold + bullets) ────────────────────────────
const ProposalMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const isBullet = line.trim().startsWith("- ");
        const content = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        if (isBullet) return (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <p className="text-sm text-textMuted leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/^-\s/, "") }} />
          </div>
        );
        return <p key={i} className="text-sm text-textMuted leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />;
      })}
    </div>
  );
};

// ─── ProposalDetailsModal ─────────────────────────────────────────────────────

export const ProposalDetailsModal: React.FC<ProposalDetailsModalProps> = ({ proposalId, onClose, onProposalUpdated }) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showRevision, setShowRevision] = useState(false);

  useEffect(() => {
    if (!proposalId) return;
    setIsLoading(true); setError(null);
    api.get<{ data: Proposal }>(`/api/proposals/${proposalId}`)
      .then((r) => setProposal(r.data.data))
      .catch(() => setError("Could not load proposal."))
      .finally(() => setIsLoading(false));
  }, [proposalId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !showAccept && !showReject && !showRevision) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, showAccept, showReject, showRevision]);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const handleUpdated = (p: Proposal) => {
    setProposal(p); onProposalUpdated(p);
    setShowAccept(false); setShowReject(false); setShowRevision(false);
  };

  const addComment = async () => {
    if (!comment.trim() || !proposal) return;
    setCommentLoading(true);
    try {
      const r = await api.post<{ data: Proposal }>(`/api/proposals/${proposal.id}/comments`, { text: comment.trim() });
      setProposal(r.data.data); setComment("");
    } finally {
      setCommentLoading(false);
    }
  };

  const m = proposal ? STATUS_META[proposal.status] : null;

  const panel = (
    <AnimatePresence>
      {proposalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-border shadow-2xl"
            style={{ backgroundColor: "#0d0d0d" }} role="dialog" aria-modal>

            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-6">
              <h3 className="font-display text-base font-bold text-textPrimary">Proposal Details</h3>
              <button onClick={onClose} className="rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
              ) : error ? (
                <p className="text-sm text-error text-center py-10">{error}</p>
              ) : proposal ? (
                <div className="flex flex-col lg:flex-row h-full">
                  {/* ── Left: proposal text + comments ── */}
                  <div className="flex-1 min-w-0 p-6 space-y-6 border-r border-border/50">
                    {/* Freelancer header */}
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base font-black text-white", grad(proposal.freelancerId))}>
                        {proposal.freelancerAvatarInitials}
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-bold text-textPrimary">{proposal.freelancerName}</h4>
                        <p className="text-sm text-textMuted">{proposal.freelancerRole}</p>
                      </div>
                      {m && (
                        <span className={cn("ml-auto rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider", m.bg, m.text, m.border)}>{m.label}</span>
                      )}
                    </div>

                    {/* Proposal text */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-textDisabled">Proposal</h5>
                      <div className="rounded-xl border border-border p-5" style={{ backgroundColor: "#111111" }}>
                        <ProposalMarkdown text={proposal.proposalText} />
                      </div>
                    </div>

                    {/* Revision note */}
                    {proposal.revisionNote && (
                      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Revision Requested</p>
                        <p className="text-sm text-textMuted">{proposal.revisionNote}</p>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-textDisabled flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" /> Client Notes ({proposal.comments.length})
                      </h5>
                      {proposal.comments.length > 0 && (
                        <div className="space-y-2">
                          {proposal.comments.map((c, i) => (
                            <div key={i} className="rounded-xl border border-border p-3 space-y-0.5" style={{ backgroundColor: "#111111" }}>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-textPrimary">{c.author}</span>
                                <span className="text-[10px] text-textDisabled">{relativeTime(c.createdAt)}</span>
                              </div>
                              <p className="text-xs text-textMuted">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a private note…"
                          className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-xs text-textPrimary placeholder-textDisabled focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all" />
                        <button onClick={addComment} disabled={commentLoading || !comment.trim()}
                          className="shrink-0 flex items-center gap-1 rounded-xl bg-accent/10 border border-accent/30 px-3 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-colors disabled:opacity-40">
                          {commentLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Right: metadata sidebar ── */}
                  <div className="w-full lg:w-56 shrink-0 p-5 space-y-5 border-t lg:border-t-0 border-border/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled">Project</p>
                      <p className="text-sm font-bold text-textPrimary">{proposal.projectName}</p>
                    </div>
                    {[
                      { icon: DollarSign, label: "Budget", value: formatBudget(proposal.priceMin, proposal.priceMax) },
                      { icon: Clock,       label: "Timeline", value: proposal.timeline },
                      { icon: Calendar,    label: "Received",  value: relativeTime(proposal.createdAt) },
                      { icon: Tag,         label: "Updated",   value: relativeTime(proposal.updatedAt) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled flex items-center gap-1"><Icon className="h-2.5 w-2.5" />{label}</p>
                        <p className="text-sm font-semibold text-textPrimary">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Action footer */}
            {proposal && !isLoading && proposal.status !== "accepted" && proposal.status !== "rejected" && (
              <div className="border-t border-border p-4 flex flex-wrap gap-2">
                <button onClick={() => setShowAccept(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-success/10 border border-success/30 px-4 py-2.5 text-xs font-bold text-success hover:bg-success/20 transition-colors">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                </button>
                <button onClick={() => setShowRevision(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 px-4 py-2.5 text-xs font-bold text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" /> Request Revision
                </button>
                <button onClick={() => setShowReject(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-error/10 border border-error/30 px-4 py-2.5 text-xs font-bold text-error hover:bg-error/20 transition-colors ml-auto">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(
    <>
      {panel}
      {proposal && showAccept   && <AcceptProposalModal   proposal={proposal} onClose={() => setShowAccept(false)}   onAccepted={handleUpdated} />}
      {proposal && showReject   && <RejectProposalModal   proposal={proposal} onClose={() => setShowReject(false)}   onRejected={handleUpdated} />}
      {proposal && showRevision && <RequestRevisionModal  proposal={proposal} onClose={() => setShowRevision(false)} onRevisionRequested={handleUpdated} />}
    </>,
    document.body
  );
};
