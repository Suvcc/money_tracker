"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { parseReceiptBatch } from "@/app/transactions/new/receipt-actions";
import { ReceiptReviewModal } from "@/components/transactions/receipt-review-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  ReceiptBatchParseState,
  ReceiptPreviewItem,
  TransactionCategoryOption,
} from "@/lib/types/finance";

const initialState: ReceiptBatchParseState = {
  receipts: [],
};

type ReceiptImportPanelProps = {
  categories: TransactionCategoryOption[];
  pendingReceipts: ReceiptPreviewItem[];
};

function ParseButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="min-w-[170px]" disabled={pending} type="submit">
      {pending ? "Parsing..." : "Parse receipts"}
    </Button>
  );
}

export function ReceiptImportPanel({
  categories,
  pendingReceipts,
}: ReceiptImportPanelProps) {
  const [state, formAction] = useActionState(parseReceiptBatch, initialState);
  const [reviewReceipts, setReviewReceipts] =
    useState<ReceiptPreviewItem[]>(pendingReceipts);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setReviewReceipts(pendingReceipts);
  }, [pendingReceipts]);

  useEffect(() => {
    if (state.receipts.length > 0) {
      setReviewReceipts(state.receipts);
      setIsModalOpen(true);
    }
  }, [state.receipts]);

  return (
    <>
      <div className="space-y-5">
        {pendingReceipts.length > 0 ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Pending receipt review</p>
            <p className="mt-1 leading-6 text-amber-800">
              You still have {pendingReceipts.length} parsed receipt
              {pendingReceipts.length === 1 ? "" : "s"} that have not been
              confirmed or discarded yet.
            </p>
            <div className="mt-3">
              <Button onClick={() => setIsModalOpen(true)} type="button" variant="secondary">
                Open review modal
              </Button>
            </div>
          </div>
        ) : null}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-700"
              htmlFor="receiptText"
            >
              Receipt messages
            </label>
            <Textarea
              className="min-h-[240px]"
              dir="auto"
              id="receiptText"
              name="receiptText"
              placeholder="Paste one or more bank SMS receipts here..."
              required
            />
            <p className="text-sm leading-6 text-slate-500">
              The parser looks for known Arabic purchase and transfer message
              patterns, then opens a review popup before anything is added to
              your transaction history.
            </p>
          </div>

          {state.error ? (
            <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Paste multiple receipts at once. You will be able to edit each
              parsed entry individually before confirmation.
            </p>
            <ParseButton />
          </div>
        </form>
      </div>

      <ReceiptReviewModal
        categories={categories}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReceiptsChange={setReviewReceipts}
        receipts={reviewReceipts}
      />
    </>
  );
}
