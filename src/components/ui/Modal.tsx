import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
  /** Don't show the default header */
  noHeader?: boolean;
  /** Don't close on backdrop click */
  persistent?: boolean;
  /** Footer content */
  footer?: React.ReactNode;
}

const WIDTHS: Record<ModalSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-lg",
  lg:   "max-w-2xl",
  xl:   "max-w-4xl",
  full: "max-w-[95vw]",
};

export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, size = "md", children, noHeader, persistent, footer
}) => {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !persistent) onClose(); };
    document.addEventListener("keydown", h);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", h); };
  }, [open, onClose, persistent]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={persistent ? undefined : onClose} />
          <motion.div
            role="dialog" aria-modal
            initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn("relative z-10 w-full flex flex-col overflow-hidden rounded-2xl border border-border shadow-2xl", WIDTHS[size])}
            style={{ backgroundColor: "#0d0d0d", maxHeight: "90vh" }}
          >
            {!noHeader && (
              <div className="flex h-14 items-center justify-between border-b border-border px-6 shrink-0">
                {title
                  ? <h3 className="font-display text-base font-bold text-textPrimary">{title}</h3>
                  : <div />}
                <button onClick={onClose} aria-label="Close"
                  className="rounded-lg p-1.5 text-textDisabled hover:bg-elevated hover:text-textPrimary transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">{children}</div>
            {footer && <div className="border-t border-border px-6 py-4 flex gap-3 shrink-0">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/** Side-drawer variant — slides in from the right */
export const Drawer: React.FC<Omit<ModalProps, "size"> & { width?: string }> = ({
  open, onClose, title, children, noHeader, persistent, footer, width = "max-w-xl"
}) => {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !persistent) onClose(); };
    document.addEventListener("keydown", h);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", h); };
  }, [open, persistent, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={persistent ? undefined : onClose} />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className={cn("relative z-10 flex h-full w-full flex-col overflow-hidden border-l border-border shadow-2xl", width)}
            style={{ backgroundColor: "#0d0d0d" }}
          >
            {!noHeader && (
              <div className="flex h-14 items-center justify-between border-b border-border px-6 shrink-0">
                {title ? <h3 className="font-display text-base font-bold text-textPrimary">{title}</h3> : <div />}
                <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:bg-elevated hover:text-textPrimary transition-colors"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">{children}</div>
            {footer && <div className="border-t border-border px-6 py-4 flex gap-3 shrink-0">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
