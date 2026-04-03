import React, { useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { ClientProfile, ConnectedAccounts } from "../../types/settings";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface ConnectedAccountsTabProps { profile: ClientProfile; uid: string; onUpdated: (p: ClientProfile) => void; }

// ─── Integration card ─────────────────────────────────────────────────────────

interface Integration {
  key: keyof ConnectedAccounts;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  connectUrl?: string;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);
const OutlookIcon = () => (
  <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[8px] font-black text-white">O</div>
);
const ZapierIcon = () => (
  <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-[8px] font-black text-white">Z</div>
);

const INTEGRATIONS: Integration[] = [
  { key:"google",  name:"Google",  color:"from-blue-500/10 to-red-500/5 border-blue-500/20",
    description:"One-click sign-in and Google Calendar sync for meetings.",
    icon:<GoogleIcon />, connectUrl: "#" },
  { key:"github",  name:"GitHub",  color:"from-slate-500/10 to-slate-600/5 border-slate-500/20",
    description:"Link your GitHub for portfolio and project verification.",
    icon:<GitHubIcon />, connectUrl: "#" },
  { key:"outlook", name:"Outlook / iCal", color:"from-blue-600/10 to-sky-500/5 border-blue-600/20",
    description:"Sync Crescent Black meetings to your Outlook or Apple calendar.",
    icon:<OutlookIcon />, connectUrl: "#" },
  { key:"zapier",  name:"Zapier",  color:"from-orange-500/10 to-yellow-400/5 border-orange-500/20",
    description:"Connect 5,000+ apps via Zapier for custom automation workflows.",
    icon:<ZapierIcon />, connectUrl: "https://zapier.com" },
];

export const ConnectedAccountsTab: React.FC<ConnectedAccountsTabProps> = ({ profile, uid, onUpdated }) => {
  const [accounts, setAccounts] = useState<ConnectedAccounts>({ ...profile.connectedAccounts });
  const [toggling, setToggling] = useState<keyof ConnectedAccounts | null>(null);

  const toggle = async (key: keyof ConnectedAccounts) => {
    setToggling(key);
    try {
      const newState = { ...accounts, [key]: !accounts[key] };
      // In prod: trigger OAuth flow for connect, revoke token for disconnect
      const res = await api.put<{ data: ClientProfile }>(`/api/clients/${uid}`, { connectedAccounts: newState });
      setAccounts(res.data.data.connectedAccounts);
      onUpdated(res.data.data);
    } catch { /* silent */ }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-base font-bold text-textPrimary">Connected Accounts</h3>
        <p className="text-xs text-textMuted mt-0.5">Integrate external services to enhance your workflow.</p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map((intg) => {
          const connected = accounts[intg.key];
          const isToggling = toggling === intg.key;
          return (
            <div key={intg.key}
              className={cn("flex items-center gap-4 rounded-2xl border bg-gradient-to-r p-5 transition-all", intg.color)}>
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated">
                {intg.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-textPrimary">{intg.name}</p>
                  {connected
                    ? <span className="flex items-center gap-1 text-[10px] font-bold text-success"><CheckCircle2 className="h-3 w-3" />Connected</span>
                    : <span className="flex items-center gap-1 text-[10px] font-bold text-textDisabled"><XCircle className="h-3 w-3" />Not connected</span>}
                </div>
                <p className="text-xs text-textMuted mt-0.5">{intg.description}</p>
              </div>

              {/* Action */}
              <button
                id={`connect-${intg.key}`}
                onClick={() => toggle(intg.key)}
                disabled={isToggling}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all disabled:opacity-50",
                  connected
                    ? "border-error/30 bg-error/10 text-error hover:bg-error/20"
                    : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20")}>
                {isToggling
                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : connected ? <XCircle className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                {isToggling ? "…" : connected ? "Disconnect" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-textDisabled">
        OAuth flows are simulated in demo mode — no real tokens are stored or transmitted.
      </p>
    </div>
  );
};
