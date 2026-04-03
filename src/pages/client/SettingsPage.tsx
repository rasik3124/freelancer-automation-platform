import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Building2, Bell, Link2, Trash2, Loader2, ChevronRight } from "lucide-react";
import { ClientProfile } from "../../types/settings";
import { AccountTab } from "../../components/settings/AccountTab";
import { CompanyTab } from "../../components/settings/CompanyTab";
import { NotificationsTab } from "../../components/settings/NotificationsTab";
import { ConnectedAccountsTab } from "../../components/settings/ConnectedAccountsTab";
import { DangerZoneTab } from "../../components/settings/DangerZoneTab";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Tab definition ───────────────────────────────────────────────────────────

type TabKey = "account" | "company" | "notifications" | "connected" | "danger";

interface Tab { key: TabKey; label: string; icon: React.ReactNode; danger?: boolean; }

const TABS: Tab[] = [
  { key:"account",       label:"Account",            icon:<User className="h-4 w-4" /> },
  { key:"company",       label:"Company",            icon:<Building2 className="h-4 w-4" /> },
  { key:"notifications", label:"Notifications",      icon:<Bell className="h-4 w-4" /> },
  { key:"connected",     label:"Connected Accounts", icon:<Link2 className="h-4 w-4" /> },
  { key:"danger",        label:"Danger Zone",        icon:<Trash2 className="h-4 w-4" />, danger:true },
];

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const user = useAuthStore(s => s.user);
  const uid  = user?.id ?? "anonymous";

  const [activeTab, setActiveTab]   = useState<TabKey>("account");
  const [profile, setProfile]       = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setIsLoading(true); setFetchError(null);
    try {
      const res = await api.get<{ data: ClientProfile }>(`/api/clients/${uid}`);
      setProfile(res.data.data);
    } catch {
      setFetchError("Could not load your profile. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleUpdated = (updated: ClientProfile) => setProfile(updated);

  const activeTabMeta = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-bold text-textPrimary">Settings</h2>
        <p className="text-sm text-textMuted">Manage your account, company, and preferences.</p>
      </motion.div>

      {/* Mobile tab selector (visible < md) */}
      <div className="md:hidden">
        <button onClick={() => setMobileOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-textPrimary">
          <span className="flex items-center gap-2">{activeTabMeta.icon}{activeTabMeta.label}</span>
          <ChevronRight className={cn("h-4 w-4 text-textMuted transition-transform", mobileOpen && "rotate-90")} />
        </button>
        {mobileOpen && (
          <div className="mt-1 rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "#111111" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setActiveTab(t.key); setMobileOpen(false); }}
                className={cn("flex w-full items-center gap-3 px-4 py-3 text-sm font-bold text-left border-b border-border/50 last:border-0 transition-colors",
                  t.danger ? activeTab === t.key ? "bg-error/10 text-error" : "text-error hover:bg-error/5"
                    : activeTab === t.key ? "bg-accent/10 text-accent" : "text-textMuted hover:bg-elevated")}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: sidebar + content */}
      <div className="hidden md:flex gap-6">
        {/* Sidebar nav */}
        <nav className="flex w-52 shrink-0 flex-col gap-0.5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} id={`settings-tab-${t.key}`}
              className={cn("flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-left transition-all",
                t.danger
                  ? activeTab === t.key ? "bg-error/10 text-error" : "text-error hover:bg-error/5"
                  : activeTab === t.key ? "bg-accent/10 text-accent border-l-2 border-l-accent pl-3.5" : "text-textMuted hover:bg-elevated hover:text-textPrimary")}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0 rounded-2xl border border-border p-6" style={{ backgroundColor: "#111111" }}>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-error">{fetchError}</p>
              <button onClick={fetchProfile} className="rounded-xl bg-accent/10 border border-accent/20 px-4 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-colors">Retry</button>
            </div>
          ) : profile ? (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                {activeTab === "account"       && <AccountTab        profile={profile} uid={uid} onUpdated={handleUpdated} />}
                {activeTab === "company"       && <CompanyTab        profile={profile} uid={uid} onUpdated={handleUpdated} />}
                {activeTab === "notifications" && <NotificationsTab  profile={profile} uid={uid} onUpdated={handleUpdated} />}
                {activeTab === "connected"     && <ConnectedAccountsTab profile={profile} uid={uid} onUpdated={handleUpdated} />}
                {activeTab === "danger"        && <DangerZoneTab     profile={profile} uid={uid} />}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>

      {/* Mobile content panel */}
      {!mobileOpen && profile && !isLoading && (
        <div className="md:hidden rounded-2xl border border-border p-5" style={{ backgroundColor: "#111111" }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {activeTab === "account"       && <AccountTab        profile={profile} uid={uid} onUpdated={handleUpdated} />}
              {activeTab === "company"       && <CompanyTab        profile={profile} uid={uid} onUpdated={handleUpdated} />}
              {activeTab === "notifications" && <NotificationsTab  profile={profile} uid={uid} onUpdated={handleUpdated} />}
              {activeTab === "connected"     && <ConnectedAccountsTab profile={profile} uid={uid} onUpdated={handleUpdated} />}
              {activeTab === "danger"        && <DangerZoneTab     profile={profile} uid={uid} />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
