import { EmptyStatePanel } from "@/components/dashboard/empty-state-panel";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import type { RecentTransactionItem } from "@/lib/types/finance";

type RecentTransactionsListProps = {
  currency: string;
  transactions: RecentTransactionItem[];
};

export function RecentTransactionsList({
  currency,
  transactions,
}: RecentTransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <EmptyStatePanel
        title="No transactions yet"
        description="Confirmed transactions will appear here as soon as they are added or imported."
      />
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <article
          key={transaction.id}
          className="flex flex-col gap-3 rounded-[1.35rem] border border-slate-200/75 bg-white/80 px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {transaction.merchantName ?? transaction.categoryName ?? "Untitled entry"}
              </h3>
              <Badge
                variant={transaction.type === "expense" ? "expense" : "income"}
              >
                {transaction.type}
              </Badge>
              <Badge variant="outline">{transaction.sourceLabel}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {formatShortDate(transaction.transactionDate)}{" "}
              {transaction.categoryName ? `• ${transaction.categoryName}` : ""}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-lg font-semibold text-slate-950">
              {formatCurrency(transaction.amount, currency)}
            </p>
            {transaction.note ? (
              <p className="text-sm text-slate-500">{transaction.note}</p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
