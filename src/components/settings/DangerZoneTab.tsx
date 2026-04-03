import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Trash2, Loader2, Eye, EyeOff, X } from "lucide-react";
import { ClientProfile } from "../../types/settings";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface DangerZoneTabProps { profile: ClientProfile; uid: string; }

// ─── Delete confirmation modal ────────────────────────────────────────────────

const DeleteModal: React.FC<{ uid: string; onClose: () => void }> = ({ uid, onClose }) => {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [checked, setChecked]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState("");
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const confirm = async () => {
    if (!password) return setError("Please enter your password to confirm.");
    if (!checked)  return setError("Please tick the acknowledgement checkbox.");
    setDeleting(true); setError("");
    try {
      await api.delete(`/api/clients/${uid}`);
      logout();
      navigate("/", { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Could not delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-error/30 shadow-2xl"
        style={{ backgroundColor: "#0d0d0d" }}>

        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-error/20 bg-error/5 px-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-error" />
            <h4 className="text-sm font-bold text-error">Delete Account</h4>
          </div>
          <button onClick={onClose} disabled={deleting} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Warning banner */}
          <div className="rounded-xl border border-error/20 bg-error/5 p-4 space-y-2">
            <p className="text-sm font-bold text-error">⚠ This action cannot be undone.</p>
            <ul className="space-y-1 text-xs text-textMuted list-disc list-inside">
              <li>All your projects, proposals and messages will be permanently deleted.</li>
              <li>Active freelancer contracts will be terminated immediately.</li>
              <li>Any unpaid invoices must be settled before deletion.</li>
              <li>You will not be able to recover your account.</li>
            </ul>
          </div>

          {/* Password re-entry */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-textDisabled">
              Confirm Your Password <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your current password"
                className="w-full rounded-xl border border-error/30 bg-surface px-4 py-2.5 pr-10 text-sm text-textPrimary placeholder-textDisabled focus:outline-none focus:ring-2 focus:ring-error/40 transition-all" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textDisabled hover:text-textPrimary transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Acknowledgement */}
          <label className={cn("flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
            checked ? "border-error/40 bg-error/5" : "border-border hover:border-error/20")}>
            <input type="checkbox" checked={checked} onChange={e => { setChecked(e.target.checked); setError(""); }}
              className="mt-0.5 h-4 w-4 rounded border border-border accent-error shrink-0" />
            <span className="text-xs text-textMuted leading-relaxed">
              I understand that my account, all projects, proposals, conversations, invoices and associated data will be <strong className="text-textPrimary">permanently and irreversibly deleted</strong>.
            </span>
          </label>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-error">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={confirm} disabled={deleting || !password || !checked}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error py-2.5 text-sm font-bold text-white hover:bg-error/80 transition-colors disabled:opacity-40">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? "Deleting…" : "Delete My Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── DangerZoneTab ────────────────────────────────────────────────────────────

export const DangerZoneTab: React.FC<DangerZoneTabProps> = ({ profile, uid }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-error">Danger Zone</h3>
        <p className="text-xs text-textMuted mt-0.5">Irreversible account actions. Proceed with extreme caution.</p>
      </div>

      {/* Data export */}
      <div className="flex items-center justify-between rounded-xl border border-border p-5">
        <div>
          <p className="text-sm font-bold text-textPrimary">Export Account Data</p>
          <p className="text-xs text-textMuted mt-0.5">Download a ZIP of all your projects, proposals, messages, and invoices.</p>
        </div>
        <button className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
          Export Data
        </button>
      </div>

      {/* Pause account */}
      <div className="flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
        <div>
          <p className="text-sm font-bold text-textPrimary">Pause Account</p>
          <p className="text-xs text-textMuted mt-0.5">Temporarily hide your projects and disable notifications. Reactivate anytime.</p>
        </div>
        <button className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-bold text-yellow-400 hover:bg-yellow-500/20 transition-colors">
          Pause
        </button>
      </div>

      {/* Delete */}
      <div className="rounded-2xl border-2 border-error/30 bg-error/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/20">
            <Trash2 className="h-5 w-5 text-error" />
          </div>
          <div>
            <p className="font-bold text-error">Delete Account</p>
            <p className="text-xs text-textMuted mt-1">
              Permanently delete your Crescent Black client account and all associated data.
              This includes all projects, proposals, conversations, invoices, and connected freelancers.
              <strong className="text-textPrimary"> This action cannot be reversed.</strong>
            </p>
          </div>
        </div>
        <button
          id="delete-account-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-error px-5 py-2.5 text-sm font-bold text-white hover:bg-error/80 transition-colors">
          <Trash2 className="h-4 w-4" />
          Delete My Account…
        </button>
      </div>

      <AnimatePresence>
        {showModal && <DeleteModal uid={uid} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
};
