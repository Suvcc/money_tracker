"use client";

import { useState } from "react";

import { ReceiptImportPanel } from "@/components/transactions/receipt-import-panel";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type {
  FinanceProfile,
  ReceiptPreviewItem,
  TransactionCategoryOption,
} from "@/lib/types/finance";

type TransactionEntryTabsProps = {
  categories: TransactionCategoryOption[];
  pendingReceipts: ReceiptPreviewItem[];
  profile: FinanceProfile;
};

export function TransactionEntryTabs({
  categories,
  pendingReceipts,
  profile,
}: TransactionEntryTabsProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "receipt">("manual");

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-3">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <button
              className={buildTabClassName(activeTab === "manual")}
              onClick={() => setActiveTab("manual")}
              type="button"
            >
              Manual entry
            </button>
            <button
              className={buildTabClassName(activeTab === "receipt")}
              onClick={() => setActiveTab("receipt")}
              type="button"
            >
              SMS receipts
            </button>
          </div>
          <div>
            <CardTitle>
              {activeTab === "manual"
                ? "Transaction details"
                : "Import receipt messages"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "manual" ? (
            <TransactionForm categories={categories} />
          ) : (
            <ReceiptImportPanel
              categories={categories}
              pendingReceipts={pendingReceipts}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            {activeTab === "manual" ? "Entry rules" : "Receipt flow"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
          {activeTab === "manual" ? (
            <>
              <p>
                Manual entries are stored as confirmed transactions with source{" "}
                <span className="font-semibold text-slate-900">manual</span>.
              </p>
              <p>
                Currency defaults to your profile currency, currently{" "}
                <span className="font-semibold text-slate-900">
                  {profile.preferredCurrency}
                </span>
                .
              </p>
              <p>
                Categories must match the selected transaction type so expense and
                income reporting stay clean.
              </p>
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Example
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Expense · Food & Drinks ·{" "}
                  {formatCurrency(42.5, profile.preferredCurrency)}
                </p>
              </div>
            </>
          ) : (
            <>
              <p>
                Paste one long block with multiple Arabic SMS receipts. Each
                detected message is stored in{" "}
                <span className="font-semibold text-slate-900">
                  receipt_imports
                </span>{" "}
                before you confirm anything.
              </p>
              <p>
                The parser only suggests fields. Review every expense and income
                item in the popup, edit mistakes, then confirm the entries that
                should become real transactions.
              </p>
              <p>
                Confirmed rows create transactions with source{" "}
                <span className="font-semibold text-slate-900">receipt_text</span>.
                Discarded rows stay out of reporting.
              </p>
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Current queue
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {pendingReceipts.length} pending receipt
                  {pendingReceipts.length === 1 ? "" : "s"} ready for review.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function buildTabClassName(isActive: boolean) {
  return [
    "inline-flex h-11 w-full items-center justify-center rounded-full border px-4 text-sm font-semibold transition sm:w-auto sm:px-5",
    isActive
      ? "border-slate-950 bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  ].join(" ");
}
