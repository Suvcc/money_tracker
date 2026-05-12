"use client";

import { useMemo, useState, useTransition } from "react";

import {
  confirmParsedReceipt,
  discardParsedReceipt,
  updateParsedReceipt,
} from "@/app/transactions/new/receipt-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";
import type {
  ReceiptPreviewItem,
  TransactionCategoryOption,
  TransactionType,
} from "@/lib/types/finance";

type ReceiptReviewModalProps = {
  categories: TransactionCategoryOption[];
  isOpen: boolean;
  onClose: () => void;
  onReceiptsChange: React.Dispatch<React.SetStateAction<ReceiptPreviewItem[]>>;
  receipts: ReceiptPreviewItem[];
};

type ReceiptDraft = {
  amount: string;
  categoryId: string;
  currency: string;
  merchantName: string;
  note: string;
  transactionDate: string;
  transactionTime: string;
  type: TransactionType;
};

export function ReceiptReviewModal({
  categories,
  isOpen,
  onClose,
  onReceiptsChange,
  receipts,
}: ReceiptReviewModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const expenseReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.type === "expense"),
    [receipts],
  );
  const incomeReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.type === "income"),
    [receipts],
  );

  const expenseTotal = expenseReceipts.reduce(
    (total, receipt) => total + receipt.amount,
    0,
  );
  const incomeTotal = incomeReceipts.reduce(
    (total, receipt) => total + receipt.amount,
    0,
  );

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setEditingId(null);
    setDraft(null);
    setActionError(null);
    onClose();
  };

  const handleConfirmAll = () => {
    startTransition(async () => {
      setActionError(null);

      for (const receipt of receipts) {
        const result = await confirmParsedReceipt(
          getPayload(receipt, null, null),
        );

        if (result.error) {
          setActionError(
            `Stopped on "${receipt.merchantName}": ${result.error}`,
          );
          return;
        }
      }

      onReceiptsChange([]);
      setDraft(null);
      setEditingId(null);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 sm:items-center sm:px-4 sm:py-6">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-[0_32px_120px_rgba(15,23,42,0.25)] sm:max-h-[92vh] sm:max-w-6xl sm:rounded-[2rem] sm:border sm:border-white/70">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-200 sm:hidden" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Receipt review
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
              Review parsed expenses and income
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Confirm only the entries that should become real transactions. Edit
              parser mistakes inline before saving or confirming.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="w-full sm:w-auto"
              disabled={isPending || receipts.length === 0 || editingId !== null}
              onClick={handleConfirmAll}
              type="button"
            >
              {isPending ? "Confirming..." : `Confirm all (${receipts.length})`}
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleClose}
              type="button"
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6 md:grid-cols-4">
          <SummaryCard
            label="Expenses"
            subvalue={formatSummaryAmount(expenseTotal, expenseReceipts)}
            value={`${expenseReceipts.length} items`}
          />
          <SummaryCard
            label="Income"
            subvalue={formatSummaryAmount(incomeTotal, incomeReceipts)}
            value={`${incomeReceipts.length} items`}
          />
          <SummaryCard
            label="Pending"
            subvalue={`${receipts.filter((item) => item.parserStatus === "failed").length} need extra review`}
            value={`${receipts.length} total`}
          />
          <SummaryCard
            label="Parser mode"
            subvalue="Arabic SMS batch parsing"
            value="Rule-based"
          />
        </div>

        {actionError ? (
          <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:px-6">
            {actionError}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-6 sm:py-5 sm:pb-6">
          {receipts.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
              No pending receipts remain in this review queue.
            </div>
          ) : (
            <div className="space-y-8">
              <ReceiptSection
                categories={categories}
                draft={draft}
                editingId={editingId}
                onConfirm={(receipt) =>
                  handleConfirmReceipt({
                    draft,
                    editingId,
                    onReceiptsChange,
                    receipt,
                    setActionError,
                    setDraft,
                    setEditingId,
                    startTransition,
                  })
                }
                onDiscard={(receiptId) =>
                  handleDiscardReceipt({
                    onReceiptsChange,
                    receiptId,
                    setActionError,
                    setDraft,
                    setEditingId,
                    startTransition,
                  })
                }
                onDraftChange={setDraft}
                onEdit={(receipt) => {
                  setEditingId(receipt.id);
                  setDraft(buildDraft(receipt));
                  setActionError(null);
                }}
                onSave={(receipt) =>
                  handleSaveReceipt({
                    draft,
                    editingId,
                    onReceiptsChange,
                    receipt,
                    setActionError,
                    setDraft,
                    setEditingId,
                    startTransition,
                  })
                }
                pending={isPending}
                receipts={expenseReceipts}
                sectionLabel="Expenses"
                sectionTone="expense"
              />

              <ReceiptSection
                categories={categories}
                draft={draft}
                editingId={editingId}
                onConfirm={(receipt) =>
                  handleConfirmReceipt({
                    draft,
                    editingId,
                    onReceiptsChange,
                    receipt,
                    setActionError,
                    setDraft,
                    setEditingId,
                    startTransition,
                  })
                }
                onDiscard={(receiptId) =>
                  handleDiscardReceipt({
                    onReceiptsChange,
                    receiptId,
                    setActionError,
                    setDraft,
                    setEditingId,
                    startTransition,
                  })
                }
                onDraftChange={setDraft}
                onEdit={(receipt) => {
                  setEditingId(receipt.id);
                  setDraft(buildDraft(receipt));
                  setActionError(null);
                }}
                onSave={(receipt) =>
                  handleSaveReceipt({
                    draft,
                    editingId,
                    onReceiptsChange,
                    receipt,
                    setActionError,
                    setDraft,
                    setEditingId,
                    startTransition,
                  })
                }
                pending={isPending}
                receipts={incomeReceipts}
                sectionLabel="Income"
                sectionTone="income"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ReceiptSectionProps = {
  categories: TransactionCategoryOption[];
  draft: ReceiptDraft | null;
  editingId: string | null;
  onConfirm: (receipt: ReceiptPreviewItem) => void;
  onDiscard: (receiptId: string) => void;
  onDraftChange: React.Dispatch<React.SetStateAction<ReceiptDraft | null>>;
  onEdit: (receipt: ReceiptPreviewItem) => void;
  onSave: (receipt: ReceiptPreviewItem) => void;
  pending: boolean;
  receipts: ReceiptPreviewItem[];
  sectionLabel: string;
  sectionTone: "expense" | "income";
};

function ReceiptSection({
  categories,
  draft,
  editingId,
  onConfirm,
  onDiscard,
  onDraftChange,
  onEdit,
  onSave,
  pending,
  receipts,
  sectionLabel,
  sectionTone,
}: ReceiptSectionProps) {
  if (receipts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-950">{sectionLabel}</h3>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
            sectionTone === "expense"
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700",
          ].join(" ")}
        >
          {receipts.length} items
        </span>
      </div>

      <div className="space-y-4">
        {receipts.map((receipt) => (
          <ReceiptCard
            categories={categories}
            draft={editingId === receipt.id ? draft : null}
            isEditing={editingId === receipt.id}
            key={receipt.id}
            onConfirm={() => onConfirm(receipt)}
            onDiscard={() => onDiscard(receipt.id)}
            onDraftChange={onDraftChange}
            onEdit={() => onEdit(receipt)}
            onSave={() => onSave(receipt)}
            pending={pending}
            receipt={receipt}
          />
        ))}
      </div>
    </section>
  );
}

type ReceiptCardProps = {
  categories: TransactionCategoryOption[];
  draft: ReceiptDraft | null;
  isEditing: boolean;
  onConfirm: () => void;
  onDiscard: () => void;
  onDraftChange: React.Dispatch<React.SetStateAction<ReceiptDraft | null>>;
  onEdit: () => void;
  onSave: () => void;
  pending: boolean;
  receipt: ReceiptPreviewItem;
};

function ReceiptCard({
  categories,
  draft,
  isEditing,
  onConfirm,
  onDiscard,
  onDraftChange,
  onEdit,
  onSave,
  pending,
  receipt,
}: ReceiptCardProps) {
  const localDraft = draft ?? buildDraft(receipt);
  const filteredCategories = categories.filter(
    (category) => category.type === localDraft.type,
  );

  return (
    <article className="rounded-[1.6rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge label={receipt.type} tone={receipt.type} />
            <Badge
              label={receipt.messageFamilyLabel}
              tone={receipt.parserStatus === "failed" ? "warning" : "neutral"}
            />
            <Badge
              label={
                receipt.parserStatus === "failed"
                  ? "Needs review"
                  : `${receipt.parserConfidence}% confidence`
              }
              tone={receipt.parserStatus === "failed" ? "warning" : "neutral"}
            />
          </div>

          <div>
            <h4 className="text-lg font-semibold text-slate-950">
              {receipt.merchantName}
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              {receipt.transactionDate}
              {receipt.transactionTime ? ` at ${receipt.transactionTime}` : ""}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm text-slate-500">Amount</p>
          <p className="text-2xl font-semibold text-slate-950">
            {formatCurrency(receipt.amount, receipt.currency)}
          </p>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`type-${receipt.id}`}
            >
              Type
            </label>
            <Select
              id={`type-${receipt.id}`}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  categoryId: "",
                  type: event.target.value as TransactionType,
                }))
              }
              value={localDraft.type}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`amount-${receipt.id}`}
            >
              Amount
            </label>
            <Input
              id={`amount-${receipt.id}`}
              inputMode="decimal"
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  amount: event.target.value,
                }))
              }
              step="0.01"
              type="number"
              value={localDraft.amount}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`merchant-${receipt.id}`}
            >
              Merchant or sender
            </label>
            <Input
              id={`merchant-${receipt.id}`}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  merchantName: event.target.value,
                }))
              }
              value={localDraft.merchantName}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`currency-${receipt.id}`}
            >
              Currency
            </label>
            <Input
              id={`currency-${receipt.id}`}
              maxLength={3}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  currency: event.target.value.toUpperCase(),
                }))
              }
              value={localDraft.currency}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`date-${receipt.id}`}
            >
              Date
            </label>
            <Input
              id={`date-${receipt.id}`}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  transactionDate: event.target.value,
                }))
              }
              type="date"
              value={localDraft.transactionDate}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`time-${receipt.id}`}
            >
              Time
            </label>
            <Input
              id={`time-${receipt.id}`}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  transactionTime: event.target.value,
                }))
              }
              type="time"
              value={localDraft.transactionTime}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`category-${receipt.id}`}
            >
              Category
            </label>
            <Select
              id={`category-${receipt.id}`}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  categoryId: event.target.value,
                }))
              }
              value={localDraft.categoryId}
            >
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor={`note-${receipt.id}`}
            >
              Note
            </label>
            <Textarea
              id={`note-${receipt.id}`}
              onChange={(event) =>
                onDraftChange((current) => ({
                  ...(current ?? buildDraft(receipt)),
                  note: event.target.value,
                }))
              }
              value={localDraft.note}
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <InfoRow label="Suggested category" value={receipt.suggestedCategoryName} />
          <InfoRow label="Status" value={receipt.parserStatus} />
          <InfoRow label="Currency" value={receipt.currency} />
          <InfoRow
            label="Original amount"
            value={
              receipt.originalAmount && receipt.originalCurrency
                ? formatCurrency(receipt.originalAmount, receipt.originalCurrency)
                : "Already in SAR"
            }
          />
          <InfoRow
            label="Note"
            value={receipt.note && receipt.note.trim().length > 0 ? receipt.note : "None"}
          />
        </div>
      )}

      <details className="mt-5 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          View raw SMS text
        </summary>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-600">
          {receipt.rawText}
        </pre>
      </details>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {isEditing ? (
          <>
            <Button className="w-full sm:w-auto" disabled={pending} onClick={onSave} type="button">
              {pending ? "Saving..." : "Save edits"}
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={onEdit}
              type="button"
              variant="secondary"
            >
              Reset draft
            </Button>
          </>
        ) : (
          <>
            <Button
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={onEdit}
              type="button"
              variant="secondary"
            >
              Edit
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={onDiscard}
              type="button"
              variant="secondary"
            >
              Discard
            </Button>
            <Button className="w-full sm:w-auto" disabled={pending} onClick={onConfirm} type="button">
              Confirm
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

function buildDraft(receipt: ReceiptPreviewItem): ReceiptDraft {
  return {
    amount: receipt.amount.toString(),
    categoryId: receipt.suggestedCategoryId,
    currency: receipt.currency,
    merchantName: receipt.merchantName,
    note: receipt.note ?? "",
    transactionDate: receipt.transactionDate,
    transactionTime: receipt.transactionTime ?? "",
    type: receipt.type,
  };
}

function getPayload(
  receipt: ReceiptPreviewItem,
  draft: ReceiptDraft | null,
  editingId: string | null,
) {
  const activeDraft =
    editingId === receipt.id && draft ? draft : buildDraft(receipt);

  return {
    amount: Number(activeDraft.amount),
    categoryId: activeDraft.categoryId,
    currency: activeDraft.currency,
    merchantName: activeDraft.merchantName,
    note: activeDraft.note,
    parserConfidence: receipt.parserConfidence,
    receiptImportId: receipt.id,
    transactionDate: activeDraft.transactionDate,
    transactionTime: activeDraft.transactionTime,
    type: activeDraft.type,
  };
}

function handleSaveReceipt({
  draft,
  editingId,
  onReceiptsChange,
  receipt,
  setActionError,
  setDraft,
  setEditingId,
  startTransition,
}: {
  draft: ReceiptDraft | null;
  editingId: string | null;
  onReceiptsChange: React.Dispatch<React.SetStateAction<ReceiptPreviewItem[]>>;
  receipt: ReceiptPreviewItem;
  setActionError: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<ReceiptDraft | null>>;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  startTransition: React.TransitionStartFunction;
}) {
  startTransition(async () => {
    setActionError(null);
    const result = await updateParsedReceipt(getPayload(receipt, draft, editingId));

    if (result.error || !result.receipt) {
      setActionError(result.error ?? "Unable to save receipt changes.");
      return;
    }

    onReceiptsChange((current) =>
      current.map((item) => (item.id === receipt.id ? result.receipt! : item)),
    );
    setDraft(null);
    setEditingId(null);
  });
}

function handleConfirmReceipt({
  draft,
  editingId,
  onReceiptsChange,
  receipt,
  setActionError,
  setDraft,
  setEditingId,
  startTransition,
}: {
  draft: ReceiptDraft | null;
  editingId: string | null;
  onReceiptsChange: React.Dispatch<React.SetStateAction<ReceiptPreviewItem[]>>;
  receipt: ReceiptPreviewItem;
  setActionError: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<ReceiptDraft | null>>;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  startTransition: React.TransitionStartFunction;
}) {
  startTransition(async () => {
    setActionError(null);
    const result = await confirmParsedReceipt(getPayload(receipt, draft, editingId));

    if (result.error) {
      setActionError(result.error);
      return;
    }

    onReceiptsChange((current) => current.filter((item) => item.id !== receipt.id));
    setDraft(null);
    setEditingId(null);
  });
}

function handleDiscardReceipt({
  onReceiptsChange,
  receiptId,
  setActionError,
  setDraft,
  setEditingId,
  startTransition,
}: {
  onReceiptsChange: React.Dispatch<React.SetStateAction<ReceiptPreviewItem[]>>;
  receiptId: string;
  setActionError: React.Dispatch<React.SetStateAction<string | null>>;
  setDraft: React.Dispatch<React.SetStateAction<ReceiptDraft | null>>;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  startTransition: React.TransitionStartFunction;
}) {
  startTransition(async () => {
    setActionError(null);
    const result = await discardParsedReceipt(receiptId);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    onReceiptsChange((current) => current.filter((item) => item.id !== receiptId));
    setDraft(null);
    setEditingId(null);
  });
}

function formatSummaryAmount(total: number, receipts: ReceiptPreviewItem[]) {
  if (receipts.length === 0) {
    return "0";
  }

  return formatCurrency(total, receipts[0].currency);
}

function SummaryCard({
  label,
  subvalue,
  value,
}: {
  label: string;
  subvalue: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subvalue}</p>
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "expense" | "income" | "neutral" | "warning";
}) {
  const className = {
    expense: "bg-rose-100 text-rose-700",
    income: "bg-emerald-100 text-emerald-700",
    neutral: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-800",
  }[tone];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}
    >
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}
