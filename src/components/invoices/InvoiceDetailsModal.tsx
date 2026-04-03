import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Loader2, Download, CreditCard, CheckCircle2,
  FileText, Calendar, Hash, Receipt, Flag,
} from "lucide-react";
import { Invoice } from "../../types/invoice";
import { StatusBadge } from "./InvoiceCard";
import { formatCurrency, formatDate, avatarGrad } from "../../types/invoice";
import { PaymentModal } from "./PaymentModal";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceDetailsModalProps {
  invoiceId: string | null;
  onClose: () => void;
  onUpdated: (inv: Invoice) => void;
}

// ─── Total row ────────────────────────────────────────────────────────────────

const TotalRow: React.FC<{ label: string; value: string; highlight?: boolean; muted?: boolean }> = ({ label, value, highlight, muted }) => (
  <div className={cn("flex items-center justify-between py-2", highlight && "border-t-2 border-accent/30 mt-1 pt-3")}>
    <span className={cn("text-sm", muted ? "text-textDisabled" : highlight ? "font-black text-textPrimary" : "text-textMuted")}>{label}</span>
    <span className={cn("font-bold", highlight ? "text-xl text-accent" : muted ? "text-textDisabled text-xs" : "text-sm text-textPrimary")}>{value}</span>
  </div>
);

