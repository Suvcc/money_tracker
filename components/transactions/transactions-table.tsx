"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteTransactions } from "@/app/transactions/actions";
import { EmptyStatePanel } from "@/components/dashboard/empty-state-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import type { TransactionListItem } from "@/lib/types/finance";

type TransactionsTableProps = {
  currency: string;
  transactions: TransactionListItem[];
};

export function TransactionsTable({
  currency,
  transactions,
}: TransactionsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    error?: string;
    success?: string;
  }>({});
  const [isPending, startTransition] = useTransition();

  const allIds = useMemo(
    () => transactions.map((transaction) => transaction.id),
    [transactions],
  );
  const allSelected = transactions.length > 0 && selectedIds.length === transactions.length;

  if (transactions.length === 0) {
    return (
      <EmptyStatePanel
        title="No transactions found"
        description="Create your first transaction or relax the filters to show matching entries."
      />
    );
  }

  const toggleSelection = (transactionId: string) => {
    setSelectedIds((current) =>
      current.includes(transactionId)
        ? current.filter((id) => id !== transactionId)
        : [...current, transactionId],
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === transactions.length ? [] : allIds,
    );
  };

  const handleDelete = (transactionIds: string[], label: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete ${label}? This removes it from your transaction history.`)
    ) {
      return;
    }

    startTransition(async () => {
      setFeedback({});
      const result = await deleteTransactions({ transactionIds });

      if (result.error) {
        setFeedback({ error: result.error });
        return;
      }

      setSelectedIds((current) =>
        current.filter((id) => !transactionIds.includes(id)),
      );
      setFeedback({
        success:
          result.deletedCount === 1
            ? "Transaction deleted."
            : `${result.deletedCount ?? transactionIds.length} transactions deleted.`,
      });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : `${transactions.length} visible transactions`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Delete one row, the selected rows, or every visible row at once.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="w-full sm:w-auto"
            disabled={isPending || selectedIds.length === 0}
            onClick={() =>
              handleDelete(
                selectedIds,
                selectedIds.length === 1
                  ? "the selected transaction"
                  : `${selectedIds.length} selected transactions`,
              )
            }
            type="button"
            variant="secondary"
          >
            {isPending ? "Deleting..." : `Delete selected (${selectedIds.length})`}
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={isPending || transactions.length === 0}
            onClick={() =>
              handleDelete(
                allIds,
                transactions.length === 1
                  ? "the visible transaction"
                  : `all ${transactions.length} visible transactions`,
              )
            }
            type="button"
          >
            {isPending ? "Deleting..." : `Delete all (${transactions.length})`}
          </Button>
        </div>
      </div>

      {feedback.error ? (
        <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {feedback.error}
        </div>
      ) : null}

      {feedback.success ? (
        <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {feedback.success}
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        <label className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            checked={allSelected}
            className="h-4 w-4 rounded border-slate-300 text-slate-950"
            onChange={toggleSelectAll}
            type="checkbox"
          />
          Select all visible transactions
        </label>

        {transactions.map((transaction) => (
          <article
            key={transaction.id}
            className="rounded-[1.45rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-start gap-3">
                <input
                  checked={selectedIds.includes(transaction.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950"
                  onChange={() => toggleSelection(transaction.id)}
                  type="checkbox"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {transaction.merchantName ?? "Untitled entry"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatShortDate(transaction.transactionDate)}
                  </p>
                </div>
              </label>
              <p className="text-right text-base font-semibold text-slate-950">
                {formatCurrency(transaction.amount, currency)}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={transaction.type === "expense" ? "expense" : "income"}>
                {transaction.type}
              </Badge>
              <Badge variant="outline">{transaction.sourceLabel}</Badge>
            </div>

            <div className="mt-4 grid gap-3">
              <MobileInfoRow
                label="Category"
                value={transaction.categoryName ?? "Uncategorized"}
              />
              {transaction.note ? (
                <MobileInfoRow label="Note" value={transaction.note} />
              ) : null}
            </div>

            <div className="mt-4">
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() => handleDelete([transaction.id], "this transaction")}
                type="button"
                variant="secondary"
              >
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="px-4 pb-1">
                <label className="flex items-center gap-2">
                  <input
                    checked={allSelected}
                    className="h-4 w-4 rounded border-slate-300 text-slate-950"
                    onChange={toggleSelectAll}
                    type="checkbox"
                  />
                  <span>Select</span>
                </label>
              </th>
              <th className="px-4 pb-1">Date</th>
              <th className="px-4 pb-1">Merchant</th>
              <th className="px-4 pb-1">Category</th>
              <th className="px-4 pb-1">Type</th>
              <th className="px-4 pb-1">Source</th>
              <th className="px-4 pb-1 text-right">Amount</th>
              <th className="px-4 pb-1 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="rounded-[1.4rem] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
              >
                <td className="rounded-l-[1.4rem] px-4 py-4 text-sm text-slate-600">
                  <input
                    checked={selectedIds.includes(transaction.id)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-950"
                    onChange={() => toggleSelection(transaction.id)}
                    type="checkbox"
                  />
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatShortDate(transaction.transactionDate)}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {transaction.merchantName ?? "Untitled entry"}
                    </p>
                    {transaction.note ? (
                      <p className="text-xs text-slate-500">{transaction.note}</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">
                  {transaction.categoryName ?? "Uncategorized"}
                </td>
                <td className="px-4 py-4">
                  <Badge
                    variant={transaction.type === "expense" ? "expense" : "income"}
                  >
                    {transaction.type}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline">{transaction.sourceLabel}</Badge>
                </td>
                <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                  {formatCurrency(transaction.amount, currency)}
                </td>
                <td className="rounded-r-[1.4rem] px-4 py-4 text-right">
                  <Button
                    disabled={isPending}
                    onClick={() => handleDelete([transaction.id], "this transaction")}
                    type="button"
                    variant="secondary"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}
