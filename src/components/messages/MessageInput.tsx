/**
 * MessageInput.tsx — Compose + send message
 *
 * Features:
 *   - Auto-resizing textarea (up to 5 lines)
 *   - Character count (warn at 4500, block at 5000)
 *   - Enter to send, Shift+Enter for new line
 *   - Typing indicator: emit socket events with debounce
 *   - Optimistic send via onMessageSent callback
 *   - Disabled states while sending
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";
import { ArrowRight, Loader2, Paperclip, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { useDebounce } from "../../hooks/useDebounce";
import type { TypedSocket } from "../../hooks/useSocket";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS   = 5000;
const WARN_CHARS  = 4500;
const TYPING_INTERVAL_MS = 250; // How often typing:start fires while typing

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageInputProps {
  conversationId: string;
  onMessageSent:  (text: string) => Promise<void>;
  isLoading?:     boolean;
  error?:         string | null;
  socket?:        TypedSocket | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onMessageSent,
  isLoading = false,
  error     = null,
  socket    = null,
}) => {
  const [value,          setValue]         = useState("");
  const [isSending,      setIsSending]     = useState(false);
  const [validationError, setValidation]   = useState<string | null>(null);
  const [isTyping,       setIsTyping]      = useState(false);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef<number>(0);

  // Debounced value to detect when typing has *stopped*
  const debouncedValue = useDebounce(value, 1500);

  // Emit typing:stop when debounced value settles and typing was active
  useEffect(() => {
    if (!isTyping) return;
    if (!socket || !conversationId) return;
    socket.emit("typing:stop", { conversationId });
    setIsTyping(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Auto-focus
  useEffect(() => { textareaRef.current?.focus(); }, [conversationId]);

  // Auto-resize textarea
  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px"; // max ~5 lines
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);
    setValidation(null);
    resize();

    // Typing indicator throttle
    if (!socket || !conversationId) return;
    const now = Date.now();
    if (now - lastTypingSent.current > TYPING_INTERVAL_MS) {
      socket.emit("typing:start", { conversationId });
      lastTypingSent.current = now;
      setIsTyping(true);
    }
  };

  const doSend = useCallback(async () => {
    const text = value.trim();

    // Validation
    if (!text) {
      setValidation("Message cannot be empty.");
      return;
    }
    if (text.length > MAX_CHARS) {
      setValidation(`Message max ${MAX_CHARS} characters.`);
      return;
    }

    setValue("");
    resize();
    setIsSending(true);
    setValidation(null);

    // Stop typing indicator
    if (socket && conversationId) {
      socket.emit("typing:stop", { conversationId });
      setIsTyping(false);
    }

    try {
      await onMessageSent(text);
    } catch {
      setValidation("Failed to send — please try again.");
      setValue(text); // restore
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [value, onMessageSent, socket, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const charColor =
    value.length > MAX_CHARS  ? "text-error" :
    value.length > WARN_CHARS ? "text-gold"  :
    "text-textDisabled";

  const hasError = !!validationError || !!error;

  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 border-t border-border shrink-0" style={{ backgroundColor: "#111111" }}>

      {/* Validation / API error */}
      {hasError && (
        <div className="flex items-center gap-1.5 text-error text-xs px-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{validationError ?? error}</span>
        </div>
      )}

      {/* Input row */}
      <div
        className={cn(
          "flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all",
          "focus-within:ring-2 focus-within:ring-accent/40 focus-within:border-accent/40",
          hasError ? "border-error/50 bg-error/5" : "border-border bg-surface"
        )}
      >
        {/* Attachment (placeholder) */}
        <button
          className="mb-0.5 shrink-0 text-textDisabled hover:text-textPrimary transition-colors"
          title="Attach file (coming soon)"
          type="button"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          disabled={isSending || isLoading}
          className="flex-1 resize-none bg-transparent text-sm text-textPrimary placeholder-textDisabled focus:outline-none leading-relaxed max-h-[120px] disabled:opacity-60"
          style={{ height: "24px" }}
          maxLength={MAX_CHARS + 100} // allow slight overflow for UX, validate on send
        />

        {/* Send button */}
        <motion.button
          type="button"
          onClick={doSend}
          disabled={isSending || isLoading || !value.trim()}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "mb-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl transition-all",
            value.trim() && !isSending
              ? "bg-accent text-white hover:bg-accent/90 shadow-glow cursor-pointer"
              : "bg-elevated border border-border text-textDisabled cursor-not-allowed"
          )}
        >
          {isSending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <ArrowRight className="h-3.5 w-3.5" />
          }
        </motion.button>
      </div>

      {/* Character count */}
      <div className="flex justify-end px-1">
        <span className={cn("text-[10px] tabular-nums transition-colors", charColor)}>
          {value.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
