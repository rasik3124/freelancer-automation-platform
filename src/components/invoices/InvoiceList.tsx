import React from "react";
import { LayoutGrid, Table2, FileText } from "lucide-react";
import { Invoice, InvoiceStatus, STATUS_FILTER_OPTIONS } from "../../types/invoice";
import { InvoiceCard, InvoiceTableRow, InvoiceGridSkeleton, InvoiceRowSkeleton } from "./InvoiceCard";
import { cn } from "../../lib/utils";

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
  view: "grid" | "table";
  onViewChange: (v: "grid" | "table") => void;
  statusFilter: InvoiceStatus | "all";
  onStatusFilter: (s: InvoiceStatus | "all") => void;
  onView: (id: string) => void;
  onPay: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDownload: (inv: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices, isLoading, view, onViewChange, statusFilter, onStatusFilter,
  onView, onPay, onMarkPaid, onDownload,
}) => {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => onStatusFilter(o.value)}
              className={cn("rounded-full border px-3 py-1 text-[11px] font-bold transition-all",
                statusFilter === o.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-textDisabled hover:border-accent/30 hover:text-textMuted")}>
              {o.label}
            </button>
          ))}
        </div>

        {/* Count + toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-textMuted shrink-0">
            {isLoading ? "Loading…" : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {(["grid","table"] as const).map((v) => (
              <button key={v} onClick={() => onViewChange(v)} id={`invoice-${v}-btn`}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors",
                  view === v ? "bg-accent text-white" : "text-textMuted hover:text-textPrimary")}>
                {v === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
                {v === "grid" ? "Grid" : "Table"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <InvoiceGridSkeleton key={i} />)
            : invoices.length === 0 ? <EmptyState /> : invoices.map((inv, i) => (
                <InvoiceCard key={inv.id} invoice={inv} index={i} view="grid"
                  onView={onView} onPay={onPay} onMarkPaid={onMarkPaid} onDownload={onDownload} />
              ))}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="overflow-hidden rounded-2xl border border-border" style={{ backgroundColor: "#111111" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Invoice #","Freelancer","Amount","Due Date","Status","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-textDisabled">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <InvoiceRowSkeleton key={i} />)
                : invoices.length === 0
                  ? <tr><td colSpan={6} className="py-20"><EmptyState /></td></tr>
                  : invoices.map((inv, i) => (
                      <InvoiceTableRow key={inv.id} invoice={inv} index={i}
                        onView={onView} onPay={onPay} onMarkPaid={onMarkPaid} onDownload={onDownload} />
                    ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
      <FileText className="h-7 w-7 text-accent" />
    </div>
    <div className="space-y-1">
      <h4 className="font-display text-base font-bold text-textPrimary">No invoices yet</h4>
      <p className="text-sm text-textMuted max-w-xs">Invoices from freelancers will appear here.</p>
    </div>
  </div>
);
