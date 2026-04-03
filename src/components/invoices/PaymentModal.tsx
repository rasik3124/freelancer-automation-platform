import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CreditCard, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Invoice, formatCurrency } from "../../types/invoice";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onPaid: (inv: Invoice) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCardNumber(val: string): string {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onPaid }) => {
  const [card, setCard]       = useState("");
  const [expiry, setExpiry]   = useState("");
  const [cvc, setCvc]         = useState("");
  const [name, setName]       = useState("");
  const [errors, setErrors]   = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string,string> = {};
    const digits = card.replace(/\s/g,"");
    if (digits.length < 16) e.card = "Enter a valid 16-digit card number.";
    if (expiry.length < 5) e.expiry = "Enter a valid expiry (MM/YY).";
    else {
      const [m, y] = expiry.split("/").map(Number);
      const exp = new Date(2000 + y, m - 1, 1);
      if (exp < new Date()) e.expiry = "Card has expired.";
    }
    if (cvc.length < 3) e.cvc = "Enter a valid CVC.";
    if (!name.trim()) e.name = "Cardholder name is required.";
    return e;
  };

  const pay = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setError("");
    try {
      // Production: create Stripe PaymentIntent + confirmCardPayment here using @stripe/stripe-js
      // For now, send last 4 digits to server for the simulated payment flow
      const last4 = card.replace(/\s/g,"").slice(-4);
      const res = await api.post<{ data: Invoice }>(`/api/invoices/${invoice.id}/pay`, { cardLast4: last4 });
      setSuccess(true);
      setTimeout(() => { onPaid(res.data.data); onClose(); }, 1800);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Payment failed. Please check your card details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldCls = (err?: string) => cn(
    "w-full rounded-xl border px-4 py-2.5 text-sm text-textPrimary placeholder-textDisabled bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
    err ? "border-error" : "border-border"
  );

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border shadow-2xl"
        style={{ backgroundColor: "#0d0d0d" }}>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-accent/20 via-violet-600/10 to-transparent px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-accent" />
                <h3 className="font-display text-base font-bold text-textPrimary">Secure Payment</h3>
                <span className="flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[9px] font-black uppercase text-success">
                  <Lock className="h-2.5 w-2.5" /> SSL
                </span>
              </div>
              <p className="text-xs text-textMuted">{invoice.invoiceNumber} · {invoice.freelancerName}</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors"><X className="h-4 w-4" /></button>
          </div>

          {/* Amount callout */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
            <span className="text-xs text-textMuted">Total due</span>
            <span className="font-display text-2xl font-black text-textPrimary">{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="font-bold text-textPrimary">Payment Successful!</p>
              <p className="text-sm text-textMuted">Your payment has been processed. Receipt is on its way.</p>
            </motion.div>
          ) : (
            <>
              {/* Cardholder name */}
              <div className="space-y-1.5">
                <label className={cn("text-[10px] font-black uppercase tracking-widest", errors.name ? "text-error" : "text-textDisabled")}>
                  Cardholder Name <span className="text-error">*</span>
                </label>
                <input value={name} onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: "" })); }}
                  placeholder="Jane Smith" className={fieldCls(errors.name)} />
                {errors.name && <p className="text-[11px] text-error">{errors.name}</p>}
              </div>

              {/* Card number */}
              <div className="space-y-1.5">
                <label className={cn("text-[10px] font-black uppercase tracking-widest", errors.card ? "text-error" : "text-textDisabled")}>
                  Card Number <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input value={card} onChange={e => { setCard(formatCardNumber(e.target.value)); setErrors(v => ({ ...v, card: "" })); }}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    className={cn(fieldCls(errors.card), "font-mono tracking-wider pr-10")} />
                  <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textDisabled" />
                </div>
                {errors.card && <p className="text-[11px] text-error">{errors.card}</p>}
              </div>

              {/* Expiry + CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest", errors.expiry ? "text-error" : "text-textDisabled")}>
                    Expiry <span className="text-error">*</span>
                  </label>
                  <input value={expiry} onChange={e => { setExpiry(formatExpiry(e.target.value)); setErrors(v => ({ ...v, expiry: "" })); }}
                    placeholder="MM/YY" maxLength={5} className={cn(fieldCls(errors.expiry), "font-mono")} />
                  {errors.expiry && <p className="text-[11px] text-error">{errors.expiry}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest", errors.cvc ? "text-error" : "text-textDisabled")}>
                    CVC <span className="text-error">*</span>
                  </label>
                  <input value={cvc} onChange={e => { setCvc(e.target.value.replace(/\D/g,"").slice(0,4)); setErrors(v => ({ ...v, cvc: "" })); }}
                    placeholder="123" maxLength={4} type="password" className={cn(fieldCls(errors.cvc), "font-mono")} />
                  {errors.cvc && <p className="text-[11px] text-error">{errors.cvc}</p>}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-error/20 bg-error/5 px-3 py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-error shrink-0 mt-0.5" />
                  <p className="text-xs text-error">{error}</p>
                </div>
              )}

              {/* Test card hint */}
              <p className="text-center text-[10px] text-textDisabled">
                Demo mode · Use card <span className="font-mono text-accent">4242 4242 4242 4242</span> · Any future date & CVC
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-3 border-t border-border px-6 py-4">
            <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
            <button onClick={pay} disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {loading ? "Processing…" : `Pay ${formatCurrency(invoice.total)}`}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );

  return createPortal(<AnimatePresence>{modal}</AnimatePresence>, document.body);
};
