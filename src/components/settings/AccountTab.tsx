import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Save, Lock, Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { ClientProfile, COUNTRIES } from "../../types/settings";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Shared field components ──────────────────────────────────────────────────

export const SField: React.FC<{ label: string; id: string; error?: string; required?: boolean; children: React.ReactNode }> = ({ label, id, error, required, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className={cn("text-[10px] font-black uppercase tracking-widest", error ? "text-error" : "text-textDisabled")}>
      {label}{required && <span className="text-error ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-error">{error}</p>}
  </div>
);

export const inputCls = (err?: string) => cn(
  "w-full rounded-xl border px-4 py-2.5 text-sm text-textPrimary placeholder-textDisabled bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
  err ? "border-error" : "border-border"
);

export const SaveRow: React.FC<{ saving: boolean; saved: boolean; onSave: () => void; error?: string }> = ({ saving, saved, onSave, error }) => (
  <div className="flex items-center justify-between pt-4 border-t border-border">
    <div>
      {error && <p className="text-xs text-error">{error}</p>}
      {saved && <p className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</p>}
    </div>
    <button onClick={onSave} disabled={saving}
      className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-all disabled:opacity-50">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? "Saving…" : "Save Changes"}
    </button>
  </div>
);

// ─── Change Password Modal ────────────────────────────────────────────────────

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const save = async () => {
    if (!current) return setError("Current password required.");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("Passwords do not match.");
    setSaving(true); setError("");
    try {
      await api.put("/auth/password", { currentPassword: current, newPassword: next });
      setSaving(false); setDone(true);
      setTimeout(onClose, 1400);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to update password.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border shadow-2xl"
        style={{ backgroundColor: "#0d0d0d" }}>
        <div className="flex h-12 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-accent" /><h4 className="text-sm font-bold text-textPrimary">Change Password</h4></div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {done ? (
            <div className="flex items-center gap-2 text-success py-4 justify-center"><CheckCircle2 className="h-5 w-5" /><p className="font-bold">Password updated!</p></div>
          ) : (
            <>
              {[
                { id:"pw-current", label:"Current Password", val:current, set:setCurrent },
                { id:"pw-new",     label:"New Password",     val:next,    set:setNext },
                { id:"pw-confirm", label:"Confirm New",      val:confirm, set:setConfirm },
              ].map(({ id, label, val, set }) => (
                <SField key={id} label={label} id={id}>
                  <div className="relative">
                    <input id={id} type={show ? "text" : "password"} value={val} onChange={e => set(e.target.value)}
                      className={cn(inputCls(), "pr-10")} placeholder="••••••••" />
                    <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-textDisabled hover:text-textPrimary transition-colors">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </SField>
              ))}
              {error && <p className="text-xs text-error">{error}</p>}
            </>
          )}
        </div>
        {!done && (
          <div className="flex gap-3 border-t border-border px-5 py-4">
            <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {saving ? "Updating…" : "Update"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── AccountTab ───────────────────────────────────────────────────────────────

interface AccountTabProps {
  profile: ClientProfile; uid: string;
  onUpdated: (p: ClientProfile) => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({ profile, uid, onUpdated }) => {
  const [form, setForm] = useState({ fullName: profile.fullName, phone: profile.phone, location: profile.location });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const [showPw, setShowPw] = useState(false);

  const set = (k: keyof typeof form, v: string) => { setForm(p => ({ ...p, [k]: v })); setSaved(false); };

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await api.put<{ data: ClientProfile }>(`/api/clients/${uid}`, form);
      onUpdated(res.data.data); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-textPrimary">Account Details</h3>
        <p className="text-xs text-textMuted mt-0.5">Manage your personal information and credentials.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SField label="Full Name / Contact Person" id="acc-name" required>
          <input id="acc-name" value={form.fullName} onChange={e => set("fullName", e.target.value)}
            placeholder="Jane Smith" className={inputCls()} />
        </SField>

        <SField label="Email" id="acc-email">
          <div className="relative">
            <input id="acc-email" value={profile.email} readOnly
              className="w-full rounded-xl border border-border/50 bg-surface/50 px-4 py-2.5 text-sm text-textDisabled cursor-not-allowed" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-textDisabled bg-elevated rounded-full px-2 py-0.5">Read-only</span>
          </div>
        </SField>

        <SField label="Phone Number" id="acc-phone">
          <input id="acc-phone" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
            placeholder="+1 (555) 000-0000" className={inputCls()} />
        </SField>

        <SField label="Country / Location" id="acc-location">
          <select id="acc-location" value={form.location} onChange={e => set("location", e.target.value)} className={inputCls()}>
            <option value="">Select country…</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </SField>
      </div>

      <div className="rounded-xl border border-border/50 bg-surface/30 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-textPrimary">Password</p>
          <p className="text-xs text-textMuted">Last changed: not tracked in demo</p>
        </div>
        <button onClick={() => setShowPw(true)}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
          <Lock className="h-3.5 w-3.5" /> Change Password
        </button>
      </div>

      <SaveRow saving={saving} saved={saved} onSave={save} error={error} />

      {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} />}
    </div>
  );
};
