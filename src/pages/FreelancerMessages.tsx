/**
 * FreelancerMessages.tsx + ClientMessages redirect
 *
 * Messages page for freelancers — shows conversation list + chat window.
 * The client side already has MessagesPage.tsx at /dashboard/client/messages.
 */
import React, { useState } from "react";
import { MessageCircle, Send, Search, Circle } from "lucide-react";
import { cn } from "../lib/utils";

const CONVERSATIONS = [
  { id: "cv1", name: "TechVentures Inc.",  lastMessage: "Can we review the dashboard mockup?", time: "10m", unread: 2,  avatarInitials: "TV", online: true  },
  { id: "cv2", name: "DesignStudio Co.",   lastMessage: "Invoice has been approved ✓",         time: "1h",  unread: 0,  avatarInitials: "DS", online: false },
  { id: "cv3", name: "Startup Labs",       lastMessage: "Ship the MVP by Friday please",        time: "3h",  unread: 1,  avatarInitials: "SL", online: true  },
  { id: "cv4", name: "Growth Agency",      lastMessage: "Thanks for the update!",               time: "1d",  unread: 0,  avatarInitials: "GA", online: false },
];

const DEMO_MESSAGES: Record<string, { id: string; sender: "me" | "them"; text: string; time: string }[]> = {
  cv1: [
    { id: "m1", sender: "them", text: "Hey! Can we review the dashboard mockup?", time: "10:02 AM" },
    { id: "m2", sender: "me",   text: "Sure! I'll share the Figma link now.",      time: "10:04 AM" },
    { id: "m3", sender: "them", text: "Perfect, looking forward to it.",            time: "10:05 AM" },
  ],
  cv2: [
    { id: "m1", sender: "them", text: "Invoice has been approved ✓", time: "9:00 AM" },
    { id: "m2", sender: "me",   text: "Thank you! Payment received.",  time: "9:10 AM" },
  ],
  cv3: [
    { id: "m1", sender: "them", text: "Ship the MVP by Friday please", time: "8:00 AM" },
    { id: "m2", sender: "me",   text: "On it, will deliver Thursday.", time: "8:15 AM" },
  ],
  cv4: [
    { id: "m1", sender: "me",   text: "The automation is live!",     time: "Yesterday" },
    { id: "m2", sender: "them", text: "Thanks for the update!",      time: "Yesterday" },
  ],
};

export const FreelancerMessages: React.FC = () => {
  const [active, setActive]   = useState("cv1");
  const [input, setInput]     = useState("");
  const [search, setSearch]   = useState("");

  const conv    = CONVERSATIONS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const msgs    = DEMO_MESSAGES[active] ?? [];
  const current = CONVERSATIONS.find(c => c.id === active);

  const handleSend = () => { if (!input.trim()) return; setInput(""); };

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[540px] overflow-hidden rounded-2xl border border-border bg-base shadow-2xl">

      {/* ── Sidebar ── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-border bg-surface/60">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-sm font-semibold text-text-primary mb-2">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-disabled" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-xl border border-border bg-elevated pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conv.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)}
              className={cn("w-full flex items-center gap-3 border-l-2 px-4 py-3 text-left transition-all",
                active === c.id ? "border-accent bg-elevated" : "border-transparent hover:bg-elevated/50")}>
              <div className="relative shrink-0">
                <div className="h-9 w-9 flex items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-xs font-bold text-accent">
                  {c.avatarInitials}
                </div>
                {c.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={cn("truncate text-xs font-semibold", active === c.id ? "text-accent" : "text-text-primary")}>{c.name}</p>
                  <span className="shrink-0 text-[10px] text-text-disabled">{c.time}</span>
                </div>
                <p className="truncate text-[11px] text-text-muted">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-base">{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        {current && (
          <div className="flex items-center gap-3 border-b border-border px-5 py-3 bg-surface/80 backdrop-blur-sm">
            <div className="relative">
              <div className="h-8 w-8 flex items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-xs font-bold text-accent">
                {current.avatarInitials}
              </div>
              {current.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{current.name}</p>
              <p className="text-[11px] text-text-muted">{current.online ? "Online" : "Offline"}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
          {msgs.map(m => (
            <div key={m.id} className={cn("flex items-end gap-2", m.sender === "me" && "flex-row-reverse")}>
              <div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.sender === "me"
                  ? "bg-accent text-white rounded-br-sm shadow-glow"
                  : "bg-elevated border border-border text-text-primary rounded-bl-sm")}>
                {m.text}
              </div>
              <span className="text-[10px] text-text-disabled shrink-0">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 bg-surface/80">
          <div className="flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all" />
            <button onClick={handleSend} disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-base hover:bg-accent-muted disabled:opacity-40 transition-all shadow-glow">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
