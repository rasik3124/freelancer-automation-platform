import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Invoice, InvoiceStatus, STATUS_FILTER_OPTIONS, formatCurrency, isOverdue } from "../../types/invoice";
import { InvoiceList } from "../../components/invoices/InvoiceList";
import { InvoiceDetailsModal } from "../../components/invoices/InvoiceDetailsModal";
import { PaymentModal } from "../../components/invoices/PaymentModal";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── InvoicesPage ─────────────────────────────────────────────────────────────

/**
 * InvoicesPage — /dashboard/client/invoices
 *
 * State:
 *   invoices      — from GET /api/invoices
 *   statusFilter  — pill filter
 *   view          — grid | table
 *   selectedId    — opens InvoiceDetailsModal
 *   payInvoiceId  — opens PaymentModal directly (from quick-action)
 */
export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices]       = useState<Invoice[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [view, setView]               = useState<"grid" | "table">("grid");
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    setIsLoading(true); setFetchError(null);
    try {
      const res = await api.get<{ data: Invoice[] }>("/api/invoices");
      setInvoices(res.data.data);
    } catch {
      setFetchError("Could not load invoices. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // ── Client-side filter ─────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    statusFilter === "all" ? invoices : invoices.filter(inv => inv.status === statusFilter),
    [invoices, statusFilter]
  );

  // ── Update single invoice in-place ─────────────────────────────────────────
  const handleUpdated = (updated: Invoice) =>
    setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));

  // ── Mark as paid (quick-action from card, no payment form) ─────────────────
  const handleMarkPaid = async (id: string) => {
    try {
      const res = await api.patch<{ data: Invoice }>(`/api/invoices/${id}`, {
        status: "paid", paidAt: new Date().toISOString(),
      });
      handleUpdated(res.data.data);
    } catch { /* silent */ }
  };

  // ── Download (from card quick action) ─────────────────────────────────────
  const handleDownload = (inv: Invoice) => {
    const html = `<html><head><title>${inv.invoiceNumber}</title></head><body><h1>${inv.invoiceNumber}</h1><p>Total: ${formatCurrency(inv.total)}</p></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  // ── Stats bar ──────────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    outstanding: invoices.filter(i => i.status !== "paid" && i.status !== "draft").reduce((s, i) => s + i.total, 0),
    paid:        invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0),
    overdue:     invoices.filter(i => isOverdue(i.dueDate, i.status)).length,
  }), [invoices]);

  const payInvoice = payInvoiceId ? invoices.find(inv => inv.id === payInvoiceId) : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="font-display text-2xl font-bold text-textPrimary">Invoices</h2>
          <p className="text-sm text-textMuted">Track and pay invoices from your freelancers.</p>
        </div>

        {/* Financial summary strip */}
        {!isLoading && (
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled">Outstanding</p>
              <p className="text-base font-black text-yellow-400">{formatCurrency(totals.outstanding)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled">Total Paid</p>
              <p className="text-base font-black text-success">{formatCurrency(totals.paid)}</p>
            </div>
            {totals.overdue > 0 && (
              <div className="rounded-xl border border-error/30 bg-error/5 px-3 py-1.5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-error">Overdue</p>
                <p className="text-sm font-black text-error">{totals.overdue}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-center justify-between rounded-2xl border border-error/20 bg-error/5 px-5 py-4">
          <p className="text-sm text-error">{fetchError}</p>
          <button onClick={fetchInvoices} className="rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/20 transition-colors">Retry</button>
        </div>
      )}

      {/* Invoice list */}
      <InvoiceList
        invoices={filtered}
        isLoading={isLoading}
        view={view}
        onViewChange={setView}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onView={setSelectedId}
        onPay={setPayInvoiceId}
        onMarkPaid={handleMarkPaid}
        onDownload={handleDownload}
      />

      {/* Details drawer */}
      <InvoiceDetailsModal
        invoiceId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={handleUpdated}
      />

      {/* Direct pay modal (from card quick-action) */}
      {payInvoice && (
        <PaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoiceId(null)}
          onPaid={(updated) => { handleUpdated(updated); setPayInvoiceId(null); }}
        />
      )}
    </div>
  );
};
