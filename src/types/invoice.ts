// ─── Shared Invoice Types ─────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface InvoiceLineItem {
  id: string; description: string; rate: number; quantity: number;
}

export interface Invoice {
  id: string; clientId: string; invoiceNumber: string;
  freelancerId: string; freelancerName: string; freelancerAvatarInitials: string;
  projectId: string; projectName: string;
  lineItems: InvoiceLineItem[];
  subtotal: number; tax: number; total: number;
  status: InvoiceStatus;
  issueDate: string; dueDate: string;
  paidAt?: string; paymentMethod?: string; transactionId?: string;
  notes?: string; createdAt: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const STATUS_META: Record<InvoiceStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  draft:   { label: "Draft",   bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30",  dot: "bg-slate-500" },
  sent:    { label: "Sent",    bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-400" },
  paid:    { label: "Paid",    bg: "bg-success/10",    text: "text-success",    border: "border-success/30",    dot: "bg-success" },
  overdue: { label: "Overdue", bg: "bg-error/10",      text: "text-error",      border: "border-error/30",      dot: "bg-error" },
};

export const STATUS_FILTER_OPTIONS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all",     label: "All Invoices" },
  { value: "draft",   label: "Draft" },
  { value: "sent",    label: "Sent" },
  { value: "paid",    label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
}


export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isDueSoon(dueDate: string): boolean {
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 86400000;
}

export function isOverdue(dueDate: string, status: InvoiceStatus): boolean {
  return status !== "paid" && new Date(dueDate) < new Date();
}

export const AVATAR_GRADIENTS = [
  "from-accent to-violet-600", "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-400", "from-orange-500 to-pink-500",
];
export const avatarGrad = (id: string) => AVATAR_GRADIENTS[id.charCodeAt(id.length - 1) % AVATAR_GRADIENTS.length];
