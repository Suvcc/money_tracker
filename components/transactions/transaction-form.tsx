"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { createTransaction } from "@/app/transactions/new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  TransactionCategoryOption,
  TransactionFormState,
  TransactionType,
} from "@/lib/types/finance";

const initialState: TransactionFormState = {};

type TransactionFormProps = {
  categories: TransactionCategoryOption[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="min-w-[170px]" disabled={pending} type="submit">
      {pending ? "Saving..." : "Create transaction"}
    </Button>
  );
}

export function TransactionForm({ categories }: TransactionFormProps) {
  const [selectedType, setSelectedType] = useState<TransactionType>("expense");
  const [state, formAction] = useActionState(createTransaction, initialState);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === selectedType),
    [categories, selectedType],
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="type">
            Type
          </label>
          <Select
            defaultValue={selectedType}
            id="type"
            name="type"
            onChange={(event) => setSelectedType(event.target.value as TransactionType)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          {state.fieldErrors?.type ? (
            <p className="text-sm text-rose-600">{state.fieldErrors.type}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="amount">
            Amount
          </label>
          <Input
            id="amount"
            inputMode="decimal"
            min="0"
            name="amount"
            placeholder="0.00"
            required
            step="0.01"
            type="number"
          />
          {state.fieldErrors?.amount ? (
            <p className="text-sm text-rose-600">{state.fieldErrors.amount}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="categoryId"
          >
            Category
          </label>
          <Select defaultValue="" id="categoryId" name="categoryId" required>
            <option disabled value="">
              Select a {selectedType} category
            </option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.categoryId ? (
            <p className="text-sm text-rose-600">{state.fieldErrors.categoryId}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="transactionDate"
          >
            Date
          </label>
          <Input id="transactionDate" name="transactionDate" required type="date" />
          {state.fieldErrors?.transactionDate ? (
            <p className="text-sm text-rose-600">
              {state.fieldErrors.transactionDate}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="merchantName"
          >
            Merchant
          </label>
          <Input
            id="merchantName"
            name="merchantName"
            placeholder="Optional merchant or payee"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="note">
            Note
          </label>
          <Textarea
            id="note"
            name="note"
            placeholder="Optional note for extra context"
          />
        </div>
      </div>

      {state.error ? (
        <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          This will create a confirmed manual transaction immediately and make
          it available to the dashboard and transactions history.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
