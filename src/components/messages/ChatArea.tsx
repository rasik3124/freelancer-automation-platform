import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ExternalLink, Paperclip, Send, Loader2, RefreshCw } from "lucide-react";
import { Message, Conversation, groupMessagesByDate, avatarGrad } from "../../types/message";
import { MessageBubble } from "./MessageBubble";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatAreaProps {
  conversation: Conversation | null;
  onBack: () => void; // mobile — back to list
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-[10px] font-black text-textDisabled">...</div>
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5">
      {[0, 0.15, 0.3].map((delay) => (
        <span key={delay} className="h-1.5 w-1.5 rounded-full bg-textDisabled animate-bounce" style={{ animationDelay: `${delay}s` }} />
      ))}
    </div>
  </div>
);

// ─── Date separator ───────────────────────────────────────────────────────────

const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="flex-1 h-px bg-border/50" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-textDisabled px-1">{label}</span>
    <div className="flex-1 h-px bg-border/50" />
  </div>
);

// ─── ChatArea ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 5000; // 5s polling for new messages

export const ChatArea: React.FC<ChatAreaProps> = ({ conversation, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // ── Fetch messages ─────────────────────────────────────────────────────────
  const fetchMessages = async (convId: string, silent = false) => {
    if (!silent) setIsLoading(true); setError(null);
    try {
      const r = await api.get<{ data: Message[] }>(`/api/conversations/${convId}/messages`);
      setMessages(r.data.data);
      // Mark as read
      api.patch(`/api/conversations/${convId}/read`).catch(() => {});
    } catch { setError("Could not load messages."); }
    finally { if (!silent) setIsLoading(false); }
  };

  useEffect(() => {
    if (!conversation) { setMessages([]); return; }
    fetchMessages(conversation.id);
    pollRef.current = setInterval(() => fetchMessages(conversation.id, true), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversation?.id]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim();
    if (!text || !conversation || sending) return;
    setInput(""); setSending(true);
    // Optimistic
    const optMsg: Message = {
      id: `opt-${Date.now()}`, conversationId: conversation.id,
      senderId: "client", senderType: "client", senderName: "You", senderAvatarInitials: "ME",
      text, createdAt: new Date().toISOString(), read: true,
    };
    setMessages((prev) => [...prev, optMsg]);
    try {
      const r = await api.post<{ data: Message }>(`/api/conversations/${conversation.id}/messages`, { text });
      setMessages((prev) => prev.map((m) => m.id === optMsg.id ? r.data.data : m));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optMsg.id)); // rollback
      setInput(text); // restore
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!conversation) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center" style={{ backgroundColor: "#0d0d0d" }}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
        <Send className="h-8 w-8 text-accent/60" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-bold text-textPrimary">Select a conversation</h3>
        <p className="text-sm text-textMuted max-w-xs">Choose a conversation from the left to start messaging.</p>
      </div>
    </div>
  );

  const grad = avatarGrad(conversation.freelancerId);
  const groups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ backgroundColor: "#0d0d0d" }}>
      {/* Chat header */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4 shrink-0">
        {/* Mobile back */}
        <button onClick={onBack} className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        {/* Avatar */}
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-black text-white", grad)}>
          {conversation.freelancerAvatarInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-textPrimary truncate">{conversation.freelancerName}</p>
          {conversation.topic && <p className="text-[10px] text-textDisabled truncate">{conversation.topic}</p>}
        </div>
        <a href={`/dashboard/client/freelancers`}
          className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
          <ExternalLink className="h-3 w-3" /> Profile
        </a>
        <button onClick={() => fetchMessages(conversation.id)} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors" title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
        ) : error ? (
          <p className="text-center text-sm text-error py-8">{error}</p>
        ) : messages.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-textMuted">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <DateSeparator label={group.label} />
              <div className="space-y-1.5">
                {group.messages.map((m, i) => {
                  const prevSameType = i > 0 && group.messages[i - 1].senderType === m.senderType;
                  return <MessageBubble key={m.id} message={m} showAvatar={!prevSameType} />;
                })}
              </div>
            </div>
          ))
        )}
        {/* Typing indicator placeholder (add real-time in prod) */}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3 shrink-0" style={{ backgroundColor: "#111111" }}>
        <div className={cn("flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-accent/40 focus-within:border-accent/40", "border-border bg-surface")}>
          {/* Attachment (placeholder) */}
          <button className="mb-0.5 shrink-0 text-textDisabled hover:text-textPrimary transition-colors" title="Attach file (coming soon)">
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
            onKeyDown={handleKey}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none bg-transparent text-sm text-textPrimary placeholder-textDisabled focus:outline-none leading-relaxed max-h-[120px]"
            style={{ height: "24px" }}
          />

          {/* Send button */}
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="mb-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white hover:bg-accent/90 shadow-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-textDisabled text-center">
          5-second polling active · Real-time via Firestore in production
        </p>
      </div>
    </div>
  );
};
