import React from "react";
import { motion } from "motion/react";
import { Eye, Download, CreditCard, CheckCircle2, AlertOctagon, Clock } from "lucide-react";
import {
  Invoice, STATUS_META, formatCurrency, formatDate, isDueSoon, isOverdue, avatarGrad,
} from "../../types/invoice";
import { cn } from "../../lib/utils";

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: Invoice["status"] }> = ({ status }) => {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", m.bg, m.text, m.border)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
};

// ─── Quick action buttons config ──────────────────────────────────────────────
const actions = (inv: Invoice, onView: () => void, onPay: () => void, onMarkPaid: () => void, onDownload: () => void) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    <button onClick={onView} title="View"
      className="flex items-center gap-1 rounded-lg bg-elevated border border-border px-2.5 py-1.5 text-[10px] font-bold text-textMuted hover:text-textPrimary hover:border-accent/30 transition-all">
      <Eye className="h-3 w-3" /> View
    </button>
    <button onClick={onDownload} title="Download"
      className="flex items-center gap-1 rounded-lg bg-elevated border border-border px-2.5 py-1.5 text-[10px] font-bold text-textMuted hover:text-textPrimary transition-all">
      <Download className="h-3 w-3" />
    </button>
    {(inv.status === "sent" || inv.status === "overdue") && (
      <button onClick={onPay}
        className={cn("flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-all",
          inv.status === "overdue"
            ? "bg-error/10 border-error/30 text-error hover:bg-error/20"
            : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20")}>
        <CreditCard className="h-3 w-3" /> Pay Now
      </button>
    )}
    {inv.status === "sent" && (
      <button onClick={onMarkPaid}
        className="flex items-center gap-1 rounded-lg bg-success/10 border border-success/30 px-2.5 py-1.5 text-[10px] font-bold text-success hover:bg-success/20 transition-all">
        <CheckCircle2 className="h-3 w-3" /> Mark Paid
      </button>
    )}
  </div>
);

// ─── Grid Card ────────────────────────────────────────────────────────────────

interface InvoiceCardProps {
  invoice: Invoice;
  index: number;
  view: "grid" | "table";
  onView: (id: string) => void;
  onPay: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDownload: (inv: Invoice) => void;
}

const GridCard: React.FC<Omit<InvoiceCardProps, "view">> = ({ invoice: inv, index, onView, onPay, onMarkPaid, onDownload }) => {
  const overdue = isOverdue(inv.dueDate, inv.status);
  const soon = isDueSoon(inv.dueDate);
  const grad = avatarGrad(inv.freelancerId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.22 }}
      className={cn("group flex flex-col rounded-2xl border transition-all duration-200 hover:shadow-xl cursor-pointer",
        inv.status === "overdue" ? "border-error/30 hover:border-error/50 hover:shadow-error/5"
          : "border-border hover:border-accent/20 hover:shadow-accent/5")}
      style={{ backgroundColor: "#111111" }}
      onClick={() => onView(inv.id)}
    >
      {/* Top bar */}
      <div className={cn("h-1 w-full rounded-t-2xl", STATUS_META[inv.status].dot)} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled">{inv.invoiceNumber}</p>
            <p className="text-sm font-bold text-textPrimary mt-0.5">{inv.projectName}</p>
          </div>
          <StatusBadge status={inv.status} />
        </div>

        {/* Freelancer */}
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-black text-white shrink-0", grad)}>
            {inv.freelancerAvatarInitials}
          </div>
          <span className="text-sm text-textMuted">{inv.freelancerName}</span>
        </div>

        {/* Amount + Due */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-textDisabled">Total</p>
            <p className="text-xl font-black text-textPrimary">{formatCurrency(inv.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-textDisabled">Due</p>
            <p className={cn("text-xs font-bold flex items-center gap-1",
              overdue ? "text-error" : soon ? "text-yellow-400" : "text-textMuted")}>
              {(overdue || soon) && <Clock className="h-3 w-3" />}
              {formatDate(inv.dueDate)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-1 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
          {actions(inv, () => onView(inv.id), () => onPay(inv.id), () => onMarkPaid(inv.id), () => onDownload(inv))}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Table Row ────────────────────────────────────────────────────────────────

const TableRow: React.FC<Omit<InvoiceCardProps, "view">> = ({ invoice: inv, index, onView, onPay, onMarkPaid, onDownload }) => {
  const overdue = isOverdue(inv.dueDate, inv.status);
  const soon    = isDueSoon(inv.dueDate);
  const grad    = avatarGrad(inv.freelancerId);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }}
      className="group border-b border-border/50 transition-colors hover:bg-elevated/30 cursor-pointer last:border-0"
      onClick={() => onView(inv.id)}
    >
      <td className="px-4 py-3.5">
        <p className="text-xs font-bold text-accent">{inv.invoiceNumber}</p>
        <p className="text-[10px] text-textDisabled">{inv.projectName}</p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[9px] font-black text-white", grad)}>{inv.freelancerAvatarInitials}</div>
          <span className="text-xs text-textMuted">{inv.freelancerName}</span>
        </div>
      </td>
      <td className="px-4 py-3.5"><p className="text-sm font-black text-textPrimary">{formatCurrency(inv.total)}</p></td>
      <td className="px-4 py-3.5">
        <p className={cn("text-xs font-semibold flex items-center gap-1",
          overdue ? "text-error" : soon ? "text-yellow-400" : "text-textMuted")}>
          {(overdue || soon) && <Clock className="h-3 w-3" />}{formatDate(inv.dueDate)}
        </p>
      </td>
      <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
        {actions(inv, () => onView(inv.id), () => onPay(inv.id), () => onMarkPaid(inv.id), () => onDownload(inv))}
      </td>
    </motion.tr>
  );
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
export const InvoiceGridSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-border" style={{ backgroundColor: "#111111" }}>
    <div className="h-1 rounded-t-2xl bg-elevated" />
    <div className="p-5 space-y-4">
      <div className="flex justify-between"><div className="h-3 w-24 rounded-full bg-elevated" /><div className="h-5 w-16 rounded-full bg-elevated" /></div>
      <div className="h-3 w-32 rounded-full bg-elevated" />
      <div className="flex justify-between"><div className="h-6 w-20 rounded-full bg-elevated" /><div className="h-3 w-16 rounded-full bg-elevated" /></div>
    </div>
  </div>
);

export const InvoiceRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-border/50">
    {[100, 120, 80, 90, 70, 140].map((w, i) => (
      <td key={i} className="px-4 py-3.5"><div className="h-3 rounded-full bg-elevated" style={{ width: w }} /></td>
    ))}
  </tr>
);

// ─── Exports ──────────────────────────────────────────────────────────────────
export const InvoiceCard: React.FC<InvoiceCardProps> = (props) => {
  if (props.view === "grid") return <GridCard {...props} />;
  return null;
};

export const InvoiceTableRow: React.FC<Omit<InvoiceCardProps, "view">> = (props) => <TableRow {...props} />;
