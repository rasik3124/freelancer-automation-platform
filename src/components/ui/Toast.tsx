import React, { createContext, useCallback, useContext, useReducer, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string; type: ToastType; title: string; message?: string; duration?: number;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: ToastItem[], action: { type: "add"; toast: ToastItem } | { type: "remove"; id: string }): ToastItem[] {
  if (action.type === "add")    return [...state, action.toast];
  if (action.type === "remove") return state.filter(t => t.id !== action.id);
  return state;
}

// ─── Single toast ─────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" />,
  error:   <XCircle      className="h-4 w-4 text-error" />,
  info:    <Info         className="h-4 w-4 text-blue-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
};

const STYLES: Record<ToastType, string> = {
  success: "border-success/20 bg-success/5",
  error:   "border-error/20 bg-error/5",
  info:    "border-blue-400/20 bg-blue-400/5",
  warning: "border-yellow-400/20 bg-yellow-400/5",
};

const SingleToast: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  React.useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 32, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.9 }}
      className={cn("flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-xl w-72", STYLES[toast.type])}
      style={{ backgroundColor: "#0d0d0d" }}
    >
      <div className="shrink-0 mt-0.5">{ICONS[toast.type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-textPrimary">{toast.title}</p>
        {toast.message && <p className="text-[11px] text-textMuted mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-textDisabled hover:text-textPrimary transition-colors mt-0.5">
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, dispatch] = useReducer(reducer, []);
  const counter = useRef(0);

  const add = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${++counter.current}`;
    dispatch({ type: "add", toast: { id, type, title, message, duration } });
  }, []);

  const ctx: ToastContextValue = {
    success: (t, m) => add("success", t, m),
    error:   (t, m) => add("error",   t, m),
    info:    (t, m) => add("info",    t, m),
    warning: (t, m) => add("warning", t, m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[500] flex flex-col gap-2 items-end">
          <AnimatePresence mode="popLayout">
            {toasts.map(t => (
              <SingleToast key={t.id} toast={t} onDismiss={(id) => dispatch({ type: "remove", id })} />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};