// ─── InvoiceDetailsModal ──────────────────────────────────────────────────────

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoiceId, onClose, onUpdated }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [disputing, setDisputing]    = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!invoiceId) return;
    setIsLoading(true); setError(null);
    api.get<{ data: Invoice }>(`/api/invoices/${invoiceId}`)
      .then(r => setInvoice(r.data.data))
      .catch(() => setError("Could not load invoice."))
      .finally(() => setIsLoading(false));
  }, [invoiceId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !showPayment) onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose, showPayment]);

  const handlePaid = (updated: Invoice) => { setInvoice(updated); onUpdated(updated); setShowPayment(false); };

  const markPaid = async () => {
    if (!invoice) return;
    setMarkingPaid(true); setActionError("");
    try {
      const res = await api.patch<{ data: Invoice }>(`/api/invoices/${invoice.id}`, { status: "paid", paidAt: new Date().toISOString() });
      setInvoice(res.data.data); onUpdated(res.data.data);
    } catch { setActionError("Could not mark as paid."); }
    finally { setMarkingPaid(false); }
  };

  // Generate a simple in-browser "PDF" (opens print dialog)
  const downloadPDF = () => {
    if (!invoice) return;
    const html = `
      <html><head><title>${invoice.invoiceNumber}</title>
      <style>body{font-family:sans-serif;padding:40px;color:#111}
      h1{font-size:28px;border-bottom:2px solid #eee;padding-bottom:12px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th{background:#f5f5f5;padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
      td{padding:8px 12px;border-bottom:1px solid #eee;font-size:14px}
      .total{font-weight:bold;font-size:18px;color:#6d28d9}</style></head>
      <body>
      <h1>${invoice.invoiceNumber}</h1>
      <p><strong>From:</strong> ${invoice.freelancerName}</p>
      <p><strong>Project:</strong> ${invoice.projectName}</p>
      <p><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
      <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
      <table>
        <thead><tr><th>Description</th><th>Rate</th><th>Qty</th><th>Subtotal</th></tr></thead>
        <tbody>${invoice.lineItems.map(li => `
          <tr><td>${li.description}</td><td>${formatCurrency(li.rate)}</td><td>${li.quantity}</td><td>${formatCurrency(li.rate * li.quantity)}</td></tr>
        `).join("")}</tbody>
      </table>
      <div style="text-align:right;margin-top:20px">
        <p>Subtotal: ${formatCurrency(invoice.subtotal)}</p>
        <p>Tax (8%): ${formatCurrency(invoice.tax)}</p>
        <p class="total">Total: ${formatCurrency(invoice.total)}</p>
      </div>
      ${invoice.notes ? `<p style="margin-top:20px;color:#666;font-size:13px">${invoice.notes}</p>` : ""}
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const grad = invoice ? avatarGrad(invoice.freelancerId) : "";

  const panel = (
    <AnimatePresence>
      {invoiceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border shadow-2xl"
            style={{ backgroundColor: "#0d0d0d" }} role="dialog" aria-modal>

            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-6 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-accent" />
                <h3 className="font-display text-base font-bold text-textPrimary">
                  {invoice?.invoiceNumber ?? "Invoice Details"}
                </h3>
                {invoice && <StatusBadge status={invoice.status} />}
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"><X className="h-4 w-4" /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
              ) : error ? (
                <p className="text-center text-sm text-error py-10">{error}</p>
              ) : invoice ? (
                <div className="p-6 space-y-8">
                  {/* 1. Header info */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    {[
                      { icon: Hash, label: "Invoice #",    value: invoice.invoiceNumber },
                      { icon: FileText, label: "Project",  value: invoice.projectName },
                      { icon: Calendar, label: "Issued",   value: formatDate(invoice.issueDate) },
                      { icon: Calendar, label: "Due Date", value: formatDate(invoice.dueDate) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled flex items-center gap-1">
                          <Icon className="h-2.5 w-2.5" />{label}
                        </p>
                        <p className="text-sm font-semibold text-textPrimary">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Freelancer card */}
                  <div className="flex items-center gap-3 rounded-xl border border-border p-4" style={{ backgroundColor: "#111111" }}>
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-black text-white", grad)}>
                      {invoice.freelancerAvatarInitials}
                    </div>
                    <div>
                      <p className="font-bold text-textPrimary">{invoice.freelancerName}</p>
                      <p className="text-xs text-textDisabled">Freelancer</p>
                    </div>
                    <span className="ml-auto font-display text-2xl font-black text-accent">{formatCurrency(invoice.total)}</span>
                  </div>

                  {/* 2. Line items */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-textDisabled">Line Items</h4>
                    <div className="overflow-hidden rounded-xl border border-border" style={{ backgroundColor: "#111111" }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            {["Description","Rate","Qty","Total"].map(h => (
                              <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-textDisabled">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lineItems.map((li, i) => (
                            <tr key={li.id} className={cn("border-b border-border/50 last:border-0", i % 2 === 0 ? "" : "bg-elevated/20")}>
                              <td className="px-4 py-3 text-xs text-textPrimary">{li.description}</td>
                              <td className="px-4 py-3 text-xs text-textMuted whitespace-nowrap">{formatCurrency(li.rate)}</td>
                              <td className="px-4 py-3 text-xs text-textMuted">{li.quantity}</td>
                              <td className="px-4 py-3 text-xs font-bold text-textPrimary whitespace-nowrap">{formatCurrency(li.rate * li.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. Totals */}
                  <div className="rounded-xl border border-border p-5" style={{ backgroundColor: "#111111" }}>
                    <TotalRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
                    <TotalRow label="Tax (8%)" value={formatCurrency(invoice.tax)} muted />
                    <TotalRow label="Total Due" value={formatCurrency(invoice.total)} highlight />
                  </div>

                  {/* 4. Payment info (if paid) */}
                  {invoice.status === "paid" && (
                    <div className="rounded-xl border border-success/20 bg-success/5 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <p className="font-bold text-success text-sm">Payment Confirmed</p>
                      </div>
                      <div className="space-y-1.5 text-xs text-textMuted">
                        {invoice.paidAt      && <p>Paid on <strong className="text-textPrimary">{formatDate(invoice.paidAt)}</strong></p>}
                        {invoice.paymentMethod && <p>Method: <strong className="text-textPrimary">{invoice.paymentMethod}</strong></p>}
                        {invoice.transactionId && <p className="font-mono text-[10px] text-textDisabled break-all">Txn: {invoice.transactionId}</p>}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled mb-1">Notes</p>
                      <p className="text-xs text-textMuted">{invoice.notes}</p>
                    </div>
                  )}

                  {/* Dispute form */}
                  {disputing && (
                    <div className="rounded-xl border border-error/20 bg-error/5 p-4 space-y-3">
                      <p className="text-sm font-bold text-error flex items-center gap-2"><Flag className="h-3.5 w-3.5" /> Dispute Invoice</p>
                      <textarea rows={3} value={disputeNote} onChange={e => setDisputeNote(e.target.value)}
                        placeholder="Describe the issue with this invoice…"
                        className="w-full resize-none rounded-xl border border-error/30 bg-surface px-3 py-2 text-xs text-textPrimary placeholder-textDisabled focus:outline-none focus:ring-1 focus:ring-error/50 transition-all" />
                      <div className="flex gap-2">
                        <button onClick={() => setDisputing(false)} className="flex-1 rounded-xl border border-border px-3 py-2 text-xs font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
                        <button className="flex-1 rounded-xl bg-error px-3 py-2 text-xs font-bold text-white hover:bg-error/80 transition-colors">Submit Dispute</button>
                      </div>
                    </div>
                  )}

                  {actionError && <p className="text-xs text-error">{actionError}</p>}
                </div>
              ) : null}
            </div>

            {/* Action footer */}
            {invoice && !isLoading && (
              <div className="border-t border-border p-4 flex flex-wrap gap-2 shrink-0">
                <button onClick={downloadPDF}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </button>
                {(invoice.status === "sent" || invoice.status === "overdue") && (
                  <button onClick={() => setShowPayment(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent/90 shadow-glow transition-colors">
                    <CreditCard className="h-3.5 w-3.5" /> Pay Now
                  </button>
                )}
                {invoice.status === "sent" && (
                  <button onClick={markPaid} disabled={markingPaid}
                    className="flex items-center gap-1.5 rounded-xl bg-success/10 border border-success/30 px-3 py-2 text-xs font-bold text-success hover:bg-success/20 transition-colors disabled:opacity-50">
                    {markingPaid ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Mark as Paid
                  </button>
                )}
                {invoice.status !== "paid" && !disputing && (
                  <button onClick={() => setDisputing(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-error/10 border border-error/30 px-3 py-2 text-xs font-bold text-error hover:bg-error/20 transition-colors ml-auto">
                    <Flag className="h-3.5 w-3.5" /> Dispute
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(
    <>
      {panel}
      {invoice && showPayment && (
        <PaymentModal invoice={invoice} onClose={() => setShowPayment(false)} onPaid={handlePaid} />
      )}
    </>,
    document.body
  );
};
