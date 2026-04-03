import React, { useState } from "react";
import { Mail, Smartphone } from "lucide-react";
import { ClientProfile, NotificationSettings } from "../../types/settings";
import { SaveRow } from "./AccountTab";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface NotificationsTabProps { profile: ClientProfile; uid: string; onUpdated: (p: ClientProfile) => void; }

// ─── Toggle row ───────────────────────────────────────────────────────────────

const Toggle: React.FC<{ id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  id, label, description, checked, onChange,
}) => (
  <div className={cn("flex items-start justify-between gap-4 rounded-xl border p-4 transition-all",
    checked ? "border-accent/20 bg-accent/5" : "border-border bg-surface/30")}>
    <div className="min-w-0">
      <p className="text-sm font-bold text-textPrimary">{label}</p>
      <p className="text-xs text-textMuted mt-0.5">{description}</p>
    </div>
    <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-all",
        checked ? "bg-accent border-accent" : "bg-elevated border-border")}>
      <span className={cn("inline-block h-4 w-4 translate-y-[-0.5px] rounded-full bg-white shadow transition-transform mt-0.5",
        checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</div>
    <div>
      <p className="text-sm font-bold text-textPrimary">{title}</p>
      <p className="text-xs text-textMuted">{subtitle}</p>
    </div>
  </div>
);

// ─── NotificationsTab ─────────────────────────────────────────────────────────

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ profile, uid, onUpdated }) => {
  const [notifs, setNotifs] = useState<NotificationSettings>({ ...profile.notifications });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  const set = (k: keyof NotificationSettings, v: boolean) => {
    setNotifs(p => ({ ...p, [k]: v })); setSaved(false);
  };

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await api.put<{ data: ClientProfile }>(`/api/clients/${uid}`, { notifications: notifs });
      onUpdated(res.data.data); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Failed to save notification settings."); }
    finally { setSaving(false); }
  };

  const EMAIL_TOGGLES: { key: keyof NotificationSettings; label: string; desc: string }[] = [
    { key:"emailNewProposals",      label:"New Proposals",            desc:"When a freelancer submits a proposal on your project." },
    { key:"emailProposalReminders", label:"Proposal Reminders",       desc:"Reminders to review pending proposals before they expire." },
    { key:"emailMeetingReminders",  label:"Meeting Reminders",        desc:"1 hour and 1 day before a scheduled meeting." },
    { key:"emailInvoices",          label:"Invoice Notifications",    desc:"When a new invoice is received or becomes overdue." },
    { key:"emailProjectUpdates",    label:"Project Updates",          desc:"Status changes and milestone completions on your projects." },
    { key:"emailAiInsights",        label:"AI Insights",              desc:"Weekly AI-generated recommendations for your projects." },
    { key:"emailWeeklyDigest",      label:"Weekly Digest",            desc:"A summary of activity across all your projects." },
  ];

  const PUSH_TOGGLES: { key: keyof NotificationSettings; label: string; desc: string }[] = [
    { key:"pushNewProposals",     label:"New Proposals",    desc:"Instant push when a new proposal arrives." },
    { key:"pushMeetingReminders", label:"Meeting Alerts",   desc:"Push notification 30 minutes before meetings." },
    { key:"pushMessages",         label:"New Messages",     desc:"When a freelancer sends you a message." },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-textPrimary">Notification Preferences</h3>
        <p className="text-xs text-textMuted mt-0.5">Control when and how you hear from Crescent Black.</p>
      </div>

      {/* Email */}
      <div className="space-y-3">
        <SectionHeader icon={<Mail className="h-4 w-4" />} title="Email Notifications"
          subtitle="Sent to your registered email address" />
        {EMAIL_TOGGLES.map(t => (
          <Toggle key={t.key} id={`notif-${t.key}`} label={t.label} description={t.desc}
            checked={notifs[t.key]} onChange={(v) => set(t.key, v)} />
        ))}
      </div>

      {/* Push */}
      <div className="space-y-3">
        <SectionHeader icon={<Smartphone className="h-4 w-4" />} title="Push Notifications"
          subtitle="Requires browser permission to be enabled" />
        {PUSH_TOGGLES.map(t => (
          <Toggle key={t.key} id={`notif-${t.key}`} label={t.label} description={t.desc}
            checked={notifs[t.key]} onChange={(v) => set(t.key, v)} />
        ))}
      </div>

      <SaveRow saving={saving} saved={saved} onSave={save} error={error} />
    </div>
  );
};
